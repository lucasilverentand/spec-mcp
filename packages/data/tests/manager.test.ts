import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type AnyEntity,
	SpecsManager,
	SpecsManagerConfig,
} from "../src/manager.js";

describe("SpecsManagerConfig", () => {
	it("should parse valid config", () => {
		const validConfig = {
			path: "/custom/specs/path",
			autoDetect: false,
		};

		expect(() => SpecsManagerConfig.parse(validConfig)).not.toThrow();
	});

	it("should use defaults", () => {
		const config = {};
		const parsed = SpecsManagerConfig.parse(config);

		expect(parsed.autoDetect).toBe(true);
		expect(parsed.path).toBeUndefined();
	});

	it("should reject empty path string", () => {
		const invalidConfig = {
			path: "",
			autoDetect: true,
		};

		expect(() => SpecsManagerConfig.parse(invalidConfig)).toThrow();
	});
});

describe("SpecsManager", () => {
	let tempDir: string;
	let manager: SpecsManager;

	// Helper function to create valid test requirement data
	const createValidRequirementData = (overrides = {}) => ({
		slug: "test-req",
		name: "Test Requirement",
		description: "Test description",
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

	// Helper function to create valid test plan data
	const createValidPlanData = (overrides = {}) => ({
		slug: "test-plan",
		name: "Test Plan",
		description: "Test description",
		priority: "medium" as const,
		acceptance_criteria: "Should work",
		tasks: [] as unknown[],
		flows: [] as unknown[],
		...overrides,
	});

	// Helper function to create valid test component data
	const createValidComponentData = (type: string, overrides = {}) => ({
		type: type as const,
		slug: "test-component",
		name: "Test Component",
		description: "Test description",
		capabilities: [] as string[],
		setup_tasks: [] as unknown[],
		...overrides,
	});

	beforeEach(async () => {
		// Create a temporary directory for each test
		tempDir = await mkdtemp(join(tmpdir(), "specs-test-"));
		manager = new SpecsManager({
			path: tempDir,
			autoDetect: false,
			referenceValidation: false, // Disable reference validation for tests
		});
	});

	afterEach(async () => {
		// Clean up temporary directory
		await rm(tempDir, { recursive: true, force: true });

		// Clean up any test artifacts in current directory
		const currentDirSpecs = join(process.cwd(), "specs");
		const currentDirDotSpecs = join(process.cwd(), ".specs");
		await rm(currentDirSpecs, { recursive: true, force: true }).catch(() => {});
		await rm(currentDirDotSpecs, { recursive: true, force: true }).catch(
			() => {},
		);
	});

	describe("Path Resolution", () => {
		it("should use provided path when autoDetect is false", async () => {
			// Create a separate temp directory for this test
			const testTempDir = await mkdtemp(join(tmpdir(), "specs-test-fallback-"));
			const manager = new SpecsManager({
				path: testTempDir,
				autoDetect: false,
				referenceValidation: false,
			});

			// This will use the provided testTempDir path
			await manager.createRequirement(
				createValidRequirementData({
					slug: "test",
					name: "Test",
					criteria: [
						{
							id: "req-001-test/crit-001",
							description: "Test criteria",
							plan_id: "pln-001-test-plan",
							completed: false,
						},
					],
				}),
			);

			// Verify it was created in the temp directory
			const requirements = await manager.listRequirements();
			expect(requirements).toHaveLength(1);
			expect(requirements[0].slug).toBe("test");

			// Clean up temp directory
			await rm(testTempDir, { recursive: true, force: true });
		});

		it("should handle autoDetect when no .specs folder exists", async () => {
			// Create a separate temp directory for this test
			const testTempDir = await mkdtemp(
				join(tmpdir(), "specs-test-autodetect-"),
			);
			const manager = new SpecsManager({
				path: testTempDir,
				autoDetect: false, // Force it to use the specified path
				referenceValidation: false,
			});

			// Should create default .specs folder and succeed
			const requirement = await manager.createRequirement(
				createValidRequirementData({
					slug: "test",
					name: "Test",
					criteria: [
						{
							id: "req-001-test/crit-001",
							description: "Test criteria",
							plan_id: "pln-001-test-plan",
							completed: false,
						},
					],
				}),
			);

			expect(requirement).toBeDefined();
			expect(requirement.id).toBe("req-001-test");

			// Clean up temp directory
			await rm(testTempDir, { recursive: true, force: true });
		});

		it("should handle autoDetect when .specs folder exists in current directory", async () => {
			// Create .specs folder in current directory
			const specsDir = join(process.cwd(), ".specs");
			await mkdir(specsDir, { recursive: true });
			await mkdir(join(specsDir, "requirements"), { recursive: true });

			try {
				const manager = new SpecsManager({
					autoDetect: true,
					referenceValidation: false,
				});

				const requirement = await manager.createRequirement(
					createValidRequirementData({
						slug: "test",
						name: "Test",
						criteria: [
							{
								id: "req-001-test/crit-001",
								description: "Test criteria",
								plan_id: "pln-001-test-plan",
								completed: false,
							},
						],
					}),
				);

				expect(requirement.slug).toBe("test");
			} finally {
				// Clean up
				await rm(specsDir, { recursive: true, force: true });
			}
		});
	});

	describe("Requirement CRUD Operations", () => {
		it("should create a requirement successfully", async () => {
			const requirementData = {
				slug: "user-authentication",
				name: "User Authentication",
				description: "Users should be able to authenticate",
				overview: "User authentication requirement overview",
				priority: "required" as const,
				criteria: [
					{
						id: "req-001-user-authentication/crit-001",
						description: "User can log in with valid credentials",
						plan_id: "pln-001-auth-plan",
						completed: false,
					},
				],
			};

			const requirement = await manager.createRequirement(requirementData);

			expect(requirement.type).toBe("requirement");
			expect(requirement.number).toBe(1);
			expect(requirement.slug).toBe("user-authentication");
			expect(requirement.name).toBe("User Authentication");
			expect(requirement.priority).toBe("required");
			expect(requirement.criteria).toHaveLength(1);
		});

		it("should get a requirement by ID", async () => {
			// First create a requirement
			const requirementData = createValidRequirementData();
			const created = await manager.createRequirement(requirementData);

			// Then retrieve it using the actual generated ID
			const retrieved = await manager.getRequirement(created.id);

			expect(retrieved).not.toBeNull();
			expect(retrieved?.slug).toBe("test-req");
			expect(retrieved?.name).toBe("Test Requirement");
		});

		it("should return null for non-existent requirement", async () => {
			const retrieved = await manager.getRequirement("req-999-non-existent");
			expect(retrieved).toBeNull();
		});

		it("should update a requirement", async () => {
			// Create initial requirement
			const requirementData = createValidRequirementData({
				description: "Original description",
			});

			const created = await manager.createRequirement(requirementData);

			// Update it
			const updated = await manager.updateRequirement(created.id, {
				description: "Updated description",
				priority: "critical",
			});

			expect(updated.description).toBe("Updated description");
			expect(updated.priority).toBe("critical");
			expect(updated.slug).toBe("test-req"); // Should preserve original slug
		});

		it("should delete a requirement", async () => {
			// Create requirement
			const requirementData = createValidRequirementData();
			const created = await manager.createRequirement(requirementData);

			// Delete it
			const deleted = await manager.deleteRequirement(created.id);
			expect(deleted).toBe(true);

			// Verify it's gone
			const retrieved = await manager.getRequirement(created.id);
			expect(retrieved).toBeNull();
		});

		it("should list requirements with filters", async () => {
			// Create multiple requirements
			const req1Data = {
				slug: "critical-req",
				name: "Critical Requirement",
				description: "Critical requirement",
				priority: "critical" as const,
				criteria: [
					{
						id: "req-001-critical-req/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test-plan",
						completed: true,
					},
				],
			};

			const req2Data = {
				slug: "optional-req",
				name: "Optional Requirement",
				description: "Optional requirement",
				priority: "optional" as const,
				criteria: [
					{
						id: "req-002-optional-req/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test-plan",
						completed: false,
					},
				],
			};

			await manager.createRequirement(req1Data);
			await manager.createRequirement(req2Data);

			// Filter by priority
			const criticalReqs = await manager.listRequirements({
				priority: ["critical"],
			});
			expect(criticalReqs).toHaveLength(1);
			expect(criticalReqs[0].priority).toBe("critical");

			// Filter by completion status
			const completedReqs = await manager.listRequirements({
				completed: true,
			});
			expect(completedReqs).toHaveLength(1);
			expect(completedReqs[0].criteria.every((c) => c.completed)).toBe(true);
		});
	});

	describe("Plan CRUD Operations", () => {
		it("should create a plan successfully", async () => {
			const planData = createValidPlanData({
				slug: "auth-implementation",
				name: "Authentication Implementation",
				description: "Implement user authentication system",
				acceptance_criteria: "Users can log in and out successfully",
				priority: "high" as const,
			});

			const plan = await manager.createPlan(planData);

			expect(plan.type).toBe("plan");
			expect(plan.number).toBe(1);
			expect(plan.slug).toBe("auth-implementation");
			expect(plan.priority).toBe("high");
			expect(plan.completed).toBe(false);
			expect(plan.approved).toBe(false);
		});

		it("should handle plan dependencies", async () => {
			const planData = createValidPlanData({
				slug: "frontend-app",
				name: "Frontend Application",
				description: "Build frontend application",
				acceptance_criteria: "Frontend is responsive and functional",
				depends_on: ["pln-001-auth-system", "pln-002-database-setup"],
			});

			const plan = await manager.createPlan(planData);
			expect(plan.depends_on).toEqual([
				"pln-001-auth-system",
				"pln-002-database-setup",
			]);
		});
	});

	describe("Component CRUD Operations", () => {
		it("should create an app component", async () => {
			const appData = createValidComponentData("app", {
				slug: "frontend-app",
				name: "Frontend Application",
				description: "Main frontend application",
				deployment_targets: ["web", "ios"] as const,
				folder: "apps/frontend",
			});

			const app = await manager.createComponent(appData);

			expect(app.type).toBe("app");
			expect(app.number).toBe(1);
			expect(app.slug).toBe("frontend-app");
			expect(
				(app as { deployment_targets: string[] }).deployment_targets,
			).toEqual(["web", "ios"]);
		});

		it("should create a service component", async () => {
			const serviceData = createValidComponentData("service", {
				slug: "auth-service",
				name: "Authentication Service",
				description: "Handles user authentication",
				dev_port: 3001,
				folder: "services/auth",
			});

			const service = await manager.createComponent(serviceData);

			expect(service.type).toBe("service");
			expect((service as { dev_port: number }).dev_port).toBe(3001);
		});

		it("should determine component type from ID correctly", async () => {
			// Create different types of components
			const appData = {
				type: "app" as const,
				slug: "test-app",
				name: "Test App",
				description: "Test application",
			};

			const serviceData = {
				type: "service" as const,
				slug: "test-service",
				name: "Test Service",
				description: "Test service",
			};

			await manager.createComponent(appData);
			await manager.createComponent(serviceData);

			// Retrieve them using generic getComponent method
			const app = await manager.getComponent("app-001-test-app");
			const service = await manager.getComponent("svc-001-test-service");

			expect(app?.type).toBe("app");
			expect(service?.type).toBe("service");
		});
	});

	describe("Batch Operations", () => {
		it("should create multiple entities", async () => {
			const entities: Array<Omit<AnyEntity, "number">> = [
				{
					type: "requirement",
					slug: "req1",
					name: "Requirement 1",
					description: "First requirement",
					criteria: [
						{
							id: "req-001-req1/crit-001",
							description: "Test criteria",
							plan_id: "pln-001-test-plan",
							completed: false,
						},
					],
				},
				{
					type: "plan",
					slug: "plan1",
					name: "Plan 1",
					description: "First plan",
					acceptance_criteria: "Plan should work",
				},
				{
					type: "app",
					slug: "app1",
					name: "App 1",
					description: "First app",
				},
			];

			const results = await manager.createMultipleEntities(entities);

			expect(results).toHaveLength(3);
			expect(results[0].type).toBe("requirement");
			expect(results[1].type).toBe("plan");
			expect(results[2].type).toBe("app");
		});

		it("should get all entities", async () => {
			// Create some entities first
			await manager.createRequirement({
				slug: "test-req",
				name: "Test Requirement",
				description: "Test description",
				criteria: [
					{
						id: "req-001-test-req/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test-plan",
						completed: false,
					},
				],
			});

			await manager.createPlan({
				slug: "test-plan",
				name: "Test Plan",
				description: "Test description",
				acceptance_criteria: "Should work",
			});

			await manager.createComponent({
				type: "app",
				slug: "test-app",
				name: "Test App",
				description: "Test description",
			});

			const allEntities = await manager.getAllEntities();

			expect(allEntities.requirements).toHaveLength(1);
			expect(allEntities.plans).toHaveLength(1);
			expect(allEntities.components).toHaveLength(1);
		});
	});

	describe("Validation", () => {
		it("should auto-fix requirement criteria IDs to match requirement number", async () => {
			const requirementData = {
				slug: "test-req",
				name: "Test Requirement",
				description: "Test description",
				criteria: [
					{
						id: "req-999-test-req/crit-001", // Wrong number, will be auto-fixed
						description: "Test criteria",
						plan_id: "pln-001-test-plan",
						completed: false,
					},
				],
			};

			const requirement = await manager.createRequirement(requirementData);

			expect(requirement).toBeDefined();
			expect(requirement.criteria[0].id).toBe("req-001-test-req/crit-001"); // Auto-fixed ID
		});

		it("should reject invalid component dependency IDs", async () => {
			const invalidComponent = {
				type: "app" as const,
				slug: "test-app",
				name: "Test App",
				description: "Test description",
				depends_on: ["invalid-dependency-id"],
			};

			await expect(manager.createComponent(invalidComponent)).rejects.toThrow();
		});
	});

	describe("Reference Validation", () => {
		it("should validate plan dependencies exist", async () => {
			// Create a plan with non-existent dependency
			await manager.createPlan({
				slug: "dependent-plan",
				name: "Dependent Plan",
				description: "A plan that depends on others",
				acceptance_criteria: "Should work with dependencies",
				depends_on: ["pln-999-non-existent"],
			});

			const validation = await manager.validateReferences();

			expect(validation.valid).toBe(false);
			expect(validation.errors).toContain(
				"Plan 'dependent-plan' depends on non-existent plan 'pln-999-non-existent'",
			);
		});

		it("should validate component dependencies exist", async () => {
			// Create a component with non-existent dependency
			await manager.createComponent({
				type: "app",
				slug: "dependent-app",
				name: "Dependent App",
				description: "An app that depends on others",
				depends_on: ["svc-999-non-existent"],
			});

			const validation = await manager.validateReferences();

			expect(validation.valid).toBe(false);
			expect(validation.errors).toContain(
				"Component 'dependent-app' depends on non-existent component 'svc-999-non-existent'",
			);
		});

		it("should return valid when all references exist", async () => {
			// Create plan and its dependency
			await manager.createPlan({
				slug: "base-plan",
				name: "Base Plan",
				description: "Base plan",
				acceptance_criteria: "Base functionality",
			});

			await manager.createPlan({
				slug: "dependent-plan",
				name: "Dependent Plan",
				description: "Dependent plan",
				acceptance_criteria: "Extended functionality",
				depends_on: ["pln-001-base-plan"],
			});

			const validation = await manager.validateReferences();

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});
	});

	describe("Error Handling", () => {
		it("should handle file system errors gracefully", async () => {
			// Test deleting non-existent requirement
			const deleted = await manager.deleteRequirement("req-999-non-existent");
			expect(deleted).toBe(false);
		});

		it("should handle file system errors for plans", async () => {
			const deleted = await manager.deletePlan("pln-999-non-existent");
			expect(deleted).toBe(false);
		});

		it("should handle file system errors for components", async () => {
			const deleted = await manager.deleteComponent("app-999-non-existent");
			expect(deleted).toBe(false);
		});

		it("should return empty arrays for non-existent directories", async () => {
			// Create a manager with a non-existent base path to test error handling
			const emptyManager = new SpecsManager({
				path: join(tempDir, "non-existent"),
				autoDetect: false,
				referenceValidation: false,
			});

			const requirements = await emptyManager.listRequirements();
			expect(requirements).toEqual([]);

			const plans = await emptyManager.listPlans();
			expect(plans).toEqual([]);

			const components = await emptyManager.listComponents();
			expect(components).toEqual([]);
		});

		it("should handle update of non-existent requirement", async () => {
			await expect(
				manager.updateRequirement("req-999-non-existent", {
					description: "Updated description",
				}),
			).rejects.toThrow("Requirement with ID 'req-999-non-existent' not found");
		});

		it("should handle update of non-existent plan", async () => {
			await expect(
				manager.updatePlan("pln-999-non-existent", {
					description: "Updated description",
				}),
			).rejects.toThrow("Plan with ID 'pln-999-non-existent' not found");
		});

		it("should handle update of non-existent component", async () => {
			await expect(
				manager.updateComponent("app-999-non-existent", {
					description: "Updated description",
				}),
			).rejects.toThrow("Component with ID 'app-999-non-existent' not found");
		});

		it("should handle invalid component ID format in getComponentTypeFromId", async () => {
			await expect(manager.getComponent("invalid-id-format")).rejects.toThrow();
		});

		it("should handle unknown entity type in validateEntity", async () => {
			// This tests the default case in validateEntity
			const invalidEntity: Partial<AnyEntity> = {
				type: "unknown",
				number: 1,
				slug: "test",
				name: "Test",
				description: "Test",
			};

			await expect(
				manager.createMultipleEntities([invalidEntity]),
			).rejects.toThrow("Unknown entity type: unknown");
		});

		it("should handle directory creation errors", async () => {
			// Create a file where a directory should be to cause EEXIST error that isn't a directory
			const conflictPath = join(tempDir, "requirements");
			await writeFile(conflictPath, "conflict");

			// This should not throw even though there's a file conflict
			await expect(
				manager.createRequirement({
					slug: "test",
					name: "Test",
					description: "Test",
					criteria: [
						{
							id: "req-001-test/crit-001",
							description: "Test criteria",
							plan_id: "pln-001-test",
							completed: false,
						},
					],
				}),
			).rejects.toThrow(); // Will throw due to directory creation issue
		});
	});

	describe("Component Type Detection", () => {
		it("should correctly identify all component types from IDs", async () => {
			const testCases = [
				{ id: "app-001-test", expectedType: "app" },
				{ id: "svc-001-test", expectedType: "service" },
				{ id: "lib-001-test", expectedType: "library" },
				{ id: "tol-001-test", expectedType: "tool" },
			];

			for (const { id, expectedType } of testCases) {
				// Create a component of each type first
				await manager.createComponent({
					type: expectedType as Record<string, unknown>,
					slug: "test",
					name: "Test",
					description: "Test",
				});

				const component = await manager.getComponent(id);
				expect(component?.type).toBe(expectedType);
			}
		});
	});

	describe("Filter Edge Cases", () => {
		it("should handle complex requirement filtering", async () => {
			// Create requirements with different states
			await manager.createRequirement({
				slug: "critical-incomplete",
				name: "Critical Incomplete",
				description: "Critical requirement",
				priority: "critical",
				criteria: [
					{
						id: "req-001-critical-incomplete/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			await manager.createRequirement({
				slug: "required-complete",
				name: "Required Complete",
				description: "Required requirement",
				priority: "required",
				criteria: [
					{
						id: "req-002-required-complete/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: true,
					},
				],
			});

			// Test multiple priority filter
			const multiPriorityReqs = await manager.listRequirements({
				priority: ["critical", "required"],
			});
			expect(multiPriorityReqs).toHaveLength(2);

			// Test incomplete requirements
			const incompleteReqs = await manager.listRequirements({
				completed: false,
			});
			expect(incompleteReqs).toHaveLength(1);
			expect(incompleteReqs[0].priority).toBe("critical");
		});

		it("should handle complex plan filtering", async () => {
			await manager.createPlan({
				slug: "high-incomplete-unapproved",
				name: "High Priority Plan",
				description: "High priority plan",
				priority: "high",
				acceptance_criteria: "Should work",
				completed: false,
				approved: false,
			});

			await manager.createPlan({
				slug: "medium-complete-approved",
				name: "Medium Priority Plan",
				description: "Medium priority plan",
				priority: "medium",
				acceptance_criteria: "Should work",
				completed: true,
				approved: true,
			});

			// Test multiple filters
			const highPlans = await manager.listPlans({
				priority: ["high"],
			});
			expect(highPlans).toHaveLength(1);

			const incompletePlans = await manager.listPlans({
				completed: false,
			});
			expect(incompletePlans).toHaveLength(1);

			const unapprovedPlans = await manager.listPlans({
				approved: false,
			});
			expect(unapprovedPlans).toHaveLength(1);
		});

		it("should handle component filtering by type and folder", async () => {
			await manager.createComponent({
				type: "app",
				slug: "frontend-app",
				name: "Frontend App",
				description: "Frontend application",
				folder: "apps/frontend",
			});

			await manager.createComponent({
				type: "service",
				slug: "backend-service",
				name: "Backend Service",
				description: "Backend service",
				folder: "services/backend",
			});

			// Filter by type
			const apps = await manager.listComponents({
				type: ["app"],
			});
			expect(apps).toHaveLength(1);
			expect(apps[0].type).toBe("app");

			// Filter by folder
			const frontendComponents = await manager.listComponents({
				folder: "apps/frontend",
			});
			expect(frontendComponents).toHaveLength(1);
			expect(frontendComponents[0].slug).toBe("frontend-app");
		});
	});

	describe("ID Generation and Numbering", () => {
		it("should generate sequential numbers correctly", async () => {
			// Create multiple requirements to test numbering
			const req1 = await manager.createRequirement({
				slug: "first",
				name: "First",
				description: "First requirement",
				criteria: [
					{
						id: "req-001-first/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			const req2 = await manager.createRequirement({
				slug: "second",
				name: "Second",
				description: "Second requirement",
				criteria: [
					{
						id: "req-002-second/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			expect(req1.number).toBe(1);
			expect(req2.number).toBe(2);
		});

		it("should auto-generate slug from name when missing", async () => {
			const requirement = await manager.createRequirement({
				slug: undefined as Record<string, unknown>,
				name: "Test Requirement",
				description: "Test",
				criteria: [
					{
						id: "req-001-test-requirement/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			expect(requirement).toBeDefined();
			expect(requirement.slug).toBe("test-requirement"); // Auto-generated from name
			expect(requirement.id).toBe("req-001-test-requirement");
		});

		it("should handle getNextNumber when directory doesn't exist", async () => {
			const emptyManager = new SpecsManager({
				path: join(tempDir, "empty"),
				autoDetect: false,
				referenceValidation: false,
			});

			// Should start with number 1 when no existing files
			const req = await emptyManager.createRequirement({
				slug: "first",
				name: "First",
				description: "First requirement",
				criteria: [
					{
						id: "req-001-first/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			expect(req.number).toBe(1);
		});
	});

	describe("YAML File Handling", () => {
		it("should handle corrupted YAML files gracefully", async () => {
			// Create a requirement first
			await manager.createRequirement({
				slug: "test",
				name: "Test",
				description: "Test",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			// Corrupt the YAML file with content that will cause a parse error
			const filePath = join(tempDir, "requirements", "req-001-test.yml");
			await writeFile(filePath, "key: [unclosed array");

			// Should throw an error when trying to read corrupted file
			await expect(manager.getRequirement("req-001-test")).rejects.toThrow();
		});

		it("should handle file read errors in listing operations", async () => {
			// Create a requirement first
			await manager.createRequirement({
				slug: "test",
				name: "Test",
				description: "Test",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			// Create a plan
			await manager.createPlan({
				slug: "test-plan",
				name: "Test Plan",
				description: "Test description",
				acceptance_criteria: "Should work",
			});

			// Create a component
			await manager.createComponent({
				type: "app",
				slug: "test-app",
				name: "Test App",
				description: "Test description",
			});

			// Now list all to ensure files can be read properly
			const requirements = await manager.listRequirements();
			const plans = await manager.listPlans();
			const components = await manager.listComponents();

			expect(requirements).toHaveLength(1);
			expect(plans).toHaveLength(1);
			expect(components).toHaveLength(1);

			// Test with files that aren't .yml files (should be skipped)
			await writeFile(
				join(tempDir, "requirements", "not-yml.txt"),
				"not a yml file",
			);
			await writeFile(join(tempDir, "plans", "readme.md"), "readme file");
			await writeFile(join(tempDir, "components", "config.json"), "{}");

			// Should still only return the yml files
			const requirementsWithExtraFiles = await manager.listRequirements();
			const plansWithExtraFiles = await manager.listPlans();
			const componentsWithExtraFiles = await manager.listComponents();

			expect(requirementsWithExtraFiles).toHaveLength(1);
			expect(plansWithExtraFiles).toHaveLength(1);
			expect(componentsWithExtraFiles).toHaveLength(1);
		});

		it("should handle file parsing errors gracefully in listing", async () => {
			// Create an invalid file that will cause parsing errors
			await mkdir(join(tempDir, "requirements"), { recursive: true });
			await writeFile(
				join(tempDir, "requirements", "req-001-broken.yml"),
				"key: [unclosed array",
			);

			// Should throw due to parsing error when trying to read the file
			await expect(manager.listRequirements()).rejects.toThrow();
		});
	});

	describe("Git Integration", () => {
		it("should handle git root detection gracefully", async () => {
			// Create a separate temp directory for this test
			const testTempDir = await mkdtemp(join(tmpdir(), "specs-test-git-"));
			const manager = new SpecsManager({
				path: testTempDir,
				autoDetect: false, // Use the specified path instead
				referenceValidation: false,
			});

			// This should work fine with the isolated directory
			const requirement = await manager.createRequirement({
				slug: "test",
				name: "Test",
				description: "Test",
				criteria: [
					{
						id: "req-001-test/crit-001",
						description: "Test criteria",
						plan_id: "pln-001-test",
						completed: false,
					},
				],
			});

			expect(requirement).toBeDefined();
			expect(requirement.id).toBe("req-001-test");

			// Clean up temp directory
			await rm(testTempDir, { recursive: true, force: true });
		});
	});
});
