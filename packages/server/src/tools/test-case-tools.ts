import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type { Plan, TestCase } from "@spec-mcp/schemas";
import {
	type ArrayToolConfig,
	addItemWithId,
	supersedeItemWithId,
} from "./array-tool-builder.js";

/**
 * Add a test case to a Plan
 * Supports superseding existing test cases by providing supersede_id
 */
export async function addTestCase(
	specManager: SpecManager,
	planId: string,
	name: string,
	description: string,
	steps: string[],
	expected_result: string,
	options?: {
		implemented?: boolean;
		passing?: boolean;
		supersede_id?: string;
	},
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, TestCase> = {
		toolName: "add_test_case",
		description: "Add test case to a plan",
		specType: "plan",
		arrayFieldName: "test_cases",
		idPrefix: "tc",
		getArray: (spec) => spec.test_cases || [],
		setArray: (_spec, items) => ({ test_cases: items }),
	};

	return addItemWithId(
		specManager,
		planId,
		{
			name,
			description,
			steps,
			expected_result,
			implemented: options?.implemented ?? false,
			passing: options?.passing ?? false,
		} as Omit<
			TestCase,
			"id" | "supersedes" | "superseded_by" | "superseded_at"
		>,
		config,
		options?.supersede_id,
	);
}

export const addTestCaseTool = {
	name: "add_test_case",
	description:
		"Add a test case to a Plan. Test cases validate that the plan works correctly. Optionally supersede an existing test case by providing supersede_id - this will create a new version, mark the old test case as superseded, and update all references.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001-user-auth)",
			},
			name: {
				type: "string",
				description: "Display name of the test case",
			},
			description: {
				type: "string",
				description: "Detailed description of what the test case covers",
			},
			steps: {
				type: "array",
				items: { type: "string" },
				description: "Ordered list of steps to execute the test case",
			},
			expected_result: {
				type: "string",
				description: "Expected outcome of the test case",
			},
			implemented: {
				type: "boolean",
				description:
					"Whether the test case has been implemented (default: false)",
			},
			passing: {
				type: "boolean",
				description:
					"Whether the test case is currently passing (default: false)",
			},
			supersede_id: {
				type: "string",
				description:
					"Optional: ID of an existing test case to supersede (e.g., 'tc-001'). The old test case will be marked as superseded and all references will be updated.",
			},
		},
		required: ["plan_id", "name", "description", "steps", "expected_result"],
	} as const,
};

/**
 * Supersede an existing test case with updated values
 * Creates a new test case with a new ID and marks the old one as superseded
 */
export async function supersedeTestCase(
	specManager: SpecManager,
	planId: string,
	testCaseId: string,
	updates: Partial<
		Pick<
			TestCase,
			| "name"
			| "description"
			| "steps"
			| "expected_result"
			| "implemented"
			| "passing"
		>
	>,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, TestCase> = {
		toolName: "supersede_test_case",
		description: "Supersede test case in a plan",
		specType: "plan",
		arrayFieldName: "test_cases",
		idPrefix: "tc",
		getArray: (spec) => spec.test_cases || [],
		setArray: (_spec, items) => ({ test_cases: items }),
	};

	return supersedeItemWithId(specManager, planId, testCaseId, updates, config);
}
