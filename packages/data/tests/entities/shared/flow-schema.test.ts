import { describe, expect, it } from "vitest";
import {
	FlowIdSchema,
	FlowSchema,
	FlowStepIdSchema,
	FlowStepSchema,
} from "../../../src/entities/shared/flow-schema.js";

describe("FlowStepIdSchema", () => {
	it("should accept valid flow step IDs", () => {
		const validIds = ["step-001", "step-999", "step-042"];

		for (const id of validIds) {
			expect(() => FlowStepIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid flow step IDs", () => {
		const invalidIds = [
			"step-1", // not padded
			"step-abc", // non-numeric
			"stp-001", // wrong prefix
			"step-001-extra", // extra suffix
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => FlowStepIdSchema.parse(id)).toThrow();
		}
	});
});

describe("FlowIdSchema", () => {
	it("should accept valid flow IDs", () => {
		const validIds = ["flow-001", "flow-999", "flow-042"];

		for (const id of validIds) {
			expect(() => FlowIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid flow IDs", () => {
		const invalidIds = [
			"flow-1", // not padded
			"flow-abc", // non-numeric
			"flw-001", // wrong prefix
			"flow-001-extra", // extra suffix
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => FlowIdSchema.parse(id)).toThrow();
		}
	});
});

describe("FlowStepSchema", () => {
	it("should accept minimal valid flow step", () => {
		const validStep = {
			id: "step-001",
			name: "User Login Step",
		};

		expect(() => FlowStepSchema.parse(validStep)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const step = {
			id: "step-001",
			name: "User Login Step",
		};

		const parsed = FlowStepSchema.parse(step);
		expect(parsed.description).toBeUndefined();
		expect(parsed.next_steps).toEqual([]);
	});

	it("should accept complete flow step with all fields", () => {
		const completeStep = {
			id: "step-001",
			name: "User Login Step",
			description: "User enters valid login credentials",
			next_steps: ["step-002", "step-003"],
		};

		const parsed = FlowStepSchema.parse(completeStep);
		expect(parsed.name).toBe("User Login Step");
		expect(parsed.description).toBe("User enters valid login credentials");
		expect(parsed.next_steps).toEqual(["step-002", "step-003"]);
	});

	it("should require mandatory fields", () => {
		const requiredFields = ["id", "name"];

		for (const field of requiredFields) {
			const invalidStep = {
				id: "step-001",
				name: "Test Step",
			};
			delete (invalidStep as Record<string, unknown>)[field];

			expect(() => FlowStepSchema.parse(invalidStep)).toThrow();
		}
	});

	it("should reject empty name", () => {
		const stepWithEmptyName = {
			id: "step-001",
			name: "",
		};

		expect(() => FlowStepSchema.parse(stepWithEmptyName)).toThrow();
	});

	it("should validate next_steps IDs", () => {
		const stepWithInvalidNextStep = {
			id: "step-001",
			name: "Test Step",
			next_steps: ["invalid-id"],
		};

		expect(() => FlowStepSchema.parse(stepWithInvalidNextStep)).toThrow();
	});

	it("should accept valid next_steps IDs", () => {
		const stepWithValidNextSteps = {
			id: "step-001",
			name: "Test Step",
			next_steps: ["step-002", "step-003", "step-999"],
		};

		expect(() => FlowStepSchema.parse(stepWithValidNextSteps)).not.toThrow();
	});
});

describe("FlowSchema", () => {
	it("should accept minimal valid flow", () => {
		const validFlow = {
			id: "flow-001",
			type: "user",
			name: "User Login Flow",
			steps: [
				{
					id: "step-001",
					name: "Navigate to login page",
				},
			],
		};

		expect(() => FlowSchema.parse(validFlow)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const flow = {
			id: "flow-001",
			type: "user",
			name: "User Login Flow",
			steps: [
				{
					id: "step-001",
					name: "Navigate to login page",
				},
			],
		};

		const parsed = FlowSchema.parse(flow);
		expect(parsed.description).toBeUndefined();
	});

	it("should accept complete flow with all fields", () => {
		const completeFlow = {
			id: "flow-001",
			type: "user",
			name: "User Login Flow",
			description: "Complete user authentication process",
			steps: [
				{
					id: "step-001",
					name: "Enter credentials",
					description: "User enters username and password",
				},
				{
					id: "step-002",
					name: "Validate credentials",
					description: "System validates user credentials",
				},
			],
		};

		const parsed = FlowSchema.parse(completeFlow);
		expect(parsed.type).toBe("user");
		expect(parsed.name).toBe("User Login Flow");
		expect(parsed.description).toBe("Complete user authentication process");
		expect(parsed.steps).toHaveLength(2);
	});

	it("should require mandatory fields", () => {
		const requiredFields = ["id", "type", "name", "steps"];

		for (const field of requiredFields) {
			const invalidFlow = {
				id: "flow-001",
				type: "user",
				name: "Test Flow",
				steps: [{ id: "step-001", name: "Test step" }],
			};
			delete (invalidFlow as Record<string, unknown>)[field];

			expect(() => FlowSchema.parse(invalidFlow)).toThrow();
		}
	});

	it("should require at least one step", () => {
		const flowWithoutSteps = {
			id: "flow-001",
			type: "user",
			name: "Test Flow",
			steps: [],
		};

		expect(() => FlowSchema.parse(flowWithoutSteps)).toThrow();
	});

	it("should reject empty strings for required fields", () => {
		const flowWithEmptyName = {
			id: "flow-001",
			type: "user",
			name: "",
			steps: [{ id: "step-001", name: "Test step" }],
		};

		expect(() => FlowSchema.parse(flowWithEmptyName)).toThrow();
	});

	it("should accept different flow types", () => {
		const flowTypes = ["user", "system", "data", "api", "business"];

		for (const type of flowTypes) {
			const flow = {
				id: "flow-001",
				type,
				name: "Test Flow",
				steps: [{ id: "step-001", name: "Test step" }],
			};
			expect(() => FlowSchema.parse(flow)).not.toThrow();
		}
	});
});
