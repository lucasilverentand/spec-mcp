import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// ID schemas for sub-entities
const TaskIdSchema = z.string().regex(/^task-\d{3}$/);
const TestCaseIdSchema = z.string().regex(/^tc-\d{3}$/);
const FlowIdSchema = z.string().regex(/^flow-\d{3}$/);
const ApiContractIdSchema = z.string().regex(/^api-\d{3}$/);
const DataModelIdSchema = z.string().regex(/^dm-\d{3}$/);

/**
 * Register sub-entity accessor tools
 */
export function registerSubEntityTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Get Plan Task Tool
	server.registerTool(
		"get-plan-task",
		{
			title: "Get Plan Task",
			description: "Retrieve a single task from a plan by its ID",
			inputSchema: {
				plan_id: z.string().describe("Plan ID (e.g., 'pln-001-slug')"),
				task_id: TaskIdSchema.describe("Task ID (e.g., 'task-001')"),
			},
		},
		wrapToolHandler(
			"get-plan-task",
			async ({ plan_id, task_id }) => {
				const validatedPlanId = context.inputValidator.validateId(plan_id);
				const validatedTaskId = context.inputValidator.validateId(task_id);

				const planResult = await operations.getPlan(validatedPlanId);
				if (!planResult.success || !planResult.data) {
					return formatResult(planResult);
				}

				const task = planResult.data.tasks?.find(
					(t) => t.id === validatedTaskId,
				);
				if (!task) {
					return formatResult({
						success: false,
						error: `Task '${validatedTaskId}' not found in plan '${validatedPlanId}'`,
					});
				}

				return formatResult({ success: true, data: task });
			},
			context,
		),
	);

	// Get Plan Test Case Tool
	server.registerTool(
		"get-plan-test-case",
		{
			title: "Get Plan Test Case",
			description: "Retrieve a single test case from a plan by its ID",
			inputSchema: {
				plan_id: z.string().describe("Plan ID (e.g., 'pln-001-slug')"),
				test_case_id: TestCaseIdSchema.describe(
					"Test Case ID (e.g., 'tc-001')",
				),
			},
		},
		wrapToolHandler(
			"get-plan-test-case",
			async ({ plan_id, test_case_id }) => {
				const validatedPlanId = context.inputValidator.validateId(plan_id);
				const validatedTestCaseId =
					context.inputValidator.validateId(test_case_id);

				const planResult = await operations.getPlan(validatedPlanId);
				if (!planResult.success || !planResult.data) {
					return formatResult(planResult);
				}

				const testCase = planResult.data.test_cases?.find(
					(tc) => tc.id === validatedTestCaseId,
				);
				if (!testCase) {
					return formatResult({
						success: false,
						error: `Test case '${validatedTestCaseId}' not found in plan '${validatedPlanId}'`,
					});
				}

				return formatResult({ success: true, data: testCase });
			},
			context,
		),
	);

	// Get Plan Flow Tool
	server.registerTool(
		"get-plan-flow",
		{
			title: "Get Plan Flow",
			description: "Retrieve a single flow from a plan by its ID",
			inputSchema: {
				plan_id: z.string().describe("Plan ID (e.g., 'pln-001-slug')"),
				flow_id: FlowIdSchema.describe("Flow ID (e.g., 'flow-001')"),
			},
		},
		wrapToolHandler(
			"get-plan-flow",
			async ({ plan_id, flow_id }) => {
				const validatedPlanId = context.inputValidator.validateId(plan_id);
				const validatedFlowId = context.inputValidator.validateId(flow_id);

				const planResult = await operations.getPlan(validatedPlanId);
				if (!planResult.success || !planResult.data) {
					return formatResult(planResult);
				}

				const flow = planResult.data.flows?.find(
					(f) => f.id === validatedFlowId,
				);
				if (!flow) {
					return formatResult({
						success: false,
						error: `Flow '${validatedFlowId}' not found in plan '${validatedPlanId}'`,
					});
				}

				return formatResult({ success: true, data: flow });
			},
			context,
		),
	);

	// Get Plan API Contract Tool
	server.registerTool(
		"get-plan-api-contract",
		{
			title: "Get Plan API Contract",
			description: "Retrieve a single API contract from a plan by its ID",
			inputSchema: {
				plan_id: z.string().describe("Plan ID (e.g., 'pln-001-slug')"),
				api_contract_id: ApiContractIdSchema.describe(
					"API Contract ID (e.g., 'api-001')",
				),
			},
		},
		wrapToolHandler(
			"get-plan-api-contract",
			async ({ plan_id, api_contract_id }) => {
				const validatedPlanId = context.inputValidator.validateId(plan_id);
				const validatedApiContractId =
					context.inputValidator.validateId(api_contract_id);

				const planResult = await operations.getPlan(validatedPlanId);
				if (!planResult.success || !planResult.data) {
					return formatResult(planResult);
				}

				const apiContract = planResult.data.api_contracts?.find(
					(ac) => ac.id === validatedApiContractId,
				);
				if (!apiContract) {
					return formatResult({
						success: false,
						error: `API contract '${validatedApiContractId}' not found in plan '${validatedPlanId}'`,
					});
				}

				return formatResult({ success: true, data: apiContract });
			},
			context,
		),
	);

	// Get Plan Data Model Tool
	server.registerTool(
		"get-plan-data-model",
		{
			title: "Get Plan Data Model",
			description: "Retrieve a single data model from a plan by its ID",
			inputSchema: {
				plan_id: z.string().describe("Plan ID (e.g., 'pln-001-slug')"),
				data_model_id: DataModelIdSchema.describe(
					"Data Model ID (e.g., 'dm-001')",
				),
			},
		},
		wrapToolHandler(
			"get-plan-data-model",
			async ({ plan_id, data_model_id }) => {
				const validatedPlanId = context.inputValidator.validateId(plan_id);
				const validatedDataModelId =
					context.inputValidator.validateId(data_model_id);

				const planResult = await operations.getPlan(validatedPlanId);
				if (!planResult.success || !planResult.data) {
					return formatResult(planResult);
				}

				const dataModel = planResult.data.data_models?.find(
					(dm) => dm.id === validatedDataModelId,
				);
				if (!dataModel) {
					return formatResult({
						success: false,
						error: `Data model '${validatedDataModelId}' not found in plan '${validatedPlanId}'`,
					});
				}

				return formatResult({ success: true, data: dataModel });
			},
			context,
		),
	);
}
