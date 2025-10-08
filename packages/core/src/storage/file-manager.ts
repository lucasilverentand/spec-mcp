import type {
	SpecsMetadata,
	EntityType,
} from "@spec-mcp/schemas";
import {
	SpecsMetadataSchema,
	DEFAULT_SPECS_METADATA,
	getNextIdForType,
	setLastIdForType,
} from "@spec-mcp/schemas";
import { BaseFileManager } from "./base-file-manager";

/**
 * File manager for the specs folder
 *
 * Extends BaseFileManager to add specs-specific functionality like
 * metadata management and ID tracking.
 */
export class FileManager extends BaseFileManager {
	private metadataFile = "specs.json";
	private metadataCache: SpecsMetadata | null = null;

	/**
	 * Get the base path (alias for getFolderPath for backwards compatibility)
	 */
	getBasePath(): string {
		return this.getFolderPath();
	}

	/**
	 * Ensure a directory exists
	 */
	async ensureDir(dirPath: string): Promise<void> {
		await this.ensureSubDir(dirPath);
	}

	/**
	 * Load specs metadata from specs.json
	 * Creates default metadata if file doesn't exist
	 */
	async loadMetadata(): Promise<SpecsMetadata> {
		if (this.metadataCache) {
			return this.metadataCache;
		}

		try {
			const data = await this.readJson<unknown>(this.metadataFile);
			this.metadataCache = SpecsMetadataSchema.parse(data);
			return this.metadataCache;
		} catch (error) {
			// If file doesn't exist, create default metadata
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				this.metadataCache = { ...DEFAULT_SPECS_METADATA };
				await this.saveMetadata(this.metadataCache);
				return this.metadataCache;
			}
			throw error;
		}
	}

	/**
	 * Save specs metadata to specs.json
	 */
	private async saveMetadata(metadata: SpecsMetadata): Promise<void> {
		await this.writeJson(this.metadataFile, metadata);
		this.metadataCache = metadata;
	}

	/**
	 * Get the next available ID for an entity type and increment the counter
	 */
	async getNextId(entityType: EntityType): Promise<number> {
		const metadata = await this.loadMetadata();
		const nextId = getNextIdForType(metadata, entityType);
		const updatedMetadata = setLastIdForType(metadata, entityType, nextId);
		await this.saveMetadata(updatedMetadata);
		return nextId;
	}

	/**
	 * Get the current last ID for an entity type without incrementing
	 */
	async getLastId(entityType: EntityType): Promise<number> {
		const metadata = await this.loadMetadata();
		return metadata.lastIds[entityType];
	}

	/**
	 * Update the version in specs.json
	 * This should be called by the migration system when updating spec formats
	 */
	async updateMetadataVersion(version: string): Promise<void> {
		const metadata = await this.loadMetadata();
		metadata.version = version;
		await this.writeJson("specs.json", metadata);
		this.metadataCache = metadata;
	}

	/**
	 * Invalidate the metadata cache
	 * Useful for testing or when metadata is modified externally
	 */
	invalidateMetadataCache(): void {
		this.metadataCache = null;
	}
}
