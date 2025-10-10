import type { Base, EntityType } from "@spec-mcp/schemas";
import type { ZodType, ZodTypeDef } from "zod";
import { EntityDrafter, type EntityDrafterState } from "./entity-drafter";
import { FileManager } from "./file-manager";

export type { EntityDrafterState };

interface DraftFile<T extends Base> {
	_draft_metadata: {
		created_at: string;
		updated_at: string;
	};
	_drafter_state: EntityDrafterState<T>;
	entity_data: Partial<T>;
}

export class EntityManager<T extends Base> extends FileManager {
	protected entityType: EntityType;
	protected schema: ZodType<T, ZodTypeDef, unknown>;
	protected subFolder: string;
	protected idPrefix = "";

	constructor({
		folderPath,
		subFolder,
		idPrefix,
		entityType,
		schema,
	}: {
		folderPath: string;
		subFolder: string;
		idPrefix: string;
		entityType: EntityType;
		schema: ZodType<T, ZodTypeDef, unknown>;
	}) {
		super(folderPath);
		this.subFolder = subFolder;
		this.idPrefix = idPrefix;
		this.entityType = entityType;
		this.schema = schema;
	}

	getType(): EntityType {
		return this.entityType;
	}

	private getFilePath(entity: {
		number: number;
		slug?: string;
		draft?: boolean;
	}): string {
		const isDraft = entity.draft ?? false;
		// For drafts, use simple number-based naming; for finalized entities, use full naming
		if (isDraft) {
			return `${this.subFolder}/${this.idPrefix}-${entity.number}.draft.yml`;
		}
		if (!entity.slug) {
			throw new Error("Slug is required for finalized entities");
		}
		return `${this.subFolder}/${this.idPrefix}-${entity.number}-${entity.slug}.yml`;
	}

	private getFilePattern(): RegExp {
		// Match: {idPrefix}-{number}-{slug} for finalized entities
		// Note: extension is already stripped by listFiles()
		// Group 1: number, Group 2: slug
		return new RegExp(`^${this.idPrefix}-(\\d+)-([a-z0-9-]+)$`);
	}

	private getDraftFilePattern(): RegExp {
		// Match: {idPrefix}-{number}.draft for draft files
		// Note: extension is already stripped by listFiles()
		// Group 1: number
		return new RegExp(`^${this.idPrefix}-(\\d+)\\.draft$`);
	}

	override async ensureFolder(): Promise<void> {
		await this.ensureSubDir(this.subFolder);
	}

	async entityExists(number: number): Promise<boolean> {
		// Check if any file with this number exists
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getFilePattern();

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const fileNumber = Number.parseInt(match[1], 10);
				if (fileNumber === number) {
					return true;
				}
			}
		}
		return false;
	}

	async get(number: number): Promise<T | null> {
		try {
			// Find the file with this number
			const fileNames = await this.listFiles(this.subFolder, ".yml");
			const pattern = this.getFilePattern();

			for (const fileName of fileNames) {
				const match = fileName.match(pattern);
				if (match?.[1]) {
					const fileNumber = Number.parseInt(match[1], 10);
					if (fileNumber === number) {
						const data = await this.readYaml<T>(
							`${this.subFolder}/${fileName}.yml`,
						);
						return this.schema.parse(data);
					}
				}
			}
			return null;
		} catch {
			return null;
		}
	}

	async getBySlug(slug: string): Promise<T | null> {
		try {
			const fileNames = await this.listFiles(this.subFolder, ".yml");
			const pattern = this.getFilePattern();

			for (const fileName of fileNames) {
				const match = fileName.match(pattern);
				if (match?.[2] && match[2] === slug) {
					const data = await this.readYaml<T>(
						`${this.subFolder}/${fileName}.yml`,
					);
					return this.schema.parse(data);
				}
			}
			return null;
		} catch {
			return null;
		}
	}

	async create(data: Omit<T, "number">, providedNumber?: number): Promise<T> {
		await this.ensureFolder();
		const number = providedNumber ?? (await this.getNextNumber());
		const now = new Date().toISOString();

		// Add timestamps to status if not present
		const entity = {
			...data,
			number,
			status: {
				...data.status,
				created_at: data.status?.created_at || now,
				updated_at: data.status?.updated_at || now,
			},
		} as T;

		// Validate with schema
		const validated = this.schema.parse(entity);
		await this.writeYaml(this.getFilePath(validated), validated);
		return validated;
	}

	async update(number: number, data: Partial<T>): Promise<T> {
		const existing = await this.get(number);
		if (!existing) {
			throw new Error(`Entity with number ${number} not found`);
		}

		// If slug or draft status is being changed, we need to rename the file
		const oldSlug = existing.slug;
		const oldDraft = existing.draft;

		// Update the updated_at timestamp
		const updated = {
			...existing,
			...data,
			number: existing.number,
			status: {
				...existing.status,
				...(data.status || {}),
				updated_at: new Date().toISOString(),
			},
		} as T;
		const validated = this.schema.parse(updated);

		// If slug or draft status changed, delete old file
		if (validated.slug !== oldSlug || validated.draft !== oldDraft) {
			await super.delete(this.getFilePath(existing));
		}

		await this.writeYaml(this.getFilePath(validated), validated);
		return validated;
	}

	/**
	 * Get the maximum number from existing files
	 * Used by SpecManager for counter initialization
	 */
	async getMaxNumber(): Promise<number> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getFilePattern();
		let maxNumber = 0;

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const number = Number.parseInt(match[1], 10);
				if (number > maxNumber) {
					maxNumber = number;
				}
			}
		}

		return maxNumber;
	}

	/**
	 * Get the next available number
	 * NOTE: This should be called via SpecManager.getNextNumber() for proper centralized tracking
	 * This method is kept for backward compatibility and falls back to file scanning
	 */
	private async getNextNumber(): Promise<number> {
		const maxNumber = await this.getMaxNumber();
		return maxNumber + 1;
	}

	/**
	 * Delete an entity by number
	 */
	async deleteEntity(number: number): Promise<void> {
		const existing = await this.get(number);
		if (!existing) {
			throw new Error(`Entity with number ${number} not found`);
		}
		await super.delete(this.getFilePath(existing));
	}

	/**
	 * List all entities
	 */
	async list(): Promise<T[]> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getFilePattern();
		const entities: T[] = [];

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const number = Number.parseInt(match[1], 10);
				const entity = await this.get(number);
				if (entity) {
					entities.push(entity);
				}
			}
		}

		// Sort by number
		return entities.sort((a, b) => a.number - b.number);
	}

	/**
	 * Save a draft to disk (without slug - slug is determined at finalization)
	 */
	async saveDraft(
		drafter: EntityDrafter<T>,
		number?: number,
	): Promise<number> {
		await this.ensureFolder();

		// Get or assign number
		const draftNumber = number ?? (await this.getNextNumber());

		const now = new Date().toISOString();
		const draftFile: DraftFile<T> = {
			_draft_metadata: {
				created_at: now,
				updated_at: now,
			},
			_drafter_state: drafter.toJSON(),
			entity_data: drafter.data,
		};

		// Check if draft already exists to preserve created_at
		const existing = await this.loadDraftFile(draftNumber);
		if (existing) {
			draftFile._draft_metadata.created_at =
				existing._draft_metadata.created_at;
		}

		const filePath = this.getFilePath({
			number: draftNumber,
			draft: true,
		});

		await this.writeYaml(filePath, draftFile);
		return draftNumber;
	}

	/**
	 * Load a draft from disk
	 */
	async loadDraft(number: number): Promise<EntityDrafter<T> | null> {
		const draftFile = await this.loadDraftFile(number);
		if (!draftFile) {
			return null;
		}

		return EntityDrafter.fromJSON(this.schema, draftFile._drafter_state);
	}

	/**
	 * Load draft state from disk (for use with restoreEntityDrafter)
	 */
	async loadDraftState(number: number): Promise<EntityDrafterState<T> | null> {
		const draftFile = await this.loadDraftFile(number);
		if (!draftFile) {
			return null;
		}
		return draftFile._drafter_state;
	}

	/**
	 * Load draft file (internal helper)
	 */
	private async loadDraftFile(number: number): Promise<DraftFile<T> | null> {
		try {
			const fileNames = await this.listFiles(this.subFolder, ".yml");
			const pattern = this.getDraftFilePattern();

			for (const fileName of fileNames) {
				const match = fileName.match(pattern);
				if (match?.[1]) {
					const fileNumber = Number.parseInt(match[1], 10);
					if (fileNumber === number) {
						const data = await this.readYaml<DraftFile<T>>(
							`${this.subFolder}/${fileName}.yml`,
						);
						return data;
					}
				}
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Delete a draft
	 */
	async deleteDraft(number: number): Promise<void> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getDraftFilePattern();

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const fileNumber = Number.parseInt(match[1], 10);
				if (fileNumber === number) {
					await super.delete(`${this.subFolder}/${fileName}.yml`);
					return;
				}
			}
		}

		throw new Error(`Draft with number ${number} not found`);
	}

	/**
	 * Check if a draft exists
	 */
	async draftExists(number: number): Promise<boolean> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getDraftFilePattern();

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const fileNumber = Number.parseInt(match[1], 10);
				if (fileNumber === number) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Promote a draft to a finalized entity
	 * This deletes the draft file and creates the entity
	 */
	async promoteDraft(drafter: EntityDrafter<T>): Promise<T> {
		if (!drafter.isComplete) {
			throw new Error("Cannot promote draft: drafter is not complete");
		}

		// Create the entity from the drafter's data
		const entity = await this.create(drafter.data as Omit<T, "number">);

		// Try to delete the draft if it exists
		// We don't know the exact number, so we search for it
		const fileNames = await this.listFiles(this.subFolder, ".yml");

		for (const fileName of fileNames) {
			if (fileName.endsWith(".draft")) {
				const draftFile = await this.readYaml<DraftFile<T>>(
					`${this.subFolder}/${fileName}.yml`,
				);
				// Check if this draft's data matches our drafter
				if (
					JSON.stringify(draftFile._drafter_state) ===
					JSON.stringify(drafter.toJSON())
				) {
					await super.delete(`${this.subFolder}/${fileName}.yml`);
					break;
				}
			}
		}

		return entity;
	}

	/**
	 * List all draft numbers
	 */
	async listDrafts(): Promise<number[]> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getDraftFilePattern();
		const draftNumbers: number[] = [];

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const number = Number.parseInt(match[1], 10);
				draftNumbers.push(number);
			}
		}

		return draftNumbers.sort((a, b) => a - b);
	}

	/**
	 * List all drafts with their number (no slug since drafts don't have slugs)
	 */
	async listDraftsWithMetadata(): Promise<Array<{ number: number }>> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getDraftFilePattern();
		const drafts: Array<{ number: number }> = [];

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const number = Number.parseInt(match[1], 10);
				drafts.push({ number });
			}
		}

		return drafts.sort((a, b) => a.number - b.number);
	}
}
