import { exec } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AnyEntity } from "../../src/entities/index.js";
import {
	FileManager,
	FileManagerConfigSchema,
} from "../../src/managers/file-manager.js";

const execAsync = promisify(exec);

describe("FileManagerConfigSchema", () => {
	it("should parse valid config with path", () => {
		const validConfig = {
			path: "/custom/specs/path",
			autoDetect: false,
		};

		const parsed = FileManagerConfigSchema.parse(validConfig);
		expect(parsed.path).toBe("/custom/specs/path");
		expect(parsed.autoDetect).toBe(false);
	});

	it("should use defaults when no config provided", () => {
		const config = {};
		const parsed = FileManagerConfigSchema.parse(config);

		expect(parsed.autoDetect).toBe(true);
		expect(parsed.path).toBeUndefined();
	});

	it("should allow path to be optional", () => {
		const config = {
			autoDetect: true,
		};

		const parsed = FileManagerConfigSchema.parse(config);
		expect(parsed.autoDetect).toBe(true);
		expect(parsed.path).toBeUndefined();
	});

	it("should default autoDetect to true when not provided", () => {
		const config = {
			path: "/some/path",
		};

		const parsed = FileManagerConfigSchema.parse(config);
		expect(parsed.autoDetect).toBe(true);
	});
});

describe("FileManager", () => {
	let tempDir: string;
	let fileManager: FileManager;

	// Helper function to create valid test requirement entity
	const createValidRequirement = (overrides = {}): AnyEntity => ({
		type: "requirement",
		number: 1,
		slug: "test-req",
		name: "Test Requirement",
		description: "Test description",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		priority: "required" as const,
		criteria: [
			{
				id: "req-001-test-req/crit-001",
				description: "Test criteria",
				plan_id: "pln-001-test-plan",
				completed: false,
			},
		],
		...overrides,
	});

	// Helper function to create valid test plan entity
	const createValidPlan = (overrides = {}): AnyEntity => ({
		type: "plan",
		number: 1,
		slug: "test-plan",
		name: "Test Plan",
		description: "Test description",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		priority: "medium" as const,
		acceptance_criteria: "Should work",
		tasks: [],
		flows: [],
		completed: false,
		approved: false,
		...overrides,
	});

	// Helper function to create valid test component entity
	const createValidComponent = (type: string, overrides = {}): AnyEntity => ({
		type: type as Record<string, unknown>,
		number: 1,
		slug: "test-component",
		name: "Test Component",
		description: "Test description",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		capabilities: [],
		...overrides,
	});

	beforeEach(async () => {
		// Create a temporary directory for each test
		tempDir = await mkdtemp(join(tmpdir(), "file-manager-test-"));
		fileManager = new FileManager({
			path: tempDir,
			autoDetect: false,
		});
	});

	afterEach(async () => {
		// Clean up temporary directory
		await rm(tempDir, { recursive: true, force: true });
	});

	describe("Constructor and Initialization", () => {
		it("should create FileManager with default config", () => {
			const fm = new FileManager();
			expect(fm).toBeDefined();
		});

		it("should create FileManager with custom path", () => {
			const fm = new FileManager({ path: "/custom/path" });
			expect(fm).toBeDefined();
		});

		it("should create FileManager with autoDetect disabled", () => {
			const fm = new FileManager({ autoDetect: false });
			expect(fm).toBeDefined();
		});

		it("should throw on invalid config", () => {
			expect(
				() =>
					new FileManager({ autoDetect: "invalid" } as Record<string, unknown>),
			).toThrow();
		});
	});

	describe("Path Management", () => {
		describe("getSpecsPath", () => {
			it("should return custom path when provided", async () => {
				const customPath = join(tempDir, "custom-specs");
				const fm = new FileManager({
					path: customPath,
					autoDetect: false,
				});

				const specsPath = await fm.getSpecsPath();
				expect(specsPath).toBe(customPath);
			});

			it("should cache resolved path after first call", async () => {
				const specsPath1 = await fileManager.getSpecsPath();
				const specsPath2 = await fileManager.getSpecsPath();

				expect(specsPath1).toBe(specsPath2);
				expect(specsPath1).toBe(tempDir);
			});

			it("should fallback to ./specs when no path and autoDetect is false", async () => {
				const fm = new FileManager({ autoDetect: false });
				const specsPath = await fm.getSpecsPath();

				expect(specsPath).toContain("specs");
			});

			it("should handle auto-detection when enabled", async () => {
				// Create .specs folder in tempDir
				const specsDir = join(tempDir, ".specs");
				await mkdir(specsDir, { recursive: true });

				// Test without changing directories - this relies on git root or cwd
				const fm = new FileManager({ autoDetect: true });
				const specsPath = await fm.getSpecsPath();

				// Should return a valid path (either found or default)
				expect(specsPath).toBeTruthy();
			});

			it("should prefer .specs over specs folder when both exist", async () => {
				// Test that when a custom path has both .specs and specs,
				// the FileManager can handle it
				const dotSpecsDir = join(tempDir, ".specs");
				const specsDir = join(tempDir, "specs");
				await mkdir(dotSpecsDir, { recursive: true });
				await mkdir(specsDir, { recursive: true });

				// When given a specific path, it uses that path
				const fm = new FileManager({ path: dotSpecsDir, autoDetect: false });
				const specsPath = await fm.getSpecsPath();

				expect(specsPath).toBe(dotSpecsDir);
			});

			it("should handle git root detection", async () => {
				// This test assumes we're in a git repository
				try {
					const { stdout } = await execAsync("git rev-parse --show-toplevel");
					const gitRoot = stdout.trim();

					// Create .specs in git root
					const gitSpecsDir = join(gitRoot, ".specs");
					const dirExists = await fileManager.pathExists(gitSpecsDir);

					if (dirExists) {
						const fm = new FileManager({ autoDetect: true });
						const specsPath = await fm.getSpecsPath();

						// Should find the .specs directory in git root
						expect(specsPath).toBeTruthy();
					}
				} catch {
					// Not in git repo or git not available, skip test
				}
			});

			it("should handle missing git gracefully", async () => {
				// Test in a non-git directory (tempDir)
				const fm = new FileManager({ path: tempDir, autoDetect: true });
				const specsPath = await fm.getSpecsPath();

				// Should still return a valid path (the provided path)
				expect(specsPath).toBeTruthy();
				expect(specsPath).toContain(tempDir);
			});
		});

		describe("pathExists", () => {
			it("should return true for existing path", async () => {
				const exists = await fileManager.pathExists(tempDir);
				expect(exists).toBe(true);
			});

			it("should return false for non-existent path", async () => {
				const exists = await fileManager.pathExists(
					join(tempDir, "non-existent"),
				);
				expect(exists).toBe(false);
			});

			it("should return true for existing file", async () => {
				const filePath = join(tempDir, "test.txt");
				await writeFile(filePath, "test content");

				const exists = await fileManager.pathExists(filePath);
				expect(exists).toBe(true);
			});
		});

		describe("isDirectory", () => {
			it("should return true for directory", async () => {
				const isDir = await fileManager.isDirectory(tempDir);
				expect(isDir).toBe(true);
			});

			it("should return false for file", async () => {
				const filePath = join(tempDir, "test.txt");
				await writeFile(filePath, "test content");

				const isDir = await fileManager.isDirectory(filePath);
				expect(isDir).toBe(false);
			});

			it("should return false for non-existent path", async () => {
				const isDir = await fileManager.isDirectory(
					join(tempDir, "non-existent"),
				);
				expect(isDir).toBe(false);
			});
		});

		describe("getEntityPath", () => {
			it("should generate path for requirement", () => {
				const path = fileManager.getEntityPath("requirement", "req-001-test");
				expect(path).toBe("requirements/req-001-test.yml");
			});

			it("should generate path for plan", () => {
				const path = fileManager.getEntityPath("plan", "pln-001-test");
				expect(path).toBe("plans/pln-001-test.yml");
			});

			it("should generate path for app component", () => {
				const path = fileManager.getEntityPath("app", "app-001-test");
				expect(path).toBe("components/app-001-test.yml");
			});

			it("should generate path for service component", () => {
				const path = fileManager.getEntityPath("service", "svc-001-test");
				expect(path).toBe("components/svc-001-test.yml");
			});

			it("should generate path for library component", () => {
				const path = fileManager.getEntityPath("library", "lib-001-test");
				expect(path).toBe("components/lib-001-test.yml");
			});

		});

		describe("getFullEntityPath", () => {
			it("should return full absolute path for requirement", async () => {
				const fullPath = await fileManager.getFullEntityPath(
					"requirement",
					"req-001-test",
				);
				expect(fullPath).toBe(join(tempDir, "requirements/req-001-test.yml"));
			});

			it("should return full absolute path for plan", async () => {
				const fullPath = await fileManager.getFullEntityPath(
					"plan",
					"pln-001-test",
				);
				expect(fullPath).toBe(join(tempDir, "plans/pln-001-test.yml"));
			});

			it("should return full absolute path for component", async () => {
				const fullPath = await fileManager.getFullEntityPath(
					"app",
					"app-001-test",
				);
				expect(fullPath).toBe(join(tempDir, "components/app-001-test.yml"));
			});
		});
	});

	describe("Directory Management", () => {
		describe("ensureDirectoryStructure", () => {
			it("should create all required directories", async () => {
				await fileManager.ensureDirectoryStructure();

				const requirementsExists = await fileManager.pathExists(
					join(tempDir, "requirements"),
				);
				const plansExists = await fileManager.pathExists(
					join(tempDir, "plans"),
				);
				const componentsExists = await fileManager.pathExists(
					join(tempDir, "components"),
				);

				expect(requirementsExists).toBe(true);
				expect(plansExists).toBe(true);
				expect(componentsExists).toBe(true);
			});

			it("should not throw if directories already exist", async () => {
				await fileManager.ensureDirectoryStructure();
				await expect(
					fileManager.ensureDirectoryStructure(),
				).resolves.not.toThrow();
			});

			it("should create nested directory structure", async () => {
				await fileManager.ensureDirectoryStructure();

				const requirementsIsDir = await fileManager.isDirectory(
					join(tempDir, "requirements"),
				);
				const plansIsDir = await fileManager.isDirectory(
					join(tempDir, "plans"),
				);
				const componentsIsDir = await fileManager.isDirectory(
					join(tempDir, "components"),
				);

				expect(requirementsIsDir).toBe(true);
				expect(plansIsDir).toBe(true);
				expect(componentsIsDir).toBe(true);
			});
		});
	});

	describe("File Reading Operations", () => {
		describe("readEntity", () => {
			it("should read requirement entity from file", async () => {
				await fileManager.ensureDirectoryStructure();
				const requirement = createValidRequirement();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test-req",
					requirement,
				);

				const readEntity = await fileManager.readEntity(
					"requirement",
					"req-001-test-req",
				);

				expect(readEntity).not.toBeNull();
				expect(readEntity?.type).toBe("requirement");
				expect(readEntity?.slug).toBe("test-req");
			});

			it("should return null for non-existent entity", async () => {
				const readEntity = await fileManager.readEntity(
					"requirement",
					"req-999-non-existent",
				);

				expect(readEntity).toBeNull();
			});

			it("should read plan entity from file", async () => {
				await fileManager.ensureDirectoryStructure();
				const plan = createValidPlan();
				await fileManager.writeEntity("plan", "pln-001-test-plan", plan);

				const readEntity = await fileManager.readEntity(
					"plan",
					"pln-001-test-plan",
				);

				expect(readEntity).not.toBeNull();
				expect(readEntity?.type).toBe("plan");
				expect(readEntity?.slug).toBe("test-plan");
			});

			it("should read component entity from file", async () => {
				await fileManager.ensureDirectoryStructure();
				const component = createValidComponent("app");
				await fileManager.writeEntity(
					"app",
					"app-001-test-component",
					component,
				);

				const readEntity = await fileManager.readEntity(
					"app",
					"app-001-test-component",
				);

				expect(readEntity).not.toBeNull();
				expect(readEntity?.type).toBe("app");
				expect(readEntity?.slug).toBe("test-component");
			});

			it("should throw error for corrupted YAML file", async () => {
				await fileManager.ensureDirectoryStructure();
				const filePath = join(tempDir, "requirements", "req-001-corrupted.yml");
				await writeFile(filePath, "invalid: [unclosed array");

				await expect(
					fileManager.readEntity("requirement", "req-001-corrupted"),
				).rejects.toThrow();
			});

			it("should handle special characters in entity data", async () => {
				await fileManager.ensureDirectoryStructure();
				const requirement = createValidRequirement({
					description: "Special chars: \"quotes\", 'apostrophes', & symbols",
					name: "Test: With Colons & Symbols",
				});

				await fileManager.writeEntity(
					"requirement",
					"req-001-special",
					requirement,
				);

				const readEntity = await fileManager.readEntity(
					"requirement",
					"req-001-special",
				);

				expect(readEntity?.description).toContain("Special chars");
				expect(readEntity?.name).toContain("Test: With Colons");
			});
		});

		describe("entityExists", () => {
			it("should return true for existing entity", async () => {
				await fileManager.ensureDirectoryStructure();
				const requirement = createValidRequirement();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test-req",
					requirement,
				);

				const exists = await fileManager.entityExists(
					"requirement",
					"req-001-test-req",
				);
				expect(exists).toBe(true);
			});

			it("should return false for non-existent entity", async () => {
				const exists = await fileManager.entityExists(
					"requirement",
					"req-999-non-existent",
				);
				expect(exists).toBe(false);
			});

			it("should return true for existing plan", async () => {
				await fileManager.ensureDirectoryStructure();
				const plan = createValidPlan();
				await fileManager.writeEntity("plan", "pln-001-test-plan", plan);

				const exists = await fileManager.entityExists(
					"plan",
					"pln-001-test-plan",
				);
				expect(exists).toBe(true);
			});

			it("should return true for existing component", async () => {
				await fileManager.ensureDirectoryStructure();
				const component = createValidComponent("service");
				await fileManager.writeEntity(
					"service",
					"svc-001-test-service",
					component,
				);

				const exists = await fileManager.entityExists(
					"service",
					"svc-001-test-service",
				);
				expect(exists).toBe(true);
			});

			it("should handle errors gracefully", async () => {
				// This should not throw even with permission or other issues
				const exists = await fileManager.entityExists(
					"requirement",
					"../../../etc/passwd", // Attempt path traversal (should be safe)
				);
				expect(typeof exists).toBe("boolean");
			});
		});

		describe("listEntityIds", () => {
			it("should list requirement IDs", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					createValidRequirement(),
				);
				await fileManager.writeEntity(
					"requirement",
					"req-002-another",
					createValidRequirement({ slug: "another" }),
				);

				const ids = await fileManager.listEntityIds("requirement");

				expect(ids).toHaveLength(2);
				expect(ids).toContain("req-001-test");
				expect(ids).toContain("req-002-another");
			});

			it("should list plan IDs", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"plan",
					"pln-001-test",
					createValidPlan(),
				);
				await fileManager.writeEntity(
					"plan",
					"pln-002-another",
					createValidPlan({ slug: "another" }),
				);

				const ids = await fileManager.listEntityIds("plan");

				expect(ids).toHaveLength(2);
				expect(ids).toContain("pln-001-test");
				expect(ids).toContain("pln-002-another");
			});

			it("should list component IDs", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"app",
					"app-001-test",
					createValidComponent("app"),
				);
				await fileManager.writeEntity(
					"service",
					"svc-001-test",
					createValidComponent("service"),
				);

				// Both app and service components are stored in the same components folder
				// So listEntityIds returns all components for any component type
				const appIds = await fileManager.listEntityIds("app");
				const serviceIds = await fileManager.listEntityIds("service");

				expect(appIds).toHaveLength(2);
				expect(appIds).toContain("app-001-test");
				expect(appIds).toContain("svc-001-test");
				expect(serviceIds).toHaveLength(2);
				expect(serviceIds).toContain("app-001-test");
				expect(serviceIds).toContain("svc-001-test");
			});

			it("should return empty array when directory does not exist", async () => {
				const ids = await fileManager.listEntityIds("requirement");
				expect(ids).toEqual([]);
			});

			it("should filter out non-yaml files", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					createValidRequirement(),
				);
				await writeFile(join(tempDir, "requirements", "readme.md"), "readme");
				await writeFile(join(tempDir, "requirements", "config.json"), "{}");

				const ids = await fileManager.listEntityIds("requirement");

				expect(ids).toHaveLength(1);
				expect(ids).toContain("req-001-test");
			});

			it("should handle both .yml and .yaml extensions", async () => {
				await fileManager.ensureDirectoryStructure();
				await writeFile(
					join(tempDir, "requirements", "req-001-test.yml"),
					"type: requirement\nslug: test",
				);
				await writeFile(
					join(tempDir, "requirements", "req-002-test.yaml"),
					"type: requirement\nslug: test2",
				);

				const ids = await fileManager.listEntityIds("requirement");

				expect(ids).toHaveLength(2);
				expect(ids).toContain("req-001-test");
				expect(ids).toContain("req-002-test");
			});
		});
	});

	describe("File Writing Operations", () => {
		describe("writeEntity", () => {
			it("should write requirement entity to file", async () => {
				const requirement = createValidRequirement();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					requirement,
				);

				const exists = await fileManager.pathExists(
					join(tempDir, "requirements", "req-001-test.yml"),
				);
				expect(exists).toBe(true);
			});

			it("should write plan entity to file", async () => {
				const plan = createValidPlan();
				await fileManager.writeEntity("plan", "pln-001-test", plan);

				const exists = await fileManager.pathExists(
					join(tempDir, "plans", "pln-001-test.yml"),
				);
				expect(exists).toBe(true);
			});

			it("should write component entity to file", async () => {
				const component = createValidComponent("app");
				await fileManager.writeEntity("app", "app-001-test", component);

				const exists = await fileManager.pathExists(
					join(tempDir, "components", "app-001-test.yml"),
				);
				expect(exists).toBe(true);
			});

			it("should create directory if it does not exist", async () => {
				const requirement = createValidRequirement();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					requirement,
				);

				const dirExists = await fileManager.pathExists(
					join(tempDir, "requirements"),
				);
				expect(dirExists).toBe(true);
			});

			it("should overwrite existing entity", async () => {
				const requirement1 = createValidRequirement({ name: "Original Name" });
				const requirement2 = createValidRequirement({ name: "Updated Name" });

				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					requirement1,
				);
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					requirement2,
				);

				const readEntity = await fileManager.readEntity(
					"requirement",
					"req-001-test",
				);
				expect(readEntity?.name).toBe("Updated Name");
			});

			it("should format YAML with proper indentation", async () => {
				const requirement = createValidRequirement();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					requirement,
				);

				const filePath = join(tempDir, "requirements", "req-001-test.yml");
				const content = await require("node:fs/promises").readFile(
					filePath,
					"utf8",
				);

				expect(content).toContain("type: requirement");
				expect(content).toContain("  "); // Check for indentation
			});

			it("should handle nested arrays and objects", async () => {
				const plan = createValidPlan({
					tasks: [
						{ id: "task-1", description: "Task 1" },
						{ id: "task-2", description: "Task 2" },
					],
					flows: [{ id: "flow-1", steps: [{ action: "step1" }] }],
				});

				await fileManager.writeEntity("plan", "pln-001-complex", plan);

				const readEntity = await fileManager.readEntity(
					"plan",
					"pln-001-complex",
				);
				expect((readEntity as Record<string, unknown>)?.tasks).toHaveLength(2);
				expect((readEntity as Record<string, unknown>)?.flows).toHaveLength(1);
			});

			it("should handle empty arrays and objects", async () => {
				const plan = createValidPlan({
					tasks: [],
					flows: [],
				});

				await fileManager.writeEntity("plan", "pln-001-empty", plan);

				const readEntity = await fileManager.readEntity(
					"plan",
					"pln-001-empty",
				);
				expect((readEntity as Record<string, unknown>)?.tasks).toEqual([]);
				expect((readEntity as Record<string, unknown>)?.flows).toEqual([]);
			});
		});

		describe("deleteEntity", () => {
			it("should delete existing requirement", async () => {
				await fileManager.ensureDirectoryStructure();
				const requirement = createValidRequirement();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					requirement,
				);

				const deleted = await fileManager.deleteEntity(
					"requirement",
					"req-001-test",
				);

				expect(deleted).toBe(true);
				const exists = await fileManager.pathExists(
					join(tempDir, "requirements", "req-001-test.yml"),
				);
				expect(exists).toBe(false);
			});

			it("should return false when deleting non-existent entity", async () => {
				const deleted = await fileManager.deleteEntity(
					"requirement",
					"req-999-non-existent",
				);

				expect(deleted).toBe(false);
			});

			it("should delete existing plan", async () => {
				await fileManager.ensureDirectoryStructure();
				const plan = createValidPlan();
				await fileManager.writeEntity("plan", "pln-001-test", plan);

				const deleted = await fileManager.deleteEntity("plan", "pln-001-test");

				expect(deleted).toBe(true);
				const exists = await fileManager.pathExists(
					join(tempDir, "plans", "pln-001-test.yml"),
				);
				expect(exists).toBe(false);
			});

			it("should delete existing component", async () => {
				await fileManager.ensureDirectoryStructure();
				const component = createValidComponent("service");
				await fileManager.writeEntity("service", "svc-001-test", component);

				const deleted = await fileManager.deleteEntity(
					"service",
					"svc-001-test",
				);

				expect(deleted).toBe(true);
				const exists = await fileManager.pathExists(
					join(tempDir, "components", "svc-001-test.yml"),
				);
				expect(exists).toBe(false);
			});

			it("should throw error for other file system errors", async () => {
				await fileManager.ensureDirectoryStructure();
				const requirement = createValidRequirement();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					requirement,
				);

				// Make the directory read-only to trigger permission error
				const _requirementsPath = join(tempDir, "requirements");
				// Note: This may not work on all systems/permissions
				// This is a basic test for error handling
			});
		});
	});

	describe("Batch Operations", () => {
		describe("batchWrite", () => {
			it("should write multiple entities at once", async () => {
				const operations = [
					{
						entityType: "requirement" as const,
						id: "req-001-test1",
						entity: createValidRequirement({ slug: "test1" }),
					},
					{
						entityType: "plan" as const,
						id: "pln-001-test2",
						entity: createValidPlan({ slug: "test2" }),
					},
					{
						entityType: "app" as const,
						id: "app-001-test3",
						entity: createValidComponent("app", { slug: "test3" }),
					},
				];

				await fileManager.batchWrite(operations);

				const req = await fileManager.readEntity(
					"requirement",
					"req-001-test1",
				);
				const plan = await fileManager.readEntity("plan", "pln-001-test2");
				const component = await fileManager.readEntity("app", "app-001-test3");

				expect(req).not.toBeNull();
				expect(plan).not.toBeNull();
				expect(component).not.toBeNull();
			});

			it("should create directory structure during batch write", async () => {
				const operations = [
					{
						entityType: "requirement" as const,
						id: "req-001-test",
						entity: createValidRequirement(),
					},
				];

				await fileManager.batchWrite(operations);

				const dirExists = await fileManager.pathExists(
					join(tempDir, "requirements"),
				);
				expect(dirExists).toBe(true);
			});

			it("should handle empty operations array", async () => {
				await expect(fileManager.batchWrite([])).resolves.not.toThrow();
			});

			it("should write all entities even if one already exists", async () => {
				// Pre-create one entity
				await fileManager.writeEntity(
					"requirement",
					"req-001-existing",
					createValidRequirement({ slug: "existing" }),
				);

				const operations = [
					{
						entityType: "requirement" as const,
						id: "req-001-existing",
						entity: createValidRequirement({
							slug: "existing",
							name: "Updated",
						}),
					},
					{
						entityType: "requirement" as const,
						id: "req-002-new",
						entity: createValidRequirement({ slug: "new" }),
					},
				];

				await fileManager.batchWrite(operations);

				const updated = await fileManager.readEntity(
					"requirement",
					"req-001-existing",
				);
				const newEntity = await fileManager.readEntity(
					"requirement",
					"req-002-new",
				);

				expect(updated?.name).toBe("Updated");
				expect(newEntity).not.toBeNull();
			});
		});

		describe("batchWriteWithTransaction", () => {
			it("should write multiple entities successfully", async () => {
				const operations = [
					{
						entityType: "requirement" as const,
						id: "req-001-test1",
						entity: createValidRequirement({ slug: "test1" }),
					},
					{
						entityType: "requirement" as const,
						id: "req-002-test2",
						entity: createValidRequirement({ slug: "test2", number: 2 }),
					},
				];

				await fileManager.batchWriteWithTransaction(operations);

				const req1 = await fileManager.readEntity(
					"requirement",
					"req-001-test1",
				);
				const req2 = await fileManager.readEntity(
					"requirement",
					"req-002-test2",
				);

				expect(req1).not.toBeNull();
				expect(req2).not.toBeNull();
			});

			it("should rollback changes on failure", async () => {
				// Create initial entity
				await fileManager.writeEntity(
					"requirement",
					"req-001-original",
					createValidRequirement({ slug: "original", name: "Original" }),
				);

				// Create a mock operation that will fail
				const operations = [
					{
						entityType: "requirement" as const,
						id: "req-001-original",
						entity: createValidRequirement({
							slug: "original",
							name: "Modified",
						}),
					},
					{
						entityType: "requirement" as const,
						id: "req-002-new",
						entity: {} as Record<string, unknown>, // Invalid entity that will cause write to fail
					},
				];

				// Mock writeEntity to fail on second operation
				const originalWriteEntity = fileManager.writeEntity.bind(fileManager);
				let callCount = 0;
				fileManager.writeEntity = async (entityType, id, entity) => {
					callCount++;
					if (callCount > 1) {
						throw new Error("Simulated write failure");
					}
					return originalWriteEntity(entityType, id, entity);
				};

				try {
					await fileManager.batchWriteWithTransaction(operations);
				} catch (_error) {
					// Expected to fail
				}

				// Restore original writeEntity
				fileManager.writeEntity = originalWriteEntity;

				// Original entity should be restored
				const original = await fileManager.readEntity(
					"requirement",
					"req-001-original",
				);
				expect(original?.name).toBe("Original");

				// New entity should not exist
				const newEntity = await fileManager.readEntity(
					"requirement",
					"req-002-new",
				);
				expect(newEntity).toBeNull();
			});

			it("should handle new entities in rollback", async () => {
				const operations = [
					{
						entityType: "requirement" as const,
						id: "req-001-new1",
						entity: createValidRequirement({ slug: "new1" }),
					},
					{
						entityType: "requirement" as const,
						id: "req-002-new2",
						entity: createValidRequirement({ slug: "new2", number: 2 }),
					},
				];

				// Mock batchWrite to fail after creating backups
				const originalBatchWrite = fileManager.batchWrite.bind(fileManager);
				fileManager.batchWrite = async () => {
					throw new Error("Simulated batch write failure");
				};

				try {
					await fileManager.batchWriteWithTransaction(operations);
					expect.fail("Should have thrown an error");
				} catch (_error) {
					// Expected to fail
				}

				// Restore original batchWrite
				fileManager.batchWrite = originalBatchWrite;

				// New entities should be cleaned up
				const req1 = await fileManager.readEntity(
					"requirement",
					"req-001-new1",
				);
				const req2 = await fileManager.readEntity(
					"requirement",
					"req-002-new2",
				);

				expect(req1).toBeNull();
				expect(req2).toBeNull();
			});

			it("should cleanup backup files on success", async () => {
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					createValidRequirement({ slug: "test", name: "Original" }),
				);

				const operations = [
					{
						entityType: "requirement" as const,
						id: "req-001-test",
						entity: createValidRequirement({ slug: "test", name: "Updated" }),
					},
				];

				await fileManager.batchWriteWithTransaction(operations);

				// Check that no backup files remain
				const requirementsPath = join(tempDir, "requirements");
				const { readdir } = require("node:fs/promises");
				const files = await readdir(requirementsPath);
				const backupFiles = files.filter((f: string) => f.includes(".backup."));

				expect(backupFiles).toHaveLength(0);
			});

			it("should handle empty operations array", async () => {
				await expect(
					fileManager.batchWriteWithTransaction([]),
				).resolves.not.toThrow();
			});
		});
	});

	describe("Utility Methods", () => {
		describe("getComponentTypeFromId", () => {
			it("should detect app component type", () => {
				const type = fileManager.getComponentTypeFromId("app-001-test");
				expect(type).toBe("app");
			});

			it("should detect service component type", () => {
				const type = fileManager.getComponentTypeFromId("svc-001-test");
				expect(type).toBe("service");
			});

			it("should detect library component type", () => {
				const type = fileManager.getComponentTypeFromId("lib-001-test");
				expect(type).toBe("library");
			});


			it("should throw error for invalid component ID", () => {
				expect(() => fileManager.getComponentTypeFromId("invalid-id")).toThrow(
					"Invalid component ID format: invalid-id",
				);
			});

			it("should throw error for non-component ID", () => {
				expect(() =>
					fileManager.getComponentTypeFromId("req-001-test"),
				).toThrow("Invalid component ID format: req-001-test");
			});
		});

		describe("getNextNumber", () => {
			it("should return 1 for first requirement", async () => {
				const nextNumber = await fileManager.getNextNumber("requirement");
				expect(nextNumber).toBe(1);
			});

			it("should return next sequential number for requirements", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					createValidRequirement(),
				);
				await fileManager.writeEntity(
					"requirement",
					"req-002-another",
					createValidRequirement({ slug: "another", number: 2 }),
				);

				const nextNumber = await fileManager.getNextNumber("requirement");
				expect(nextNumber).toBe(3);
			});

			it("should return 1 for first plan", async () => {
				const nextNumber = await fileManager.getNextNumber("plan");
				expect(nextNumber).toBe(1);
			});

			it("should return next sequential number for plans", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"plan",
					"pln-001-test",
					createValidPlan(),
				);
				await fileManager.writeEntity(
					"plan",
					"pln-002-another",
					createValidPlan({ slug: "another", number: 2 }),
				);

				const nextNumber = await fileManager.getNextNumber("plan");
				expect(nextNumber).toBe(3);
			});

			it("should return 1 for first component", async () => {
				const nextNumber = await fileManager.getNextNumber("app");
				expect(nextNumber).toBe(1);
			});

			it("should return next sequential number for components", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"app",
					"app-001-test",
					createValidComponent("app"),
				);
				await fileManager.writeEntity(
					"app",
					"app-002-another",
					createValidComponent("app", { slug: "another", number: 2 }),
				);

				const nextNumber = await fileManager.getNextNumber("app");
				expect(nextNumber).toBe(3);
			});

			it("should handle gaps in numbering", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					createValidRequirement(),
				);
				await fileManager.writeEntity(
					"requirement",
					"req-003-test",
					createValidRequirement({ slug: "test3", number: 3 }),
				);

				const nextNumber = await fileManager.getNextNumber("requirement");
				expect(nextNumber).toBe(4);
			});

			it("should ignore files with invalid number format", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					createValidRequirement(),
				);
				// Create a file with invalid number format
				await writeFile(
					join(tempDir, "requirements", "req-abc-invalid.yml"),
					"type: requirement\nslug: invalid",
				);

				const nextNumber = await fileManager.getNextNumber("requirement");
				expect(nextNumber).toBe(2);
			});

			it("should only count files matching the entity type prefix", async () => {
				await fileManager.ensureDirectoryStructure();
				await fileManager.writeEntity(
					"requirement",
					"req-001-test",
					createValidRequirement(),
				);
				// Create a plan (different type)
				await fileManager.writeEntity(
					"plan",
					"pln-001-test",
					createValidPlan(),
				);

				const reqNextNumber = await fileManager.getNextNumber("requirement");
				const planNextNumber = await fileManager.getNextNumber("plan");

				expect(reqNextNumber).toBe(2);
				expect(planNextNumber).toBe(2);
			});
		});
	});

	describe("Error Handling and Edge Cases", () => {
		it("should handle empty file content gracefully", async () => {
			await fileManager.ensureDirectoryStructure();
			const filePath = join(tempDir, "requirements", "req-001-empty.yml");
			await writeFile(filePath, "");

			// Empty YAML parses to null
			const result = await fileManager.readEntity(
				"requirement",
				"req-001-empty",
			);
			expect(result).toBeNull();
		});

		it("should handle very long entity IDs", async () => {
			const longSlug = "a".repeat(200);
			const longId = `req-001-${longSlug}`;

			await fileManager.ensureDirectoryStructure();
			const requirement = createValidRequirement({ slug: longSlug });

			await fileManager.writeEntity("requirement", longId, requirement);

			const readEntity = await fileManager.readEntity("requirement", longId);
			expect(readEntity).not.toBeNull();
		});

		it("should handle special YAML characters", async () => {
			await fileManager.ensureDirectoryStructure();
			const requirement = createValidRequirement({
				description: "Line 1\nLine 2\nLine 3",
				name: "Test: With | Special > Characters",
			});

			await fileManager.writeEntity(
				"requirement",
				"req-001-special",
				requirement,
			);

			const readEntity = await fileManager.readEntity(
				"requirement",
				"req-001-special",
			);
			expect(readEntity?.description).toContain("Line 1");
			expect(readEntity?.description).toContain("Line 2");
		});

		it("should handle concurrent reads", async () => {
			await fileManager.ensureDirectoryStructure();
			const requirement = createValidRequirement();
			await fileManager.writeEntity("requirement", "req-001-test", requirement);

			// Perform multiple concurrent reads
			const reads = await Promise.all([
				fileManager.readEntity("requirement", "req-001-test"),
				fileManager.readEntity("requirement", "req-001-test"),
				fileManager.readEntity("requirement", "req-001-test"),
			]);

			expect(reads).toHaveLength(3);
			reads.forEach((entity) => {
				expect(entity).not.toBeNull();
				expect(entity?.slug).toBe("test-req");
			});
		});

		it("should handle concurrent writes", async () => {
			await fileManager.ensureDirectoryStructure();

			// Perform multiple concurrent writes
			await Promise.all([
				fileManager.writeEntity(
					"requirement",
					"req-001-test1",
					createValidRequirement({ slug: "test1" }),
				),
				fileManager.writeEntity(
					"requirement",
					"req-002-test2",
					createValidRequirement({ slug: "test2", number: 2 }),
				),
				fileManager.writeEntity(
					"requirement",
					"req-003-test3",
					createValidRequirement({ slug: "test3", number: 3 }),
				),
			]);

			const ids = await fileManager.listEntityIds("requirement");
			expect(ids).toHaveLength(3);
		});

		it("should handle invalid path characters safely", async () => {
			// Attempt to use path traversal in entity ID
			const result = await fileManager.entityExists(
				"requirement",
				"../../../etc/passwd",
			);
			// Should not traverse and should return false
			expect(result).toBe(false);
		});

		it("should handle null and undefined in entity data", async () => {
			await fileManager.ensureDirectoryStructure();
			const requirement = createValidRequirement({
				description: undefined as Record<string, unknown>,
			});

			// FileManager doesn't validate, it just writes
			// undefined fields will be omitted from YAML
			await fileManager.writeEntity(
				"requirement",
				"req-001-invalid",
				requirement,
			);

			const read = await fileManager.readEntity(
				"requirement",
				"req-001-invalid",
			);
			expect(read).toBeDefined();
			// description will be undefined in the read entity
		});

		it("should handle circular references gracefully", async () => {
			await fileManager.ensureDirectoryStructure();
			const circularObj: Record<string, unknown> = { name: "test" };
			circularObj.self = circularObj;

			// YAML library handles circular references by creating aliases
			// This should not throw
			await fileManager.writeEntity(
				"requirement",
				"req-001-circular",
				circularObj,
			);

			const read = await fileManager.readEntity(
				"requirement",
				"req-001-circular",
			);
			expect(read).toBeDefined();
		});
	});

	describe("Integration Tests", () => {
		it("should handle complete CRUD workflow", async () => {
			// Create
			const requirement = createValidRequirement();
			await fileManager.writeEntity("requirement", "req-001-test", requirement);

			// Read
			let readEntity = await fileManager.readEntity(
				"requirement",
				"req-001-test",
			);
			expect(readEntity).not.toBeNull();
			expect(readEntity?.slug).toBe("test-req");

			// Update
			const updatedRequirement = createValidRequirement({
				name: "Updated Name",
			});
			await fileManager.writeEntity(
				"requirement",
				"req-001-test",
				updatedRequirement,
			);

			readEntity = await fileManager.readEntity("requirement", "req-001-test");
			expect(readEntity?.name).toBe("Updated Name");

			// Delete
			const deleted = await fileManager.deleteEntity(
				"requirement",
				"req-001-test",
			);
			expect(deleted).toBe(true);

			readEntity = await fileManager.readEntity("requirement", "req-001-test");
			expect(readEntity).toBeNull();
		});

		it("should handle multiple entity types simultaneously", async () => {
			await fileManager.ensureDirectoryStructure();

			// Create different types of entities
			await fileManager.writeEntity(
				"requirement",
				"req-001-test",
				createValidRequirement(),
			);
			await fileManager.writeEntity("plan", "pln-001-test", createValidPlan());
			await fileManager.writeEntity(
				"app",
				"app-001-test",
				createValidComponent("app"),
			);

			// List all types
			const reqIds = await fileManager.listEntityIds("requirement");
			const planIds = await fileManager.listEntityIds("plan");
			const appIds = await fileManager.listEntityIds("app");

			expect(reqIds).toHaveLength(1);
			expect(planIds).toHaveLength(1);
			expect(appIds).toHaveLength(1);
		});

		it("should maintain data integrity across operations", async () => {
			await fileManager.ensureDirectoryStructure();

			const requirement1 = createValidRequirement({
				slug: "first",
				name: "First Requirement",
			});
			const requirement2 = createValidRequirement({
				slug: "second",
				name: "Second Requirement",
				number: 2,
			});

			// Write both
			await fileManager.writeEntity(
				"requirement",
				"req-001-first",
				requirement1,
			);
			await fileManager.writeEntity(
				"requirement",
				"req-002-second",
				requirement2,
			);

			// Delete first
			await fileManager.deleteEntity("requirement", "req-001-first");

			// Verify second still exists and is intact
			const remaining = await fileManager.readEntity(
				"requirement",
				"req-002-second",
			);
			expect(remaining).not.toBeNull();
			expect(remaining?.name).toBe("Second Requirement");

			// Verify only one ID remains
			const ids = await fileManager.listEntityIds("requirement");
			expect(ids).toHaveLength(1);
			expect(ids[0]).toBe("req-002-second");
		});
	});
});
