import type { Constitution, EntityType, Draft } from "@spec-mcp/schemas";
import { ConstitutionSchema } from "@spec-mcp/schemas";
import type { DraftQuestion } from "@spec-mcp/schemas";
import { generateSlug } from "@spec-mcp/utils";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";
import type { CreateDraftResult, SubmitAnswerResult } from "../drafts/types";

/**
 * Draft manager for Constitutions with simple Q&A workflow
 */
export class ConstitutionDraftManager extends BaseDraftManager<
	Omit<Constitution, "number">
> {
	protected entityType: EntityType = "constitution";

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
				question: "What is the purpose of this constitution?",
				answer: description || null,
			},
			{
				question: "What are the core articles/principles? (one per line, format: Title: Principle)",
				answer: null,
			},
		];

		const draft = {
			id: draftId,
			type: "constitution" as const,
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

		if (!draft || draft.type !== "constitution") {
			throw new Error(`Constitution draft not found: ${draftId}`);
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

		if (!draft || draft.type !== "constitution") {
			return false;
		}

		return draft.currentQuestionIndex >= draft.questions.length;
	}

	/**
	 * Create a constitution entity from a completed draft
	 */
	async createFromDraft(
		draftId: string,
	): Promise<Omit<Constitution, "number">> {
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

		// Parse articles from answer
		const articlesAnswer = draft.questions.find((q) =>
			q.question.includes("core articles"),
		)?.answer;
		const articles = articlesAnswer
			? articlesAnswer.split("\n").map((line, idx) => {
					const [title, principle] = line.split(":").map((s) => s.trim());
					return {
						id: `art-${String(idx + 1).padStart(3, "0")}` as `art-${string}`,
						title: title || "Untitled Principle",
						principle: principle || "To be defined",
						rationale: "To be defined",
						examples: [],
						exceptions: [],
						status: "needs-review" as const,
					};
				})
			: [
					{
						id: "art-001" as `art-${string}`,
						title: "First Principle",
						principle: "To be defined",
						rationale: "To be defined",
						examples: [],
						exceptions: [],
						status: "needs-review" as const,
					},
				];

		return {
			type: "constitution",
			slug: draft.slug,
			name: draft.name,
			description: draft.questions[0]?.answer || "To be defined",
			created_at: now,
			updated_at: now,
			priority: "medium",
			articles,
		};
	}
}

/**
 * Manager for Constitution entities
 */
export class ConstitutionManager extends EntityManager<Constitution> {
	private metadataManager: FileManager;

	constructor(specsPath: string) {
		super(specsPath, "constitutions", "constitution", ConstitutionSchema);
		this.metadataManager = new FileManager(specsPath);
	}

	protected async getNextNumber(): Promise<number> {
		return this.metadataManager.getNextId(this.entityType);
	}

	createDraftManager() {
		return new ConstitutionDraftManager(this.metadataManager);
	}
}
