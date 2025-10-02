import {
	type Draft,
	DraftManager,
	getStepDefinitions,
	type StepResponse,
	StepValidator,
} from "@spec-mcp/core";

/**
 * Shared wizard helper for all spec tools
 */
export class WizardHelper {
	private draftManager: DraftManager;
	private stepValidator: StepValidator;

	constructor() {
		this.draftManager = new DraftManager();
		this.stepValidator = new StepValidator();
	}

	/**
	 * Start a new wizard session
	 */
	start(type: "requirement" | "component" | "plan"): StepResponse {
		const draft = this.draftManager.create(type);
		const steps = getStepDefinitions(type);
		const firstStep = steps[0];

		if (!firstStep) {
			throw new Error("No steps defined for this spec type");
		}

		return {
			draft_id: draft.id,
			step: 1,
			total_steps: draft.total_steps,
			current_step_name: firstStep.name,
			prompt: firstStep.prompt,
			...(firstStep.next_step ? { next_step: firstStep.next_step } : {}),
		};
	}

	/**
	 * Process a wizard step
	 */
	step(
		draft_id: string,
		data: Record<string, unknown>,
	): StepResponse | { error: string } {
		const draft = this.draftManager.get(draft_id);
		if (!draft) {
			return { error: `Draft not found: ${draft_id}` };
		}

		const steps = getStepDefinitions(draft.type);
		const currentStepIndex = draft.current_step - 1;

		if (currentStepIndex >= steps.length) {
			return {
				error:
					"All steps completed. Use 'finalize' operation to create the spec.",
			};
		}

		const currentStep = steps[currentStepIndex];
		if (!currentStep) {
			return { error: "Invalid step index" };
		}

		// Merge new data with existing draft data
		const updatedData = { ...draft.data, ...data };

		// Validate current step
		const validation = this.stepValidator.validate(
			currentStep.id,
			updatedData,
			currentStep.validation_rules,
		);

		// Update draft with new data and validation
		const updatedDraft = this.draftManager.update(draft_id, {
			data: updatedData,
			validation_results: [...draft.validation_results, validation],
		});

		if (!updatedDraft) {
			return { error: `Failed to update draft: ${draft_id}` };
		}

		// If validation failed, return error with suggestions
		if (!validation.passed) {
			return {
				draft_id,
				step: draft.current_step,
				total_steps: draft.total_steps,
				current_step_name: currentStep.name,
				prompt: currentStep.prompt,
				validation,
			};
		}

		// Move to next step
		const nextStepIndex = currentStepIndex + 1;
		if (nextStepIndex >= steps.length) {
			// All steps complete
			return {
				draft_id,
				step: draft.current_step,
				total_steps: draft.total_steps,
				current_step_name: currentStep.name,
				prompt:
					"All steps completed! Use 'finalize' operation to create the spec.",
				completed: true,
			};
		}

		const nextStep = steps[nextStepIndex];
		if (!nextStep) {
			return { error: "Invalid next step index" };
		}

		const finalDraft = this.draftManager.update(draft_id, {
			current_step: nextStepIndex + 1,
		});

		if (!finalDraft) {
			return { error: `Failed to advance to next step: ${draft_id}` };
		}

		return {
			draft_id,
			step: nextStepIndex + 1,
			total_steps: draft.total_steps,
			current_step_name: nextStep.name,
			prompt: nextStep.prompt,
			validation,
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
			currentStep.id,
			draft.data,
			currentStep.validation_rules,
		);

		return {
			draft_id,
			step: draft.current_step,
			total_steps: draft.total_steps,
			current_step_name: currentStep.name,
			prompt: currentStep.prompt,
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
	deleteDraft(draft_id: string): boolean {
		return this.draftManager.delete(draft_id);
	}

	/**
	 * Cleanup on destroy
	 */
	destroy(): void {
		this.draftManager.destroy();
	}
}

// Global wizard helper instance
export const wizardHelper = new WizardHelper();
