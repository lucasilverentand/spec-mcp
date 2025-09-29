import z from "zod";
import { ComponentIdSchema } from "../components/component.js";
import { FlowIdSchema } from "./flow-schema.js";

export const TestCaseIdSchema = z
	.string()
	.regex(/^tc-\d{3}$/, {
		message: "Test Case ID must follow format: tc-XXX",
	})
	.describe("Unique identifier for the test case");

export const TestCaseSchema = z.object({
	id: TestCaseIdSchema,
	name: z.string().min(1).describe("Display name of the test case"),
	description: z
		.string()
		.min(1)
		.describe("Detailed description of what the test case covers"),
	steps: z
		.array(z.string().min(1))
		.describe("Ordered list of steps to execute the test case"),
	expected_result: z
		.string()
		.min(1)
		.describe("Expected outcome of the test case"),
	implemented: z
		.boolean()
		.default(false)
		.describe("Whether the test case has been implemented"),
	passing: z
		.boolean()
		.default(false)
		.describe("Whether the test case is currently passing"),
	components: z
		.array(ComponentIdSchema)
		.default([])
		.describe("Components involved in this test case"),
	related_flows: z
		.array(FlowIdSchema)
		.default([])
		.describe("Flows linked to this test case"),
});
