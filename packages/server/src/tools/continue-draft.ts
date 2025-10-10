import type { DraftStore } from "@spec-mcp/core";
import { z } from "zod";

/**
 * Schema for continue_draft tool arguments
 */
export const ContinueDraftArgsSchema = z.object({
	draftId: z.string().describe("The draft session ID"),
});

export type ContinueDraftArgs = z.infer<typeof ContinueDraftArgsSchema>;

/**
 * Get continuation instructions for a draft.
 * Intelligently determines what to do next: answer questions or finalize entities.
 */
export async function continueDraft(
	args: ContinueDraftArgs,
	draftStore: DraftStore,
): Promise<string> {
	const { draftId } = args;

	// Get the draft
	const manager = draftStore.get(draftId);
	if (!manager) {
		throw new Error(
			`Draft '${draftId}' not found. Use start_draft to create a new draft or list_drafts to see available drafts.`,
		);
	}

	// Get continuation context
	const continueCtx = manager.getContinueInstructions();

	// Format response based on stage
	let response = "";

	if (continueCtx.stage === "questions") {
		// Q&A stage - show next question
		const nextAction = continueCtx.nextAction as {
			questionId: string;
			question: string;
			context: { type: string; fieldName?: string; itemIndex?: number };
		};
		const { questionId, question, context } = nextAction;

		response += "Continue Draft - Question Phase\n";
		response += `${"=".repeat(70)}\n\n`;
		response += `Draft ID: ${draftId}\n`;
		response += `Type: ${manager.getType()}\n`;
		response += `Stage: Questions\n\n`;

		response += "Next Question:\n";
		response += `${"-".repeat(70)}\n`;
		response += `ID: ${questionId}\n`;
		response += `Question: ${question}\n`;

		// Add context information
		if (context.type === "main") {
			response += `Context: Main entity question\n`;
		} else if (context.type === "collection") {
			response += `Context: Collection question for field '${context.fieldName}'\n`;
			response += `Hint: Provide comma-separated values\n`;
		} else if (context.type === "item") {
			response += `Context: Item question for field '${context.fieldName}', item #${context.itemIndex}\n`;
		}

		response += `\n`;
		response += "Next Action:\n";
		response += `${"-".repeat(70)}\n`;
		response += `Use answer_question with:\n`;
		response += `  draftId: "${draftId}"\n`;
		response += `  questionId: "${questionId}"\n`;
		response += `  answer: <your_answer>\n`;
	} else if (continueCtx.stage === "finalization") {
		// Finalization stage - show context for next entity
		const nextAction = continueCtx.nextAction as {
			entityId: string;
			context: unknown;
		};
		const { entityId, context } = nextAction;

		response += "Continue Draft - Finalization Phase\n";
		response += `${"=".repeat(70)}\n\n`;
		response += `Draft ID: ${draftId}\n`;
		response += `Type: ${manager.getType()}\n`;
		response += `Stage: Finalization\n\n`;

		response += `Entity to Finalize: ${entityId}\n`;
		response += `${"-".repeat(70)}\n\n`;

		// Include the full context (Q&A, schema, instructions)
		if (context) {
			// For array items
			if ((context as any).description) {
				response += `Description: ${(context as any).description}\n\n`;

				response += "Questions & Answers:\n";
				for (const qa of (context as any).questionsAndAnswers) {
					response += `  Q: ${qa.question}\n`;
					response += `  A: ${qa.answer}\n\n`;
				}

				response += "\nJSON Schema:\n";
				response += `${"-".repeat(70)}\n`;
				response += JSON.stringify((context as any).schema, null, 2);
				response += "\n\n";

				response += (context as any).nextStep.instruction;
			}
			// For main entity
			else if ((context as any).mainQuestions) {
				response += "Main Questions & Answers:\n";
				for (const q of (context as any).mainQuestions) {
					response += `  Q: ${q.question}\n`;
					response += `  A: ${q.answer}\n\n`;
				}

				response += "\nArray Fields Status:\n";
				for (const [field, status] of Object.entries(
					(context as any).arrayFieldsStatus,
				)) {
					const icon = (status as any).finalized ? "✓" : "✗";
					response += `  ${icon} ${field}: ${(status as any).itemCount} items finalized\n`;
				}

				response += "\n\nPrefilled Array Data:\n";
				response += `${"-".repeat(70)}\n`;
				response += JSON.stringify((context as any).prefilledData, null, 2);
				response += "\n\n";

				response += "JSON Schema:\n";
				response += `${"-".repeat(70)}\n`;
				response += JSON.stringify((context as any).schema, null, 2);
				response += "\n\n";

				response += (context as any).nextStep.instruction;
			}
		}

		response += `\n\nNext Action:\n`;
		response += `${"-".repeat(70)}\n`;
		response += `Use finalize_entity with:\n`;
		response += `  draftId: "${draftId}"\n`;
		response += `  entityId: "${entityId}"\n`;
		response += `  data: <your_generated_json_object>\n`;
	} else {
		// Complete stage
		const nextAction = continueCtx.nextAction as {
			message: string;
		};
		response += "Draft Complete!\n";
		response += `${"=".repeat(70)}\n\n`;
		response += `Draft ID: ${draftId}\n`;
		response += `Type: ${manager.getType()}\n`;
		response += `Stage: Complete\n\n`;
		response += nextAction.message;
		response += "\n\n";
		response += "The draft has been finalized and saved as a spec.\n";
		response += "No further action needed.\n";
	}

	return response;
}
