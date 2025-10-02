/**
 * Wizard system types for step-by-step spec creation
 */

export interface ValidationRule {
	type:
		| "required"
		| "min_length"
		| "max_length"
		| "contains_rationale"
		| "no_implementation"
		| "measurable"
		| "specific_language";
	field?: string;
	value?: number;
	keywords?: string[];
	message?: string;
}

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
	validation_rules: ValidationRule[];
	next_step: string | null;
}

export interface Draft {
	id: string;
	type: "requirement" | "component" | "plan";
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
}
