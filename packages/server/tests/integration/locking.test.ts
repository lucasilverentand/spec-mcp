import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SpecOperations } from "@spec-mcp/core";
import { createTestSpecsPath, cleanupTestSpecs } from "../test-helpers.js";

describe("Spec Locking Integration Tests", () => {
	let operations: SpecOperations;
	let testSpecsDir: string;

	beforeEach(async () => {
		testSpecsDir = createTestSpecsPath("locking-tests");
		operations = new SpecOperations({ specsPath: testSpecsDir });
	});

	afterEach(async () => {
		await cleanupTestSpecs(testSpecsDir);
	});

	describe("Plan Locking", () => {
		it("should prevent structural changes to locked plan", async () => {
			// Create a plan
			const createResult = await operations.createPlan({
				type: "plan",
				slug: "test-plan",
				name: "Test Plan",
				description: "A test plan",
				priority: "medium",
				acceptance_criteria: "Should be lockable",
				tasks: [],
				completed: false,
				approved: false,
			});
			expect(createResult.success).toBe(true);
			const planId = createResult.data!.id;

			// Lock the plan
			const lockResult = await operations.updatePlan(planId, {
				locked: true,
				locked_at: new Date().toISOString(),
				locked_by: "integration-test",
			});
			expect(lockResult.success).toBe(true);

			// Try to update name (should fail)
			const updateResult = await operations.updatePlan(planId, {
				name: "Modified Name",
			});
			expect(updateResult.success).toBe(false);
			expect(updateResult.error).toContain("locked");

			// Try to update description (should fail)
			const updateDescResult = await operations.updatePlan(planId, {
				description: "Modified description",
			});
			expect(updateDescResult.success).toBe(false);
			expect(updateDescResult.error).toContain("locked");
		});

		it("should allow progress updates to locked plan", async () => {
			// Create a plan
			const createResult = await operations.createPlan({
				type: "plan",
				slug: "test-plan-2",
				name: "Test Plan 2",
				description: "Another test plan",
				priority: "high",
				acceptance_criteria: "Should allow progress updates",
				tasks: [],
				completed: false,
				approved: false,
			});
			expect(createResult.success).toBe(true);
			const planId = createResult.data!.id;

			// Lock the plan
			await operations.updatePlan(planId, {
				locked: true,
				locked_at: new Date().toISOString(),
			});

			// Update completion status (should succeed)
			const completeResult = await operations.updatePlan(planId, {
				completed: true,
				completed_at: new Date().toISOString(),
			});
			expect(completeResult.success).toBe(true);
			expect(completeResult.data!.completed).toBe(true);

			// Update approval status (should succeed)
			const approveResult = await operations.updatePlan(planId, {
				approved: true,
			});
			expect(approveResult.success).toBe(true);
			expect(approveResult.data!.approved).toBe(true);
		});

		it("should allow unlocking and then updating", async () => {
			// Create and lock a plan
			const createResult = await operations.createPlan({
				type: "plan",
				slug: "test-plan-3",
				name: "Test Plan 3",
				description: "Unlockable plan",
				priority: "low",
				acceptance_criteria: "Should be unlockable",
				tasks: [],
				completed: false,
				approved: false,
			});
			expect(createResult.success).toBe(true);
			const planId = createResult.data!.id;

			await operations.updatePlan(planId, {
				locked: true,
				locked_at: new Date().toISOString(),
			});

			// Unlock
			const unlockResult = await operations.updatePlan(planId, {
				locked: false,
			});
			expect(unlockResult.success).toBe(true);

			// Now structural updates should work
			const updateResult = await operations.updatePlan(planId, {
				name: "Updated Name After Unlock",
				description: "Updated description",
			});
			expect(updateResult.success).toBe(true);
			expect(updateResult.data!.name).toBe("Updated Name After Unlock");
		});

		it("should allow progress booleans on locked plan", async () => {
			// Create a plan
			const createResult = await operations.createPlan({
				type: "plan",
				slug: "test-plan-4",
				name: "Test Plan 4",
				description: "Plan with progress tracking",
				priority: "medium",
				acceptance_criteria: "Progress should be trackable",
				tasks: [],
				completed: false,
				approved: false,
			});
			expect(createResult.success).toBe(true);
			const planId = createResult.data!.id;

			// Lock the plan
			await operations.updatePlan(planId, {
				locked: true,
				locked_at: new Date().toISOString(),
			});

			// Update progress booleans
			const updateResult = await operations.updatePlan(planId, {
				completed: true,
				completed_at: new Date().toISOString(),
			});
			expect(updateResult.success).toBe(true);
			expect(updateResult.data!.completed).toBe(true);
		});

		it("should reject task structural changes on locked plan", async () => {
			// Create a plan with tasks
			const createResult = await operations.createPlan({
				type: "plan",
				slug: "test-plan-5",
				name: "Test Plan 5",
				description: "Plan with immutable tasks",
				priority: "medium",
				acceptance_criteria: "Task structure should be locked",
				tasks: [
					{
						id: "task-001",
						description: "Original task description",
						priority: "medium",
						depends_on: [],
						considerations: ["Important consideration"],
						references: [],
						files: [],
						completed: false,
						verified: false,
						notes: [],
					},
				],
				completed: false,
				approved: false,
			});
			expect(createResult.success).toBe(true);
			const planId = createResult.data!.id;

			// Lock the plan
			await operations.updatePlan(planId, {
				locked: true,
				locked_at: new Date().toISOString(),
			});

			// Try to update task description (should fail)
			const getPlanResult = await operations.getPlan(planId);
			const updatedTasks = getPlanResult.data!.tasks.map((task) => ({
				...task,
				description: "Modified task description",
			}));

			const updateResult = await operations.updatePlan(planId, {
				tasks: updatedTasks,
			});
			expect(updateResult.success).toBe(false);
			expect(updateResult.error).toContain("locked");
		});
	});

	describe("Requirement Locking", () => {
		it("should prevent updates to locked requirement", async () => {
			// Create a requirement
			const createResult = await operations.createRequirement({
				type: "requirement",
				slug: "test-req",
				name: "Test Requirement",
				description: "A test requirement",
				priority: "required",
				criteria: [
					{
						id: "crit-001",
						description: "First criterion",
						status: "active",
					},
				],
			});
			expect(createResult.success).toBe(true);
			const reqId = createResult.data!.id;

			// Lock the requirement
			const lockResult = await operations.updateRequirement(reqId, {
				locked: true,
				locked_at: new Date().toISOString(),
			});
			expect(lockResult.success).toBe(true);

			// Try to update name (should fail)
			const updateResult = await operations.updateRequirement(reqId, {
				name: "Modified Requirement Name",
			});
			expect(updateResult.success).toBe(false);
			expect(updateResult.error).toContain("locked");
		});

		it("should allow unlocking requirement", async () => {
			// Create and lock a requirement
			const createResult = await operations.createRequirement({
				type: "requirement",
				slug: "test-req-2",
				name: "Test Requirement 2",
				description: "Unlockable requirement",
				priority: "ideal",
				criteria: [
					{
						id: "crit-001",
						description: "Test criterion",
						status: "active",
					},
				],
			});
			expect(createResult.success).toBe(true);
			const reqId = createResult.data!.id;

			await operations.updateRequirement(reqId, {
				locked: true,
				locked_at: new Date().toISOString(),
			});

			// Unlock
			const unlockResult = await operations.updateRequirement(reqId, {
				locked: false,
			});
			expect(unlockResult.success).toBe(true);

			// Now updates should work
			const updateResult = await operations.updateRequirement(reqId, {
				name: "Updated After Unlock",
			});
			expect(updateResult.success).toBe(true);
			expect(updateResult.data!.name).toBe("Updated After Unlock");
		});
	});

	describe("Component Locking", () => {
		it("should prevent updates to locked component", async () => {
			// Create a component
			const createResult = await operations.createComponent({
				type: "service",
				slug: "test-service",
				name: "Test Service",
				description: "A test service",
				folder: "./services/test",
				tech_stack: ["Node.js"],
				testing_setup: {
					frameworks: ["Vitest"],
					coverage_target: 90,
					test_commands: {},
					test_patterns: [],
				},
				deployment: {
					platform: "Test Platform",
					environment_vars: [],
					secrets: [],
				},
				scope: {
					in_scope: [
						{
							item: "Core functionality",
							reasoning: "Primary responsibility",
						},
					],
					out_of_scope: [
						{
							item: "External services",
							reasoning: "Handled elsewhere",
						},
					],
				},
				depends_on: [],
				external_dependencies: [],
			});
			expect(createResult.success).toBe(true);
			const componentId = createResult.data!.id;

			// Lock the component
			const lockResult = await operations.updateComponent(componentId, {
				locked: true,
				locked_at: new Date().toISOString(),
			});
			expect(lockResult.success).toBe(true);

			// Try to update name (should fail)
			const updateResult = await operations.updateComponent(componentId, {
				name: "Modified Service Name",
			});
			expect(updateResult.success).toBe(false);
			expect(updateResult.error).toContain("locked");
		});
	});
});
