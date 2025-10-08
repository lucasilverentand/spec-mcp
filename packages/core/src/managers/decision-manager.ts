import type { Decision, EntityType, Draft } from "@spec-mcp/schemas";
import { DecisionSchema } from "@spec-mcp/schemas";
import type { DraftQuestion } from "@spec-mcp/schemas";
import { generateSlug } from "@spec-mcp/utils";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";
import type { CreateDraftResult, SubmitAnswerResult } from "../drafts/types";

/**
 * Draft manager for Decisions with simple Q&A workflow
 */
export class DecisionDraftManager extends BaseDraftManager<
	Omit<Decision, "number">
> {
	protected entityType: EntityType = "decision";

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
				question: "What decision is being made?",
				answer: description || null,
			},
			{
				question: "What is the context or problem that prompted this decision?",
				answer: null,
			},
			{
				question: "What alternatives were considered? (comma-separated, optional)",
				answer: null,
			},
			{
				question: "What is the status? (proposed, accepted, deprecated)",
				answer: null,
			},
		];

		const draft = {
			id: draftId,
			type: "decision" as const,
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

		if (!draft || draft.type !== "decision") {
			throw new Error(`Decision draft not found: ${draftId}`);
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

		if (!draft || draft.type !== "decision") {
			return false;
		}

		return draft.currentQuestionIndex >= draft.questions.length;
	}

	/**
	 * Create a decision entity from a completed draft
	 */
	async createFromDraft(draftId: string): Promise<Omit<Decision, "number">> {
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

		const decision =
			draft.questions.find((q) => q.question.includes("decision is being"))
				?.answer || "To be defined";

		const context =
			draft.questions.find((q) => q.question.includes("context or problem"))
				?.answer || "To be defined";

		const alternativesAnswer = draft.questions.find((q) =>
			q.question.includes("alternatives"),
		)?.answer;
		const alternatives = alternativesAnswer
			? alternativesAnswer.split(",").map((alt) => alt.trim())
			: [];

		const statusAnswer = draft.questions
			.find((q) => q.question.includes("status"))
			?.answer?.toLowerCase();
		const status:
			| "proposed"
			| "accepted"
			| "deprecated"
			| "superseded"
			| undefined =
			statusAnswer === "proposed" ||
			statusAnswer === "accepted" ||
			statusAnswer === "deprecated" ||
			statusAnswer === "superseded"
				? statusAnswer
				: "proposed";

		return {
			type: "decision",
			slug: draft.slug,
			name: draft.name,
			description: draft.questions[0]?.answer || "To be defined",
			created_at: now,
			updated_at: now,
			priority: "medium",
			decision,
			context,
			status,
			alternatives,
			references: [],
			consequences: [],
		};
	}
}

/**
 * Manager for Decision entities
 */
export class DecisionManager extends EntityManager<Decision> {
	private metadataManager: FileManager;

	constructor(specsPath: string) {
		super(specsPath, "decisions", "decision", DecisionSchema);
		this.metadataManager = new FileManager(specsPath);
	}

	protected async getNextNumber(): Promise<number> {
		return this.metadataManager.getNextId(this.entityType);
	}

	createDraftManager() {
		return new DecisionDraftManager(this.metadataManager);
	}
}
