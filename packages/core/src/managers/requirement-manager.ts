import type {
	Draft,
	DraftQuestion,
	EntityType,
	Requirement,
} from "@spec-mcp/schemas";
import { RequirementSchema } from "@spec-mcp/schemas";
import { generateSlug } from "@spec-mcp/utils";
import { EntityManager } from "../core/entity-manager";
import { BaseDraftManager } from "../drafts";
import type { CreateDraftResult, SubmitAnswerResult } from "../drafts/types";
import { FileManager } from "../storage/file-manager";

/**
 * Draft manager for Requirements with simple Q&A workflow
 */
export class RequirementDraftManager extends BaseDraftManager<
	Omit<Requirement, "number">
> {
	protected entityType: EntityType = "requirement";

	/**
	 * Create draft with questions
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
				id: "purpose",
				question: "What is the main purpose of this requirement?",
				answer: description || null,
			},
			{
				id: "criteria",
				question: "What are the acceptance criteria?",
				answer: null,
			},
			{
				id: "priority",
				question: "What is the priority level?",
				answer: null,
			},
		];

		const draft = {
			id: draftId,
			type: "requirement" as const,
			name,
			slug,
			questions,
			currentQuestionIndex: description ? 1 : 0,
			created_at: now,
		};

		await this.saveDraft(draft as Draft);

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
	 * Submit an answer to the current question
	 */
	async submitAnswer(
		draftId: string,
		answer: string,
	): Promise<SubmitAnswerResult> {
		const draft = await this.getDraft(draftId);

		if (!draft || draft.type !== "requirement") {
			throw new Error(`Requirement draft not found: ${draftId}`);
		}

		const currentIndex = draft.currentQuestionIndex;

		if (currentIndex >= draft.questions.length) {
			throw new Error("All questions have already been answered");
		}

		// Update the current question's answer
		const currentQuestion = draft.questions[currentIndex];
		if (!currentQuestion) {
			throw new Error("Current question not found");
		}
		currentQuestion.answer = answer;

		// Move to next question
		const nextIndex = currentIndex + 1;
		draft.currentQuestionIndex = nextIndex;

		await this.saveDraft(draft);

		// Check if all questions are answered
		const completed = nextIndex >= draft.questions.length;

		if (completed) {
			return {
				draftId,
				completed: true,
				totalQuestions: draft.questions.length,
			};
		}

		const nextQuestion = draft.questions[nextIndex]?.question;
		if (!nextQuestion) {
			throw new Error("Next question not found");
		}

		return {
			draftId,
			completed: false,
			nextQuestion,
			currentQuestionIndex: nextIndex,
			totalQuestions: draft.questions.length,
		};
	}

	/**
	 * Check if all questions in a draft have been answered
	 */
	async isComplete(draftId: string): Promise<boolean> {
		const draft = await this.getDraft(draftId);

		if (!draft || draft.type !== "requirement") {
			return false;
		}

		return draft.currentQuestionIndex >= draft.questions.length;
	}

	/**
	 * Create a requirement entity from a completed draft
	 */
	async createFromDraft(draftId: string): Promise<Omit<Requirement, "number">> {
		const draft = await this.getDraft(draftId);

		if (!draft || draft.type !== "requirement") {
			throw new Error(`Requirement draft not found: ${draftId}`);
		}

		if (!(await this.isComplete(draftId))) {
			throw new Error(
				`Draft is not complete. ${draft.questions.length - draft.currentQuestionIndex} questions remaining.`,
			);
		}

		// Ensure all questions have answers
		const unanswered = draft.questions.filter((q) => !q.answer);
		if (unanswered.length > 0) {
			throw new Error(
				`Draft has unanswered questions: ${unanswered.map((q) => q.question).join(", ")}`,
			);
		}

		const now = new Date().toISOString();

		// Parse criteria from answer
		const criteriaAnswer = draft.questions.find((q) =>
			q.question.includes("acceptance criteria"),
		)?.answer;
		const criteria = criteriaAnswer
			? criteriaAnswer.split("\n").map((desc, idx) => ({
					id: `crit-${String(idx + 1).padStart(3, "0")}` as `crit-${string}`,
					description: desc.trim(),
					status: "needs-review" as const,
				}))
			: [
					{
						id: "crit-001" as `crit-${string}`,
						description: "To be defined",
						status: "needs-review" as const,
					},
				];

		const priority =
			(draft.questions
				.find((q) => q.question.includes("priority"))
				?.answer?.toLowerCase() as
				| "critical"
				| "high"
				| "medium"
				| "low"
				| "nice-to-have"
				| undefined) || "medium";

		return {
			type: "requirement",
			slug: draft.slug,
			name: draft.name,
			description: draft.questions[0]?.answer || "To be defined",
			created_at: now,
			updated_at: now,
			priority,
			criteria,
			status: {
				verified: false,
				verified_at: null,
				notes: [],
			},
		};
	}
}

/**
 * Manager for Requirement entities
 */
export class RequirementManager extends EntityManager<Requirement> {
	private metadataManager: FileManager;

	constructor(specsPath: string) {
		super(specsPath, "requirements", "requirement", RequirementSchema);
		this.metadataManager = new FileManager(specsPath);
	}

	protected async getNextNumber(): Promise<number> {
		return this.metadataManager.getNextId(this.entityType);
	}

	createDraftManager() {
		return new RequirementDraftManager(this.metadataManager);
	}
}
