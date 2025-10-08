import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MigrationRunner } from "../src/migration/migration-runner";
import { MigrationRegistry } from "../src/migration/migration-registry";
import { FileManager } from "../src/storage/file-manager";
import type { Migration } from "../src/migration/types";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("MigrationRunner", () => {
	let tempDir: string;
	let fileManager: FileManager;
	let registry: MigrationRegistry;
	let runner: MigrationRunner;

	beforeEach(async () => {
		// Create temporary directory
		tempDir = mkdtempSync(join(tmpdir(), "migration-test-"));
		fileManager = new FileManager(tempDir);
		registry = new MigrationRegistry();
		runner = new MigrationRunner(fileManager, registry);

		// Initialize metadata with version 1.0.0
		await fileManager.loadMetadata();
	});

	afterEach(() => {
		// Clean up temporary directory
		rmSync(tempDir, { recursive: true, force: true });
	});

	describe("runMigrations", () => {
		it("should return early when no migrations registered", async () => {
			const result = await runner.runMigrations();

			expect(result.migrationsRun).toBe(false);
			expect(result.fromVersion).toBe("1.0.0");
			expect(result.toVersion).toBe("1.0.0");
			expect(result.appliedMigrations).toEqual([]);
			expect(result.errors).toEqual([]);
		});

		it("should run all pending migrations", async () => {
			const migrationExecutions: string[] = [];

			const migration1: Migration = {
				version: "1.1.0",
				description: "Migration to 1.1.0",
				migrate: async () => {
					migrationExecutions.push("1.1.0");
				},
			};

			const migration2: Migration = {
				version: "1.2.0",
				description: "Migration to 1.2.0",
				migrate: async () => {
					migrationExecutions.push("1.2.0");
				},
			};

			registry.register(migration1);
			registry.register(migration2);

			const result = await runner.runMigrations();

			expect(result.migrationsRun).toBe(true);
			expect(result.fromVersion).toBe("1.0.0");
			expect(result.toVersion).toBe("1.2.0");
			expect(result.appliedMigrations).toHaveLength(2);
			expect(result.appliedMigrations[0].version).toBe("1.1.0");
			expect(result.appliedMigrations[1].version).toBe("1.2.0");
			expect(result.errors).toEqual([]);
			expect(migrationExecutions).toEqual(["1.1.0", "1.2.0"]);

			// Verify version was updated in metadata
			const currentVersion = await runner.getCurrentVersion();
			expect(currentVersion).toBe("1.2.0");
		});

		it("should stop on first error", async () => {
			const migrationExecutions: string[] = [];

			const migration1: Migration = {
				version: "1.1.0",
				description: "Migration to 1.1.0",
				migrate: async () => {
					migrationExecutions.push("1.1.0");
				},
			};

			const migration2: Migration = {
				version: "1.2.0",
				description: "Migration to 1.2.0",
				migrate: async () => {
					throw new Error("Migration failed");
				},
			};

			const migration3: Migration = {
				version: "1.3.0",
				description: "Migration to 1.3.0",
				migrate: async () => {
					migrationExecutions.push("1.3.0");
				},
			};

			registry.register(migration1);
			registry.register(migration2);
			registry.register(migration3);

			const result = await runner.runMigrations();

			expect(result.migrationsRun).toBe(true);
			expect(result.appliedMigrations).toHaveLength(1);
			expect(result.appliedMigrations[0].version).toBe("1.1.0");
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].version).toBe("1.2.0");
			expect(result.errors[0].error).toBe("Migration failed");
			expect(result.toVersion).toBe("1.1.0");
			expect(migrationExecutions).toEqual(["1.1.0"]);

			// Verify version was updated to last successful migration
			const currentVersion = await runner.getCurrentVersion();
			expect(currentVersion).toBe("1.1.0");
		});
	});

	describe("runMigrationsToVersion", () => {
		beforeEach(() => {
			const migrations: Migration[] = [
				{
					version: "1.1.0",
					description: "Migration to 1.1.0",
					migrate: async () => {},
				},
				{
					version: "1.2.0",
					description: "Migration to 1.2.0",
					migrate: async () => {},
				},
				{
					version: "2.0.0",
					description: "Migration to 2.0.0",
					migrate: async () => {},
				},
			];

			for (const migration of migrations) {
				registry.register(migration);
			}
		});

		it("should run migrations up to target version", async () => {
			const result = await runner.runMigrationsToVersion("1.2.0");

			expect(result.migrationsRun).toBe(true);
			expect(result.fromVersion).toBe("1.0.0");
			expect(result.toVersion).toBe("1.2.0");
			expect(result.appliedMigrations).toHaveLength(2);
			expect(result.appliedMigrations[0].version).toBe("1.1.0");
			expect(result.appliedMigrations[1].version).toBe("1.2.0");
		});

		it("should throw error for invalid target version", async () => {
			await expect(
				runner.runMigrationsToVersion("invalid"),
			).rejects.toThrow("Invalid target version");
		});

		it("should return early when no migrations needed", async () => {
			// First run all migrations to 2.0.0
			await runner.runMigrationsToVersion("2.0.0");

			// Try to run again
			const result = await runner.runMigrationsToVersion("2.0.0");

			expect(result.migrationsRun).toBe(false);
			expect(result.fromVersion).toBe("2.0.0");
			expect(result.toVersion).toBe("2.0.0");
			expect(result.appliedMigrations).toEqual([]);
		});
	});

	describe("getCurrentVersion", () => {
		it("should return current version from metadata", async () => {
			const version = await runner.getCurrentVersion();
			expect(version).toBe("1.0.0");
		});

		it("should return updated version after migrations", async () => {
			const migration: Migration = {
				version: "1.1.0",
				description: "Migration to 1.1.0",
				migrate: async () => {},
			};

			registry.register(migration);
			await runner.runMigrations();

			const version = await runner.getCurrentVersion();
			expect(version).toBe("1.1.0");
		});
	});

	describe("needsMigration", () => {
		it("should return false when no migrations registered", async () => {
			const needs = await runner.needsMigration();
			expect(needs).toBe(false);
		});

		it("should return true when migrations are pending", async () => {
			const migration: Migration = {
				version: "1.1.0",
				description: "Migration to 1.1.0",
				migrate: async () => {},
			};

			registry.register(migration);

			const needs = await runner.needsMigration();
			expect(needs).toBe(true);
		});

		it("should return false when all migrations applied", async () => {
			const migration: Migration = {
				version: "1.1.0",
				description: "Migration to 1.1.0",
				migrate: async () => {},
			};

			registry.register(migration);
			await runner.runMigrations();

			const needs = await runner.needsMigration();
			expect(needs).toBe(false);
		});
	});
});
