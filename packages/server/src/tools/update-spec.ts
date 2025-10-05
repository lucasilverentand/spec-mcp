import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import {
	type AnyEntity,
	computeEntityId,
	type EntityType,
} from "@spec-mcp/data";
import { z } from "zod";
import type { ServerConfig } from "../config/index.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";

/**
 * Register update_spec tool - updates a finalized spec with full validation
 */
export function registerUpdateSpecTool(
	server: McpServer,
	operations: SpecOperations,
	_config: ServerConfig,
) {
	server.registerTool(
		"update_spec",
		{
			title: "Update Spec",
			description:
				"Modify fields of a finalized specification. Validates changes before applying.\n\n" +
				"Example: { id: 'req-001-auth', updates: { priority: 'critical', description: 'New description' } }\n\n" +
				"Note: Locked specs only allow progress tracking updates (completed, approved, verified).",
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
		wrapToolHandler("update_spec", async ({ id, updates }) => {
			try {
				// Determine entity type from ID prefix
				const prefix = id.split("-")[0];
				let result: {
					success: boolean;
					data?: unknown;
					error?: string | undefined;
				};

				// Sanitize string values in updates
				const sanitizedUpdates = Object.entries(updates).reduce(
					(acc, [key, value]) => {
						if (typeof value === "string") {
							acc[key] = value;
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
				const allEntities: AnyEntity[] = [
					...(requirements as AnyEntity[]),
					...(plans as AnyEntity[]),
					...(components as AnyEntity[]),
				];
				const entity = allEntities.find((e) => {
					const entityId = computeEntityId(
						e.type as EntityType,
						e.number,
						e.slug,
					);
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
		}),
	);
}
