import z from "zod";

export const EntityTypeSchema = z.enum([
	"business-requirement",
	"technical-requirement",
	"plan",
	"component",
	"constitution",
	"decision",
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
export type Base = z.infer<typeof BaseSchema>;

export const EntityTypeShortMap: Record<EntityType, string> = {
	"business-requirement": "breq",
	"technical-requirement": "treq",
	plan: "pln",
	component: "cmp",
	constitution: "con",
	decision: "dec",
};
