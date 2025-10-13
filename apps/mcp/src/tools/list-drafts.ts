import type { DraftStore } from "@spec-mcp/core";
import { z } from "zod";

/**
 * Schema for list_drafts tool arguments
 */
export const ListDraftsArgsSchema = z.object({});

export type ListDraftsArgs = z.infer<typeof ListDraftsArgsSchema>;

/**
 * List all active draft sessions
 */
export async function listDrafts(
	_args: ListDraftsArgs,
	draftStore: DraftStore,
): Promise<string> {
	const drafts = draftStore.list();

	if (drafts.length === 0) {
		return "No active drafts found.\n\nUse start_draft to create a new draft.";
	}

	let response = "Active Drafts\n";
	response += `${"=".repeat(70)}\n\n`;
	response += `Total: ${drafts.length}\n\n`;

	for (const draft of drafts) {
		response += `Draft ID: ${draft.draftId}\n`;
		response += `Type: ${draft.type}\n`;
		response += `Stage: ${draft.stage}\n`;
		response += `Progress: ${draft.progress.answered}/${draft.progress.total} questions answered\n`;

		// Add helpful next step
		if (draft.stage === "questions") {
			response += `Next: Use continue_draft to see the next question\n`;
		} else if (draft.stage === "finalization") {
			response += `Next: Use continue_draft to get finalization instructions\n`;
		} else {
			response += `Status: Complete and ready to save\n`;
		}

		response += "\n";
	}

	response += `Use continue_draft with a draft ID to continue working on a draft.\n`;

	return response;
}
