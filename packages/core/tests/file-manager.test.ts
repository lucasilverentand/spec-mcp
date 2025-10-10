import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileManager } from "../src/file-manager";
import { cleanupTempDir, createTempDir, fileExists } from "./helpers";

describe("FileManager", () => {
	let tempDir: string;
	let fileManager: FileManager;

	beforeEach(async () => {
		tempDir = await createTempDir("file-manager");
		fileManager = new FileManager(tempDir);
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("constructor", () => {
		it("should create a FileManager with the correct folder path", () => {
			expect(fileManager.getFolderPath()).toBe(path.resolve(tempDir));
		});
	});

	describe("ensureFolder", () => {
		it("should create the folder if it doesn't exist", async () => {
			const newDir = await createTempDir("file-manager-new");
			await cleanupTempDir(newDir);

			const fm = new FileManager(newDir);
			await fm.ensureFolder();

			expect(await fileExists(newDir)).toBe(true);
			await cleanupTempDir(newDir);
		});

		it("should not throw if folder already exists", async () => {
			await fileManager.ensureFolder();
			await expect(fileManager.ensureFolder()).resolves.not.toThrow();
		});
	});

	describe("ensureSubDir", () => {
		it("should create a subdirectory", async () => {
			// @ts-expect-error - accessing protected method for testing
			await fileManager.ensureSubDir("subdir");

			const subDirPath = path.join(tempDir, "subdir");
			expect(await fileExists(subDirPath)).toBe(true);
		});

		it("should create nested subdirectories", async () => {
			// @ts-expect-error - accessing protected method for testing
			await fileManager.ensureSubDir("level1/level2/level3");

			const nestedPath = path.join(tempDir, "level1/level2/level3");
			expect(await fileExists(nestedPath)).toBe(true);
		});
	});

	describe("exists", () => {
		it("should return true if file exists", async () => {
			await fileManager.writeYaml("test.yaml", { foo: "bar" });
			expect(await fileManager.exists("test.yaml")).toBe(true);
		});

		it("should return false if file does not exist", async () => {
			expect(await fileManager.exists("nonexistent.yaml")).toBe(false);
		});
	});

	describe("readYaml and writeYaml", () => {
		it("should write and read a YAML file", async () => {
			const data = { name: "test", value: 42, nested: { key: "value" } };
			await fileManager.writeYaml("test.yaml", data);

			const read = await fileManager.readYaml<typeof data>("test.yaml");
			expect(read).toEqual(data);
		});

		it("should create nested directories when writing", async () => {
			const data = { test: true };
			await fileManager.writeYaml("nested/dir/file.yaml", data);

			const read = await fileManager.readYaml<typeof data>(
				"nested/dir/file.yaml",
			);
			expect(read).toEqual(data);
		});

		it("should handle complex data types", async () => {
			const data = {
				string: "hello",
				number: 123,
				boolean: true,
				null_value: null,
				array: [1, 2, 3],
				object: { a: 1, b: 2 },
			};
			await fileManager.writeYaml("complex.yaml", data);

			const read = await fileManager.readYaml<typeof data>("complex.yaml");
			expect(read).toEqual(data);
		});
	});

	describe("delete", () => {
		it("should delete an existing file", async () => {
			await fileManager.writeYaml("test.yaml", { foo: "bar" });
			expect(await fileManager.exists("test.yaml")).toBe(true);

			await fileManager.delete("test.yaml");
			expect(await fileManager.exists("test.yaml")).toBe(false);
		});

		it("should throw if file does not exist", async () => {
			await expect(fileManager.delete("nonexistent.yaml")).rejects.toThrow();
		});
	});

	describe("listFiles", () => {
		it("should list all YAML files in a subdirectory", async () => {
			await fileManager.writeYaml("subdir/file1.yaml", { test: 1 });
			await fileManager.writeYaml("subdir/file2.yaml", { test: 2 });
			await fileManager.writeYaml("subdir/file3.yaml", { test: 3 });

			const files = await fileManager.listFiles("subdir");
			expect(files).toHaveLength(3);
			expect(files).toContain("file1");
			expect(files).toContain("file2");
			expect(files).toContain("file3");
		});

		it("should filter by extension", async () => {
			await fileManager.writeYaml("subdir/file1.yaml", { test: 1 });
			await fileManager.writeYaml("subdir/file2.txt", { test: 2 });

			const yamlFiles = await fileManager.listFiles("subdir", ".yaml");
			expect(yamlFiles).toHaveLength(1);
			expect(yamlFiles).toContain("file1");
		});

		it("should return empty array if directory does not exist", async () => {
			const files = await fileManager.listFiles("nonexistent");
			expect(files).toEqual([]);
		});

		it("should return empty array if directory is empty", async () => {
			// @ts-expect-error - accessing protected method for testing
			await fileManager.ensureSubDir("empty");
			const files = await fileManager.listFiles("empty");
			expect(files).toEqual([]);
		});
	});

	describe("getFullPath", () => {
		it("should return the full path for a relative path", () => {
			const fullPath = fileManager.getFullPath("test.yaml");
			expect(fullPath).toBe(path.join(tempDir, "test.yaml"));
		});

		it("should handle nested paths", () => {
			const fullPath = fileManager.getFullPath("nested/dir/file.yaml");
			expect(fullPath).toBe(path.join(tempDir, "nested/dir/file.yaml"));
		});
	});

	describe("removeEmptyDir", () => {
		it("should remove an empty directory", async () => {
			// @ts-expect-error - accessing protected method for testing
			await fileManager.ensureSubDir("empty");
			const dirPath = path.join(tempDir, "empty");
			expect(await fileExists(dirPath)).toBe(true);

			await fileManager.removeEmptyDir("empty");
			expect(await fileExists(dirPath)).toBe(false);
		});

		it("should not remove a non-empty directory", async () => {
			await fileManager.writeYaml("nonempty/file.yaml", { test: 1 });
			const dirPath = path.join(tempDir, "nonempty");
			expect(await fileExists(dirPath)).toBe(true);

			await fileManager.removeEmptyDir("nonempty");
			expect(await fileExists(dirPath)).toBe(true);
		});

		it("should not throw if directory does not exist", async () => {
			await expect(
				fileManager.removeEmptyDir("nonexistent"),
			).resolves.not.toThrow();
		});
	});
});
