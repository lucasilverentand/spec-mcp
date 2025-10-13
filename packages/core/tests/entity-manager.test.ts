import {
	type BusinessRequirement,
	BusinessRequirementSchema,
} from "@spec-mcp/schemas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EntityManager } from "../src/entity-manager";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
} from "./helpers";

describe("EntityManager", () => {
	let tempDir: string;
	let entityManager: EntityManager<BusinessRequirement>;

	beforeEach(async () => {
		tempDir = await createTempDir("entity-manager");
		entityManager = new EntityManager<BusinessRequirement>({
			folderPath: tempDir,
			subFolder: "requirements/business",
			idPrefix: "breq",
			entityType: "business-requirement",
			schema: BusinessRequirementSchema,
		});
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("getType", () => {
		it("should return the entity type", () => {
			expect(entityManager.getType()).toBe("business-requirement");
		});
	});

	describe("ensureFolder", () => {
		it("should create the entity subfolder", async () => {
			await entityManager.ensureFolder();
			const exists = await entityManager.entityExists(1);
			// Should not throw when checking existence after folder creation
			expect(exists).toBe(false);
		});
	});

	describe("create", () => {
		it("should create a new entity with number 1", async () => {
			const data = createTestBusinessRequirement({
				slug: "test-requirement",
				name: "Test Requirement",
			});

			const created = await entityManager.create(data);

			expect(created.number).toBe(1);
			expect(created.slug).toBe("test-requirement");
			expect(created.name).toBe("Test Requirement");
		});

		it("should auto-increment numbers", async () => {
			const data1 = createTestBusinessRequirement({
				slug: "req-1",
				name: "Requirement 1",
			});

			const data2 = createTestBusinessRequirement({
				slug: "req-2",
				name: "Requirement 2",
			});

			const created1 = await entityManager.create(data1);
			const created2 = await entityManager.create(data2);

			expect(created1.number).toBe(1);
			expect(created2.number).toBe(2);
		});

		it("should save entity to correct file path", async () => {
			const data = createTestBusinessRequirement({
				slug: "test-req",
				name: "Test",
			});

			const created = await entityManager.create(data);
			const exists = await entityManager.entityExists(created.number);

			expect(exists).toBe(true);
		});

		it("should validate entity with schema", async () => {
			const invalidData = {
				type: "business-requirement",
				slug: "test",
				name: "", // Invalid: empty name
				description: "Test",
			} as unknown as BusinessRequirement;

			await expect(entityManager.create(invalidData)).rejects.toThrow();
		});
	});

	describe("get", () => {
		it("should retrieve an existing entity by number", async () => {
			const data = createTestBusinessRequirement({
				slug: "test-req",
				name: "Test Requirement",
			});

			const created = await entityManager.create(data);
			const retrieved = await entityManager.get(created.number);

			expect(retrieved).not.toBeNull();
			expect(retrieved?.number).toBe(created.number);
			expect(retrieved?.slug).toBe(created.slug);
		});

		it("should return null for non-existent entity", async () => {
			const retrieved = await entityManager.get(999);
			expect(retrieved).toBeNull();
		});

		it("should return null for invalid entity data", async () => {
			// Manually write invalid data
			await entityManager.writeYaml("requirements/business/breq-1.yaml", {
				invalid: "data",
			});

			const retrieved = await entityManager.get(1);
			expect(retrieved).toBeNull();
		});
	});

	describe("getBySlug", () => {
		it("should retrieve an entity by slug", async () => {
			const data = createTestBusinessRequirement({
				slug: "find-me",
				name: "Findable",
			});

			await entityManager.create(data);
			const retrieved = await entityManager.getBySlug("find-me");

			expect(retrieved).not.toBeNull();
			expect(retrieved?.slug).toBe("find-me");
		});

		it("should return null if slug not found", async () => {
			const retrieved = await entityManager.getBySlug("nonexistent");
			expect(retrieved).toBeNull();
		});
	});

	describe("update", () => {
		it("should update an existing entity", async () => {
			const data = createTestBusinessRequirement({
				slug: "update-test",
				name: "Original Name",
				description: "Original description",
			});

			const created = await entityManager.create(data);

			const updated = await entityManager.update(created.number, {
				name: "Updated Name",
				description: "Updated description",
			});

			expect(updated.number).toBe(created.number);
			expect(updated.name).toBe("Updated Name");
			expect(updated.description).toBe("Updated description");
		});

		it("should throw error for non-existent entity", async () => {
			await expect(
				entityManager.update(999, { name: "New Name" }),
			).rejects.toThrow("Entity with number 999 not found");
		});

		it("should persist updates", async () => {
			const data = createTestBusinessRequirement({
				slug: "persist-test",
				name: "Original",
			});

			const created = await entityManager.create(data);
			await entityManager.update(created.number, { name: "Updated" });

			const retrieved = await entityManager.get(created.number);
			expect(retrieved?.name).toBe("Updated");
		});

		it("should not change the entity number", async () => {
			const data = createTestBusinessRequirement({
				slug: "number-test",
				name: "Name",
			});

			const created = await entityManager.create(data);
			const originalNumber = created.number;

			const updated = await entityManager.update(created.number, {
				name: "New Name",
				number: 999, // Attempt to change number
			} as unknown as Partial<BusinessRequirement>);

			expect(updated.number).toBe(originalNumber);
		});
	});

	describe("delete", () => {
		it("should delete an existing entity", async () => {
			const data = createTestBusinessRequirement({
				slug: "delete-test",
				name: "To Delete",
			});

			const created = await entityManager.create(data);
			expect(await entityManager.entityExists(created.number)).toBe(true);

			await entityManager.deleteEntity(created.number);
			expect(await entityManager.entityExists(created.number)).toBe(false);
		});

		it("should throw error for non-existent entity", async () => {
			await expect(entityManager.deleteEntity(999)).rejects.toThrow(
				"Entity with number 999 not found",
			);
		});

		it("should not affect other entities", async () => {
			const data1 = createTestBusinessRequirement({
				slug: "keep-1",
				name: "Keep 1",
			});

			const data2 = createTestBusinessRequirement({
				slug: "delete-me",
				name: "Delete Me",
			});

			const data3 = createTestBusinessRequirement({
				slug: "keep-3",
				name: "Keep 3",
			});

			const entity1 = await entityManager.create(data1);
			const entity2 = await entityManager.create(data2);
			const entity3 = await entityManager.create(data3);

			await entityManager.deleteEntity(entity2.number);

			expect(await entityManager.entityExists(entity1.number)).toBe(true);
			expect(await entityManager.entityExists(entity2.number)).toBe(false);
			expect(await entityManager.entityExists(entity3.number)).toBe(true);
		});
	});

	describe("list", () => {
		it("should return empty array when no entities exist", async () => {
			const entities = await entityManager.list();
			expect(entities).toEqual([]);
		});

		it("should list all entities", async () => {
			const data1 = createTestBusinessRequirement({
				slug: "req-1",
				name: "Requirement 1",
			});

			const data2 = createTestBusinessRequirement({
				slug: "req-2",
				name: "Requirement 2",
			});

			await entityManager.create(data1);
			await entityManager.create(data2);

			const entities = await entityManager.list();
			expect(entities).toHaveLength(2);
			expect(entities[0].slug).toBe("req-1");
			expect(entities[1].slug).toBe("req-2");
		});

		it("should return entities sorted by number", async () => {
			const data1 = createTestBusinessRequirement({
				slug: "req-a",
				name: "A",
			});

			const data2 = createTestBusinessRequirement({
				slug: "req-b",
				name: "B",
			});

			const data3 = createTestBusinessRequirement({
				slug: "req-c",
				name: "C",
			});

			const entity1 = await entityManager.create(data1);
			const entity2 = await entityManager.create(data2);
			const entity3 = await entityManager.create(data3);

			const entities = await entityManager.list();
			expect(entities[0].number).toBe(entity1.number);
			expect(entities[1].number).toBe(entity2.number);
			expect(entities[2].number).toBe(entity3.number);
		});

		it("should skip invalid entities", async () => {
			// Create one valid entity
			const data = createTestBusinessRequirement({
				slug: "valid",
				name: "Valid",
			});

			await entityManager.create(data);

			// Manually write invalid data
			await entityManager.writeYaml("requirements/business/breq-99.yaml", {
				invalid: "data",
			});

			const entities = await entityManager.list();
			expect(entities).toHaveLength(1);
			expect(entities[0].slug).toBe("valid");
		});
	});

	describe("exists", () => {
		it("should return true for existing entity", async () => {
			const data = createTestBusinessRequirement({
				slug: "exists-test",
				name: "Test",
			});

			const created = await entityManager.create(data);
			expect(await entityManager.entityExists(created.number)).toBe(true);
		});

		it("should return false for non-existent entity", async () => {
			expect(await entityManager.entityExists(999)).toBe(false);
		});
	});
});
