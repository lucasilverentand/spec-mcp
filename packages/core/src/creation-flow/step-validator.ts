import type { ValidationResult } from "./types.js";
import {
	RequirementStepSubmissionSchema,
	ComponentStepSubmissionSchema,
	PlanStepSubmissionSchema,
	ConstitutionStepSubmissionSchema,
	DecisionStepSubmissionSchema,
} from "./step-submission-schemas.js";
import { z } from "zod";

type SpecType = "requirement" | "component" | "plan" | "constitution" | "decision";

/**
 * Validates creation flow step data using Zod schemas
 */
export class StepValidator {
	/**
	 * Validate step data using Zod discriminated unions
	 */
	validate(
		specType: SpecType,
		stepId: string,
		data: Record<string, unknown>,
	): ValidationResult {
		const issues: string[] = [];
		const suggestions: string[] = [];
		const strengths: string[] = [];

		// Add step identifier to data for discrimination
		const submissionData = { step: stepId, ...data };

		try {
			// Select the appropriate schema based on spec type
			const schema = this.getSchemaForType(specType);

			// Validate using Zod
			schema.parse(submissionData);

			// If validation passes, add strengths based on what was validated
			this.addStrengths(stepId, data, strengths);

		} catch (error) {
			if (error instanceof z.ZodError) {
				// Extract issues and suggestions from Zod errors
				for (const issue of error.errors) {
					const message = issue.message;

					issues.push(message);

					// Add contextual suggestions based on error type
					this.addSuggestion(issue, suggestions);
				}
			} else {
				// Unexpected error
				issues.push(`Validation error: ${String(error)}`);
			}
		}

		return {
			step: stepId,
			passed: issues.length === 0,
			issues,
			suggestions,
			strengths,
		};
	}

	/**
	 * Get the appropriate Zod schema for the spec type
	 */
	private getSchemaForType(specType: SpecType): z.ZodTypeAny {
		switch (specType) {
			case "requirement":
				return RequirementStepSubmissionSchema;
			case "component":
				return ComponentStepSubmissionSchema;
			case "plan":
				return PlanStepSubmissionSchema;
			case "constitution":
				return ConstitutionStepSubmissionSchema;
			case "decision":
				return DecisionStepSubmissionSchema;
		}
	}

	/**
	 * Add contextual suggestions based on Zod error
	 */
	private addSuggestion(issue: z.ZodIssue, suggestions: string[]): void {
		const code = issue.code;
		const path = issue.path.join(".");

		if (code === "too_small") {
			const typedIssue = issue as z.ZodIssueOptionalMessage & {
				minimum?: number;
				type?: string;
			};
			if (typedIssue.type === "string") {
				suggestions.push(
					`Provide more detail in ${path || "this field"} (minimum ${typedIssue.minimum} characters)`,
				);
			} else if (typedIssue.type === "array") {
				suggestions.push(
					`Add at least ${typedIssue.minimum} item(s) to ${path || "this field"}`,
				);
			}
		} else if (code === "invalid_string") {
			if (issue.validation === "regex") {
				suggestions.push(
					`Use the correct format for ${path || "this field"}`,
				);
			}
		} else if (code === "custom") {
			// Custom refinement failed - suggestion should be in the message
			// Extract suggestion from message if it contains specific guidance
			const message = issue.message.toLowerCase();
			if (message.includes("rationale")) {
				suggestions.push(
					"Consider adding 'because' or 'so that' to explain why this is needed",
				);
			} else if (message.includes("implementation")) {
				suggestions.push(
					"Focus on WHAT needs to happen, not HOW it should be implemented",
				);
			} else if (message.includes("vague")) {
				suggestions.push(
					"Replace vague terms with specific, quantifiable language (e.g., 'under 200ms' instead of 'fast')",
				);
			} else if (message.includes("measurable")) {
				suggestions.push(
					"Use specific, testable language (e.g., 'displays 10 items', 'completes in under 2 seconds')",
				);
			}
		}
	}

	/**
	 * Add positive feedback based on successful validation
	 */
	private addStrengths(
		stepId: string,
		data: Record<string, unknown>,
		strengths: string[],
	): void {
		// Add strengths based on step completion
		switch (stepId) {
			// REQUIREMENT STEPS
			case "problem_identification":
				if (data.description) {
					strengths.push("Clear problem identification with rationale");
				}
				break;

			case "avoid_implementation":
				if (data.description) {
					strengths.push("Implementation-agnostic description");
				}
				break;

			case "measurability":
				if (data.criteria) {
					strengths.push("Well-defined measurable criteria");
				}
				break;

			case "specific_language":
				strengths.push("Specific, quantifiable language used");
				break;

			case "acceptance_criteria":
				if (data.criteria) {
					strengths.push("Testable and independent acceptance criteria defined");
				}
				break;

			case "priority_assignment":
				if (data.priority) {
					strengths.push(`Clear priority assignment: ${data.priority}`);
				}
				break;

			case "review_and_refine":
				if (data.slug && data.name) {
					strengths.push("All required fields complete and validated");
				}
				break;

			// COMPONENT STEPS
			case "analyze_requirements":
				if (data.description) {
					strengths.push("Clear requirement traceability established");
				}
				break;

			case "define_boundaries":
				if (data.description) {
					strengths.push("Well-defined component boundaries with clear responsibilities");
				}
				break;

			case "define_responsibilities":
				if (data.capabilities && Array.isArray(data.capabilities)) {
					strengths.push(
						`${data.capabilities.length} capabilities clearly defined`,
					);
				}
				break;

			case "define_interfaces":
				if (data.description) {
					strengths.push("Component interfaces and contracts well-specified");
				}
				break;

			case "map_dependencies":
				const internalDeps = Array.isArray(data.depends_on)
					? data.depends_on.length
					: 0;
				const externalDeps = Array.isArray(data.external_dependencies)
					? data.external_dependencies.length
					: 0;
				if (internalDeps > 0 || externalDeps > 0) {
					strengths.push(
						`Dependencies mapped: ${internalDeps} internal, ${externalDeps} external`,
					);
				} else {
					strengths.push("No external dependencies - self-contained component");
				}
				break;

			case "define_ownership":
				if (data.description) {
					strengths.push("Data ownership and state management clearly defined");
				}
				break;

			case "identify_patterns":
				if (data.description) {
					strengths.push("Architectural patterns identified");
				}
				break;

			case "quality_attributes":
				if (data.constraints && Array.isArray(data.constraints)) {
					strengths.push(`${data.constraints.length} quality attributes defined`);
				}
				break;

			case "trace_requirements":
				if (data.description) {
					strengths.push("Full requirement traceability documented");
				}
				break;

			case "validate_refine":
				if (data.slug && data.name && data.capabilities) {
					strengths.push("Component specification complete with full details");
				}
				break;

			// PLAN STEPS
			case "review_context":
				if (data.criteria_id && data.description) {
					strengths.push("Context and criteria linkage clearly established");
				}
				break;

			case "identify_phases":
				if (data.description) {
					strengths.push("Work broken into clear phases");
				}
				break;

			case "analyze_dependencies":
				if (data.depends_on && Array.isArray(data.depends_on)) {
					if (data.depends_on.length > 0) {
						strengths.push(`${data.depends_on.length} plan dependencies identified`);
					} else {
						strengths.push("No blocking dependencies - can start immediately");
					}
				}
				break;

			case "break_down_tasks":
				if (data.tasks && Array.isArray(data.tasks)) {
					strengths.push(
						`${data.tasks.length} tasks defined with clear descriptions`,
					);
				}
				break;

			case "estimate_effort":
				if (data.tasks && Array.isArray(data.tasks)) {
					const estimatedTasks = data.tasks.filter(
						(t: { estimated_days?: number }) =>
							typeof t === "object" && t.estimated_days,
					);
					strengths.push(
						`Effort estimates provided for ${estimatedTasks.length} tasks`,
					);
				}
				break;

			case "define_acceptance":
				if (data.acceptance_criteria) {
					strengths.push("Clear acceptance criteria for plan completion");
				}
				break;

			case "identify_milestones":
				if (data.description) {
					strengths.push("Major milestones defined for stakeholder review");
				}
				break;

			case "plan_testing":
				if (data.description) {
					strengths.push("Comprehensive testing strategy documented");
				}
				break;

			case "plan_risks":
				if (data.description) {
					strengths.push("Risks identified with mitigation strategies");
				}
				break;

			case "create_timeline":
				if (data.description) {
					strengths.push("Timeline and critical path established");
				}
				break;

			case "trace_specs":
				if (data.description) {
					strengths.push("Full spec traceability maintained");
				}
				break;

			// CONSTITUTION STEPS
			case "basic_info":
				if (data.name && data.description) {
					strengths.push("Constitution foundation established");
				}
				break;

			case "articles":
				if (data.articles && Array.isArray(data.articles)) {
					strengths.push(
						`${data.articles.length} principle(s) defined with rationale`,
					);
				}
				break;

			case "finalize":
				if (data.name) {
					strengths.push("Specification ready for creation");
				}
				break;

			// DECISION STEPS
			case "decision_statement":
				if (data.decision) {
					strengths.push("Decision clearly stated");
				}
				break;

			case "context":
				if (data.context) {
					strengths.push("Decision context and motivation documented");
				}
				break;

			case "alternatives_and_consequences":
				if (data.alternatives && data.consequences) {
					strengths.push("Alternatives and consequences thoroughly analyzed");
				}
				break;

			case "relationships":
				const affectedCount =
					(Array.isArray(data.affects_components)
						? data.affects_components.length
						: 0) +
					(Array.isArray(data.affects_requirements)
						? data.affects_requirements.length
						: 0) +
					(Array.isArray(data.affects_plans) ? data.affects_plans.length : 0);
				if (affectedCount > 0) {
					strengths.push(`Impact documented across ${affectedCount} entities`);
				}
				if (
					data.informed_by_articles &&
					Array.isArray(data.informed_by_articles) &&
					data.informed_by_articles.length > 0
				) {
					strengths.push(
						`Aligned with ${data.informed_by_articles.length} guiding principle(s)`,
					);
				}
				break;
		}
	}

}
