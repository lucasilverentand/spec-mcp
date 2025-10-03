import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { formatDeleteResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { creationFlowHelper } from "../utils/creation-flow-helper.js";
import type { ToolContext } from "./index.js";

/**
 * Detect entity type from ID
 */
function detectEntityType(
	id: string,
): "requirement" | "plan" | "component" | "constitution" | "decision" | null {
	if (/^req-\d{3}-.+$/.test(id)) return "requirement";
	if (/^pln-\d{3}-.+$/.test(id)) return "plan";
	if (/^(app|svc|lib)-\d{3}-.+$/.test(id)) return "component";
	if (/^con-\d{3}-.+$/.test(id)) return "constitution";
	if (/^dec-\d{3}-.+$/.test(id)) return "decision";
	return null;
}

/**
 * Register delete_spec tool - deletes drafts or finalized specs
 */
export function registerDeleteSpecTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"delete_spec",
		{
			title: "Delete Spec",
			description:
				"Delete a specification or draft. " +
				"Automatically detects whether the ID is a draft or finalized spec and deletes accordingly.",
			inputSchema: {
				id: z
					.string()
					.describe(
						"Spec or draft ID to delete (e.g., 'req-001-user-auth', 'pln-001-api-gateway')",
					),
			},
		},
		wrapToolHandler(
			"delete_spec",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);

				// Try to delete as draft first
				const draft = creationFlowHelper.getDraft(validatedId);
				if (draft) {
					const deleted = await creationFlowHelper.deleteDraft(validatedId);
					if (deleted) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: true,
											message: `Draft deleted successfully`,
											draft_id: validatedId,
											spec_type: draft.type,
										},
										null,
										2,
									),
								},
							],
						};
					}

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: `Failed to delete draft: ${id}`,
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Handle finalized spec deletion
				const entityType = detectEntityType(validatedId);
				if (!entityType) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: `Invalid ID format or entity not found: ${id}`,
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				switch (entityType) {
					case "requirement": {
						const result = await operations.deleteRequirement(validatedId);
						return formatDeleteResult(result, "requirement", validatedId);
					}

					case "plan": {
						const result = await operations.deletePlan(validatedId);
						return formatDeleteResult(result, "plan", validatedId);
					}

					case "component": {
						const result = await operations.deleteComponent(validatedId);
						return formatDeleteResult(result, "component", validatedId);
					}

					case "constitution": {
						const result = await operations.deleteConstitution(validatedId);
						return formatDeleteResult(result, "constitution", validatedId);
					}

					default:
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: false,
											error: `Unsupported entity type: ${entityType}`,
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
			context,
		),
	);
}
