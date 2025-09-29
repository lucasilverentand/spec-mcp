import { describe, expect, it } from "vitest";
import {
	PlanIdSchema,
	type PlanPriority,
	PlanPrioritySchema,
	PlanSchema,
} from "../../../src/entities/plans/plan.js";

describe("PlanIdSchema", () => {
	it("should accept valid plan IDs", () => {
		const validIds = [
			"pln-001-authentication-plan",
			"pln-999-complex-plan-name",
			"pln-042-simple",
			"pln-123-multi-word-plan",
		];

		for (const id of validIds) {
			expect(() => PlanIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid plan IDs", () => {
		const invalidIds = [
			"plan-001-test", // wrong prefix
			"pln-1-test", // number not padded
			"pln-001", // missing slug
			"pln-001-", // empty slug
			"pln-001-Test", // uppercase in slug
			"pln-001-test space", // space in slug
			"pln-abc-test", // non-numeric number
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => PlanIdSchema.parse(id)).toThrow();
		}
	});
});

describe("PlanPrioritySchema", () => {
	it("should accept valid priority levels", () => {
		const validPriorities: PlanPriority[] = [
			"critical",
			"high",
			"medium",
			"low",
		];

		for (const priority of validPriorities) {
			expect(() => PlanPrioritySchema.parse(priority)).not.toThrow();
		}
	});

	it("should reject invalid priority levels", () => {
		const invalidPriorities = [
			"urgent",
			"normal",
			"minimal",
			"",
			null,
			undefined,
		];

		for (const priority of invalidPriorities) {
			expect(() => PlanPrioritySchema.parse(priority)).toThrow();
		}
	});
});

describe("PlanSchema", () => {
	it("should accept minimal valid plan", () => {
		const validPlan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan for validation",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "The system should work correctly",
		};

		const parsed = PlanSchema.parse(validPlan);
		expect(parsed.id).toBe("pln-001-test-plan");
	});

	it("should set default values correctly", () => {
		const plan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "Success criteria",
		};

		const parsed = PlanSchema.parse(plan);

		expect(parsed.priority).toBe("medium");
		expect(parsed.depends_on).toEqual([]);
		expect(parsed.tasks).toEqual([]);
		expect(parsed.flows).toEqual([]);
		expect(parsed.test_cases).toEqual([]);
		expect(parsed.api_contracts).toEqual([]);
		expect(parsed.data_models).toEqual([]);
		expect(parsed.references).toEqual([]);
		expect(parsed.completed).toBe(false);
		expect(parsed.approved).toBe(false);
	});

	it("should accept all priority levels", () => {
		const priorities: PlanPriority[] = ["critical", "high", "medium", "low"];

		for (const priority of priorities) {
			const plan = {
				type: "plan" as const,
				number: 1,
				slug: "test-plan",
				name: "Test Plan",
				description: "A test plan",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				acceptance_criteria: "Success criteria",
				priority,
			};

			expect(() => PlanSchema.parse(plan)).not.toThrow();
		}
	});

	it("should require acceptance_criteria", () => {
		const plan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			// missing acceptance_criteria
		};

		expect(() => PlanSchema.parse(plan)).toThrow();
	});

	it("should reject empty acceptance_criteria", () => {
		const plan = {
			type: "plan",
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			acceptance_criteria: "",
		};

		expect(() => PlanSchema.parse(plan)).toThrow();
	});

	it("should accept valid depends_on plan IDs", () => {
		const plan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "Success criteria",
			depends_on: ["pln-001-auth-plan", "pln-002-setup-plan"],
		};

		expect(() => PlanSchema.parse(plan)).not.toThrow();
	});

	it("should reject invalid depends_on plan IDs", () => {
		const plan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "Success criteria",
			depends_on: ["invalid-plan-id", "pln-001-valid-plan"],
		};

		expect(() => PlanSchema.parse(plan)).toThrow();
	});

	it("should accept completed state with timestamp", () => {
		const plan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "Success criteria",
			completed: true,
			completed_at: "2023-12-01T10:30:00.000Z",
		};

		expect(() => PlanSchema.parse(plan)).not.toThrow();
	});

	it("should reject invalid ISO datetime format", () => {
		const plan = {
			type: "plan",
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			acceptance_criteria: "Success criteria",
			completed: true,
			completed_at: "2023-12-01 10:30:00", // Invalid format
		};

		expect(() => PlanSchema.parse(plan)).toThrow();
	});

	it("should accept approved state", () => {
		const plan = {
			type: "plan" as const,
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "Success criteria",
			approved: true,
		};

		const parsed = PlanSchema.parse(plan);
		expect(parsed.approved).toBe(true);
	});

	it("should enforce literal type value", () => {
		const plan = {
			type: "requirement", // Wrong type
			number: 1,
			slug: "test-plan",
			name: "Test Plan",
			description: "A test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			acceptance_criteria: "Success criteria",
		};

		expect(() => PlanSchema.parse(plan)).toThrow();
	});

	it("should accept complex plan with all optional fields", () => {
		const complexPlan = {
			type: "plan" as const,
			number: 42,
			slug: "complex-authentication-system",
			name: "Complex Authentication System",
			description:
				"Implement a comprehensive authentication system with OAuth2 support",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "critical" as const,
			acceptance_criteria:
				"Users can authenticate via OAuth2 and session management works correctly",
			scope: {
				includes: ["OAuth2 implementation", "Session management", "User roles"],
				excludes: ["LDAP integration", "SSO with external providers"],
				assumptions: ["OAuth2 provider is already configured"],
				constraints: ["Must comply with GDPR"],
			},
			depends_on: ["pln-001-user-management", "pln-002-security-framework"],
			tasks: [],
			flows: [],
			test_cases: [],
			api_contracts: [],
			data_models: [],
			references: [],
			completed: false,
			approved: true,
		};

		const parsed = PlanSchema.parse(complexPlan);
		expect(parsed.id).toBe("pln-042-complex-authentication-system");
		expect(parsed.priority).toBe("critical");
		expect(parsed.approved).toBe(true);
	});
});
