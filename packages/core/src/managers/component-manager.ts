import type {
	Component,
	Draft,
	DraftQuestion,
	EntityType,
} from "@spec-mcp/schemas";
import { ComponentSchema } from "@spec-mcp/schemas";
import { generateSlug } from "@spec-mcp/utils";
import { EntityManager } from "../core/entity-manager";
import { BaseDraftManager } from "../drafts";
import type { CreateDraftResult, SubmitAnswerResult } from "../drafts/types";
import { FileManager } from "../storage/file-manager";

/**
 * Draft manager for Components with simple Q&A workflow
 */
export class ComponentDraftManager extends BaseDraftManager<
	Omit<Component, "number">
> {
	protected entityType: EntityType = "component";

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
				question: "What is the purpose of this component?",
				answer: description || null,
			},
			{
				question: "What type of component is this? (app, service, library)",
				answer: null,
			},
			{
				question: "What is the folder path for this component?",
				answer: null,
			},
			{
				question:
					"What technologies does this component use? (comma-separated)",
				answer: null,
			},
		];

		const draft = {
			id: draftId,
			type: "component" as const,
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

		if (!draft || draft.type !== "component") {
			throw new Error(`Component draft not found: ${draftId}`);
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

		if (!draft || draft.type !== "component") {
			return false;
		}

		return draft.currentQuestionIndex >= draft.questions.length;
	}

	/**
	 * Create a component entity from a completed draft
	 */
	async createFromDraft(draftId: string): Promise<Omit<Component, "number">> {
		const draft = await this.getDraft(draftId);

		if (!draft) {
			throw new Error(`Draft not found: ${draftId}`);
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

		const componentTypeAnswer = draft.questions
			.find((q) => q.question.includes("type of component"))
			?.answer?.toLowerCase();
		const componentType: "app" | "service" | "library" =
			componentTypeAnswer === "app" ||
			componentTypeAnswer === "service" ||
			componentTypeAnswer === "library"
				? componentTypeAnswer
				: "service";

		const folder =
			draft.questions.find((q) => q.question.includes("folder path"))?.answer ||
			".";

		const techStackAnswer = draft.questions.find((q) =>
			q.question.includes("technologies"),
		)?.answer;
		const tech_stack = techStackAnswer
			? techStackAnswer.split(",").map((tech) => tech.trim())
			: [];

		return {
			type: "component",
			slug: draft.slug,
			name: draft.name,
			description: draft.questions[0]?.answer || "To be defined",
			created_at: now,
			updated_at: now,
			priority: "medium",
			component_type: componentType,
			folder,
			tech_stack,
			scope: [],
			depends_on: [],
			external_dependencies: [],
			deployments: [],
		};
	}
}

/**
 * Manager for Component entities
 */
export class ComponentManager extends EntityManager<Component> {
	private metadataManager: FileManager;

	constructor(specsPath: string) {
		super(specsPath, "components", "component", ComponentSchema);
		this.metadataManager = new FileManager(specsPath);
	}

	protected async getNextNumber(): Promise<number> {
		return this.metadataManager.getNextId(this.entityType);
	}

	createDraftManager() {
		return new ComponentDraftManager(this.metadataManager);
	}
}
