import type { DraftStore } from "@spec-mcp/core";
import { EntityTypeSchema } from "@spec-mcp/schemas";
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
	draftId: string,
): Promise<string> {
	const { type } = args;

	// Check if a draft already exists for this ID
	if (draftStore.has(draftId)) {
		throw new Error(
			`Draft '${draftId}' already exists. Use continue_draft to resume or list_drafts to see all drafts.`,
		);
	}

	// Create new draft manager
	const manager = draftStore.create(draftId, type);

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

	// Format response
	let response = "✓ Draft Created\n";
	response += `${"=".repeat(70)}\n\n`;
	response += `Draft ID: ${draftId}\n`;
	response += `Type: ${type}\n`;
	response += `Stage: Questions\n\n`;

	response += "First Question:\n";
	response += `${"-".repeat(70)}\n`;
	response += `ID: ${questionId}\n`;
	response += `Question: ${question}\n\n`;

	response += "Next Action:\n";
	response += `${"-".repeat(70)}\n`;
	response += `Use answer_question with:\n`;
	response += `  draftId: "${draftId}"\n`;
	response += `  questionId: "${questionId}"\n`;
	response += `  answer: <your_answer>\n`;

	return response;
}
