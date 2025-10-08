/**
 * Result of creating a new draft
 */
export interface CreateDraftResult {
	draftId: string;
	firstQuestion: string;
	totalQuestions: number;
}

/**
 * Result of submitting an answer
 */
export type SubmitAnswerResult =
	| {
			draftId: string;
			completed: true;
			totalQuestions: number;
	  }
	| {
			draftId: string;
			completed: false;
			nextQuestion: string;
			currentQuestionIndex: number;
			totalQuestions: number;
	  };
