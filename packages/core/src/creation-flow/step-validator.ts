import type { CreationFlowValidationResult } from "./types.js";

type SpecType =
	| "requirement"
	| "component"
	| "plan"
	| "constitution"
	| "decision";

/**
 * Step-by-step validation for creation flow
 *
 * Validates data at each step according to best practices and requirements.
 */
export class StepValidator {
	/**
	 * Perform validation on step data
	 */
	validate(
		specType: SpecType,
		stepId: string,
		data: Record<string, unknown>,
	): CreationFlowValidationResult {
		const issues: string[] = [];
		const suggestions: string[] = [];
		const strengths: string[] = [];

		// Check if any meaningful data was provided
		if (Object.keys(data).length === 0) {
			issues.push("No data provided for this step");
			suggestions.push("Please provide information to answer the question");
			return {
				step: stepId,
				passed: false,
				issues,
				suggestions,
				strengths,
			};
		}

		// Check if all values are empty/null/undefined
		// Note: Empty arrays are considered valid (explicitly stating "none")
		const hasAnyValue = Object.values(data).some((value) => {
			if (value === null || value === undefined || value === "") {
				return false;
			}
			// Empty arrays are OK - they explicitly state "no items"
			if (Array.isArray(value)) {
				return true;
			}
			if (typeof value === "object" && Object.keys(value as object).length === 0) {
				return false;
			}
			return true;
		});

		if (!hasAnyValue) {
			issues.push("All provided values are empty");
			suggestions.push("Please provide meaningful information");
			return {
				step: stepId,
				passed: false,
				issues,
				suggestions,
				strengths,
			};
		}

		// Perform step-specific validation
		if (specType === "requirement") {
			this.validateRequirementStep(stepId, data, issues, suggestions, strengths);
		} else if (specType === "component") {
			this.validateComponentStep(stepId, data, issues, suggestions, strengths);
		} else if (specType === "plan") {
			this.validatePlanStep(stepId, data, issues, suggestions, strengths);
		} else if (specType === "constitution") {
			this.validateConstitutionStep(stepId, data, issues, suggestions, strengths);
		} else if (specType === "decision") {
			this.validateDecisionStep(stepId, data, issues, suggestions, strengths);
		}

		return {
			step: stepId,
			passed: issues.length === 0,
			issues,
			suggestions,
			strengths,
		};
	}

	private validateRequirementStep(
		stepId: string,
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		switch (stepId) {
			case "problem_identification":
				this.validateProblemIdentification(data, issues, suggestions, strengths);
				break;
			case "avoid_implementation":
				this.validateAvoidImplementation(data, issues, suggestions, strengths);
				break;
			case "measurability":
				this.validateMeasurability(data, issues, suggestions, strengths);
				break;
			case "specific_language":
				this.validateSpecificLanguage(data, issues, suggestions, strengths);
				break;
			case "acceptance_criteria":
				this.validateAcceptanceCriteria(data, issues, suggestions, strengths);
				break;
			case "priority_assignment":
				this.validatePriorityAssignment(data, issues, suggestions, strengths);
				break;
			case "review_and_refine":
				this.validateReviewAndRefine(data, issues, suggestions, strengths);
				break;
		}
	}

	private validateProblemIdentification(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const description = data.description as string | undefined;

		if (!description || typeof description !== "string") {
			issues.push("Description is required");
			suggestions.push("Provide a clear problem description");
			return;
		}

		if (description.length < 50) {
			issues.push("Description must be at least 50 characters");
			suggestions.push("Expand the description to provide more context");
		}

		const hasRationale =
			description.toLowerCase().includes("because") ||
			description.toLowerCase().includes("needed") ||
			description.toLowerCase().includes("so that");

		if (!hasRationale) {
			issues.push("Description lacks rationale (should include 'because', 'needed', or 'so that')");
			suggestions.push("Explain WHY this requirement is needed");
		}

		if (issues.length === 0) {
			strengths.push("Clear problem identification with rationale");
		}
	}

	private validateAvoidImplementation(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const description = data.description as string | undefined;

		if (!description || typeof description !== "string") {
			return; // Already validated in previous step
		}

		const implementationTerms = [
			"postgres", "mysql", "mongodb", "redis", "database",
			"react", "vue", "angular", "svelte",
			"button", "dropdown", "modal", "dialog",
			"express", "fastapi", "django",
		];

		const lowerDesc = description.toLowerCase();
		const foundTerms = implementationTerms.filter((term) =>
			lowerDesc.includes(term),
		);

		if (foundTerms.length > 0) {
			issues.push(
				`Description includes implementation details: ${foundTerms.join(", ")}`,
			);
			suggestions.push("Focus on WHAT is needed, not HOW it should be built");
		} else {
			strengths.push("Implementation-agnostic description");
		}
	}

	private validateMeasurability(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const criteria = data.criteria as unknown[] | undefined;

		if (!criteria || !Array.isArray(criteria)) {
			issues.push("Criteria array is required");
			suggestions.push("Define at least 2 measurable success criteria");
			return;
		}

		if (criteria.length < 2) {
			issues.push("At least 2 acceptance criteria are required");
			suggestions.push("Add more specific, testable criteria");
		}

		// Check if criteria are measurable
		const measurableKeywords = ["completes", "within", "under", "at least", "maximum", "minimum", "less than", "more than", "equals"];
		const measurableCriteria = criteria.filter((c) => {
			// Handle both string criteria and object criteria with description
			let text = "";
			if (typeof c === "string") {
				text = c;
			} else if (c && typeof c === "object" && "description" in c) {
				text = (c as { description: unknown }).description as string;
			}
			const lower = text.toLowerCase();
			return measurableKeywords.some((keyword) => lower.includes(keyword));
		});

		if (measurableCriteria.length < criteria.length / 2) {
			issues.push("Most criteria should be measurable and specific");
			suggestions.push("Use concrete metrics and numbers where possible");
		}

		if (issues.length === 0) {
			strengths.push("Well-defined measurable criteria");
		}
	}

	private validateSpecificLanguage(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const description = data.description as string | undefined;
		const criteria = data.criteria as unknown[] | undefined;

		const vagueTerms = ["fast", "quick", "slow", "easy", "simple", "good", "bad", "nice", "better"];

		const allText = [
			description || "",
			...(Array.isArray(criteria) ? criteria.filter((c): c is string => typeof c === "string") : []),
		].join(" ");

		const lowerText = allText.toLowerCase();
		const foundVagueTerms = vagueTerms.filter((term) =>
			lowerText.includes(term),
		);

		if (foundVagueTerms.length > 0) {
			issues.push(`Description contains vague terms: ${foundVagueTerms.join(", ")}`);
			suggestions.push("Replace vague terms with specific, measurable language");
		} else {
			strengths.push("Specific, quantifiable language used");
		}
	}

	private validateAcceptanceCriteria(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const criteria = data.criteria as unknown[] | undefined;

		if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
			issues.push("Acceptance criteria are required");
			suggestions.push("Define testable acceptance criteria");
			return;
		}

		strengths.push("Acceptance criteria defined");
	}

	private validatePriorityAssignment(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const priority = data.priority as string | undefined;

		if (!priority || typeof priority !== "string") {
			issues.push("Priority is required");
			suggestions.push("Choose a priority level");
			return;
		}

		const validPriorities = ["critical", "required", "ideal", "optional"];
		if (!validPriorities.includes(priority.toLowerCase())) {
			issues.push(`Invalid priority: ${priority}`);
			suggestions.push(`Choose one of: ${validPriorities.join(", ")}`);
		} else {
			strengths.push(`Clear priority assignment: ${priority}`);
		}
	}

	private validateReviewAndRefine(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const slug = data.slug as string | undefined;
		const name = data.name as string | undefined;

		if (slug && typeof slug === "string") {
			const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
			if (!slugRegex.test(slug)) {
				issues.push("Slug must be lowercase with hyphens, no special characters");
				suggestions.push("Example: user-authentication or api-gateway");
			}
		}

		if (name && typeof name === "string" && name.length > 0) {
			strengths.push("Name provided");
		}

		if (issues.length === 0) {
			strengths.push("All required fields complete and validated");
		}
	}

	private validateComponentStep(
		stepId: string,
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		switch (stepId) {
			case "analyze_requirements":
				if (data.description && typeof data.description === "string" && data.description.length > 20) {
					strengths.push("Clear requirement traceability established");
				}
				break;

			case "define_boundaries":
				if (data.description) {
					const desc = data.description as string;
					if (desc.length < 50) {
						issues.push("Description should be at least 50 characters");
						suggestions.push("Provide more detail about component boundaries");
					} else {
						strengths.push("Component boundaries clearly defined");
					}
				}
				break;

			case "define_responsibilities":
				const capabilities = data.capabilities as unknown[] | undefined;
				if (capabilities && Array.isArray(capabilities) && capabilities.length > 0) {
					strengths.push(`${capabilities.length} capabilities clearly defined`);
				} else {
					issues.push("Capabilities array is required and must have at least one capability");
					suggestions.push("List the main capabilities of this component");
				}
				break;

			case "map_dependencies":
				const dependsOn = (data.depends_on as unknown[] | undefined) || [];
				const externalDeps = (data.external_dependencies as unknown[] | undefined) || [];

				const internalCount = Array.isArray(dependsOn) ? dependsOn.length : 0;
				const externalCount = Array.isArray(externalDeps) ? externalDeps.length : 0;

				if (internalCount === 0 && externalCount === 0) {
					strengths.push("No external dependencies - self-contained component");
				} else {
					strengths.push(`Dependencies mapped: ${internalCount} internal, ${externalCount} external`);
				}
				break;

			case "quality_attributes":
				const constraints = data.constraints as unknown[] | undefined;
				if (constraints && Array.isArray(constraints) && constraints.length > 0) {
					strengths.push(`${constraints.length} quality attributes defined`);
				}
				break;

			case "validate_refine":
				const type = data.type as string | undefined;
				if (type) {
					const validTypes = ["app", "service", "library"];
					if (!validTypes.includes(type)) {
						issues.push(`Invalid component type: ${type}`);
						suggestions.push(`Choose one of: ${validTypes.join(", ")}`);
					} else {
						strengths.push("Component type specified");
					}
				}
				break;
		}
	}

	private validatePlanStep(
		stepId: string,
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		switch (stepId) {
			case "review_context":
				const criteriaId = data.criteria_id as string | undefined;
				if (criteriaId && typeof criteriaId === "string") {
					const criteriaIdRegex = /^req-\d{3}-.+\/crit-\d{3}$/;
					if (!criteriaIdRegex.test(criteriaId)) {
						issues.push("Invalid criteria_id format");
						suggestions.push("Format should be: req-001-name/crit-001");
					} else {
						strengths.push("Linked to requirement criteria");
					}
				}
				break;

			case "break_down_tasks":
				const tasks = data.tasks as unknown[] | undefined;
				if (tasks && Array.isArray(tasks) && tasks.length > 0) {
					strengths.push(`${tasks.length} tasks defined with clear descriptions`);
				} else {
					issues.push("Tasks array is required");
					suggestions.push("Break down the work into specific tasks");
				}
				break;

			case "estimate_effort":
				const tasksWithEstimates = data.tasks as unknown[] | undefined;
				if (tasksWithEstimates && Array.isArray(tasksWithEstimates)) {
					strengths.push(`Effort estimates provided for ${tasksWithEstimates.length} tasks`);
				}
				break;

			case "validate_refine":
				strengths.push("Plan ready for finalization");
				break;
		}
	}

	private validateConstitutionStep(
		stepId: string,
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		switch (stepId) {
			case "basic_info":
				const description = data.description as string | undefined;
				if (description && description.length < 20) {
					issues.push("Description should be at least 20 characters");
					suggestions.push("Provide a detailed description of the constitution's purpose");
				}
				break;

			case "articles":
				const articles = data.articles as unknown[] | undefined;
				if (articles && Array.isArray(articles) && articles.length > 0) {
					strengths.push(`${articles.length} principle(s) defined with rationale`);
				} else {
					issues.push("Articles/principles array is required and must have at least one article");
					suggestions.push("Define the guiding principles");
				}
				break;

			case "finalize":
				strengths.push("Constitution ready for creation");
				break;
		}
	}

	private validateDecisionStep(
		stepId: string,
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		switch (stepId) {
			case "decision_statement":
				const decision = data.decision as string | undefined;
				if (decision && typeof decision === "string") {
					if (decision.length < 20) {
						issues.push("Decision statement should be at least 20 characters");
						suggestions.push("Provide a clear, concise decision statement");
					} else if (decision.length > 200) {
						issues.push("Decision statement should be under 200 characters");
						suggestions.push("Keep the decision statement concise");
					} else {
						strengths.push("Decision clearly stated");
					}
				}
				break;

			case "context":
				strengths.push("Context provided");
				break;

			case "alternatives_and_consequences":
				strengths.push("Alternatives and consequences documented");
				break;

			case "relationships":
				const affectsComponents = (data.affects_components as unknown[] | undefined) || [];
				const affectsRequirements = (data.affects_requirements as unknown[] | undefined) || [];
				const affectsPlans = (data.affects_plans as unknown[] | undefined) || [];
				const informedByArticles = (data.informed_by_articles as unknown[] | undefined) || [];

				const totalImpact =
					(Array.isArray(affectsComponents) ? affectsComponents.length : 0) +
					(Array.isArray(affectsRequirements) ? affectsRequirements.length : 0) +
					(Array.isArray(affectsPlans) ? affectsPlans.length : 0);

				// Check if all fields are provided (even if empty)
				const hasAllFields =
					"affects_components" in data &&
					"affects_requirements" in data &&
					"affects_plans" in data &&
					"informed_by_articles" in data;

				if (hasAllFields) {
					// If explicitly provided (even if empty), that's fine
					if (totalImpact > 0) {
						strengths.push(`Impact documented across ${totalImpact} entities`);
					}
					if (informedByArticles && Array.isArray(informedByArticles) && informedByArticles.length > 0) {
						strengths.push(`Aligned with ${informedByArticles.length} guiding principle(s)`);
					}
				} else if (totalImpact === 0 && (!informedByArticles || informedByArticles.length === 0)) {
					// Only fail if nothing is provided at all
					issues.push("At least one relationship should be defined (or explicitly state if none)");
					suggestions.push("Document what this decision affects or which principles it aligns with");
				} else {
					if (totalImpact > 0) {
						strengths.push(`Impact documented across ${totalImpact} entities`);
					}
					if (informedByArticles && Array.isArray(informedByArticles) && informedByArticles.length > 0) {
						strengths.push(`Aligned with ${informedByArticles.length} guiding principle(s)`);
					}
				}
				break;
		}
	}
}
