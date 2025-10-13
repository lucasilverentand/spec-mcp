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

	// Check if we're in finalization stage - block if item needs finalization
	const continueCtxBefore = manager.getContinueInstructions();
	if (continueCtxBefore.stage === "finalization") {
		const nextAction = continueCtxBefore.nextAction as {
			entityId: string;
		};
		throw new Error(
			`Cannot answer questions: An entity needs to be finalized first.\n\n` +
				`Entity ID: ${nextAction.entityId}\n` +
				`Please use finalize_entity with entityId="${nextAction.entityId}" first, or use continue_draft to get finalization instructions.`,
		);
	}

	// Answer the question
	try {
		manager.answerQuestionById(questionId, answer);

		// Clear skipped flag if it was previously skipped
		const drafter = manager.getDrafter();
		const questionResult = drafter.findQuestionById(questionId);
		if (questionResult?.question.skipped) {
			questionResult.question.skipped = false;
		}
	} catch (error) {
		throw new Error(
			`Failed to answer question: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Auto-save the draft state to disk
	try {
		await draftStore.save(draftId);
	} catch (error) {
		// Log but don't fail - saving is best-effort
		console.error(`Warning: Failed to save draft ${draftId}:`, error);
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
			context?: {
				type: string;
			};
		};

		// Check if the question is optional
		const drafter = manager.getDrafter();
		const questionResult = drafter.findQuestionById(nextAction.questionId);
		const isOptional = questionResult?.question.optional === true;

		response += "Next Question:\n";
		response += `${"-".repeat(70)}\n`;
		response += `ID: ${nextAction.questionId}\n`;
		response += `Question: ${nextAction.question}\n`;
		if (isOptional) {
			response += `Type: Optional\n`;
		}
		response += "\n";
		response += "Use answer_question to answer this question.\n";
		if (isOptional) {
			response +=
				"\n⚠️  OPTIONAL QUESTION: This question can be skipped using skip_answer.\n";
			response +=
				"However, ONLY skip if you are absolutely certain the information is not needed.\n";
			response +=
				"When in doubt, ask the user for input rather than skipping.\n";
		}
	} else if (continueCtx.stage === "finalization") {
		const nextAction = continueCtx.nextAction as {
			entityId: string;
			action: string;
			context?: {
				description?: string;
				questionsAndAnswers?: Array<{
					id: string;
					question: string;
					answer: string;
				}>;
				schema?: unknown;
			};
		};
		response += "✓ All questions answered for this entity!\n\n";
		response += "Next: Finalization Required\n";
		response += `${"=".repeat(70)}\n`;
		response += `Entity ID: ${nextAction.entityId}\n\n`;

		// Show the questions and answers summary for this entity
		if (nextAction.context?.questionsAndAnswers) {
			const qa = nextAction.context.questionsAndAnswers;
			if (nextAction.context.description) {
				response += `Description: ${nextAction.context.description}\n\n`;
			}
			response += "Questions & Answers Summary:\n";
			response += `${"-".repeat(70)}\n`;
			for (let i = 0; i < qa.length; i++) {
				const item = qa[i];
				if (item) {
					response += `${i + 1}. ${item.question}\n`;
					response += `   Answer: ${item.answer}\n\n`;
				}
			}
		}

		response +=
			"⚠️  IMPORTANT: You must finalize this entity before proceeding.\n\n";

		// Include the schema if available
		if (nextAction.context?.schema) {
			response += "JSON Schema:\n";
			response += `${"-".repeat(70)}\n`;
			response += `${JSON.stringify(nextAction.context.schema, null, 2)}\n\n`;
		}

		response += "Next Action:\n";
		response += `${"-".repeat(70)}\n`;
		response += `Use finalize_entity with:\n`;
		response += `  draftId: "${draftId}"\n`;
		response += `  entityId: "${nextAction.entityId}"\n`;
		response += `  data: <generated_json_object>\n\n`;
		response += `Generate the JSON object using the Q&A summary above`;
		if (nextAction.context?.schema) {
			response += ` and the JSON Schema provided.\n`;
		} else {
			response += `.\n`;
			response += `For the complete schema, use: continue_draft with draftId: "${draftId}"\n`;
		}
	} else {
		response += "✓ Draft complete!\n\n";
		response += "The draft has been finalized and saved as a spec.\n";
	}

	return response;
}
