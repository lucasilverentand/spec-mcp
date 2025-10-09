/**
 * Question types for the draft workflow
 */
export type QuestionType = "text" | "number" | "enum" | "boolean";

/**
 * A single question in the draft workflow
 */
export interface Question {
	field: string;
	prompt: string;
	type: QuestionType;
	required: boolean;
	options?: string[];
	default?: unknown;
	validation?: (value: unknown) => boolean;
	exampleFormat?: string;
}

/**
 * Question for array planning stage
 */
export interface ArrayPlanQuestion {
	field: string;
	prompt: string;
	itemType: string;
	exampleFormat: string;
}

/**
 * Workflow stages
 */
export type DraftStage =
	| "top-level"
	| "array-planning"
	| "item-creation"
	| "complete";

/**
 * Current workflow state response
 */
export interface DraftStatus {
	stage: DraftStage;
	currentQuestion: Question | null;
	progress: {
		current: number;
		total: number;
	};
	partialDraft: unknown;
}

/**
 * Item in the creation queue for Stage 3
 */
export interface QueueItem {
	arrayField: string;
	itemType: string;
	description: string;
	index: number;
}
