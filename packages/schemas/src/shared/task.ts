import z from "zod";
import { ItemPrioritySchema, ItemStatusSchema } from "./base.js";
import { ReferenceSchema } from "./reference.js";

export const TaskFileIdSchema = z
	.string()
	.regex(/^file-\d{3}$/, {
		message: "File ID must follow format: file-XXX",
	})
	.nonempty();

export const TaskFileSchema = z.object({
	id: TaskFileIdSchema.describe("Unique identifier for the file action"),
	path: z
		.string()
		.regex(/^[\w\-./]+$/, {
			message:
				"File path can only contain letters, numbers, dashes, underscores, dots, and slashes",
		})
		.nonempty()
		.describe("Relative path to the file from the project root"),
	action: z
		.enum(["create", "modify", "delete"])
		.describe("Action to be performed on the file"),
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

export const TaskIdSchema = z
	.string()
	.regex(/^task-\d{3}$/, {
		message: "Task ID must follow format: task-XXX",
	})
	.nonempty();

export const TaskSchema = z.object({
	id: TaskIdSchema.describe("Unique identifier for the task"),
	priority: ItemPrioritySchema.describe(
		"Priority level for task ordering",
	).default("medium"),
	depends_on: z
		.array(TaskIdSchema)
		.default([])
		.describe("Array of task IDs this task depends on"),
	task: z
		.string()
		.min(10)
		.max(300)
		.describe("Clear and concise description of the task to be performed"),
	considerations: z
		.array(z.string().min(10).max(100))
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
	status: ItemStatusSchema.describe("Current status of the task"),
});

export const TasksSchema = z
	.array(TaskSchema)
	.default([])
	.describe("List of tasks to be completed");

export type TaskId = z.infer<typeof TaskIdSchema>;
export type TaskFileId = z.infer<typeof TaskFileIdSchema>;
export type TaskFile = z.infer<typeof TaskFileSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Tasks = z.infer<typeof TasksSchema>;
