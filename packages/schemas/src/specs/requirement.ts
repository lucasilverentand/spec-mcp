import z from "zod";
import {
	BaseSchema,
	ItemPrioritySchema,
	ItemStatusSchema,
} from "../shared/base.js";

export const AcceptanceCriteriaIdSchema = z
	.string()
	.regex(/^crit-\d{3}$/, {
		message: "ID must follow format: crit-XXX",
	})
	.describe("Unique identifier for the acceptance criteria");

export const AcceptanceCriteriaSchema = z.object({
	id: AcceptanceCriteriaIdSchema,
	description: z
		.string()
		.min(1)
		.describe("Description of the acceptance criteria"),
	status: z
		.enum(["needs-review", "active", "archived"])
		.default("needs-review")
		.describe("Criterion status"),
});

export const RequirementIdSchema = z.string().regex(/^req-\d{3}-[a-z0-9-]+$/, {
	message: "Requirement ID must follow format: req-XXX-slug-here",
});

export const RequirementSchema = BaseSchema.extend({
	type: z.literal("requirement"),
	priority: ItemPrioritySchema.default("medium").describe(
		"Priority level for requirement ordering",
	),
	criteria: z
		.array(AcceptanceCriteriaSchema)
		.min(1)
		.describe("List of acceptance criteria"),
	status: ItemStatusSchema.describe("Current status of the requirement"),
});

export type AcceptanceCriteriaId = z.infer<typeof AcceptanceCriteriaIdSchema>;
export type AcceptanceCriteria = z.infer<typeof AcceptanceCriteriaSchema>;
export type RequirementId = z.infer<typeof RequirementIdSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
