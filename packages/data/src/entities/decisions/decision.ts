import z from "zod";
import { BaseSchema, computeEntityId } from "../../core/base-entity.js";
import { ReferenceSchema } from "../shared/index.js";
import { ComponentIdSchema } from "../components/component.js";
import { RequirementIdSchema } from "../requirements/requirement.js";
import { PlanIdSchema } from "../plans/plan.js";

export const DecisionIdSchema = z.string().regex(/^dec-\d{3}-[a-z0-9-]+$/, {
	message: "Decision ID must follow format: dec-XXX-slug-here",
});

export const DecisionStatusSchema = z.enum([
	"proposed",
	"accepted",
	"deprecated",
	"superseded",
]);

export const ConsequencesSchema = z.object({
	positive: z
		.array(z.string())
		.default([])
		.describe("Beneficial outcomes of this decision"),
	negative: z
		.array(z.string())
		.default([])
		.describe("Drawbacks or costs of this decision"),
	risks: z
		.array(z.string())
		.default([])
		.describe("Potential risks associated with this decision"),
	mitigation: z
		.array(z.string())
		.default([])
		.describe("Strategies to mitigate identified risks"),
});

// Full article reference format: con-XXX-slug/art-XXX
export const ArticleReferenceSchema = z
	.string()
	.regex(/^con-\d{3}-[a-z0-9-]+\/art-\d{3}$/, {
		message: "Article reference must follow format: con-XXX-slug/art-XXX",
	})
	.describe("Reference to a constitution article");

// Schema for stored decisions (no ID field)
export const DecisionStorageSchema = BaseSchema.extend({
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
	consequences: ConsequencesSchema.describe(
		"Positive and negative outcomes, risks, and mitigation strategies",
	),
	affects_components: z
		.array(ComponentIdSchema)
		.default([])
		.describe("Components impacted by this decision"),
	affects_requirements: z
		.array(RequirementIdSchema)
		.default([])
		.describe("Requirements related to this decision"),
	affects_plans: z
		.array(PlanIdSchema)
		.default([])
		.describe("Plans impacted by this decision"),
	informed_by_articles: z
		.array(ArticleReferenceSchema)
		.default([])
		.describe(
			"Constitution articles that informed this decision (format: con-XXX-slug/art-XXX)",
		),
	supersedes: DecisionIdSchema.optional().describe(
		"Previous decision this replaces",
	),
	references: z
		.array(ReferenceSchema)
		.default([])
		.describe("Supporting documentation, research, benchmarks"),
}).strict();

// Schema for runtime decisions (with computed ID)
export const DecisionSchema = DecisionStorageSchema.transform((data) => ({
	...data,
	id: computeEntityId(data.type, data.number, data.slug),
})).describe("Schema for runtime decisions with computed ID");

export type DecisionId = z.infer<typeof DecisionIdSchema>;
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;
export type Consequences = z.infer<typeof ConsequencesSchema>;
export type ArticleReference = z.infer<typeof ArticleReferenceSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
