// ============================================================================
// SPEC-MCP CORE
// Feature-based architecture for specification management
// ============================================================================

// Re-export utilities from @spec-mcp/utils for convenience
export {
	convertJsonToYaml,
	convertYamlToJson,
	generateSlug,
	generateUniqueSlug,
	IdGenerator,
	parseYaml,
	stringifyYaml,
	validateSlug,
	validateYamlSyntax,
} from "@spec-mcp/utils";
// ----------------------------------------------------------------------------
// Analysis Feature
// ----------------------------------------------------------------------------
export {
	CoverageAnalyzer,
	CycleDetector,
	DependencyAnalyzer,
	DependencyResolver,
	OrphanDetector,
} from "./analysis/index.js";
// ----------------------------------------------------------------------------
// Creation Flow Feature
// ----------------------------------------------------------------------------
export type {
	CreationFlowValidationResult,
	Draft,
	FinalizationResult,
	SchemaInstructions,
	StepDefinition,
	StepResponse,
} from "./creation-flow/index.js";
export {
	COMPONENT_STEPS,
	CONSTITUTION_STEPS,
	DECISION_STEPS,
	DraftManager,
	finalizeDraft,
	formatSchemaFieldsForLLM,
	generateSchemaInstructions,
	getFinalizationPrompt,
	getStepDefinitions,
	PLAN_STEPS,
	REQUIREMENT_STEPS,
	StepValidator,
} from "./creation-flow/index.js";
// ----------------------------------------------------------------------------
// Health & Reporting Feature
// ----------------------------------------------------------------------------
export { HealthService } from "./health/index.js";
// ----------------------------------------------------------------------------
// Operations Feature
// ----------------------------------------------------------------------------
export { SpecOperations } from "./operations/index.js";
export {
	defaultContainer,
	SERVICE_TOKENS,
	ServiceContainer,
} from "./services/container.js";
// ----------------------------------------------------------------------------
// Main Service (orchestrates all features)
// ----------------------------------------------------------------------------
export { SpecService } from "./services/index.js";
// ----------------------------------------------------------------------------
// Shared Types & Utilities
// ----------------------------------------------------------------------------
export * from "./shared/index.js";
// ----------------------------------------------------------------------------
// Validation Feature
// ----------------------------------------------------------------------------
export {
	BusinessRulesValidator,
	ReferenceValidator,
	SchemaValidator,
	ValidationEngine,
	WorkflowValidator,
} from "./validation/index.js";

// ----------------------------------------------------------------------------
// Backward Compatibility - Legacy SpecCore class
// ----------------------------------------------------------------------------
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
import { SpecService as SpecServiceClass } from "./services/index.js";
import type { ServiceConfig } from "./shared/types/config.js";

export class SpecCore {
	private service: SpecServiceClass;
	private _coverageAnalyzer: CoverageAnalyzerClass;
	private _dependencyAnalyzer: DependencyAnalyzerClass;
	private _cycleDetector: CycleDetectorClass;
	private _orphanDetector: OrphanDetectorClass;

	constructor(config?: Partial<ServiceConfig>) {
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
	config?: Partial<ServiceConfig>,
): SpecServiceClass {
	return new SpecServiceClass(config);
}

// Factory function for creating configured container
export async function createContainer(
	config?: Partial<ServiceConfig>,
): Promise<ServiceContainerClass> {
	const container = new ServiceContainerClass(config);
	await registerCoreServices(container);
	return container;
}
