import type { Migration } from "./types";
import semver from "semver";

/**
 * Registry for managing available migrations
 */
export class MigrationRegistry {
	private migrations: Map<string, Migration> = new Map();

	/**
	 * Register a migration
	 */
	register(migration: Migration): void {
		if (!semver.valid(migration.version)) {
			throw new Error(
				`Invalid migration version: ${migration.version}. Must be valid semver.`,
			);
		}

		if (this.migrations.has(migration.version)) {
			throw new Error(`Migration for version ${migration.version} already registered`);
		}

		this.migrations.set(migration.version, migration);
	}

	/**
	 * Get all registered migrations
	 */
	getAll(): Migration[] {
		return Array.from(this.migrations.values());
	}

	/**
	 * Get migrations needed to upgrade from one version to another
	 * Returns migrations in order they should be applied
	 */
	getMigrationsNeeded(fromVersion: string, toVersion: string): Migration[] {
		const allMigrations = this.getAll();

		// Filter migrations that are:
		// 1. Greater than fromVersion
		// 2. Less than or equal to toVersion
		const needed = allMigrations.filter((m) => {
			return (
				semver.gt(m.version, fromVersion) &&
				semver.lte(m.version, toVersion)
			);
		});

		// Sort by version ascending
		return needed.sort((a, b) => semver.compare(a.version, b.version));
	}

	/**
	 * Get the latest migration version available
	 */
	getLatestVersion(): string | null {
		const versions = Array.from(this.migrations.keys());
		if (versions.length === 0) {
			return null;
		}
		return semver.maxSatisfying(versions, "*");
	}
}
