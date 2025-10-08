import {
	ComponentDraftManager,
	ConstitutionDraftManager,
	DecisionDraftManager,
	FileManager,
	PlanDraftManager,
	RequirementDraftManager,
} from "@spec-mcp/core";
import { logger } from "../utils/logger.js";

/**
 * Submit an answer to the current question in a draft
 */
export async function submitDraftAnswerTool(
	draft_id: string,
	answer: string,
	specsPath = "./specs",
): Promise<{
	success: boolean;
	draft_id?: string;
	completed?: boolean;
	next_question?: string;
	current_question_index?: number;
	total_questions?: number;
	guidance?: string;
	error?: string;
}> {
	try {
		logger.info({ draft_id, answerLength: answer.length }, "Submitting answer");

		// Validate inputs
		if (!draft_id || !draft_id.match(/^draft-\d{3}$/)) {
			return {
				success: false,
				error: "Invalid draft_id format. Expected: draft-XXX",
			};
		}

		if (!answer || answer.trim().length === 0) {
			return {
				success: false,
				error: "Answer cannot be empty",
			};
		}

		// Initialize file manager
		const fileManager = new FileManager(specsPath);

		// We need to get the draft first to determine its type
		// Try each manager until we find the draft
		const managers = [
			new RequirementDraftManager(fileManager),
			new ComponentDraftManager(fileManager),
			new PlanDraftManager(fileManager),
			new ConstitutionDraftManager(fileManager),
			new DecisionDraftManager(fileManager),
		];

		let draft = null;
		let draftManager = null;

		for (const manager of managers) {
			const d = await manager.getDraft(draft_id);
			if (d) {
				draft = d;
				draftManager = manager;
				break;
			}
		}

		if (!draft || !draftManager) {
			return {
				success: false,
				error: `Draft not found: ${draft_id}`,
			};
		}

		// Submit the answer
		const result = await draftManager.submitAnswer(draft_id, answer.trim());

		// Build response based on completion status
		if (result.completed) {
			const guidance = `
**All Questions Answered!**

The draft for "${draft.name}" is now complete with all questions answered.

**Next Step:**
Call the appropriate creation tool to finalize and create the ${draft.type}:
- For requirement: \`create_requirement("${draft_id}")\`
- For component: \`create_component("${draft_id}")\`
- For plan: \`create_plan("${draft_id}")\`
- For constitution: \`create_constitution("${draft_id}")\`
- For decision: \`create_decision("${draft_id}")\`

**Important:**
- You MUST provide the draft_id as proof that all questions were answered
- The draft will be deleted after successful creation
- The new ${draft.type} will be saved to the specs folder
`;

			logger.info({ draft_id }, "Draft completed");

			return {
				success: true,
				draft_id: result.draftId,
				completed: true,
				total_questions: result.totalQuestions,
				guidance,
			};
		}

		// More questions to answer
		const questionsRemaining =
			result.totalQuestions - (result.currentQuestionIndex || 0);
		const progress = `Question ${result.currentQuestionIndex! + 1} of ${result.totalQuestions}`;

		const guidance = `
**Answer Recorded**

${progress} (${questionsRemaining} remaining)

**Next Step:**
Answer the following question by calling \`submit_draft_answer\` again with:
- draft_id: "${draft_id}"
- answer: <your answer>
`;

		logger.info({ draft_id, progress }, "Answer submitted, next question");

		return {
			success: true,
			draft_id: result.draftId,
			completed: false,
			next_question: result.nextQuestion,
			current_question_index: result.currentQuestionIndex,
			total_questions: result.totalQuestions,
			guidance,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logger.error({ error, draft_id }, "Failed to submit answer");
		return {
			success: false,
			error: `Failed to submit answer: ${errorMessage}`,
		};
	}
}
