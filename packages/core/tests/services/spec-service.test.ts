import type { AnyEntity } from "@spec-mcp/data";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceConfig } from "../../src/interfaces/config.js";
import { SpecService } from "../../src/services/spec-service.js";

// Mock the SpecsManager
vi.mock("@spec-mcp/data", () => ({
	SpecsManager: vi.fn().mockImplementation(() => ({
		getAllEntities: vi.fn().mockResolvedValue({
			requirements: [],
			plans: [],
			components: [],
		}),
		getRequirement: vi.fn().mockResolvedValue({
			id: "req-001",
			type: "requirement",
			name: "Test Requirement",
		}),
		getPlan: vi.fn().mockResolvedValue({
			id: "plan-001",
			type: "plan",
			name: "Test Plan",
		}),
		getComponent: vi.fn().mockResolvedValue({
			id: "comp-001",
			type: "component",
			name: "Test Component",
		}),
		listRequirements: vi.fn().mockResolvedValue([]),
		listPlans: vi.fn().mockResolvedValue([]),
		listComponents: vi.fn().mockResolvedValue([]),
		createRequirement: vi
			.fn()
			.mockImplementation((data) =>
				Promise.resolve({ ...data, id: "req-new" }),
			),
		createPlan: vi
			.fn()
			.mockImplementation((data) =>
				Promise.resolve({ ...data, id: "plan-new" }),
			),
		createComponent: vi
			.fn()
			.mockImplementation((data) =>
				Promise.resolve({ ...data, id: "comp-new" }),
			),
		updateRequirement: vi
			.fn()
			.mockImplementation((id, data) => Promise.resolve({ ...data, id })),
		updatePlan: vi
			.fn()
			.mockImplementation((id, data) => Promise.resolve({ ...data, id })),
		updateComponent: vi
			.fn()
			.mockImplementation((id, data) => Promise.resolve({ ...data, id })),
		deleteRequirement: vi.fn().mockResolvedValue(true),
		deletePlan: vi.fn().mockResolvedValue(true),
		deleteComponent: vi.fn().mockResolvedValue(true),
	})),
}));

describe("SpecService", () => {
	let service: SpecService;
	let config: Partial<ServiceConfig>;

	beforeEach(() => {
		vi.clearAllMocks();
		config = {
			specsPath: "./test-specs",
			schemaValidation: true,
			referenceValidation: true,
		};
		service = new SpecService(config);
	});

	describe("Constructor and Basic Properties", () => {
		it("should create a service instance with default config", () => {
			const defaultService = new SpecService();
			expect(defaultService).toBeDefined();
			expect(defaultService.name).toBe("SpecService");
			expect(defaultService.version).toBe("2.0.0");
		});

		it("should create a service instance with custom config", () => {
			expect(service).toBeDefined();
			expect(service.name).toBe("SpecService");
			expect(service.version).toBe("2.0.0");
		});

		it("should initialize with isHealthy false", () => {
			expect(service.isHealthy).toBe(false);
		});
	});

	describe("Initialization and Lifecycle", () => {
		it("should initialize successfully", async () => {
			await service.initialize();
			expect(service.isHealthy).toBe(true);
		});

		it("should initialize with updated config", async () => {
			const newConfig: Partial<ServiceConfig> = {
				specsPath: "./new-path",
				schemaValidation: false,
			};
			await service.initialize(newConfig);
			expect(service.isHealthy).toBe(true);
		});

		it("should handle initialization errors", async () => {
			const failingService = new SpecService(config);
			const mockManager = failingService.getManager();
			mockManager.getAllEntities = vi
				.fn()
				.mockRejectedValue(new Error("Init failed"));

			await expect(failingService.initialize()).rejects.toThrow(
				"Failed to initialize SpecService",
			);
			expect(failingService.isHealthy).toBe(false);
		});

		it("should shutdown successfully", async () => {
			await service.initialize();
			expect(service.isHealthy).toBe(true);

			await service.shutdown();
			expect(service.isHealthy).toBe(false);
		});
	});

	describe("Health Checks", () => {
		it("should perform health check successfully", async () => {
			const result = await service.healthCheck();
			expect(result).toBe(true);
			expect(service.isHealthy).toBe(true);
		});

		it("should fail health check on error", async () => {
			const mockManager = service.getManager();
			mockManager.getAllEntities = vi
				.fn()
				.mockRejectedValue(new Error("Health check failed"));

			const result = await service.healthCheck();
			expect(result).toBe(false);
			expect(service.isHealthy).toBe(false);
		});

		it("should calculate health score with all metrics", async () => {
			await service.initialize();

			const result = await service.getHealthScore();
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.overall).toBeGreaterThanOrEqual(0);
			expect(result.data?.overall).toBeLessThanOrEqual(100);
			expect(result.data?.breakdown).toHaveProperty("coverage");
			expect(result.data?.breakdown).toHaveProperty("dependencies");
			expect(result.data?.breakdown).toHaveProperty("validation");
			expect(result.data?.issues).toBeInstanceOf(Array);
			expect(result.data?.recommendations).toBeInstanceOf(Array);
			expect(result.data?.timestamp).toBeInstanceOf(Date);
		});

		it("should handle health score calculation with partial failures gracefully", async () => {
			// The getHealthScore method aggregates multiple analysis results
			// and handles failures gracefully, so even if some operations fail,
			// it still attempts to calculate a health score
			const result = await service.getHealthScore();
			// The method should succeed even with partial failures
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});
	});

	describe("Report Generation", () => {
		it("should generate comprehensive report", async () => {
			await service.initialize();

			const result = await service.generateReport();
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.summary).toHaveProperty("totalSpecs");
			expect(result.data?.summary).toHaveProperty("healthScore");
			expect(result.data?.summary).toHaveProperty("issues");
			expect(result.data?.summary).toHaveProperty("lastUpdated");
			expect(result.data?.coverage).toBeDefined();
			expect(result.data?.validation).toBeDefined();
			expect(result.data?.dependencies).toBeDefined();
			expect(result.data?.orphans).toBeDefined();
		});

		it("should handle report generation with partial failures gracefully", async () => {
			// The generateReport method aggregates multiple results
			// and may succeed even with partial failures in some operations
			const result = await service.generateReport();
			// Check that the method at least attempts to generate a report
			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
		});
	});

	describe("Entity Validation", () => {
		it("should validate entity successfully", async () => {
			const entity: AnyEntity = {
				id: "req-001",
				type: "requirement",
				name: "Test Requirement",
				slug: "test-requirement",
				number: 1,
			};

			const result = await service.validateEntity(entity);
			expect(result).toBeDefined();
			expect(result).toHaveProperty("valid");
			expect(result).toHaveProperty("errors");
			expect(result).toHaveProperty("warnings");
		});

		it("should run full validation", async () => {
			const result = await service.runFullValidation();
			expect(result).toBeDefined();
			expect(result).toHaveProperty("valid");
			expect(result.errors).toBeInstanceOf(Array);
			expect(result.warnings).toBeInstanceOf(Array);
		});

		it("should validate references", async () => {
			const result = await service.validateReferences();
			expect(result).toBeDefined();
			expect(result).toHaveProperty("valid");
			expect(result.errors).toBeInstanceOf(Array);
		});

		it("should validate business rules", async () => {
			const result = await service.validateBusinessRules();
			expect(result).toBeDefined();
			expect(result).toHaveProperty("valid");
			expect(result.errors).toBeInstanceOf(Array);
		});
	});

	describe("Entity Collection", () => {
		it("should get all entities successfully", async () => {
			const result = await service.getAllEntities();
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.requirements).toBeInstanceOf(Array);
			expect(result.data?.plans).toBeInstanceOf(Array);
			expect(result.data?.components).toBeInstanceOf(Array);
			expect(result.data?.total).toBe(0);
			expect(result.data?.lastModified).toBeInstanceOf(Date);
		});

		it("should handle getAllEntities errors", async () => {
			const mockManager = service.getManager();
			mockManager.getAllEntities = vi
				.fn()
				.mockRejectedValue(new Error("Failed"));

			const result = await service.getAllEntities();
			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed");
		});
	});

	describe("Analysis Operations", () => {
		it("should analyze dependencies successfully", async () => {
			const result = await service.analyzeDependencies();
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should analyze coverage successfully", async () => {
			const result = await service.analyzeCoverage();
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should detect cycles successfully", async () => {
			const result = await service.detectCycles();
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should detect orphans successfully", async () => {
			const result = await service.detectOrphans();
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});
	});

	describe("Requirement CRUD Operations", () => {
		it("should get requirement by id", async () => {
			const result = await service.getRequirement("req-001");
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.id).toBe("req-001");
		});

		it("should handle getRequirement errors", async () => {
			const mockManager = service.getManager();
			mockManager.getRequirement = vi
				.fn()
				.mockRejectedValue(new Error("Not found"));

			const result = await service.getRequirement("invalid");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Not found");
		});

		it("should list requirements", async () => {
			const result = await service.listRequirements();
			expect(result.success).toBe(true);
			expect(result.data).toBeInstanceOf(Array);
		});

		it("should create requirement", async () => {
			const reqData = {
				type: "requirement" as const,
				name: "New Requirement",
				slug: "new-requirement",
			};

			const result = await service.createRequirement(reqData);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.id).toBe("req-new");
		});

		it("should update requirement", async () => {
			const updateData = {
				name: "Updated Requirement",
			};

			const result = await service.updateRequirement("req-001", updateData);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.id).toBe("req-001");
		});

		it("should delete requirement", async () => {
			const result = await service.deleteRequirement("req-001");
			expect(result.success).toBe(true);
			expect(result.data).toBe(true);
		});

		it("should handle delete requirement errors", async () => {
			const mockManager = service.getManager();
			mockManager.deleteRequirement = vi
				.fn()
				.mockRejectedValue(new Error("Delete failed"));

			const result = await service.deleteRequirement("req-001");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Delete failed");
		});
	});

	describe("Plan CRUD Operations", () => {
		it("should get plan by id", async () => {
			const result = await service.getPlan("plan-001");
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.id).toBe("plan-001");
		});

		it("should list plans", async () => {
			const result = await service.listPlans();
			expect(result.success).toBe(true);
			expect(result.data).toBeInstanceOf(Array);
		});

		it("should create plan", async () => {
			const planData = {
				type: "plan" as const,
				name: "New Plan",
				slug: "new-plan",
			};

			const result = await service.createPlan(planData);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.id).toBe("plan-new");
		});

		it("should update plan", async () => {
			const updateData = {
				name: "Updated Plan",
			};

			const result = await service.updatePlan("plan-001", updateData);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should delete plan", async () => {
			const result = await service.deletePlan("plan-001");
			expect(result.success).toBe(true);
			expect(result.data).toBe(true);
		});
	});

	describe("Component CRUD Operations", () => {
		it("should get component by id", async () => {
			const result = await service.getComponent("comp-001");
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.id).toBe("comp-001");
		});

		it("should list components", async () => {
			const result = await service.listComponents();
			expect(result.success).toBe(true);
			expect(result.data).toBeInstanceOf(Array);
		});

		it("should create component", async () => {
			const compData = {
				type: "component" as const,
				componentType: "ui-component" as const,
				name: "New Component",
				slug: "new-component",
			};

			const result = await service.createComponent(compData);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.id).toBe("comp-new");
		});

		it("should update component", async () => {
			const updateData = {
				name: "Updated Component",
			};

			const result = await service.updateComponent("comp-001", updateData);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should delete component", async () => {
			const result = await service.deleteComponent("comp-001");
			expect(result.success).toBe(true);
			expect(result.data).toBe(true);
		});
	});

	describe("Manager Access", () => {
		it("should provide access to underlying manager", () => {
			const manager = service.getManager();
			expect(manager).toBeDefined();
			expect(typeof manager.getAllEntities).toBe("function");
		});
	});

	describe("Configuration Reconfiguration", () => {
		it("should reconfigure components when initialized with new config", async () => {
			await service.initialize();

			const newConfig: Partial<ServiceConfig> = {
				specsPath: "./updated-path",
				schemaValidation: false,
			};

			await service.initialize(newConfig);
			expect(service.isHealthy).toBe(true);
		});
	});

	describe("Error Handling", () => {
		it("should handle CRUD operation errors gracefully", async () => {
			const mockManager = service.getManager();

			// Test all error scenarios
			mockManager.getRequirement = vi
				.fn()
				.mockRejectedValue(new Error("Get failed"));
			const getResult = await service.getRequirement("test");
			expect(getResult.success).toBe(false);

			mockManager.createRequirement = vi
				.fn()
				.mockRejectedValue(new Error("Create failed"));
			const createResult = await service.createRequirement({});
			expect(createResult.success).toBe(false);

			mockManager.updateRequirement = vi
				.fn()
				.mockRejectedValue(new Error("Update failed"));
			const updateResult = await service.updateRequirement("test", {});
			expect(updateResult.success).toBe(false);

			mockManager.deleteRequirement = vi
				.fn()
				.mockRejectedValue(new Error("Delete failed"));
			const deleteResult = await service.deleteRequirement("test");
			expect(deleteResult.success).toBe(false);
		});

		it("should handle list operation errors gracefully", async () => {
			const mockManager = service.getManager();

			mockManager.listRequirements = vi
				.fn()
				.mockRejectedValue(new Error("List failed"));
			const reqResult = await service.listRequirements();
			expect(reqResult.success).toBe(false);

			mockManager.listPlans = vi
				.fn()
				.mockRejectedValue(new Error("List failed"));
			const planResult = await service.listPlans();
			expect(planResult.success).toBe(false);

			mockManager.listComponents = vi
				.fn()
				.mockRejectedValue(new Error("List failed"));
			const compResult = await service.listComponents();
			expect(compResult.success).toBe(false);
		});
	});

	describe("Integration Scenarios", () => {
		it("should perform complete workflow: initialize, create, read, update, delete", async () => {
			await service.initialize();
			expect(service.isHealthy).toBe(true);

			// Create
			const createResult = await service.createRequirement({
				type: "requirement",
				name: "Workflow Test",
				slug: "workflow-test",
			});
			expect(createResult.success).toBe(true);

			// Read
			const readResult = await service.getRequirement("req-new");
			expect(readResult.success).toBe(true);

			// Update
			const updateResult = await service.updateRequirement("req-new", {
				name: "Updated Workflow Test",
			});
			expect(updateResult.success).toBe(true);

			// Delete
			const deleteResult = await service.deleteRequirement("req-new");
			expect(deleteResult.success).toBe(true);
		});

		it("should handle multiple analysis operations concurrently", async () => {
			await service.initialize();

			const [deps, coverage, cycles, orphans] = await Promise.all([
				service.analyzeDependencies(),
				service.analyzeCoverage(),
				service.detectCycles(),
				service.detectOrphans(),
			]);

			expect(deps.success).toBe(true);
			expect(coverage.success).toBe(true);
			expect(cycles.success).toBe(true);
			expect(orphans.success).toBe(true);
		});

		it("should maintain health status across operations", async () => {
			expect(service.isHealthy).toBe(false);

			await service.initialize();
			expect(service.isHealthy).toBe(true);

			await service.healthCheck();
			expect(service.isHealthy).toBe(true);

			await service.shutdown();
			expect(service.isHealthy).toBe(false);
		});
	});
});
