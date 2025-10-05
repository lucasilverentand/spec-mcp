/**
 * CreationFlow system types for step-by-step spec creation
 */

export interface CreationFlowValidationResult {
	step: string;
	passed: boolean;
	issues: string[];
	suggestions: string[];
	strengths: string[];
}

export interface StepDefinition {
	id: string;
	order: number;
	name: string;
	description: string;
	question: string; // Q&A format: What question to ask the user
	guidance: string; // Additional guidance on how to answer
	next_step: string | null;
	tool_hints?: {
		query_examples?: string[];
		context7_examples?: string[];
		webfetch_examples?: string[];
	};
}

export interface Draft {
	id: string;
	type: "requirement" | "component" | "plan" | "constitution" | "decision";
	current_step: number;
	total_steps: number;
	data: Record<string, unknown>;
	validation_results: CreationFlowValidationResult[];
	created_at: string;
	updated_at: string;
	expires_at: string;
}

export interface StepResponse {
	draft_id: string;
	step: number;
	total_steps: number;
	current_step_name: string;
	question: string; // The question to ask the user
	guidance: string; // How to answer the question
	prompt?: string; // Alias for question for backward compatibility
	field_hints?: Record<string, string>; // Field-specific hints
	examples?: Record<string, string>; // Example values for fields
	validation?: CreationFlowValidationResult;
	next_step?: string;
	completed?: boolean;
	progress_summary?: string; // Summary of what's been completed
	// For final step: schema finalization instructions
	finalization_instructions?: string;
	schema_fields?: Record<string, unknown>;
}
