import { describe, it, expect, beforeEach } from "vitest";
import { MigrationRegistry } from "../src/migration/migration-registry";
import type { Migration } from "../src/migration/types";

describe("MigrationRegistry", () => {
	let registry: MigrationRegistry;

	beforeEach(() => {
		registry = new MigrationRegistry();
	});

	describe("register", () => {
		it("should register a valid migration", () => {
			const migration: Migration = {
				version: "1.1.0",
				description: "Test migration",
				migrate: async () => {},
			};

			registry.register(migration);
			expect(registry.getAll()).toHaveLength(1);
			expect(registry.getAll()[0]).toBe(migration);
		});

		it("should throw error for invalid semver version", () => {
			const migration: Migration = {
				version: "invalid",
				description: "Test migration",
				migrate: async () => {},
			};

			expect(() => registry.register(migration)).toThrow(
				"Invalid migration version",
			);
		});

		it("should throw error for duplicate version", () => {
			const migration1: Migration = {
				version: "1.1.0",
				description: "Test migration 1",
				migrate: async () => {},
			};

			const migration2: Migration = {
				version: "1.1.0",
				description: "Test migration 2",
				migrate: async () => {},
			};

			registry.register(migration1);
			expect(() => registry.register(migration2)).toThrow(
				"Migration for version 1.1.0 already registered",
			);
		});
	});

	describe("getAll", () => {
		it("should return empty array when no migrations registered", () => {
			expect(registry.getAll()).toEqual([]);
		});

		it("should return all registered migrations", () => {
			const migration1: Migration = {
				version: "1.1.0",
				description: "Test migration 1",
				migrate: async () => {},
			};

			const migration2: Migration = {
				version: "1.2.0",
				description: "Test migration 2",
				migrate: async () => {},
			};

			registry.register(migration1);
			registry.register(migration2);

			expect(registry.getAll()).toHaveLength(2);
		});
	});

	describe("getMigrationsNeeded", () => {
		beforeEach(() => {
			const migrations: Migration[] = [
				{
					version: "1.1.0",
					description: "Migration 1.1.0",
					migrate: async () => {},
				},
				{
					version: "1.2.0",
					description: "Migration 1.2.0",
					migrate: async () => {},
				},
				{
					version: "1.3.0",
					description: "Migration 1.3.0",
					migrate: async () => {},
				},
				{
					version: "2.0.0",
					description: "Migration 2.0.0",
					migrate: async () => {},
				},
			];

			for (const migration of migrations) {
				registry.register(migration);
			}
		});

		it("should return migrations in order", () => {
			const needed = registry.getMigrationsNeeded("1.0.0", "2.0.0");
			expect(needed).toHaveLength(4);
			expect(needed[0].version).toBe("1.1.0");
			expect(needed[1].version).toBe("1.2.0");
			expect(needed[2].version).toBe("1.3.0");
			expect(needed[3].version).toBe("2.0.0");
		});

		it("should exclude migrations before fromVersion", () => {
			const needed = registry.getMigrationsNeeded("1.1.0", "2.0.0");
			expect(needed).toHaveLength(3);
			expect(needed[0].version).toBe("1.2.0");
			expect(needed[1].version).toBe("1.3.0");
			expect(needed[2].version).toBe("2.0.0");
		});

		it("should exclude migrations after toVersion", () => {
			const needed = registry.getMigrationsNeeded("1.0.0", "1.2.0");
			expect(needed).toHaveLength(2);
			expect(needed[0].version).toBe("1.1.0");
			expect(needed[1].version).toBe("1.2.0");
		});

		it("should return empty array when no migrations needed", () => {
			const needed = registry.getMigrationsNeeded("2.0.0", "2.0.0");
			expect(needed).toEqual([]);
		});

		it("should return empty array when fromVersion is greater than toVersion", () => {
			const needed = registry.getMigrationsNeeded("2.0.0", "1.0.0");
			expect(needed).toEqual([]);
		});
	});

	describe("getLatestVersion", () => {
		it("should return null when no migrations registered", () => {
			expect(registry.getLatestVersion()).toBeNull();
		});

		it("should return the highest version", () => {
			const migrations: Migration[] = [
				{
					version: "1.1.0",
					description: "Migration 1.1.0",
					migrate: async () => {},
				},
				{
					version: "2.0.0",
					description: "Migration 2.0.0",
					migrate: async () => {},
				},
				{
					version: "1.5.0",
					description: "Migration 1.5.0",
					migrate: async () => {},
				},
			];

			for (const migration of migrations) {
				registry.register(migration);
			}

			expect(registry.getLatestVersion()).toBe("2.0.0");
		});
	});
});
