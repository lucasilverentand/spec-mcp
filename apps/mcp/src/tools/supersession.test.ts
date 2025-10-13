import { SpecManager } from "@spec-mcp/core";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestPlan,
} from "@spec-mcp/core/tests/helpers";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	addApiContract,
	addCriteria,
	addDataModel,
	addTask,
	addTestCase,
	supersedeApiContract,
	supersedeCriteria,
	supersedeDataModel,
	supersedeTestCase,
} from "./index.js";

/**
 * Comprehensive tests for supersession functionality and reference updating
 * These tests verify that:
 * 1. Items can be superseded correctly
 * 2. Old items are marked with superseded_by and superseded_at
 * 3. New items have correct supersedes field
 * 4. References to superseded items are updated throughout the spec
 * 5. Dependency chains are updated correctly
 * 6. Cannot supersede an already-superseded item
 * 7. Supersession chains can be walked forward and backward
 * 8. Multiple references in different fields are all updated
 */
// TODO: Many tests reference functions that don't exist (supersedeTestCase, supersedeFlow, supersedeApiContract, supersedeDataModel)
// These need to be implemented or tests need to use the add* functions with supersede_id parameter
describe("Supersession and Reference Updates", () => {
	let tempDir: string;
	let specManager: SpecManager;

	beforeEach(async () => {
		tempDir = await createTempDir("supersession-tests");
		specManager = new SpecManager(tempDir);
		await specManager.ensureFolders();
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("Task Supersession with References", () => {
		let planId: string;

		beforeEach(async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should supersede a task and update depends_on references", async () => {
			// Create tsk-001
			await addTask(specManager, planId, "First task");
			// Create tsk-002 that depends on tsk-001
			await addTask(specManager, planId, "Second task", {
				depends_on: ["tsk-001"],
			});
			// Create tsk-003 that also depends on tsk-001
			await addTask(specManager, planId, "Third task", {
				depends_on: ["tsk-001"],
			});

			// Supersede tsk-001 with updated description
			const result = await addTask(specManager, planId, "Updated first task", {
				supersede_id: "tsk-001",
			});

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("tsk-004");

			const plan = await specManager.plans.get(1);
			expect(plan?.tasks).toHaveLength(4);

			// Verify old task is superseded
			const oldTask = plan?.tasks.find((t) => t.id === "tsk-001");
			expect(oldTask?.superseded_by).toBe("tsk-004");
			expect(oldTask?.superseded_at).toBeTruthy();

			// Verify new task
			const newTask = plan?.tasks.find((t) => t.id === "tsk-004");
			expect(newTask?.supersedes).toBe("tsk-001");
			expect(newTask?.task).toBe("Updated first task");
			expect(newTask?.superseded_by).toBeNull();

			// Verify references were updated
			const task2 = plan?.tasks.find((t) => t.id === "tsk-002");
			expect(task2?.depends_on).toContain("tsk-004");
			expect(task2?.depends_on).not.toContain("tsk-001");

			const task3 = plan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.depends_on).toContain("tsk-004");
			expect(task3?.depends_on).not.toContain("tsk-001");
		});

		it("should update blocked_by references when superseding a task", async () => {
			// Create tasks
			await addTask(specManager, planId, "Blocking task");
			await addTask(specManager, planId, "Blocked task");

			// Manually add a blocker to tsk-002 that references tsk-001
			const plan = await specManager.plans.get(1);
			if (!plan) throw new Error("Plan not found");

			const task2 = plan.tasks.find((t) => t.id === "tsk-002");
			if (!task2) throw new Error("Task not found");

			const updatedTask2 = {
				...task2,
				blocked: [
					{
						reason: "Waiting for tsk-001 to complete",
						blocked_by: ["tsk-001"],
						blocked_at: new Date().toISOString(),
						resolved_at: null,
					},
				],
			};

			await specManager.plans.update(plan.number, {
				tasks: plan.tasks.map((t) => (t.id === "tsk-002" ? updatedTask2 : t)),
			});

			// Supersede tsk-001
			await addTask(specManager, planId, "Updated blocking task", {
				supersede_id: "tsk-001",
			});

			const updatedPlan = await specManager.plans.get(1);
			const blockedTask = updatedPlan?.tasks.find((t) => t.id === "tsk-002");

			expect(blockedTask?.blocked[0].blocked_by).toContain("tsk-003");
			expect(blockedTask?.blocked[0].blocked_by).not.toContain("tsk-001");
		});

		it("should prevent superseding an already superseded task", async () => {
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

		it("should handle complex dependency chain updates", async () => {
			// Create a complex chain: tsk-002 depends on tsk-001,
			// tsk-003 depends on both tsk-001 and tsk-002
			await addTask(specManager, planId, "First complex task");
			await addTask(specManager, planId, "Second complex task", {
				depends_on: ["tsk-001"],
			});
			await addTask(specManager, planId, "Third complex task", {
				depends_on: ["tsk-001", "tsk-002"],
			});

			// Supersede tsk-001
			await addTask(specManager, planId, "Updated Task 1", {
				supersede_id: "tsk-001",
			});

			const plan = await specManager.plans.get(1);

			const task2 = plan?.tasks.find((t) => t.id === "tsk-002");
			expect(task2?.depends_on).toEqual(["tsk-004"]);

			const task3 = plan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.depends_on).toContain("tsk-004");
			expect(task3?.depends_on).toContain("tsk-002");
			expect(task3?.depends_on).not.toContain("tsk-001");
		});

		it("should preserve supersession chain when superseding twice", async () => {
			// Create tsk-001
			await addTask(specManager, planId, "Task version one");
			// Supersede with tsk-002
			await addTask(specManager, planId, "Task version two", {
				supersede_id: "tsk-001",
			});
			// Supersede tsk-002 with tsk-003
			await addTask(specManager, planId, "Task version three", {
				supersede_id: "tsk-002",
			});

			const plan = await specManager.plans.get(1);

			const task1 = plan?.tasks.find((t) => t.id === "tsk-001");
			expect(task1?.supersedes).toBeNull();
			expect(task1?.superseded_by).toBe("tsk-002");

			const task2 = plan?.tasks.find((t) => t.id === "tsk-002");
			expect(task2?.supersedes).toBe("tsk-001");
			expect(task2?.superseded_by).toBe("tsk-003");

			const task3 = plan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.supersedes).toBe("tsk-002");
			expect(task3?.superseded_by).toBeNull();
		});

		it("should update multiple reference types simultaneously", async () => {
			// Create a task that will be referenced in multiple ways
			await addTask(specManager, planId, "Referenced task");
			// Task that depends on tsk-001
			await addTask(specManager, planId, "Dependent task", {
				depends_on: ["tsk-001"],
			});

			// Add a blocker that references tsk-001
			const plan = await specManager.plans.get(1);
			if (!plan) throw new Error("Plan not found");

			const task2 = plan.tasks.find((t) => t.id === "tsk-002");
			if (!task2) throw new Error("Task not found");

			const updatedTask2 = {
				...task2,
				blocked: [
					{
						reason: "Blocked by tsk-001",
						blocked_by: ["tsk-001"],
						blocked_at: new Date().toISOString(),
						resolved_at: null,
					},
				],
			};

			await specManager.plans.update(plan.number, {
				tasks: plan.tasks.map((t) => (t.id === "tsk-002" ? updatedTask2 : t)),
			});

			// Supersede tsk-001
			await addTask(specManager, planId, "Updated referenced task", {
				supersede_id: "tsk-001",
			});

			const updatedPlan = await specManager.plans.get(1);
			const task2Updated = updatedPlan?.tasks.find((t) => t.id === "tsk-002");

			// Both depends_on and blocked_by should be updated
			expect(task2Updated?.depends_on).toContain("tsk-003");
			expect(task2Updated?.depends_on).not.toContain("tsk-001");
			expect(task2Updated?.blocked[0].blocked_by).toContain("tsk-003");
			expect(task2Updated?.blocked[0].blocked_by).not.toContain("tsk-001");
		});
	});

	describe("Criteria Supersession", () => {
		let brdId: string;

		beforeEach(async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			brdId = `brd-${brd.number}`;
		});

		it("should supersede a criteria correctly", async () => {
			await addCriteria(
				specManager,
				brdId,
				"Original requirement",
				"Original rationale",
			);

			const result = await addCriteria(
				specManager,
				brdId,
				"Updated requirement",
				"Updated rationale",
				"crt-002", // supersede the one we just added
			);

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("crt-003");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.criteria).toHaveLength(3); // original crt-001 from test data + crt-002 + crt-003

			const oldCriteria = brd?.criteria.find((c) => c.id === "crt-002");
			expect(oldCriteria?.superseded_by).toBe("crt-003");
			expect(oldCriteria?.superseded_at).toBeTruthy();
			expect(oldCriteria?.description).toBe("Original requirement");

			const newCriteria = brd?.criteria.find((c) => c.id === "crt-003");
			expect(newCriteria?.supersedes).toBe("crt-002");
			expect(newCriteria?.description).toBe("Updated requirement");
			expect(newCriteria?.rationale).toBe("Updated rationale");
			expect(newCriteria?.superseded_by).toBeNull();
		});

		it("should prevent superseding an already superseded criteria", async () => {
			await addCriteria(specManager, brdId, "Version 1", "Rationale 1");
			await addCriteria(
				specManager,
				brdId,
				"Version 2",
				"Rationale 1",
				"crt-002", // supersede the one we just added
			);

			const result = await addCriteria(
				specManager,
				brdId,
				"Version 3",
				"Rationale 1",
				"crt-002", // try to supersede again
			);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been superseded");
		});

		it("should create a complete supersession chain", async () => {
			// Version 1
			await addCriteria(specManager, brdId, "Version 1", "Rationale 1");
			// Version 2
			await addCriteria(
				specManager,
				brdId,
				"Version 2",
				"Rationale 1",
				"crt-002",
			);
			// Version 3
			await addCriteria(
				specManager,
				brdId,
				"Version 3",
				"Rationale 1",
				"crt-003",
			);
			// Version 4
			await addCriteria(
				specManager,
				brdId,
				"Version 4",
				"Rationale 1",
				"crt-004",
			);

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.criteria).toHaveLength(5); // original + 4 new ones

			// Verify chain
			const crit2 = brd?.criteria.find((c) => c.id === "crt-002");
			expect(crit2?.supersedes).toBeNull();
			expect(crit2?.superseded_by).toBe("crt-003");

			const crit3 = brd?.criteria.find((c) => c.id === "crt-003");
			expect(crit3?.supersedes).toBe("crt-002");
			expect(crit3?.superseded_by).toBe("crt-004");

			const crit4 = brd?.criteria.find((c) => c.id === "crt-004");
			expect(crit4?.supersedes).toBe("crt-003");
			expect(crit4?.superseded_by).toBe("crt-005");

			const crit5 = brd?.criteria.find((c) => c.id === "crt-005");
			expect(crit5?.supersedes).toBe("crt-004");
			expect(crit5?.superseded_by).toBeNull();
		});
	});

	describe("Test Case Supersession", () => {
		let planId: string;

		beforeEach(async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", test_cases: [] }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should supersede a test case with all fields updated", async () => {
			await addTestCase(
				specManager,
				planId,
				"Original Test",
				"Original description",
				["Step 1", "Step 2"],
				"Expected result",
			);

			const result = await supersedeTestCase(specManager, planId, "tst-001", {
				name: "Updated Test",
				description: "Updated description",
				steps: ["New Step 1", "New Step 2", "New Step 3"],
				expected_result: "New expected result",
				implemented: true,
				passing: true,
			});

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("tst-002");

			const plan = await specManager.plans.get(1);
			const newTest = plan?.test_cases.find((t) => t.id === "tst-002");

			expect(newTest?.name).toBe("Updated Test");
			expect(newTest?.description).toBe("Updated description");
			expect(newTest?.steps).toHaveLength(3);
			expect(newTest?.implemented).toBe(true);
			expect(newTest?.passing).toBe(true);
			expect(newTest?.supersedes).toBe("tst-001");
		});

		it("should maintain test case supersession chain", async () => {
			await addTestCase(
				specManager,
				planId,
				"Test v1",
				"Desc v1",
				["Step 1"],
				"Result 1",
			);

			await supersedeTestCase(specManager, planId, "tst-001", {
				name: "Test v2",
			});

			await supersedeTestCase(specManager, planId, "tst-002", {
				name: "Test v3",
			});

			const plan = await specManager.plans.get(1);

			const test1 = plan?.test_cases.find((t) => t.id === "tst-001");
			expect(test1?.superseded_by).toBe("tst-002");

			const test2 = plan?.test_cases.find((t) => t.id === "tst-002");
			expect(test2?.supersedes).toBe("tst-001");
			expect(test2?.superseded_by).toBe("tst-003");

			const test3 = plan?.test_cases.find((t) => t.id === "tst-003");
			expect(test3?.supersedes).toBe("tst-002");
			expect(test3?.superseded_by).toBeNull();
		});
	});

	describe("API Contract Supersession", () => {
		let planId: string;

		beforeEach(async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", api_contracts: [] }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should supersede an API contract", async () => {
			await addApiContract(
				specManager,
				planId,
				"/api/users",
				"POST",
				"Create user",
				'{"name": "string"}',
				'{"id": "string"}',
			);

			const result = await supersedeApiContract(
				specManager,
				planId,
				"api-001",
				{
					description: "Create user with validation",
					specification: JSON.stringify(
						{
							endpoint: "/api/users",
							method: "POST",
							requestBody: { name: "string", email: "string" },
							responseBody: { id: "string", created_at: "datetime" },
						},
						null,
						2,
					),
				},
			);

			expect(result.content[0].text).toContain("Success");

			const plan = await specManager.plans.get(1);
			const newContract = plan?.api_contracts.find((c) => c.id === "api-002");

			expect(newContract?.description).toBe("Create user with validation");
			expect(newContract?.specification).toContain("email");
			expect(newContract?.specification).toContain("created_at");
			expect(newContract?.supersedes).toBe("api-001");
		});

		it("should preserve endpoint and method when superseding", async () => {
			await addApiContract(
				specManager,
				planId,
				"/api/posts",
				"GET",
				"List posts",
			);

			await supersedeApiContract(specManager, planId, "api-001", {
				description: "List posts with pagination",
			});

			const plan = await specManager.plans.get(1);
			const newContract = plan?.api_contracts.find((c) => c.id === "api-002");

			expect(newContract?.name).toContain("GET /api/posts");
			expect(newContract?.description).toBe("List posts with pagination");
		});
	});

	describe("Data Model Supersession", () => {
		let planId: string;

		beforeEach(async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", data_models: [] }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should supersede a data model", async () => {
			await addDataModel(specManager, planId, "User", "User entity", [
				"id: string",
				"name: string",
			]);

			const result = await supersedeDataModel(specManager, planId, "dat-001", {
				description: "Enhanced user entity",
				schema: "id: string\nname: string\nemail: string\nrole: enum",
			});

			expect(result.content[0].text).toContain("Success");

			const plan = await specManager.plans.get(1);
			const newModel = plan?.data_models.find((m) => m.id === "dat-002");

			expect(newModel?.name).toBe("User");
			expect(newModel?.description).toBe("Enhanced user entity");
			expect(newModel?.supersedes).toBe("dat-001");
		});
	});

	describe("Cross-Entity Reference Updates", () => {
		it("should update task references when used in multiple places", async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			const planId = `pln-${plan.number}`;

			// Create a web of dependencies
			await addTask(specManager, planId, "Foundation task");
			await addTask(specManager, planId, "Task depending on 001", {
				depends_on: ["tsk-001"],
			});
			await addTask(specManager, planId, "Task depending on 001 and 002", {
				depends_on: ["tsk-001", "tsk-002"],
			});
			await addTask(specManager, planId, "Another task depending on 001", {
				depends_on: ["tsk-001"],
			});

			// Supersede the foundation task
			await addTask(specManager, planId, "Updated foundation task", {
				supersede_id: "tsk-001",
			});

			const updatedPlan = await specManager.plans.get(1);

			// Check all dependencies were updated
			const task2 = updatedPlan?.tasks.find((t) => t.id === "tsk-002");
			expect(task2?.depends_on).toEqual(["tsk-005"]);

			const task3 = updatedPlan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.depends_on).toContain("tsk-005");
			expect(task3?.depends_on).toContain("tsk-002");

			const task4 = updatedPlan?.tasks.find((t) => t.id === "tsk-004");
			expect(task4?.depends_on).toEqual(["tsk-005"]);
		});

		it("should handle supersession when task has both depends_on and is depended on", async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			const planId = `pln-${plan.number}`;

			// Create a dependency chain: 001 -> 002 -> 003
			await addTask(specManager, planId, "First task in chain");
			await addTask(specManager, planId, "Second task in chain", {
				depends_on: ["tsk-001"],
			});
			await addTask(specManager, planId, "Third task in chain", {
				depends_on: ["tsk-002"],
			});

			// Supersede the middle task
			await addTask(specManager, planId, "Updated Task 2", {
				supersede_id: "tsk-002",
			});

			const updatedPlan = await specManager.plans.get(1);

			// tsk-004 should still depend on tsk-001
			const task4 = updatedPlan?.tasks.find((t) => t.id === "tsk-004");
			expect(task4?.depends_on).toEqual(["tsk-001"]);

			// tsk-003 should now depend on tsk-004
			const task3 = updatedPlan?.tasks.find((t) => t.id === "tsk-003");
			expect(task3?.depends_on).toEqual(["tsk-004"]);
		});
	});

	describe("Edge Cases and Error Handling", () => {
		it("should handle superseding when no references exist", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			const brdId = `brd-${brd.number}`;

			await addCriteria(
				specManager,
				brdId,
				"Standalone criteria",
				"No references",
			);

			const result = await supersedeCriteria(specManager, brdId, "crt-002", {
				description: "Updated standalone criteria",
			});

			expect(result.content[0].text).toContain("Success");

			const updatedBrd = await specManager.business_requirements.get(1);
			const newCriteria = updatedBrd?.criteria.find((c) => c.id === "crt-003");

			expect(newCriteria?.description).toBe("Updated standalone criteria");
		});

		it("should return error when superseding non-existent item", async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", test_cases: [] }),
			);
			const planId = `pln-${plan.number}`;

			const result = await supersedeTestCase(specManager, planId, "tst-999", {
				name: "New name",
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("not found");
		});
	});

	describe("Timestamp and Audit Trail", () => {
		it("should set superseded_at timestamp correctly", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			const brdId = `brd-${brd.number}`;

			await addCriteria(specManager, brdId, "Original", "Rationale");

			// Small delay to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			await supersedeCriteria(specManager, brdId, "crt-002", {
				description: "Updated",
			});

			const afterSupersede = new Date().toISOString();

			const updatedBrd = await specManager.business_requirements.get(1);
			const oldCriteria = updatedBrd?.criteria.find((c) => c.id === "crt-002");

			expect(oldCriteria?.superseded_at).toBeTruthy();
			// Compare as strings since superseded_at is an ISO string
			if (oldCriteria?.superseded_at) {
				expect(oldCriteria.superseded_at <= afterSupersede).toBe(true);
			}
		});
	});
});
