/**
 * CreationFlow system types for step-by-step spec creation
 */

export interface ValidationResult {
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
	prompt: string;
	required_fields: string[];
	next_step: string | null;
}

export interface Draft {
	id: string;
	type: "requirement" | "component" | "plan" | "constitution" | "decision";
	current_step: number;
	total_steps: number;
	data: Record<string, unknown>;
	validation_results: ValidationResult[];
	created_at: string;
	updated_at: string;
	expires_at: string;
}

export interface StepResponse {
	draft_id: string;
	step: number;
	total_steps: number;
	current_step_name: string;
	prompt: string;
	validation?: ValidationResult;
	next_step?: string;
	completed?: boolean;
	// Enhanced feedback
	field_hints?: Record<string, string>; // Field-specific helpful hints
	examples?: Record<string, unknown>; // Example values for current step
	progress_summary?: string; // Summary of what's been completed
}
