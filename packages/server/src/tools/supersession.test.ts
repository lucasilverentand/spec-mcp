import { SpecManager } from "@spec-mcp/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestDecision,
	createTestPlan,
	createTestTechnicalRequirement,
} from "../../../core/tests/helpers.js";
import {
	addApiContract,
	addCriteria,
	addDataModel,
	addFlow,
	addTask,
	addTestCase,
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
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should supersede a task and update depends_on references", async () => {
			// Create task-001
			await addTask(specManager, planId, "First task");
			// Create task-002 that depends on task-001
			await addTask(specManager, planId, "Second task", {
				depends_on: ["task-001"],
			});
			// Create task-003 that also depends on task-001
			await addTask(specManager, planId, "Third task", {
				depends_on: ["task-001"],
			});

			// Supersede task-001 with updated description
			const result = await addTask(
				specManager,
				planId,
				"Updated first task",
				{
					supersede_id: "task-001",
				},
			);

			expect(result.content[0].text).toContain("success");
			expect(result.content[0].text).toContain("task-004");

			const plan = await specManager.plans.get(1);
			expect(plan?.tasks).toHaveLength(4);

			// Verify old task is superseded
			const oldTask = plan?.tasks.find((t) => t.id === "task-001");
			expect(oldTask?.superseded_by).toBe("task-004");
			expect(oldTask?.superseded_at).toBeTruthy();

			// Verify new task
			const newTask = plan?.tasks.find((t) => t.id === "task-004");
			expect(newTask?.supersedes).toBe("task-001");
			expect(newTask?.task).toBe("Updated first task");
			expect(newTask?.superseded_by).toBeNull();

			// Verify references were updated
			const task2 = plan?.tasks.find((t) => t.id === "task-002");
			expect(task2?.depends_on).toContain("task-004");
			expect(task2?.depends_on).not.toContain("task-001");

			const task3 = plan?.tasks.find((t) => t.id === "task-003");
			expect(task3?.depends_on).toContain("task-004");
			expect(task3?.depends_on).not.toContain("task-001");
		});

		it("should update blocked_by references when superseding a task", async () => {
			// Create tasks
			await addTask(specManager, planId, "Blocking task");
			await addTask(specManager, planId, "Blocked task");

			// Manually add a blocker to task-002 that references task-001
			const plan = await specManager.plans.get(1);
			if (!plan) throw new Error("Plan not found");

			const task2 = plan.tasks.find((t) => t.id === "task-002");
			if (!task2) throw new Error("Task not found");

			const updatedTask2 = {
				...task2,
				blocked: [
					{
						reason: "Waiting for task-001 to complete",
						blocked_by: ["task-001"],
						blocked_at: new Date().toISOString(),
						resolved_at: null,
					},
				],
			};

			await specManager.plans.update(plan.number, {
				tasks: plan.tasks.map((t) => (t.id === "task-002" ? updatedTask2 : t)),
			});

			// Supersede task-001
			await addTask(specManager, planId, "Updated blocking task", {
				supersede_id: "task-001",
			});

			const updatedPlan = await specManager.plans.get(1);
			const blockedTask = updatedPlan?.tasks.find((t) => t.id === "task-002");

			expect(blockedTask?.blocked[0].blocked_by).toContain("task-003");
			expect(blockedTask?.blocked[0].blocked_by).not.toContain("task-001");
		});

		it("should prevent superseding an already superseded task", async () => {
			await addTask(specManager, planId, "Original task");
			await addTask(specManager, planId, "First update", {
				supersede_id: "task-001",
			});

			// Try to supersede the already-superseded task-001
			const result = await addTask(specManager, planId, "Second update", {
				supersede_id: "task-001",
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been superseded");
			expect(result.content[0].text).toContain("task-002");
		});

		it("should handle complex dependency chain updates", async () => {
			// Create a complex chain: task-002 depends on task-001,
			// task-003 depends on both task-001 and task-002
			await addTask(specManager, planId, "Task 1");
			await addTask(specManager, planId, "Task 2", {
				depends_on: ["task-001"],
			});
			await addTask(specManager, planId, "Task 3", {
				depends_on: ["task-001", "task-002"],
			});

			// Supersede task-001
			await addTask(specManager, planId, "Updated Task 1", {
				supersede_id: "task-001",
			});

			const plan = await specManager.plans.get(1);

			const task2 = plan?.tasks.find((t) => t.id === "task-002");
			expect(task2?.depends_on).toEqual(["task-004"]);

			const task3 = plan?.tasks.find((t) => t.id === "task-003");
			expect(task3?.depends_on).toContain("task-004");
			expect(task3?.depends_on).toContain("task-002");
			expect(task3?.depends_on).not.toContain("task-001");
		});

		it("should preserve supersession chain when superseding twice", async () => {
			// Create task-001
			await addTask(specManager, planId, "Version 1");
			// Supersede with task-002
			await addTask(specManager, planId, "Version 2", {
				supersede_id: "task-001",
			});
			// Supersede task-002 with task-003
			await addTask(specManager, planId, "Version 3", {
				supersede_id: "task-002",
			});

			const plan = await specManager.plans.get(1);

			const task1 = plan?.tasks.find((t) => t.id === "task-001");
			expect(task1?.supersedes).toBeNull();
			expect(task1?.superseded_by).toBe("task-002");

			const task2 = plan?.tasks.find((t) => t.id === "task-002");
			expect(task2?.supersedes).toBe("task-001");
			expect(task2?.superseded_by).toBe("task-003");

			const task3 = plan?.tasks.find((t) => t.id === "task-003");
			expect(task3?.supersedes).toBe("task-002");
			expect(task3?.superseded_by).toBeNull();
		});

		it("should update multiple reference types simultaneously", async () => {
			// Create a task that will be referenced in multiple ways
			await addTask(specManager, planId, "Referenced task");
			// Task that depends on task-001
			await addTask(specManager, planId, "Dependent task", {
				depends_on: ["task-001"],
			});

			// Add a blocker that references task-001
			const plan = await specManager.plans.get(1);
			if (!plan) throw new Error("Plan not found");

			const task2 = plan.tasks.find((t) => t.id === "task-002");
			if (!task2) throw new Error("Task not found");

			const updatedTask2 = {
				...task2,
				blocked: [
					{
						reason: "Blocked by task-001",
						blocked_by: ["task-001"],
						blocked_at: new Date().toISOString(),
						resolved_at: null,
					},
				],
			};

			await specManager.plans.update(plan.number, {
				tasks: plan.tasks.map((t) => (t.id === "task-002" ? updatedTask2 : t)),
			});

			// Supersede task-001
			await addTask(specManager, planId, "Updated referenced task", {
				supersede_id: "task-001",
			});

			const updatedPlan = await specManager.plans.get(1);
			const task2Updated = updatedPlan?.tasks.find((t) => t.id === "task-002");

			// Both depends_on and blocked_by should be updated
			expect(task2Updated?.depends_on).toContain("task-003");
			expect(task2Updated?.depends_on).not.toContain("task-001");
			expect(task2Updated?.blocked[0].blocked_by).toContain("task-003");
			expect(task2Updated?.blocked[0].blocked_by).not.toContain("task-001");
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
				"crit-001", // supersede_id
			);

			expect(result.content[0].text).toContain("success");
			expect(result.content[0].text).toContain("crit-002");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.criteria).toHaveLength(3); // original crit-001 from test data + crit-001 + crit-002

			const oldCriteria = brd?.criteria.find((c) => c.id === "crit-001");
			expect(oldCriteria?.superseded_by).toBe("crit-002");
			expect(oldCriteria?.superseded_at).toBeTruthy();
			expect(oldCriteria?.description).toBe("Original requirement");

			const newCriteria = brd?.criteria.find((c) => c.id === "crit-002");
			expect(newCriteria?.supersedes).toBe("crit-001");
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
				"crit-002", // supersede the one we just added
			);

			const result = await addCriteria(
				specManager,
				brdId,
				"Version 3",
				"Rationale 1",
				"crit-002", // try to supersede again
			);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been superseded");
		});

		it("should preserve partial updates in criteria supersession", async () => {
			await addCriteria(
				specManager,
				brdId,
				"Original description",
				"Original rationale",
			);

			// Update only description (rationale will be preserved from old item)
			const result = await addCriteria(
				specManager,
				brdId,
				"New description",
				"Original rationale", // Must provide, but will be copied from superseded item
				"crit-002",
			);

			expect(result.content[0].text).toContain("success");

			const brd = await specManager.business_requirements.get(1);
			const newCriteria = brd?.criteria.find((c) => c.id === "crit-003");

			expect(newCriteria?.description).toBe("New description");
			expect(newCriteria?.rationale).toBe("Original rationale");
		});

		it("should create a complete supersession chain", async () => {
			// Version 1
			await addCriteria(specManager, brdId, "Version 1", "Rationale 1");
			// Version 2
			await addCriteria(specManager, brdId, "Version 2", "Rationale 1", "crit-002");
			// Version 3
			await addCriteria(specManager, brdId, "Version 3", "Rationale 1", "crit-003");
			// Version 4
			await addCriteria(specManager, brdId, "Version 4", "Rationale 1", "crit-004");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.criteria).toHaveLength(5); // original + 4 new ones

			// Verify chain
			const crit2 = brd?.criteria.find((c) => c.id === "crit-002");
			expect(crit2?.supersedes).toBeNull();
			expect(crit2?.superseded_by).toBe("crit-003");

			const crit3 = brd?.criteria.find((c) => c.id === "crit-003");
			expect(crit3?.supersedes).toBe("crit-002");
			expect(crit3?.superseded_by).toBe("crit-004");

			const crit4 = brd?.criteria.find((c) => c.id === "crit-004");
			expect(crit4?.supersedes).toBe("crit-003");
			expect(crit4?.superseded_by).toBe("crit-005");

			const crit5 = brd?.criteria.find((c) => c.id === "crit-005");
			expect(crit5?.supersedes).toBe("crit-004");
			expect(crit5?.superseded_by).toBeNull();
		});
	});

	describe("Test Case Supersession", () => {
		let planId: string;

		beforeEach(async () => {
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

			const result = await supersedeTestCase(specManager, planId, "test-001", {
				name: "Updated Test",
				description: "Updated description",
				steps: ["New Step 1", "New Step 2", "New Step 3"],
				expected_result: "New expected result",
				implemented: true,
				passing: true,
			});

			expect(result.content[0].text).toContain("success");
			expect(result.content[0].text).toContain("test-002");

			const plan = await specManager.plans.get(1);
			const newTest = plan?.test_cases.find((t) => t.id === "test-002");

			expect(newTest?.name).toBe("Updated Test");
			expect(newTest?.description).toBe("Updated description");
			expect(newTest?.steps).toHaveLength(3);
			expect(newTest?.implemented).toBe(true);
			expect(newTest?.passing).toBe(true);
			expect(newTest?.supersedes).toBe("test-001");
		});

		it("should handle partial updates in test case supersession", async () => {
			await addTestCase(
				specManager,
				planId,
				"Original Test",
				"Original description",
				["Step 1"],
				"Expected result",
			);

			// Update only the name and implementation status
			await supersedeTestCase(specManager, planId, "test-001", {
				name: "New Name",
				implemented: true,
			});

			const plan = await specManager.plans.get(1);
			const newTest = plan?.test_cases.find((t) => t.id === "test-002");

			expect(newTest?.name).toBe("New Name");
			expect(newTest?.implemented).toBe(true);
			// These should be preserved from original
			expect(newTest?.description).toBe("Original description");
			expect(newTest?.steps).toEqual(["Step 1"]);
			expect(newTest?.expected_result).toBe("Expected result");
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

			await supersedeTestCase(specManager, planId, "test-001", {
				name: "Test v2",
			});

			await supersedeTestCase(specManager, planId, "test-002", {
				name: "Test v3",
			});

			const plan = await specManager.plans.get(1);

			const test1 = plan?.test_cases.find((t) => t.id === "test-001");
			expect(test1?.superseded_by).toBe("test-002");

			const test2 = plan?.test_cases.find((t) => t.id === "test-002");
			expect(test2?.supersedes).toBe("test-001");
			expect(test2?.superseded_by).toBe("test-003");

			const test3 = plan?.test_cases.find((t) => t.id === "test-003");
			expect(test3?.supersedes).toBe("test-002");
			expect(test3?.superseded_by).toBeNull();
		});
	});

	describe("Flow Supersession", () => {
		let planId: string;

		beforeEach(async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", flows: [] }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should supersede a flow correctly", async () => {
			await addFlow(
				specManager,
				planId,
				"User Login",
				"Original login flow",
				["Visit page", "Enter credentials", "Submit"],
			);

			const result = await supersedeFlow(specManager, planId, "flow-001", {
				name: "Enhanced User Login",
				description: "Updated login flow with 2FA",
				steps: [
					"Visit page",
					"Enter credentials",
					"Enter 2FA code",
					"Submit",
				],
			});

			expect(result.content[0].text).toContain("success");

			const plan = await specManager.plans.get(1);
			const newFlow = plan?.flows.find((f) => f.id === "flow-002");

			expect(newFlow?.name).toBe("Enhanced User Login");
			expect(newFlow?.description).toBe("Updated login flow with 2FA");
			expect(newFlow?.steps).toHaveLength(4);
			expect(newFlow?.supersedes).toBe("flow-001");

			const oldFlow = plan?.flows.find((f) => f.id === "flow-001");
			expect(oldFlow?.superseded_by).toBe("flow-002");
		});

		it("should handle flow supersession with only step changes", async () => {
			await addFlow(
				specManager,
				planId,
				"Payment Flow",
				"Process payment",
				["Add to cart", "Checkout"],
			);

			await supersedeFlow(specManager, planId, "flow-001", {
				steps: ["Add to cart", "Apply coupon", "Checkout", "Confirm order"],
			});

			const plan = await specManager.plans.get(1);
			const newFlow = plan?.flows.find((f) => f.id === "flow-002");

			// Name and description should be preserved
			expect(newFlow?.name).toBe("Payment Flow");
			expect(newFlow?.description).toBe("Process payment");
			// Steps should be updated
			expect(newFlow?.steps).toHaveLength(4);
			expect(newFlow?.steps).toContain("Apply coupon");
		});
	});

	describe("API Contract Supersession", () => {
		let planId: string;

		beforeEach(async () => {
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
					request_schema: '{"name": "string", "email": "string"}',
					response_schema: '{"id": "string", "created_at": "datetime"}',
				},
			);

			expect(result.content[0].text).toContain("success");

			const plan = await specManager.plans.get(1);
			const newContract = plan?.api_contracts.find((c) => c.id === "api-002");

			expect(newContract?.description).toBe("Create user with validation");
			expect(newContract?.request_schema).toContain("email");
			expect(newContract?.response_schema).toContain("created_at");
			expect(newContract?.endpoint).toBe("/api/users");
			expect(newContract?.method).toBe("POST");
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
				request_schema: '{"page": "number", "limit": "number"}',
			});

			const plan = await specManager.plans.get(1);
			const newContract = plan?.api_contracts.find((c) => c.id === "api-002");

			expect(newContract?.endpoint).toBe("/api/posts");
			expect(newContract?.method).toBe("GET");
			expect(newContract?.description).toBe("List posts with pagination");
		});
	});

	describe("Data Model Supersession", () => {
		let planId: string;

		beforeEach(async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", data_models: [] }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should supersede a data model", async () => {
			await addDataModel(
				specManager,
				planId,
				"User",
				"User entity",
				["id: string", "name: string"],
			);

			const result = await supersedeDataModel(specManager, planId, "mdl-001", {
				description: "Enhanced user entity",
				fields: ["id: string", "name: string", "email: string", "role: enum"],
			});

			expect(result.content[0].text).toContain("success");

			const plan = await specManager.plans.get(1);
			const newModel = plan?.data_models.find((m) => m.id === "mdl-002");

			expect(newModel?.name).toBe("User");
			expect(newModel?.description).toBe("Enhanced user entity");
			expect(newModel?.fields).toHaveLength(4);
			expect(newModel?.fields).toContain("email: string");
			expect(newModel?.supersedes).toBe("mdl-001");
		});

		it("should handle data model name changes", async () => {
			await addDataModel(specManager, planId, "Post", "Blog post", [
				"id: string",
			]);

			await supersedeDataModel(specManager, planId, "mdl-001", {
				name: "Article",
				description: "Blog article",
			});

			const plan = await specManager.plans.get(1);
			const newModel = plan?.data_models.find((m) => m.id === "mdl-002");

			expect(newModel?.name).toBe("Article");
			expect(newModel?.description).toBe("Blog article");
			// Fields should be preserved
			expect(newModel?.fields).toEqual(["id: string"]);
		});
	});

	describe("Cross-Entity Reference Updates", () => {
		it("should update task references when used in multiple places", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			const planId = `pln-${plan.number}`;

			// Create a web of dependencies
			await addTask(specManager, planId, "Foundation task");
			await addTask(specManager, planId, "Task depending on 001", {
				depends_on: ["task-001"],
			});
			await addTask(specManager, planId, "Task depending on 001 and 002", {
				depends_on: ["task-001", "task-002"],
			});
			await addTask(specManager, planId, "Another task depending on 001", {
				depends_on: ["task-001"],
			});

			// Supersede the foundation task
			await addTask(specManager, planId, "Updated foundation task", {
				supersede_id: "task-001",
			});

			const updatedPlan = await specManager.plans.get(1);

			// Check all dependencies were updated
			const task2 = updatedPlan?.tasks.find((t) => t.id === "task-002");
			expect(task2?.depends_on).toEqual(["task-005"]);

			const task3 = updatedPlan?.tasks.find((t) => t.id === "task-003");
			expect(task3?.depends_on).toContain("task-005");
			expect(task3?.depends_on).toContain("task-002");

			const task4 = updatedPlan?.tasks.find((t) => t.id === "task-004");
			expect(task4?.depends_on).toEqual(["task-005"]);
		});

		it("should handle supersession when task has both depends_on and is depended on", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			const planId = `pln-${plan.number}`;

			// Create a dependency chain: 001 -> 002 -> 003
			await addTask(specManager, planId, "Task 1");
			await addTask(specManager, planId, "Task 2", {
				depends_on: ["task-001"],
			});
			await addTask(specManager, planId, "Task 3", {
				depends_on: ["task-002"],
			});

			// Supersede the middle task
			await addTask(specManager, planId, "Updated Task 2", {
				supersede_id: "task-002",
			});

			const updatedPlan = await specManager.plans.get(1);

			// task-004 should still depend on task-001
			const task4 = updatedPlan?.tasks.find((t) => t.id === "task-004");
			expect(task4?.depends_on).toEqual(["task-001"]);

			// task-003 should now depend on task-004
			const task3 = updatedPlan?.tasks.find((t) => t.id === "task-003");
			expect(task3?.depends_on).toEqual(["task-004"]);
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

			const result = await supersedeCriteria(specManager, brdId, "crit-001", {
				description: "Updated standalone criteria",
			});

			expect(result.content[0].text).toContain("success");

			const updatedBrd = await specManager.business_requirements.get(1);
			const newCriteria = updatedBrd?.criteria.find((c) => c.id === "crit-002");

			expect(newCriteria?.description).toBe("Updated standalone criteria");
		});

		it("should return error when superseding non-existent item", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", test_cases: [] }),
			);
			const planId = `pln-${plan.number}`;

			const result = await supersedeTestCase(specManager, planId, "test-999", {
				name: "New name",
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("not found");
		});

		it("should handle empty partial updates", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", flows: [] }),
			);
			const planId = `pln-${plan.number}`;

			await addFlow(specManager, planId, "Original Flow", "Description", [
				"Step 1",
			]);

			// Supersede with no changes (empty object)
			const result = await supersedeFlow(specManager, planId, "flow-001", {});

			expect(result.content[0].text).toContain("success");
			expect(result.content[0].text).toContain("No field changes");

			const updatedPlan = await specManager.plans.get(1);
			const newFlow = updatedPlan?.flows.find((f) => f.id === "flow-002");

			// Everything should be the same except IDs
			expect(newFlow?.name).toBe("Original Flow");
			expect(newFlow?.description).toBe("Description");
			expect(newFlow?.steps).toEqual(["Step 1"]);
		});

		it("should handle supersession with circular dependencies gracefully", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			const planId = `pln-${plan.number}`;

			// Create tasks
			await addTask(specManager, planId, "Task 1");
			await addTask(specManager, planId, "Task 2", {
				depends_on: ["task-001"],
			});

			// Try to create a circular dependency through supersession
			// (This should work at the supersession level but may fail validation later)
			const result = await addTask(specManager, planId, "Updated Task 1", {
				supersede_id: "task-001",
				depends_on: ["task-002"],
			});

			// The supersession itself should succeed
			expect(result.content[0].text).toContain("success");

			const updatedPlan = await specManager.plans.get(1);
			const task3 = updatedPlan?.tasks.find((t) => t.id === "task-003");

			// task-003 now depends on task-002
			expect(task3?.depends_on).toEqual(["task-002"]);
			// task-002 now depends on task-003 (circular!)
			const task2 = updatedPlan?.tasks.find((t) => t.id === "task-002");
			expect(task2?.depends_on).toEqual(["task-003"]);
		});
	});

	describe("Timestamp and Audit Trail", () => {
		it("should set superseded_at timestamp correctly", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			const brdId = `brd-${brd.number}`;

			const beforeSupersede = new Date().toISOString();

			await addCriteria(specManager, brdId, "Original", "Rationale");

			// Small delay to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			await supersedeCriteria(specManager, brdId, "crit-001", {
				description: "Updated",
			});

			const afterSupersede = new Date().toISOString();

			const updatedBrd = await specManager.business_requirements.get(1);
			const oldCriteria = updatedBrd?.criteria.find((c) => c.id === "crit-001");

			expect(oldCriteria?.superseded_at).toBeTruthy();
			expect(oldCriteria?.superseded_at).toBeLessThanOrEqual(afterSupersede);
		});

		it("should preserve audit trail through multiple supersessions", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan", tasks: [] }),
			);
			const planId = `pln-${plan.number}`;

			await addTask(specManager, planId, "Version 1");
			const timestamp1 = new Date().toISOString();

			await new Promise((resolve) => setTimeout(resolve, 10));
			await addTask(specManager, planId, "Version 2", {
				supersede_id: "task-001",
			});
			const timestamp2 = new Date().toISOString();

			await new Promise((resolve) => setTimeout(resolve, 10));
			await addTask(specManager, planId, "Version 3", {
				supersede_id: "task-002",
			});

			const updatedPlan = await specManager.plans.get(1);

			// All three versions should exist
			expect(updatedPlan?.tasks).toHaveLength(3);

			// Check timestamps are in order
			const task1 = updatedPlan?.tasks.find((t) => t.id === "task-001");
			const task2 = updatedPlan?.tasks.find((t) => t.id === "task-002");

			expect(task1?.superseded_at).toBeTruthy();
			expect(task2?.superseded_at).toBeTruthy();
			if (task1?.superseded_at && task2?.superseded_at) {
				expect(task1.superseded_at).toBeLessThan(task2.superseded_at);
			}
		});
	});
});
