import z from "zod";
import { BaseSchema } from "../shared/base";
import { ReferenceSchema } from "../shared/reference";

export const DecisionIdSchema = z.string().regex(/^dec-\d{3}-[a-z0-9-]+$/, {
	message: "Decision ID must follow format: dec-XXX-slug-here",
});

export const DecisionStatusSchema = z.enum([
	"proposed",
	"accepted",
	"deprecated",
	"superseded",
]);

export const ConsequenceTypeSchema = z.enum(["positive", "negative", "risk"]);

export const ConsequenceSchema = z.object({
	type: ConsequenceTypeSchema.describe("Type of consequence"),
	description: z
		.string()
		.min(10)
		.max(300)
		.describe("Description of the consequence"),
	mitigation: z
		.string()
		.min(10)
		.max(300)
		.optional()
		.describe("Mitigation strategy for negative consequences or risks"),
});

// Schema for stored decisions (no ID field)
export const DecisionSchema = BaseSchema.extend({
	type: z.literal("decision"),
	decision: z
		.string()
		.min(20)
		.max(500)
		.describe("Clear statement of what was decided"),
	context: z
		.string()
		.min(20)
		.max(1000)
		.describe("Situation or problem that prompted this decision"),
	status: DecisionStatusSchema.default("proposed").describe(
		"Current status of this decision",
	),
	alternatives: z
		.array(z.string())
		.default([])
		.describe("Options considered but not chosen"),
	supersedes: DecisionIdSchema.optional().describe(
		"Previous decision this replaces",
	),
	references: z
		.array(ReferenceSchema)
		.default([])
		.describe("Supporting documentation, research, benchmarks"),
	consequences: z
		.array(ConsequenceSchema)
		.default([])
		.describe("Positive and negative consequences of this decision"),
});

export type DecisionId = z.infer<typeof DecisionIdSchema>;
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;
export type ConsequenceType = z.infer<typeof ConsequenceTypeSchema>;
export type Consequence = z.infer<typeof ConsequenceSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
