import z from "zod";

/**
 * Generic supersession fields for any item with an ID
 * Used to track update history while maintaining ID immutability
 */
export function createSupersessionSchema<T extends z.ZodString>(idSchema: T) {
	return {
		supersedes: idSchema
			.nullish()
			.default(null)
			.describe("ID of the item this replaces (if any)"),
		superseded_by: idSchema
			.nullish()
			.default(null)
			.describe("ID of the item that replaces this (if superseded)"),
		superseded_at: z
			.string()
			.datetime()
			.nullish()
			.default(null)
			.describe("Timestamp when this item was superseded"),
	};
}

// Note: Supersedable interface and utility functions have been moved to @spec-mcp/core/utils/supersession-utils
// Import them from there instead:
//   import { Supersedable, isActive, getActiveItems, etc } from "@spec-mcp/core";
