import type { Base, EntityType } from "@spec-mcp/schemas";
import {
	createBusinessRequirementDrafterConfig,
	createComponentDrafterConfig,
	createConstitutionDrafterConfig,
	createDecisionDrafterConfig,
	createPlanDrafterConfig,
	createTechnicalRequirementDrafterConfig,
} from "./drafters";
import type { EntityDrafter } from "./entity-drafter";
import { createEntityDrafter } from "./entity-drafter-factory";

/**
 * Manager for a single draft session using EntityDrafter
 */
export class DraftManager<T extends Base = Base> {
	private drafter: EntityDrafter<T>;
	private entityType: EntityType;

	constructor(drafter: EntityDrafter<T>, entityType: EntityType) {
		this.drafter = drafter;
		this.entityType = entityType;
	}

	/**
	 * Get the underlying EntityDrafter instance
	 */
	getDrafter(): EntityDrafter<T> {
		return this.drafter;
	}

	/**
	 * Get current question in the draft flow
	 */
	getCurrentQuestion(): {
		prompt: string;
		type: string;
		options?: string[];
		exampleFormat?: string;
	} | null {
		const question = this.drafter.currentQuestion();
		if (!question) {
			return null;
		}

		return {
			prompt: question.question,
			type: "text", // All our questions are text-based
		};
	}

	/**
	 * Submit an answer to the current question
	 */
	submitAnswer(answer: string | number | boolean | string[]): void {
		// Convert all inputs to string for EntityDrafter
		const stringAnswer = Array.isArray(answer)
			? answer.join(", ")
			: String(answer);
		this.drafter.submitAnswer(stringAnswer);
	}

	/**
	 * Check if all questions have been answered
	 */
	isComplete(): boolean {
		return this.drafter.isComplete;
	}

	/**
	 * Get the draft status including progress
	 */
	getStatus(): {
		stage: string;
		progress: { current: number; total: number };
		currentQuestion: {
			prompt: string;
			type: string;
			options?: string[];
			exampleFormat?: string;
		} | null;
		partialDraft: Partial<T>;
	} {
		const totalQuestions = this.drafter.questions.length;
		const answeredQuestions = this.drafter.questions.filter(
			(q) => q.answer !== null,
		).length;

		return {
			stage: this.drafter.questionsComplete ? "complete" : "in_progress",
			progress: {
				current: answeredQuestions,
				total: totalQuestions,
			},
			currentQuestion: this.getCurrentQuestion(),
			partialDraft: this.drafter.data,
		};
	}

	/**
	 * Answer a question by its ID (unified for all question types)
	 * @param questionId The unique question ID
	 * @param answer The answer to submit
	 */
	answerQuestionById(
		questionId: string,
		answer: string | number | boolean | string[],
	): void {
		// Convert all inputs to string for EntityDrafter
		const stringAnswer = Array.isArray(answer)
			? answer.join(", ")
			: String(answer);
		this.drafter.answerQuestionById(questionId, stringAnswer);
	}

	/**
	 * Finalize an entity (main or array item) with data
	 * @param entityId Format: null/"main" for main entity, "fieldName[index]" for array items
	 * @param data The complete JSON data to finalize with
	 */
	finalizeEntity(entityId: string | null | undefined, data: Partial<T>): void {
		this.drafter.finalizeByEntityId(entityId, data);
	}

	/**
	 * Get intelligent continuation instructions for the draft
	 * Tells you what to do next: answer questions or finalize entities
	 */
	getContinueInstructions(): {
		stage: "questions" | "finalization" | "complete";
		nextAction: unknown;
	} {
		return this.drafter.getContinueContext();
	}

	/**
	 * Build the final entity (only works if complete)
	 */
	build(): T {
		if (!this.isComplete()) {
			throw new Error("Cannot build: draft is not complete");
		}
		return this.drafter.data as T;
	}

	/**
	 * Get entity type
	 */
	getType(): EntityType {
		return this.entityType;
	}
}

/**
 * Store for managing multiple draft sessions
 */
export class DraftStore {
	private drafts: Map<string, DraftManager<Base>> = new Map();

	/**
	 * Create a new draft session
	 */
	create(sessionId: string, type: EntityType): DraftManager {
		if (this.drafts.has(sessionId)) {
			throw new Error(`Draft already exists for session: ${sessionId}`);
		}

		// Create appropriate drafter config based on type
		let drafter: EntityDrafter<Base>;
		switch (type) {
			case "business-requirement":
				drafter = createEntityDrafter(createBusinessRequirementDrafterConfig());
				break;
			case "technical-requirement":
				drafter = createEntityDrafter(
					createTechnicalRequirementDrafterConfig(),
				);
				break;
			case "component":
				drafter = createEntityDrafter(createComponentDrafterConfig());
				break;
			case "plan":
				drafter = createEntityDrafter(createPlanDrafterConfig());
				break;
			case "decision":
				drafter = createEntityDrafter(createDecisionDrafterConfig());
				break;
			case "constitution":
				drafter = createEntityDrafter(createConstitutionDrafterConfig());
				break;
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}

		// Create manager
		const manager = new DraftManager(drafter, type);

		// Store it
		this.drafts.set(sessionId, manager);

		return manager;
	}

	/**
	 * Get an existing draft session
	 */
	get(sessionId: string): DraftManager<Base> | undefined {
		return this.drafts.get(sessionId);
	}

	/**
	 * Check if a draft exists
	 */
	has(sessionId: string): boolean {
		return this.drafts.has(sessionId);
	}

	/**
	 * Delete a draft session
	 */
	delete(sessionId: string): boolean {
		return this.drafts.delete(sessionId);
	}

	/**
	 * Clear all drafts
	 */
	clear(): void {
		this.drafts.clear();
	}

	/**
	 * Get all session IDs
	 */
	getSessions(): string[] {
		return Array.from(this.drafts.keys());
	}

	/**
	 * List all drafts with metadata
	 */
	list(): Array<{
		draftId: string;
		type: EntityType;
		stage: "questions" | "finalization" | "complete";
		progress: { answered: number; total: number };
	}> {
		const result: Array<{
			draftId: string;
			type: EntityType;
			stage: "questions" | "finalization" | "complete";
			progress: { answered: number; total: number };
		}> = [];

		for (const [draftId, manager] of this.drafts.entries()) {
			const drafter = manager.getDrafter();
			const continueCtx = manager.getContinueInstructions();

			// Count answered questions (main + array items)
			let totalQuestions = drafter.questions.length;
			let answeredQuestions = drafter.questions.filter(
				(q) => q.answer !== null,
			).length;

			// Add array questions
			const arrayDrafters = drafter.getAllArrayDrafters();
			for (const [_fieldName, arrayDrafter] of arrayDrafters.entries()) {
				const collectionQ = arrayDrafter.getCollectionQuestion();
				totalQuestions += 1; // collection question
				if (collectionQ.answer !== null) {
					answeredQuestions += 1;
				}

				// Add item questions
				for (const item of arrayDrafter.items) {
					totalQuestions += item.drafter.questions.length;
					answeredQuestions += item.drafter.questions.filter(
						(q) => q.answer !== null,
					).length;
				}
			}

			result.push({
				draftId,
				type: manager.getType(),
				stage: continueCtx.stage,
				progress: { answered: answeredQuestions, total: totalQuestions },
			});
		}

		return result;
	}
}
