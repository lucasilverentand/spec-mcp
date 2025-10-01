import type {
	AnyComponent,
	AnyEntity,
	ComponentFilter,
	Constitution,
	ConstitutionFilter,
	Plan,
	PlanFilter,
	Requirement,
	RequirementFilter,
} from "@spec-mcp/data";
import { SpecsManager } from "@spec-mcp/data";
import type {
	CoverageAnalysisResult,
	CycleAnalysis,
	DependencyAnalysisResult,
	OrphanAnalysis,
} from "../interfaces/analyzer.js";
import type { SpecConfig } from "../interfaces/config.js";
import type { OperationResult } from "../interfaces/results.js";
import type { HealthScore } from "../interfaces/service.js";

type SpecOperationResult<T> = OperationResult<T>;

export class SpecOperations {
	private manager: SpecsManager;

	constructor(config: SpecConfig = {}) {
		this.manager = new SpecsManager(config);
	}

	// Requirement Operations
	async createRequirement(
		data: Omit<Requirement, "number">,
	): Promise<SpecOperationResult<Requirement>> {
		try {
			const requirement = await this.manager.createRequirement(data);
			return {
				success: true,
				data: requirement,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to create requirement",
			};
		}
	}

	async getRequirement(id: string): Promise<SpecOperationResult<Requirement>> {
		try {
			const requirement = await this.manager.getRequirement(id);
			if (!requirement) {
				return {
					success: false,
					error: `Requirement with ID '${id}' not found`,
				};
			}
			return {
				success: true,
				data: requirement,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get requirement",
			};
		}
	}

	async updateRequirement(
		id: string,
		data: Partial<Requirement>,
	): Promise<SpecOperationResult<Requirement>> {
		try {
			const requirement = await this.manager.updateRequirement(id, data);
			return {
				success: true,
				data: requirement,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to update requirement",
			};
		}
	}

	async deleteRequirement(id: string): Promise<SpecOperationResult<boolean>> {
		try {
			const deleted = await this.manager.deleteRequirement(id);
			return {
				success: true,
				data: deleted,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to delete requirement",
			};
		}
	}

	async listRequirements(
		filter?: RequirementFilter,
	): Promise<SpecOperationResult<Requirement[]>> {
		try {
			const requirements = await this.manager.listRequirements(filter);
			return {
				success: true,
				data: requirements,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to list requirements",
			};
		}
	}

	// Plan Operations
	async createPlan(
		data: Omit<Plan, "number">,
	): Promise<SpecOperationResult<Plan>> {
		try {
			const plan = await this.manager.createPlan(data);
			return {
				success: true,
				data: plan,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to create plan",
			};
		}
	}

	async getPlan(id: string): Promise<SpecOperationResult<Plan>> {
		try {
			const plan = await this.manager.getPlan(id);
			if (!plan) {
				return {
					success: false,
					error: `Plan with ID '${id}' not found`,
				};
			}
			return {
				success: true,
				data: plan,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to get plan",
			};
		}
	}

	async updatePlan(
		id: string,
		data: Partial<Plan>,
	): Promise<SpecOperationResult<Plan>> {
		try {
			const plan = await this.manager.updatePlan(id, data);
			return {
				success: true,
				data: plan,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to update plan",
			};
		}
	}

	async deletePlan(id: string): Promise<SpecOperationResult<boolean>> {
		try {
			const deleted = await this.manager.deletePlan(id);
			return {
				success: true,
				data: deleted,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to delete plan",
			};
		}
	}

	async listPlans(filter?: PlanFilter): Promise<SpecOperationResult<Plan[]>> {
		try {
			const plans = await this.manager.listPlans(filter);
			return {
				success: true,
				data: plans,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to list plans",
			};
		}
	}

	// Component Operations
	async createComponent(
		data: Omit<AnyComponent, "number">,
	): Promise<SpecOperationResult<AnyComponent>> {
		try {
			const component = await this.manager.createComponent(data);
			return {
				success: true,
				data: component,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to create component",
			};
		}
	}

	async getComponent(id: string): Promise<SpecOperationResult<AnyComponent>> {
		try {
			const component = await this.manager.getComponent(id);
			if (!component) {
				return {
					success: false,
					error: `Component with ID '${id}' not found`,
				};
			}
			return {
				success: true,
				data: component,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get component",
			};
		}
	}

	async updateComponent(
		id: string,
		data: Partial<AnyComponent>,
	): Promise<SpecOperationResult<AnyComponent>> {
		try {
			const component = await this.manager.updateComponent(id, data);
			return {
				success: true,
				data: component,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to update component",
			};
		}
	}

	async deleteComponent(id: string): Promise<SpecOperationResult<boolean>> {
		try {
			const deleted = await this.manager.deleteComponent(id);
			return {
				success: true,
				data: deleted,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to delete component",
			};
		}
	}

	async listComponents(
		filter?: ComponentFilter,
	): Promise<SpecOperationResult<AnyComponent[]>> {
		try {
			const components = await this.manager.listComponents(filter);
			return {
				success: true,
				data: components,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to list components",
			};
		}
	}

	// Constitution Operations
	async createConstitution(
		data: Omit<Constitution, "number">,
	): Promise<SpecOperationResult<Constitution>> {
		try {
			const constitution = await this.manager.createConstitution(data);
			return {
				success: true,
				data: constitution,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to create constitution",
			};
		}
	}

	async getConstitution(
		id: string,
	): Promise<SpecOperationResult<Constitution>> {
		try {
			const constitution = await this.manager.getConstitution(id);
			if (!constitution) {
				return {
					success: false,
					error: `Constitution with ID '${id}' not found`,
				};
			}
			return {
				success: true,
				data: constitution,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get constitution",
			};
		}
	}

	async updateConstitution(
		id: string,
		data: Partial<Constitution>,
	): Promise<SpecOperationResult<Constitution>> {
		try {
			const constitution = await this.manager.updateConstitution(id, data);
			return {
				success: true,
				data: constitution,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to update constitution",
			};
		}
	}

	async deleteConstitution(id: string): Promise<SpecOperationResult<boolean>> {
		try {
			const deleted = await this.manager.deleteConstitution(id);
			return {
				success: true,
				data: deleted,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to delete constitution",
			};
		}
	}

	async listConstitutions(
		filter?: ConstitutionFilter,
	): Promise<SpecOperationResult<Constitution[]>> {
		try {
			const constitutions = await this.manager.listConstitutions(filter);
			return {
				success: true,
				data: constitutions,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to list constitutions",
			};
		}
	}

	// Batch Operations
	async createMultipleEntities(
		entities: Array<Omit<AnyEntity, "number">>,
	): Promise<SpecOperationResult<AnyEntity[]>> {
		try {
			const createdEntities =
				await this.manager.createMultipleEntities(entities);
			return {
				success: true,
				data: createdEntities,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to create multiple entities",
			};
		}
	}

	async getAllEntities(): Promise<
		SpecOperationResult<{
			requirements: Requirement[];
			plans: Plan[];
			components: AnyComponent[];
		}>
	> {
		try {
			const entities = await this.manager.getAllEntities();
			return {
				success: true,
				data: entities,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get all entities",
			};
		}
	}

	// Analysis Operations (delegating to SpecService would be better, but for now create instances)
	async analyzeDependencies(): Promise<
		SpecOperationResult<DependencyAnalysisResult>
	> {
		try {
			const { SpecService } = await import("./spec-service.js");
			const service = new SpecService({
				specsPath: this.manager.config.path ?? "./specs",
			});
			const result = await service.analyzeDependencies();
			return result;
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to analyze dependencies",
			};
		}
	}

	async analyzeCoverage(): Promise<
		SpecOperationResult<CoverageAnalysisResult>
	> {
		try {
			const { SpecService } = await import("./spec-service.js");
			const service = new SpecService({
				specsPath: this.manager.config.path ?? "./specs",
			});
			const result = await service.analyzeCoverage();
			return result;
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to analyze coverage",
			};
		}
	}

	async detectCycles(): Promise<SpecOperationResult<CycleAnalysis>> {
		try {
			const { SpecService } = await import("./spec-service.js");
			const service = new SpecService({
				specsPath: this.manager.config.path ?? "./specs",
			});
			const result = await service.detectCycles();
			return result;
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to detect cycles",
			};
		}
	}

	async detectOrphans(): Promise<SpecOperationResult<OrphanAnalysis>> {
		try {
			const { SpecService } = await import("./spec-service.js");
			const service = new SpecService({
				specsPath: this.manager.config.path ?? "./specs",
			});
			const result = await service.detectOrphans();
			return result;
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to detect orphans",
			};
		}
	}

	async getHealthScore(): Promise<SpecOperationResult<HealthScore>> {
		try {
			const { SpecService } = await import("./spec-service.js");
			const service = new SpecService({
				specsPath: this.manager.config.path ?? "./specs",
			});
			const result = await service.getHealthScore();
			return result;
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get health score",
			};
		}
	}

	// Get the underlying manager for advanced operations
	getManager(): SpecsManager {
		return this.manager;
	}
}
