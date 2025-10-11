import { describe, expect, it } from "vitest";
import type { Task } from "./task.js";
import {
	canCompleteTask,
	canStartTaskWithBlocking,
	getActiveBlocks,
	getResolvedBlocks,
	isTaskBlocked,
} from "./task.js";

describe("Task Blocking", () => {
	const createTask = (id: string, blocked: Task["blocked"] = []): Task => {
		const now = "2025-01-01T10:00:00Z";
		return {
			id,
			priority: "medium",
			depends_on: [],
			task: `Task ${id}`,
			considerations: [],
			references: [],
			files: [],
			status: {
				created_at: now,
				updated_at: now,
				started_at: null,
				completed: false,
				completed_at: null,
				verified: false,
				verified_at: null,
				notes: [],
			},
			blocked,
		};
	};

	describe("isTaskBlocked", () => {
		it("should return false for task with no blocks", () => {
			const task = createTask("task-001");
			expect(isTaskBlocked(task)).toBe(false);
		});

		it("should return true for task with active block", () => {
			const task = createTask("task-001", [
				{
					reason: "Waiting for API access credentials",
					blocked_by: [],
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: null,
				},
			]);
			expect(isTaskBlocked(task)).toBe(true);
		});

		it("should return false for task with only resolved blocks", () => {
			const task = createTask("task-001", [
				{
					reason: "Waiting for API access credentials",
					blocked_by: [],
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: "2025-01-01T11:00:00Z",
				},
			]);
			expect(isTaskBlocked(task)).toBe(false);
		});

		it("should return true if any block is unresolved", () => {
			const task = createTask("task-001", [
				{
					reason: "Waiting for API access credentials",
					blocked_by: [],
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: "2025-01-01T11:00:00Z",
				},
				{
					reason: "Legal review in progress",
					blocked_by: [],
					blocked_at: "2025-01-01T12:00:00Z",
					resolved_at: null,
				},
			]);
			expect(isTaskBlocked(task)).toBe(true);
		});
	});

	describe("getActiveBlocks", () => {
		it("should return empty array for task with no blocks", () => {
			const task = createTask("task-001");
			expect(getActiveBlocks(task)).toEqual([]);
		});

		it("should return active blocks only", () => {
			const activeBlock = {
				reason: "Legal review in progress",
				blocked_by: [],
				blocked_at: "2025-01-01T12:00:00Z",
				resolved_at: null,
			};

			const task = createTask("task-001", [
				{
					reason: "Waiting for API access credentials",
					blocked_by: [],
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: "2025-01-01T11:00:00Z",
				},
				activeBlock,
			]);

			const active = getActiveBlocks(task);
			expect(active).toHaveLength(1);
			expect(active[0]).toEqual(activeBlock);
		});
	});

	describe("getResolvedBlocks", () => {
		it("should return empty array for task with no resolved blocks", () => {
			const task = createTask("task-001", [
				{
					reason: "Legal review in progress",
					blocked_by: [],
					blocked_at: "2025-01-01T12:00:00Z",
					resolved_at: null,
				},
			]);
			expect(getResolvedBlocks(task)).toEqual([]);
		});

		it("should return resolved blocks only", () => {
			const resolvedBlock = {
				reason: "Waiting for API access credentials",
				blocked_by: [],
				blocked_at: "2025-01-01T10:00:00Z",
				resolved_at: "2025-01-01T11:00:00Z",
			};

			const task = createTask("task-001", [
				resolvedBlock,
				{
					reason: "Legal review in progress",
					blocked_by: [],
					blocked_at: "2025-01-01T12:00:00Z",
					resolved_at: null,
				},
			]);

			const resolved = getResolvedBlocks(task);
			expect(resolved).toHaveLength(1);
			expect(resolved[0]).toEqual(resolvedBlock);
		});
	});

	describe("canStartTaskWithBlocking", () => {
		it("should not allow starting a blocked task", () => {
			const task = createTask("task-001", [
				{
					reason: "Waiting for API access credentials",
					blocked_by: [],
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: null,
				},
			]);

			const { canStart, reason } = canStartTaskWithBlocking(task, [task]);
			expect(canStart).toBe(false);
			expect(reason).toContain("blocked");
			expect(reason).toContain("API access credentials");
		});

		it("should allow starting a task with only resolved blocks", () => {
			const task = createTask("task-001", [
				{
					reason: "Waiting for API access credentials",
					blocked_by: [],
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: "2025-01-01T11:00:00Z",
				},
			]);

			const { canStart } = canStartTaskWithBlocking(task, [task]);
			expect(canStart).toBe(true);
		});

		it("should handle task blocked by other tasks", () => {
			const task = createTask("task-002", [
				{
					reason: "Waiting for task-001 to be completed",
					blocked_by: ["task-001"],
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: null,
				},
			]);

			const { canStart, reason } = canStartTaskWithBlocking(task, [task]);
			expect(canStart).toBe(false);
			expect(reason).toContain("blocked");
		});
	});

	describe("canCompleteTask with blocking", () => {
		it("should not allow completing a blocked task", () => {
			const now = "2025-01-01T10:00:00Z";
			const task: Task = {
				id: "task-001",
				priority: "medium",
				depends_on: [],
				task: "Task 001",
				considerations: [],
				references: [],
				files: [],
				status: {
					created_at: now,
					updated_at: now,
					started_at: now,
					completed: false,
					completed_at: null,
					verified: false,
					verified_at: null,
					notes: [],
				},
				blocked: [
					{
						reason: "Waiting for external API approval",
						blocked_by: [],
						external_dependency: "API vendor approval process",
						blocked_at: now,
						resolved_at: null,
					},
				],
			};

			const { canComplete, reason } = canCompleteTask(task, [task]);
			expect(canComplete).toBe(false);
			expect(reason).toContain("blocked");
			expect(reason).toContain("external API approval");
		});

		it("should allow completing task after blocker is resolved", () => {
			const now = "2025-01-01T10:00:00Z";
			const later = "2025-01-01T12:00:00Z";
			const task: Task = {
				id: "task-001",
				priority: "medium",
				depends_on: [],
				task: "Task 001",
				considerations: [],
				references: [],
				files: [],
				status: {
					created_at: now,
					updated_at: later,
					started_at: now,
					completed: false,
					completed_at: null,
					verified: false,
					verified_at: null,
					notes: [],
				},
				blocked: [
					{
						reason: "Waiting for external API approval",
						blocked_by: [],
						blocked_at: now,
						resolved_at: later,
					},
				],
			};

			const { canComplete } = canCompleteTask(task, [task]);
			expect(canComplete).toBe(true);
		});
	});

	describe("External dependencies blocking", () => {
		it("should handle external dependency blocks", () => {
			const task = createTask("task-001", [
				{
					reason: "Waiting for legal team approval",
					blocked_by: [],
					external_dependency: "Legal compliance review",
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: null,
				},
			]);

			expect(isTaskBlocked(task)).toBe(true);
			const blocks = getActiveBlocks(task);
			expect(blocks[0].external_dependency).toBe("Legal compliance review");
		});
	});

	describe("Multiple blockers", () => {
		it("should handle multiple simultaneous blockers", () => {
			const task = createTask("task-001", [
				{
					reason: "Waiting for infrastructure provisioning",
					blocked_by: [],
					external_dependency: "DevOps team",
					blocked_at: "2025-01-01T10:00:00Z",
					resolved_at: null,
				},
				{
					reason: "Blocked by security review",
					blocked_by: [],
					external_dependency: "Security team",
					blocked_at: "2025-01-01T11:00:00Z",
					resolved_at: null,
				},
			]);

			const activeBlocks = getActiveBlocks(task);
			expect(activeBlocks).toHaveLength(2);

			const { canStart, reason } = canStartTaskWithBlocking(task, [task]);
			expect(canStart).toBe(false);
			expect(reason).toContain("infrastructure provisioning");
			expect(reason).toContain("security review");
		});
	});
});
