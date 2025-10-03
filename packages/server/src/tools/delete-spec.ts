import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { formatDeleteResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { wizardHelper } from "../utils/wizard-helper.js";
import type { ToolContext } from "./index.js";

/**
 * Detect entity type from ID
 */
function detectEntityType(
	id: string,
): "requirement" | "plan" | "component" | "constitution" | "draft" | null {
	if (id.startsWith("draft-")) return "draft";
	if (/^req-\d{3}-.+$/.test(id)) return "requirement";
	if (/^pln-\d{3}-.+$/.test(id)) return "plan";
	if (/^(app|svc|lib)-\d{3}-.+$/.test(id)) return "component";
	if (/^con-\d{3}-.+$/.test(id)) return "constitution";
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
				"For drafts (IDs starting with 'draft-'), deletes the .draft.yml file. " +
				"For finalized specs, deletes the spec file and all associated data.",
			inputSchema: {
				id: z
					.string()
					.describe(
						"Spec or draft ID to delete (e.g., 'draft-req-auth-1234567890', 'req-001-user-auth', 'pln-001-api-gateway')",
					),
			},
		},
		wrapToolHandler(
			"delete_spec",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const entityType = detectEntityType(validatedId);

				if (!entityType) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: `Invalid ID format: ${id}`,
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Handle draft deletion
				if (entityType === "draft") {
					const draft = wizardHelper.getDraft(validatedId);
					if (!draft) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: false,
											error: `Draft not found: ${id}`,
										},
										null,
										2,
									),
								},
							],
							isError: true,
						};
					}

					const deleted = await wizardHelper.deleteDraft(validatedId);
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
				let result;
				switch (entityType) {
					case "requirement":
						result = await operations.deleteRequirement(validatedId);
						return formatDeleteResult(result, "requirement", validatedId);

					case "plan":
						result = await operations.deletePlan(validatedId);
						return formatDeleteResult(result, "plan", validatedId);

					case "component":
						result = await operations.deleteComponent(validatedId);
						return formatDeleteResult(result, "component", validatedId);

					case "constitution":
						result = await operations.deleteConstitution(validatedId);
						return formatDeleteResult(result, "constitution", validatedId);

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
