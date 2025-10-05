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
			if (
				typeof value === "object" &&
				Object.keys(value as object).length === 0
			) {
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
			this.validateRequirementStep(
				stepId,
				data,
				issues,
				suggestions,
				strengths,
			);
		} else if (specType === "component") {
			this.validateComponentStep(stepId, data, issues, suggestions, strengths);
		} else if (specType === "plan") {
			this.validatePlanStep(stepId, data, issues, suggestions, strengths);
		} else if (specType === "constitution") {
			this.validateConstitutionStep(
				stepId,
				data,
				issues,
				suggestions,
				strengths,
			);
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
			case "research_similar_requirements":
				this.validateResearchSimilarRequirements(
					data,
					issues,
					suggestions,
					strengths,
				);
				break;
			case "constitution_review":
				this.validateConstitutionReview(data, issues, suggestions, strengths);
				break;
			case "technology_research":
				this.validateTechnologyResearch(data, suggestions, strengths);
				break;
			case "problem_identification":
				this.validateProblemIdentification(
					data,
					issues,
					suggestions,
					strengths,
				);
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
			issues.push(
				"Description lacks rationale (should include 'because', 'needed', or 'so that')",
			);
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
			"postgres",
			"mysql",
			"mongodb",
			"redis",
			"database",
			"react",
			"vue",
			"angular",
			"svelte",
			"button",
			"dropdown",
			"modal",
			"dialog",
			"express",
			"fastapi",
			"django",
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
		const measurableKeywords = [
			"completes",
			"within",
			"under",
			"at least",
			"maximum",
			"minimum",
			"less than",
			"more than",
			"equals",
		];
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

		const vagueTerms = [
			"fast",
			"quick",
			"slow",
			"easy",
			"simple",
			"good",
			"bad",
			"nice",
			"better",
		];

		const allText = [
			description || "",
			...(Array.isArray(criteria)
				? criteria.filter((c): c is string => typeof c === "string")
				: []),
		].join(" ");

		const lowerText = allText.toLowerCase();
		const foundVagueTerms = vagueTerms.filter((term) =>
			lowerText.includes(term),
		);

		if (foundVagueTerms.length > 0) {
			issues.push(
				`Description contains vague terms: ${foundVagueTerms.join(", ")}`,
			);
			suggestions.push(
				"Replace vague terms with specific, measurable language",
			);
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
		// Validate that complete schema fields are provided
		const type = data.type as string | undefined;
		const number = data.number as number | undefined;
		const slug = data.slug as string | undefined;
		const name = data.name as string | undefined;
		const description = data.description as string | undefined;
		const priority = data.priority as string | undefined;
		const criteria = data.criteria as unknown[] | undefined;

		// Required fields check
		if (!type || type !== "requirement") {
			issues.push("type must be 'requirement'");
		}

		if (!number || typeof number !== "number") {
			issues.push("number is required and must be a number");
		}

		if (!slug || typeof slug !== "string") {
			issues.push("slug is required");
		} else {
			const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
			if (!slugRegex.test(slug)) {
				issues.push(
					"Slug must be lowercase with hyphens, no special characters",
				);
				suggestions.push("Example: user-authentication or api-gateway");
			}
		}

		if (!name || typeof name !== "string") {
			issues.push("name is required");
		}

		if (!description || typeof description !== "string") {
			issues.push("description is required");
		}

		if (
			priority &&
			!["critical", "required", "ideal", "optional"].includes(priority)
		) {
			issues.push(
				"priority must be one of: critical, required, ideal, optional",
			);
		}

		// Validate criteria structure
		if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
			issues.push("criteria array is required with at least one criterion");
		} else {
			// Check that each criterion has an id and description
			criteria.forEach((criterion, index) => {
				if (typeof criterion !== "object" || criterion === null) {
					issues.push(`Criterion at index ${index} must be an object`);
				} else {
					const crit = criterion as Record<string, unknown>;
					if (!crit.id || typeof crit.id !== "string") {
						issues.push(
							`Criterion at index ${index} missing 'id' field (should be crit-001, crit-002, etc.)`,
						);
					}
					if (!crit.description || typeof crit.description !== "string") {
						issues.push(
							`Criterion at index ${index} missing 'description' field`,
						);
					}
				}
			});
		}

		if (issues.length === 0) {
			strengths.push("Complete requirement schema validated successfully");
		}
	}

	private validateResearchSimilarRequirements(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const research = data.research_findings as string | undefined;
		const similarRequirements = data.similar_requirements as
			| unknown[]
			| undefined;

		if (!research && !similarRequirements) {
			issues.push("Research findings are required");
			suggestions.push(
				"Use query tool to search for similar requirements and document your findings",
			);
			return;
		}

		if (research?.includes("query")) {
			strengths.push("Research conducted using query tool");
		}

		if (
			similarRequirements &&
			Array.isArray(similarRequirements) &&
			similarRequirements.length > 0
		) {
			strengths.push(
				`Found ${similarRequirements.length} similar requirement(s) for comparison`,
			);
		}
	}

	private validateConstitutionReview(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const constitutionArticles = data.constitution_articles as
			| string
			| string[]
			| undefined;
		const noConstitutions = data.no_constitutions as boolean | undefined;

		if (constitutionArticles === undefined && !noConstitutions) {
			issues.push("Constitution review is required");
			suggestions.push(
				"Query constitutions and reference relevant article IDs with empty array [] if none exist",
			);
			return;
		}

		if (noConstitutions) {
			strengths.push("Confirmed no constitutions exist");
		} else if (constitutionArticles !== undefined) {
			const articles = Array.isArray(constitutionArticles)
				? constitutionArticles
				: [constitutionArticles];

			// Empty array is valid (no constitutions exist)
			if (articles.length === 0) {
				strengths.push("Confirmed no constitutions exist");
				return;
			}

			const validArticleIds = articles.filter(
				(a) => typeof a === "string" && a.match(/con-\d{3}-.+\/art-\d{3}/),
			);

			if (validArticleIds.length > 0) {
				strengths.push(
					`Referenced ${validArticleIds.length} constitution article(s)`,
				);
			} else if (validArticleIds.length === 0 && articles.length > 0) {
				issues.push("Invalid article ID format");
				suggestions.push("Use format: con-001-slug/art-001");
			}
		}
	}

	private validateTechnologyResearch(
		data: Record<string, unknown>,
		suggestions: string[],
		strengths: string[],
	): void {
		const research = data.technology_research as string | undefined;
		const notApplicable = data.not_applicable as boolean | undefined;

		if (!research && !notApplicable) {
			suggestions.push(
				"For technical requirements, use context7 to research available libraries",
			);
			return;
		}

		if (notApplicable) {
			strengths.push("Confirmed technology research not applicable");
		} else if (research) {
			if (
				research.includes("context7") ||
				research.includes("resolve-library-id")
			) {
				strengths.push("Researched using context7 for library documentation");
			}
			if (research.includes("WebFetch")) {
				strengths.push("Researched best practices and standards");
			}
		}
	}

	private validateResearchExistingComponents(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const research = data.component_research as string | undefined;
		if (!research) {
			issues.push("Component research is required");
			suggestions.push(
				"Use query to search for similar components across all types",
			);
			return;
		}

		if (research.includes("query")) {
			strengths.push("Searched for existing components");
		}
	}

	private validateLibraryResearch(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const research = data.library_research as string | undefined;
		if (!research) {
			issues.push("Library research is required");
			suggestions.push(
				"Use context7 to research third-party libraries before building custom",
			);
			return;
		}

		if (
			research.includes("context7") ||
			research.includes("resolve-library-id")
		) {
			strengths.push("Researched third-party libraries using context7");
		}
	}

	private validateComponentConstitutionAlignment(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const articles = data.constitution_articles as
			| string
			| string[]
			| undefined;
		if (!articles) {
			issues.push("Constitution alignment check is required");
			suggestions.push(
				"Query constitutions and identify relevant architectural principles",
			);
			return;
		}

		const articleList = Array.isArray(articles) ? articles : [articles];
		if (articleList.length > 0) {
			strengths.push(
				`Aligned with ${articleList.length} constitution article(s)`,
			);
		}
	}

	private validateDuplicatePrevention(
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		const justification = data.justification as string | undefined;
		if (!justification) {
			issues.push("Justification for new component is required");
			suggestions.push(
				"Explain why existing components or libraries cannot be used",
			);
			return;
		}

		if (justification.length > 50) {
			strengths.push("Clear justification provided for new component");
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
			case "research_existing_components":
				this.validateResearchExistingComponents(
					data,
					issues,
					suggestions,
					strengths,
				);
				break;

			case "library_research":
				this.validateLibraryResearch(data, issues, suggestions, strengths);
				break;

			case "constitution_alignment":
				this.validateComponentConstitutionAlignment(
					data,
					issues,
					suggestions,
					strengths,
				);
				break;

			case "duplicate_prevention":
				this.validateDuplicatePrevention(data, issues, suggestions, strengths);
				break;

			case "analyze_requirements":
				if (
					data.description &&
					typeof data.description === "string" &&
					data.description.length > 20
				) {
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

			case "define_responsibilities": {
				const capabilities = data.capabilities as unknown[] | undefined;
				if (
					capabilities &&
					Array.isArray(capabilities) &&
					capabilities.length > 0
				) {
					strengths.push(`${capabilities.length} capabilities clearly defined`);
				} else {
					issues.push(
						"Capabilities array is required and must have at least one capability",
					);
					suggestions.push("List the main capabilities of this component");
				}
				break;
			}

			case "map_dependencies": {
				const dependsOn = data.depends_on as unknown[] | undefined;
				const externalDeps = data.external_dependencies as
					| unknown[]
					| undefined;

				// Accept undefined as "not provided yet" and empty arrays as "no dependencies"
				if (dependsOn !== undefined || externalDeps !== undefined) {
					const internalCount = Array.isArray(dependsOn) ? dependsOn.length : 0;
					const externalCount = Array.isArray(externalDeps)
						? externalDeps.length
						: 0;

					if (internalCount === 0 && externalCount === 0) {
						strengths.push("No dependencies - self-contained component");
					} else {
						strengths.push(
							`Dependencies mapped: ${internalCount} internal, ${externalCount} external`,
						);
					}
				}
				break;
			}

			case "quality_attributes": {
				const constraints = data.constraints as unknown[] | undefined;
				if (
					constraints &&
					Array.isArray(constraints) &&
					constraints.length > 0
				) {
					strengths.push(`${constraints.length} quality attributes defined`);
				}
				break;
			}

			case "validate_refine": {
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
	}

	private validatePlanStep(
		stepId: string,
		data: Record<string, unknown>,
		issues: string[],
		suggestions: string[],
		strengths: string[],
	): void {
		switch (stepId) {
			case "context_discovery":
			case "technology_stack_research":
			case "constitution_compliance":
			case "similar_plans_review":
				// Research steps - lenient validation
				if (Object.keys(data).length > 0) {
					strengths.push("Research step completed");
				}
				break;

			case "review_context": {
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
			}

			case "break_down_tasks": {
				const tasks = data.tasks as unknown[] | undefined;
				if (tasks && Array.isArray(tasks) && tasks.length > 0) {
					// Check if tasks have estimated_days
					const tasksWithEstimates = tasks.filter(
						(t: unknown) =>
							typeof t === "object" && t !== null && "estimated_days" in t,
					);
					if (tasksWithEstimates.length === tasks.length) {
						strengths.push(
							`${tasks.length} tasks defined with effort estimates`,
						);
					} else {
						strengths.push(`${tasks.length} tasks defined`);
						if (tasksWithEstimates.length === 0) {
							issues.push("Tasks should include estimated_days field");
							suggestions.push("Add estimated_days (0.5-3 days) for each task");
						}
					}
				} else {
					issues.push("Tasks array is required");
					suggestions.push(
						"Break down the work into specific tasks with estimates",
					);
				}
				break;
			}

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
			case "research_existing_constitutions":
			case "best_practices_research":
			case "framework_review":
			case "conflict_check":
				// Research steps - lenient validation
				if (Object.keys(data).length > 0) {
					strengths.push("Research step completed");
				}
				break;

			case "basic_info": {
				const description = data.description as string | undefined;
				if (description && description.length < 20) {
					issues.push("Description should be at least 20 characters");
					suggestions.push(
						"Provide a detailed description of the constitution's purpose",
					);
				}
				break;
			}

			case "articles": {
				const articles = data.articles as unknown[] | undefined;
				if (articles && Array.isArray(articles) && articles.length > 0) {
					strengths.push(
						`${articles.length} principle(s) defined with rationale`,
					);
				} else {
					issues.push(
						"Articles/principles array is required and must have at least one article",
					);
					suggestions.push("Define the guiding principles");
				}
				break;
			}

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
			case "related_decisions_research":
			case "technology_options_research":
				// Research steps - lenient validation
				if (Object.keys(data).length > 0) {
					strengths.push("Research step completed");
				}
				break;

			case "decision_statement": {
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
			}

			case "context":
				strengths.push("Context provided");
				break;

			case "alternatives_and_consequences":
				strengths.push("Alternatives and consequences documented");
				break;

			case "relationships": {
				const affectsComponents =
					(data.affects_components as unknown[] | undefined) || [];
				const affectsRequirements =
					(data.affects_requirements as unknown[] | undefined) || [];
				const affectsPlans =
					(data.affects_plans as unknown[] | undefined) || [];
				const informedByArticles =
					(data.informed_by_articles as unknown[] | undefined) || [];
				const noConstitutionsExist = data.no_constitutions_exist as
					| boolean
					| undefined;

				const totalImpact =
					(Array.isArray(affectsComponents) ? affectsComponents.length : 0) +
					(Array.isArray(affectsRequirements)
						? affectsRequirements.length
						: 0) +
					(Array.isArray(affectsPlans) ? affectsPlans.length : 0);

				// Constitution articles are now REQUIRED (or explicit statement that none exist)
				if (!informedByArticles && !noConstitutionsExist) {
					issues.push(
						"Constitution article references are required for all decisions",
					);
					suggestions.push(
						"Query constitutions and reference relevant articles, or state 'no constitutions exist'",
					);
				} else if (noConstitutionsExist) {
					strengths.push("Confirmed no constitutions exist to reference");
				} else if (
					informedByArticles &&
					Array.isArray(informedByArticles) &&
					informedByArticles.length > 0
				) {
					strengths.push(
						`Aligned with ${informedByArticles.length} guiding principle(s)`,
					);
				}

				if (totalImpact > 0) {
					strengths.push(`Impact documented across ${totalImpact} entities`);
				}
				break;
			}
		}
	}
}
