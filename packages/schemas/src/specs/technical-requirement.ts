import z from "zod";
import { BaseSchema } from "../shared/base.js";
import { CriteriaSchema } from "../shared/criteria.js";
import { ReferenceSchema } from "../shared/reference.js";

export const TechnicalRequirementIdSchema = z
	.string()
	.regex(/^prd-\d{3}-[a-z0-9-]+$/, {
		message: "Technical Requirement ID must follow format: trq-XXX-slug-here",
	})
	.describe("Unique identifier for the technical requirement");

export const ConstraintSchema = z.object({
	type: z
		.enum([
			"performance",
			"security",
			"scalability",
			"compatibility",
			"infrastructure",
			"other",
		])
		.describe("Type of technical constraint"),
	description: z.string().min(1).describe("Description of the constraint"),
});

export const TechnicalRequirementSchema = BaseSchema.extend({
	type: z.literal("technical-requirement").describe("Entity type"),
	technical_context: z
		.string()
		.min(1)
		.describe("Technical context, background, or rationale"),
	implementation_approach: z
		.string()
		.optional()
		.describe("High-level description of implementation approach"),
	technical_dependencies: z
		.array(ReferenceSchema)
		.default([])
		.describe("Technical dependencies (libraries, frameworks, APIs, systems)"),
	constraints: z
		.array(ConstraintSchema)
		.default([])
		.describe("Technical constraints to consider"),
	implementation_notes: z
		.string()
		.optional()
		.describe("Additional implementation notes or considerations"),
	criteria: z
		.array(CriteriaSchema)
		.min(1)
		.describe("Technical acceptance criteria that must be met"),
	references: z
		.array(ReferenceSchema)
		.default([])
		.describe("External references, documentation, or resources"),
});

export type TechnicalRequirementId = z.infer<
	typeof TechnicalRequirementIdSchema
>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type TechnicalRequirement = z.infer<typeof TechnicalRequirementSchema>;
