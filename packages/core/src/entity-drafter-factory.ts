import type { Base, DraftQuestion } from "@spec-mcp/schemas";
import type { ZodType, ZodTypeDef } from "zod";
import {
	EntityArrayDrafter,
	EntityDrafter,
	type EntityDrafterState,
} from "./entity-drafter.js";

/**
 * Configuration for a single array field that needs drafting support
 */
export interface ArrayFieldConfig<TItem = unknown> {
	/** Name of the array field in the parent entity */
	fieldName: string;
	/** Zod schema for individual items in the array */
	itemSchema: ZodType<TItem, ZodTypeDef, unknown>;
	/** Question to ask for the overall array (e.g., "List the user stories") */
	collectionQuestion: DraftQuestion;
	/** Template questions to ask for each item in the array */
	itemQuestions: DraftQuestion[];
}

/**
 * Configuration for creating an entity drafter
 */
export interface EntityDrafterConfig<T extends Base> {
	/** Zod schema for the entity */
	schema: ZodType<T, ZodTypeDef, unknown>;
	/** Top-level questions for the entity (non-array fields) */
	questions: DraftQuestion[];
	/** Configuration for complex array fields that need drafting */
	arrayFields?: ArrayFieldConfig<unknown>[];
}

/**
 * Factory function to create an EntityDrafter with configured array drafters
 */
export function createEntityDrafter<T extends Base>(
	config: EntityDrafterConfig<T>,
): EntityDrafter<T> {
	const arrayDrafters = new Map<string, EntityArrayDrafter<unknown>>();

	// Create array drafters for each configured array field
	if (config.arrayFields) {
		for (const arrayConfig of config.arrayFields) {
			const arrayDrafter = new EntityArrayDrafter(
				arrayConfig.itemSchema,
				arrayConfig.collectionQuestion,
				arrayConfig.itemQuestions,
			);
			arrayDrafters.set(arrayConfig.fieldName, arrayDrafter);
		}
	}

	return new EntityDrafter<T>(
		config.schema,
		config.questions,
		arrayDrafters.size > 0 ? arrayDrafters : undefined,
	);
}

/**
 * Restores an EntityDrafter from JSON state with configured array fields
 */
export function restoreEntityDrafter<T extends Base>(
	config: EntityDrafterConfig<T>,
	state: EntityDrafterState<T>,
): EntityDrafter<T> {
	// We need to pass the array field configs to fromJSON so it knows which schemas to use
	// This is a bit tricky - we'll need to enhance EntityDrafter.fromJSON to accept this
	// For now, let's create a specialized restore function

	const arrayDrafters = new Map<string, EntityArrayDrafter<unknown>>();

	// Restore array drafters from state
	if (config.arrayFields && state.arrayDrafters) {
		for (const arrayConfig of config.arrayFields) {
			const fieldName = arrayConfig.fieldName;
			const drafterState = state.arrayDrafters[fieldName];

			if (drafterState) {
				const arrayDrafter = EntityArrayDrafter.fromJSON(
					arrayConfig.itemSchema,
					drafterState,
				);
				arrayDrafters.set(fieldName, arrayDrafter);
			}
		}
	}

	const drafter = new EntityDrafter<T>(
		config.schema,
		state.questions,
		arrayDrafters.size > 0 ? arrayDrafters : undefined,
	);
	drafter.data = state.data;
	drafter.finalized = state.finalized;

	return drafter;
}
