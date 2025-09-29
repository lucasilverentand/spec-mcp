import { describe, expect, it } from "vitest";
import {
	ScopeItemPrioritySchema,
	ScopeItemSchema,
	ScopeSchema,
} from "../../../src/entities/shared/scope-schema.js";

describe("ScopeItemPrioritySchema", () => {
	it("should accept valid priorities", () => {
		const validPriorities = [
			"critical",
			"high",
			"medium",
			"low",
			"nice-to-have",
		];

		for (const priority of validPriorities) {
			expect(() => ScopeItemPrioritySchema.parse(priority)).not.toThrow();
		}
	});

	it("should reject invalid priorities", () => {
		const invalidPriorities = ["urgent", "normal", "", null, undefined];

		for (const priority of invalidPriorities) {
			expect(() => ScopeItemPrioritySchema.parse(priority)).toThrow();
		}
	});
});

describe("ScopeItemSchema", () => {
	it("should accept minimal valid scope item", () => {
		const validItem = {
			description: "User authentication",
		};

		expect(() => ScopeItemSchema.parse(validItem)).not.toThrow();
	});

	it("should accept complete scope item", () => {
		const completeItem = {
			description: "User authentication",
			priority: "high",
			rationale: "Required for security",
		};

		const parsed = ScopeItemSchema.parse(completeItem);
		expect(parsed.description).toBe("User authentication");
		expect(parsed.priority).toBe("high");
		expect(parsed.rationale).toBe("Required for security");
	});

	it("should require description", () => {
		const itemWithoutDescription = {
			priority: "high",
		};

		expect(() => ScopeItemSchema.parse(itemWithoutDescription)).toThrow();
	});

	it("should reject empty description", () => {
		const itemWithEmptyDescription = {
			description: "",
		};

		expect(() => ScopeItemSchema.parse(itemWithEmptyDescription)).toThrow();
	});
});

describe("ScopeSchema", () => {
	it("should accept empty scope with defaults", () => {
		const emptyScope = {};

		const parsed = ScopeSchema.parse(emptyScope);

		expect(parsed.in_scope).toEqual([]);
		expect(parsed.out_of_scope).toEqual([]);
		expect(parsed.boundaries).toEqual([]);
		expect(parsed.assumptions).toEqual([]);
		expect(parsed.constraints).toEqual([]);
		expect(parsed.notes).toEqual([]);
	});

	it("should accept complete scope with all fields", () => {
		const completeScope = {
			in_scope: [
				{ description: "User authentication" },
				{ description: "Password reset", priority: "medium" },
			],
			out_of_scope: [
				{ description: "Admin panel", rationale: "Not needed for MVP" },
			],
			boundaries: ["Only supports single tenant"],
			assumptions: ["HTTPS is available", "Database is PostgreSQL"],
			constraints: ["Must be GDPR compliant", "Response time < 200ms"],
			notes: ["Consider future multi-tenant support"],
		};

		const parsed = ScopeSchema.parse(completeScope);
		expect(parsed.in_scope).toHaveLength(2);
		expect(parsed.out_of_scope).toHaveLength(1);
		expect(parsed.boundaries).toEqual(["Only supports single tenant"]);
		expect(parsed.assumptions).toEqual([
			"HTTPS is available",
			"Database is PostgreSQL",
		]);
		expect(parsed.constraints).toEqual([
			"Must be GDPR compliant",
			"Response time < 200ms",
		]);
		expect(parsed.notes).toEqual(["Consider future multi-tenant support"]);
	});

	it("should reject empty strings in string arrays", () => {
		const scopeWithEmptyString = {
			boundaries: ["Valid boundary", "", "Another boundary"],
		};

		expect(() => ScopeSchema.parse(scopeWithEmptyString)).toThrow();
	});

	it("should accept minimal scope with only in_scope", () => {
		const minimalScope = {
			in_scope: [{ description: "Core functionality" }],
		};

		const parsed = ScopeSchema.parse(minimalScope);
		expect(parsed.in_scope).toHaveLength(1);
		expect(parsed.in_scope[0].description).toBe("Core functionality");
	});
});
