import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config/index.js";
import type { SpecOperations } from "@spec-mcp/core";
import { finalizeDraft } from "@spec-mcp/core";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { getCreationFlowHelper } from "../utils/creation-flow-helper.js";

/**
 * Register finalize_draft tool - finalizes a draft and creates the specification
 */
export function registerFinalizeDraftTool(
	server: McpServer,
	operations: SpecOperations,
	config: ServerConfig,
) {
	server.registerTool(
		"finalize_draft",
		{
			title: "Finalize Draft",
			description:
				"Finalizes a completed draft and creates the specification. This tool automatically:\n" +
				"1. Retrieves the draft data\n" +
				"2. Validates the data against the schema\n" +
				"3. Creates the specification\n" +
				"4. Cleans up the draft\n\n" +
				"This tool should be called after completing all creation flow steps (when update_draft returns completed: true).\n\n" +
				"Example: After completing all requirement steps, call finalize_draft with:\n" +
				"{\n" +
				'  "draft_id": "req-1234567890-xyz"\n' +
				"}",
			inputSchema: {
				draft_id: z
					.string()
					.describe("Draft ID from the creation flow"),
			},
		},
		wrapToolHandler(
			"finalize_draft",
			async ({ draft_id }) => {
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

				// Use the draft's data for validation
				const finalizationResult = finalizeDraft(draft.type, draft.data);

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
					switch (draft.type) {
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
												error: `Unsupported spec type: ${draft.type}`,
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
											message: `${draft.type} created successfully!`,
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
										error: `Failed to create ${draft.type}: ${error instanceof Error ? error.message : String(error)}`,
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
