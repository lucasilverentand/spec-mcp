import z from "zod";

export const ReferenceTypeSchema = z.enum([
	"url",
	"documentation",
	"file",
	"code",
	"other",
]);

const _ReferenceBaseSchema = z.object({
	type: ReferenceTypeSchema.describe("The type of reference"),
	name: z
		.string()
		.min(1)
		.describe("A short, descriptive name for the reference"),
	description: z
		.string()
		.min(1)
		.describe("A brief description of the contents of the reference"),
	importance: z
		.enum(["low", "medium", "high", "critical"])
		.default("medium")
		.describe("The importance level of this reference"),
});

export const ReferenceSchema = z.discriminatedUnion("type", [
	_ReferenceBaseSchema.extend({
		type: z.literal("url"),
		url: z.url(),
		mime_type: z.string().optional(),
	}),
	_ReferenceBaseSchema.extend({
		type: z.literal("documentation"),
		library: z.string().min(1),
		search_term: z.string().min(1),
	}),
	_ReferenceBaseSchema.extend({
		type: z.literal("file"),
		path: z.string().min(1),
	}),
	_ReferenceBaseSchema.extend({
		type: z.literal("code"),
		code: z.string().min(1).describe("The code snippet or example"),
		language: z
			.string()
			.optional()
			.describe("Programming language of the code"),
	}),
	_ReferenceBaseSchema.extend({
		type: z.literal("other"),
	}),
]);

export const ReferencesSchema = z
	.array(ReferenceSchema)
	.default([])
	.describe("List of references related to the item");

export type ReferenceType = z.infer<typeof ReferenceTypeSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
export type References = z.infer<typeof ReferencesSchema>;
