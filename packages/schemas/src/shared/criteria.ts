import { z } from "zod";

export const CriteriaIdSchema = z.string().regex(/^crit-\d{3}$/, {
	message: "Criteria ID must follow format: crit-XXX",
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
});

export type CriteriaId = z.infer<typeof CriteriaIdSchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;

// Note: Helper functions for computing criteria state moved to requirement-status.ts
// Criteria no longer have a status field - it's computed from plans/tasks
