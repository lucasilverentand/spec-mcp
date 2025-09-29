import { describe, expect, it } from "vitest";
import {
	AcceptanceCriteriaSchema,
	AppComponentSchema,
	ComponentIdSchema,
	ComponentTypeSchema,
	LibraryComponentSchema,
	PlanIdSchema,
	PlanPrioritySchema,
	PlanSchema,
	RequirementIdSchema,
	RequirementSchema,
	ServiceComponentSchema,
	ToolComponentSchema,
} from "../src/index.js";

describe("Schema Exports", () => {
	it("should export all component schemas", () => {
		expect(AppComponentSchema).toBeDefined();
		expect(ComponentIdSchema).toBeDefined();
		expect(ComponentTypeSchema).toBeDefined();
		expect(LibraryComponentSchema).toBeDefined();
		expect(ServiceComponentSchema).toBeDefined();
		expect(ToolComponentSchema).toBeDefined();
	});

	it("should export all plan schemas", () => {
		expect(PlanIdSchema).toBeDefined();
		expect(PlanPrioritySchema).toBeDefined();
		expect(PlanSchema).toBeDefined();
	});

	it("should export all requirement schemas", () => {
		expect(AcceptanceCriteriaSchema).toBeDefined();
		expect(RequirementIdSchema).toBeDefined();
		expect(RequirementSchema).toBeDefined();
	});

	it("should be able to parse data with exported schemas", () => {
		// Test that exported schemas actually work
		const validRequirement = {
			type: "requirement" as const,
			number: 1,
			slug: "test-requirement",
			name: "Test Requirement",
			description: "Test description",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "required" as const,
			criteria: [
				{
					id: "req-001-test-requirement/crit-001",
					description: "Test criteria",
					plan_id: "pln-001-test-plan",
					completed: false,
				},
			],
		};

		const validPlan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "Test description",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "Should work correctly",
		};

		const validComponent = {
			type: "app" as const,
			number: 1,
			slug: "test-app",
			name: "Test App",
			description: "Test description",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		expect(() => RequirementSchema.parse(validRequirement)).not.toThrow();
		expect(() => PlanSchema.parse(validPlan)).not.toThrow();
		expect(() => AppComponentSchema.parse(validComponent)).not.toThrow();
	});
});
