import type { DraftStore } from "@spec-mcp/core";
import { z } from "zod";

/**
 * Schema for delete_draft tool arguments
 */
export const DeleteDraftArgsSchema = z.object({
	draftId: z.string().describe("The draft ID to delete"),
});

export type DeleteDraftArgs = z.infer<typeof DeleteDraftArgsSchema>;

/**
 * Delete a draft session
 */
export async function deleteDraft(
	args: DeleteDraftArgs,
	draftStore: DraftStore,
): Promise<string> {
	const { draftId } = args;

	// Check if draft exists
	if (!draftStore.has(draftId)) {
		throw new Error(
			`Draft '${draftId}' not found. Use list_drafts to see all active drafts.`,
		);
	}

	// Delete the draft from memory and disk
	const deleted = await draftStore.deleteWithFile(draftId);

	if (!deleted) {
		throw new Error(`Failed to delete draft '${draftId}'.`);
	}

	// Format response
	let response = "✓ Draft Deleted\n";
	response += `${"=".repeat(70)}\n\n`;
	response += `Draft ID: ${draftId}\n`;
	response += `Status: Successfully deleted\n\n`;
	response += "The draft has been removed from active sessions.\n";
	response += "Use list_drafts to see remaining active drafts.\n";

	return response;
}
