import type { Draft, EntityType } from "@spec-mcp/schemas";
import { DraftSchema } from "@spec-mcp/schemas";
import type { FileManager } from "../storage/file-manager";
import type { CreateDraftResult, SubmitAnswerResult } from "./types";

/**
 * Abstract base class for draft managers
 * Provides common draft file operations while allowing subclasses to define entity-specific workflows
 */
export abstract class BaseDraftManager<T> {
	protected fileManager: FileManager;
	protected draftsFolder = ".drafts";
	protected abstract entityType: EntityType;

	constructor(fileManager: FileManager) {
		this.fileManager = fileManager;
	}

	/**
	 * Get the file path for a draft
	 */
	protected getDraftFilePath(draftId: string): string {
		return `${this.draftsFolder}/${draftId}.yaml`;
	}

	/**
	 * Generate the next available draft ID
	 */
	protected async getNextDraftId(): Promise<string> {
		await this.fileManager.ensureDir(this.draftsFolder);
		const existingDrafts = await this.fileManager.listFiles(
			this.draftsFolder,
			".yaml",
		);

		if (existingDrafts.length === 0) {
			return "draft-001";
		}

		// Extract numbers from draft IDs and find max
		const numbers = existingDrafts
			.map((id) => {
				const match = id.match(/^draft-(\d{3})$/);
				return match ? Number.parseInt(match[1] || "0", 10) : 0;
			})
			.filter((n) => n > 0);

		const maxNumber = Math.max(...numbers, 0);
		const nextNumber = maxNumber + 1;

		return `draft-${String(nextNumber).padStart(3, "0")}`;
	}

	/**
	 * Save a draft to file
	 */
	protected async saveDraft(draft: Draft): Promise<void> {
		const validated = DraftSchema.parse(draft);
		await this.fileManager.writeYaml(this.getDraftFilePath(draft.id), validated);
	}

	/**
	 * Get a draft by ID
	 */
	async getDraft(draftId: string): Promise<Draft | null> {
		try {
			const filePath = this.getDraftFilePath(draftId);
			const exists = await this.fileManager.exists(filePath);

			if (!exists) {
				return null;
			}

			const data = await this.fileManager.readYaml<Draft>(filePath);
			return DraftSchema.parse(data);
		} catch {
			return null;
		}
	}

	/**
	 * Delete a draft after finalization
	 */
	async deleteDraft(draftId: string): Promise<void> {
		const filePath = this.getDraftFilePath(draftId);
		await this.fileManager.delete(filePath);

		// Auto-cleanup: remove .drafts folder if it's now empty
		await this.fileManager.removeEmptyDir(this.draftsFolder);
	}

	/**
	 * List all active drafts of this type
	 */
	async listDrafts(): Promise<string[]> {
		await this.fileManager.ensureDir(this.draftsFolder);
		const allDrafts = await this.fileManager.listFiles(this.draftsFolder, ".yaml");

		// Filter to only this entity type
		const typedDrafts: string[] = [];
		for (const draftFile of allDrafts) {
			const draft = await this.getDraft(draftFile);
			if (draft?.type === this.entityType) {
				typedDrafts.push(draftFile);
			}
		}

		return typedDrafts;
	}

	// Abstract methods - each entity type implements its own workflow
	abstract createDraft(
		name: string,
		description?: string,
	): Promise<CreateDraftResult>;

	abstract submitAnswer(
		draftId: string,
		answer: string,
	): Promise<SubmitAnswerResult>;

	abstract isComplete(draftId: string): Promise<boolean>;

	abstract createFromDraft(draftId: string): Promise<T>;
}
