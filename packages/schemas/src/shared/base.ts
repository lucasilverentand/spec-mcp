import z from "zod";

export const EntityTypeSchema = z.enum([
	"business-requirement",
	"technical-requirement",
	"plan",
	"component",
	"constitution",
	"decision",
	"milestone",
]);

export const EntitySlugSchema = z
	.string()
	.min(1)
	.transform(
		(val) =>
			val
				.trim()
				.replace(/^-+/, "") // remove leading dashes
				.replace(/-+$/, "") // remove trailing dashes
				.replace(/--+/g, "-"), // replace double or more dashes with single dash
	)
	.pipe(
		z
			.string()
			.min(1)
			.regex(/^[a-z0-9-]+$/, {
				message:
					"Slug must contain only lowercase letters, numbers, and single dashes",
			}),
	);

export const ItemPrioritySchema = z.enum([
	"critical",
	"high",
	"medium",
	"low",
	"nice-to-have",
]);

export const BaseSchema = z.object({
	type: EntityTypeSchema.describe("Type of the entity"),
	number: z.number().int().nonnegative().describe("Unique sequential number"),
	slug: EntitySlugSchema.describe("URL-friendly identifier"),
	name: z.string().min(1).describe("Display name of the entity"),
	description: z.string().min(1).describe("Detailed description of the entity"),
	priority: ItemPrioritySchema.default("medium").describe(
		"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
	),
	created_at: z
		.string()
		.datetime()
		.describe("Timestamp when entity was created"),
	updated_at: z
		.string()
		.datetime()
		.describe("Timestamp when entity was last updated"),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type EntitySlug = z.infer<typeof EntitySlugSchema>;
export type ItemPriority = z.infer<typeof ItemPrioritySchema>;
export type Base = z.infer<typeof BaseSchema>;

/**
 * @deprecated Use ENTITY_TYPE_TO_PREFIX from @spec-mcp/utils instead
 * This export is kept for backward compatibility
 */
export const EntityTypeShortMap: Record<EntityType, string> = {
	"business-requirement": "brd",
	"technical-requirement": "prd",
	plan: "pln",
	component: "cmp",
	constitution: "con",
	decision: "dec",
	milestone: "mls",
};
