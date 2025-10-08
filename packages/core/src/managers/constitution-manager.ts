import type { Constitution, EntityType } from "@spec-mcp/schemas";
import { ConstitutionSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";

/**
 * Draft manager for Constitutions with embedded workflow logic
 */
export class ConstitutionDraftManager extends BaseDraftManager<
	Omit<Constitution, "number">
> {
	protected entityType: EntityType = "constitution";

	/**
	 * Get questions to ask during draft creation
	 */
	protected getQuestions(_name: string, _description?: string): string[] {
		return [
			"What is the purpose of this constitution?",
			"What are the core articles/principles? (one per line, format: Title: Principle)",
		];
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
