import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config/index.js";
import type { SpecOperations } from "@spec-mcp/core";
import { finalizeDraft } from "@spec-mcp/core";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { getCreationFlowHelper } from "../utils/creation-flow-helper.js";

/**
 * Register create_spec tool - creates a specification from finalized draft data
 */
export function registerCreateSpecTool(
	server: McpServer,
	operations: SpecOperations,
	config: ServerConfig,
) {
	server.registerTool(
		"create_spec",
		{
			title: "Create Specification",
			description:
				"Creates a specification from finalized creation flow data. This tool is called after completing all creation flow steps.\n\n" +
				"The LLM should map the collected Q&A data to the proper schema structure and call this tool with the formatted data.\n\n" +
				"Example: After completing all requirement steps, call create_spec with:\n" +
				"{\n" +
				'  "draft_id": "req-...",\n' +
				'  "type": "requirement",\n' +
				'  "data": {\n' +
				'    "slug": "user-authentication",\n' +
				'    "name": "User Authentication",\n' +
				'    "description": "System must authenticate users...",\n' +
				'    "priority": "critical",\n' +
				'    "criteria": [...]\n' +
				"  }\n" +
				"}",
			inputSchema: {
				draft_id: z
					.string()
					.describe("Draft ID from the creation flow"),
				type: z
					.enum(["requirement", "component", "plan", "constitution", "decision"])
					.describe("Type of specification to create"),
				data: z
					.record(z.unknown())
					.describe(
						"Specification data formatted according to the schema. This should contain all required fields for the spec type.",
					),
			},
		},
		wrapToolHandler(
			"create_spec",
			async ({ draft_id, type, data }) => {
				// Create helper with resolved specs path
				const helper = getCreationFlowHelper(config.specsPath);

				// Verify draft exists
				const draft = helper.getDraft(draft_id);
				if (!draft) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: `Draft not found: ${draft_id}. The draft may have expired or been deleted.`,
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Verify draft type matches requested type
				if (draft.type !== type) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: `Draft type mismatch: draft is type '${draft.type}' but you're trying to create type '${type}'`,
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Validate and finalize using schema
				const finalizationResult = finalizeDraft(type, data as Record<string, unknown>);

				if (!finalizationResult.success) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: "Validation failed",
										validation_errors: finalizationResult.errors,
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Create the spec using operations
				let result: unknown;

				try {
					switch (type) {
						case "requirement":
							// @ts-expect-error - Type system limitation
							result = await operations.createRequirement(finalizationResult.data);
							break;

						case "plan":
							// @ts-expect-error - Type system limitation
							result = await operations.createPlan(finalizationResult.data);
							break;

						case "component":
							// @ts-expect-error - Type system limitation
							result = await operations.createComponent(finalizationResult.data);
							break;

						case "constitution":
							// @ts-expect-error - Type system limitation
							result = await operations.createConstitution(finalizationResult.data);
							break;

						case "decision":
							// @ts-expect-error - Type system limitation
							result = await operations.createDecision(finalizationResult.data);
							break;

						default:
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify(
											{
												success: false,
												error: `Unsupported spec type: ${type}`,
											},
											null,
											2,
										),
									},
								],
								isError: true,
							};
					}

					// Delete draft after successful creation
					// @ts-expect-error - Result can be any entity type
					if (result.success) {
						await helper.deleteDraft(draft_id);
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: true,
											message: `${type} created successfully!`,
											// @ts-expect-error - Result can be any entity type
											spec_id: result.data?.id,
											// @ts-expect-error - Result can be any entity type
											spec: result.data,
										},
										null,
										2,
									),
								},
							],
						};
					}

					// @ts-expect-error - Result can be any entity type, formatResult handles all
					return formatResult(result);
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: `Failed to create ${type}: ${error instanceof Error ? error.message : String(error)}`,
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}
			},
		),
	);
}
