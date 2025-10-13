import { describe, expect, it } from "vitest";
import type { Criteria } from "./criteria.js";
import {
	getCriterionState,
	getPlanState,
	getRequirementCompletionStats,
	getRequirementState,
} from "./requirement-status.js";
import type { Task } from "./task.js";

describe("Requirement State Tracking", () => {
	// Helper to create a simple criterion (no status - computed from plans!)
	const createCriterion = (id: string): Criteria => ({
		id,
		description: `Criterion ${id}`,
		rationale: `Rationale for ${id}`,
	});

	// Helper to create a task with given state
	const createTask = (
		id: string,
		state: "not-started" | "in-progress" | "completed" | "verified",
	): Task => {
		const created = "2025-01-01T10:00:00Z";
		const started = "2025-01-01T11:00:00Z";
		const completed = "2025-01-01T12:00:00Z";
		const verified = "2025-01-01T13:00:00Z";

		return {
			id,
			priority: "medium",
			depends_on: [],
			task: `Task ${id}`,
			considerations: [],
			references: [],
			files: [],
			status:
				state === "not-started"
					? {
							created_at: created,
							started_at: null,
							completed_at: null,
							verified_at: null,
							notes: [],
						}
					: state === "in-progress"
						? {
								created_at: created,
								started_at: started,
								completed_at: null,
								verified_at: null,
								notes: [],
							}
						: state === "completed"
							? {
									created_at: created,
									started_at: started,
									completed_at: completed,
									verified_at: null,
									notes: [],
								}
							: {
									created_at: created,
									started_at: started,
									completed_at: completed,
									verified_at: verified,
									notes: [],
								},
			blocked: [],
		};
	};

	describe("getPlanState", () => {
		it("should return 'not-started' for plan with no tasks", () => {
			expect(getPlanState({ tasks: [] })).toBe("not-started");
		});

		it("should return 'not-started' when all tasks are not started", () => {
			const plan = {
				tasks: [
					createTask("tsk-001", "not-started"),
					createTask("tsk-002", "not-started"),
				],
			};
			expect(getPlanState(plan)).toBe("not-started");
		});

		it("should return 'in-progress' when any task is started", () => {
			const plan = {
				tasks: [
					createTask("tsk-001", "not-started"),
					createTask("tsk-002", "in-progress"),
				],
			};
			expect(getPlanState(plan)).toBe("in-progress");
		});

		it("should return 'completed' when all tasks are completed", () => {
			const plan = {
				tasks: [
					createTask("tsk-001", "completed"),
					createTask("tsk-002", "completed"),
				],
			};
			expect(getPlanState(plan)).toBe("completed");
		});

		it("should return 'verified' when all tasks are verified", () => {
			const plan = {
				tasks: [
					createTask("tsk-001", "verified"),
					createTask("tsk-002", "verified"),
				],
			};
			expect(getPlanState(plan)).toBe("verified");
		});

		it("should return 'completed' when mix of completed and verified", () => {
			const plan = {
				tasks: [
					createTask("tsk-001", "completed"),
					createTask("tsk-002", "verified"),
				],
			};
			expect(getPlanState(plan)).toBe("completed");
		});
	});

	describe("getCriterionState", () => {
		it("should return 'not-started' when no plans implement the criterion", () => {
			const state = getCriterionState("crt-001", "req-001", []);
			expect(state).toBe("not-started");
		});

		it("should return state from single implementing plan", () => {
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "in-progress")],
				},
			];
			expect(getCriterionState("crt-001", "req-001", plans)).toBe(
				"in-progress",
			);
		});

		it("should aggregate state from multiple implementing plans", () => {
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "completed")],
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-002", "verified")],
				},
			];
			// All plans are completed or verified
			expect(getCriterionState("crt-001", "req-001", plans)).toBe("completed");
		});

		it("should return 'verified' when all implementing plans are verified", () => {
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "verified")],
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-002", "verified")],
				},
			];
			expect(getCriterionState("crt-001", "req-001", plans)).toBe("verified");
		});

		it("should ignore plans for different requirements", () => {
			const plans = [
				{
					criteria: { requirement: "req-002", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "completed")],
				},
			];
			expect(getCriterionState("crt-001", "req-001", plans)).toBe(
				"not-started",
			);
		});

		it("should ignore plans for different criteria", () => {
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-002" },
					tasks: [createTask("tsk-001", "completed")],
				},
			];
			expect(getCriterionState("crt-001", "req-001", plans)).toBe(
				"not-started",
			);
		});
	});

	describe("getRequirementState", () => {
		it("should return 'not-started' for empty criteria", () => {
			const requirement = { id: "req-001", criteria: [] };
			expect(getRequirementState(requirement, [])).toBe("not-started");
		});

		it("should return 'not-started' when no plans implement any criteria", () => {
			const requirement = {
				id: "req-001",
				criteria: [createCriterion("crt-001"), createCriterion("crt-002")],
			};
			expect(getRequirementState(requirement, [])).toBe("not-started");
		});

		it("should return 'in-progress' when any criterion is in progress", () => {
			const requirement = {
				id: "req-001",
				criteria: [createCriterion("crt-001"), createCriterion("crt-002")],
			};
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "in-progress")],
				},
			];
			expect(getRequirementState(requirement, plans)).toBe("in-progress");
		});

		it("should return 'completed' when all criteria are completed", () => {
			const requirement = {
				id: "req-001",
				criteria: [createCriterion("crt-001"), createCriterion("crt-002")],
			};
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "completed")],
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-002" },
					tasks: [createTask("tsk-002", "completed")],
				},
			];
			expect(getRequirementState(requirement, plans)).toBe("completed");
		});

		it("should return 'verified' when all criteria are verified", () => {
			const requirement = {
				id: "req-001",
				criteria: [createCriterion("crt-001"), createCriterion("crt-002")],
			};
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "verified")],
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-002" },
					tasks: [createTask("tsk-002", "verified")],
				},
			];
			expect(getRequirementState(requirement, plans)).toBe("verified");
		});
	});

	describe("getRequirementCompletionStats", () => {
		it("should return zeros for requirement with no criteria", () => {
			const requirement = { id: "req-001", criteria: [] };
			const stats = getRequirementCompletionStats(requirement, []);
			expect(stats).toEqual({
				total: 0,
				notStarted: 0,
				inProgress: 0,
				completed: 0,
				verified: 0,
				percentage: 0,
			});
		});

		it("should calculate stats correctly", () => {
			const requirement = {
				id: "req-001",
				criteria: [
					createCriterion("crt-001"),
					createCriterion("crt-002"),
					createCriterion("crt-003"),
					createCriterion("crt-004"),
				],
			};
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [], // not started
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-002" },
					tasks: [createTask("tsk-001", "in-progress")],
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-003" },
					tasks: [createTask("tsk-002", "completed")],
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-004" },
					tasks: [createTask("tsk-003", "verified")],
				},
			];

			const stats = getRequirementCompletionStats(requirement, plans);

			expect(stats.total).toBe(4);
			expect(stats.notStarted).toBe(1);
			expect(stats.inProgress).toBe(1);
			expect(stats.completed).toBe(1);
			expect(stats.verified).toBe(1);
			expect(stats.percentage).toBe(50); // 2 out of 4 done (completed + verified)
		});

		it("should calculate 100% when all criteria are completed or verified", () => {
			const requirement = {
				id: "req-001",
				criteria: [createCriterion("crt-001"), createCriterion("crt-002")],
			};
			const plans = [
				{
					criteria: { requirement: "req-001", criteria: "crt-001" },
					tasks: [createTask("tsk-001", "completed")],
				},
				{
					criteria: { requirement: "req-001", criteria: "crt-002" },
					tasks: [createTask("tsk-002", "verified")],
				},
			];

			const stats = getRequirementCompletionStats(requirement, plans);
			expect(stats.percentage).toBe(100);
		});
	});
});
