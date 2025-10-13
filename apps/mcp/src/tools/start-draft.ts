import type { DraftStore, SpecManager } from "@spec-mcp/core";
import { EntityTypeSchema } from "@spec-mcp/schemas";
import { formatEntityId } from "@spec-mcp/utils";
import { z } from "zod";

/**
 * Schema for start_draft tool arguments
 */
export const StartDraftArgsSchema = z.object({
	type: EntityTypeSchema.describe("Type of spec to create"),
});

export type StartDraftArgs = z.infer<typeof StartDraftArgsSchema>;

/**
 * Start a new draft creation workflow
 */
export async function startDraft(
	args: StartDraftArgs,
	draftStore: DraftStore,
	specManager: SpecManager,
): Promise<string> {
	const { type } = args;

	// Get the next available number for this entity type
	const number = await specManager.getNextNumber(
		type as
			| "plan"
			| "component"
			| "decision"
			| "business-requirement"
			| "technical-requirement"
			| "constitution"
			| "milestone",
	);

	// Create unified draft ID using type+number format (no slug, no "-draft-")
	const draftId = formatEntityId({
		type: type as
			| "plan"
			| "component"
			| "decision"
			| "business-requirement"
			| "technical-requirement"
			| "constitution"
			| "milestone",
		number,
	});

	// Check if a draft already exists for this ID
	if (draftStore.has(draftId)) {
		throw new Error(
			`Draft '${draftId}' already exists. Please continue with the existing draft or delete it first.`,
		);
	}

	// Create new draft manager (no slug needed yet)
	const manager = draftStore.create(
		draftId,
		type as
			| "plan"
			| "component"
			| "decision"
			| "business-requirement"
			| "technical-requirement"
			| "constitution"
			| "milestone",
	);

	// Set the number we already allocated
	manager.setNumber(number);

	// Auto-save initial draft state
	try {
		await draftStore.save(draftId);
	} catch (error) {
		// Log but don't fail - saving is best-effort
		console.error(`Warning: Failed to save new draft ${draftId}:`, error);
	}

	// Get continuation context for the first question
	const continueCtx = manager.getContinueInstructions();

	if (continueCtx.stage !== "questions") {
		throw new Error("Failed to start draft: no initial question");
	}

	const nextAction = continueCtx.nextAction as {
		questionId: string;
		question: string;
	};
	const { questionId, question } = nextAction;

	// Check if the first question is optional
	const drafter = manager.getDrafter();
	const questionResult = drafter.findQuestionById(questionId);
	const isOptional = questionResult?.question.optional === true;

	// Format response
	let response = "✓ Draft Created\n";
	response += `${"=".repeat(70)}\n\n`;
	response += `Draft ID: ${draftId}\n`;
	response += `Type: ${type}\n`;
	response += `Stage: Questions\n\n`;

	response += "First Question:\n";
	response += `${"-".repeat(70)}\n`;
	response += `ID: ${questionId}\n`;
	response += `Question: ${question}\n`;
	if (isOptional) {
		response += `Type: Optional\n`;
	}
	response += "\n";

	response += "Next Action:\n";
	response += `${"-".repeat(70)}\n`;
	response += `Use answer_question with:\n`;
	response += `  draftId: "${draftId}"\n`;
	response += `  questionId: "${questionId}"\n`;
	response += `  answer: <your_answer>\n`;

	if (isOptional) {
		response +=
			"\n⚠️  OPTIONAL QUESTION: This question can be skipped using skip_answer.\n";
		response +=
			"However, ONLY skip if you are absolutely certain the information is not needed.\n";
		response += "When in doubt, ask the user for input rather than skipping.\n";
	}

	return response;
}
