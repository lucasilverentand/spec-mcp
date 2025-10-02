import type { DraftEntity, ValidationResult } from "./draft-manager.js";
import type { StepDefinition, ValidationRule } from "./step-definitions.js";

/**
 * Validates draft data against step requirements
 */
export class StepValidator {
	/**
	 * Validate a draft against a specific step's requirements
	 */
	validateStep(
		step: StepDefinition,
		data: DraftEntity,
	): ValidationResult {
		const issues: string[] = [];
		const suggestions: string[] = [];
		const strengths: string[] = [];

		// Validate required fields
		for (const field of step.required_fields) {
			if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
				issues.push(`Required field '${field}' is missing or empty`);
			}
		}

		// Validate rules
		for (const rule of step.validation_rules) {
			const result = this.validateRule(rule, data);
			if (!result.passed) {
				issues.push(result.message);
			}
			if (result.suggestion) {
				suggestions.push(result.suggestion);
			}
		}

		// Check for strengths
		if (step.id === "problem_identification") {
			const desc = data.description as string;
			if (desc && desc.length > 100) {
				strengths.push("Good detailed description");
			}
			if (
				desc &&
				(desc.includes("because") || desc.includes("needed") || desc.includes("why"))
			) {
				strengths.push("Clear rationale provided");
			}
		}

		if (step.id === "measurability" || step.id === "acceptance_criteria") {
			const criteria = data.criteria as Array<{ id: string; description: string }>;
			if (criteria && criteria.length >= 2 && criteria.length <= 4) {
				strengths.push("Good number of acceptance criteria (2-4)");
			}
		}

		return {
			step: step.id,
			passed: issues.length === 0,
			issues,
			suggestions,
			strengths,
		};
	}

	/**
	 * Validate a single rule
	 */
	private validateRule(
		rule: ValidationRule,
		data: DraftEntity,
	): { passed: boolean; message: string; suggestion?: string } {
		const field = rule.field;
		const value = field ? data[field] : null;

		switch (rule.type) {
			case "min_length": {
				if (typeof value === "string" && value.length < (rule.value as number)) {
					return {
						passed: false,
						message:
							rule.message ||
							`${field} should be at least ${rule.value} characters`,
					};
				}
				return { passed: true, message: "" };
			}

			case "max_length": {
				if (typeof value === "string" && value.length > (rule.value as number)) {
					return {
						passed: false,
						message:
							rule.message ||
							`${field} should be at most ${rule.value} characters`,
					};
				}
				return { passed: true, message: "" };
			}

			case "contains_rationale": {
				if (typeof value === "string" && rule.keywords) {
					const hasRationale = rule.keywords.some((keyword) =>
						value.toLowerCase().includes(keyword.toLowerCase()),
					);
					if (!hasRationale) {
						return {
							passed: false,
							message:
								rule.message || "Should include rationale (because, needed, etc.)",
							suggestion: `Consider adding words like: ${rule.keywords.join(", ")}`,
						};
					}
				}
				return { passed: true, message: "" };
			}

			case "no_implementation": {
				if (typeof value === "string" && rule.keywords) {
					const foundKeywords: string[] = [];
					for (const keyword of rule.keywords) {
						if (value.toLowerCase().includes(keyword.toLowerCase())) {
							foundKeywords.push(keyword);
						}
					}
					if (foundKeywords.length > 0) {
						return {
							passed: false,
							message:
								rule.message ||
								"Should not contain implementation details",
							suggestion: `Remove implementation keywords: ${foundKeywords.join(", ")}`,
						};
					}
				}
				return { passed: true, message: "" };
			}

			case "required": {
				if (field && (!value || (Array.isArray(value) && value.length === 0))) {
					return {
						passed: false,
						message: rule.message || `${field} is required`,
					};
				}
				return { passed: true, message: "" };
			}

			case "pattern": {
				if (typeof value === "string" && rule.pattern) {
					if (rule.pattern.test(value)) {
						return {
							passed: false,
							message: rule.message || "Pattern validation failed",
							suggestion: "Consider using more specific, measurable language",
						};
					}
				}
				return { passed: true, message: "" };
			}

			default:
				return { passed: true, message: "" };
		}
	}

	/**
	 * Validate all required fields are present for finalization
	 */
	validateForFinalization(
		type: "requirement" | "component" | "plan",
		data: DraftEntity,
	): ValidationResult {
		const issues: string[] = [];

		switch (type) {
			case "requirement": {
				if (!data.slug) issues.push("slug is required");
				if (!data.name) issues.push("name is required");
				if (!data.description) issues.push("description is required");
				if (!data.priority) issues.push("priority is required");
				if (!data.criteria || (data.criteria as unknown[]).length === 0) {
					issues.push("At least one acceptance criterion is required");
				}
				break;
			}

			case "component": {
				if (!data.slug) issues.push("slug is required");
				if (!data.name) issues.push("name is required");
				if (!data.description) issues.push("description is required");
				if (!data.type) issues.push("type is required");
				break;
			}

			case "plan": {
				if (!data.slug) issues.push("slug is required");
				if (!data.name) issues.push("name is required");
				if (!data.description) issues.push("description is required");
				if (!data.acceptance_criteria) {
					issues.push("acceptance_criteria is required");
				}
				// criteria_id is optional for orchestration plans
				break;
			}
		}

		return {
			step: "finalization",
			passed: issues.length === 0,
			issues,
			suggestions: [],
			strengths: [],
		};
	}
}
