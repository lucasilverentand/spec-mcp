import type { ValidationResult, ValidationRule } from "./types.js";

/**
 * Validates wizard step data against rules
 */
export class StepValidator {
	/**
	 * Validate step data against rules
	 */
	validate(
		stepId: string,
		data: Record<string, unknown>,
		rules: ValidationRule[],
	): ValidationResult {
		const issues: string[] = [];
		const suggestions: string[] = [];
		const strengths: string[] = [];

		for (const rule of rules) {
			const result = this.validateRule(data, rule);
			if (!result.passed) {
				issues.push(result.message);
			}
			if (result.suggestion) {
				suggestions.push(result.suggestion);
			}
			if (result.strength) {
				strengths.push(result.strength);
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
	 * Validate a single rule
	 */
	private validateRule(
		data: Record<string, unknown>,
		rule: ValidationRule,
	): {
		passed: boolean;
		message: string;
		suggestion?: string;
		strength?: string;
	} {
		const field = rule.field;
		const value = field ? data[field] : null;

		switch (rule.type) {
			case "required": {
				const passed = value !== undefined && value !== null && value !== "";
				return {
					passed,
					message: passed ? "" : rule.message || `${field} is required`,
				};
			}

			case "min_length": {
				if (!value || typeof value !== "string") {
					return {
						passed: false,
						message:
							rule.message ||
							`${field} must be at least ${rule.value} characters`,
					};
				}
				const passed = value.length >= (rule.value || 0);
				return {
					passed,
					message: passed
						? ""
						: rule.message ||
							`${field} must be at least ${rule.value} characters`,
					strength: passed ? `Good detail in ${field}` : undefined,
				};
			}

			case "max_length": {
				if (!value || typeof value !== "string") {
					return { passed: true, message: "" };
				}
				const passed = value.length <= (rule.value || Number.POSITIVE_INFINITY);
				return {
					passed,
					message: passed
						? ""
						: rule.message ||
							`${field} must be at most ${rule.value} characters`,
				};
			}

			case "contains_rationale": {
				if (!value || typeof value !== "string") {
					return {
						passed: false,
						message:
							rule.message ||
							"Description should include rationale (why this is needed)",
					};
				}
				const keywords = rule.keywords || ["because", "needed", "so that"];
				const lowerValue = value.toLowerCase();
				const hasRationale = keywords.some((keyword) =>
					lowerValue.includes(keyword.toLowerCase()),
				);
				return {
					passed: hasRationale,
					message: hasRationale ? "" : rule.message || "Missing rationale",
					suggestion: hasRationale
						? undefined
						: `Consider adding 'because' or 'so that' to explain why this is needed`,
					strength: hasRationale ? "Clear rationale provided" : undefined,
				};
			}

			case "no_implementation": {
				if (!value || typeof value !== "string") {
					return { passed: true, message: "" };
				}
				const implementationKeywords = [
					"database",
					"mongodb",
					"postgres",
					"redis",
					"react",
					"vue",
					"angular",
					"api endpoint",
					"rest api",
					"graphql",
					"button",
					"form",
					"table",
					"component",
					"class",
					"function",
					"method",
				];
				const lowerValue = value.toLowerCase();
				const foundKeywords = implementationKeywords.filter((keyword) =>
					lowerValue.includes(keyword),
				);
				const passed = foundKeywords.length === 0;
				return {
					passed,
					message: passed
						? ""
						: rule.message ||
							`Contains implementation details: ${foundKeywords.join(", ")}`,
					suggestion: passed
						? undefined
						: "Focus on WHAT needs to happen, not HOW it should be implemented",
					strength: passed ? "Implementation-agnostic description" : undefined,
				};
			}

			case "measurable": {
				if (!Array.isArray(value) || value.length === 0) {
					return {
						passed: false,
						message: rule.message || "At least 2 measurable criteria required",
					};
				}
				const hasMeasurableTerms = value.some((criterion) => {
					if (typeof criterion !== "object" || criterion === null) return false;
					const desc =
						(criterion as { description?: string }).description || "";
					return (
						/\d+/.test(desc) || // contains numbers
						/(must|should|will|can)\s+(display|show|allow|enable|provide)/i.test(
							desc,
						) || // action verbs
						/(successfully|correctly|accurately)/i.test(desc)
					); // quality indicators
				});
				const passed = value.length >= 2 && hasMeasurableTerms;
				return {
					passed,
					message: passed
						? ""
						: rule.message || "Criteria should be measurable and testable",
					suggestion: passed
						? undefined
						: "Use specific, testable language (e.g., 'displays 10 items', 'completes in under 2 seconds')",
					strength: passed ? "Well-defined measurable criteria" : undefined,
				};
			}

			case "specific_language": {
				if (!value || typeof value !== "string") {
					return { passed: true, message: "" };
				}
				const vagueTerms = [
					"fast",
					"slow",
					"easy",
					"hard",
					"simple",
					"complex",
					"good",
					"bad",
					"nice",
					"better",
					"efficient",
				];
				const lowerValue = value.toLowerCase();
				const foundVagueTerms = vagueTerms.filter((term) =>
					lowerValue.includes(term),
				);
				const passed = foundVagueTerms.length === 0;
				return {
					passed,
					message: passed
						? ""
						: rule.message ||
							`Contains vague terms: ${foundVagueTerms.join(", ")}`,
					suggestion: passed
						? undefined
						: "Replace vague terms with specific, quantifiable language (e.g., 'under 200ms' instead of 'fast')",
					strength: passed ? "Specific, quantifiable language used" : undefined,
				};
			}

			default:
				return { passed: true, message: "" };
		}
	}
}
