/**
 * Represents a single migration that can be applied to update specs
 */
export interface Migration {
	/** Version this migration upgrades to (semver format) */
	version: string;

	/** Human-readable description of what this migration does */
	description: string;

	/**
	 * Execute the migration
	 * @param specsPath - Path to the specs folder
	 * @returns Promise that resolves when migration is complete
	 */
	migrate(specsPath: string): Promise<void>;
}

/**
 * Result of running migrations
 */
export interface MigrationResult {
	/** Whether any migrations were run */
	migrationsRun: boolean;

	/** Version before migration */
	fromVersion: string;

	/** Version after migration */
	toVersion: string;

	/** List of migrations that were applied */
	appliedMigrations: Array<{
		version: string;
		description: string;
	}>;

	/** Any errors that occurred */
	errors: Array<{
		version: string;
		error: string;
	}>;
}
