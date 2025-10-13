import type { DraftStore } from "@spec-mcp/core";
import { z } from "zod";

/**
 * Schema for skip_answer tool arguments
 */
export const SkipAnswerArgsSchema = z.object({
	draftId: z.string().describe("The draft session ID"),
	questionId: z.string().describe("The unique question ID to skip"),
});

export type SkipAnswerArgs = z.infer<typeof SkipAnswerArgsSchema>;

/**
 * Skip an optional question in the draft workflow
 */
export async function skipAnswer(
	args: SkipAnswerArgs,
	draftStore: DraftStore,
): Promise<string> {
	const { draftId, questionId } = args;

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
			`Cannot skip questions: An entity needs to be finalized first.\n\n` +
				`Entity ID: ${nextAction.entityId}\n` +
				`Please use finalize_entity with entityId="${nextAction.entityId}" first, or use continue_draft to get finalization instructions.`,
		);
	}

	// Find the question
	const drafter = manager.getDrafter();
	const questionResult = drafter.findQuestionById(questionId);
	if (!questionResult) {
		throw new Error(
			`Question with ID '${questionId}' not found in draft '${draftId}'`,
		);
	}

	const { question } = questionResult;

	// Check if the question is optional
	if (question.optional !== true) {
		throw new Error(
			`Cannot skip question '${questionId}': This question is required and must be answered.\n\n` +
				`Question: ${question.question}\n\n` +
				`Use answer_question to provide an answer.`,
		);
	}

	// Skip the question by setting skipped flag
	try {
		question.skipped = true;
	} catch (error) {
		throw new Error(
			`Failed to skip question: ${error instanceof Error ? error.message : String(error)}`,
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
	let response = "✓ Question skipped\n";
	response += `${"=".repeat(70)}\n\n`;
	response += `Draft ID: ${draftId}\n`;
	response += `Question ID: ${questionId}\n`;
	response += `Question: ${question.question}\n`;
	response += `Status: Skipped (optional)\n\n`;

	// Show what's next
	if (continueCtx.stage === "questions") {
		const nextAction = continueCtx.nextAction as {
			questionId: string;
			question: string;
		};

		// Check if the next question is optional
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
					response += `   Answer: ${item.answer || "[Skipped - Optional]"}\n\n`;
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
