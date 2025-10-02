// Core schemas and types (single source of truth)

// Analysis components
export {
	CoverageAnalyzer,
	CycleDetector,
	DependencyAnalyzer,
	DependencyResolver,
	OrphanDetector,
} from "./analysis/index.js";
// Error handling
export {
	AnalysisError,
	ConfigurationError,
	ErrorFactory,
	IOError,
	isAnalysisError,
	isSpecError,
	isValidationError,
	SpecError,
	SystemError,
	ValidationError,
} from "./domain/index.js";
export type {
	GeneratedPlan,
	PlanGenerationOptions,
} from "./generators/plan-generator.js";
// Generators
export { PlanGenerator } from "./generators/plan-generator.js";
// Export only the interface types (not the data types which come from schemas)
export type {
	IAnalyzer,
	ICoverageAnalyzer,
	ICycleDetector,
	IDependencyAnalyzer,
	IOrphanDetector,
} from "./interfaces/analyzer.js";
export type {
	IIdGenerator,
	ISlugGenerator,
	ITransformer,
	IYamlTransformer,
} from "./interfaces/transformer.js";
export type {
	IReferenceValidator,
	ISchemaValidator,
	IValidationEngine,
	IValidator,
	IWorkflowValidator,
} from "./interfaces/validator.js";
export * from "./schemas/index.js";
export {
	defaultContainer,
	SERVICE_TOKENS,
	ServiceContainer,
} from "./services/container.js";
// Main service and entry point
export { SpecOperations, SpecService } from "./services/index.js";
// Transformers
export {
	convertJsonToYaml,
	convertYamlToJson,
	// Backward compatibility functions
	generateId,
	generateSlug,
	generateSlugFromTitle,
	generateUniqueId,
	generateUniqueSlug,
	IdGenerator,
	parseId,
	parseYaml,
	SlugGenerator,
	stringifyYaml,
	validateId,
	validateSlug,
	validateYamlSyntax,
	YamlTransformer,
} from "./transformation/index.js";
// Utilities
export * from "./utils/index.js";
// Validation (consolidated)
export {
	BusinessRulesValidator,
	ReferenceValidator,
	SchemaValidator,
	ValidationEngine,
	WorkflowValidator,
} from "./validation/index.js";
export type {
	Draft,
	StepDefinition,
	StepResponse,
	ValidationResult,
	ValidationRule,
} from "./wizard/index.js";
// Wizard system for step-by-step spec creation
export {
	COMPONENT_STEPS,
	DraftManager,
	getStepDefinitions,
	PLAN_STEPS,
	REQUIREMENT_STEPS,
	StepValidator,
} from "./wizard/index.js";

import {
	CoverageAnalyzer as CoverageAnalyzerClass,
	CycleDetector as CycleDetectorClass,
	DependencyAnalyzer as DependencyAnalyzerClass,
	OrphanDetector as OrphanDetectorClass,
} from "./analysis/index.js";
import {
	registerCoreServices,
	ServiceContainer as ServiceContainerClass,
} from "./services/container.js";
// Import classes and ServiceContainer needed for SpecCore implementation
import { SpecService as SpecServiceClass } from "./services/index.js";

// Backward compatibility - Legacy SpecCore class
export class SpecCore {
	private service: SpecServiceClass;
	private _coverageAnalyzer: CoverageAnalyzerClass;
	private _dependencyAnalyzer: DependencyAnalyzerClass;
	private _cycleDetector: CycleDetectorClass;
	private _orphanDetector: OrphanDetectorClass;

	constructor(
		config?: Partial<import("./interfaces/config.js").ServiceConfig>,
	) {
		this.service = new SpecServiceClass(config);
		this._coverageAnalyzer = new CoverageAnalyzerClass(config);
		this._dependencyAnalyzer = new DependencyAnalyzerClass(config);
		this._cycleDetector = new CycleDetectorClass(config);
		this._orphanDetector = new OrphanDetectorClass(config);
	}

	// Delegate to service
	get operations() {
		return this.service;
	}
	get validation() {
		return this.service;
	}
	get dependencies() {
		return this.service;
	}
	get coverage() {
		return this._coverageAnalyzer;
	}
	get orphans() {
		return this._orphanDetector;
	}
	get cycles() {
		return this._cycleDetector;
	}
	get dependencyAnalyzer() {
		return this._dependencyAnalyzer;
	}

	// Analyzers property for backward compatibility
	get analyzers() {
		return {
			coverage: this._coverageAnalyzer,
			dependencies: this._dependencyAnalyzer,
			cycles: this._cycleDetector,
			orphans: this._orphanDetector,
		};
	}

	// Legacy methods for backward compatibility
	async initialize(): Promise<void> {
		return this.service.initialize();
	}

	async getHealthScore() {
		const result = await this.service.getHealthScore();
		if (!result.success) {
			throw new Error(result.error);
		}
		return {
			overall: result.data?.overall,
			breakdown: result.data?.breakdown,
			issues: result.data?.issues,
			recommendations: result.data?.recommendations,
		};
	}

	async generateReport() {
		const result = await this.service.generateReport();
		if (!result.success) {
			throw new Error(result.error);
		}
		return {
			summary: result.data?.summary,
			coverage: result.data?.coverage.report,
			validation: result.data?.validation,
			dependencies: result.data?.dependencies,
			orphans: result.data?.orphans,
		};
	}
}

// Factory function for creating configured service instances
export function createSpecService(
	config?: Partial<import("./interfaces/config.js").ServiceConfig>,
): SpecServiceClass {
	return new SpecServiceClass(config);
}

// Factory function for creating configured container
export async function createContainer(
	config?: Partial<import("./interfaces/config.js").ServiceConfig>,
): Promise<ServiceContainerClass> {
	const container = new ServiceContainerClass(config);
	await registerCoreServices(container);
	return container;
}
