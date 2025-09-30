import z from "zod";
import { BaseSchema, computeEntityId } from "../../core/base-entity.js";

export const RequirementIdSchema = z.string().regex(/^req-\d{3}-[a-z0-9-]+$/, {
	message: "Requirement ID must follow format: req-XXX-slug-here",
});

export const AcceptanceCriteriaIdSchema = z
	.string()
	.regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/, {
		message: "ID must follow format: req-XXX-slug/crit-XXX",
	})
	.describe("Unique identifier for the acceptance criteria");

export const AcceptanceCriteriaSchema = z.object({
	id: AcceptanceCriteriaIdSchema,
	description: z
		.string()
		.min(1)
		.describe("Description of the acceptance criteria"),
});

// Schema for stored requirements (no ID field)
export const RequirementStorageSchema = BaseSchema.extend({
	type: z.literal("requirement"),
	priority: z
		.enum(["critical", "required", "ideal", "optional"])
		.default("required"),
	criteria: z
		.array(AcceptanceCriteriaSchema)
		.min(1)
		.describe("List of acceptance criteria"),
})
	.refine(
		(data) =>
			data.criteria.every((crit) =>
				crit.id.startsWith(`req-${data.number.toString().padStart(3, "0")}`),
			),
		{
			message: "All criteria IDs must start with the parent requirement ID",
		},
	)
	.describe("Schema for stored requirements");

// Schema for runtime requirements (with computed ID)
export const RequirementSchema = RequirementStorageSchema.transform((data) => ({
	...data,
	id: computeEntityId(data.type, data.number, data.slug),
})).describe("Schema for runtime requirements with computed ID");

export type RequirementId = z.infer<typeof RequirementIdSchema>;
export type AcceptanceCriteria = z.infer<typeof AcceptanceCriteriaSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
