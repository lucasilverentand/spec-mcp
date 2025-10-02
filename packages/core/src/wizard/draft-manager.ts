import type { AnyComponent, Plan, Requirement } from "@spec-mcp/data";

/**
 * Draft entity that can be a requirement, component, or plan
 */
export type DraftEntity = Partial<Requirement> | Partial<AnyComponent> | Partial<Plan>;

/**
 * Validation result for a step
 */
export interface ValidationResult {
	step: string;
	passed: boolean;
	issues: string[];
	suggestions: string[];
	strengths: string[];
}

/**
 * Draft state for wizard-based spec creation
 */
export interface Draft {
	id: string; // e.g., "draft-req-001"
	type: "requirement" | "component" | "plan";
	component_type?: "app" | "service" | "library" | "tool"; // For components
	current_step: number;
	total_steps: number;
	data: DraftEntity;
	validation_results: ValidationResult[];
	created_at: string;
	updated_at: string;
	expires_at: string; // Auto-cleanup after 24 hours
}

/**
 * Next step guidance
 */
export interface NextStepGuidance {
	step: number;
	total_steps: number;
	step_id: string;
	name: string;
	description: string;
	prompt: string;
	required_fields: string[];
	current_data: DraftEntity;
	validation: ValidationResult | null;
}

/**
 * Manages draft specs in-memory
 */
export class DraftManager {
	private drafts = new Map<string, Draft>();
	private draftCounter = new Map<string, number>(); // Counters for each type

	/**
	 * Create a new draft
	 */
	createDraft(
		type: "requirement" | "component" | "plan",
		componentType?: "app" | "service" | "library" | "tool",
	): Draft {
		// Increment counter for this type
		const counter = (this.draftCounter.get(type) || 0) + 1;
		this.draftCounter.set(type, counter);

		const draftId = `draft-${type.slice(0, 3)}-${counter.toString().padStart(3, "0")}`;
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

		const draft: Draft = {
			id: draftId,
			type,
			component_type: componentType,
			current_step: 1,
			total_steps: this.getTotalSteps(type),
			data: {},
			validation_results: [],
			created_at: now.toISOString(),
			updated_at: now.toISOString(),
			expires_at: expiresAt.toISOString(),
		};

		this.drafts.set(draftId, draft);
		return draft;
	}

	/**
	 * Get a draft by ID
	 */
	getDraft(draftId: string): Draft | undefined {
		const draft = this.drafts.get(draftId);
		if (!draft) {
			return undefined;
		}

		// Check if expired
		if (new Date(draft.expires_at) < new Date()) {
			this.drafts.delete(draftId);
			return undefined;
		}

		return draft;
	}

	/**
	 * Update draft data
	 */
	updateDraft(draftId: string, data: Partial<DraftEntity>): Draft | undefined {
		const draft = this.getDraft(draftId);
		if (!draft) {
			return undefined;
		}

		draft.data = { ...draft.data, ...data };
		draft.updated_at = new Date().toISOString();
		this.drafts.set(draftId, draft);
		return draft;
	}

	/**
	 * Add validation result
	 */
	addValidationResult(
		draftId: string,
		result: ValidationResult,
	): Draft | undefined {
		const draft = this.getDraft(draftId);
		if (!draft) {
			return undefined;
		}

		draft.validation_results.push(result);
		draft.updated_at = new Date().toISOString();
		this.drafts.set(draftId, draft);
		return draft;
	}

	/**
	 * Advance to next step
	 */
	advanceStep(draftId: string): Draft | undefined {
		const draft = this.getDraft(draftId);
		if (!draft) {
			return undefined;
		}

		if (draft.current_step < draft.total_steps) {
			draft.current_step += 1;
			draft.updated_at = new Date().toISOString();
			this.drafts.set(draftId, draft);
		}

		return draft;
	}

	/**
	 * Go back to previous step
	 */
	previousStep(draftId: string): Draft | undefined {
		const draft = this.getDraft(draftId);
		if (!draft) {
			return undefined;
		}

		if (draft.current_step > 1) {
			draft.current_step -= 1;
			draft.updated_at = new Date().toISOString();
			this.drafts.set(draftId, draft);
		}

		return draft;
	}

	/**
	 * Delete a draft
	 */
	deleteDraft(draftId: string): boolean {
		return this.drafts.delete(draftId);
	}

	/**
	 * List all active drafts
	 */
	listDrafts(): Draft[] {
		const now = new Date();
		// Clean up expired drafts
		for (const [id, draft] of this.drafts.entries()) {
			if (new Date(draft.expires_at) < now) {
				this.drafts.delete(id);
			}
		}
		return Array.from(this.drafts.values());
	}

	/**
	 * Get total steps for a spec type
	 */
	private getTotalSteps(type: "requirement" | "component" | "plan"): number {
		switch (type) {
			case "requirement":
				return 7;
			case "component":
				return 10;
			case "plan":
				return 12;
		}
	}

	/**
	 * Clean up expired drafts (call periodically)
	 */
	cleanup(): number {
		const now = new Date();
		let count = 0;
		for (const [id, draft] of this.drafts.entries()) {
			if (new Date(draft.expires_at) < now) {
				this.drafts.delete(id);
				count++;
			}
		}
		return count;
	}
}
