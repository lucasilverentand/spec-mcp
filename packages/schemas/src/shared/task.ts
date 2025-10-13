import z from "zod";
import { ItemPrioritySchema } from "./base.js";
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
	.regex(/^tsk-\d{3}$/, {
		message: "Task ID must follow format: tsk-XXX",
	})
	.nonempty();

/**
 * Note/event for audit trail (simple string format)
 */
export const StatusNoteSchema = z.string().min(1).describe("Note content");

/**
 * Minimal completion status - stores only timestamps, everything else computed
 */
export const CompletionStatusSchema = z
	.object({
		created_at: z
			.string()
			.datetime()
			.describe("Timestamp when the item was created"),
		started_at: z
			.string()
			.datetime()
			.nullable()
			.default(null)
			.describe("Timestamp when work on the item was started"),
		completed_at: z
			.string()
			.datetime()
			.nullable()
			.default(null)
			.describe("Timestamp when the item was completed"),
		verified_at: z
			.string()
			.datetime()
			.nullable()
			.default(null)
			.describe("Timestamp when the item was verified"),
		notes: z
			.array(StatusNoteSchema)
			.default([])
			.describe("Log of timestamped notes taken during item execution"),
	})
	.refine(
		(data) => {
			// Timestamps must be in chronological order
			const timestamps = [
				data.created_at,
				data.started_at,
				data.completed_at,
				data.verified_at,
			].filter((t): t is string => t !== null);

			// Check if sorted
			for (let i = 0; i < timestamps.length - 1; i++) {
				// Safe to use ! here because we're checking length - 1
				if (timestamps[i]! > timestamps[i + 1]!) {
					return false;
				}
			}

			return true;
		},
		{
			message:
				"Timestamps must be in chronological order: created_at <= started_at <= completed_at <= verified_at",
		},
	);

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
	status: CompletionStatusSchema.describe("Current status of the task"),
	supersedes: TaskIdSchema.nullish()
		.default(null)
		.describe("ID of the task this replaces (if any)"),
	superseded_by: TaskIdSchema.nullish()
		.default(null)
		.describe("ID of the task that replaces this (if superseded)"),
	superseded_at: z
		.string()
		.datetime()
		.nullish()
		.default(null)
		.describe("Timestamp when this task was superseded"),
});

export const TasksSchema = z
	.array(TaskSchema)
	.default([])
	.describe("List of tasks to be completed");

export type TaskId = z.infer<typeof TaskIdSchema>;
export type TaskFileId = z.infer<typeof TaskFileIdSchema>;
export type TaskFile = z.infer<typeof TaskFileSchema>;
export type StatusNote = z.infer<typeof StatusNoteSchema>;
export type CompletionStatus = z.infer<typeof CompletionStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Tasks = z.infer<typeof TasksSchema>;

// Note: All task utility functions have been moved to @spec-mcp/core/utils/task-utils
// Import them from there instead:
//   import { isCompleted, getTaskState, canStartTask, etc } from "@spec-mcp/core";
