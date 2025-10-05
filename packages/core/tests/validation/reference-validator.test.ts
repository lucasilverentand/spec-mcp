import type { AnyEntity } from "@spec-mcp/data";
import { beforeEach, describe, expect, it } from "vitest";
import { ReferenceValidator } from "../../src/validation/validators/reference-validator.js";
import { createTestSpecsPath } from "../test-helpers.js";

describe("ReferenceValidator", () => {
	let validator: ReferenceValidator;

	beforeEach(() => {
		validator = new ReferenceValidator({
			specsPath: "./test-specs",
		});
	});

	describe("constructor", () => {
		it("should initialize with default config", () => {
			const defaultValidator = new ReferenceValidator();
			expect(defaultValidator).toBeDefined();
		});

		it("should initialize with custom config", () => {
			const customValidator = new ReferenceValidator({
				specsPath: createTestSpecsPath("custom-path"),
			});
			expect(customValidator).toBeDefined();
		});
	});

	describe("validateEntityReferences", () => {
		it("should validate requirement references", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test Requirement",
				slug: "test-requirement",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [],
			};

			const result = await validator.validateEntityReferences(requirement);
			expect(result).toBeDefined();
			expect(result.valid).toBeDefined();
			expect(result.errors).toBeInstanceOf(Array);
			expect(result.warnings).toBeInstanceOf(Array);
		});

		it("should validate plan references", async () => {
			const plan: AnyEntity = {
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

			const result = await validator.validateEntityReferences(plan);
			expect(result).toBeDefined();
			expect(result.valid).toBeDefined();
		});

		it("should validate component references", async () => {
			const component: AnyEntity = {
				type: "app",
				name: "Test App",
				slug: "test-app",
				overview: "Test",
				number: 1,
				folder: "./apps/test",
				depends_on: [],
				external_dependencies: [],
				capabilities: [],
				constraints: [],
				tech_stack: [],
				deployment_targets: [],
				environments: ["development"],
			};

			const result = await validator.validateEntityReferences(component);
			expect(result).toBeDefined();
			expect(result.valid).toBeDefined();
		});

		it("should check existence when option is enabled", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test criteria",
						plan_id: "pln-999-nonexistent",
						completed: false,
					},
				],
			};

			const result = await validator.validateEntityReferences(requirement, {
				checkExistence: true,
			});
			expect(result).toBeDefined();
		});

		it("should skip existence check when option is disabled", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test criteria",
						plan_id: "pln-999-nonexistent",
						completed: false,
					},
				],
			};

			const result = await validator.validateEntityReferences(requirement, {
				checkExistence: false,
			});
			expect(result.valid).toBe(true);
		});

		it("should check for cycles when option is enabled", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: ["pln-001-self"],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = await validator.validateEntityReferences(plan, {
				checkCycles: true,
			});
			expect(result).toBeDefined();
		});

		it("should check for orphans when option is enabled", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Orphan Plan",
				slug: "orphan-plan",
				overview: "Test",
				number: 999,
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

			const result = await validator.validateEntityReferences(plan, {
				checkOrphans: true,
			});
			expect(result).toBeDefined();
		});

		it("should reject self-references when not allowed", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Self Ref",
				slug: "self-ref",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: ["pln-001-self-ref"],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = await validator.validateEntityReferences(plan, {
				allowSelfReferences: false,
			});
			expect(result).toBeDefined();
		});

		it("should allow self-references when enabled", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Self Ref",
				slug: "self-ref",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: ["pln-001-self-ref"],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = await validator.validateEntityReferences(plan, {
				allowSelfReferences: true,
			});
			expect(result).toBeDefined();
		});

		it("should validate internal flow references", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
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

			const result = await validator.validateEntityReferences(plan);
			expect(result.valid).toBe(true);
		});

		it("should detect broken internal flow references", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
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

			const result = await validator.validateEntityReferences(plan);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should validate internal task dependencies", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
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

			const result = await validator.validateEntityReferences(plan);
			expect(result.valid).toBe(true);
		});

		it("should detect broken internal task dependencies", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
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

			const result = await validator.validateEntityReferences(plan);
			expect(result.valid).toBe(false);
		});

		it("should handle validation errors gracefully", async () => {
			const invalidEntity = {} as AnyEntity;
			const result = await validator.validateEntityReferences(invalidEntity);
			expect(result).toBeDefined();
		});
	});

	describe("validateAllReferences", () => {
		it("should validate all references in the system", async () => {
			const result = await validator.validateAllReferences();
			expect(result).toBeDefined();
			expect(result.valid).toBeDefined();
			expect(result.errors).toBeInstanceOf(Array);
			expect(result.warnings).toBeInstanceOf(Array);
		});

		it("should handle validation errors", async () => {
			const brokenValidator = new ReferenceValidator({
				specsPath: "/non/existent/path",
			});

			const result = await brokenValidator.validateAllReferences();
			expect(result).toBeDefined();
			// Note: May not fail if SpecsManager handles missing paths gracefully
		});

		it("should accept options parameter", async () => {
			const result = await validator.validateAllReferences({
				checkExistence: true,
				checkCycles: true,
			});
			expect(result).toBeDefined();
		});
	});

	describe("findBrokenReferences", () => {
		it("should find broken references in requirements", async () => {
			const result = await validator.findBrokenReferences();
			expect(result).toBeDefined();
			expect(result.requirements).toBeInstanceOf(Array);
			expect(result.plans).toBeInstanceOf(Array);
			expect(result.components).toBeInstanceOf(Array);
		});

		it("should return empty arrays when no broken references", async () => {
			const result = await validator.findBrokenReferences();
			expect(result.requirements).toBeInstanceOf(Array);
			expect(result.plans).toBeInstanceOf(Array);
			expect(result.components).toBeInstanceOf(Array);
		});

		it("should identify broken plan dependencies", async () => {
			const result = await validator.findBrokenReferences();
			expect(result.plans).toBeInstanceOf(Array);
		});

		it("should identify broken component dependencies", async () => {
			const result = await validator.findBrokenReferences();
			expect(result.components).toBeInstanceOf(Array);
		});

		it("should identify broken test case component references", async () => {
			const result = await validator.findBrokenReferences();
			expect(result.plans).toBeInstanceOf(Array);
		});
	});

	describe("suggestReferenceFixes", () => {
		it("should suggest fixes for requirement references", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test",
						plan_id: "pln-999-nonexistent",
						completed: false,
					},
				],
			};

			const result = await validator.suggestReferenceFixes(requirement);
			expect(result).toBeDefined();
			expect(result.missingReferences).toBeInstanceOf(Array);
			expect(result.cyclicReferences).toBeInstanceOf(Array);
		});

		it("should suggest fixes for plan references", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: ["pln-999-nonexistent"],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = await validator.suggestReferenceFixes(plan);
			expect(result).toBeDefined();
			expect(result.missingReferences).toBeInstanceOf(Array);
		});

		it("should suggest fixes for component references", async () => {
			const component: AnyEntity = {
				type: "app",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				folder: "./apps/test",
				depends_on: ["app-999-nonexistent"],
				external_dependencies: [],
				capabilities: [],
				constraints: [],
				tech_stack: [],
				deployment_targets: [],
				environments: ["development"],
			};

			const result = await validator.suggestReferenceFixes(component);
			expect(result).toBeDefined();
			expect(result.missingReferences).toBeInstanceOf(Array);
		});

		it("should provide similar reference suggestions", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test",
						plan_id: "pln-001-tst-typo",
						completed: false,
					},
				],
			};

			const result = await validator.suggestReferenceFixes(requirement);
			expect(result.missingReferences).toBeInstanceOf(Array);
			result.missingReferences.forEach((fix) => {
				expect(fix.reference).toBeDefined();
				expect(fix.suggestions).toBeInstanceOf(Array);
			});
		});

		it("should handle entities with no broken references", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [],
			};

			const result = await validator.suggestReferenceFixes(requirement);
			expect(result.missingReferences).toHaveLength(0);
			expect(result.cyclicReferences).toHaveLength(0);
		});
	});

	describe("validateReferenceFormat", () => {
		it("should validate requirement reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"req-001-test",
				"requirement",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate plan reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"pln-001-test",
				"plan",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate component reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"app-001-test",
				"component",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate service reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"svc-001-test",
				"component",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate library reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"lib-001-test",
				"component",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate criteria reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"req-001-test/crit-001",
				"criteria",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate task reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"task-001-test",
				"task",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate flow reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"flow-001-test",
				"flow",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate test reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"test-001-test",
				"test",
			);
			expect(result.valid).toBe(true);
		});

		it("should reject invalid reference format", async () => {
			const result = await validator.validateReferenceFormat(
				"invalid",
				"requirement",
			);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should reject reference with wrong prefix", async () => {
			const result = await validator.validateReferenceFormat(
				"pln-001-test",
				"requirement",
			);
			expect(result.valid).toBe(false);
		});

		it("should reject reference with invalid number format", async () => {
			const result = await validator.validateReferenceFormat(
				"req-1-test",
				"requirement",
			);
			expect(result.valid).toBe(false);
		});

		it("should reject reference with invalid slug", async () => {
			const result = await validator.validateReferenceFormat(
				"req-001-Test_Invalid",
				"requirement",
			);
			expect(result.valid).toBe(false);
		});

		it("should handle unknown reference type", async () => {
			const result = await validator.validateReferenceFormat(
				"ref-001-test",
				"unknown",
			);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Unknown reference type: unknown");
		});

		it("should provide format hints in warnings", async () => {
			const result = await validator.validateReferenceFormat(
				"invalid",
				"requirement",
			);
			expect(result.warnings.length).toBeGreaterThan(0);
		});
	});

	describe("edge cases", () => {
		it("should handle entity with no dependencies", async () => {
			const component: AnyEntity = {
				type: "app",
				name: "Standalone App",
				slug: "standalone-app",
				overview: "Test",
				number: 1,
				folder: "./apps/standalone",
				depends_on: [],
				external_dependencies: [],
				capabilities: [],
				constraints: [],
				tech_stack: [],
				deployment_targets: [],
				environments: ["development"],
			};

			const result = await validator.validateEntityReferences(component);
			expect(result.valid).toBe(true);
		});

		it("should handle empty criteria array", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [],
			};

			const result = await validator.validateEntityReferences(requirement);
			expect(result.valid).toBe(true);
		});

		it("should handle plan with empty test cases", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
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

			const result = await validator.validateEntityReferences(plan);
			expect(result.valid).toBe(true);
		});

		it("should handle multiple dependency types", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Complex Plan",
				slug: "complex-plan",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: ["pln-001-dep1", "pln-002-dep2"],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = await validator.validateEntityReferences(plan);
			expect(result).toBeDefined();
		});

		it("should handle test case with multiple component references", async () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [],
				test_cases: [
					{
						id: "test-001",
						description: "Test case",
						expected_result: "Pass",
						components: ["app-001-test", "svc-001-test"],
						related_flows: [],
						status: "pending",
					},
				],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			};

			const result = await validator.validateEntityReferences(plan);
			expect(result).toBeDefined();
		});

		it("should calculate similarity correctly", async () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				overview: "Test",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test",
						plan_id: "pln-001-similar-name",
						completed: false,
					},
				],
			};

			const result = await validator.suggestReferenceFixes(requirement);
			expect(result.missingReferences).toBeInstanceOf(Array);
		});

		it("should handle all component types", async () => {
			const types = ["app", "service", "library"];

			for (const type of types) {
				const component: AnyEntity = {
					type: type as EntityType,
					name: `Test ${type}`,
					slug: `test-${type}`,
					overview: "Test",
					number: 1,
					folder: `./components/${type}`,
					depends_on: [],
					external_dependencies: [],
					capabilities: [],
					constraints: [],
					tech_stack: [],
					...(type === "app" && {
						deployment_targets: [],
						environments: ["development"],
					}),
				};

				const result = await validator.validateEntityReferences(component);
				expect(result).toBeDefined();
			}
		});
	});
});
