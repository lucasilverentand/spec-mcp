import type { DraftStore, SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Component,
	Constitution,
	Decision,
	Milestone,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { formatEntityId, generateSlug } from "@spec-mcp/utils";
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
		.record(z.string(), z.any())
		.describe(
			"JSON object for the entity/item. For main entity: provide ONLY non-array fields (array fields auto-merged from finalized items). For array items: provide complete item data.",
		),
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

	// For main entity, prepare the data with slug and number
	if (isMainEntity) {
		// Generate slug from name if not provided
		if (data.name && !data.slug) {
			data.slug = generateSlug(data.name as string);
		}

		// Get number from manager if already assigned, otherwise get next number
		if (!data.number) {
			let nextNumber = manager.getNumber();
			if (nextNumber === undefined) {
				const type = manager.getType();
				nextNumber = await specManager.getNextNumber(type);
				manager.setNumber(nextNumber);
			}
			data.number = nextNumber;
		}
	}

	// Finalize the entity
	try {
		manager.finalizeEntity(entityId, data);
	} catch (error) {
		throw new Error(
			`Failed to finalize entity: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Auto-save the draft state to disk (for array items)
	// For main entity, we'll save as spec and clean up
	if (!isMainEntity) {
		try {
			await draftStore.save(draftId);
		} catch (error) {
			// Log but don't fail - saving is best-effort
			console.error(`Warning: Failed to save draft ${draftId}:`, error);
		}
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

		// Number is already set in the finalized entity
		const nextNumber = manager.getNumber();
		if (nextNumber === undefined) {
			throw new Error("Number should have been set during finalization");
		}

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
				case "milestone":
					created = await specManager.milestones.create(
						finalizedEntity as Milestone,
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

		// Clean up draft from memory and disk
		await draftStore.deleteWithFile(draftId);

		// Format spec ID
		const specId = formatEntityId({
			type,
			number: created.number,
			slug: created.slug,
		});

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

		if (continueCtx.stage === "questions") {
			// More questions to answer
			const nextAction = continueCtx.nextAction as {
				questionId: string;
				question: string;
				context?: string;
			};
			response += "Next Question:\n";
			response += `${"-".repeat(70)}\n`;
			response += `ID: ${nextAction.questionId}\n`;
			response += `Question: ${nextAction.question}\n`;
			if (nextAction.context) {
				response += `Context: ${nextAction.context}\n`;
			}
			response += `\nNext Action:\n`;
			response += `${"-".repeat(70)}\n`;
			response += `Use answer_question with:\n`;
			response += `  draftId: "${draftId}"\n`;
			response += `  questionId: "${nextAction.questionId}"\n`;
			response += `  answer: <your_answer>\n`;
		} else if (continueCtx.stage === "finalization") {
			const nextAction = continueCtx.nextAction as {
				entityId: string;
				context: {
					description: string;
					questionsAndAnswers: Array<{ question: string; answer: string }>;
					schema: unknown;
				};
			};
			response += "✓ All questions answered for this entity!\n\n";
			response += "Next: Finalization Required\n";
			response += `${"=".repeat(70)}\n`;
			response += `Entity ID: ${nextAction.entityId}\n\n`;
			response += `Description: ${nextAction.context.description}\n\n`;
			response += "Questions & Answers Summary:\n";
			response += `${"-".repeat(70)}\n`;
			// Handle both array and non-array questionsAndAnswers
			const questionsAndAnswers = nextAction.context.questionsAndAnswers || [];
			questionsAndAnswers.forEach((qa, index) => {
				response += `${index + 1}. ${qa.question}\n`;
				response += `   Answer: ${qa.answer}\n\n`;
			});
			response +=
				"⚠️  IMPORTANT: You must finalize this entity before proceeding.\n\n";
			response += "JSON Schema:\n";
			response += `${"-".repeat(70)}\n`;
			response += `${JSON.stringify(nextAction.context.schema, null, 2)}\n\n`;
			response += "Next Action:\n";
			response += `${"-".repeat(70)}\n`;
			response += `Use finalize_entity with:\n`;
			response += `  draftId: "${draftId}"\n`;
			response += `  entityId: "${nextAction.entityId}"\n`;
			response += `  data: <generated_json_object>\n\n`;
			response +=
				"Generate the JSON object using the Q&A summary above and the JSON Schema provided.\n";
		} else if (continueCtx.stage === "complete") {
			// This should not happen - complete stage means fully done, not needing finalization
			// But we'll handle it gracefully
			response += "✓ Draft Complete!\n\n";
			response +=
				"This draft is fully finalized and ready to be saved as a spec.\n";
		}
	}

	return response;
}
