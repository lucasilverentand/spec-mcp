import type { Decision, EntityType } from "@spec-mcp/schemas";
import { DecisionSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";

/**
 * Draft manager for Decisions with embedded workflow logic
 */
export class DecisionDraftManager extends BaseDraftManager<
	Omit<Decision, "number">
> {
	protected entityType: EntityType = "decision";

	/**
	 * Get questions to ask during draft creation
	 */
	protected getQuestions(_name: string, _description?: string): string[] {
		return [
			"What decision is being made?",
			"What is the context or problem that prompted this decision?",
			"What alternatives were considered? (comma-separated, optional)",
			"What is the status? (proposed, accepted, deprecated)",
		];
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
