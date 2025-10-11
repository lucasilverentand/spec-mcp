import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";

/**
 * Generic function to update scalar fields in a spec
 * Only updates fields that are provided (partial update)
 */
export async function updateSpec<
	TSpec extends { type: string; number: number },
>(
	specManager: SpecManager,
	specId: string,
	updates: Partial<
		Omit<TSpec, "type" | "number" | "created_at" | "updated_at">
	>,
	specType: string,
): Promise<ToolResponse> {
	try {
		// Validate and find the spec
		const result = await validateEntity(specManager, specId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find ${specType}: ${result.errors?.join(", ") || "Not found"}`,
					},
				],
				isError: true,
			};
		}

		const spec = result.entity as TSpec;

		if (spec.type !== specType) {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${specId} is not a ${specType} (found: ${spec.type})`,
					},
				],
				isError: true,
			};
		}

		// Filter out undefined values (only update fields that were provided)
		const filteredUpdates: Partial<TSpec> = {};
		const filteredUpdatesRecord = filteredUpdates as Record<string, unknown>;
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				filteredUpdatesRecord[key] = value;
			}
		}

		// If no updates provided, return error
		if (Object.keys(filteredUpdates).length === 0) {
			return {
				content: [
					{
						type: "text",
						text: `No fields provided to update for ${specType} ${specId}`,
					},
				],
				isError: true,
			};
		}

		// Get the appropriate manager method
		const manager = getSpecManager(specManager, spec.type);
		await manager.update(spec.number, filteredUpdates);

		// Build summary of what was updated
		const updatedFields = Object.keys(filteredUpdates);
		const summary = `Successfully updated ${specType} ${specId}:\n- ${updatedFields.join("\n- ")}`;

		return {
			content: [
				{
					type: "text",
					text: summary,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error updating ${specType}: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Helper to get the appropriate spec manager
 */
function getSpecManager(specManager: SpecManager, specType: string) {
	switch (specType) {
		case "plan":
			return specManager.plans;
		case "business-requirement":
			return specManager.businessRequirements;
		case "technical-requirement":
			return specManager.technicalRequirements;
		case "decision":
			return specManager.decisions;
		case "component":
			return specManager.components;
		case "constitution":
			return specManager.constitutions;
		default:
			throw new Error(`Unknown spec type: ${specType}`);
	}
}
