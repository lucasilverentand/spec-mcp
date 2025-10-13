import type { Base, EntityType } from "@spec-mcp/schemas";
import {
	createBusinessRequirementDrafterConfig,
	createComponentDrafterConfig,
	createConstitutionDrafterConfig,
	createDecisionDrafterConfig,
	createMilestoneDrafterConfig,
	createPlanDrafterConfig,
	createTechnicalRequirementDrafterConfig,
} from "./drafters/index.js";
import type { EntityDrafter } from "./entity-drafter.js";
import {
	createEntityDrafter,
	restoreEntityDrafter,
} from "./entity-drafter-factory.js";
import type { SpecManager } from "./spec-manager.js";

/**
 * Manager for a single draft session using EntityDrafter
 */
export class DraftManager<T extends Base = Base> {
	private drafter: EntityDrafter<T>;
	private entityType: EntityType;
	private slug?: string;
	private number?: number;

	constructor(
		drafter: EntityDrafter<T>,
		entityType: EntityType,
		slug?: string,
		number?: number,
	) {
		this.drafter = drafter;
		this.entityType = entityType;
		if (slug !== undefined) {
			this.slug = slug;
		}
		if (number !== undefined) {
			this.number = number;
		}
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

	/**
	 * Get slug (may be undefined if not yet finalized)
	 */
	getSlug(): string | undefined {
		return this.slug;
	}

	/**
	 * Set slug (assigned during finalization)
	 */
	setSlug(slug: string): void {
		this.slug = slug;
	}

	/**
	 * Get number
	 */
	getNumber(): number | undefined {
		return this.number;
	}

	/**
	 * Set number (assigned when first saved)
	 */
	setNumber(number: number): void {
		this.number = number;
	}
}

/**
 * Store for managing multiple draft sessions
 */
export class DraftStore {
	private drafts: Map<string, DraftManager<Base>> = new Map();
	private specManager: SpecManager;

	constructor(specManager: SpecManager) {
		this.specManager = specManager;
	}

	/**
	 * Create a new draft session
	 */
	create(sessionId: string, type: EntityType, slug?: string): DraftManager {
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
			case "milestone":
				drafter = createEntityDrafter(createMilestoneDrafterConfig());
				break;
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}

		// Create manager
		const manager = new DraftManager(drafter, type, slug);

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

	/**
	 * Get the EntityManager for a given type
	 */
	private getEntityManager(type: EntityType) {
		switch (type) {
			case "business-requirement":
				return this.specManager.business_requirements;
			case "technical-requirement":
				return this.specManager.tech_requirements;
			case "plan":
				return this.specManager.plans;
			case "component":
				return this.specManager.components;
			case "constitution":
				return this.specManager.constitutions;
			case "decision":
				return this.specManager.decisions;
			case "milestone":
				return this.specManager.milestones;
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}
	}

	/**
	 * Save a draft to disk using EntityManager's saveDraft method.
	 * No slug is needed - slug is determined at finalization.
	 * Assigns a number on first save if not already assigned.
	 */
	async save(sessionId: string): Promise<void> {
		const manager = this.drafts.get(sessionId);
		if (!manager) {
			throw new Error(`Draft '${sessionId}' not found`);
		}

		const type = manager.getType();
		const drafter = manager.getDrafter();
		const entityManager = this.getEntityManager(type);

		// Assign number if not already assigned
		let number = manager.getNumber();
		if (number === undefined) {
			number = await this.specManager.getNextNumber(type);
			manager.setNumber(number);
		}

		// Save using EntityManager (no slug needed for drafts)
		// @ts-expect-error - TypeScript cannot verify the drafter type matches entityManager's specific type,
		// but we know it's correct because both come from the same entity type switch case
		await entityManager.saveDraft(drafter, number);
	}

	/**
	 * Get the drafter config for a given type
	 */
	private getDrafterConfig(type: EntityType) {
		switch (type) {
			case "business-requirement":
				return createBusinessRequirementDrafterConfig();
			case "technical-requirement":
				return createTechnicalRequirementDrafterConfig();
			case "plan":
				return createPlanDrafterConfig();
			case "component":
				return createComponentDrafterConfig();
			case "constitution":
				return createConstitutionDrafterConfig();
			case "decision":
				return createDecisionDrafterConfig();
			case "milestone":
				return createMilestoneDrafterConfig();
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}
	}

	/**
	 * Load all drafts from disk on startup
	 */
	async loadAll(): Promise<void> {
		const types: EntityType[] = [
			"business-requirement",
			"technical-requirement",
			"plan",
			"component",
			"constitution",
			"decision",
			"milestone",
		];

		for (const type of types) {
			try {
				const entityManager = this.getEntityManager(type);
				const draftInfos = await entityManager.listDraftsWithMetadata();

				for (const { number } of draftInfos) {
					try {
						// Load the draft state instead of the drafter directly
						const drafterState = await entityManager.loadDraftState(number);
						if (drafterState) {
							// Get the config for this entity type
							const config = this.getDrafterConfig(type);

							// Restore the drafter with proper array field configs
							// @ts-expect-error - TypeScript cannot verify the union types match at compile time,
							// but we know they're correct because config and drafterState come from the same entity type
							const drafter = restoreEntityDrafter(config, drafterState);

							// Create session ID using ONLY type and number (no more "-draft-" in the ID)
							// This is a unified ID scheme where drafts and finalized specs use the same ID format
							const prefix =
								type === "business-requirement"
									? "brd"
									: type === "technical-requirement"
										? "prd"
										: type === "plan"
											? "pln"
											: type === "component"
												? "cmp"
												: type === "constitution"
													? "con"
													: type === "decision"
														? "dec"
														: "mls";
							const sessionId = `${prefix}-${String(number).padStart(3, "0")}`;

							// Create manager without slug (cast drafter to Base type)
							const manager = new DraftManager(
								drafter as EntityDrafter<Base>,
								type,
								undefined, // no slug yet
								number,
							);
							this.drafts.set(sessionId, manager);
						}
					} catch (error) {
						console.error(`Failed to load draft ${type} #${number}:`, error);
					}
				}
			} catch (error) {
				console.error(`Error loading drafts for ${type}:`, error);
			}
		}
	}

	/**
	 * Delete a draft session and remove from disk
	 */
	async deleteWithFile(sessionId: string): Promise<boolean> {
		const manager = this.drafts.get(sessionId);
		if (!manager) {
			return false;
		}

		const type = manager.getType();
		const number = manager.getNumber();

		// Delete from memory
		const deleted = this.drafts.delete(sessionId);

		// Delete from disk if it has a number
		if (deleted && number !== undefined) {
			const entityManager = this.getEntityManager(type);
			try {
				await entityManager.deleteDraft(number);
			} catch (error) {
				// Log but don't fail
				console.error(`Failed to delete draft file for ${sessionId}:`, error);
			}
		}

		return deleted;
	}
}
