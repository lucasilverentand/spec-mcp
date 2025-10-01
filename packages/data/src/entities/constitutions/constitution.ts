import z from "zod";
import { BaseSchema, computeEntityId } from "../../core/base-entity.js";

export const ConstitutionIdSchema = z.string().regex(/^con-\d{3}-[a-z0-9-]+$/, {
	message: "Constitution ID must follow format: con-XXX-slug-here",
});

export const ArticleIdSchema = z
	.string()
	.regex(/^art-\d{3}$/, {
		message: "Article ID must follow format: art-XXX",
	})
	.describe("Unique identifier for an article");

export const ArticleSchema = z.object({
	id: ArticleIdSchema,
	title: z
		.string()
		.min(1)
		.describe("Article title (e.g., 'Library-First Principle')"),
	principle: z
		.string()
		.min(1)
		.describe("The core principle or rule this article establishes"),
	rationale: z
		.string()
		.min(1)
		.describe("Explanation of why this principle exists and its benefits"),
	examples: z
		.array(z.string())
		.default([])
		.describe("Concrete examples demonstrating the principle"),
	exceptions: z
		.array(z.string())
		.default([])
		.describe("Situations where this principle may not apply"),
});

export const AmendmentIdSchema = z
	.string()
	.regex(/^amd-\d{3}$/, {
		message: "Amendment ID must follow format: amd-XXX",
	})
	.describe("Unique identifier for an amendment");

export const AmendmentSchema = z.object({
	id: AmendmentIdSchema,
	article_id: ArticleIdSchema.describe(
		"Which article this amendment modifies",
	),
	change_description: z
		.string()
		.min(1)
		.describe("Description of what changed"),
	rationale: z
		.string()
		.min(1)
		.describe("Why this amendment was necessary"),
	backwards_compatibility: z
		.string()
		.min(1)
		.describe("Assessment of backwards compatibility impact"),
	approved_by: z
		.array(z.string())
		.default([])
		.describe("List of maintainers who approved this amendment"),
	approved_at: z
		.string()
		.datetime()
		.optional()
		.describe("Timestamp when amendment was approved"),
});

export const ConstitutionAppliesTo = z.enum([
	"all",
	"requirements",
	"components",
	"plans",
	"architecture",
	"testing",
]);

export const ConstitutionStatusSchema = z.enum(["draft", "active", "archived"]);

// Schema for stored constitutions (no ID field)
export const ConstitutionStorageSchema = BaseSchema.extend({
	type: z.literal("constitution"),
	articles: z
		.array(ArticleSchema)
		.min(1)
		.describe("Core principles that govern all development decisions"),
	amendments: z
		.array(AmendmentSchema)
		.default([])
		.describe("Historical amendments to articles"),
	applies_to: z
		.array(ConstitutionAppliesTo)
		.default(["all"])
		.describe("Which specification types this constitution governs"),
	maintainers: z
		.array(z.string())
		.default([])
		.describe("List of maintainers who can approve amendments"),
	review_required: z
		.boolean()
		.default(true)
		.describe("Whether amendments require maintainer review"),
	status: ConstitutionStatusSchema.default("active").describe(
		"Current status of this constitution",
	),
	version: z
		.string()
		.default("1.0.0")
		.describe("Semantic version of this constitution"),
});

// Schema for runtime constitutions (with computed ID)
export const ConstitutionSchema = ConstitutionStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
).describe("Schema for runtime constitutions with computed ID");

export type ConstitutionId = z.infer<typeof ConstitutionIdSchema>;
export type ArticleId = z.infer<typeof ArticleIdSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type AmendmentId = z.infer<typeof AmendmentIdSchema>;
export type Amendment = z.infer<typeof AmendmentSchema>;
export type ConstitutionAppliesTo = z.infer<typeof ConstitutionAppliesTo>;
export type ConstitutionStatus = z.infer<typeof ConstitutionStatusSchema>;
export type Constitution = z.infer<typeof ConstitutionSchema>;
