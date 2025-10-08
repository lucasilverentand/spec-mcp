import type { EntityType, Plan } from "@spec-mcp/schemas";
import { PlanSchema } from "@spec-mcp/schemas";
import type { PlanDraft, DraftQuestion, DraftTask } from "@spec-mcp/schemas";
import { generateSlug } from "@spec-mcp/utils";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";
import type { CreateDraftResult, SubmitAnswerResult } from "../drafts/types";

/**
 * Draft manager for Plans with two-phase workflow:
 * Phase 1: Main Q&A about the plan
 * Phase 2: Task-by-task Q&A
 */
export class PlanDraftManager extends BaseDraftManager<Omit<Plan, "number">> {
	protected entityType: EntityType = "plan";

	/**
	 * Phase 1: Create draft with main questions
	 */
	async createDraft(
		name: string,
		description?: string,
	): Promise<CreateDraftResult> {
		const draftId = await this.getNextDraftId();
		const slug = generateSlug(name);
		const now = new Date().toISOString();

		const questions: DraftQuestion[] = [
			{
				question: "What is the main goal of this plan?",
				answer: description || null,
			},
			{
				question:
					"Which requirement and criteria does this plan fulfill? (format: req-XXX-slug/crit-XXX)",
				answer: null,
			},
			{
				question: "What is in scope for this plan?",
				answer: null,
			},
			{
				question: "What is explicitly out of scope?",
				answer: null,
			},
			{
				question:
					"List the tasks you want to add (one per line, short descriptions)",
				answer: null,
			},
		];

		const draft: PlanDraft = {
			id: draftId,
			type: "plan",
			name,
			slug,
			questions,
			currentQuestionIndex: description ? 1 : 0,
			created_at: now,
			tasks: [],
			taskTitles: [],
			currentTaskIndex: 0,
		};

		await this.saveDraft(draft);

		const firstUnansweredIdx = description ? 1 : 0;
		const firstQuestion = questions[firstUnansweredIdx];
		if (!firstQuestion) {
			throw new Error("No questions provided");
		}

		return {
			draftId,
			firstQuestion: firstQuestion.question,
			totalQuestions: questions.length,
		};
	}

	/**
	 * Phase 1 & 2: Submit answers
	 * - Phase 1: Answer main questions
	 * - Phase 2: After task list is provided, iterate through each task
	 */
	async submitAnswer(
		draftId: string,
		answer: string,
	): Promise<SubmitAnswerResult> {
		const draft = await this.getDraft(draftId);

		if (!draft || draft.type !== "plan") {
			throw new Error(`Plan draft not found: ${draftId}`);
		}

		const planDraft = draft as PlanDraft;

		// Phase 1: Main questions
		if (planDraft.currentQuestionIndex < planDraft.questions.length) {
			const currentQuestion = planDraft.questions[planDraft.currentQuestionIndex];
			if (!currentQuestion) {
				throw new Error("Current question not found");
			}

			currentQuestion.answer = answer;

			// Check if this was the task list question
			const isTaskListQuestion =
				currentQuestion.question.includes("List the tasks");

			if (isTaskListQuestion) {
				// Parse task titles from the answer (one per line)
				const taskTitles = answer
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line.length > 0);

				if (taskTitles.length === 0) {
					throw new Error("At least one task is required");
				}

				planDraft.taskTitles = taskTitles;
				planDraft.currentTaskIndex = 0;
				planDraft.currentQuestionIndex++;

				await this.saveDraft(planDraft);

				// Start Phase 2: First task Q&A
				return {
					draftId,
					completed: false,
					nextQuestion: `Task 1/${taskTitles.length}: "${taskTitles[0]}" - Provide a detailed description`,
					currentQuestionIndex: planDraft.currentQuestionIndex,
					totalQuestions:
						planDraft.questions.length + taskTitles.length * 2, // 2 questions per task
				};
			}

			// Normal question progression
			planDraft.currentQuestionIndex++;
			await this.saveDraft(planDraft);

			const nextQuestion =
				planDraft.questions[planDraft.currentQuestionIndex]?.question;
			if (!nextQuestion) {
				throw new Error("Next question not found");
			}

			return {
				draftId,
				completed: false,
				nextQuestion,
				currentQuestionIndex: planDraft.currentQuestionIndex,
				totalQuestions: planDraft.questions.length,
			};
		}

		// Phase 2: Task Q&A
		const currentTaskIdx = planDraft.currentTaskIndex;
		const totalTasks = planDraft.taskTitles.length;

		if (currentTaskIdx >= totalTasks) {
			throw new Error("All tasks have been completed");
		}

		const currentTaskTitle = planDraft.taskTitles[currentTaskIdx];
		if (!currentTaskTitle) {
			throw new Error("Current task not found");
		}

		// Find if we're working on this task already
		const existingTask = planDraft.tasks.find(
			(t) => t.id === `temp-task-${String(currentTaskIdx + 1).padStart(3, "0")}`,
		);

		if (!existingTask) {
			// This is the description answer
			const taskId = `temp-task-${String(currentTaskIdx + 1).padStart(3, "0")}`;
			const newTask: DraftTask = {
				id: taskId,
				title: currentTaskTitle,
				description: answer,
				acceptance_criteria: null,
			};

			planDraft.tasks.push(newTask);
			await this.saveDraft(planDraft);

			// Ask for acceptance criteria
			return {
				draftId,
				completed: false,
				nextQuestion: `Task ${currentTaskIdx + 1}/${totalTasks}: "${currentTaskTitle}" - What are the acceptance criteria?`,
				currentQuestionIndex:
					planDraft.questions.length + currentTaskIdx * 2 + 1,
				totalQuestions: planDraft.questions.length + totalTasks * 2,
			};
		}

		// This is the acceptance criteria answer
		existingTask.acceptance_criteria = answer;
		planDraft.currentTaskIndex++;
		await this.saveDraft(planDraft);

		// Check if all tasks are done
		if (planDraft.currentTaskIndex >= totalTasks) {
			return {
				draftId,
				completed: true,
				totalQuestions: planDraft.questions.length + totalTasks * 2,
			};
		}

		// Move to next task
		const nextTaskTitle = planDraft.taskTitles[planDraft.currentTaskIndex];
		return {
			draftId,
			completed: false,
			nextQuestion: `Task ${planDraft.currentTaskIndex + 1}/${totalTasks}: "${nextTaskTitle}" - Provide a detailed description`,
			currentQuestionIndex:
				planDraft.questions.length + planDraft.currentTaskIndex * 2,
			totalQuestions: planDraft.questions.length + totalTasks * 2,
		};
	}

	/**
	 * Check if draft is complete (all questions + all tasks answered)
	 */
	async isComplete(draftId: string): Promise<boolean> {
		const draft = await this.getDraft(draftId);

		if (!draft || draft.type !== "plan") {
			return false;
		}

		const planDraft = draft as PlanDraft;

		// Must complete all main questions
		if (planDraft.currentQuestionIndex < planDraft.questions.length) {
			return false;
		}

		// Must have tasks
		if (planDraft.taskTitles.length === 0) {
			return false;
		}

		// Must complete all tasks
		if (planDraft.currentTaskIndex < planDraft.taskTitles.length) {
			return false;
		}

		// All tasks must have description and acceptance criteria
		for (const task of planDraft.tasks) {
			if (!task.description || !task.acceptance_criteria) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Create a plan entity from a completed draft
	 */
	async createFromDraft(draftId: string): Promise<Omit<Plan, "number">> {
		const draft = await this.getDraft(draftId);

		if (!draft || draft.type !== "plan") {
			throw new Error(`Plan draft not found: ${draftId}`);
		}

		const planDraft = draft as PlanDraft;

		if (!(await this.isComplete(draftId))) {
			throw new Error("Draft is not complete");
		}

		const now = new Date().toISOString();

		// Parse criteria reference
		const criteriaAnswer = planDraft.questions.find((q) =>
			q.question.includes("requirement and criteria"),
		)?.answer;
		const criteriaParts = criteriaAnswer?.split("/") || [];
		const criteria =
			criteriaParts.length === 2
				? {
						requirement: criteriaParts[0] as `req-${string}`,
						criteria: criteriaParts[1] as `crit-${string}`,
					}
				: {
						requirement: "req-001-tbd" as `req-${string}`,
						criteria: "crit-001" as `crit-${string}`,
					};

		// Parse scope
		const inScopeAnswer = planDraft.questions.find((q) =>
			q.question.includes("in scope"),
		)?.answer;
		const outScopeAnswer = planDraft.questions.find((q) =>
			q.question.includes("out of scope"),
		)?.answer;

		const scope = [];
		if (inScopeAnswer) {
			scope.push({
				type: "in-scope" as const,
				description: inScopeAnswer,
			});
		}
		if (outScopeAnswer) {
			scope.push({
				type: "out-of-scope" as const,
				description: outScopeAnswer,
			});
		}

		// Convert draft tasks to plan tasks
		const tasks = planDraft.tasks.map((draftTask, idx) => ({
			id: `task-${String(idx + 1).padStart(3, "0")}` as `task-${string}`,
			priority: "medium" as const,
			depends_on: [],
			task: `${draftTask.title}\n\n${draftTask.description}\n\nAcceptance Criteria:\n${draftTask.acceptance_criteria || "To be defined"}`,
			considerations: [],
			references: [],
			files: [],
			status: {
				verified: false,
				verified_at: null,
				notes: [],
			},
		}));

		return {
			type: "plan",
			slug: planDraft.slug,
			name: planDraft.name,
			description: planDraft.questions[0]?.answer || "To be defined",
			created_at: now,
			updated_at: now,
			priority: "medium",
			criteria,
			scope,
			depends_on: [],
			tasks,
			flows: [],
			test_cases: [],
			api_contracts: [],
			data_models: [],
			references: [],
		};
	}
}

/**
 * Manager for Plan entities
 */
export class PlanManager extends EntityManager<Plan> {
	private metadataManager: FileManager;

	constructor(specsPath: string) {
		super(specsPath, "plans", "plan", PlanSchema);
		this.metadataManager = new FileManager(specsPath);
	}

	protected async getNextNumber(): Promise<number> {
		return this.metadataManager.getNextId(this.entityType);
	}

	createDraftManager() {
		return new PlanDraftManager(this.metadataManager);
	}
}
