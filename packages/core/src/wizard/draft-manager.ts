import type { Draft } from "./types.js";

/**
 * Manages wizard draft state
 */
export class DraftManager {
	private drafts: Map<string, Draft> = new Map();
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor() {
		// Auto-cleanup expired drafts every hour
		this.cleanupInterval = setInterval(
			() => {
				this.cleanupExpired();
			},
			60 * 60 * 1000,
		);
	}

	/**
	 * Create a new draft
	 */
	create(type: "requirement" | "component" | "plan"): Draft {
		const id = this.generateDraftId(type);
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

		// Determine total steps based on type
		const totalSteps =
			type === "requirement" ? 7 : type === "component" ? 10 : 12;

		const draft: Draft = {
			id,
			type,
			current_step: 1,
			total_steps: totalSteps,
			data: {},
			validation_results: [],
			created_at: now.toISOString(),
			updated_at: now.toISOString(),
			expires_at: expiresAt.toISOString(),
		};

		this.drafts.set(id, draft);
		return draft;
	}

	/**
	 * Get a draft by ID
	 */
	get(id: string): Draft | null {
		const draft = this.drafts.get(id);
		if (!draft) return null;

		// Check if expired
		if (new Date(draft.expires_at) < new Date()) {
			this.drafts.delete(id);
			return null;
		}

		return draft;
	}

	/**
	 * Update a draft
	 */
	update(
		id: string,
		data: Partial<Omit<Draft, "id" | "type" | "created_at">>,
	): Draft | null {
		const draft = this.get(id);
		if (!draft) return null;

		const updated: Draft = {
			...draft,
			...data,
			id: draft.id,
			type: draft.type,
			created_at: draft.created_at,
			updated_at: new Date().toISOString(),
		};

		this.drafts.set(id, updated);
		return updated;
	}

	/**
	 * Delete a draft
	 */
	delete(id: string): boolean {
		return this.drafts.delete(id);
	}

	/**
	 * List all drafts (optionally filtered by type)
	 */
	list(type?: "requirement" | "component" | "plan"): Draft[] {
		const allDrafts = Array.from(this.drafts.values());
		if (!type) return allDrafts;
		return allDrafts.filter((draft) => draft.type === type);
	}

	/**
	 * Cleanup expired drafts
	 */
	private cleanupExpired(): void {
		const now = new Date();
		const expired: string[] = [];

		for (const [id, draft] of this.drafts.entries()) {
			if (new Date(draft.expires_at) < now) {
				expired.push(id);
			}
		}

		for (const id of expired) {
			this.drafts.delete(id);
		}

		if (expired.length > 0) {
			console.log(`Cleaned up ${expired.length} expired drafts`);
		}
	}

	/**
	 * Generate a unique draft ID
	 */
	private generateDraftId(type: "requirement" | "component" | "plan"): string {
		const prefix =
			type === "requirement" ? "req" : type === "component" ? "cmp" : "pln";
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 8);
		return `draft-${prefix}-${timestamp}-${random}`;
	}

	/**
	 * Cleanup on destroy
	 */
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.drafts.clear();
	}
}
