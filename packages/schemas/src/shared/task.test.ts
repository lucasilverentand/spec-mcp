import { describe, expect, it } from "vitest";
import type { Task } from "./task.js";
import { canCompleteTask, canStartTask, getTaskState } from "./task.js";

describe("Task State Management", () => {
	describe("getTaskState", () => {
		it("should return 'not-started' for new tasks", () => {
			const status = {
				created_at: "2025-01-01T10:00:00Z",
				updated_at: "2025-01-01T10:00:00Z",
				started_at: null,
				completed: false,
				completed_at: null,
				verified: false,
				verified_at: null,
				notes: [],
			};
			expect(getTaskState(status)).toBe("not-started");
		});

		it("should return 'in-progress' for started tasks", () => {
			const status = {
				created_at: "2025-01-01T10:00:00Z",
				updated_at: "2025-01-01T11:00:00Z",
				started_at: "2025-01-01T11:00:00Z",
				completed: false,
				completed_at: null,
				verified: false,
				verified_at: null,
				notes: [],
			};
			expect(getTaskState(status)).toBe("in-progress");
		});

		it("should return 'completed' for completed tasks", () => {
			const status = {
				created_at: "2025-01-01T10:00:00Z",
				updated_at: "2025-01-01T12:00:00Z",
				started_at: "2025-01-01T11:00:00Z",
				completed: true,
				completed_at: "2025-01-01T12:00:00Z",
				verified: false,
				verified_at: null,
				notes: [],
			};
			expect(getTaskState(status)).toBe("completed");
		});

		it("should return 'verified' for verified tasks", () => {
			const status = {
				created_at: "2025-01-01T10:00:00Z",
				updated_at: "2025-01-01T13:00:00Z",
				started_at: "2025-01-01T11:00:00Z",
				completed: true,
				completed_at: "2025-01-01T12:00:00Z",
				verified: true,
				verified_at: "2025-01-01T13:00:00Z",
				notes: [],
			};
			expect(getTaskState(status)).toBe("verified");
		});
	});

	describe("canStartTask", () => {
		const createTask = (
			id: string,
			state: "not-started" | "in-progress" | "completed" | "verified",
			dependsOn: string[] = [],
		): Task => {
			const now = "2025-01-01T10:00:00Z";
			const later = "2025-01-01T12:00:00Z";

			const status =
				state === "not-started"
					? {
							created_at: now,
							updated_at: now,
							started_at: null,
							completed: false,
							completed_at: null,
							verified: false,
							verified_at: null,
							notes: [],
						}
					: state === "in-progress"
						? {
								created_at: now,
								updated_at: later,
								started_at: later,
								completed: false,
								completed_at: null,
								verified: false,
								verified_at: null,
								notes: [],
							}
						: state === "completed"
							? {
									created_at: now,
									updated_at: later,
									started_at: later,
									completed: true,
									completed_at: later,
									verified: false,
									verified_at: null,
									notes: [],
								}
							: {
									created_at: now,
									updated_at: later,
									started_at: later,
									completed: true,
									completed_at: later,
									verified: true,
									verified_at: later,
									notes: [],
								};

			return {
				id,
				priority: "medium",
				depends_on: dependsOn,
				task: `Task ${id}`,
				considerations: [],
				references: [],
				files: [],
				status,
				blocked: [],
			};
		};

		it("should allow starting a task with no dependencies", () => {
			const task = createTask("tsk-001", "not-started");
			const { canStart } = canStartTask(task, [task]);
			expect(canStart).toBe(true);
		});

		it("should not allow starting an already started task", () => {
			const task = createTask("tsk-001", "in-progress");
			const { canStart, reason } = canStartTask(task, [task]);
			expect(canStart).toBe(false);
			expect(reason).toContain("already in-progress");
		});

		it("should not allow starting a completed task", () => {
			const task = createTask("tsk-001", "completed");
			const { canStart, reason } = canStartTask(task, [task]);
			expect(canStart).toBe(false);
			expect(reason).toContain("already completed");
		});

		it("should allow starting a task when dependencies are completed", () => {
			const task1 = createTask("tsk-001", "completed");
			const task2 = createTask("tsk-002", "not-started", ["tsk-001"]);
			const { canStart } = canStartTask(task2, [task1, task2]);
			expect(canStart).toBe(true);
		});

		it("should not allow starting a task when dependencies are not completed", () => {
			const task1 = createTask("tsk-001", "in-progress");
			const task2 = createTask("tsk-002", "not-started", ["tsk-001"]);
			const { canStart, reason } = canStartTask(task2, [task1, task2]);
			expect(canStart).toBe(false);
			expect(reason).toContain("uncompleted tasks");
			expect(reason).toContain("tsk-001");
		});

		it("should allow starting when dependency is verified", () => {
			const task1 = createTask("tsk-001", "verified");
			const task2 = createTask("tsk-002", "not-started", ["tsk-001"]);
			const { canStart } = canStartTask(task2, [task1, task2]);
			expect(canStart).toBe(true);
		});

		it("should handle multiple dependencies correctly", () => {
			const task1 = createTask("tsk-001", "completed");
			const task2 = createTask("tsk-002", "in-progress");
			const task3 = createTask("tsk-003", "not-started", [
				"tsk-001",
				"tsk-002",
			]);
			const { canStart, reason } = canStartTask(task3, [task1, task2, task3]);
			expect(canStart).toBe(false);
			expect(reason).toContain("tsk-002");
		});
	});

	describe("canCompleteTask", () => {
		const createTask = (
			id: string,
			state: "not-started" | "in-progress" | "completed" | "verified",
			dependsOn: string[] = [],
		): Task => {
			const now = "2025-01-01T10:00:00Z";
			const later = "2025-01-01T12:00:00Z";

			const status =
				state === "not-started"
					? {
							created_at: now,
							updated_at: now,
							started_at: null,
							completed: false,
							completed_at: null,
							verified: false,
							verified_at: null,
							notes: [],
						}
					: state === "in-progress"
						? {
								created_at: now,
								updated_at: later,
								started_at: later,
								completed: false,
								completed_at: null,
								verified: false,
								verified_at: null,
								notes: [],
							}
						: state === "completed"
							? {
									created_at: now,
									updated_at: later,
									started_at: later,
									completed: true,
									completed_at: later,
									verified: false,
									verified_at: null,
									notes: [],
								}
							: {
									created_at: now,
									updated_at: later,
									started_at: later,
									completed: true,
									completed_at: later,
									verified: true,
									verified_at: later,
									notes: [],
								};

			return {
				id,
				priority: "medium",
				depends_on: dependsOn,
				task: `Task ${id}`,
				considerations: [],
				references: [],
				files: [],
				status,
				blocked: [],
			};
		};

		it("should allow completing a task with no dependencies", () => {
			const task = createTask("tsk-001", "in-progress");
			const { canComplete } = canCompleteTask(task, [task]);
			expect(canComplete).toBe(true);
		});

		it("should allow completing a not-started task (direct completion)", () => {
			const task = createTask("tsk-001", "not-started");
			const { canComplete } = canCompleteTask(task, [task]);
			expect(canComplete).toBe(true);
		});

		it("should not allow completing an already completed task", () => {
			const task = createTask("tsk-001", "completed");
			const { canComplete, reason } = canCompleteTask(task, [task]);
			expect(canComplete).toBe(false);
			expect(reason).toContain("already completed");
		});

		it("should not allow completing a verified task", () => {
			const task = createTask("tsk-001", "verified");
			const { canComplete, reason } = canCompleteTask(task, [task]);
			expect(canComplete).toBe(false);
			expect(reason).toContain("already verified");
		});

		it("should allow completing when dependencies are completed", () => {
			const task1 = createTask("tsk-001", "completed");
			const task2 = createTask("tsk-002", "in-progress", ["tsk-001"]);
			const { canComplete } = canCompleteTask(task2, [task1, task2]);
			expect(canComplete).toBe(true);
		});

		it("should not allow completing when dependencies are not completed", () => {
			const task1 = createTask("tsk-001", "in-progress");
			const task2 = createTask("tsk-002", "in-progress", ["tsk-001"]);
			const { canComplete, reason } = canCompleteTask(task2, [task1, task2]);
			expect(canComplete).toBe(false);
			expect(reason).toContain("uncompleted tasks");
			expect(reason).toContain("tsk-001");
		});

		it("should handle multiple dependencies correctly", () => {
			const task1 = createTask("tsk-001", "completed");
			const task2 = createTask("tsk-002", "completed");
			const task3 = createTask("tsk-003", "in-progress", [
				"tsk-001",
				"tsk-002",
			]);
			const { canComplete } = canCompleteTask(task3, [task1, task2, task3]);
			expect(canComplete).toBe(true);
		});
	});
});
