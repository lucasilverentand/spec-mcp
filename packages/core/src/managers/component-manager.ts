import type { Component, EntityType } from "@spec-mcp/schemas";
import { ComponentSchema } from "@spec-mcp/schemas";
import { EntityManager } from "../core/entity-manager";
import { FileManager } from "../storage/file-manager";
import { BaseDraftManager } from "../drafts";

/**
 * Draft manager for Components with embedded workflow logic
 */
export class ComponentDraftManager extends BaseDraftManager<
	Omit<Component, "number">
> {
	protected entityType: EntityType = "component";

	/**
	 * Get questions to ask during draft creation
	 */
	protected getQuestions(_name: string, _description?: string): string[] {
		return [
			"What is the purpose of this component?",
			"What type of component is this? (app, service, library)",
			"What is the folder path for this component?",
			"What technologies does this component use? (comma-separated)",
		];
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
