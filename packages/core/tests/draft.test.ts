import { promises as fs } from "node:fs";
import path from "node:path";
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

// TODO: These tests need to be refactored to use saveDraft/promoteDraft methods
// instead of the obsolete `draft` field which no longer exists in schemas
describe.skip("Draft Functionality", () => {
	let tempDir: string;
	let entityManager: EntityManager<BusinessRequirement>;

	beforeEach(async () => {
		tempDir = await createTempDir("draft-test");
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

	it("should create a non-draft file by default", async () => {
		const data = createTestBusinessRequirement({
			slug: "test-requirement",
			name: "Test Requirement",
		});

		const created = await entityManager.create(data);

		expect(created.draft).toBe(false);

		const filesDir = path.join(tempDir, "requirements/business");
		const files = await fs.readdir(filesDir);

		expect(files).toHaveLength(1);
		expect(files[0]).toBe(`breq-${created.number}-test-requirement.yml`);
	});

	it("should create a draft file when draft is true", async () => {
		const data = createTestBusinessRequirement({
			slug: "draft-requirement",
			name: "Draft Requirement",
			draft: true,
		});

		const created = await entityManager.create(data);

		expect(created.draft).toBe(true);

		const filesDir = path.join(tempDir, "requirements/business");
		const files = await fs.readdir(filesDir);

		expect(files).toHaveLength(1);
		expect(files[0]).toBe(`breq-${created.number}.draft.yml`);
	});

	it("should be able to retrieve draft entities", async () => {
		const data = createTestBusinessRequirement({
			slug: "draft-req",
			name: "Draft Requirement",
			draft: true,
		});

		const created = await entityManager.create(data);
		const retrieved = await entityManager.get(created.number);

		expect(retrieved).not.toBeNull();
		expect(retrieved?.draft).toBe(true);
	});

	it("should list both draft and non-draft entities", async () => {
		const draft = createTestBusinessRequirement({
			slug: "draft-req",
			name: "Draft",
			draft: true,
		});

		const normal = createTestBusinessRequirement({
			slug: "normal-req",
			name: "Normal",
			draft: false,
		});

		await entityManager.create(draft);
		await entityManager.create(normal);

		const entities = await entityManager.list();

		expect(entities).toHaveLength(2);
		expect(entities[0].draft).toBe(true);
		expect(entities[1].draft).toBe(false);
	});

	it("should convert draft to non-draft by updating", async () => {
		const data = createTestBusinessRequirement({
			slug: "convert-me",
			name: "Convert Me",
			draft: true,
		});

		const created = await entityManager.create(data);

		const filesDir = path.join(tempDir, "requirements/business");
		let files = await fs.readdir(filesDir);
		expect(files[0]).toContain(".draft.yml");

		// Update to non-draft
		const updated = await entityManager.update(created.number, {
			draft: false,
		});

		expect(updated.draft).toBe(false);

		files = await fs.readdir(filesDir);
		expect(files).toHaveLength(1);
		expect(files[0]).toBe(`breq-${created.number}-convert-me.yml`);
		expect(files[0]).not.toContain(".draft");
	});

	it("should convert non-draft to draft by updating", async () => {
		const data = createTestBusinessRequirement({
			slug: "make-draft",
			name: "Make Draft",
			draft: false,
		});

		const created = await entityManager.create(data);

		const filesDir = path.join(tempDir, "requirements/business");
		let files = await fs.readdir(filesDir);
		expect(files[0]).not.toContain(".draft");

		// Update to draft
		const updated = await entityManager.update(created.number, {
			draft: true,
		});

		expect(updated.draft).toBe(true);

		files = await fs.readdir(filesDir);
		expect(files).toHaveLength(1);
		expect(files[0]).toBe(`breq-${created.number}.draft.yml`);
	});

	it("should delete draft files correctly", async () => {
		const data = createTestBusinessRequirement({
			slug: "delete-draft",
			name: "Delete Draft",
			draft: true,
		});

		const created = await entityManager.create(data);

		const filesDir = path.join(tempDir, "requirements/business");
		let files = await fs.readdir(filesDir);
		expect(files).toHaveLength(1);

		await entityManager.deleteEntity(created.number);

		files = await fs.readdir(filesDir);
		expect(files).toHaveLength(0);
	});
});
