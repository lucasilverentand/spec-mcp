import { describe, expect, it } from "vitest";
import { FileManager } from "../src/storage/file-manager";
import { useTempDir } from "./helpers";

describe("FileManager", () => {
	const { createTempDir } = useTempDir();

	it("should create and get base path", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		expect(fm.getBasePath()).toBe(tempDir);
	});

	it("should ensure directory exists", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		await fm.ensureDir("test-dir");
		const exists = await fm.exists("test-dir");
		expect(exists).toBe(true);
	});

	it("should check if file exists", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const exists = await fm.exists("nonexistent.yaml");
		expect(exists).toBe(false);
	});

	it("should write and read YAML files", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const data = { name: "Test", value: 123 };

		await fm.writeYaml("test.yaml", data);
		const read = await fm.readYaml<typeof data>("test.yaml");

		expect(read).toEqual(data);
	});

	it("should delete files", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);

		await fm.writeYaml("test.yaml", { test: true });
		expect(await fm.exists("test.yaml")).toBe(true);

		await fm.delete("test.yaml");
		expect(await fm.exists("test.yaml")).toBe(false);
	});

	it("should list files in directory", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);

		await fm.ensureDir("entities");
		await fm.writeYaml("entities/one.yaml", { id: 1 });
		await fm.writeYaml("entities/two.yaml", { id: 2 });

		const files = await fm.listFiles("entities");
		expect(files).toHaveLength(2);
		expect(files).toContain("one");
		expect(files).toContain("two");
	});

	it("should return empty array for non-existent directory", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const files = await fm.listFiles("nonexistent");
		expect(files).toEqual([]);
	});

	it("should get full path", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);
		const fullPath = fm.getFullPath("test.yaml");
		expect(fullPath).toContain(tempDir);
		expect(fullPath).toContain("test.yaml");
	});

	it("should remove empty directory", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);

		// Create an empty directory
		await fm.ensureDir("empty-dir");
		expect(await fm.exists("empty-dir")).toBe(true);

		// Remove it
		await fm.removeEmptyDir("empty-dir");
		expect(await fm.exists("empty-dir")).toBe(false);
	});

	it("should not remove non-empty directory", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);

		// Create directory with a file
		await fm.ensureDir("non-empty-dir");
		await fm.writeYaml("non-empty-dir/file.yaml", { test: true });

		// Try to remove it - should do nothing
		await fm.removeEmptyDir("non-empty-dir");
		expect(await fm.exists("non-empty-dir")).toBe(true);
	});

	it("should silently handle removing non-existent directory", async () => {
		const tempDir = await createTempDir();
		const fm = new FileManager(tempDir);

		// Should not throw
		await expect(fm.removeEmptyDir("nonexistent")).resolves.toBeUndefined();
	});

	describe("Metadata Management", () => {
		it("should create default specs.json on first load", async () => {
			const tempDir = await createTempDir();
			const fm = new FileManager(tempDir);

			const metadata = await fm.loadMetadata();

			expect(metadata.version).toBe("1.0.0");
			expect(metadata.lastIds.requirement).toBe(0);
			expect(metadata.lastIds.component).toBe(0);
			expect(await fm.exists("specs.json")).toBe(true);
		});

		it("should get next ID and increment counter", async () => {
			const tempDir = await createTempDir();
			const fm = new FileManager(tempDir);

			const id1 = await fm.getNextId("requirement");
			const id2 = await fm.getNextId("requirement");
			const id3 = await fm.getNextId("requirement");

			expect(id1).toBe(1);
			expect(id2).toBe(2);
			expect(id3).toBe(3);
		});

		it("should track IDs independently per entity type", async () => {
			const tempDir = await createTempDir();
			const fm = new FileManager(tempDir);

			const reqId1 = await fm.getNextId("requirement");
			const compId1 = await fm.getNextId("component");
			const reqId2 = await fm.getNextId("requirement");
			const planId1 = await fm.getNextId("plan");

			expect(reqId1).toBe(1);
			expect(compId1).toBe(1);
			expect(reqId2).toBe(2);
			expect(planId1).toBe(1);
		});

		it("should persist metadata across FileManager instances", async () => {
			const tempDir = await createTempDir();

			// First instance
			const fm1 = new FileManager(tempDir);
			await fm1.getNextId("requirement");
			await fm1.getNextId("requirement");

			// Second instance
			const fm2 = new FileManager(tempDir);
			const id = await fm2.getNextId("requirement");

			expect(id).toBe(3);
		});

		it("should get last ID without incrementing", async () => {
			const tempDir = await createTempDir();
			const fm = new FileManager(tempDir);

			await fm.getNextId("requirement");
			await fm.getNextId("requirement");

			const lastId = await fm.getLastId("requirement");
			expect(lastId).toBe(2);

			// Getting last ID again should return same value
			const lastIdAgain = await fm.getLastId("requirement");
			expect(lastIdAgain).toBe(2);
		});

		it("should cache metadata for performance", async () => {
			const tempDir = await createTempDir();
			const fm = new FileManager(tempDir);

			// Load metadata twice
			const meta1 = await fm.loadMetadata();
			const meta2 = await fm.loadMetadata();

			// Should return the same cached object
			expect(meta1).toBe(meta2);
		});

		it("should invalidate cache when requested", async () => {
			const tempDir = await createTempDir();
			const fm = new FileManager(tempDir);

			await fm.loadMetadata();
			fm.invalidateMetadataCache();

			// Should reload from file
			const meta = await fm.loadMetadata();
			expect(meta.version).toBe("1.0.0");
		});
	});
});
