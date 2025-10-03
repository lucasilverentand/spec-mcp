import z from "zod";
import { ReferenceSchema } from "./reference-schema.js";

export const TaskIdSchema = z
	.string()
	.regex(/^task-\d{3}$/, {
		message: "Task ID must follow format: task-XXX",
	})
	.nonempty();

export const TaskPrioritySchema = z.enum([
	"critical",
	"high",
	"medium",
	"low",
]);

export const FileActionSchema = z.enum(["create", "modify", "delete"]);

export const TaskFileSchema = z.object({
	path: z
		.string()
		.regex(/^[\w\-./]+$/, {
			message:
				"File path can only contain letters, numbers, dashes, underscores, dots, and slashes",
		})
		.nonempty()
		.describe("Relative path to the file from the project root"),
	action: FileActionSchema.describe("Action to be performed on the file"),
	action_description: z
		.string()
		.nonempty()
		.optional()
		.describe("Description of what changes will be made to the file"),
	applied: z
		.boolean()
		.default(false)
		.describe("Whether the file action has been applied"),
});

const _TaskDetailsSchema = z.object({
	priority: TaskPrioritySchema.describe(
		"Priority level for task ordering",
	).default("medium"),
	depends_on: z
		.array(TaskIdSchema)
		.default([])
		.describe("Array of task IDs this task depends on"),
	description: z
		.string()
		.min(1)
		.describe("Detailed explanation of how to complete the task"),
	considerations: z
		.array(z.string())
		.default([])
		.describe("Things to consider while performing the task"),
	references: z
		.array(ReferenceSchema)
		.default([])
		.describe("External references for additional context or information"),
	files: z
		.array(TaskFileSchema)
		.default([])
		.describe("Files that will be created or modified as part of the task"),
});

const _TaskStatusSchema = z.object({
	completed: z
		.boolean()
		.default(false)
		.describe("Whether the task has been completed"),
	completed_at: z
		.string()
		.datetime()
		.optional()
		.describe("Timestamp when the task was completed"),
	verified: z
		.boolean()
		.default(false)
		.describe("Whether the task has been verified"),
	verified_at: z
		.string()
		.datetime()
		.optional()
		.describe("Timestamp when the task was verified"),
	notes: z
		.array(z.string())
		.default([])
		.describe("Log of notes taken during task execution"),
});

export const TaskSchema = z
	.object({
		id: TaskIdSchema.describe("Unique identifier for the task"),
	})
	.extend(_TaskDetailsSchema.shape)
	.extend(_TaskStatusSchema.shape);

export type TaskId = z.infer<typeof TaskIdSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type FileAction = z.infer<typeof FileActionSchema>;
export type TaskFile = z.infer<typeof TaskFileSchema>;
export type Task = z.infer<typeof TaskSchema>;
