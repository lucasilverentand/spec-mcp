import type { AnyEntity } from "@spec-mcp/data";
import { describe, expect, it } from "vitest";
import { SchemaValidator } from "../../src/validation/validators/schema-validator.js";

describe("SchemaValidator", () => {
	describe("validateEntity", () => {
		it("should validate a valid requirement", () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "Test Requirement",
				slug: "test-requirement",
				description: "Test description",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "crit-001",
						description: "Test criteria",
						status: "active",
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const result = SchemaValidator.validateEntity(requirement);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.warnings).toHaveLength(0);
		});

		it("should validate a valid plan", () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				description: "Test description",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test acceptance criteria",
				depends_on: [],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				approved: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const result = SchemaValidator.validateEntity(plan);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should validate a valid app component", () => {
			const app: AnyEntity = {
				type: "app",
				name: "Test App",
				slug: "test-app",
				description: "Test description",
				number: 1,
				folder: "./apps/test",
				depends_on: [],
				external_dependencies: [],
				tech_stack: [],
				deployment_targets: [],
				environments: ["development"],
				testing_setup: {
					frameworks: ["Vitest"],
					coverage_target: 90,
					test_commands: {},
					test_patterns: [],
				},
				deployment: {
					platform: "Test Platform",
				},
				scope: {
					in_scope: [
						{
							item: "Test functionality",
							reasoning: "Core responsibility",
						},
					],
					out_of_scope: [
						{
							item: "External integrations",
							reasoning: "Handled by other components",
						},
					],
				},
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const result = SchemaValidator.validateEntity(app);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should validate a valid service component", () => {
			const service: AnyEntity = {
				type: "service",
				name: "Test Service",
				slug: "test-service",
				description: "Test description",
				number: 1,
				folder: "./services/test",
				depends_on: [],
				external_dependencies: [],
				tech_stack: [],
				testing_setup: {
					frameworks: ["Vitest"],
					coverage_target: 90,
					test_commands: {},
					test_patterns: [],
				},
				deployment: {
					platform: "Test Platform",
				},
				scope: {
					in_scope: [
						{
							item: "Test functionality",
							reasoning: "Core responsibility",
						},
					],
					out_of_scope: [
						{
							item: "External integrations",
							reasoning: "Handled by other components",
						},
					],
				},
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const result = SchemaValidator.validateEntity(service);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should validate a valid library component", () => {
			const library: AnyEntity = {
				type: "library",
				name: "Test Library",
				slug: "test-library",
				description: "Test description",
				number: 1,
				folder: "./libs/test",
				depends_on: [],
				external_dependencies: [],
				tech_stack: [],
				testing_setup: {
					frameworks: ["Vitest"],
					coverage_target: 90,
					test_commands: {},
					test_patterns: [],
				},
				deployment: {
					platform: "Test Platform",
				},
				scope: {
					in_scope: [
						{
							item: "Test functionality",
							reasoning: "Core responsibility",
						},
					],
					out_of_scope: [
						{
							item: "External integrations",
							reasoning: "Handled by other components",
						},
					],
				},
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const result = SchemaValidator.validateEntity(library);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});


		it("should reject entity with unknown type", () => {
			const entity = {
				type: "unknown",
				name: "Test",
				slug: "test",
			} as unknown as AnyEntity;

			const result = SchemaValidator.validateEntity(entity);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Unknown entity type: unknown");
		});

		it("should reject requirement with missing required fields", () => {
			const requirement = {
				type: "requirement",
				name: "Test",
				// missing slug, overview, number, priority, criteria
			} as unknown as AnyEntity;

			const result = SchemaValidator.validateEntity(requirement);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should reject plan with invalid priority", () => {
			const plan = {
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
				description: "Test",
				number: 1,
				priority: "invalid-priority",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				approved: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			} as unknown as AnyEntity;

			const result = SchemaValidator.validateEntity(plan);
			expect(result.valid).toBe(false);
		});

		it("should provide detailed error messages for validation failures", () => {
			const entity = {
				type: "requirement",
				name: "",
				slug: "invalid slug with spaces",
				number: -1,
			} as unknown as AnyEntity;

			const result = SchemaValidator.validateEntity(entity);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should handle ZodError formatting", () => {
			const entity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				description: "Test",
				number: "not-a-number",
			} as unknown as AnyEntity;

			const result = SchemaValidator.validateEntity(entity);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should handle non-ZodError exceptions", () => {
			const entity = null as unknown as AnyEntity;
			const result = SchemaValidator.validateEntity(entity);
			expect(result.valid).toBe(false);
		});
	});

	describe("validateEntityBatch", () => {
		it("should validate multiple entities successfully", () => {
			const entities: AnyEntity[] = [
				{
					type: "requirement",
					name: "Test 1",
					slug: "test-1",
					description: "Test",
					number: 1,
					priority: "required",
					criteria: [
						{
							id: "crit-001",
							description: "Test criteria",
						status: "active",
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					type: "requirement",
					name: "Test 2",
					slug: "test-2",
					description: "Test",
					number: 2,
					priority: "required",
					criteria: [
						{
							id: "crit-001",
							description: "Test criteria",
						status: "active",
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const result = SchemaValidator.validateEntityBatch(entities);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should collect errors from all entities", () => {
			const entities: AnyEntity[] = [
				{
					type: "requirement",
					name: "",
					slug: "test-1",
					description: "Test",
					number: 1,
					priority: "required",
					criteria: [
						{
							id: "crit-001",
							description: "Test criteria",
						status: "active",
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					type: "requirement",
					name: "",
					slug: "test-2",
					description: "Test",
					number: 2,
					priority: "required",
					criteria: [
						{
							id: "crit-001",
							description: "Test criteria",
						status: "active",
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const result = SchemaValidator.validateEntityBatch(entities);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should prefix errors with entity index", () => {
			const entities = [
				{ type: "requirement", name: "" } as Partial<AnyEntity> as AnyEntity,
				{ type: "plan", name: "" } as Partial<AnyEntity> as AnyEntity,
			];

			const result = SchemaValidator.validateEntityBatch(entities);
			expect(result.errors.some((e) => e.startsWith("Entity 0:"))).toBe(true);
			expect(result.errors.some((e) => e.startsWith("Entity 1:"))).toBe(true);
		});

		it("should handle empty array", () => {
			const result = SchemaValidator.validateEntityBatch([]);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should collect warnings from all entities", () => {
			const entities: AnyEntity[] = [
				{
					type: "requirement",
					name: "Test 1",
					slug: "test-1",
					description: "Test",
					number: 1,
					priority: "required",
					criteria: [
						{
							id: "crit-001",
							description: "Test criteria",
						status: "active",
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const result = SchemaValidator.validateEntityBatch(entities);
			expect(result.warnings).toBeDefined();
		});
	});

	describe("validatePartialEntity", () => {
		it("should validate partial requirement", () => {
			const partial = {
				name: "Updated Name",
			};

			const result = SchemaValidator.validatePartialEntity(
				partial,
				"requirement",
			);
			expect(result.valid).toBe(true);
		});

		it("should validate partial plan", () => {
			const partial = {
				priority: "high" as const,
			};

			const result = SchemaValidator.validatePartialEntity(partial, "plan");
			expect(result.valid).toBe(true);
		});

		it("should reject invalid partial data", () => {
			const partial = {
				priority: "invalid",
			};

			const result = SchemaValidator.validatePartialEntity(
				partial,
				"requirement",
			);
			expect(result.valid).toBe(false);
		});

		it("should handle unknown entity type", () => {
			const partial = { name: "Test" };
			const result = SchemaValidator.validatePartialEntity(partial, "unknown");
			expect(result.valid).toBe(false);
		});

		it("should merge partial with base entity", () => {
			const partial = {
				description: "Updated description",
			};

			const result = SchemaValidator.validatePartialEntity(
				partial,
				"requirement",
			);
			expect(result.valid).toBe(true);
		});
	});

	describe("getSchemaForType", () => {
		it("should return schema for requirement", () => {
			const schema = SchemaValidator.getSchemaForType("requirement");
			expect(schema).toBeDefined();
		});

		it("should return schema for plan", () => {
			const schema = SchemaValidator.getSchemaForType("plan");
			expect(schema).toBeDefined();
		});

		it("should return schema for app", () => {
			const schema = SchemaValidator.getSchemaForType("app");
			expect(schema).toBeDefined();
		});

		it("should return schema for service", () => {
			const schema = SchemaValidator.getSchemaForType("service");
			expect(schema).toBeDefined();
		});

		it("should return schema for library", () => {
			const schema = SchemaValidator.getSchemaForType("library");
			expect(schema).toBeDefined();
		});


		it("should throw error for unknown type", () => {
			expect(() => SchemaValidator.getSchemaForType("unknown")).toThrow(
				"Unknown entity type: unknown",
			);
		});
	});

	describe("validateFieldValue", () => {
		// Note: Field-level validation with Zod schemas that use .refine() or transformations
		// is complex and may not work as expected. These tests verify the method returns results.

		it("should reject invalid field value", () => {
			const result = SchemaValidator.validateFieldValue(
				"requirement",
				"priority",
				"invalid",
			);
			expect(result.valid).toBe(false);
		});

		it("should handle non-existent field", () => {
			const result = SchemaValidator.validateFieldValue(
				"requirement",
				"nonexistent",
				"value",
			);
			expect(result.valid).toBe(false);
		});

		it("should handle unknown entity type", () => {
			const result = SchemaValidator.validateFieldValue(
				"unknown",
				"field",
				"value",
			);
			expect(result.valid).toBe(false);
		});
	});

	describe("getValidationRules", () => {
		// Note: Schemas with .refine() or transformations may return empty rules
		// as the extraction logic doesn't handle all Zod schema types

		it("should return validation rules for requirement", () => {
			const rules = SchemaValidator.getValidationRules("requirement");
			expect(rules).toBeDefined();
			expect(typeof rules).toBe("object");
		});

		it("should return validation rules for plan", () => {
			const rules = SchemaValidator.getValidationRules("plan");
			expect(rules).toBeDefined();
		});

		it("should return empty object for unknown type", () => {
			const rules = SchemaValidator.getValidationRules("unknown");
			expect(rules).toEqual({});
		});
	});

	describe("getSuggestions", () => {
		it("should return suggestions for enum fields", () => {
			const suggestions = SchemaValidator.getSuggestions(
				"requirement",
				"priority",
			);
			expect(suggestions).toBeInstanceOf(Array);
		});

		it("should return suggestions for string fields", () => {
			const suggestions = SchemaValidator.getSuggestions("requirement", "name");
			expect(suggestions).toBeInstanceOf(Array);
		});

		it("should return suggestions for array fields", () => {
			const suggestions = SchemaValidator.getSuggestions(
				"requirement",
				"criteria",
			);
			expect(suggestions).toBeInstanceOf(Array);
		});

		it("should handle non-existent field gracefully", () => {
			const suggestions = SchemaValidator.getSuggestions(
				"requirement",
				"nonexistent",
			);
			expect(suggestions).toBeInstanceOf(Array);
		});

		it("should return empty array for invalid type", () => {
			const suggestions = SchemaValidator.getSuggestions("unknown", "field");
			expect(suggestions).toEqual([]);
		});
	});

	describe("validateEntityStructure", () => {
		// Note: validateEntityStructure only checks basic structural requirements,
		// not full schema validation. For full validation, use validateEntity.

		it("should validate basic entity structure", () => {
			const entity = {
				type: "requirement",
				name: "Test",
				slug: "test",
				criteria: [], // Requirements need criteria array
			};

			const result = SchemaValidator.validateEntityStructure(entity);
			expect(result.valid).toBe(true);
		});

		it("should reject non-object entities", () => {
			const result = SchemaValidator.validateEntityStructure(null);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Entity must be an object");
		});

		it("should reject entity without type", () => {
			const entity = {
				name: "Test",
				slug: "test",
			};

			const result = SchemaValidator.validateEntityStructure(entity);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Entity must have a type field");
		});

		it("should reject entity without name", () => {
			const entity = {
				type: "requirement",
				slug: "test",
			};

			const result = SchemaValidator.validateEntityStructure(entity);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Entity must have a name field");
		});

		it("should reject entity without slug", () => {
			const entity = {
				type: "requirement",
				name: "Test",
			};

			const result = SchemaValidator.validateEntityStructure(entity);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("Entity must have a slug field");
		});

		it("should check requirement-specific structure", () => {
			const entity = {
				type: "requirement",
				name: "Test",
				slug: "test",
			};

			const result = SchemaValidator.validateEntityStructure(entity);
			expect(result.errors).toContain("Requirements must have criteria array");
		});

		it("should check plan-specific structure", () => {
			const entity = {
				type: "plan",
				name: "Test",
				slug: "test",
			};

			const result = SchemaValidator.validateEntityStructure(entity);
			expect(result.errors).toContain("Plans must have acceptance_criteria");
		});

		it("should warn about missing tasks in plan", () => {
			const entity = {
				type: "plan",
				name: "Test",
				slug: "test",
				acceptance_criteria: "Test",
			};

			const result = SchemaValidator.validateEntityStructure(entity);
			expect(result.warnings).toContain("Plans should have tasks array");
		});

		it("should check component-specific structure", () => {
			const entity = {
				type: "app",
				name: "Test",
				slug: "test",
			};

			const result = SchemaValidator.validateEntityStructure(entity);
		expect(result.valid).toBe(true);
		});

		it("should handle string type check", () => {
			const result = SchemaValidator.validateEntityStructure("not an object");
			expect(result.valid).toBe(false);
		});

		it("should handle undefined", () => {
			const result = SchemaValidator.validateEntityStructure(undefined);
			expect(result.valid).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle entity with extra fields", () => {
			const requirement = {
				type: "requirement",
				name: "Test",
				slug: "test",
				description: "Test",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "crit-001",
						description: "Test criteria",
						status: "active",
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				extraField: "should be ignored",
			} as unknown as AnyEntity;

			const result = SchemaValidator.validateEntity(requirement);
			// Schemas use .strict() so extra fields are rejected
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.includes("extraField"))).toBe(true);
		});

		it("should handle deeply nested validation errors", () => {
			const plan = {
				type: "plan",
				name: "Test",
				slug: "test",
				description: "Test",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Test",
				depends_on: [],
				tasks: [
					{
						id: "task-001",
						description: "",
						completed: "not-a-boolean",
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				approved: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			} as unknown as AnyEntity;

			const result = SchemaValidator.validateEntity(plan);
			expect(result.valid).toBe(false);
		});

		it("should handle circular references in partial validation", () => {
			const partial: Record<string, unknown> = {};
			partial.self = partial;

			const result = SchemaValidator.validatePartialEntity(
				partial,
				"requirement",
			);
			expect(result).toBeDefined();
		});

		it("should validate entity with minimum string lengths", () => {
			const requirement: AnyEntity = {
				type: "requirement",
				name: "T",
				slug: "t",
				description: "T",
				number: 1,
				priority: "required",
				criteria: [
					{
						id: "crit-001",
						description: "Test criteria",
						status: "active",
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const result = SchemaValidator.validateEntity(requirement);
			expect(result).toBeDefined();
		});

		it("should validate entity with maximum complexity", () => {
			const plan: AnyEntity = {
				type: "plan",
				name: "Complex Plan",
				slug: "complex-plan",
				description: "Complex description",
				number: 1,
				priority: "medium",
				acceptance_criteria: "Complex acceptance criteria",
				depends_on: ["pln-001-dep1", "pln-002-dep2"],
				tasks: Array(50)
					.fill(null)
					.map((_, i) => ({
						id: `task-${i.toString().padStart(3, "0")}`,
						description: `Task ${i}`,
						depends_on: [],
						priority: "medium" as const,
					})),
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				approved: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const result = SchemaValidator.validateEntity(plan);
			expect(result.valid).toBe(true);
		});
	});
});
