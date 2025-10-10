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
 * Type for array item finalization context
 */
interface ArrayItemContext {
	description: string;
	questionsAndAnswers: Array<{ question: string; answer: unknown }>;
	schema: unknown;
	nextStep: { instruction: string };
}

/**
 * Type for main entity finalization context
 */
interface MainEntityContext {
	mainQuestions: Array<{ question: string; answer: unknown }>;
	arrayFieldsStatus: Record<string, { finalized: boolean; itemCount: number }>;
	prefilledData: unknown;
	schema: unknown;
	nextStep: { instruction: string };
}

/**
 * Type guard to check if context is ArrayItemContext
 */
function isArrayItemContext(context: unknown): context is ArrayItemContext {
	return (
		typeof context === "object" &&
		context !== null &&
		"description" in context &&
		"questionsAndAnswers" in context
	);
}

/**
 * Type guard to check if context is MainEntityContext
 */
function isMainEntityContext(context: unknown): context is MainEntityContext {
	return (
		typeof context === "object" &&
		context !== null &&
		"mainQuestions" in context &&
		"arrayFieldsStatus" in context
	);
}

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

		// Check if the question is optional
		const drafter = manager.getDrafter();
		const questionResult = drafter.findQuestionById(questionId);
		const isOptional = questionResult?.question.optional === true;

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

		if (isOptional) {
			response += `Type: Optional\n`;
		}

		response += `\n`;
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
			response +=
				"When in doubt, ask the user for input rather than skipping.\n";
		}
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
			if (isArrayItemContext(context)) {
				response += `Description: ${context.description}\n\n`;

				response += "Questions & Answers:\n";
				for (const qa of context.questionsAndAnswers) {
					response += `  Q: ${qa.question}\n`;
					response += `  A: ${qa.answer}\n\n`;
				}

				response += "\nJSON Schema:\n";
				response += `${"-".repeat(70)}\n`;
				response += JSON.stringify(context.schema, null, 2);
				response += "\n\n";

				response += context.nextStep.instruction;
			}
			// For main entity
			else if (isMainEntityContext(context)) {
				response += "Main Questions & Answers:\n";
				for (const q of context.mainQuestions) {
					response += `  Q: ${q.question}\n`;
					response += `  A: ${q.answer}\n\n`;
				}

				response += "\nArray Fields Status:\n";
				for (const [field, status] of Object.entries(
					context.arrayFieldsStatus,
				)) {
					const icon = status.finalized ? "✓" : "✗";
					response += `  ${icon} ${field}: ${status.itemCount} items finalized\n`;
				}

				response += "\n\nPrefilled Array Data:\n";
				response += `${"-".repeat(70)}\n`;
				response += JSON.stringify(context.prefilledData, null, 2);
				response += "\n\n";

				response += "JSON Schema:\n";
				response += `${"-".repeat(70)}\n`;
				response += JSON.stringify(context.schema, null, 2);
				response += "\n\n";

				response += context.nextStep.instruction;
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
