import { describe, expect, it } from "vitest";
import { FileManager } from "../src/storage/file-manager";
import { SpecManager } from "../src/core/spec-manager";
import { SpecMetadataMigrator } from "../src/migration/spec-metadata-migrator";
import { useTempDir } from "./helpers";

describe("SpecMetadataMigrator", () => {
	const { createTempDir } = useTempDir();

	it("should initialize specs.json from existing requirements", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const sm = new SpecManager(tempDir);
		const migrator = new SpecMetadataMigrator(fm, sm);

		// Create some requirements without specs.json
		await sm.requirements.create({
			type: "requirement",
			name: "First",
			description: "First requirement",
			slug: "first",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "high",
			criteria: [{ id: "crit-001", description: "Test", status: "needs-review" }],
			status: { verified: false, verified_at: null, notes: [] },
		});

		await sm.requirements.create({
			type: "requirement",
			name: "Second",
			description: "Second requirement",
			slug: "second",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [{ id: "crit-001", description: "Test", status: "needs-review" }],
			status: { verified: false, verified_at: null, notes: [] },
		});

		await sm.requirements.create({
			type: "requirement",
			name: "Third",
			description: "Third requirement",
			slug: "third",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "low",
			criteria: [{ id: "crit-001", description: "Test", status: "needs-review" }],
			status: { verified: false, verified_at: null, notes: [] },
		});

		// Delete specs.json to simulate fresh start (before migration tool)
		await fm.delete("specs.json");
		fm.invalidateMetadataCache();

		// Run migration
		const result = await migrator.migrateFromExistingSpecs();

		expect(result.migrated).toBe(true);
		expect(result.lastIds.requirement).toBe(3);
		expect(await fm.exists("specs.json")).toBe(true);

		// Verify next requirement will get ID 4
		const nextId = await fm.getNextId("requirement");
		expect(nextId).toBe(4);
	});

	it("should handle multiple entity types", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const sm = new SpecManager(tempDir);
		const migrator = new SpecMetadataMigrator(fm, sm);

		// Create requirements
		await sm.requirements.create({
			type: "requirement",
			name: "Req 1",
			description: "Description",
			slug: "req-1",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "high",
			criteria: [{ id: "crit-001", description: "Test", status: "needs-review" }],
			status: { verified: false, verified_at: null, notes: [] },
		});

		await sm.requirements.create({
			type: "requirement",
			name: "Req 2",
			description: "Description",
			slug: "req-2",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [{ id: "crit-001", description: "Test", status: "needs-review" }],
			status: { verified: false, verified_at: null, notes: [] },
		});

		// Create components
		await sm.components.create({
			type: "component",
			name: "Component 1",
			description: "Description",
			slug: "component-1",
			component_type: "service",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "high",
			responsibilities: [],
		});

		// Delete specs.json and reset cache
		await fm.delete("specs.json");
		fm.invalidateMetadataCache();

		// Run migration
		const result = await migrator.migrateFromExistingSpecs();

		expect(result.migrated).toBe(true);
		expect(result.lastIds.requirement).toBe(2);
		expect(result.lastIds.component).toBe(1);
		expect(result.lastIds.plan).toBe(0);
	});

	it("should skip migration if specs.json exists", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const sm = new SpecManager(tempDir);
		const migrator = new SpecMetadataMigrator(fm, sm);

		// Create initial metadata
		await fm.loadMetadata();
		await fm.getNextId("requirement");
		await fm.getNextId("requirement");

		// Run migration - should skip
		const result = await migrator.migrateFromExistingSpecs();

		expect(result.migrated).toBe(false);
		expect(result.lastIds.requirement).toBe(2);
	});

	it("should handle empty specs folder", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const sm = new SpecManager(tempDir);
		const migrator = new SpecMetadataMigrator(fm, sm);

		// Run migration with no existing specs
		const result = await migrator.migrateFromExistingSpecs();

		expect(result.migrated).toBe(true);
		expect(result.lastIds.requirement).toBe(0);
		expect(result.lastIds.component).toBe(0);
		expect(await fm.exists("specs.json")).toBe(true);
	});
});
