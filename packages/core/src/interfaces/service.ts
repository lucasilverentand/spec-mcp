import type { AnyEntity } from "@spec-mcp/data";
import type {
	CoverageAnalysisResult,
	CycleAnalysis,
	DependencyAnalysisResult,
	OrphanAnalysis,
} from "./analyzer.js";
import type { ServiceConfig } from "./config.js";
import type { OperationResult, ValidationResult } from "./results.js";

export interface IService {
	readonly name: string;
	readonly version: string;
	readonly isHealthy: boolean;

	initialize(config?: Partial<ServiceConfig>): Promise<void>;
	shutdown(): Promise<void>;
	healthCheck(): Promise<boolean>;
}

export interface ISpecService extends IService {
	// Core operations
	getHealthScore(): Promise<OperationResult<HealthScore>>;
	generateReport(): Promise<OperationResult<SpecReport>>;

	// Entity operations
	validateEntity(entity: AnyEntity): Promise<ValidationResult>;
	getAllEntities(): Promise<OperationResult<EntityCollection>>;

	// Analysis operations
	analyzeDependencies(): Promise<OperationResult<DependencyAnalysisResult>>;
	analyzeCoverage(): Promise<OperationResult<CoverageAnalysisResult>>;
	detectCycles(): Promise<OperationResult<CycleAnalysis>>;
	detectOrphans(): Promise<OperationResult<OrphanAnalysis>>;

	// Validation operations
	runFullValidation(): Promise<ValidationResult>;
	validateReferences(): Promise<ValidationResult>;
	validateBusinessRules(): Promise<ValidationResult>;
}

export interface IDependencyService extends IService {
	resolveDependencies(entity: AnyEntity): Promise<OperationResult<AnyEntity[]>>;
	getDependencyChain(entityId: string): Promise<OperationResult<string[]>>;
	findCircularDependencies(): Promise<OperationResult<string[][]>>;
}

export interface IAnalysisService extends IService {
	runAnalysis(type: AnalysisType): Promise<OperationResult<unknown>>;
	scheduleAnalysis(type: AnalysisType, schedule: string): void;
	getAnalysisHistory(
		type: AnalysisType,
	): Promise<OperationResult<AnalysisHistory[]>>;
}

// Supporting types
export interface HealthScore {
	overall: number;
	breakdown: {
		coverage: number;
		dependencies: number;
		validation: number;
	};
	issues: string[];
	recommendations: string[];
	timestamp: Date;
}

export interface SpecReport {
	summary: {
		totalSpecs: number;
		healthScore: number;
		issues: number;
		lastUpdated: Date;
	};
	coverage: CoverageAnalysisResult;
	validation: ValidationResult;
	dependencies: {
		cycles: number;
		health: number;
		graph: {
			nodes: number;
			edges: number;
		};
	};
	orphans: OrphanAnalysis;
	trends?: {
		healthTrend: "improving" | "declining" | "stable";
		coverageTrend: number;
	};
}

export interface EntityCollection {
	requirements: AnyEntity[];
	plans: AnyEntity[];
	components: AnyEntity[];
	total: number;
	lastModified: Date;
}

export type AnalysisType =
	| "dependency"
	| "coverage"
	| "cycles"
	| "orphans"
	| "validation"
	| "full";

export interface AnalysisHistory {
	id: string;
	type: AnalysisType;
	timestamp: Date;
	result: OperationResult<unknown>;
	duration: number;
	success: boolean;
}
