import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import type { ServerConfig } from "../config/index.js";
import { formatDeleteResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { getCreationFlowHelper } from "../utils/creation-flow-helper.js";

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
	config: ServerConfig,
) {
	server.registerTool(
		"delete_spec",
		{
			title: "Delete Spec",
			description:
				"Remove a specification or draft from the system. Auto-detects spec type from ID.\n\n" +
				"Example: { id: 'req-001-auth' } or { id: 'con-1759622110977-o2iwt1' }",
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
				// Create helper with resolved specs path
				const helper = getCreationFlowHelper(config.specsPath);

				// Try to delete as draft first
				const draft = helper.getDraft(id);
				if (draft) {
					const deleted = await helper.deleteDraft(id);
					if (deleted) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: true,
											message: `Draft deleted successfully`,
											draft_id: id,
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
				const entityType = detectEntityType(id);
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
						const result = await operations.deleteRequirement(id);
						return formatDeleteResult(result, "requirement", id);
					}

					case "plan": {
						const result = await operations.deletePlan(id);
						return formatDeleteResult(result, "plan", id);
					}

					case "component": {
						const result = await operations.deleteComponent(id);
						return formatDeleteResult(result, "component", id);
					}

					case "constitution": {
						const result = await operations.deleteConstitution(id);
						return formatDeleteResult(result, "constitution", id);
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
		),
	);
}
