import {
	type Draft,
	DraftManager,
	getFinalizationPrompt,
	getStepDefinitions,
	type StepResponse,
	StepValidator,
} from "@spec-mcp/core";

/**
 * Shared creation-flow helper for all spec tools (Q&A-based flow)
 */
export class CreationFlowHelper {
	private draftManager: DraftManager;
	private stepValidator: StepValidator;

	constructor(specsPath?: string) {
		this.draftManager = new DraftManager(specsPath);
		this.stepValidator = new StepValidator();
	}

	/**
	 * Start a new creation-flow session
	 */
	async start(
		type: "requirement" | "component" | "plan" | "constitution" | "decision",
		slug?: string,
		name?: string,
	): Promise<StepResponse> {
		const draft = await this.draftManager.create(type, slug, name);
		const steps = getStepDefinitions(type);
		const firstStep = steps[0];

		if (!firstStep) {
			throw new Error("No steps defined for this spec type");
		}

		const hints = this.generateFieldHints(type, firstStep.id);
		const examples = this.generateExamples(type, firstStep.id);

		return {
			draft_id: draft.id,
			step: 1,
			total_steps: draft.total_steps,
			current_step_name: firstStep.name,
			question: firstStep.question,
			guidance: firstStep.guidance,
			prompt: firstStep.question,
			field_hints: hints,
			examples,
			progress_summary: this.generateProgressSummary(
				1,
				draft.total_steps,
				type,
			),
			...(firstStep.next_step ? { next_step: firstStep.next_step } : {}),
		};
	}

	/**
	 * Process a creation-flow step
	 */
	async step(
		draft_id: string,
		data: Record<string, unknown>,
	): Promise<StepResponse | { error: string }> {
		const draft = this.draftManager.get(draft_id);
		if (!draft) {
			return { error: `Draft not found: ${draft_id}` };
		}

		// Prevent locking drafts - only finalized specs can be locked
		if ("locked" in data) {
			return {
				error: "Drafts cannot be locked. Only finalized specs can be locked.",
			};
		}

		const steps = getStepDefinitions(draft.type);
		const currentStepIndex = draft.current_step - 1;

		if (currentStepIndex >= steps.length) {
			return {
				error:
					"All steps completed. The draft should have been finalized automatically.",
			};
		}

		const currentStep = steps[currentStepIndex];
		if (!currentStep) {
			return { error: "Invalid step index" };
		}

		// Merge new data with existing draft data
		const updatedData = { ...draft.data, ...data };

		// Light validation - just check if data was provided
		const validation = this.stepValidator.validate(
			draft.type,
			currentStep.id,
			updatedData,
		);

		// Update draft with new data and validation
		const updatedDraft = await this.draftManager.update(draft_id, {
			data: updatedData,
			validation_results: [...draft.validation_results, validation],
		});

		if (!updatedDraft) {
			return { error: `Failed to update draft: ${draft_id}` };
		}

		// If validation failed, return error with suggestions
		if (!validation.passed) {
			const hints = this.generateFieldHints(draft.type, currentStep.id);
			const examples = this.generateExamples(draft.type, currentStep.id);

			return {
				draft_id,
				step: draft.current_step,
				total_steps: draft.total_steps,
				current_step_name: currentStep.name,
				question: currentStep.question,
				guidance: currentStep.guidance,
				prompt: currentStep.question,
				field_hints: hints,
				examples,
				validation,
			};
		}

		// Move to next step
		const nextStepIndex = currentStepIndex + 1;
		if (nextStepIndex >= steps.length) {
			// All steps complete - return finalization instructions
			const finalizationInstructions = getFinalizationPrompt(
				draft.type,
				updatedData,
			);

			return {
				draft_id,
				step: draft.current_step,
				total_steps: draft.total_steps,
				current_step_name: "Finalization",
				question: "All steps complete! Ready to create the specification?",
				guidance: finalizationInstructions,
				completed: true,
				finalization_instructions: finalizationInstructions,
			};
		}

		const nextStep = steps[nextStepIndex];
		if (!nextStep) {
			return { error: "Invalid next step index" };
		}

		const finalDraft = await this.draftManager.update(draft_id, {
			current_step: nextStepIndex + 1,
		});

		if (!finalDraft) {
			return { error: `Failed to advance to next step: ${draft_id}` };
		}

		const hints = this.generateFieldHints(draft.type, nextStep.id);
		const examples = this.generateExamples(draft.type, nextStep.id);

		return {
			draft_id,
			step: nextStepIndex + 1,
			total_steps: draft.total_steps,
			current_step_name: nextStep.name,
			question: nextStep.question,
			guidance: nextStep.guidance,
			prompt: nextStep.question,
			field_hints: hints,
			examples,
			validation,
			progress_summary: this.generateProgressSummary(
				nextStepIndex + 1,
				draft.total_steps,
				draft.type,
			),
			...(nextStep.next_step ? { next_step: nextStep.next_step } : {}),
		};
	}

	/**
	 * Validate current draft state
	 */
	validate(draft_id: string): StepResponse | { error: string } {
		const draft = this.draftManager.get(draft_id);
		if (!draft) {
			return { error: `Draft not found: ${draft_id}` };
		}

		const steps = getStepDefinitions(draft.type);
		const currentStepIndex = draft.current_step - 1;

		if (currentStepIndex >= steps.length) {
			return { error: "All steps already completed" };
		}

		const currentStep = steps[currentStepIndex];
		if (!currentStep) {
			return { error: "Invalid step index" };
		}

		const validation = this.stepValidator.validate(
			draft.type,
			currentStep.id,
			draft.data,
		);

		return {
			draft_id,
			step: draft.current_step,
			total_steps: draft.total_steps,
			current_step_name: currentStep.name,
			question: currentStep.question,
			guidance: currentStep.guidance,
			validation,
		};
	}

	/**
	 * Get draft for finalization
	 */
	getDraft(draft_id: string): Draft | null {
		return this.draftManager.get(draft_id);
	}

	/**
	 * Delete draft after finalization
	 */
	async deleteDraft(draft_id: string): Promise<boolean> {
		return await this.draftManager.delete(draft_id);
	}

	/**
	 * Generate progress summary
	 */
	private generateProgressSummary(
		currentStep: number,
		totalSteps: number,
		specType: string,
	): string {
		const percentage = Math.round((currentStep / totalSteps) * 100);
		return `Creating ${specType} - Step ${currentStep}/${totalSteps} (${percentage}% complete)`;
	}

	/**
	 * Generate field hints for a specific step
	 */
	private generateFieldHints(
		type: string,
		stepId: string,
	): Record<string, string> {
		const hints: Record<string, string> = {};

		// Add type-specific field hints based on step
		if (type === "requirement") {
			switch (stepId) {
				case "research_similar_requirements":
					hints.tool_usage =
						"Use: query({ search_terms: '...', types: ['requirement'] })";
					hints.research_findings =
						"Document what similar requirements you found";
					break;
				case "constitution_review":
					hints.tool_usage =
						"Use: query({ types: ['constitution'], mode: 'full' })";
					hints.constitution_articles =
						"Reference article IDs: con-001-slug/art-001";
					break;
				case "technology_research":
					hints.tool_usage =
						"Use: resolve-library-id then get-library-docs for libraries; WebFetch for patterns";
					hints.technology_research =
						"Document findings from context7 and WebFetch";
					break;
				case "problem_identification":
					hints.description =
						"Include the problem or opportunity, business value, and rationale";
					break;
				case "measurability":
					hints.criteria = "Provide 2-4 specific, testable acceptance criteria";
					break;
				case "priority_assignment":
					hints.priority = "Choose: critical, required, ideal, or optional";
					break;
				case "review_and_refine":
					hints.slug = "Lowercase with hyphens, no special characters";
					hints.name = "Clear, concise title for the requirement";
					break;
			}
		} else if (type === "component") {
			switch (stepId) {
				case "research_existing_components":
					hints.tool_usage =
						"Use: query({ search_terms: '...', types: ['app', 'service', 'library'] })";
					break;
				case "library_research":
					hints.tool_usage =
						"Use: resolve-library-id({ libraryName: '...' }) then get-library-docs";
					break;
				case "constitution_alignment":
					hints.tool_usage = "Use: query({ types: ['constitution'] })";
					hints.constitution_articles = "Reference relevant article IDs";
					break;
				case "duplicate_prevention":
					hints.justification =
						"Explain why existing components/libraries cannot be used";
					break;
				case "analyze_requirements":
					hints.description =
						"Describe what this component does and which requirements it satisfies";
					hints.component_type = "Choose: app, service, or library";
					hints.tool_usage =
						"Use: query({ entity_id: 'req-001-...' }) to get requirements";
					break;
				case "define_boundaries":
					hints.boundaries =
						"Define what this component is and is NOT responsible for";
					break;
				case "define_responsibilities":
					hints.responsibilities =
						"List the specific capabilities this component provides";
					break;
				case "design_api":
					hints.api_contracts = "Define the APIs this component exposes";
					break;
				case "model_data":
					hints.data_models = "Define the data structures this component uses";
					break;
				case "map_flows":
					hints.flows = "Describe the key user flows or processes";
					break;
			}
		} else if (type === "plan") {
			switch (stepId) {
				case "context_discovery":
					hints.tool_usage =
						"Use: query({ entity_id: 'req-001-...' }) and query for components";
					break;
				case "technology_stack_research":
					hints.tool_usage =
						"Use: context7 for libraries, WebFetch for patterns";
					break;
				case "constitution_compliance":
					hints.tool_usage = "Use: query({ types: ['constitution'] })";
					break;
				case "similar_plans_review":
					hints.tool_usage =
						"Use: query({ types: ['plan'], search_terms: '...' })";
					break;
			}
		} else if (type === "constitution") {
			switch (stepId) {
				case "research_existing_constitutions":
					hints.tool_usage =
						"Use: query({ types: ['constitution'], mode: 'full' })";
					break;
				case "best_practices_research":
					hints.tool_usage =
						"Use: WebFetch for industry standards (SOLID, 12-factor, OWASP, etc.)";
					break;
				case "framework_review":
					hints.tool_usage =
						"Use: context7 for framework-specific best practices";
					break;
				case "conflict_check":
					hints.conflict_analysis =
						"State 'no conflicts' or explain conflicts with existing articles";
					break;
			}
		} else if (type === "decision") {
			switch (stepId) {
				case "related_decisions_research":
					hints.tool_usage =
						"Use: query({ types: ['decision'], search_terms: '...' })";
					break;
				case "technology_options_research":
					hints.tool_usage =
						"Use: context7 for libraries, WebFetch for comparisons";
					break;
				case "relationships":
					hints.informed_by_articles =
						"REQUIRED: Reference constitution articles or state none exist";
					break;
			}
		}

		return hints;
	}

	/**
	 * Generate examples for a specific step
	 */
	private generateExamples(
		type: string,
		stepId: string,
	): Record<string, string> {
		const examples: Record<string, string> = {};

		// Add type-specific examples based on step
		if (type === "requirement") {
			switch (stepId) {
				case "research_similar_requirements":
					examples.research_findings =
						"Found req-003-password-reset which is similar but focuses only on email-based reset. This requirement will cover additional methods (SMS, authenticator app).";
					break;
				case "constitution_review":
					examples.constitution_articles =
						'["con-001-security/art-002", "con-001-security/art-005"]';
					examples.no_constitutions = "false (or true if none exist)";
					break;
				case "technology_research":
					examples.technology_research =
						"Researched passport.js via context7 - supports multiple strategies. WebFetch review of OAuth 2.0 standards confirms best practices.";
					break;
				case "problem_identification":
					examples.description =
						"Users need to reset their passwords because they frequently forget their credentials, resulting in support tickets and user frustration.";
					break;
				case "measurability":
					examples.criteria =
						'["Password reset completes in under 3 steps", "User receives reset email within 30 seconds", "Password meets security requirements (min 8 chars, uppercase, number)"]';
					break;
				case "priority_assignment":
					examples.priority = "critical";
					break;
			}
		} else if (type === "component") {
			switch (stepId) {
				case "research_existing_components":
					examples.component_research =
						"Query found lib-002-auth-utils with similar functionality but lacks OAuth support needed for this component.";
					break;
				case "library_research":
					examples.library_research =
						"Researched express via context7 - mature framework with extensive middleware ecosystem. Compared to fastify (faster but less mature).";
					break;
				case "constitution_alignment":
					examples.constitution_articles = '["con-001-architecture/art-001"]';
					break;
				case "duplicate_prevention":
					examples.justification =
						"Existing lib-002-auth-utils lacks OAuth support and cannot be extended due to its tightly coupled architecture. Third-party libraries like passport.js don't meet our security compliance requirements.";
					break;
			}
		}

		return examples;
	}

	/**
	 * Cleanup on destroy
	 */
	destroy(): void {
		this.draftManager.destroy();
	}
}

// Global helper instance - shared across all tool calls to maintain draft state
let globalHelper: CreationFlowHelper | null = null;

export function getCreationFlowHelper(specsPath?: string): CreationFlowHelper {
	if (!globalHelper) {
		globalHelper = new CreationFlowHelper(specsPath);
	}
	return globalHelper;
}

// For backward compatibility with tests
export const creationFlowHelper = getCreationFlowHelper();
