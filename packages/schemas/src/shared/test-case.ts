import z from "zod";
import { createSupersessionSchema } from "./supersession.js";

export const TestCaseIdSchema = z
	.string()
	.regex(/^tst-\d{3}$/, {
		message: "Test Case ID must follow format: tst-XXX",
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
	...createSupersessionSchema(TestCaseIdSchema),
});

export const TestCasesSchema = z
	.array(TestCaseSchema)
	.default([])
	.describe("Array of test cases");

export type TestCaseId = z.infer<typeof TestCaseIdSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type TestCases = z.infer<typeof TestCasesSchema>;
