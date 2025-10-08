import type { EntityType } from "@spec-mcp/schemas";
import type { FileManager } from "../storage/file-manager";
import type { SpecManager } from "../core/spec-manager";

/**
 * Utility to migrate existing specs to use centralized ID tracking
 * Scans all existing spec files and initializes specs.json with the highest IDs
 */
export class SpecMetadataMigrator {
	private fileManager: FileManager;
	private specManager: SpecManager;

	constructor(fileManager: FileManager, specManager: SpecManager) {
		this.fileManager = fileManager;
		this.specManager = specManager;
	}

	/**
	 * Scan all existing specs and initialize specs.json with correct last IDs
	 * This ensures new specs won't conflict with existing ones
	 */
	async migrateFromExistingSpecs(): Promise<{
		migrated: boolean;
		lastIds: Record<EntityType, number>;
	}> {
		// Check if specs.json already exists
		const metadataExists = await this.fileManager.exists("specs.json");
		if (metadataExists) {
			const metadata = await this.fileManager.loadMetadata();
			return {
				migrated: false,
				lastIds: metadata.lastIds,
			};
		}

		// Get max ID for each entity type by reading all existing files
		const entityTypes: EntityType[] = [
			"requirement",
			"component",
			"plan",
			"constitution",
			"decision",
			"app",
		];

		const lastIds: Record<EntityType, number> = {
			requirement: 0,
			component: 0,
			plan: 0,
			constitution: 0,
			decision: 0,
			app: 0,
		};

		for (const entityType of entityTypes) {
			const maxId = await this.getMaxIdForType(entityType);
			lastIds[entityType] = maxId;
		}

		// Initialize metadata with the discovered IDs
		// This will create the specs.json file
		await this.fileManager.loadMetadata();

		// Update each entity type's last ID
		for (const [type, lastId] of Object.entries(lastIds)) {
			if (lastId > 0) {
				// Get next ID up to the max, this will update the metadata
				for (let i = 1; i <= lastId; i++) {
					await this.fileManager.getNextId(type as EntityType);
				}
			}
		}

		return {
			migrated: true,
			lastIds,
		};
	}

	/**
	 * Get the maximum ID currently in use for a given entity type
	 */
	private async getMaxIdForType(entityType: EntityType): Promise<number> {
		try {
			let entities: Array<{ number: number }> = [];

			switch (entityType) {
				case "requirement":
					entities = await this.specManager.requirements.list();
					break;
				case "component":
					entities = await this.specManager.components.list();
					break;
				case "plan":
					entities = await this.specManager.plans.list();
					break;
				case "constitution":
					entities = await this.specManager.constitutions.list();
					break;
				case "decision":
					entities = await this.specManager.decisions.list();
					break;
				case "app":
					// App entities aren't implemented yet, return 0
					return 0;
			}

			if (entities.length === 0) {
				return 0;
			}

			return Math.max(...entities.map((e) => e.number));
		} catch {
			// If the folder doesn't exist or there's an error, return 0
			return 0;
		}
	}
}
