import type { EntityType } from "@spec-mcp/schemas";
import type { ZodType, ZodTypeDef } from "zod";
import { BaseFileManager } from "../storage/base-file-manager";

/**
 * Abstract base class for managing entities of a specific type
 *
 * Extends BaseFileManager to provide entity-specific operations like
 * CRUD operations, validation, and ID management within a specific folder.
 */
export abstract class EntityManager<
	T extends { slug: string; number: number },
> extends BaseFileManager {
	protected entityType: EntityType;
	protected schema: ZodType<T, ZodTypeDef, unknown>;
	protected subFolder: string;

	constructor(
		folderPath: string,
		subFolder: string,
		entityType: EntityType,
		schema: ZodType<T, ZodTypeDef, unknown>,
	) {
		super(folderPath);
		this.subFolder = subFolder;
		this.entityType = entityType;
		this.schema = schema;
	}

	/**
	 * Get the draft manager for this entity type
	 * Note: This is now implemented by type-specific managers that have their own workflow logic
	 */
	abstract createDraftManager(): unknown;

	/**
	 * Get the entity type
	 */
	getType(): EntityType {
		return this.entityType;
	}

	/**
	 * Get the file path for an entity
	 */
	private getFilePath(slug: string): string {
		return `${this.subFolder}/${slug}.yaml`;
	}

	/**
	 * Ensure the entity folder exists
	 */
	override async ensureFolder(): Promise<void> {
		await this.ensureSubDir(this.subFolder);
	}

	/**
	 * Check if an entity exists
	 */
	override async exists(slug: string): Promise<boolean> {
		return super.exists(this.getFilePath(slug));
	}

	/**
	 * Get an entity by slug
	 */
	async get(slug: string): Promise<T | null> {
		try {
			const exists = await this.exists(slug);
			if (!exists) {
				return null;
			}
			const data = await this.readYaml<T>(this.getFilePath(slug));
			// Validate with schema
			return this.schema.parse(data);
		} catch {
			return null;
		}
	}

	/**
	 * Create a new entity
	 */
	async create(data: Omit<T, "number">): Promise<T> {
		await this.ensureFolder();
		const number = await this.getNextNumber();
		const entity = { ...data, number } as T;
		// Validate with schema
		const validated = this.schema.parse(entity);
		await this.writeYaml(this.getFilePath(validated.slug), validated);
		return validated;
	}

	/**
	 * Update an existing entity
	 */
	async update(slug: string, data: Partial<T>): Promise<T> {
		const existing = await this.get(slug);
		if (!existing) {
			throw new Error(`Entity with slug "${slug}" not found`);
		}
		const updated = { ...existing, ...data } as T;
		// Validate with schema
		const validated = this.schema.parse(updated);
		await this.writeYaml(this.getFilePath(slug), validated);
		return validated;
	}

	/**
	 * Save an entity (create or update)
	 */
	async save(entity: T): Promise<void> {
		await this.ensureFolder();
		// Validate with schema
		const validated = this.schema.parse(entity);
		await this.writeYaml(this.getFilePath(validated.slug), validated);
	}

	/**
	 * Delete an entity by slug
	 */
	override async delete(slug: string): Promise<void> {
		await super.delete(this.getFilePath(slug));
	}

	/**
	 * List all entity slugs
	 */
	async listSlugs(): Promise<string[]> {
		return this.listFiles(this.subFolder);
	}

	/**
	 * List all entities
	 */
	async list(): Promise<T[]> {
		const slugs = await this.listSlugs();
		const entities = await Promise.all(
			slugs.map(async (slug) => {
				const entity = await this.get(slug);
				return entity;
			}),
		);
		return entities.filter((e) => e !== null) as T[];
	}

	/**
	 * Get the next available number for this entity type
	 * Note: This must be implemented by subclasses to provide ID tracking
	 */
	protected abstract getNextNumber(): Promise<number>;
}
