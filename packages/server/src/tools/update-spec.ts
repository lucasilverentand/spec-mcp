import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

/**
 * Register update_spec tool - updates a finalized spec with full validation
 */
export function registerUpdateSpecTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"update_spec",
		{
			title: "Update Spec",
			description:
				"Update a finalized specification (requirement, plan, or component) with full validation. " +
				"Provide the spec ID and the fields to update. The tool will validate the entire spec after updating.",
			inputSchema: {
				id: z
					.string()
					.describe(
						"Spec ID (e.g., 'req-001-auth', 'pln-002-api', 'lib-003-utils')",
					),
				updates: z
					.record(z.unknown())
					.describe(
						"Object containing the fields to update and their new values",
					),
			},
		},
		wrapToolHandler(
			"update_spec",
			async ({ id, updates }) => {
				try {
					// Determine entity type from ID prefix
					const prefix = id.split("-")[0];
					let result;

					// Sanitize string values in updates
					const sanitizedUpdates = Object.entries(updates).reduce(
						(acc, [key, value]) => {
							if (typeof value === "string") {
								acc[key] = context.inputValidator.sanitizeString(value);
							} else {
								acc[key] = value;
							}
							return acc;
						},
						{} as Record<string, unknown>,
					);

					// Update timestamps
					sanitizedUpdates.updated_at = new Date().toISOString();

					switch (prefix) {
						case "req":
							result = await operations.updateRequirement(id, sanitizedUpdates);
							break;
						case "pln":
							result = await operations.updatePlan(id, sanitizedUpdates);
							break;
						case "lib":
						case "svc":
						case "app":
							result = await operations.updateComponent(id, sanitizedUpdates);
							break;
						case "con":
							result = await operations.updateConstitution(id, sanitizedUpdates);
							break;
						default:
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify(
											{
												success: false,
												error: `Unknown entity type for ID: ${id}`,
											},
											null,
											2,
										),
									},
								],
								isError: true,
							};
					}

					if (!result.success) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: false,
											error: result.error || "Failed to update spec",
										},
										null,
										2,
									),
								},
							],
							isError: true,
						};
					}

					// Validate the updated spec
					const { SpecService } = await import("@spec-mcp/core");
					const service = new SpecService({
						specsPath: operations.getManager().config.path ?? "./specs",
					});
					await service.initialize();

					// Get the updated entity
					const entitiesResult = await service.getAllEntities();
					if (!entitiesResult.success || !entitiesResult.data) {
						throw new Error("Failed to load entities");
					}

					const { requirements, plans, components } = entitiesResult.data;
					const allEntities = [...requirements, ...plans, ...components];
					const entity = allEntities.find((e) => {
						const entityId = `${e.type}-${e.number.toString().padStart(3, "0")}-${e.slug}`;
						return entityId === id || e.slug === id;
					});

					if (!entity) {
						throw new Error(`Entity not found: ${id}`);
					}

					const validation = await service.validateEntity(entity);

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: true,
										data: result.data,
										validation: {
											passed: validation.valid,
											errors: validation.errors || [],
											warnings: validation.warnings || [],
										},
										message: validation.valid
											? "Spec updated and validated successfully"
											: "Spec updated but has validation issues",
									},
									null,
									2,
								),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: `Failed to update spec: ${error instanceof Error ? error.message : String(error)}`,
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
