import { describe, expect, it } from "vitest";
import {
	TestCaseIdSchema,
	TestCaseSchema,
} from "../../../src/entities/shared/test-case-schema.js";

describe("TestCaseIdSchema", () => {
	it("should accept valid test case IDs", () => {
		const validIds = ["tc-001", "tc-999", "tc-042"];

		for (const id of validIds) {
			expect(() => TestCaseIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid test case IDs", () => {
		const invalidIds = [
			"tc-1", // not padded
			"tc-abc", // non-numeric
			"test-001", // wrong prefix
			"tc-001-extra", // extra suffix
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => TestCaseIdSchema.parse(id)).toThrow();
		}
	});
});

describe("TestCaseSchema", () => {
	it("should accept minimal valid test case", () => {
		const validTestCase = {
			id: "tc-001",
			name: "Login Test",
			description: "User can log in with valid credentials",
			steps: ["Navigate to login", "Enter credentials", "Click login"],
			expected_result: "User is redirected to dashboard",
		};

		expect(() => TestCaseSchema.parse(validTestCase)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const testCase = {
			id: "tc-001",
			name: "Login Test",
			description: "User can log in",
			steps: ["Step 1"],
			expected_result: "Login successful",
		};

		const parsed = TestCaseSchema.parse(testCase);

		expect(parsed.implemented).toBe(false);
		expect(parsed.passing).toBe(false);
		expect(parsed.components).toEqual([]);
		expect(parsed.related_flows).toEqual([]);
	});

	it("should accept complete test case with all fields", () => {
		const completeTestCase = {
			id: "tc-001",
			name: "User Login Test",
			description: "User login with valid credentials",
			steps: [
				"Navigate to login page",
				"Enter valid username",
				"Enter valid password",
				"Click login button",
			],
			expected_result: "User is logged in and redirected to dashboard",
			implemented: true,
			passing: true,
			components: ["app-001-frontend"],
			related_flows: ["flow-001"],
		};

		const parsed = TestCaseSchema.parse(completeTestCase);
		expect(parsed.steps).toHaveLength(4);
		expect(parsed.implemented).toBe(true);
		expect(parsed.passing).toBe(true);
		expect(parsed.components).toEqual(["app-001-frontend"]);
		expect(parsed.related_flows).toEqual(["flow-001"]);
	});

	it("should require all mandatory fields", () => {
		const requiredFields = [
			"id",
			"name",
			"description",
			"steps",
			"expected_result",
		];

		for (const field of requiredFields) {
			const invalidTestCase = {
				id: "tc-001",
				name: "Test Case",
				description: "Test description",
				steps: ["Step 1"],
				expected_result: "Expected result",
			};
			delete (invalidTestCase as Record<string, unknown>)[field];

			expect(() => TestCaseSchema.parse(invalidTestCase)).toThrow();
		}
	});

	it("should reject empty strings for required fields", () => {
		const testCaseWithEmptyName = {
			id: "tc-001",
			name: "",
			description: "Test description",
			steps: ["Step 1"],
			expected_result: "Expected result",
		};

		expect(() => TestCaseSchema.parse(testCaseWithEmptyName)).toThrow();

		const testCaseWithEmptyDescription = {
			id: "tc-001",
			name: "Test Case",
			description: "",
			steps: ["Step 1"],
			expected_result: "Expected result",
		};

		expect(() => TestCaseSchema.parse(testCaseWithEmptyDescription)).toThrow();

		const testCaseWithEmptyResult = {
			id: "tc-001",
			name: "Test Case",
			description: "Test description",
			steps: ["Step 1"],
			expected_result: "",
		};

		expect(() => TestCaseSchema.parse(testCaseWithEmptyResult)).toThrow();
	});

	it("should reject empty strings in steps array", () => {
		const testCaseWithEmptyStep = {
			id: "tc-001",
			name: "Test Case",
			description: "Test description",
			steps: ["Step 1", "", "Step 3"],
			expected_result: "Expected result",
		};

		expect(() => TestCaseSchema.parse(testCaseWithEmptyStep)).toThrow();
	});

	it("should validate component IDs", () => {
		const testCaseWithInvalidComponent = {
			id: "tc-001",
			name: "Test Case",
			description: "Test description",
			steps: ["Step 1"],
			expected_result: "Expected result",
			components: ["invalid-component-id"],
		};

		expect(() => TestCaseSchema.parse(testCaseWithInvalidComponent)).toThrow();
	});

	it("should accept valid component IDs", () => {
		const testCaseWithValidComponents = {
			id: "tc-001",
			name: "Test Case",
			description: "Test description",
			steps: ["Step 1"],
			expected_result: "Expected result",
			components: ["app-001-frontend", "svc-002-backend"],
		};

		expect(() =>
			TestCaseSchema.parse(testCaseWithValidComponents),
		).not.toThrow();
	});
});
