import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
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
): Promise<CallToolResult> {
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

		const spec = result.entity;

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
		// Also map 'title' to 'name' for schema compatibility
		const filteredUpdates: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				// Map 'title' to 'name' since schemas use 'name' but tools use 'title'
				const actualKey = key === "title" ? "name" : key;
				filteredUpdates[actualKey] = value;
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

		// Perform the update with proper type narrowing
		await performUpdate(specManager, spec.type, spec.number, filteredUpdates);

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
 * Helper to perform an update with proper type narrowing
 * This avoids the union type issue by performing the update inline with proper narrowing
 */
async function performUpdate(
	specManager: SpecManager,
	specType: string,
	specNumber: number,
	updates: Record<string, unknown>,
): Promise<void> {
	switch (specType) {
		case "plan":
			await specManager.plans.update(
				specNumber,
				updates as Parameters<typeof specManager.plans.update>[1],
			);
			break;
		case "business-requirement":
			await specManager.business_requirements.update(
				specNumber,
				updates as Parameters<
					typeof specManager.business_requirements.update
				>[1],
			);
			break;
		case "technical-requirement":
			await specManager.tech_requirements.update(
				specNumber,
				updates as Parameters<typeof specManager.tech_requirements.update>[1],
			);
			break;
		case "decision":
			await specManager.decisions.update(
				specNumber,
				updates as Parameters<typeof specManager.decisions.update>[1],
			);
			break;
		case "component":
			await specManager.components.update(
				specNumber,
				updates as Parameters<typeof specManager.components.update>[1],
			);
			break;
		case "constitution":
			await specManager.constitutions.update(
				specNumber,
				updates as Parameters<typeof specManager.constitutions.update>[1],
			);
			break;
		case "milestone":
			await specManager.milestones.update(
				specNumber,
				updates as Parameters<typeof specManager.milestones.update>[1],
			);
			break;
		default:
			throw new Error(`Unknown spec type: ${specType}`);
	}
}
