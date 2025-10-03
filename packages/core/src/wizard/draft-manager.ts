import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseYaml, stringifyYaml } from "../transformation/yaml-transformer.js";
import type { Draft } from "./types.js";

/**
 * Manages wizard draft state with file-based persistence
 */
export class DraftManager {
	private drafts: Map<string, Draft> = new Map();
	private cleanupInterval: NodeJS.Timeout | null = null;
	private draftsDir: string;

	constructor(specsBaseDir = ".specs") {
		this.draftsDir = path.join(specsBaseDir, ".drafts");
		// Auto-cleanup expired drafts every hour
		this.cleanupInterval = setInterval(
			() => {
				this.cleanupExpired();
			},
			60 * 60 * 1000,
		);
		// Load existing drafts from filesystem
		this.loadDrafts().catch((err) => {
			console.error("Failed to load drafts:", err);
		});
	}

	/**
	 * Ensure drafts directory exists
	 */
	private async ensureDraftsDir(): Promise<void> {
		try {
			await fs.mkdir(this.draftsDir, { recursive: true });
		} catch (err) {
			console.error("Failed to create drafts directory:", err);
		}
	}

	/**
	 * Load all drafts from filesystem
	 */
	private async loadDrafts(): Promise<void> {
		await this.ensureDraftsDir();
		try {
			const files = await fs.readdir(this.draftsDir);
			for (const file of files) {
				if (file.endsWith(".draft.yml")) {
					const filePath = path.join(this.draftsDir, file);
					const content = await fs.readFile(filePath, "utf-8");
					const draft = parseYaml<Draft>(content);
					// Check if expired
					if (new Date(draft.expires_at) >= new Date()) {
						this.drafts.set(draft.id, draft);
					} else {
						// Delete expired draft file
						await fs.unlink(filePath).catch(() => {});
					}
				}
			}
		} catch (err) {
			console.error("Failed to load drafts:", err);
		}
	}

	/**
	 * Save draft to filesystem
	 */
	private async saveDraft(draft: Draft): Promise<void> {
		await this.ensureDraftsDir();
		const fileName = `${draft.id}.draft.yml`;
		const filePath = path.join(this.draftsDir, fileName);
		const content = stringifyYaml(draft);
		await fs.writeFile(filePath, content, "utf-8");
	}

	/**
	 * Delete draft file from filesystem
	 */
	private async deleteDraftFile(id: string): Promise<void> {
		const fileName = `${id}.draft.yml`;
		const filePath = path.join(this.draftsDir, fileName);
		try {
			await fs.unlink(filePath);
		} catch (err) {
			// Ignore if file doesn't exist
		}
	}

	/**
	 * Create a new draft
	 */
	async create(
		type: "requirement" | "component" | "plan",
		slug?: string,
	): Promise<Draft> {
		const id = this.generateDraftId(type, slug);
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
			data: slug ? { slug } : {},
			validation_results: [],
			created_at: now.toISOString(),
			updated_at: now.toISOString(),
			expires_at: expiresAt.toISOString(),
		};

		this.drafts.set(id, draft);
		await this.saveDraft(draft);
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
	async update(
		id: string,
		data: Partial<Omit<Draft, "id" | "type" | "created_at">>,
	): Promise<Draft | null> {
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
		await this.saveDraft(updated);
		return updated;
	}

	/**
	 * Delete a draft
	 */
	async delete(id: string): Promise<boolean> {
		await this.deleteDraftFile(id);
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
	private async cleanupExpired(): Promise<void> {
		const now = new Date();
		const expired: string[] = [];

		for (const [id, draft] of this.drafts.entries()) {
			if (new Date(draft.expires_at) < now) {
				expired.push(id);
			}
		}

		for (const id of expired) {
			await this.deleteDraftFile(id);
			this.drafts.delete(id);
		}

		if (expired.length > 0) {
			console.log(`Cleaned up ${expired.length} expired drafts`);
		}
	}

	/**
	 * Generate a unique draft ID
	 */
	private generateDraftId(
		type: "requirement" | "component" | "plan",
		slug?: string,
	): string {
		const prefix =
			type === "requirement" ? "req" : type === "component" ? "cmp" : "pln";
		if (slug) {
			const timestamp = Date.now();
			return `draft-${prefix}-${slug}-${timestamp}`;
		}
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
