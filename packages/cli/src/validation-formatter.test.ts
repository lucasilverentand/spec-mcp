import { describe, expect, it } from "vitest";
import {
	colors,
	formatEntityId,
	getTreeContinuation,
	getTreePrefix,
	getValidationIcon,
	parseValidationErrors,
} from "./validation-formatter";

describe("parseValidationErrors", () => {
	it("should parse single field error", () => {
		const errors = ["name: Required field"];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(1);
		expect(result.get("name")).toEqual(["Required field"]);
	});

	it("should parse multiple field errors separated by commas", () => {
		const errors = ["name: Required field, description: Too short"];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(2);
		expect(result.get("name")).toEqual(["Required field"]);
		expect(result.get("description")).toEqual(["Too short"]);
	});

	it("should handle general errors without field names", () => {
		const errors = ["Invalid format"];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(1);
		expect(result.get("_general")).toEqual(["Invalid format"]);
	});

	it("should handle mixed errors with and without field names", () => {
		const errors = ["name: Required field", "Invalid entity type"];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(2);
		expect(result.get("name")).toEqual(["Required field"]);
		expect(result.get("_general")).toEqual(["Invalid entity type"]);
	});

	it("should group multiple errors for the same field", () => {
		const errors = [
			"name: Required field",
			"name: Must be at least 3 characters",
		];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(1);
		expect(result.get("name")).toEqual([
			"Required field",
			"Must be at least 3 characters",
		]);
	});

	it("should handle complex field paths", () => {
		const errors = ["criteria[0].description: Required field"];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(1);
		expect(result.get("criteria[0].description")).toEqual(["Required field"]);
	});

	it("should handle empty error array", () => {
		const errors: string[] = [];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(0);
	});

	it("should handle errors with colons in the message", () => {
		const errors = [
			"name: Expected format: lowercase-with-dashes",
		];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(1);
		expect(result.get("name")).toEqual([
			"Expected format: lowercase-with-dashes",
		]);
	});

	it("should handle multiple comma-separated field errors in a single string", () => {
		const errors = [
			"name: Too short, description: Missing, priority: Invalid value",
		];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(3);
		expect(result.get("name")).toEqual(["Too short"]);
		expect(result.get("description")).toEqual(["Missing"]);
		expect(result.get("priority")).toEqual(["Invalid value"]);
	});

	it("should handle errors with extra whitespace", () => {
		const errors = ["name:Required field"];
		const result = parseValidationErrors(errors);

		expect(result.size).toBe(1);
		expect(result.get("name")).toEqual(["Required field"]);
	});
});

describe("colors", () => {
	it("should have correct ANSI color codes", () => {
		expect(colors.reset).toBe("\x1b[0m");
		expect(colors.green).toBe("\x1b[32m");
		expect(colors.yellow).toBe("\x1b[33m");
		expect(colors.red).toBe("\x1b[31m");
		expect(colors.cyan).toBe("\x1b[36m");
		expect(colors.dim).toBe("\x1b[2m");
	});

	it("should export colors as const", () => {
		// Colors object is exported as const, meaning its properties are readonly at compile time
		// At runtime, JavaScript doesn't enforce const on object properties, so we just verify they exist
		expect(colors).toBeDefined();
		expect(typeof colors.green).toBe("string");
	});
});

describe("formatEntityId", () => {
	it("should format entity ID with single digit number", () => {
		const result = formatEntityId("requirement", 1, "test-req");
		expect(result).toBe("requirement-001-test-req");
	});

	it("should format entity ID with two digit number", () => {
		const result = formatEntityId("plan", 42, "my-plan");
		expect(result).toBe("plan-042-my-plan");
	});

	it("should format entity ID with three digit number", () => {
		const result = formatEntityId("component", 123, "large-component");
		expect(result).toBe("component-123-large-component");
	});

	it("should format entity ID with four digit number", () => {
		const result = formatEntityId("requirement", 1234, "big-req");
		expect(result).toBe("requirement-1234-big-req");
	});

	it("should handle zero as number", () => {
		const result = formatEntityId("plan", 0, "zero-plan");
		expect(result).toBe("plan-000-zero-plan");
	});

	it("should handle different entity types", () => {
		const types = [
			"requirement",
			"plan",
			"component",
			"constitution",
			"decision",
		];

		for (const type of types) {
			const result = formatEntityId(type, 1, "test");
			expect(result).toContain(type);
			expect(result).toMatch(new RegExp(`^${type}-\\d{3}-test$`));
		}
	});

	it("should handle slugs with special characters", () => {
		const result = formatEntityId("requirement", 1, "test-req-v2");
		expect(result).toBe("requirement-001-test-req-v2");
	});
});

describe("getValidationIcon", () => {
	it("should return green checkmark for valid entity", () => {
		const icon = getValidationIcon(false, false);
		expect(icon).toBe(`${colors.green}✓${colors.reset}`);
	});

	it("should return red X for entity with errors", () => {
		const icon = getValidationIcon(true, false);
		expect(icon).toBe(`${colors.red}✗${colors.reset}`);
	});

	it("should return yellow exclamation for entity with warnings", () => {
		const icon = getValidationIcon(false, true);
		expect(icon).toBe(`${colors.yellow}!${colors.reset}`);
	});

	it("should prioritize errors over warnings", () => {
		const icon = getValidationIcon(true, true);
		expect(icon).toBe(`${colors.red}✗${colors.reset}`);
	});

	it("should return strings with ANSI codes", () => {
		const icon = getValidationIcon(false, false);
		expect(icon).toContain("\x1b[");
	});
});

describe("getTreePrefix", () => {
	it("should return corner prefix for last item", () => {
		const prefix = getTreePrefix(true);
		expect(prefix).toBe("└─");
	});

	it("should return T-junction prefix for non-last item", () => {
		const prefix = getTreePrefix(false);
		expect(prefix).toBe("├─");
	});

	it("should use box-drawing characters", () => {
		const lastPrefix = getTreePrefix(true);
		const nonLastPrefix = getTreePrefix(false);

		expect(lastPrefix).toMatch(/[└]/);
		expect(nonLastPrefix).toMatch(/[├]/);
	});
});

describe("getTreeContinuation", () => {
	it("should return spaces for last item", () => {
		const continuation = getTreeContinuation(true);
		expect(continuation).toBe("  ");
	});

	it("should return vertical line for non-last item", () => {
		const continuation = getTreeContinuation(false);
		expect(continuation).toBe("│ ");
	});

	it("should have same length for both cases", () => {
		const lastContinuation = getTreeContinuation(true);
		const nonLastContinuation = getTreeContinuation(false);

		expect(lastContinuation.length).toBe(nonLastContinuation.length);
	});

	it("should use box-drawing characters for non-last", () => {
		const continuation = getTreeContinuation(false);
		expect(continuation).toMatch(/[│]/);
	});
});

describe("Integration - Formatting workflow", () => {
	it("should format complete validation output for entity with errors", () => {
		const errors = [
			"name: Required field",
			"description: Too short, priority: Invalid value",
		];
		const fieldErrors = parseValidationErrors(errors);

		const entityId = formatEntityId("requirement", 1, "test-req");
		const icon = getValidationIcon(true, false);

		expect(entityId).toBe("requirement-001-test-req");
		expect(icon).toContain(colors.red);
		expect(fieldErrors.size).toBe(3);
	});

	it("should handle complete tree structure formatting", () => {
		const fields = ["name", "description", "priority"];
		const output: string[] = [];

		for (let i = 0; i < fields.length; i++) {
			const field = fields[i];
			if (!field) continue;

			const isLast = i === fields.length - 1;
			const prefix = getTreePrefix(isLast);

			output.push(`${prefix} ${field}`);
		}

		expect(output).toHaveLength(3);
		expect(output[0]).toBe("├─ name");
		expect(output[1]).toBe("├─ description");
		expect(output[2]).toBe("└─ priority");
	});

	it("should format nested error messages in tree", () => {
		const errors = ["name: Error 1", "name: Error 2"];
		const fieldErrors = parseValidationErrors(errors);

		const messages = fieldErrors.get("name") || [];
		const output: string[] = [];

		for (let i = 0; i < messages.length; i++) {
			const msg = messages[i];
			if (!msg) continue;

			const isLast = i === messages.length - 1;
			const isParentLast = true; // Assume parent is last
			const continuation = getTreeContinuation(isParentLast);
			const msgPrefix = getTreePrefix(isLast);

			output.push(`${continuation}${msgPrefix} ${colors.red}${msg}${colors.reset}`);
		}

		expect(output).toHaveLength(2);
		expect(output[0]).toContain("Error 1");
		expect(output[1]).toContain("Error 2");
	});
});
