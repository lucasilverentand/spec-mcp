import type { DraftStore } from "@spec-mcp/core";
import { z } from "zod";

/**
 * Schema for answer_question tool arguments
 */
export const AnswerQuestionArgsSchema = z.object({
	draftId: z.string().describe("The draft session ID"),
	questionId: z.string().describe("The unique question ID to answer"),
	answer: z
		.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
		.describe(
			"Answer to the question. Can be string, number, boolean, or array of strings.",
		),
});

export type AnswerQuestionArgs = z.infer<typeof AnswerQuestionArgsSchema>;

/**
 * Answer a question in the draft workflow (unified for all question types)
 */
export async function answerQuestion(
	args: AnswerQuestionArgs,
	draftStore: DraftStore,
): Promise<string> {
	const { draftId, questionId, answer } = args;

	// Get the draft
	const manager = draftStore.get(draftId);
	if (!manager) {
		throw new Error(
			`Draft '${draftId}' not found. Use start_draft to create a new draft or list_drafts to see available drafts.`,
		);
	}

	// Answer the question
	try {
		manager.answerQuestionById(questionId, answer);
	} catch (error) {
		throw new Error(
			`Failed to answer question: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Get the next action
	const continueCtx = manager.getContinueInstructions();

	// Format response
	let response = "✓ Answer recorded\n";
	response += `${"=".repeat(70)}\n\n`;
	response += `Draft ID: ${draftId}\n`;
	response += `Question ID: ${questionId}\n`;
	response += `Answer: ${Array.isArray(answer) ? answer.join(", ") : String(answer)}\n\n`;

	// Show what's next
	if (continueCtx.stage === "questions") {
		const nextAction = continueCtx.nextAction as {
			questionId: string;
			question: string;
		};
		response += "Next Question:\n";
		response += `${"-".repeat(70)}\n`;
		response += `ID: ${nextAction.questionId}\n`;
		response += `Question: ${nextAction.question}\n\n`;
		response += "Use answer_question to answer this question.\n";
	} else if (continueCtx.stage === "finalization") {
		const nextAction = continueCtx.nextAction as {
			entityId: string;
		};
		response += "✓ All questions answered!\n\n";
		response += "Next: Finalization\n";
		response += `${"-".repeat(70)}\n`;
		response += `Entity ID: ${nextAction.entityId}\n`;
		response += `Use continue_draft to get finalization instructions.\n`;
	} else {
		response += "✓ Draft complete!\n\n";
		response += "The draft has been finalized and saved as a spec.\n";
	}

	return response;
}
