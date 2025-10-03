import type { EntityType } from "@spec-mcp/data";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractEntityType,
	extractNumber,
	extractSlug,
	generateChildId,
	generateCriteriaId,
	generateFlowId,
	generateId,
	generateStepId,
	generateTaskId,
	generateTestCaseId,
	generateUniqueId,
	getEntityTypeFromPrefix,
	getNextNumber,
	getPrefix,
	IdGenerator,
	parseId,
	suggestSimilarIds,
	validateId,
} from "../../src/transformation/id-generator.js";

describe("IdGenerator Class", () => {
	let generator: IdGenerator;

	beforeEach(() => {
		generator = new IdGenerator();
	});

	describe("Constructor and Metadata", () => {
		it("should initialize with correct metadata", () => {
			expect(generator.name).toBe("IdGenerator");
			expect(generator.version).toBe("2.0.0");
		});
	});

	describe("transform method", () => {
		it("should transform string input to ID with operation result", async () => {
			const result = await generator.transform("test");

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.timestamp).toBeInstanceOf(Date);
			// Transform uses the input as prefix, so expect: prefix-timestamp-random
			expect(result.data).toMatch(/^test-\d+-[a-z0-9]+$/);
		});

		it("should transform string with prefix", async () => {
			const result = await generator.transform("prefix");

			expect(result.success).toBe(true);
			expect(result.data).toMatch(/^prefix-\d+-[a-z0-9]+$/);
		});
	});

	describe("canTransform method", () => {
		it("should return true for string input", () => {
			expect(generator.canTransform("test")).toBe(true);
		});

		it("should return false for non-string input", () => {
			expect(generator.canTransform(123)).toBe(false);
			expect(generator.canTransform(null)).toBe(false);
			expect(generator.canTransform(undefined)).toBe(false);
			expect(generator.canTransform({})).toBe(false);
			expect(generator.canTransform([])).toBe(false);
		});
	});

	describe("supports method", () => {
		it("should return true for string to string transformation", () => {
			expect(generator.supports("string", "string")).toBe(true);
		});

		it("should return false for other type combinations", () => {
			expect(generator.supports("string", "number")).toBe(false);
			expect(generator.supports("number", "string")).toBe(false);
			expect(generator.supports("object", "string")).toBe(false);
		});
	});

	describe("generateId method", () => {
		it("should generate ID without prefix", () => {
			const id = generator.generateId();

			expect(id).toMatch(/^\d+-[a-z0-9]+$/);
			expect(id).not.toContain("undefined");
		});

		it("should generate ID with prefix", () => {
			const id = generator.generateId("test");

			expect(id).toMatch(/^test-\d+-[a-z0-9]+$/);
		});

		it("should generate unique IDs on multiple calls", () => {
			const id1 = generator.generateId("test");
			const id2 = generator.generateId("test");

			expect(id1).not.toBe(id2);
		});

		it("should include timestamp component", () => {
			const beforeTimestamp = Date.now();
			const id = generator.generateId();
			const afterTimestamp = Date.now();

			const timestampMatch = id.match(/^(\d+)-/);
			expect(timestampMatch).toBeDefined();

			const timestampStr = timestampMatch?.[1];
			expect(timestampStr).toBeDefined();
			const timestamp = timestampStr ? parseInt(timestampStr, 10) : 0;
			expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
			expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
		});

		it("should include random component", () => {
			const id = generator.generateId();
			const randomMatch = id.match(/-([a-z0-9]+)$/);

			expect(randomMatch).toBeDefined();
			expect(randomMatch?.[1]?.length).toBe(6);
		});
	});

	describe("generateUniqueId method", () => {
		it("should generate unique ID not in existing list", () => {
			const existingIds = ["test-1234-abc123", "test-5678-def456"];
			const newId = generator.generateUniqueId(existingIds, "test");

			expect(existingIds).not.toContain(newId);
			expect(newId).toMatch(/^test-\d+-[a-z0-9]+$/);
		});

		it("should keep trying until unique ID is found", () => {
			const existingIds: string[] = [];
			let callCount = 0;

			// Mock generateId to simulate collision on first call
			vi.spyOn(generator, "generateId").mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return "collision-id";
				}
				return `unique-${callCount}`;
			});

			existingIds.push("collision-id");
			const uniqueId = generator.generateUniqueId(existingIds, "test");

			expect(uniqueId).not.toBe("collision-id");
			expect(callCount).toBeGreaterThan(1);
		});

		it("should work with empty existing IDs list", () => {
			const id = generator.generateUniqueId([], "test");

			expect(id).toMatch(/^test-\d+-[a-z0-9]+$/);
		});
	});

	describe("validateId method", () => {
		it("should return true for valid ID strings", () => {
			expect(generator.validateId("valid-id")).toBe(true);
			expect(generator.validateId("req-001-test")).toBe(true);
			expect(generator.validateId("a")).toBe(true);
		});

		it("should return false for empty string", () => {
			expect(generator.validateId("")).toBe(false);
		});

		it("should return false for too long ID (>100 chars)", () => {
			const longId = "a".repeat(101);
			expect(generator.validateId(longId)).toBe(false);
		});

		it("should return false for non-string input", () => {
			expect(generator.validateId(123 as unknown as string)).toBe(false);
			expect(generator.validateId(null as unknown as string)).toBe(false);
			expect(generator.validateId(undefined as unknown as string)).toBe(false);
		});

		it("should return true for ID at max length (100 chars)", () => {
			const maxLengthId = "a".repeat(100);
			expect(generator.validateId(maxLengthId)).toBe(true);
		});
	});
});

describe("Entity-Specific ID Functions", () => {
	describe("generateId function", () => {
		it("should generate ID for requirement entity", () => {
			const id = generateId("requirement", 1, "test-requirement");

			expect(id).toBe("req-001-test-requirement");
		});

		it("should generate ID for plan entity", () => {
			const id = generateId("plan", 5, "test-plan");

			expect(id).toBe("pln-005-test-plan");
		});

		it("should generate ID for component entities", () => {
			expect(generateId("app", 10, "my-app")).toBe("app-010-my-app");
			expect(generateId("service", 20, "my-service")).toBe(
				"svc-020-my-service",
			);
			expect(generateId("library", 15, "my-lib")).toBe("lib-015-my-lib");
		});

		it("should pad numbers with leading zeros", () => {
			expect(generateId("requirement", 1, "test")).toBe("req-001-test");
			expect(generateId("requirement", 42, "test")).toBe("req-042-test");
			expect(generateId("requirement", 999, "test")).toBe("req-999-test");
		});

		it("should sanitize slugs", () => {
			const id = generateId("requirement", 1, "Test With Spaces!");

			expect(id).toMatch(/^req-001-test-with-spaces$/);
		});
	});

	describe("generateUniqueId function", () => {
		it("should generate unique ID from title", () => {
			const existingIds = ["req-001-test", "req-002-another"];
			const id = generateUniqueId(
				"requirement",
				3,
				"New Requirement",
				existingIds,
			);

			expect(id).toMatch(/^req-003-/);
			expect(existingIds).not.toContain(id);
		});

		it("should handle slug collisions by adding suffix", () => {
			const existingIds = ["req-001-test"];
			const id = generateUniqueId("requirement", 2, "Test", existingIds);

			expect(id).toBe("req-002-test-1");
		});

		it("should generate from title with stop words", () => {
			const id = generateUniqueId("requirement", 1, "The Quick Brown Fox", []);

			expect(id).toMatch(/^req-001-quick-brown-fox/);
		});
	});

	describe("parseId function", () => {
		it("should parse valid requirement ID", () => {
			const parsed = parseId("req-001-test-requirement");

			expect(parsed).toEqual({
				entityType: "requirement",
				number: 1,
				slug: "test-requirement",
			});
		});

		it("should parse valid plan ID", () => {
			const parsed = parseId("pln-042-my-plan");

			expect(parsed).toEqual({
				entityType: "plan",
				number: 42,
				slug: "my-plan",
			});
		});

		it("should parse all component types", () => {
			expect(parseId("app-001-my-app")).toEqual({
				entityType: "app",
				number: 1,
				slug: "my-app",
			});

			expect(parseId("svc-002-my-service")).toEqual({
				entityType: "service",
				number: 2,
				slug: "my-service",
			});

			expect(parseId("lib-003-my-lib")).toEqual({
				entityType: "library",
				number: 3,
				slug: "my-lib",
			});

			expect(parseId("lib-004-my-other-lib")).toEqual({
				entityType: "library",
				number: 4,
				slug: "my-other-lib",
			});
		});

		it("should return null for invalid format", () => {
			expect(parseId("invalid-id")).toBeNull();
			expect(parseId("req-1-test")).toBeNull(); // number not padded
			expect(parseId("xyz-001-test")).toBeNull(); // invalid prefix
			expect(parseId("req-001")).toBeNull(); // missing slug
		});

		it("should return null for empty string", () => {
			expect(parseId("")).toBeNull();
		});

		it("should handle slugs with multiple segments", () => {
			const parsed = parseId("req-001-test-requirement-with-many-words");

			expect(parsed).toEqual({
				entityType: "requirement",
				number: 1,
				slug: "test-requirement-with-many-words",
			});
		});
	});

	describe("validateId function", () => {
		it("should validate correct requirement ID", () => {
			expect(validateId("req-001-test-requirement")).toBe(true);
		});

		it("should validate correct IDs for all entity types", () => {
			expect(validateId("req-001-test")).toBe(true);
			expect(validateId("pln-001-test")).toBe(true);
			expect(validateId("app-001-test")).toBe(true);
			expect(validateId("svc-001-test")).toBe(true);
			expect(validateId("lib-001-test")).toBe(true);
		});

		it("should invalidate ID with wrong entity type", () => {
			expect(validateId("req-001-test", "plan" as EntityType)).toBe(false);
		});

		it("should validate ID with expected entity type", () => {
			expect(validateId("req-001-test", "requirement" as EntityType)).toBe(
				true,
			);
		});

		it("should invalidate IDs with invalid slug format", () => {
			expect(validateId("req-001-Test")).toBe(false); // uppercase
			expect(validateId("req-001--test")).toBe(false); // consecutive hyphens
			expect(validateId("req-001-test-")).toBe(false); // trailing hyphen
			expect(validateId("req-001--test")).toBe(false); // leading hyphen in slug
		});

		it("should invalidate IDs with wrong format", () => {
			expect(validateId("invalid-id")).toBe(false);
			expect(validateId("req-1-test")).toBe(false);
		});
	});

	describe("extractSlug function", () => {
		it("should extract slug from valid ID", () => {
			expect(extractSlug("req-001-test-requirement")).toBe("test-requirement");
			expect(extractSlug("pln-042-my-plan")).toBe("my-plan");
		});

		it("should return null for invalid ID", () => {
			expect(extractSlug("invalid-id")).toBeNull();
		});
	});

	describe("extractNumber function", () => {
		it("should extract number from valid ID", () => {
			expect(extractNumber("req-001-test")).toBe(1);
			expect(extractNumber("req-042-test")).toBe(42);
			expect(extractNumber("req-999-test")).toBe(999);
		});

		it("should return null for invalid ID", () => {
			expect(extractNumber("invalid-id")).toBeNull();
		});
	});

	describe("extractEntityType function", () => {
		it("should extract entity type from valid ID", () => {
			expect(extractEntityType("req-001-test")).toBe("requirement");
			expect(extractEntityType("pln-001-test")).toBe("plan");
			expect(extractEntityType("app-001-test")).toBe("app");
			expect(extractEntityType("svc-001-test")).toBe("service");
			expect(extractEntityType("lib-001-test")).toBe("library");
			});

		it("should return null for invalid ID", () => {
			expect(extractEntityType("invalid-id")).toBeNull();
		});
	});

	describe("getNextNumber function", () => {
		it("should return 1 for empty list", () => {
			expect(getNextNumber([], "requirement")).toBe(1);
		});

		it("should return next number after highest", () => {
			const existingIds = ["req-001-test", "req-005-another", "req-003-third"];

			expect(getNextNumber(existingIds, "requirement")).toBe(6);
		});

		it("should only count IDs of the specified entity type", () => {
			const existingIds = ["req-001-test", "pln-010-plan", "req-002-another"];

			expect(getNextNumber(existingIds, "requirement")).toBe(3);
			expect(getNextNumber(existingIds, "plan")).toBe(11);
		});

		it("should ignore invalid IDs", () => {
			const existingIds = ["req-001-test", "invalid-id", "req-002-another"];

			expect(getNextNumber(existingIds, "requirement")).toBe(3);
		});
	});
});

describe("Child ID Generation Functions", () => {
	describe("generateChildId function", () => {
		it("should generate child ID from valid parent ID", () => {
			const childId = generateChildId("req-001-test", "crit", 1);

			expect(childId).toBe("crit-001");
		});

		it("should pad child numbers with leading zeros", () => {
			expect(generateChildId("req-001-test", "crit", 1)).toBe("crit-001");
			expect(generateChildId("req-001-test", "crit", 42)).toBe("crit-042");
			expect(generateChildId("req-001-test", "crit", 999)).toBe("crit-999");
		});

		it("should throw error for invalid parent ID", () => {
			expect(() => generateChildId("invalid-id", "crit", 1)).toThrow(
				"Invalid parent ID format: invalid-id",
			);
		});
	});

	describe("generateCriteriaId function", () => {
		it("should generate criteria ID from requirement ID", () => {
			const criteriaId = generateCriteriaId("req-001-test", 1);

			expect(criteriaId).toBe("crit-001");
		});

		it("should handle multiple criteria", () => {
			expect(generateCriteriaId("req-001-test", 1)).toBe("crit-001");
			expect(generateCriteriaId("req-001-test", 5)).toBe("crit-005");
		});
	});

	describe("generateTaskId function", () => {
		it("should generate task ID from plan ID", () => {
			const taskId = generateTaskId("pln-001-test", 1);

			expect(taskId).toBe("task-001");
		});

		it("should handle multiple tasks", () => {
			expect(generateTaskId("pln-001-test", 1)).toBe("task-001");
			expect(generateTaskId("pln-001-test", 10)).toBe("task-010");
		});
	});

	describe("generateFlowId function", () => {
		it("should generate flow ID from plan ID", () => {
			const flowId = generateFlowId("pln-001-test", 1);

			expect(flowId).toBe("flow-001");
		});

		it("should handle multiple flows", () => {
			expect(generateFlowId("pln-001-test", 1)).toBe("flow-001");
			expect(generateFlowId("pln-001-test", 3)).toBe("flow-003");
		});
	});

	describe("generateStepId function", () => {
		it("should generate step ID from flow ID", () => {
			const stepId = generateStepId("flow-001", 1);

			expect(stepId).toBe("step-001");
		});

		it("should handle multiple steps", () => {
			expect(generateStepId("flow-001", 1)).toBe("step-001");
			expect(generateStepId("flow-001", 7)).toBe("step-007");
		});
	});

	describe("generateTestCaseId function", () => {
		it("should generate test case ID from plan ID", () => {
			const testId = generateTestCaseId("pln-001-test", 1);

			expect(testId).toBe("test-001");
		});

		it("should handle multiple test cases", () => {
			expect(generateTestCaseId("pln-001-test", 1)).toBe("test-001");
			expect(generateTestCaseId("pln-001-test", 15)).toBe("test-015");
		});
	});
});

describe("Prefix Mapping Functions", () => {
	describe("getPrefix function", () => {
		it("should return correct prefix for each entity type", () => {
			expect(getPrefix("requirement")).toBe("req");
			expect(getPrefix("plan")).toBe("pln");
			expect(getPrefix("app")).toBe("app");
			expect(getPrefix("service")).toBe("svc");
			expect(getPrefix("library")).toBe("lib");
			});
	});

	describe("getEntityTypeFromPrefix function", () => {
		it("should return correct entity type for each prefix", () => {
			expect(getEntityTypeFromPrefix("req")).toBe("requirement");
			expect(getEntityTypeFromPrefix("pln")).toBe("plan");
			expect(getEntityTypeFromPrefix("app")).toBe("app");
			expect(getEntityTypeFromPrefix("svc")).toBe("service");
			expect(getEntityTypeFromPrefix("lib")).toBe("library");
			});

		it("should return undefined for unknown prefix", () => {
			expect(getEntityTypeFromPrefix("xyz")).toBeUndefined();
			expect(getEntityTypeFromPrefix("")).toBeUndefined();
		});
	});
});

describe("suggestSimilarIds function", () => {
	const existingIds = [
		"req-001-user-authentication",
		"req-002-user-authorization",
		"req-003-password-reset",
		"req-004-login-flow",
		"pln-001-user-management",
	];

	it("should suggest similar IDs based on slug similarity", () => {
		const suggestions = suggestSimilarIds(
			"req-005-user-authentication",
			existingIds,
		);

		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions).toContain("req-001-user-authentication");
	});

	it("should only suggest IDs of same entity type", () => {
		const suggestions = suggestSimilarIds("req-005-user-manage", existingIds);

		// Should not include plan ID even if similar
		expect(suggestions.every((id) => id.startsWith("req-"))).toBe(true);
	});

	it("should return empty array for invalid input ID", () => {
		const suggestions = suggestSimilarIds("invalid-id", existingIds);

		expect(suggestions).toEqual([]);
	});

	it("should limit suggestions to 5 items", () => {
		const manyIds = Array.from(
			{ length: 20 },
			(_, i) => `req-${(i + 1).toString().padStart(3, "0")}-user-test-${i}`,
		);

		const suggestions = suggestSimilarIds("req-021-user-test", manyIds);

		expect(suggestions.length).toBeLessThanOrEqual(5);
	});

	it("should sort suggestions by similarity score", () => {
		const suggestions = suggestSimilarIds(
			"req-005-user-authentication-flow",
			existingIds,
		);

		if (suggestions.length > 1) {
			// First suggestion should be most similar
			expect(suggestions[0]).toBe("req-001-user-authentication");
		}
	});

	it("should return empty array when no similar IDs exist", () => {
		const suggestions = suggestSimilarIds(
			"req-005-completely-different",
			existingIds,
		);

		expect(suggestions).toEqual([]);
	});
});

describe("Edge Cases and Error Handling", () => {
	describe("Empty and null inputs", () => {
		it("should handle empty strings gracefully", () => {
			expect(parseId("")).toBeNull();
			expect(validateId("")).toBe(false);
			expect(extractSlug("")).toBeNull();
		});

		it("should handle large numbers", () => {
			const id = generateId("requirement", 999, "test");
			expect(id).toBe("req-999-test");

			const parsed = parseId(id);
			expect(parsed?.number).toBe(999);
		});
	});

	describe("Special characters in slugs", () => {
		it("should sanitize special characters", () => {
			const id = generateId("requirement", 1, "test@#$%with^&*special()chars");
			expect(id).toMatch(/^req-001-/);
			expect(id).not.toContain("@");
			expect(id).not.toContain("#");
		});

		it("should handle unicode characters", () => {
			const id = generateId("requirement", 1, "test-with-émojis-🎉");
			expect(id).toMatch(/^req-001-/);
		});
	});

	describe("Boundary conditions", () => {
		it("should handle very long slugs", () => {
			const longSlug = "a".repeat(100);
			const id = generateId("requirement", 1, longSlug);

			expect(id.length).toBeLessThan(200);
		});

		it("should handle number 0", () => {
			const id = generateId("requirement", 0, "test");
			expect(id).toBe("req-000-test");
		});
	});
});
