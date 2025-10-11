import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";

/**
 * Delete a spec entity by ID
 */
export async function deleteSpec(
	specManager: SpecManager,
	id: string,
): Promise<ToolResponse> {
	try {
		// First validate and find the entity
		const result = await validateEntity(specManager, id);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to delete entity: ${result.errors?.join(", ") || "Entity not found"}`,
					},
				],
				isError: true,
			};
		}

		const entity = result.entity;
		const entityType = entity.type;

		// Get the appropriate manager
		const manager =
			entityType === "business-requirement"
				? specManager.business_requirements
				: entityType === "technical-requirement"
					? specManager.tech_requirements
					: entityType === "plan"
						? specManager.plans
						: entityType === "component"
							? specManager.components
							: entityType === "constitution"
								? specManager.constitutions
								: specManager.decisions;

		// Delete the entity
		await manager.deleteEntity(entity.number);

		return {
			content: [
				{
					type: "text",
					text: `Successfully deleted ${entityType} ${entity.number}: ${entity.name}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error deleting entity: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const deleteSpecTool = {
	name: "delete_spec",
	description:
		"Delete a spec entity by its ID. Accepts formats: typ-123, typ-123-slug-here, or typ-123-slug-here.yml. This permanently removes the entity file.",
	inputSchema: {
		type: "object",
		properties: {
			id: {
				type: "string",
				description:
					"Entity identifier. Accepts: typ-123, typ-123-slug-here, or typ-123-slug-here.yml",
			},
		},
		required: ["id"],
	} as const,
};
