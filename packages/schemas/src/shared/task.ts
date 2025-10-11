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
	.regex(/^task-\d{3}$/, {
		message: "Task ID must follow format: task-XXX",
	})
	.nonempty();

/**
 * Note/event with timestamp for audit trail
 */
export const StatusNoteSchema = z.object({
	text: z.string().min(1).describe("Note content"),
	timestamp: z.string().datetime().describe("When the note was added"),
});

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

export const BlockedReasonSchema = z.object({
	reason: z
		.string()
		.min(10)
		.describe("Clear description of why this task is blocked"),
	blocked_by: z
		.array(TaskIdSchema)
		.default([])
		.describe("IDs of tasks that are blocking this one (if applicable)"),
	external_dependency: z
		.string()
		.optional()
		.describe(
			"External factor blocking this task (e.g., 'Waiting for API access', 'Legal review pending')",
		),
	blocked_at: z
		.string()
		.datetime()
		.describe("Timestamp when the task became blocked"),
	resolved_at: z
		.string()
		.datetime()
		.nullable()
		.default(null)
		.describe("Timestamp when the blocker was resolved"),
});

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
	blocked: z
		.array(BlockedReasonSchema)
		.default([])
		.describe(
			"List of blocking issues (current and historical). Only unresolved blocks (resolved_at is null) are active.",
		),
	// Supersession tracking - for audit trail and updates
	supersedes: TaskIdSchema.nullable()
		.default(null)
		.describe("ID of the task this replaces (if any)"),
	superseded_by: TaskIdSchema.nullable()
		.default(null)
		.describe("ID of the task that replaces this (if superseded)"),
	superseded_at: z
		.string()
		.datetime()
		.nullable()
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
export type BlockedReason = z.infer<typeof BlockedReasonSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Tasks = z.infer<typeof TasksSchema>;

/**
 * Computed property: Get whether item is completed
 * Replaces the old `completed` boolean field
 */
export function isCompleted(status: CompletionStatus): boolean {
	return status.completed_at !== null;
}

/**
 * Computed property: Get whether item is verified
 * Replaces the old `verified` boolean field
 */
export function isVerified(status: CompletionStatus): boolean {
	return status.verified_at !== null;
}

/**
 * Computed property: Get the last updated timestamp
 * Replaces the old `updated_at` field
 */
export function getUpdatedAt(status: CompletionStatus): string {
	const timestamps = [
		status.created_at,
		status.started_at,
		status.completed_at,
		status.verified_at,
		...status.notes.map((n) => n.timestamp),
	].filter((t): t is string => t !== null);

	// Return latest timestamp (they're ISO strings, so lexicographic sort works)
	// Safe to use ! because created_at is always in the array
	return timestamps.sort().reverse()[0] ?? status.created_at;
}

/**
 * Task state derived from completion status
 */
export type TaskState =
	| "not-started"
	| "in-progress"
	| "completed"
	| "verified";

/**
 * Calculate the current state of a task from its status
 * This is the single source of truth for task state
 */
export function getTaskState(status: CompletionStatus): TaskState {
	if (isVerified(status)) {
		return "verified";
	}
	if (isCompleted(status)) {
		return "completed";
	}
	if (status.started_at !== null) {
		return "in-progress";
	}
	return "not-started";
}

/**
 * Check if a task can be started based on dependencies
 */
export function canStartTask(
	task: Task,
	allTasks: Task[],
): { canStart: boolean; reason?: string } {
	// Already started or completed
	const state = getTaskState(task.status);
	if (state !== "not-started") {
		return {
			canStart: false,
			reason: `Task is already ${state}`,
		};
	}

	// Check dependencies
	if (task.depends_on && task.depends_on.length > 0) {
		const uncompletedDeps = task.depends_on.filter((depId) => {
			const dep = allTasks.find((t) => t.id === depId);
			return (
				dep &&
				getTaskState(dep.status) !== "completed" &&
				getTaskState(dep.status) !== "verified"
			);
		});

		if (uncompletedDeps.length > 0) {
			return {
				canStart: false,
				reason: `Depends on uncompleted tasks: ${uncompletedDeps.join(", ")}`,
			};
		}
	}

	return { canStart: true };
}

/**
 * Check if a task can be completed
 */
export function canCompleteTask(
	task: Task,
	allTasks: Task[],
): { canComplete: boolean; reason?: string } {
	// Already completed
	const state = getTaskState(task.status);
	if (state === "completed" || state === "verified") {
		return {
			canComplete: false,
			reason: `Task is already ${state}`,
		};
	}

	// Check if blocked
	if (isTaskBlocked(task)) {
		const activeBlocks = getActiveBlocks(task);
		return {
			canComplete: false,
			reason: `Task is blocked: ${activeBlocks.map((b) => b.reason).join("; ")}`,
		};
	}

	// Check dependencies (same as starting)
	if (task.depends_on && task.depends_on.length > 0) {
		const uncompletedDeps = task.depends_on.filter((depId) => {
			const dep = allTasks.find((t) => t.id === depId);
			return (
				dep &&
				getTaskState(dep.status) !== "completed" &&
				getTaskState(dep.status) !== "verified"
			);
		});

		if (uncompletedDeps.length > 0) {
			return {
				canComplete: false,
				reason: `Depends on uncompleted tasks: ${uncompletedDeps.join(", ")}`,
			};
		}
	}

	return { canComplete: true };
}

/**
 * Check if a task is currently blocked
 */
export function isTaskBlocked(task: Task): boolean {
	return getActiveBlocks(task).length > 0;
}

/**
 * Get all active (unresolved) blocks for a task
 */
export function getActiveBlocks(task: Task): BlockedReason[] {
	return task.blocked.filter((b) => b.resolved_at === null);
}

/**
 * Get all resolved blocks for a task (historical)
 */
export function getResolvedBlocks(task: Task): BlockedReason[] {
	return task.blocked.filter((b) => b.resolved_at !== null);
}

/**
 * Check if a task can be started (updated to check blocking)
 */
export function canStartTaskWithBlocking(
	task: Task,
	allTasks: Task[],
): { canStart: boolean; reason?: string } {
	const basicCheck = canStartTask(task, allTasks);
	if (!basicCheck.canStart) {
		return basicCheck;
	}

	// Check if blocked
	if (isTaskBlocked(task)) {
		const activeBlocks = getActiveBlocks(task);
		return {
			canStart: false,
			reason: `Task is blocked: ${activeBlocks.map((b) => b.reason).join("; ")}`,
		};
	}

	return { canStart: true };
}

/**
 * Check if a task is currently active (not superseded)
 */
export function isActiveTask(task: Task): boolean {
	return task.superseded_by === null;
}

/**
 * Get all active (non-superseded) tasks from a list
 */
export function getActiveTasks(tasks: Task[]): Task[] {
	return tasks.filter(isActiveTask);
}

/**
 * Get the supersession history for a task (walking backwards)
 */
export function getTaskHistory(tasks: Task[], taskId: string): Task[] {
	const history: Task[] = [];
	let current = tasks.find((t) => t.id === taskId);

	// Walk backwards through supersedes chain
	while (current?.supersedes) {
		const prev = tasks.find((t) => t.id === current?.supersedes);
		if (prev) {
			history.unshift(prev);
			current = prev;
		} else {
			break;
		}
	}

	// Add the current task at the end
	if (current) {
		history.push(current);
	}

	return history;
}

/**
 * Get the latest version of a task (following superseded_by chain)
 */
export function getLatestTask(tasks: Task[], taskId: string): Task | null {
	let current = tasks.find((t) => t.id === taskId);

	// Walk forwards through superseded_by chain
	while (current?.superseded_by) {
		const next = tasks.find((t) => t.id === current?.superseded_by);
		if (next) {
			current = next;
		} else {
			break;
		}
	}

	return current || null;
}
