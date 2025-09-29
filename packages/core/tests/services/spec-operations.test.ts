import type {
	AnyComponent,
	ComponentFilter,
	Plan,
	PlanFilter,
	Requirement,
	RequirementFilter,
} from "@spec-mcp/data";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpecConfig } from "../../src/interfaces/config.js";
import { SpecOperations } from "../../src/services/spec-operations.js";

// Mock the SpecsManager
vi.mock("@spec-mcp/data", () => ({
	SpecsManager: vi.fn().mockImplementation(() => ({
		createRequirement: vi
			.fn()
			.mockImplementation((data) =>
				Promise.resolve({ ...data, id: "req-001", number: 1 }),
			),
		getRequirement: vi.fn().mockImplementation((id) => {
			if (id === "req-001") {
				return Promise.resolve({
					id: "req-001",
					type: "requirement",
					name: "Test Requirement",
					slug: "test-requirement",
					number: 1,
				});
			}
			return Promise.resolve(null);
		}),
		updateRequirement: vi
			.fn()
			.mockImplementation((id, data) =>
				Promise.resolve({ ...data, id, number: 1 }),
			),
		deleteRequirement: vi.fn().mockResolvedValue(true),
		listRequirements: vi.fn().mockImplementation((filter) => {
			const requirements = [
				{
					id: "req-001",
					type: "requirement",
					name: "Test 1",
					slug: "test-1",
					number: 1,
					priority: "high",
				},
				{
					id: "req-002",
					type: "requirement",
					name: "Test 2",
					slug: "test-2",
					number: 2,
					priority: "low",
				},
			];
			if (filter?.priority) {
				return Promise.resolve(
					requirements.filter((r) => r.priority === filter.priority),
				);
			}
			return Promise.resolve(requirements);
		}),
		createPlan: vi
			.fn()
			.mockImplementation((data) =>
				Promise.resolve({ ...data, id: "plan-001", number: 1 }),
			),
		getPlan: vi.fn().mockImplementation((id) => {
			if (id === "plan-001") {
				return Promise.resolve({
					id: "plan-001",
					type: "plan",
					name: "Test Plan",
					slug: "test-plan",
					number: 1,
				});
			}
			return Promise.resolve(null);
		}),
		updatePlan: vi
			.fn()
			.mockImplementation((id, data) =>
				Promise.resolve({ ...data, id, number: 1 }),
			),
		deletePlan: vi.fn().mockResolvedValue(true),
		listPlans: vi.fn().mockImplementation((filter) => {
			const plans = [
				{
					id: "plan-001",
					type: "plan",
					name: "Plan 1",
					slug: "plan-1",
					number: 1,
					status: "active",
				},
				{
					id: "plan-002",
					type: "plan",
					name: "Plan 2",
					slug: "plan-2",
					number: 2,
					status: "draft",
				},
			];
			if (filter?.status) {
				return Promise.resolve(plans.filter((p) => p.status === filter.status));
			}
			return Promise.resolve(plans);
		}),
		createComponent: vi
			.fn()
			.mockImplementation((data) =>
				Promise.resolve({ ...data, id: "comp-001", number: 1 }),
			),
		getComponent: vi.fn().mockImplementation((id) => {
			if (id === "comp-001") {
				return Promise.resolve({
					id: "comp-001",
					type: "component",
					componentType: "ui-component",
					name: "Test Component",
					slug: "test-component",
					number: 1,
				});
			}
			return Promise.resolve(null);
		}),
		updateComponent: vi
			.fn()
			.mockImplementation((id, data) =>
				Promise.resolve({ ...data, id, number: 1 }),
			),
		deleteComponent: vi.fn().mockResolvedValue(true),
		listComponents: vi.fn().mockImplementation((filter) => {
			const components = [
				{
					id: "comp-001",
					type: "component",
					componentType: "ui-component",
					name: "Component 1",
					slug: "component-1",
					number: 1,
				},
				{
					id: "comp-002",
					type: "component",
					componentType: "api-component",
					name: "Component 2",
					slug: "component-2",
					number: 2,
				},
			];
			if (filter?.componentType) {
				return Promise.resolve(
					components.filter((c) => c.componentType === filter.componentType),
				);
			}
			return Promise.resolve(components);
		}),
		createMultipleEntities: vi.fn().mockImplementation((entities) =>
			Promise.resolve(
				entities.map(
					(
						e: Omit<Requirement, "number"> | Omit<Plan, "number">,
						i: number,
					) => ({
						...e,
						id: `entity-${i}`,
						number: i + 1,
					}),
				),
			),
		),
		getAllEntities: vi.fn().mockResolvedValue({
			requirements: [
				{
					id: "req-001",
					type: "requirement",
					name: "Req 1",
					slug: "req-1",
					number: 1,
				},
			],
			plans: [
				{
					id: "plan-001",
					type: "plan",
					name: "Plan 1",
					slug: "plan-1",
					number: 1,
				},
			],
			components: [
				{
					id: "comp-001",
					type: "component",
					componentType: "ui-component",
					name: "Comp 1",
					slug: "comp-1",
					number: 1,
				},
			],
		}),
	})),
}));

describe("SpecOperations", () => {
	let operations: SpecOperations;
	let config: SpecConfig;

	beforeEach(() => {
		vi.clearAllMocks();
		config = {
			specsPath: "./test-specs",
			schemaValidation: true,
		};
		operations = new SpecOperations(config);
	});

	describe("Constructor and Initialization", () => {
		it("should create operations instance with default config", () => {
			const defaultOps = new SpecOperations();
			expect(defaultOps).toBeDefined();
		});

		it("should create operations instance with custom config", () => {
			expect(operations).toBeDefined();
		});

		it("should provide access to underlying manager", () => {
			const manager = operations.getManager();
			expect(manager).toBeDefined();
			expect(typeof manager.getAllEntities).toBe("function");
		});
	});

	describe("Requirement Operations", () => {
		describe("createRequirement", () => {
			it("should create a requirement successfully", async () => {
				const reqData: Omit<Requirement, "number"> = {
					id: "new-req",
					type: "requirement",
					name: "New Requirement",
					slug: "new-requirement",
				};

				const result = await operations.createRequirement(reqData);
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.id).toBe("req-001");
				expect(result.data?.number).toBe(1);
			});

			it("should handle creation errors", async () => {
				const manager = operations.getManager();
				manager.createRequirement = vi
					.fn()
					.mockRejectedValue(new Error("Creation failed"));

				const result = await operations.createRequirement(
					{} as Omit<Requirement, "number">,
				);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Creation failed");
			});
		});

		describe("getRequirement", () => {
			it("should get requirement by id", async () => {
				const result = await operations.getRequirement("req-001");
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.id).toBe("req-001");
			});

			it("should return error when requirement not found", async () => {
				const result = await operations.getRequirement("non-existent");
				expect(result.success).toBe(false);
				expect(result.error).toContain("not found");
			});

			it("should handle get errors", async () => {
				const manager = operations.getManager();
				manager.getRequirement = vi
					.fn()
					.mockRejectedValue(new Error("Get failed"));

				const result = await operations.getRequirement("req-001");
				expect(result.success).toBe(false);
				expect(result.error).toBe("Get failed");
			});
		});

		describe("updateRequirement", () => {
			it("should update requirement successfully", async () => {
				const updateData: Partial<Requirement> = {
					name: "Updated Name",
				};

				const result = await operations.updateRequirement(
					"req-001",
					updateData,
				);
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.id).toBe("req-001");
			});

			it("should handle update errors", async () => {
				const manager = operations.getManager();
				manager.updateRequirement = vi
					.fn()
					.mockRejectedValue(new Error("Update failed"));

				const result = await operations.updateRequirement("req-001", {});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Update failed");
			});
		});

		describe("deleteRequirement", () => {
			it("should delete requirement successfully", async () => {
				const result = await operations.deleteRequirement("req-001");
				expect(result.success).toBe(true);
				expect(result.data).toBe(true);
			});

			it("should handle delete errors", async () => {
				const manager = operations.getManager();
				manager.deleteRequirement = vi
					.fn()
					.mockRejectedValue(new Error("Delete failed"));

				const result = await operations.deleteRequirement("req-001");
				expect(result.success).toBe(false);
				expect(result.error).toBe("Delete failed");
			});
		});

		describe("listRequirements", () => {
			it("should list all requirements without filter", async () => {
				const result = await operations.listRequirements();
				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Array);
				expect(result.data?.length).toBe(2);
			});

			it("should list requirements with filter", async () => {
				const filter: RequirementFilter = { priority: "high" };
				const result = await operations.listRequirements(filter);
				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Array);
				expect(result.data?.length).toBe(1);
				expect(result.data?.[0].priority).toBe("high");
			});

			it("should handle list errors", async () => {
				const manager = operations.getManager();
				manager.listRequirements = vi
					.fn()
					.mockRejectedValue(new Error("List failed"));

				const result = await operations.listRequirements();
				expect(result.success).toBe(false);
				expect(result.error).toBe("List failed");
			});
		});
	});

	describe("Plan Operations", () => {
		describe("createPlan", () => {
			it("should create a plan successfully", async () => {
				const planData: Omit<Plan, "number"> = {
					id: "new-plan",
					type: "plan",
					name: "New Plan",
					slug: "new-plan",
				};

				const result = await operations.createPlan(planData);
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.id).toBe("plan-001");
			});

			it("should handle creation errors", async () => {
				const manager = operations.getManager();
				manager.createPlan = vi
					.fn()
					.mockRejectedValue(new Error("Creation failed"));

				const result = await operations.createPlan({} as Omit<Plan, "number">);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Creation failed");
			});
		});

		describe("getPlan", () => {
			it("should get plan by id", async () => {
				const result = await operations.getPlan("plan-001");
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.id).toBe("plan-001");
			});

			it("should return error when plan not found", async () => {
				const result = await operations.getPlan("non-existent");
				expect(result.success).toBe(false);
				expect(result.error).toContain("not found");
			});
		});

		describe("updatePlan", () => {
			it("should update plan successfully", async () => {
				const updateData: Partial<Plan> = {
					name: "Updated Plan",
				};

				const result = await operations.updatePlan("plan-001", updateData);
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
			});

			it("should handle update errors", async () => {
				const manager = operations.getManager();
				manager.updatePlan = vi
					.fn()
					.mockRejectedValue(new Error("Update failed"));

				const result = await operations.updatePlan("plan-001", {});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Update failed");
			});
		});

		describe("deletePlan", () => {
			it("should delete plan successfully", async () => {
				const result = await operations.deletePlan("plan-001");
				expect(result.success).toBe(true);
				expect(result.data).toBe(true);
			});

			it("should handle delete errors", async () => {
				const manager = operations.getManager();
				manager.deletePlan = vi
					.fn()
					.mockRejectedValue(new Error("Delete failed"));

				const result = await operations.deletePlan("plan-001");
				expect(result.success).toBe(false);
				expect(result.error).toBe("Delete failed");
			});
		});

		describe("listPlans", () => {
			it("should list all plans without filter", async () => {
				const result = await operations.listPlans();
				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Array);
				expect(result.data?.length).toBe(2);
			});

			it("should list plans with filter", async () => {
				const filter: PlanFilter = { status: "active" };
				const result = await operations.listPlans(filter);
				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Array);
				expect(result.data?.length).toBe(1);
				expect(result.data?.[0].status).toBe("active");
			});

			it("should handle list errors", async () => {
				const manager = operations.getManager();
				vi.spyOn(manager, "listPlans").mockRejectedValue(
					new Error("List failed"),
				);

				const result = await operations.listPlans();
				expect(result.success).toBe(false);
				expect(result.error).toBe("List failed");
			});
		});
	});

	describe("Component Operations", () => {
		describe("createComponent", () => {
			it("should create a component successfully", async () => {
				const compData: Omit<AnyComponent, "number"> = {
					id: "new-comp",
					type: "component",
					componentType: "ui-component",
					name: "New Component",
					slug: "new-component",
				};

				const result = await operations.createComponent(compData);
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.id).toBe("comp-001");
			});

			it("should handle creation errors", async () => {
				const manager = operations.getManager();
				manager.createComponent = vi
					.fn()
					.mockRejectedValue(new Error("Creation failed"));

				const result = await operations.createComponent(
					{} as Omit<AnyComponent, "number">,
				);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Creation failed");
			});
		});

		describe("getComponent", () => {
			it("should get component by id", async () => {
				const result = await operations.getComponent("comp-001");
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.id).toBe("comp-001");
			});

			it("should return error when component not found", async () => {
				const result = await operations.getComponent("non-existent");
				expect(result.success).toBe(false);
				expect(result.error).toContain("not found");
			});
		});

		describe("updateComponent", () => {
			it("should update component successfully", async () => {
				const updateData: Partial<AnyComponent> = {
					name: "Updated Component",
				};

				const result = await operations.updateComponent("comp-001", updateData);
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
			});

			it("should handle update errors", async () => {
				const manager = operations.getManager();
				manager.updateComponent = vi
					.fn()
					.mockRejectedValue(new Error("Update failed"));

				const result = await operations.updateComponent("comp-001", {});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Update failed");
			});
		});

		describe("deleteComponent", () => {
			it("should delete component successfully", async () => {
				const result = await operations.deleteComponent("comp-001");
				expect(result.success).toBe(true);
				expect(result.data).toBe(true);
			});

			it("should handle delete errors", async () => {
				const manager = operations.getManager();
				manager.deleteComponent = vi
					.fn()
					.mockRejectedValue(new Error("Delete failed"));

				const result = await operations.deleteComponent("comp-001");
				expect(result.success).toBe(false);
				expect(result.error).toBe("Delete failed");
			});
		});

		describe("listComponents", () => {
			it("should list all components without filter", async () => {
				const result = await operations.listComponents();
				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Array);
				expect(result.data?.length).toBe(2);
			});

			it("should list components with filter", async () => {
				const filter: ComponentFilter = { componentType: "ui-component" };
				const result = await operations.listComponents(filter);
				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Array);
				expect(result.data?.length).toBe(1);
				expect(result.data?.[0].componentType).toBe("ui-component");
			});

			it("should handle list errors", async () => {
				const manager = operations.getManager();
				manager.listComponents = vi
					.fn()
					.mockRejectedValue(new Error("List failed"));

				const result = await operations.listComponents();
				expect(result.success).toBe(false);
				expect(result.error).toBe("List failed");
			});
		});
	});

	describe("Batch Operations", () => {
		describe("createMultipleEntities", () => {
			it("should create multiple entities successfully", async () => {
				const entities = [
					{
						id: "req-1",
						type: "requirement" as const,
						name: "Req 1",
						slug: "req-1",
					},
					{
						id: "plan-1",
						type: "plan" as const,
						name: "Plan 1",
						slug: "plan-1",
					},
				];

				const result = await operations.createMultipleEntities(entities);
				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Array);
				expect(result.data?.length).toBe(2);
				expect(result.data?.[0].id).toBe("entity-0");
				expect(result.data?.[1].id).toBe("entity-1");
			});

			it("should handle batch creation errors", async () => {
				const manager = operations.getManager();
				manager.createMultipleEntities = vi
					.fn()
					.mockRejectedValue(new Error("Batch creation failed"));

				const result = await operations.createMultipleEntities([]);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Batch creation failed");
			});
		});

		describe("getAllEntities", () => {
			it("should get all entities successfully", async () => {
				const result = await operations.getAllEntities();
				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data?.requirements).toBeInstanceOf(Array);
				expect(result.data?.plans).toBeInstanceOf(Array);
				expect(result.data?.components).toBeInstanceOf(Array);
				expect(result.data?.requirements.length).toBe(1);
				expect(result.data?.plans.length).toBe(1);
				expect(result.data?.components.length).toBe(1);
			});

			it("should handle getAllEntities errors", async () => {
				const manager = operations.getManager();
				manager.getAllEntities = vi
					.fn()
					.mockRejectedValue(new Error("Get all failed"));

				const result = await operations.getAllEntities();
				expect(result.success).toBe(false);
				expect(result.error).toBe("Get all failed");
			});
		});
	});

	describe("Integration Scenarios", () => {
		it("should perform complete CRUD workflow for requirements", async () => {
			// Create
			const createResult = await operations.createRequirement({
				id: "test-req",
				type: "requirement",
				name: "Test",
				slug: "test",
			});
			expect(createResult.success).toBe(true);

			// Read
			const getResult = await operations.getRequirement("req-001");
			expect(getResult.success).toBe(true);

			// Update
			const updateResult = await operations.updateRequirement("req-001", {
				name: "Updated",
			});
			expect(updateResult.success).toBe(true);

			// Delete
			const deleteResult = await operations.deleteRequirement("req-001");
			expect(deleteResult.success).toBe(true);
		});

		it("should perform complete CRUD workflow for plans", async () => {
			// Create
			const createResult = await operations.createPlan({
				id: "test-plan",
				type: "plan",
				name: "Test Plan",
				slug: "test-plan",
			});
			expect(createResult.success).toBe(true);

			// Read
			const getResult = await operations.getPlan("plan-001");
			expect(getResult.success).toBe(true);

			// Update
			const updateResult = await operations.updatePlan("plan-001", {
				name: "Updated Plan",
			});
			expect(updateResult.success).toBe(true);

			// Delete
			const deleteResult = await operations.deletePlan("plan-001");
			expect(deleteResult.success).toBe(true);
		});

		it("should perform complete CRUD workflow for components", async () => {
			// Create
			const createResult = await operations.createComponent({
				id: "test-comp",
				type: "component",
				componentType: "ui-component",
				name: "Test Component",
				slug: "test-component",
			});
			expect(createResult.success).toBe(true);

			// Read
			const getResult = await operations.getComponent("comp-001");
			expect(getResult.success).toBe(true);

			// Update
			const updateResult = await operations.updateComponent("comp-001", {
				name: "Updated Component",
			});
			expect(updateResult.success).toBe(true);

			// Delete
			const deleteResult = await operations.deleteComponent("comp-001");
			expect(deleteResult.success).toBe(true);
		});

		it("should handle mixed entity operations", async () => {
			const [reqs, plans, comps, all] = await Promise.all([
				operations.listRequirements(),
				operations.listPlans(),
				operations.listComponents(),
				operations.getAllEntities(),
			]);

			expect(reqs.success).toBe(true);
			expect(plans.success).toBe(true);
			expect(comps.success).toBe(true);
			expect(all.success).toBe(true);
		});

		it("should handle filtered list operations", async () => {
			const [filteredReqs, filteredPlans, filteredComps] = await Promise.all([
				operations.listRequirements({ priority: "high" }),
				operations.listPlans({ status: "active" }),
				operations.listComponents({ componentType: "ui-component" }),
			]);

			expect(filteredReqs.success).toBe(true);
			expect(filteredReqs.data?.length).toBe(1);

			expect(filteredPlans.success).toBe(true);
			expect(filteredPlans.data?.length).toBe(1);

			expect(filteredComps.success).toBe(true);
			expect(filteredComps.data?.length).toBe(1);
		});
	});

	describe("Error Propagation", () => {
		it("should propagate errors with proper error messages", async () => {
			const manager = operations.getManager();
			vi.spyOn(manager, "getRequirement").mockRejectedValue(
				new Error("Database connection failed"),
			);

			const result = await operations.getRequirement("req-001");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Database connection failed");
		});

		it("should handle non-Error exceptions", async () => {
			const manager = operations.getManager();
			vi.spyOn(manager, "getRequirement").mockRejectedValue("String error");

			const result = await operations.getRequirement("req-001");
			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed to get requirement");
		});
	});
});
