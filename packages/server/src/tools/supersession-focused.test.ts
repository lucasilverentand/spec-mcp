import { SpecManager } from "@spec-mcp/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestPlan,
} from "../../../core/tests/helpers.js";
import { addCriteria, addTask } from "./index.js";

/**
 * Helper to format entity IDs with padding as required by plan schema
 */
function formatEntityId(prefix: string, number: number, slug: string): string {
	return `${prefix}-${String(number).padStart(3, "0")}-${slug}`;
}

/**
 * Focused tests for supersession functionality and reference updating
 * Tests the core supersession behavior:
 * 1. Superseding creates new item with new ID
 * 2. Old item marked as superseded
 * 3. References are updated throughout the spec
 * 4. Cannot supersede already-superseded items
 * 5. Supersession chains work correctly
 */
// TODO: Supersession tests need debugging - mixed case sensitivity and logic issues
describe("Supersession Core Functionality", () => {
	let tempDir: string;
	let specManager: SpecManager;

	beforeEach(async () => {
		tempDir = await createTempDir("supersession-focused");
		specManager = new SpecManager(tempDir);
		await specManager.ensureFolders();
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("Task Supersession", () => {
		it("should supersede a task and update all depends_on references", async () => {
			// Create a requirement first so plan validation passes
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-req" }),
			);

			// Create plan with proper reference to requirement
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					tasks: [],
					criteria: {
						requirement: formatEntityId("brd", brd.number, "test-req"),
						criteria: "crt-001",
					},
				}),
			);
			const planId = formatEntityId("pln", plan.number, "test-plan");

			// Create tsk-001
			await addTask(specManager, planId, "Foundation task");

			// Create tsk-002 that depends on tsk-001
			await addTask(specManager, planId, "Dependent task", {
				depends_on: ["tsk-001"],
			});

			// Create tsk-003 that also depends on tsk-001
			await addTask(specManager, planId, "Another dependent task", {
				depends_on: ["tsk-001"],
			});

			// Supersede tsk-001
			const result = await addTask(
				specManager,
				planId,
				"Updated foundation task",
				{
					supersede_id: "tsk-001",
				},
			);

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("tsk-004");

			const updatedPlan = await specManager.plans.get(plan.number);
			expect(updatedPlan?.tasks).toHaveLength(4);

			// Verify old task is superseded
			const oldTask = updatedPlan?.tasks.find((t) => t.id === "tsk-001");
			expect(oldTask?.superseded_by).toBe("tsk-004");
			expect(oldTask?.superseded_at).toBeTruthy();

			// Verify new task
			const newTask = updatedPlan?.tasks.find((t) => t.id === "tsk-004");
			expect(newTask?.supersedes).toBe("tsk-001");
			expect(newTask?.task).toBe("Updated foundation task");
			expect(newTask?.superseded_by).toBeNull();

			// Verify ALL references were updated
			const task2 = updatedPlan?.tasks.find((t) => t.id === "tsk-002");
			expect(task2?.depends_on).toEqual(["tsk-004"]);
			expect(task2?.depends_on).not.toContain("tsk-001");

			const task3 = updatedPlan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.depends_on).toEqual(["tsk-004"]);
			expect(task3?.depends_on).not.toContain("tsk-001");
		});

		it("should prevent superseding an already superseded task", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-req" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					tasks: [],
					criteria: {
						requirement: formatEntityId("brd", brd.number, "test-req"),
						criteria: "crt-001",
					},
				}),
			);
			const planId = formatEntityId("pln", plan.number, "test-plan");

			await addTask(specManager, planId, "Original task");
			await addTask(specManager, planId, "First update", {
				supersede_id: "tsk-001",
			});

			// Try to supersede the already-superseded tsk-001
			const result = await addTask(specManager, planId, "Second update", {
				supersede_id: "tsk-001",
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been superseded");
			expect(result.content[0].text).toContain("tsk-002");
		});

		it("should handle complex dependency chains with multiple references", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-req" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					tasks: [],
					criteria: {
						requirement: formatEntityId("brd", brd.number, "test-req"),
						criteria: "crt-001",
					},
				}),
			);
			const planId = formatEntityId("pln", plan.number, "test-plan");

			// Create complex dependency web: tsk-001 <- tsk-002 <- tsk-003
			//                                    tsk-001 <- tsk-003
			await addTask(specManager, planId, "Foundation task");
			await addTask(specManager, planId, "Middle layer task", {
				depends_on: ["tsk-001"],
			});
			await addTask(specManager, planId, "Top level task", {
				depends_on: ["tsk-001", "tsk-002"],
			});

			// Supersede the foundation
			await addTask(specManager, planId, "New foundation", {
				supersede_id: "tsk-001",
			});

			const updatedPlan = await specManager.plans.get(plan.number);

			// tsk-002 should now depend on tsk-004
			const task2 = updatedPlan?.tasks.find((t) => t.id === "tsk-002");
			expect(task2?.depends_on).toEqual(["tsk-004"]);

			// tsk-003 should depend on both tsk-004 and tsk-002
			const task3 = updatedPlan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.depends_on).toContain("tsk-004");
			expect(task3?.depends_on).toContain("tsk-002");
			expect(task3?.depends_on).not.toContain("tsk-001");
		});

		it("should create supersession chains correctly", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-req" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					tasks: [],
					criteria: {
						requirement: formatEntityId("brd", brd.number, "test-req"),
						criteria: "crt-001",
					},
				}),
			);
			const planId = formatEntityId("pln", plan.number, "test-plan");

			// Create v1 -> v2 -> v3 chain
			await addTask(specManager, planId, "Version 1 of task");
			await addTask(specManager, planId, "Version 2 of task", {
				supersede_id: "tsk-001",
			});
			await addTask(specManager, planId, "Version 3 of task", {
				supersede_id: "tsk-002",
			});

			const updatedPlan = await specManager.plans.get(plan.number);

			// Verify chain structure
			const task1 = updatedPlan?.tasks.find((t) => t.id === "tsk-001");
			expect(task1?.supersedes).toBeNull();
			expect(task1?.superseded_by).toBe("tsk-002");

			const task2 = updatedPlan?.tasks.find((t) => t.id === "tsk-002");
			expect(task2?.supersedes).toBe("tsk-001");
			expect(task2?.superseded_by).toBe("tsk-003");

			const task3 = updatedPlan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.supersedes).toBe("tsk-002");
			expect(task3?.superseded_by).toBeNull();
		});

		it("should update blocked_by references when superseding", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-req" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					tasks: [],
					criteria: {
						requirement: formatEntityId("brd", brd.number, "test-req"),
						criteria: "crt-001",
					},
				}),
			);
			const planId = formatEntityId("pln", plan.number, "test-plan");

			await addTask(specManager, planId, "Blocking task");
			await addTask(specManager, planId, "Blocked task");

			// Manually add a blocker
			const planData = await specManager.plans.get(plan.number);
			if (!planData) throw new Error("Plan not found");

			const task2 = planData.tasks.find((t) => t.id === "tsk-002");
			if (!task2) throw new Error("Task 2 not found");

			const updatedTask2 = {
				...task2,
				blocked: [
					{
						reason: "Waiting for tsk-001",
						blocked_by: ["tsk-001"],
						blocked_at: new Date().toISOString(),
						resolved_at: null,
					},
				],
			};

			await specManager.plans.update(planData.number, {
				tasks: planData.tasks.map((t) =>
					t.id === "tsk-002" ? updatedTask2 : t,
				),
			});

			// Supersede tsk-001
			await addTask(specManager, planId, "New blocking task", {
				supersede_id: "tsk-001",
			});

			const finalPlan = await specManager.plans.get(plan.number);
			const blockedTask = finalPlan?.tasks.find((t) => t.id === "tsk-002");

			expect(blockedTask?.blocked[0].blocked_by).toEqual(["tsk-003"]);
			expect(blockedTask?.blocked[0].blocked_by).not.toContain("tsk-001");
		});
	});

	describe("Criteria Supersession", () => {
		it("should supersede criteria correctly", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			const brdId = formatEntityId("brd", brd.number, "test-brd");

			// Add a new criteria
			await addCriteria(
				specManager,
				brdId,
				"Original requirement",
				"Original rationale",
			);

			// Supersede it
			const result = await addCriteria(
				specManager,
				brdId,
				"Updated requirement",
				"Updated rationale",
				"crt-002", // supersede the one we just added
			);

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("crt-003");

			const updatedBrd = await specManager.business_requirements.get(
				brd.number,
			);

			// Find the superseded criteria
			const oldCriteria = updatedBrd?.criteria.find((c) => c.id === "crt-002");
			expect(oldCriteria?.superseded_by).toBe("crt-003");
			expect(oldCriteria?.superseded_at).toBeTruthy();
			expect(oldCriteria?.description).toBe("Original requirement");

			// Find the new criteria
			const newCriteria = updatedBrd?.criteria.find((c) => c.id === "crt-003");
			expect(newCriteria?.supersedes).toBe("crt-002");
			expect(newCriteria?.description).toBe("Updated requirement");
			expect(newCriteria?.rationale).toBe("Updated rationale");
			expect(newCriteria?.superseded_by).toBeNull();
		});

		it("should prevent superseding already superseded criteria", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			const brdId = formatEntityId("brd", brd.number, "test-brd");

			await addCriteria(specManager, brdId, "Version 1", "Rationale 1");
			await addCriteria(
				specManager,
				brdId,
				"Version 2",
				"Rationale 1",
				"crt-002",
			);

			// Try to supersede the already superseded item
			const result = await addCriteria(
				specManager,
				brdId,
				"Version 3",
				"Rationale 1",
				"crt-002", // This is already superseded
			);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been superseded");
		});

		it("should build correct supersession chains", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			const brdId = formatEntityId("brd", brd.number, "test-brd");

			// Build a chain: crt-002 -> crt-003 -> crt-004
			await addCriteria(specManager, brdId, "V1", "R1");
			await addCriteria(specManager, brdId, "V2", "R1", "crt-002");
			await addCriteria(specManager, brdId, "V3", "R1", "crt-003");

			const updatedBrd = await specManager.business_requirements.get(
				brd.number,
			);

			const crit2 = updatedBrd?.criteria.find((c) => c.id === "crt-002");
			expect(crit2?.supersedes).toBeNull();
			expect(crit2?.superseded_by).toBe("crt-003");

			const crit3 = updatedBrd?.criteria.find((c) => c.id === "crt-003");
			expect(crit3?.supersedes).toBe("crt-002");
			expect(crit3?.superseded_by).toBe("crt-004");

			const crit4 = updatedBrd?.criteria.find((c) => c.id === "crt-004");
			expect(crit4?.supersedes).toBe("crt-003");
			expect(crit4?.superseded_by).toBeNull();
		});
	});

	describe("Timestamp and Audit Trail", () => {
		it("should set superseded_at timestamp", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			const brdId = formatEntityId("brd", brd.number, "test-brd");

			await addCriteria(specManager, brdId, "Original", "Rationale");

			const beforeSupersede = new Date().toISOString();
			await new Promise((resolve) => setTimeout(resolve, 10));

			await addCriteria(specManager, brdId, "Updated", "Rationale", "crt-002");

			const afterSupersede = new Date().toISOString();

			const updatedBrd = await specManager.business_requirements.get(
				brd.number,
			);
			const oldCriteria = updatedBrd?.criteria.find((c) => c.id === "crt-002");

			expect(oldCriteria?.superseded_at).toBeTruthy();
			// ISO strings can be compared lexicographically
			expect(oldCriteria?.superseded_at! >= beforeSupersede).toBe(true);
			expect(oldCriteria?.superseded_at! <= afterSupersede).toBe(true);
		});

		it("should preserve audit trail through multiple supersessions", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-req" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					tasks: [],
					criteria: {
						requirement: formatEntityId("brd", brd.number, "test-req"),
						criteria: "crt-001",
					},
				}),
			);
			const planId = formatEntityId("pln", plan.number, "test-plan");

			await addTask(specManager, planId, "Version 1 task");
			await new Promise((resolve) => setTimeout(resolve, 10));

			await addTask(specManager, planId, "Version 2 task", {
				supersede_id: "tsk-001",
			});
			await new Promise((resolve) => setTimeout(resolve, 10));

			await addTask(specManager, planId, "Version 3 task", {
				supersede_id: "tsk-002",
			});

			const updatedPlan = await specManager.plans.get(plan.number);

			// All versions should exist
			expect(updatedPlan?.tasks).toHaveLength(3);

			// Timestamps should be in order
			const task1 = updatedPlan?.tasks.find((t) => t.id === "tsk-001");
			const task2 = updatedPlan?.tasks.find((t) => t.id === "tsk-002");

			expect(task1?.superseded_at).toBeTruthy();
			expect(task2?.superseded_at).toBeTruthy();

			if (task1?.superseded_at && task2?.superseded_at) {
				// ISO strings can be compared lexicographically
				expect(task1.superseded_at < task2.superseded_at).toBe(true);
			}
		});
	});
});
