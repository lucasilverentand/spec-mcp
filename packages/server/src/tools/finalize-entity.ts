import type { DraftStore, SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Component,
	Constitution,
	Decision,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { z } from "zod";

/**
 * Schema for finalize_entity tool arguments
 */
export const FinalizeEntityArgsSchema = z.object({
	draftId: z.string().describe("The draft session ID"),
	entityId: z
		.string()
		.optional()
		.describe(
			"Entity ID to finalize. Omit or use 'main' for main entity, use 'fieldName[index]' for array items (e.g., 'business_value[0]')",
		),
	data: z
		.record(z.any())
		.describe("Complete JSON object for the entity/item, matching the schema"),
});

export type FinalizeEntityArgs = z.infer<typeof FinalizeEntityArgsSchema>;

/**
 * Finalize an entity (main or array item) with LLM-generated data.
 * When finalizing the main entity, automatically saves the spec.
 */
export async function finalizeEntity(
	args: FinalizeEntityArgs,
	draftStore: DraftStore,
	specManager: SpecManager,
): Promise<string> {
	const { draftId, entityId, data } = args;

	// Get the draft
	const manager = draftStore.get(draftId);
	if (!manager) {
		throw new Error(
			`Draft '${draftId}' not found. Use start_draft to create a new draft or list_drafts to see available drafts.`,
		);
	}

	const isMainEntity = !entityId || entityId === "main";

	// Finalize the entity
	try {
		manager.finalizeEntity(entityId, data);
	} catch (error) {
		throw new Error(
			`Failed to finalize entity: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Format response
	let response = "✓ Entity Finalized!\n";
	response += `${"=".repeat(70)}\n\n`;
	response += `Draft ID: ${draftId}\n`;
	response += `Entity ID: ${entityId || "main"}\n\n`;

	// If main entity, save it as a spec
	if (isMainEntity) {
		// Get the finalized entity
		const finalizedEntity = manager.build();
		const type = manager.getType();

		// Get next number from centralized counter
		const nextNumber = await specManager.getNextNumber(type);

		// Save to spec system
		let created: { number: number; slug: string; name: string };
		try {
			switch (type) {
				case "plan":
					created = await specManager.plans.create(
						finalizedEntity as Plan,
						nextNumber,
					);
					break;
				case "component":
					created = await specManager.components.create(
						finalizedEntity as Component,
						nextNumber,
					);
					break;
				case "decision":
					created = await specManager.decisions.create(
						finalizedEntity as Decision,
						nextNumber,
					);
					break;
				case "business-requirement":
					created = await specManager.business_requirements.create(
						finalizedEntity as BusinessRequirement,
						nextNumber,
					);
					break;
				case "technical-requirement":
					created = await specManager.tech_requirements.create(
						finalizedEntity as TechnicalRequirement,
						nextNumber,
					);
					break;
				case "constitution":
					created = await specManager.constitutions.create(
						finalizedEntity as Constitution,
						nextNumber,
					);
					break;
				default:
					throw new Error(`Unknown entity type: ${type}`);
			}
		} catch (error) {
			throw new Error(
				`Failed to save spec: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// Clean up draft
		draftStore.delete(draftId);

		// Format spec ID
		const idPrefix = getIdPrefix(type);
		const specId = `${idPrefix}-${String(created.number).padStart(3, "0")}-${created.slug}`;

		response += "🎉 Spec Created Successfully!\n\n";
		response += `Type: ${type}\n`;
		response += `ID: ${specId}\n`;
		response += `Name: ${created.name}\n`;
		response += `Slug: ${created.slug}\n\n`;
		response +=
			"The draft has been converted to a spec and saved to the filesystem.\n";
		response += `Draft '${draftId}' has been removed from the store.\n`;
	} else {
		// Array item finalized, check what's next
		const continueCtx = manager.getContinueInstructions();

		if (continueCtx.stage === "finalization") {
			const nextAction = continueCtx.nextAction as {
				entityId: string;
			};
			response += "Next: Finalize more entities\n";
			response += `${"-".repeat(70)}\n`;
			response += `Entity ID: ${nextAction.entityId}\n`;
			response += `Use continue_draft to get finalization instructions.\n`;
		} else if (continueCtx.stage === "complete") {
			response += "✓ All entities finalized!\n\n";
			response += "The draft is ready to be finalized as the main spec.\n";
			response += "Use continue_draft to get final instructions.\n";
		}
	}

	return response;
}

/**
 * Get ID prefix for entity type
 */
function getIdPrefix(type: string): string {
	const prefixMap: Record<string, string> = {
		"business-requirement": "brd",
		"technical-requirement": "prd",
		plan: "pln",
		component: "cmp",
		constitution: "con",
		decision: "dec",
	};
	return prefixMap[type] || "unk";
}
