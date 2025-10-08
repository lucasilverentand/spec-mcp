import z from "zod";
import type { EntityType } from "./base";

/**
 * Metadata stored in specs.json at the root of the specs folder
 * Tracks the latest ID per entity type for auto-increment
 */
export const SpecsMetadataSchema = z.object({
	version: z.string().default("1.0.0").describe("Metadata schema version"),
	lastIds: z
		.object({
			requirement: z.number().int().nonnegative().default(0),
			plan: z.number().int().nonnegative().default(0),
			app: z.number().int().nonnegative().default(0),
			component: z.number().int().nonnegative().default(0),
			constitution: z.number().int().nonnegative().default(0),
			decision: z.number().int().nonnegative().default(0),
		})
		.describe("Latest ID number for each entity type"),
});

export type SpecsMetadata = z.infer<typeof SpecsMetadataSchema>;

/**
 * Default metadata for initialization
 */
export const DEFAULT_SPECS_METADATA: SpecsMetadata = {
	version: "1.0.0",
	lastIds: {
		requirement: 0,
		plan: 0,
		app: 0,
		component: 0,
		constitution: 0,
		decision: 0,
	},
};

/**
 * Helper to get next ID for a given entity type
 */
export function getNextIdForType(
	metadata: SpecsMetadata,
	type: EntityType,
): number {
	return metadata.lastIds[type] + 1;
}

/**
 * Helper to update last ID for a given entity type
 */
export function setLastIdForType(
	metadata: SpecsMetadata,
	type: EntityType,
	id: number,
): SpecsMetadata {
	return {
		...metadata,
		lastIds: {
			...metadata.lastIds,
			[type]: id,
		},
	};
}
