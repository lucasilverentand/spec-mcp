import type { FileManager } from "../storage/file-manager";
import type { MigrationResult } from "./types";
import type { MigrationRegistry } from "./migration-registry";
import semver from "semver";

/**
 * Runs migrations to update specs to latest format
 */
export class MigrationRunner {
	private fileManager: FileManager;
	private registry: MigrationRegistry;

	constructor(fileManager: FileManager, registry: MigrationRegistry) {
		this.fileManager = fileManager;
		this.registry = registry;
	}

	/**
	 * Run all pending migrations to bring specs up to the latest version
	 */
	async runMigrations(): Promise<MigrationResult> {
		const latestVersion = this.registry.getLatestVersion();

		// If no migrations are registered, nothing to do
		if (!latestVersion) {
			const metadata = await this.fileManager.loadMetadata();
			return {
				migrationsRun: false,
				fromVersion: metadata.version,
				toVersion: metadata.version,
				appliedMigrations: [],
				errors: [],
			};
		}

		return this.runMigrationsToVersion(latestVersion);
	}

	/**
	 * Run migrations up to a specific version
	 */
	async runMigrationsToVersion(targetVersion: string): Promise<MigrationResult> {
		if (!semver.valid(targetVersion)) {
			throw new Error(`Invalid target version: ${targetVersion}`);
		}

		// Load current metadata
		const metadata = await this.fileManager.loadMetadata();
		const currentVersion = metadata.version;

		// Get migrations needed
		const migrationsToRun = this.registry.getMigrationsNeeded(
			currentVersion,
			targetVersion,
		);

		const result: MigrationResult = {
			migrationsRun: migrationsToRun.length > 0,
			fromVersion: currentVersion,
			toVersion: currentVersion,
			appliedMigrations: [],
			errors: [],
		};

		// If no migrations needed, return early
		if (migrationsToRun.length === 0) {
			return result;
		}

		// Run each migration in order
		for (const migration of migrationsToRun) {
			try {
				await migration.migrate(this.fileManager.getBasePath());

				// Update metadata version
				await this.updateVersion(migration.version);

				result.appliedMigrations.push({
					version: migration.version,
					description: migration.description,
				});

				result.toVersion = migration.version;
			} catch (error) {
				result.errors.push({
					version: migration.version,
					error: error instanceof Error ? error.message : String(error),
				});

				// Stop on first error
				break;
			}
		}

		return result;
	}

	/**
	 * Get the current version of the specs
	 */
	async getCurrentVersion(): Promise<string> {
		const metadata = await this.fileManager.loadMetadata();
		return metadata.version;
	}

	/**
	 * Check if migrations are needed
	 */
	async needsMigration(): Promise<boolean> {
		const latestVersion = this.registry.getLatestVersion();
		if (!latestVersion) {
			return false;
		}

		const currentVersion = await this.getCurrentVersion();
		return semver.lt(currentVersion, latestVersion);
	}

	/**
	 * Update the version in specs.json
	 */
	private async updateVersion(version: string): Promise<void> {
		await this.fileManager.updateMetadataVersion(version);
	}
}
