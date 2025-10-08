import type { Requirement } from "@spec-mcp/schemas";
import { describe, expect, it } from "vitest";
import { RequirementManager } from "../src/managers/requirement-manager";
import { useTempDir } from "./helpers";

describe("EntityManager", () => {
	const { createTempDir } = useTempDir();

	it("should create entity with auto-incrementing number", async () => {
		const tempDir = await createTempDir();
		const rm = new RequirementManager(tempDir);

		const req1 = await rm.create({
			type: "requirement",
			slug: "test-req-1",
			name: "Test Requirement 1",
			description: "First test",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		const req2 = await rm.create({
			type: "requirement",
			slug: "test-req-2",
			name: "Test Requirement 2",
			description: "Second test",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "high",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		expect(req1.number).toBe(1);
		expect(req2.number).toBe(2);
	});

	it("should get entity by slug", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		const created = await rm.create({
			type: "requirement",
			slug: "get-test",
			name: "Get Test",
			description: "Test get",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "low",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		const retrieved = await rm.get("get-test");
		expect(retrieved).toEqual(created);
	});

	it("should return null for non-existent entity", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		const retrieved = await rm.get("nonexistent");
		expect(retrieved).toBeNull();
	});

	it("should update entity", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		await rm.create({
			type: "requirement",
			slug: "update-test",
			name: "Update Test",
			description: "Original description",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		const updated = await rm.update("update-test", {
			description: "Updated description",
			priority: "high",
		});

		expect(updated.description).toBe("Updated description");
		expect(updated.priority).toBe("high");
		expect(updated.name).toBe("Update Test");
	});

	it("should throw error when updating non-existent entity", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		await expect(
			rm.update("nonexistent", { description: "test" }),
		).rejects.toThrow();
	});

	it("should save entity", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		const entity: Requirement = {
			type: "requirement",
			slug: "save-test",
			name: "Save Test",
			description: "Test save",
			number: 1,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		};

		await rm.save(entity);
		const retrieved = await rm.get("save-test");
		expect(retrieved).toEqual(entity);
	});

	it("should delete entity", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		await rm.create({
			type: "requirement",
			slug: "delete-test",
			name: "Delete Test",
			description: "Test delete",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		expect(await rm.exists("delete-test")).toBe(true);
		await rm.delete("delete-test");
		expect(await rm.exists("delete-test")).toBe(false);
	});

	it("should list all entities", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		await rm.create({
			type: "requirement",
			slug: "list-1",
			name: "List 1",
			description: "First",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		await rm.create({
			type: "requirement",
			slug: "list-2",
			name: "List 2",
			description: "Second",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "high",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		const list = await rm.list();
		expect(list).toHaveLength(2);
		expect(list.map((r) => r.slug)).toContain("list-1");
		expect(list.map((r) => r.slug)).toContain("list-2");
	});

	it("should list slugs", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		await rm.create({
			type: "requirement",
			slug: "slug-1",
			name: "Slug 1",
			description: "First",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		const slugs = await rm.listSlugs();
		expect(slugs).toContain("slug-1");
	});

	it("should validate entity with schema", async () => {
		const tempDir = await createTempDir();
		
		const rm = new RequirementManager(tempDir);

		// Invalid priority should throw
		await expect(
			rm.create({
				type: "requirement",
				slug: "invalid",
				name: "Invalid",
				description: "Test",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				priority: "invalid" as any,
				criteria: [
					{
						id: "crit-001",
						description: "Must work",
						status: "needs-review",
					},
				],
				status: { verified: false, verified_at: null, notes: [] },
			}),
		).rejects.toThrow();
	});
});
