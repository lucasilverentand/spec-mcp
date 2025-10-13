import { z } from "zod";

export const CriteriaIdSchema = z.string().regex(/^crt-\d{3}$/, {
	message: "Criteria ID must follow format: crt-XXX",
});

/**
 * Criteria schema - NO status field
 * Status is computed from all plans that implement this criterion
 */
export const CriteriaSchema = z.object({
	id: CriteriaIdSchema.describe("Unique identifier for the criterion"),
	description: z
		.string()
		.min(1)
		.describe("Description of the acceptance criterion"),
	rationale: z
		.string()
		.min(1)
		.describe("Rationale explaining why this criterion is important"),
	// NO status field - computed from tasks in plans!
	// Supersession tracking - for audit trail and updates
	supersedes: CriteriaIdSchema.nullish()
		.default(null)
		.describe("ID of the criteria this replaces (if any)"),
	superseded_by: CriteriaIdSchema.nullish()
		.default(null)
		.describe("ID of the criteria that replaces this (if superseded)"),
	superseded_at: z
		.string()
		.datetime()
		.nullish()
		.default(null)
		.describe("Timestamp when this criteria was superseded"),
});

export type CriteriaId = z.infer<typeof CriteriaIdSchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;

// Note: Helper functions for computing criteria state moved to requirement-status.ts
// Criteria no longer have a status field - it's computed from plans/tasks

// Note: All criteria utility functions have been moved to @spec-mcp/core/utils/criteria-utils
// Import them from there instead:
//   import { isActiveCriteria, getCriteriaHistory, etc } from "@spec-mcp/core";
