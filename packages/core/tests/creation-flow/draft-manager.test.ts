import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DraftManager } from "../../src/creation-flow/draft-manager.js";

describe("DraftManager", () => {
	let draftManager: DraftManager;
	const testSpecsDir = ".test-specs";
	const testDraftsDir = path.join(testSpecsDir, ".drafts");

	beforeEach(async () => {
		draftManager = new DraftManager(testSpecsDir);
		// Clean up test directory
		try {
			await fs.rm(testSpecsDir, { recursive: true, force: true });
		} catch {
			// Ignore if doesn't exist
		}
		await fs.mkdir(testDraftsDir, { recursive: true });
	});

	afterEach(async () => {
		draftManager.destroy();
		// Clean up test directory
		try {
			await fs.rm(testSpecsDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("create", () => {
		it("should create a requirement draft with correct structure", async () => {
			const draft = await draftManager.create("requirement");

			expect(draft.id).toMatch(/^req-\d+-[a-z0-9]+$/);
			expect(draft.type).toBe("requirement");
			expect(draft.current_step).toBe(1);
			expect(draft.total_steps).toBe(9); // Updated: 10 -> 9 (removed 2 steps, added 1)
			expect(draft.data).toEqual({});
			expect(draft.validation_results).toEqual([]);
			expect(draft.created_at).toBeDefined();
			expect(draft.updated_at).toBeDefined();
			expect(draft.expires_at).toBeDefined();
		});

		it("should create a component draft with 10 total steps", async () => {
			const draft = await draftManager.create("component");

			expect(draft.id).toMatch(/^cmp-\d+-[a-z0-9]+$/);
			expect(draft.type).toBe("component");
			expect(draft.total_steps).toBe(14);
		});

		it("should create a plan draft with 12 total steps", async () => {
			const draft = await draftManager.create("plan");

			expect(draft.id).toMatch(/^pln-\d+-[a-z0-9]+$/);
			expect(draft.type).toBe("plan");
			expect(draft.total_steps).toBe(16); // Updated: 15 -> 16 (added tasks_list/tasks_item)
		});

		it("should create a constitution draft with 3 total steps", async () => {
			const draft = await draftManager.create("constitution");

			expect(draft.id).toMatch(/^con-\d+-[a-z0-9]+$/);
			expect(draft.type).toBe("constitution");
			expect(draft.total_steps).toBe(8); // Updated: 7 -> 8 (added articles_list/articles_item)
		});

		it("should create a decision draft with 6 total steps", async () => {
			const draft = await draftManager.create("decision");

			expect(draft.id).toMatch(/^dec-\d+-[a-z0-9]+$/);
			expect(draft.type).toBe("decision");
			expect(draft.total_steps).toBe(8);
		});

		it("should create draft with slug in data when provided", async () => {
			const draft = await draftManager.create("requirement", "user-auth");

			expect(draft.id).toMatch(/^req-user-auth-\d+$/);
			expect(draft.data).toEqual({ slug: "user-auth" });
		});

		it("should create draft with name in data when provided", async () => {
			const draft = await draftManager.create(
				"requirement",
				undefined,
				"User Auth",
			);

			expect(draft.data).toEqual({ name: "User Auth" });
		});

		it("should create draft with both slug and name when provided", async () => {
			const draft = await draftManager.create(
				"requirement",
				"user-auth",
				"User Auth",
			);

			expect(draft.id).toMatch(/^req-user-auth-\d+$/);
			expect(draft.data).toEqual({ slug: "user-auth", name: "User Auth" });
		});

		it("should set expiration to 24 hours from now", async () => {
			const beforeCreate = Date.now();
			const draft = await draftManager.create("requirement");
			const afterCreate = Date.now();

			const expiresAt = new Date(draft.expires_at).getTime();
			const expectedMin = beforeCreate + 24 * 60 * 60 * 1000;
			const expectedMax = afterCreate + 24 * 60 * 60 * 1000;

			expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
			expect(expiresAt).toBeLessThanOrEqual(expectedMax);
		});

		it("should persist draft to filesystem", async () => {
			const draft = await draftManager.create("requirement");
			const draftFile = path.join(testDraftsDir, `${draft.id}.draft.json`);

			const fileExists = await fs
				.access(draftFile)
				.then(() => true)
				.catch(() => false);
			expect(fileExists).toBe(true);
		});
	});

	describe("get", () => {
		it("should retrieve an existing draft", async () => {
			const created = await draftManager.create("requirement");
			const retrieved = draftManager.get(created.id);

			expect(retrieved).toEqual(created);
		});

		it("should return null for non-existent draft", () => {
			const retrieved = draftManager.get("req-nonexistent-123");
			expect(retrieved).toBeNull();
		});

		it("should return null for expired draft", async () => {
			const draft = await draftManager.create("requirement");

			// Manually set expiration to past (1 hour ago to ensure it's definitely expired)
			const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const updated = await draftManager.update(draft.id, {
				expires_at: pastDate,
			});

			// Verify the update worked
			expect(updated).not.toBeNull();
			expect(updated?.expires_at).toBe(pastDate);

			// Now get should return null because it's expired
			const retrieved = draftManager.get(draft.id);
			expect(retrieved).toBeNull();
		});
	});

	describe("update", () => {
		it("should update draft data", async () => {
			const draft = await draftManager.create("requirement");
			const updated = await draftManager.update(draft.id, {
				data: { description: "Test description" },
			});

			expect(updated?.data).toEqual({ description: "Test description" });
		});

		it("should increment current_step", async () => {
			const draft = await draftManager.create("requirement");
			const updated = await draftManager.update(draft.id, {
				current_step: 2,
			});

			expect(updated?.current_step).toBe(2);
		});

		it("should update validation_results", async () => {
			const draft = await draftManager.create("requirement");
			const validationResult = {
				step: "problem_identification",
				passed: true,
				issues: [],
				suggestions: [],
				strengths: ["Good description"],
			};

			const updated = await draftManager.update(draft.id, {
				validation_results: [validationResult],
			});

			expect(updated?.validation_results).toEqual([validationResult]);
		});

		it("should update updated_at timestamp", async () => {
			const draft = await draftManager.create("requirement");
			const originalUpdatedAt = draft.updated_at;

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			const updated = await draftManager.update(draft.id, {
				data: { test: "value" },
			});

			expect(updated?.updated_at).not.toBe(originalUpdatedAt);
		});

		it("should preserve immutable fields", async () => {
			const draft = await draftManager.create("requirement");

			const updated = await draftManager.update(draft.id, {
				// @ts-expect-error - Testing runtime immutability
				id: "different-id",
				// @ts-expect-error - Testing runtime immutability
				type: "component",
				// @ts-expect-error - Testing runtime immutability
				created_at: "2000-01-01T00:00:00.000Z",
			});

			expect(updated?.id).toBe(draft.id);
			expect(updated?.type).toBe(draft.type);
			expect(updated?.created_at).toBe(draft.created_at);
		});

		it("should return null for non-existent draft", async () => {
			const updated = await draftManager.update("req-nonexistent-123", {
				data: { test: "value" },
			});

			expect(updated).toBeNull();
		});

		it("should persist updates to filesystem", async () => {
			const draft = await draftManager.create("requirement");
			await draftManager.update(draft.id, {
				data: { description: "Updated description" },
			});

			const draftFile = path.join(testDraftsDir, `${draft.id}.draft.json`);
			const fileContent = await fs.readFile(draftFile, "utf-8");

			expect(fileContent).toContain("Updated description");
		});
	});

	describe("delete", () => {
		it("should delete an existing draft", async () => {
			const draft = await draftManager.create("requirement");
			const deleted = await draftManager.delete(draft.id);

			expect(deleted).toBe(true);
			expect(draftManager.get(draft.id)).toBeNull();
		});

		it("should delete draft file from filesystem", async () => {
			const draft = await draftManager.create("requirement");
			const draftFile = path.join(testDraftsDir, `${draft.id}.draft.json`);

			await draftManager.delete(draft.id);

			const fileExists = await fs
				.access(draftFile)
				.then(() => true)
				.catch(() => false);
			expect(fileExists).toBe(false);
		});

		it("should return false for non-existent draft", async () => {
			const deleted = await draftManager.delete("req-nonexistent-123");
			expect(deleted).toBe(false);
		});
	});

	describe("list", () => {
		it("should list all drafts when no type specified", async () => {
			await draftManager.create("requirement");
			await draftManager.create("component");
			await draftManager.create("plan");

			const drafts = draftManager.list();
			expect(drafts.length).toBe(3);
		});

		it("should filter by type when specified", async () => {
			await draftManager.create("requirement");
			await draftManager.create("requirement");
			await draftManager.create("component");

			const requirementDrafts = draftManager.list("requirement");
			expect(requirementDrafts.length).toBe(2);
			expect(requirementDrafts.every((d) => d.type === "requirement")).toBe(
				true,
			);
		});

		it("should return empty array when no drafts exist", () => {
			const drafts = draftManager.list();
			expect(drafts).toEqual([]);
		});

		it("should return empty array when no drafts match type", async () => {
			await draftManager.create("requirement");
			const planDrafts = draftManager.list("plan");
			expect(planDrafts).toEqual([]);
		});
	});

	describe("loadDrafts", () => {
		it("should load drafts from filesystem on initialization", async () => {
			// Create a draft with first manager
			const draft1 = await draftManager.create("requirement");
			draftManager.destroy();

			// Create new manager - should load existing drafts
			const newManager = new DraftManager(testSpecsDir);

			// Give it time to load
			await new Promise((resolve) => setTimeout(resolve, 100));

			const loaded = newManager.get(draft1.id);
			expect(loaded).toBeDefined();
			expect(loaded?.id).toBe(draft1.id);

			newManager.destroy();
		});

		it("should skip expired drafts when loading", async () => {
			// Create a draft and expire it
			const draft = await draftManager.create("requirement");
			await draftManager.update(draft.id, {
				expires_at: new Date(Date.now() - 1000).toISOString(),
			});
			draftManager.destroy();

			// Create new manager - should not load expired draft
			const newManager = new DraftManager(testSpecsDir);
			await new Promise((resolve) => setTimeout(resolve, 100));

			const loaded = newManager.get(draft.id);
			expect(loaded).toBeNull();

			newManager.destroy();
		});

		it("should delete expired draft files when loading", async () => {
			const draft = await draftManager.create("requirement");
			const draftFile = path.join(testDraftsDir, `${draft.id}.draft.json`);

			await draftManager.update(draft.id, {
				expires_at: new Date(Date.now() - 1000).toISOString(),
			});
			draftManager.destroy();

			// Create new manager to trigger cleanup
			const newManager = new DraftManager(testSpecsDir);
			await new Promise((resolve) => setTimeout(resolve, 100));

			const fileExists = await fs
				.access(draftFile)
				.then(() => true)
				.catch(() => false);
			expect(fileExists).toBe(false);

			newManager.destroy();
		});
	});

	describe("cleanup", () => {
		it("should automatically cleanup expired drafts", async () => {
			// Create draft and immediately expire it
			const draft = await draftManager.create("requirement");
			const updated = await draftManager.update(draft.id, {
				expires_at: new Date(Date.now() - 1000).toISOString(),
			});

			// Verify the update worked
			expect(updated).not.toBeNull();
			expect(new Date(updated!.expires_at).getTime()).toBeLessThan(Date.now());

			// Manually trigger cleanup (normally runs every hour)
			// @ts-expect-error - Accessing private method for testing
			await draftManager.cleanupExpired();

			expect(draftManager.get(draft.id)).toBeNull();
		});

		it("should stop cleanup interval when destroyed", () => {
			const manager = new DraftManager(testSpecsDir);
			// @ts-expect-error - Accessing private field for testing
			const intervalId = manager.cleanupInterval;

			manager.destroy();

			// @ts-expect-error - Accessing private field for testing
			expect(manager.cleanupInterval).toBeNull();
			expect(intervalId).toBeDefined();
		});
	});

	describe("generateDraftId", () => {
		it("should generate correct prefix for each type", async () => {
			const req = await draftManager.create("requirement");
			const cmp = await draftManager.create("component");
			const pln = await draftManager.create("plan");
			const con = await draftManager.create("constitution");
			const dec = await draftManager.create("decision");

			expect(req.id).toMatch(/^req-/);
			expect(cmp.id).toMatch(/^cmp-/);
			expect(pln.id).toMatch(/^pln-/);
			expect(con.id).toMatch(/^con-/);
			expect(dec.id).toMatch(/^dec-/);
		});

		it("should include slug in ID when provided", async () => {
			const draft = await draftManager.create("requirement", "my-feature");
			expect(draft.id).toMatch(/^req-my-feature-\d+$/);
		});

		it("should generate unique IDs", async () => {
			const draft1 = await draftManager.create("requirement");
			const draft2 = await draftManager.create("requirement");

			expect(draft1.id).not.toBe(draft2.id);
		});
	});
});
