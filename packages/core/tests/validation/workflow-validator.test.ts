import type { Plan } from "@spec-mcp/data";
import { describe, expect, it } from "vitest";
import { WorkflowValidator } from "../../src/validation/validators/workflow-validator.js";

describe("WorkflowValidator", () => {
	describe("validatePlanWorkflow", () => {
		it("should validate a valid plan workflow", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test overview",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test acceptance criteria",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Task 1",
						completed: false,
						depends_on: [],
						priority: "medium",
					},
				],
				flows: [
					{
						id: "flow-001",
						name: "Test Flow",
						overview: "Test flow",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [
					{
						id: "test-001",
						description: "Test case",
						expected_result: "Pass",
						components: [],
						related_flows: ["flow-001"],
						status: "pending",
					},
				],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should detect flow continuity issues", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Broken Flow",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: ["step-999"],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				checkFlowContinuity: true,
			});
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should detect task dependency issues", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Task 1",
						completed: false,
						depends_on: ["task-999"],
						priority: "medium",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				checkTaskDependencies: true,
			});
			expect(result.valid).toBe(false);
		});

		it("should detect test coverage issues", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Untested Flow",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				checkTestCoverage: true,
			});
			expect(result.warnings.length).toBeGreaterThan(0);
		});

		it("should skip checks when options are disabled", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Task 1",
						completed: false,
						depends_on: ["task-999"],
						priority: "medium",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				checkTaskDependencies: false,
			});
			expect(result.valid).toBe(true);
		});

		it("should detect task cycles", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Task 1",
						completed: false,
						depends_on: ["task-002"],
						priority: "medium",
					},
					{
						id: "task-002",
						description: "Task 2",
						completed: false,
						depends_on: ["task-001"],
						priority: "medium",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				checkTaskDependencies: true,
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes("cycle"))).toBe(true);
		});

		it("should validate parallel tasks", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Task 1",
						completed: false,
						depends_on: [],
						priority: "medium",
					},
					{
						id: "task-002",
						description: "Task 2",
						completed: false,
						depends_on: [],
						priority: "medium",
					},
					{
						id: "task-003",
						description: "Task 3",
						completed: false,
						depends_on: [],
						priority: "medium",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				allowParallelTasks: true,
			});
			expect(result.valid).toBe(true);
		});

		it("should warn about excessive parallel tasks", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: Array(5)
					.fill(null)
					.map((_, i) => ({
						id: `task-${i.toString().padStart(3, "0")}`,
						description: `Task ${i}`,
						completed: false,
						depends_on: [],
						priority: "medium" as const,
					})),
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				allowParallelTasks: false,
			});
			expect(result.warnings.length).toBeGreaterThan(0);
		});

		it("should handle validation errors gracefully", () => {
			const plan = null as unknown as Plan;
			const result = WorkflowValidator.validatePlanWorkflow(plan);
			expect(result.valid).toBe(false);
		});

		it("should validate workflow integrity", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Task 1",
						completed: false,
						depends_on: [],
						priority: "low",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan);
			expect(result.warnings).toContain(
				"No high-priority tasks defined - consider marking important tasks as high priority",
			);
		});
	});

	describe("validateFlowExecution", () => {
		it("should validate flow exists", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validateFlowExecution(plan, "flow-999");
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Flow 'flow-999' not found in plan");
		});

		it("should validate flow has starting step", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Circular Flow",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: ["step-002"],
							},
							{
								id: "step-002",
								description: "Step 2",
								next_steps: ["step-001"],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validateFlowExecution(plan, "flow-001");
			expect(result.valid).toBe(false);
		});

		it("should warn about multiple starting steps", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Multiple Starts",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Start 1",
								next_steps: [],
							},
							{
								id: "step-002",
								description: "Start 2",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validateFlowExecution(plan, "flow-001");
			expect(result.warnings.length).toBeGreaterThan(0);
		});

		it("should check reachability from current step", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Test Flow",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: ["step-002"],
							},
							{
								id: "step-002",
								description: "Step 2",
								next_steps: [],
							},
							{
								id: "step-003",
								description: "Unreachable",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validateFlowExecution(
				plan,
				"flow-001",
				"step-001",
			);
			expect(result.warnings.some((w) => w.includes("unreachable"))).toBe(true);
		});

		it("should validate flow without current step", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Test Flow",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validateFlowExecution(plan, "flow-001");
			expect(result).toBeDefined();
		});
	});

	describe("generateWorkflowContext", () => {
		it("should generate context for plan", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Completed Task",
						completed: true,
						depends_on: [],
						priority: "medium",
					},
					{
						id: "task-002",
						description: "Available Task",
						completed: false,
						depends_on: ["task-001"],
						priority: "medium",
					},
					{
						id: "task-003",
						description: "Blocked Task",
						completed: false,
						depends_on: ["task-002"],
						priority: "medium",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const context = WorkflowValidator.generateWorkflowContext(plan);
			expect(context.plans).toContain(plan);
			expect(context.completedSteps).toContain("task-001");
			expect(context.nextSteps).toContain("task-002");
			expect(context.blockers).toContain("task-003");
		});

		it("should identify available tasks", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Available",
						completed: false,
						depends_on: [],
						priority: "medium",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const context = WorkflowValidator.generateWorkflowContext(plan);
			expect(context.nextSteps).toContain("task-001");
		});

		it("should set default current step", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const context = WorkflowValidator.generateWorkflowContext(plan);
			expect(context.currentStep).toBe("planning");
		});
	});

	describe("validateTaskSequence", () => {
		it("should validate valid task sequence", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Task 1",
					completed: false,
					depends_on: [],
					priority: "medium",
				},
				{
					id: "task-002",
					description: "Task 2",
					completed: false,
					depends_on: ["task-001"],
					priority: "medium",
				},
			];

			const result = WorkflowValidator.validateTaskSequence(tasks);
			expect(result.valid).toBe(true);
		});

		it("should detect task cycles", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Task 1",
					depends_on: ["task-002"],
				},
				{
					id: "task-002",
					description: "Task 2",
					depends_on: ["task-001"],
				},
			];

			const result = WorkflowValidator.validateTaskSequence(tasks);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes("Circular"))).toBe(true);
		});

		it("should detect missing dependencies", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Task 1",
					depends_on: ["task-999"],
				},
			];

			const result = WorkflowValidator.validateTaskSequence(tasks);
			expect(result.valid).toBe(false);
		});

		it("should warn about orphaned tasks", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Connected",
					depends_on: [],
				},
				{
					id: "task-002",
					description: "Depends on 1",
					depends_on: ["task-001"],
				},
				{
					id: "task-003",
					description: "Orphan",
					depends_on: [],
				},
			];

			const result = WorkflowValidator.validateTaskSequence(tasks);
			expect(result.warnings.some((w) => w.includes("Orphaned"))).toBe(true);
		});

		it("should handle empty task list", () => {
			const result = WorkflowValidator.validateTaskSequence([]);
			expect(result.valid).toBe(true);
		});

		it("should handle single task", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Only task",
					depends_on: [],
				},
			];

			const result = WorkflowValidator.validateTaskSequence(tasks);
			expect(result.valid).toBe(true);
		});
	});

	describe("optimizeTaskOrder", () => {
		it("should optimize task order", () => {
			const tasks = [
				{
					id: "task-003",
					description: "Task 3",
					depends_on: ["task-001", "task-002"],
				},
				{
					id: "task-001",
					description: "Task 1",
					depends_on: [],
				},
				{
					id: "task-002",
					description: "Task 2",
					depends_on: ["task-001"],
				},
			];

			const optimized = WorkflowValidator.optimizeTaskOrder(tasks);
			expect(optimized[0]?.id).toBe("task-001");
			expect(optimized[1]?.id).toBe("task-002");
			expect(optimized[2]?.id).toBe("task-003");
		});

		it("should handle parallel tasks", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Task 1",
					depends_on: [],
				},
				{
					id: "task-002",
					description: "Task 2",
					depends_on: [],
				},
			];

			const optimized = WorkflowValidator.optimizeTaskOrder(tasks);
			expect(optimized).toHaveLength(2);
		});

		it("should handle empty task list", () => {
			const optimized = WorkflowValidator.optimizeTaskOrder([]);
			expect(optimized).toHaveLength(0);
		});

		it("should handle single task", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Only task",
					depends_on: [],
				},
			];

			const optimized = WorkflowValidator.optimizeTaskOrder(tasks);
			expect(optimized).toHaveLength(1);
			expect(optimized[0]?.id).toBe("task-001");
		});

		it("should preserve task data", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Task 1",
					depends_on: [],
					priority: "high",
					extraData: "preserved",
				},
			];

			const optimized = WorkflowValidator.optimizeTaskOrder(tasks);
			expect(optimized[0]).toEqual(tasks[0]);
		});

		it("should handle complex dependency graph", () => {
			const tasks = [
				{
					id: "task-004",
					description: "Task 4",
					depends_on: ["task-002", "task-003"],
				},
				{ id: "task-002", description: "Task 2", depends_on: ["task-001"] },
				{ id: "task-001", description: "Task 1", depends_on: [] },
				{ id: "task-003", description: "Task 3", depends_on: ["task-001"] },
			];

			const optimized = WorkflowValidator.optimizeTaskOrder(tasks);
			const task1Index = optimized.findIndex((t) => t.id === "task-001");
			const task2Index = optimized.findIndex((t) => t.id === "task-002");
			const task3Index = optimized.findIndex((t) => t.id === "task-003");
			const task4Index = optimized.findIndex((t) => t.id === "task-004");

			expect(task1Index).toBeLessThan(task2Index);
			expect(task1Index).toBeLessThan(task3Index);
			expect(task2Index).toBeLessThan(task4Index);
			expect(task3Index).toBeLessThan(task4Index);
		});
	});

	describe("edge cases", () => {
		it("should handle plan with no flows", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan);
			expect(result).toBeDefined();
		});

		it("should handle plan with no tasks", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Test Flow",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan);
			expect(result).toBeDefined();
		});

		it("should handle flow with duplicate step IDs", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Duplicate Steps",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: [],
							},
							{
								id: "step-001",
								description: "Duplicate",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				checkFlowContinuity: true,
			});
			expect(result.valid).toBe(false);
		});

		it("should handle flow with no end steps", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Infinite Loop",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: ["step-002"],
							},
							{
								id: "step-002",
								description: "Step 2",
								next_steps: ["step-001"],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan, {
				checkFlowContinuity: true,
			});
			expect(result.warnings.some((w) => w.includes("no ending step"))).toBe(
				true,
			);
		});

		it("should handle disconnected tasks and flows", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "Task 1",
						completed: false,
						depends_on: [],
						priority: "medium",
					},
				],
				flows: [
					{
						id: "flow-001",
						name: "Flow 1",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Step 1",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan);
			expect(result.warnings.some((w) => w.includes("disconnected"))).toBe(
				true,
			);
		});

		it("should handle complex flow with multiple branches", () => {
			const plan: Plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [
					{
						id: "flow-001",
						name: "Branching Flow",
						overview: "Test",
						steps: [
							{
								id: "step-001",
								description: "Start",
								next_steps: ["step-002", "step-003"],
							},
							{
								id: "step-002",
								description: "Branch A",
								next_steps: ["step-004"],
							},
							{
								id: "step-003",
								description: "Branch B",
								next_steps: ["step-004"],
							},
							{
								id: "step-004",
								description: "Merge",
								next_steps: [],
							},
						],
					},
				],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = WorkflowValidator.validatePlanWorkflow(plan);
			expect(result.valid).toBe(true);
		});

		it("should handle self-referencing task", () => {
			const tasks = [
				{
					id: "task-001",
					description: "Self-referencing",
					depends_on: ["task-001"],
				},
			];

			const result = WorkflowValidator.validateTaskSequence(tasks);
			expect(result.valid).toBe(false);
		});
	});
});
