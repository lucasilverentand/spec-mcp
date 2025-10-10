import { z } from "zod";

export const CriteriaIdSchema = z.string().regex(/^crit-\d{3}$/, {
	message: "Criteria ID must follow format: crit-XXX",
});

export const CriteriaStatusSchema = z.enum([
	"needs-review",
	"approved",
	"rejected",
	"in-progress",
	"completed",
]);

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
	status: CriteriaStatusSchema.default("needs-review").describe(
		"Current status of the criterion",
	),
});

export type CriteriaId = z.infer<typeof CriteriaIdSchema>;
export type CriteriaStatus = z.infer<typeof CriteriaStatusSchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;
