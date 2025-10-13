import type { Base, EntityType } from "@spec-mcp/schemas";
import { ID_NUMBER_PADDING } from "@spec-mcp/utils";
import type { ZodType, ZodTypeDef } from "zod";
import { EntityDrafter, type EntityDrafterState } from "./entity-drafter.js";
import { FileManager } from "./file-manager.js";

export type { EntityDrafterState };

interface DraftFile<T extends Base> {
	_draft_metadata: {
		created_at: string;
		updated_at: string;
	};
	_drafter_state: EntityDrafterState<T>;
	entity_data: Partial<T>;
}

export interface ValidationWarning {
	filePath: string;
	fileName: string;
	error: string;
	details?: unknown;
}

export class EntityManager<T extends Base> extends FileManager {
	protected entityType: EntityType;
	protected schema: ZodType<T, ZodTypeDef, unknown>;
	protected subFolder: string;
	protected idPrefix = "";
	private validationWarnings: ValidationWarning[] = [];

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

	/**
	 * Get validation warnings from the last list() operation
	 * Returns files that exist but failed schema validation
	 */
	getValidationWarnings(): ValidationWarning[] {
		return [...this.validationWarnings];
	}

	/**
	 * Check if there are any validation warnings
	 */
	hasValidationWarnings(): boolean {
		return this.validationWarnings.length > 0;
	}

	private getFilePath(entity: {
		number: number;
		slug?: string;
		draft?: boolean;
	}): string {
		// Pad number using standard padding constant
		const paddedNumber = String(entity.number).padStart(ID_NUMBER_PADDING, "0");

		// Check if this is a draft by looking at the draft field
		// Drafts use .draft.yml extension, finalized specs use .yml
		if (entity.draft === true) {
			return `${this.subFolder}/${this.idPrefix}-${paddedNumber}.draft.yml`;
		}
		// For finalized entities, use full naming with slug
		if (!entity.slug) {
			throw new Error("Slug is required for finalized entities");
		}
		return `${this.subFolder}/${this.idPrefix}-${paddedNumber}-${entity.slug}.yml`;
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
		const draftPattern = this.getDraftFilePattern();

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match?.[1]) {
				const fileNumber = Number.parseInt(match[1], 10);
				if (fileNumber === number) {
					return true;
				}
			}

			const draftMatch = fileName.match(draftPattern);
			if (draftMatch?.[1]) {
				const fileNumber = Number.parseInt(draftMatch[1], 10);
				if (fileNumber === number) {
					return true;
				}
			}
		}
		return false;
	}

	async get(number: number): Promise<T | null> {
		try {
			// Find ANY file with this number, regardless of slug or naming pattern
			// File names are completely ignored - we only look at content
			const fileNames = await this.listFiles(this.subFolder, ".yml");

			for (const fileName of fileNames) {
				try {
					// Try to read and parse the file
					const data = await this.readYaml<T>(
						`${this.subFolder}/${fileName}.yml`,
					);

					// Check if the number field matches (from content, not filename)
					if (
						data &&
						typeof data === "object" &&
						"number" in data &&
						data.number === number
					) {
						// Remove undefined values to allow Zod defaults to apply
						const cleaned = this.removeUndefined(data);
						const entity = this.schema.parse(cleaned);

						// Set draft flag based on file extension
						if (fileName.includes(".draft")) {
							(entity as unknown as { draft: boolean }).draft = true;
						}

						return entity;
					}
				} catch {}
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Recursively remove undefined values from an object
	 * This allows Zod defaults to be applied when parsing
	 * Also handles null values for fields that should have defaults
	 */
	private removeUndefined(obj: unknown): unknown {
		if (obj === null) {
			return null;
		}
		if (obj === undefined) {
			return undefined;
		}
		if (Array.isArray(obj)) {
			return obj.map((item) => this.removeUndefined(item));
		}
		if (typeof obj === "object") {
			const cleaned: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(
				obj as Record<string, unknown>,
			)) {
				// Remove undefined values to allow Zod defaults
				if (value === undefined) {
					continue;
				}
				// Also remove null values for array fields that should default to []
				// This is a workaround for YAML/Zod interaction issues
				if (
					value === null &&
					(key === "depends_on" ||
						key === "considerations" ||
						key === "references" ||
						key === "files" ||
						key === "blocked" ||
						key === "tasks" ||
						key === "flows" ||
						key === "test_cases" ||
						key === "criteria" ||
						key === "user_stories" ||
						key === "business_value" ||
						key === "alternatives" ||
						key === "consequences")
				) {
					continue;
				}
				cleaned[key] = this.removeUndefined(value);
			}
			return cleaned;
		}
		return obj;
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
					// Remove undefined values to allow Zod defaults to apply
					const cleaned = this.removeUndefined(data);
					return this.schema.parse(cleaned);
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

		// Add timestamps if not present
		const dataWithTimestamps = data as Partial<Base>;
		const entity = {
			...data,
			number,
			created_at: dataWithTimestamps.created_at || now,
			updated_at: dataWithTimestamps.updated_at || now,
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

		// If slug is being changed, we need to rename the file
		const oldSlug = existing.slug;

		// Clean the incoming data to remove undefined values
		// This prevents undefined from overriding existing values
		const cleanedData = this.removeUndefined(data) as Partial<T>;

		// Update the updated_at timestamp
		const updated = {
			...existing,
			...cleanedData,
			number: existing.number,
			updated_at: new Date().toISOString(),
		} as T;
		const validated = this.schema.parse(updated);

		// If slug changed, delete old file
		if (validated.slug !== oldSlug) {
			await super.delete(this.getFilePath(existing));
		}

		await this.writeYaml(this.getFilePath(validated), validated);
		return validated;
	}

	/**
	 * Get the maximum number from existing files
	 * Used by SpecManager for counter initialization
	 * Now scans ALL YAML files, not just those matching naming pattern
	 */
	async getMaxNumber(): Promise<number> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		let maxNumber = 0;

		// Try to extract number from any file with the expected prefix
		const numberPattern = new RegExp(`^${this.idPrefix}-(\\d+)`);

		for (const fileName of fileNames) {
			const match = fileName.match(numberPattern);
			if (match?.[1]) {
				const number = Number.parseInt(match[1], 10);
				if (number > maxNumber) {
					maxNumber = number;
				}
			} else {
				// Try reading the file to get the number from content
				try {
					const data = await this.readYaml<{ number?: number }>(
						`${this.subFolder}/${fileName}.yml`,
					);
					if (
						data.number &&
						typeof data.number === "number" &&
						data.number > maxNumber
					) {
						maxNumber = data.number;
					}
				} catch {
					// Ignore files that can't be read
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
	 * Loads ALL YAML files regardless of naming patterns - file names are ignored
	 * Only the content (number field) and extension (.draft.yml vs .yml) matter
	 */
	async list(): Promise<T[]> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const entities: T[] = [];
		const processedNumbers = new Set<number>();

		// Clear validation warnings before loading
		this.validationWarnings = [];

		for (const fileName of fileNames) {
			// Try to load the file regardless of naming pattern
			try {
				const data = await this.readYaml<T>(
					`${this.subFolder}/${fileName}.yml`,
				);
				const cleaned = this.removeUndefined(data);
				const entity = this.schema.parse(cleaned);

				// Skip if we already processed this number (avoid duplicates)
				if (processedNumbers.has(entity.number)) {
					const warning: ValidationWarning = {
						filePath: `${this.subFolder}/${fileName}.yml`,
						fileName,
						error: `Duplicate number ${entity.number} - file skipped`,
					};
					this.validationWarnings.push(warning);
					console.warn(
						`Warning: Duplicate number ${entity.number} found in ${this.subFolder}/${fileName}.yml, skipping`,
					);
					continue;
				}

				// Set draft flag based on file extension
				if (fileName.includes(".draft")) {
					(entity as unknown as { draft: boolean }).draft = true;
				}

				entities.push(entity);
				processedNumbers.add(entity.number);
			} catch (error) {
				// File exists but couldn't be parsed or validated
				// Track the error as a validation warning
				const warning: ValidationWarning = {
					filePath: `${this.subFolder}/${fileName}.yml`,
					fileName,
					error: error instanceof Error ? error.message : String(error),
					details: error,
				};
				this.validationWarnings.push(warning);

				// Also log to console for backwards compatibility
				console.error(
					`Error loading ${this.subFolder}/${fileName}.yml: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		// Sort by number
		return entities.sort((a, b) => a.number - b.number);
	}

	/**
	 * Save a draft to disk (without slug - slug is determined at finalization)
	 */
	async saveDraft(drafter: EntityDrafter<T>, number?: number): Promise<number> {
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
