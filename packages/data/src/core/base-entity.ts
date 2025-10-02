import z from "zod";

export const EntityTypeSchema = z.enum([
	"requirement",
	"plan",
	"app",
	"service",
	"library",
	"tool",
	"constitution",
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

// Base schema for stored entities (on disk) - no ID field as it's derived
export const BaseSchema = z.object({
	type: EntityTypeSchema.describe("Type of the entity"),
	number: z.number().int().nonnegative().describe("Unique sequential number"),
	slug: EntitySlugSchema.describe("URL-friendly identifier"),
	name: z.string().min(1).describe("Display name of the entity"),
	description: z.string().min(1).describe("Detailed description of the entity"),
	created_at: z
		.string()
		.datetime()
		.describe("Timestamp when entity was created"),
	updated_at: z
		.string()
		.datetime()
		.describe("Timestamp when entity was last updated"),
});

// Base schema with computed ID field (for runtime use)
export const BaseWithIdSchema = BaseSchema.extend({
	id: z.string().min(1).describe("Computed unique identifier for the entity"),
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type EntitySlug = z.infer<typeof EntitySlugSchema>;
export type Base = z.infer<typeof BaseSchema>;

export const EntityTypeShortMap: Record<EntityType, string> = {
	requirement: "req",
	plan: "pln",
	app: "app",
	service: "svc",
	library: "lib",
	constitution: "con",
};

export function shortenEntityType(type: EntityType): string {
	return EntityTypeShortMap[type] ?? type.slice(0, 3);
}

// Helper function to compute entity ID from type, number, and slug
export const computeEntityId = (
	type: EntityType,
	number: number,
	slug: string,
): string => {
	const prefix = shortenEntityType(type);
	const paddedNumber = number.toString().padStart(3, "0");
	return `${prefix}-${paddedNumber}-${slug}`;
};
