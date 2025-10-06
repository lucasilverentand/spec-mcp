import z from "zod";

export const ReferenceTypeSchema = z.enum([
	"url",
	"documentation",
	"file",
	"code",
	"other",
]);

export const ReferenceBaseSchema = z.object({
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

const _UrlReferenceSchema = ReferenceBaseSchema.extend({
	type: z.literal("url"),
	url: z.string().url(),
	mime_type: z.string().optional(),
});

const _DocumentationReferenceSchema = ReferenceBaseSchema.extend({
	type: z.literal("documentation"),
	library: z.string().min(1),
	search_term: z.string().min(1),
});

const _FileReferenceSchema = ReferenceBaseSchema.extend({
	type: z.literal("file"),
	path: z.string().min(1),
});

const _CodeReferenceSchema = ReferenceBaseSchema.extend({
	type: z.literal("code"),
	code: z.string().min(1).describe("The code snippet or example"),
	language: z.string().optional().describe("Programming language of the code"),
});

const _OtherReferenceSchema = ReferenceBaseSchema.extend({
	type: z.literal("other"),
});

export const ReferenceSchema = z.discriminatedUnion("type", [
	_UrlReferenceSchema,
	_DocumentationReferenceSchema,
	_FileReferenceSchema,
	_CodeReferenceSchema,
	_OtherReferenceSchema,
]);

export type ReferenceType = z.infer<typeof ReferenceTypeSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
