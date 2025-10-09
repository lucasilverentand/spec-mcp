import type { Base, EntityType } from "@spec-mcp/schemas";
import type { ZodType, ZodTypeDef } from "zod";
import { FileManager } from "./file-manager";

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

	private getFilePath(entity: { number: number; slug: string; draft?: boolean }): string {
		const isDraft = entity.draft ?? false;
		return `${this.subFolder}/${this.idPrefix}-${entity.number}-${entity.slug}${isDraft ? ".draft" : ""}.yml`;
	}

	private getFilePattern(): RegExp {
		// Match: {idPrefix}-{number}-{slug} or {idPrefix}-{number}-{slug}.draft
		// Note: extension is already stripped by listFiles()
		return new RegExp(
			`^${this.idPrefix}-(\\d+)-([a-z0-9-]+)(?:\\.draft)?$`,
		);
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
			if (match && match[1]) {
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
				if (match && match[1]) {
					const fileNumber = Number.parseInt(match[1], 10);
					if (fileNumber === number) {
						const data = await this.readYaml<T>(`${this.subFolder}/${fileName}.yml`);
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
		const entities = await this.list();
		return entities.find((e) => e.slug === slug) || null;
	}

	async create(data: Omit<T, "number">): Promise<T> {
		await this.ensureFolder();
		const number = await this.getNextNumber();
		const now = new Date().toISOString();

		// Add timestamps to status if not present
		const entity = {
			...data,
			number,
			status: {
				...data.status,
				created_at: data.status?.created_at || now,
				updated_at: data.status?.updated_at || now,
			}
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
			}
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
	 * Get the next available number by scanning existing files
	 */
	private async getNextNumber(): Promise<number> {
		const fileNames = await this.listFiles(this.subFolder, ".yml");
		const pattern = this.getFilePattern();
		let maxNumber = 0;

		for (const fileName of fileNames) {
			const match = fileName.match(pattern);
			if (match && match[1]) {
				const number = Number.parseInt(match[1], 10);
				if (number > maxNumber) {
					maxNumber = number;
				}
			}
		}

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
			if (match && match[1]) {
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
}
