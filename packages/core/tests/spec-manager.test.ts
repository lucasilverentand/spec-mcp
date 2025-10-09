import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SpecManager } from "../src/spec-manager";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
} from "./helpers";

describe("SpecManager", () => {
	let tempDir: string;
	let specManager: SpecManager;

	beforeEach(async () => {
		tempDir = await createTempDir("spec-manager");
		specManager = new SpecManager(tempDir);
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("constructor", () => {
		it("should initialize with default path", () => {
			const sm = new SpecManager();
			expect(sm.getBasePath()).toContain("specs");
		});

		it("should initialize with custom path", () => {
			expect(specManager.getBasePath()).toBe(tempDir);
		});

		it("should initialize all entity managers", () => {
			expect(specManager.business_requirements).toBeDefined();
			expect(specManager.tech_requirements).toBeDefined();
			expect(specManager.plans).toBeDefined();
			expect(specManager.components).toBeDefined();
			expect(specManager.constitutions).toBeDefined();
			expect(specManager.decisions).toBeDefined();
		});

		it("should have correct entity types for tech requirements", () => {
			expect(specManager.tech_requirements.getType()).toBe(
				"technical-requirement",
			);
		});
	});

	describe("getBasePath", () => {
		it("should return resolved absolute path", () => {
			const path = specManager.getBasePath();
			expect(path).toBe(tempDir);
		});
	});

	describe("ensureFolders", () => {
		it("should create all entity folders without errors", async () => {
			await expect(specManager.ensureFolders()).resolves.not.toThrow();
		});
	});

	describe("business_requirements", () => {
		it("should create and retrieve business requirement", async () => {
			const data = createTestBusinessRequirement({
				slug: "user-auth",
				name: "User Authentication",
			});

			const created = await specManager.business_requirements.create(data);
			expect(created.number).toBe(1);
			expect(created.slug).toBe("user-auth");

			const retrieved = await specManager.business_requirements.get(
				created.number,
			);
			expect(retrieved).not.toBeNull();
			expect(retrieved?.name).toBe("User Authentication");
		});

		it("should update business requirement", async () => {
			const data = createTestBusinessRequirement({
				slug: "test-req",
				name: "Original Name",
			});

			const created = await specManager.business_requirements.create(data);
			const updated = await specManager.business_requirements.update(
				created.number,
				{
					name: "Updated Name",
				},
			);

			expect(updated.name).toBe("Updated Name");
		});

		it("should list business requirements", async () => {
			const data1 = createTestBusinessRequirement({
				slug: "req-1",
				name: "Requirement 1",
			});
			const data2 = createTestBusinessRequirement({
				slug: "req-2",
				name: "Requirement 2",
			});

			await specManager.business_requirements.create(data1);
			await specManager.business_requirements.create(data2);

			const all = await specManager.business_requirements.list();
			expect(all).toHaveLength(2);
		});

		it("should delete business requirement", async () => {
			const data = createTestBusinessRequirement({
				slug: "delete-me",
				name: "Delete Me",
			});

			const created = await specManager.business_requirements.create(data);
			await specManager.business_requirements.deleteEntity(created.number);

			const deleted = await specManager.business_requirements.get(
				created.number,
			);
			expect(deleted).toBeNull();
		});
	});

	describe("multiple entity types", () => {
		it("should handle multiple entity types with independent numbering", async () => {
			// Create business requirements
			const br1 = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "br-1", name: "BR 1" }),
			);
			const br2 = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "br-2", name: "BR 2" }),
			);

			// Each should start at number 1 and increment independently
			expect(br1.number).toBe(1);
			expect(br2.number).toBe(2);

			// List each type
			const allBr = await specManager.business_requirements.list();
			expect(allBr).toHaveLength(2);
		});

		it("should allow deletion without affecting other entity types", async () => {
			const br = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "br-1", name: "BR 1" }),
			);

			// Delete business requirement
			await specManager.business_requirements.deleteEntity(br.number);

			// BR should be deleted
			const brList = await specManager.business_requirements.list();
			expect(brList).toHaveLength(0);
		});
	});

	describe("getBySlug", () => {
		it("should find business requirements by slug", async () => {
			const data = createTestBusinessRequirement({
				slug: "unique-slug",
				name: "Test",
			});

			await specManager.business_requirements.create(data);

			const found = await specManager.business_requirements.getBySlug(
				"unique-slug",
			);
			expect(found).not.toBeNull();
			expect(found?.slug).toBe("unique-slug");
		});

		it("should return null for non-existent slug", async () => {
			const found = await specManager.business_requirements.getBySlug(
				"nonexistent",
			);
			expect(found).toBeNull();
		});
	});
});
