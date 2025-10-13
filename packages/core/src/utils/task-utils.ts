/**
 * Task utility functions
 * Extracted from schemas package to maintain separation of concerns
 */

import type { CompletionStatus, Task } from "@spec-mcp/schemas";

/**
 * Task state derived from completion status
 */
export type TaskState =
	| "not-started"
	| "in-progress"
	| "completed"
	| "verified";

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
	].filter((t): t is string => t !== null);

	// Return latest timestamp (they're ISO strings, so lexicographic sort works)
	return timestamps.sort().reverse()[0] ?? status.created_at;
}

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
 * Check if a task is currently blocked by incomplete dependencies
 * Blocking is computed from the depends_on field, not stored
 */
export function isTaskBlocked(task: Task, allTasks: Task[]): boolean {
	if (!task.depends_on || task.depends_on.length === 0) {
		return false;
	}

	// A task is blocked if it has any incomplete dependencies
	return task.depends_on.some((depId) => {
		const dep = allTasks.find((t) => t.id === depId);
		if (!dep) {
			return false; // Dependency doesn't exist, not blocking
		}
		const depState = getTaskState(dep.status);
		return depState !== "completed" && depState !== "verified";
	});
}

/**
 * Get list of task IDs that are blocking this task
 */
export function getBlockingTasks(task: Task, allTasks: Task[]): string[] {
	if (!task.depends_on || task.depends_on.length === 0) {
		return [];
	}

	return task.depends_on.filter((depId) => {
		const dep = allTasks.find((t) => t.id === depId);
		if (!dep) {
			return false;
		}
		const depState = getTaskState(dep.status);
		return depState !== "completed" && depState !== "verified";
	});
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
