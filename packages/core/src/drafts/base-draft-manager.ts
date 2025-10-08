import type { Draft, DraftQuestion, EntityType } from "@spec-mcp/schemas";
import { DraftSchema } from "@spec-mcp/schemas";
import { generateSlug } from "@spec-mcp/utils";
import type { FileManager } from "../storage/file-manager";
import type { CreateDraftResult, SubmitAnswerResult } from "./types";

/**
 * Abstract base class for draft managers with embedded workflow logic
 * Provides common draft operations while allowing subclasses to define entity-specific logic
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
	 * Get questions to ask during draft creation
	 * Must be implemented by subclasses to provide entity-specific questions
	 */
	protected abstract getQuestions(
		name: string,
		description?: string,
	): string[];

	/**
	 * Create an entity from a completed draft
	 * Must be implemented by subclasses to handle entity-specific creation logic
	 */
	abstract createFromDraft(draftId: string): Promise<T>;

	/**
	 * Create a new draft
	 */
	async createDraft(
		name: string,
		description?: string,
	): Promise<CreateDraftResult> {
		const questions = this.getQuestions(name, description);

		if (questions.length === 0) {
			throw new Error("At least one question is required");
		}

		const draftId = await this.getNextDraftId();
		const slug = generateSlug(name);
		const now = new Date().toISOString();

		const draftQuestions: DraftQuestion[] = questions.map((question, idx) => {
			// Pre-fill first question with description if provided
			if (idx === 0 && description) {
				return { question, answer: description };
			}
			return { question, answer: null };
		});

		const draft: Draft = {
			id: draftId,
			type: this.entityType,
			name,
			slug,
			questions: draftQuestions,
			currentQuestionIndex: description ? 1 : 0, // Skip first if pre-filled
			created_at: now,
		};

		// Validate with schema
		const validated = DraftSchema.parse(draft);

		// Save to file
		await this.fileManager.writeYaml(this.getDraftFilePath(draftId), validated);

		// Return the first unanswered question
		const firstUnansweredIdx = description ? 1 : 0;
		const firstQuestion = questions[firstUnansweredIdx];
		if (!firstQuestion) {
			throw new Error("No questions provided");
		}

		return {
			draftId,
			firstQuestion,
			totalQuestions: questions.length,
		};
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
	 * Submit an answer to the current question
	 */
	async submitAnswer(
		draftId: string,
		answer: string,
	): Promise<SubmitAnswerResult> {
		const draft = await this.getDraft(draftId);

		if (!draft) {
			throw new Error(`Draft not found: ${draftId}`);
		}

		const currentIndex = draft.currentQuestionIndex;

		if (currentIndex >= draft.questions.length) {
			throw new Error("All questions have already been answered");
		}

		// Update the current question's answer
		const currentQuestion = draft.questions[currentIndex];
		if (!currentQuestion) {
			throw new Error("Current question not found");
		}
		currentQuestion.answer = answer;

		// Move to next question
		const nextIndex = currentIndex + 1;
		draft.currentQuestionIndex = nextIndex;

		// Validate and save
		const validated = DraftSchema.parse(draft);
		await this.fileManager.writeYaml(this.getDraftFilePath(draftId), validated);

		// Check if all questions are answered
		const completed = nextIndex >= draft.questions.length;

		if (completed) {
			return {
				draftId,
				completed: true,
				totalQuestions: draft.questions.length,
			};
		}

		const nextQuestion = draft.questions[nextIndex]?.question;
		if (!nextQuestion) {
			throw new Error("Next question not found");
		}

		return {
			draftId,
			completed: false,
			nextQuestion,
			currentQuestionIndex: nextIndex,
			totalQuestions: draft.questions.length,
		};
	}

	/**
	 * Check if all questions in a draft have been answered
	 */
	async isComplete(draftId: string): Promise<boolean> {
		const draft = await this.getDraft(draftId);

		if (!draft) {
			return false;
		}

		return draft.currentQuestionIndex >= draft.questions.length;
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
}
