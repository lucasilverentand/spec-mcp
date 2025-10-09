import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
	BusinessRequirementSchema,
	type BusinessRequirement,
} from "@spec-mcp/schemas";
import { EntityManager } from "../src/entity-manager";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
} from "./helpers";

describe("File Naming", () => {
	let tempDir: string;
	let entityManager: EntityManager<BusinessRequirement>;

	beforeEach(async () => {
		tempDir = await createTempDir("file-naming");
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

	it("should create files with correct naming pattern: {idPrefix}-{number}-{slug}.yml", async () => {
		const data = createTestBusinessRequirement({
			slug: "user-authentication",
			name: "User Authentication",
		});

		const created = await entityManager.create(data);

		// Check the file was created with the correct name
		const filesDir = path.join(tempDir, "requirements/business");
		const files = await fs.readdir(filesDir);

		expect(files).toHaveLength(1);
		expect(files[0]).toBe(`breq-${created.number}-user-authentication.yml`);
	});

	it("should handle multiple entities with sequential numbers", async () => {
		const data1 = createTestBusinessRequirement({
			slug: "feature-one",
			name: "Feature One",
		});

		const data2 = createTestBusinessRequirement({
			slug: "feature-two",
			name: "Feature Two",
		});

		await entityManager.create(data1);
		await entityManager.create(data2);

		const filesDir = path.join(tempDir, "requirements/business");
		const files = await fs.readdir(filesDir);

		expect(files).toHaveLength(2);
		expect(files).toContain("breq-1-feature-one.yml");
		expect(files).toContain("breq-2-feature-two.yml");
	});

	it("should rename file when slug is updated", async () => {
		const data = createTestBusinessRequirement({
			slug: "original-slug",
			name: "Original Name",
		});

		const created = await entityManager.create(data);

		// Update the slug
		await entityManager.update(created.number, {
			slug: "updated-slug",
		});

		const filesDir = path.join(tempDir, "requirements/business");
		const files = await fs.readdir(filesDir);

		expect(files).toHaveLength(1);
		expect(files[0]).toBe(`breq-${created.number}-updated-slug.yml`);
		expect(files).not.toContain(`breq-${created.number}-original-slug.yml`);
	});

	it("should delete file with correct name", async () => {
		const data = createTestBusinessRequirement({
			slug: "delete-me",
			name: "Delete Me",
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
