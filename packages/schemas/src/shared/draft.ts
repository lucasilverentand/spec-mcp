import z from "zod";
import { EntityTypeSchema } from "./base";

export const DraftQuestionSchema = z.object({
	id: z.string().min(1).describe("Unique identifier for the question"),
	question: z.string().min(1).describe("The question being asked in the draft"),
	answer: z
		.string()
		.min(1)
		.nullable()
		.default(null)
		.describe("The answer provided for the question"),
	optional: z
		.boolean()
		.optional()
		.describe("Whether this question is optional and can be skipped"),
	skipped: z
		.boolean()
		.optional()
		.describe("Whether this optional question was explicitly skipped"),
});

export const DraftSchema = z.object({
	id: z
		.string()
		.regex(/^draft-\d{3}$/, {
			message: "Draft ID must follow format: draft-XXX",
		})
		.describe("Unique identifier for the draft"),
	type: EntityTypeSchema.describe("Type of entity being created"),
	name: z.string().min(1).describe("Name of the entity being created"),
	slug: z
		.string()
		.min(1)
		.describe("URL-friendly identifier auto-generated from name"),
	questions: z
		.array(DraftQuestionSchema)
		.min(1)
		.describe("List of questions and answers in the draft"),
	created_at: z
		.string()
		.datetime()
		.describe("Timestamp when the draft was created"),
});

export type DraftQuestion = z.infer<typeof DraftQuestionSchema>;
export type Draft = z.infer<typeof DraftSchema>;
