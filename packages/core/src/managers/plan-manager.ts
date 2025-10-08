import type { EntityType, Plan } from "@spec-mcp/schemas";
import { PlanSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";

/**
 * Draft manager for Plans with embedded workflow logic
 */
export class PlanDraftManager extends BaseDraftManager<Omit<Plan, "number">> {
	protected entityType: EntityType = "plan";

	/**
	 * Get questions to ask during draft creation
	 */
	protected getQuestions(_name: string, _description?: string): string[] {
		return [
			"What is the main goal of this plan?",
			"Which requirement and criteria does this plan fulfill? (format: req-XXX-slug/crit-XXX)",
			"What is in scope for this plan?",
			"What is explicitly out of scope?",
		];
	}

	/**
	 * Create a plan entity from a completed draft
	 */
	async createFromDraft(draftId: string): Promise<Omit<Plan, "number">> {
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

		// Parse criteria reference
		const criteriaAnswer = draft.questions.find((q) =>
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
		const inScopeAnswer = draft.questions.find((q) =>
			q.question.includes("in scope"),
		)?.answer;
		const outScopeAnswer = draft.questions.find((q) =>
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

		return {
			type: "plan",
			slug: draft.slug,
			name: draft.name,
			description: draft.questions[0]?.answer || "To be defined",
			created_at: now,
			updated_at: now,
			priority: "medium",
			criteria,
			scope,
			depends_on: [],
			tasks: [],
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
