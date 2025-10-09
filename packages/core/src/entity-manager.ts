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

	private getFilePath(slug: string): string {
		return `${this.subFolder}/${slug}.yaml`;
	}

	override async ensureFolder(): Promise<void> {
		await this.ensureSubDir(this.subFolder);
	}

	override async exists(slug: string): Promise<boolean> {
		return super.exists(this.getFilePath(slug));
	}

	async get(slug: string): Promise<T | null> {
		try {
			const exists = await this.exists(slug);
			if (!exists) {
				return null;
			}
			const data = await this.readYaml<T>(this.getFilePath(slug));
			return this.schema.parse(data);
		} catch {
			return null;
		}
	}

	async create(data: Omit<T, "number">): Promise<T> {
		await this.ensureFolder();
		const number = await this.getNextNumber();
		const entity = { ...data, number } as T;
		// Validate with schema
		const validated = this.schema.parse(entity);
		await this.writeYaml(this.getFilePath(validated.slug), validated);
		return validated;
	}

	async update(slug: string, data: Partial<T>): Promise<T> {
		const existing = await this.get(slug);
		if (!existing) {
			throw new Error(`Entity with slug "${slug}" not found`);
		}
		const updated = { ...existing, ...data } as T;
		const validated = this.schema.parse(updated);
		await this.writeYaml(this.getFilePath(slug), validated);
		return validated;
	}
}
