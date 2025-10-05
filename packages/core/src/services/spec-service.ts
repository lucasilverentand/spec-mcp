import type { AnyEntity } from "@spec-mcp/data";
import { SpecsManager } from "@spec-mcp/data";
import { toDataConfig } from "../shared/types/config.js";
import { CoverageAnalyzer } from "../analysis/coverage-analyzer.js";
import { CycleDetector } from "../analysis/cycle-detector.js";
import { DependencyAnalyzer } from "../analysis/dependency-analyzer.js";
import { OrphanDetector } from "../analysis/orphan-detector.js";
import { ErrorFactory } from "../shared/errors/index.js";
import type {
	CoverageAnalysisResult,
	CycleAnalysis,
	DependencyAnalysisResult,
	OrphanAnalysis,
} from "../shared/types/analyzer.js";
import type { ServiceConfig } from "../shared/types/config.js";
import type {
	OperationResult,
	ValidationResult,
} from "../shared/types/results.js";
import type {
	EntityCollection,
	HealthScore,
	SpecReport,
} from "../shared/types/service.js";
import { ValidationEngine } from "../validation/validation-engine.js";

export class SpecService {
	readonly name = "SpecService";
	readonly version = "2.0.0";

	private manager: SpecsManager;
	private config: Partial<ServiceConfig>;
	private _isHealthy = false;

	// Analysis components
	private dependencyAnalyzer: DependencyAnalyzer;
	private coverageAnalyzer: CoverageAnalyzer;
	private cycleDetector: CycleDetector;
	private orphanDetector: OrphanDetector;
	private validationEngine: ValidationEngine;

	constructor(config: Partial<ServiceConfig> = {}) {
		this.config = config;
		this.manager = new SpecsManager(toDataConfig(config));

		// Initialize analysis components
		this.dependencyAnalyzer = new DependencyAnalyzer(config);
		this.coverageAnalyzer = new CoverageAnalyzer(config);
		this.cycleDetector = new CycleDetector(config);
		this.orphanDetector = new OrphanDetector(config);
		this.validationEngine = new ValidationEngine(config);
	}

	get isHealthy(): boolean {
		return this._isHealthy;
	}

	async initialize(config?: Partial<ServiceConfig>): Promise<void> {
		try {
			if (config) {
				this.config = { ...this.config, ...config };
				this.reconfigureComponents();
			}

			// Initialize underlying manager
			// Note: SpecsManager doesn't have an explicit initialize method,
			// but we can verify it's working by doing a basic operation
			await this.manager.getAllEntities();

			this._isHealthy = true;
		} catch (error) {
			this._isHealthy = false;
			throw ErrorFactory.system(
				`Failed to initialize SpecService: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async shutdown(): Promise<void> {
		this._isHealthy = false;
		// Clean up any resources if needed
	}

	async healthCheck(): Promise<boolean> {
		try {
			// Perform a basic operation to verify the service is working
			await this.manager.getAllEntities();
			this._isHealthy = true;
			return true;
		} catch {
			this._isHealthy = false;
			return false;
		}
	}

	async getHealthScore(): Promise<OperationResult<HealthScore>> {
		try {
			const [coverageResult, depResult, validationResult] = await Promise.all([
				this.analyzeCoverage(),
				this.analyzeDependencies(),
				this.runFullValidation(),
			]);

			const coverageScore =
				(coverageResult.success &&
					coverageResult.data?.report.coveragePercentage) ||
				0;
			const dependencyScore =
				(depResult.success && depResult.data?.health.score) || 0;
			const validationScore = validationResult.valid
				? 100
				: Math.max(0, 100 - validationResult.errors.length * 10);

			const overall = Math.round(
				(coverageScore + dependencyScore + validationScore) / 3,
			);

			const issues: string[] = [
				...validationResult.errors,
				...(depResult.success && depResult.data?.health.issues
					? depResult.data.health.issues
					: ["Dependency analysis failed"]),
				...(coverageResult.success &&
				coverageResult.data?.report.orphanedSpecs &&
				coverageResult.data.report.orphanedSpecs.length > 0
					? [
							`${coverageResult.data.report.orphanedSpecs.length} orphaned specs`,
						]
					: []),
			];

			const recommendations: string[] = [
				...(depResult.success && depResult.data?.health.recommendations
					? depResult.data.health.recommendations
					: []),
				...(coverageResult.success && coverageResult.data?.recommendations
					? coverageResult.data.recommendations
					: []),
				...(coverageScore < 80 ? ["Improve spec coverage"] : []),
				...(validationResult.errors.length > 0
					? ["Fix validation errors"]
					: []),
			];

			return {
				success: true,
				data: {
					overall,
					breakdown: {
						coverage: coverageScore ?? 0,
						dependencies: dependencyScore ?? 0,
						validation: validationScore,
					},
					issues,
					recommendations,
					timestamp: new Date(),
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to calculate health score",
			};
		}
	}

	async generateReport(): Promise<OperationResult<SpecReport>> {
		try {
			const [healthScore, coverage, validation, cycles, orphans] =
				await Promise.all([
					this.getHealthScore(),
					this.analyzeCoverage(),
					this.runFullValidation(),
					this.detectCycles(),
					this.detectOrphans(),
				]);

			if (
				!healthScore.success ||
				!coverage.success ||
				!cycles.success ||
				!orphans.success
			) {
				throw ErrorFactory.system("Failed to generate complete report");
			}

			const entities = await this.getAllEntities();
			const totalSpecs = entities.success ? entities.data?.total : 0;

			return {
				success: true,
				data: {
					summary: {
						totalSpecs: totalSpecs ?? 0,
						healthScore: healthScore.data?.overall ?? 0,
						issues: healthScore.data?.issues.length ?? 0,
						lastUpdated: new Date(),
					},
					coverage: coverage.data ?? {
						report: {
							totalSpecs: 0,
							coveredSpecs: 0,
							coveragePercentage: 0,
							uncoveredSpecs: [],
							orphanedSpecs: [],
						},
						recommendations: [],
					},
					validation,
					dependencies: {
						cycles: cycles.data?.summary.totalCycles ?? 0,
						health: healthScore.data?.breakdown.dependencies ?? 0,
						graph: {
							nodes: 0, // Would be populated from dependency analysis
							edges: 0,
						},
					},
					orphans: orphans.data ?? {
						orphans: [],
						summary: { totalOrphans: 0, byType: {} },
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to generate report",
			};
		}
	}

	async validateEntity(entity: AnyEntity): Promise<ValidationResult> {
		return this.validationEngine.validateEntity(entity);
	}

	async getAllEntities(): Promise<OperationResult<EntityCollection>> {
		try {
			const entities = await this.manager.getAllEntities();
			const total =
				entities.requirements.length +
				entities.plans.length +
				entities.components.length;

			return {
				success: true,
				data: {
					requirements: entities.requirements,
					plans: entities.plans,
					components: entities.components,
					total,
					lastModified: new Date(),
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get entities",
			};
		}
	}

	async analyzeDependencies(): Promise<
		OperationResult<DependencyAnalysisResult>
	> {
		try {
			const result = await this.dependencyAnalyzer.analyze();
			if (!result.success) {
				throw ErrorFactory.dependencyAnalysis("Dependency analysis failed");
			}
			return {
				success: true,
				data: result.data,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Dependency analysis failed",
			};
		}
	}

	async analyzeCoverage(): Promise<OperationResult<CoverageAnalysisResult>> {
		try {
			const result = await this.coverageAnalyzer.analyze();
			if (!result.success) {
				throw ErrorFactory.coverageAnalysis("Coverage analysis failed");
			}
			return {
				success: true,
				data: result.data,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Coverage analysis failed",
			};
		}
	}

	async detectCycles(): Promise<OperationResult<CycleAnalysis>> {
		try {
			const result = await this.cycleDetector.analyze();
			if (!result.success) {
				throw ErrorFactory.cycleDetection("Cycle detection failed");
			}
			return {
				success: true,
				data: result.data,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Cycle detection failed",
			};
		}
	}

	async detectOrphans(): Promise<OperationResult<OrphanAnalysis>> {
		try {
			const result = await this.orphanDetector.analyze();
			if (!result.success) {
				throw ErrorFactory.analysis("Orphan detection failed");
			}
			return {
				success: true,
				data: result.data,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Orphan detection failed",
			};
		}
	}

	async runFullValidation(): Promise<ValidationResult> {
		return this.validationEngine.runFullValidation();
	}

	async validateReferences(): Promise<ValidationResult> {
		return this.validationEngine.validateReferences();
	}

	async validateBusinessRules(): Promise<ValidationResult> {
		return this.validationEngine.validateBusinessRules();
	}

	// CRUD operations - delegate to SpecsManager with error wrapping
	async getRequirement(
		id: string,
	): Promise<
		OperationResult<import("@spec-mcp/data").Requirement | undefined>
	> {
		try {
			const data = await this.manager.getRequirement(id);
			return { success: true, data: data ?? undefined };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get requirement",
			};
		}
	}

	async getPlan(
		id: string,
	): Promise<OperationResult<import("@spec-mcp/data").Plan | undefined>> {
		try {
			const data = await this.manager.getPlan(id);
			return { success: true, data: data ?? undefined };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to get plan",
			};
		}
	}

	async getComponent(
		id: string,
	): Promise<
		OperationResult<import("@spec-mcp/data").AnyComponent | undefined>
	> {
		try {
			const data = await this.manager.getComponent(id);
			return { success: true, data: data ?? undefined };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to get component",
			};
		}
	}

	async listRequirements(): Promise<
		OperationResult<import("@spec-mcp/data").Requirement[]>
	> {
		try {
			const data = await this.manager.listRequirements();
			return { success: true, data };
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

	async listPlans(): Promise<OperationResult<import("@spec-mcp/data").Plan[]>> {
		try {
			const data = await this.manager.listPlans();
			return { success: true, data };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to list plans",
			};
		}
	}

	async listComponents(): Promise<
		OperationResult<import("@spec-mcp/data").AnyComponent[]>
	> {
		try {
			const data = await this.manager.listComponents();
			return { success: true, data };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to list components",
			};
		}
	}

	async createRequirement(
		data: Omit<import("@spec-mcp/data").Requirement, "number">,
	): Promise<
		OperationResult<import("@spec-mcp/data").Requirement | undefined>
	> {
		try {
			const result = await this.manager.createRequirement(data);
			return { success: true, data: result };
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

	async createPlan(
		data: Omit<import("@spec-mcp/data").Plan, "number">,
	): Promise<OperationResult<import("@spec-mcp/data").Plan | undefined>> {
		try {
			const result = await this.manager.createPlan(data);
			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to create plan",
			};
		}
	}

	async createComponent(
		data: Omit<import("@spec-mcp/data").AnyComponent, "number">,
	): Promise<
		OperationResult<import("@spec-mcp/data").AnyComponent | undefined>
	> {
		try {
			const result = await this.manager.createComponent(data);
			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to create component",
			};
		}
	}

	async updateRequirement(
		id: string,
		data: Partial<import("@spec-mcp/data").Requirement>,
	): Promise<
		OperationResult<import("@spec-mcp/data").Requirement | undefined>
	> {
		try {
			const result = await this.manager.updateRequirement(id, data);
			return { success: true, data: result };
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

	async updatePlan(
		id: string,
		data: Partial<import("@spec-mcp/data").Plan>,
	): Promise<OperationResult<import("@spec-mcp/data").Plan | undefined>> {
		try {
			const result = await this.manager.updatePlan(id, data);
			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to update plan",
			};
		}
	}

	async updateComponent(
		id: string,
		data: Partial<import("@spec-mcp/data").AnyComponent>,
	): Promise<
		OperationResult<import("@spec-mcp/data").AnyComponent | undefined>
	> {
		try {
			const result = await this.manager.updateComponent(id, data);
			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to update component",
			};
		}
	}

	async deleteRequirement(id: string): Promise<OperationResult<boolean>> {
		try {
			await this.manager.deleteRequirement(id);
			return { success: true, data: true };
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

	async deletePlan(id: string): Promise<OperationResult<boolean>> {
		try {
			await this.manager.deletePlan(id);
			return { success: true, data: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to delete plan",
			};
		}
	}

	async deleteComponent(id: string): Promise<OperationResult<boolean>> {
		try {
			await this.manager.deleteComponent(id);
			return { success: true, data: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to delete component",
			};
		}
	}

	getManager() {
		return this.manager;
	}

	private reconfigureComponents(): void {
		this.manager = new SpecsManager(toDataConfig(this.config));
		this.dependencyAnalyzer.configure(this.config);
		this.coverageAnalyzer.configure(this.config);
		this.cycleDetector.configure(this.config);
		this.orphanDetector.configure(this.config);
		this.validationEngine.configure(this.config);
	}
}
