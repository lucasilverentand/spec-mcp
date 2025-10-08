import z from "zod";

export const EntityTypeSchema = z.enum([
	"requirement",
	"plan",
	"app",
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
	created_at: z.iso.datetime().describe("Timestamp when entity was created"),
	updated_at: z.iso
		.datetime()
		.describe("Timestamp when entity was last updated"),
	priority: ItemPrioritySchema.default("medium").describe(
		"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
	),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type EntitySlug = z.infer<typeof EntitySlugSchema>;
export type Base = z.infer<typeof BaseSchema>;

export const EntityTypeShortMap: Record<EntityType, string> = {
	requirement: "req",
	plan: "pln",
	app: "app",
	component: "cmp",
	constitution: "con",
	decision: "dec",
};

export const CompletionStatusSchema = z.object({
	completed: z
		.boolean()
		.default(false)
		.describe("Whether the item has been completed"),
	completed_at: z.iso
		.datetime()
		.nullable()
		.default(null)
		.describe("Timestamp when the item was completed"),
});

export const ItemStatusSchema = z.object({
	verified: z
		.boolean()
		.default(false)
		.describe("Whether the item's completion has been verified by a reviewer"),
	verified_at: z.iso
		.datetime()
		.nullable()
		.default(null)
		.describe("Timestamp when the item was verified"),
	notes: z
		.array(z.string())
		.default([])
		.describe("Log of notes taken during item execution"),
});
