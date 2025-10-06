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

export const ArticleStatusSchema = z
	.enum(["needs-review", "active", "archived"])
	.describe("Article status");

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
	status: ArticleStatusSchema.default("needs-review").describe(
		"Article status: needs-review (drafted), active (approved), archived (no longer in effect)",
	),
});

// Schema for stored constitutions (no ID field)
export const ConstitutionStorageSchema = BaseSchema.extend({
	type: z.literal("constitution"),
	articles: z
		.array(ArticleSchema)
		.min(1)
		.describe("Core principles that govern all development decisions"),
}).strict();

// Schema for runtime constitutions (with computed ID)
export const ConstitutionSchema = ConstitutionStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
).describe("Schema for runtime constitutions with computed ID");

export type ConstitutionId = z.infer<typeof ConstitutionIdSchema>;
export type ArticleId = z.infer<typeof ArticleIdSchema>;
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type Constitution = z.infer<typeof ConstitutionSchema>;
