import z from "zod";
import { EntityTypeSchema } from "./base";

export const DraftQuestionSchema = z.object({
	id: z.string().min(1).describe("Unique identifier for the question"),
	title: z
		.string()
		.min(1)
		.describe("Short title for the question when rendering summary"),
	question: z.string().min(1).describe("The question being asked in the draft"),
	answer: z
		.string()
		.min(1)
		.nullable()
		.default(null)
		.describe("The answer provided for the question"),
});

export const BaseDraftSchema = z.object({
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

// Task schema for plan drafts
export const DraftTaskSchema = z.object({
	id: z
		.string()
		.regex(/^temp-task-\d{3}$/, {
			message: "Draft task ID must follow format: temp-task-XXX",
		})
		.describe("Temporary task ID during draft phase"),
	title: z.string().min(1).describe("Short title/name of the task"),
	description: z.string().min(1).describe("Detailed description of the task"),
	acceptance_criteria: z
		.string()
		.nullable()
		.default(null)
		.describe("Criteria to consider the task complete"),
});

// Plan-specific draft schema with tasks collection
export const PlanDraftSchema = BaseDraftSchema.extend({
	type: z.literal("plan"),
	tasks: z
		.array(DraftTaskSchema)
		.default([])
		.describe("Collection of tasks being built during draft phase"),
	taskTitles: z
		.array(z.string())
		.default([])
		.describe("Queue of task titles to process (from initial prompt)"),
	currentTaskIndex: z
		.number()
		.int()
		.nonnegative()
		.default(0)
		.describe("Index of the current task being detailed"),
});

// Union type for all draft types
export const DraftSchema = z.discriminatedUnion("type", [
	PlanDraftSchema,
	BaseDraftSchema.extend({ type: z.literal("requirement") }),
	BaseDraftSchema.extend({ type: z.literal("component") }),
	BaseDraftSchema.extend({ type: z.literal("constitution") }),
	BaseDraftSchema.extend({ type: z.literal("decision") }),
	BaseDraftSchema.extend({ type: z.literal("app") }),
]);

export type DraftQuestion = z.infer<typeof DraftQuestionSchema>;
export type BaseDraft = z.infer<typeof BaseDraftSchema>;
export type DraftTask = z.infer<typeof DraftTaskSchema>;
export type PlanDraft = z.infer<typeof PlanDraftSchema>;
export type Draft = z.infer<typeof DraftSchema>;
