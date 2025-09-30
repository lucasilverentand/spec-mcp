import { describe, expect, it } from "vitest";
import {
	type AcceptanceCriteria,
	AcceptanceCriteriaIdSchema,
	AcceptanceCriteriaSchema,
	RequirementIdSchema,
	RequirementSchema,
} from "../../../src/entities/requirements/requirement.js";

describe("RequirementIdSchema", () => {
	it("should accept valid requirement IDs", () => {
		const validIds = [
			"req-001-test-requirement",
			"req-999-another-req",
			"req-042-complex-slug-here",
			"req-123-single",
		];

		for (const id of validIds) {
			expect(() => RequirementIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid requirement IDs", () => {
		const invalidIds = [
			"requirement-001-test", // wrong prefix
			"req-1-test", // number not padded
			"req-001", // missing slug
			"req-001-", // empty slug
			"req-001-Test", // uppercase in slug
			"req-001-test space", // space in slug
			"req-abc-test", // non-numeric number
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => RequirementIdSchema.parse(id)).toThrow();
		}
	});
});

describe("AcceptanceCriteriaIdSchema", () => {
	it("should accept valid acceptance criteria IDs", () => {
		const validIds = [
			"req-001-test-requirement/crit-001",
			"req-999-another-req/crit-042",
			"req-123-complex-slug/crit-999",
		];

		for (const id of validIds) {
			expect(() => AcceptanceCriteriaIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid acceptance criteria IDs", () => {
		const invalidIds = [
			"req-001-test/criteria-001", // wrong criteria prefix
			"req-001-test/crit-1", // criteria number not padded
			"req-001-test/crit-", // missing criteria number
			"req-001-test", // missing criteria part
			"requirement-001-test/crit-001", // invalid requirement prefix
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => AcceptanceCriteriaIdSchema.parse(id)).toThrow();
		}
	});
});

describe("AcceptanceCriteriaSchema", () => {
	it("should accept valid acceptance criteria", () => {
		const validCriteria: AcceptanceCriteria = {
			id: "req-001-test-requirement/crit-001",
			description: "User can log in successfully",
		};

		expect(() => AcceptanceCriteriaSchema.parse(validCriteria)).not.toThrow();
	});

	it("should require all mandatory fields", () => {
		const requiredFields = ["id", "description"];

		for (const field of requiredFields) {
			const invalidCriteria = {
				id: "req-001-test-requirement/crit-001",
				description: "Test description",
			};
			delete (invalidCriteria as Record<string, unknown>)[field];

			expect(() => AcceptanceCriteriaSchema.parse(invalidCriteria)).toThrow();
		}
	});

	it("should reject empty description", () => {
		const criteria = {
			id: "req-001-test-requirement/crit-001",
			description: "",
		};

		expect(() => AcceptanceCriteriaSchema.parse(criteria)).toThrow();
	});
});

describe("RequirementSchema", () => {
	it("should accept valid requirement", () => {
		const validRequirement = {
			type: "requirement" as const,
			number: 1,
			slug: "user-authentication",
			name: "User Authentication",
			description: "Users should be able to authenticate",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "required" as const,
			criteria: [
				{
					id: "req-001-user-authentication/crit-001",
					description: "User can log in with valid credentials",
				},
			],
		};

		const parsed = RequirementSchema.parse(validRequirement);
		expect(parsed.id).toBe("req-001-user-authentication");
	});

	it("should default priority to 'required'", () => {
		const requirement = {
			type: "requirement" as const,
			number: 1,
			slug: "test-req",
			name: "Test Requirement",
			description: "A test requirement",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			criteria: [
				{
					id: "req-001-test-req/crit-001",
					description: "Test criteria",
				},
			],
		};

		const parsed = RequirementSchema.parse(requirement);
		expect(parsed.priority).toBe("required");
	});

	it("should accept all valid priority levels", () => {
		const priorities: Array<"critical" | "required" | "ideal" | "optional"> = [
			"critical",
			"required",
			"ideal",
			"optional",
		];

		for (const priority of priorities) {
			const requirement = {
				type: "requirement" as const,
				number: 1,
				slug: "test-req",
				name: "Test Requirement",
				description: "A test requirement",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				priority,
				criteria: [
					{
						id: "req-001-test-req/crit-001",
						description: "Test criteria",
					},
				],
			};

			expect(() => RequirementSchema.parse(requirement)).not.toThrow();
		}
	});

	it("should reject invalid priority levels", () => {
		const requirement = {
			type: "requirement" as const,
			number: 1,
			slug: "test-req",
			name: "Test Requirement",
			description: "A test requirement",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "invalid",
			criteria: [
				{
					id: "req-001-test-req/crit-001",
					description: "Test criteria",
				},
			],
		};

		expect(() => RequirementSchema.parse(requirement)).toThrow();
	});

	it("should require at least one acceptance criteria", () => {
		const requirement = {
			type: "requirement" as const,
			number: 1,
			slug: "test-req",
			name: "Test Requirement",
			description: "A test requirement",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			criteria: [],
		};

		expect(() => RequirementSchema.parse(requirement)).toThrow();
	});

	it("should validate criteria IDs match requirement number", () => {
		const requirement = {
			type: "requirement" as const,
			number: 1,
			slug: "test-req",
			name: "Test Requirement",
			description: "A test requirement",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			criteria: [
				{
					id: "req-002-test-req/crit-001", // Wrong number (002 instead of 001)
					description: "Test criteria",
				},
			],
		};

		expect(() => RequirementSchema.parse(requirement)).toThrow();
	});

	it("should allow multiple criteria with matching requirement ID", () => {
		const requirement = {
			type: "requirement" as const,
			number: 5,
			slug: "test-req",
			name: "Test Requirement",
			description: "A test requirement",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			criteria: [
				{
					id: "req-005-test-req/crit-001",
					description: "First criteria",
					plan_id: "pln-001-test-plan",
					completed: false,
				},
				{
					id: "req-005-test-req/crit-002",
					description: "Second criteria",
					plan_id: "pln-002-test-plan",
					completed: true,
				},
			],
		};

		expect(() => RequirementSchema.parse(requirement)).not.toThrow();
	});
});
