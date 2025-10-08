import type { EntityType, Requirement } from "@spec-mcp/schemas";
import { RequirementSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";

/**
 * Draft manager for Requirements with embedded workflow logic
 */
export class RequirementDraftManager extends BaseDraftManager<
	Omit<Requirement, "number">
> {
	protected entityType: EntityType = "requirement";

	/**
	 * Get questions to ask during draft creation
	 */
	protected getQuestions(_name: string, _description?: string): string[] {
		return [
			"What is the main purpose of this requirement?",
			"What are the acceptance criteria?",
			"What is the priority level?",
		];
	}

	/**
	 * Create a requirement entity from a completed draft
	 */
	async createFromDraft(
		draftId: string,
	): Promise<Omit<Requirement, "number">> {
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
