import type { SpecConfig } from "./config.js";
import type { AnalysisResult } from "./results.js";
import type {
	CoverageAnalysisResult,
	CoverageReport,
	CycleAnalysis,
	DependencyAnalysisResult,
	DependencyGraph,
	DepthAnalysis,
	OrphanAnalysis,
} from "./analysis.js";

// Re-export types from analysis.ts to avoid duplication
export type {
	CoverageAnalysisResult,
	CoverageReport,
	CycleAnalysis,
	DependencyAnalysisResult,
	DependencyGraph,
	DepthAnalysis,
	OrphanAnalysis,
} from "./analysis.js";

// Analyzer interfaces
export interface IAnalyzer<TResult = unknown> {
	readonly name: string;
	readonly version: string;

	analyze(): Promise<AnalysisResult<TResult>>;
	configure(config: Partial<SpecConfig>): void;
	reset(): void;
}

export interface IDependencyAnalyzer
	extends IAnalyzer<DependencyAnalysisResult> {
	generateGraph(): Promise<AnalysisResult<DependencyGraph>>;
	detectCycles(): Promise<AnalysisResult<CycleAnalysis>>;
	analyzeDepth(): Promise<AnalysisResult<DepthAnalysis>>;
}

export interface ICoverageAnalyzer extends IAnalyzer<CoverageAnalysisResult> {
	generateReport(): Promise<AnalysisResult<CoverageReport>>;
	findUncovered(): Promise<AnalysisResult<string[]>>;
	findOrphans(): Promise<AnalysisResult<string[]>>;
}

export interface ICycleDetector extends IAnalyzer<CycleAnalysis> {
	detectAllCycles(): Promise<AnalysisResult<CycleAnalysis>>;
	findCycleInPath(path: string[]): boolean;
}

export interface IOrphanDetector extends IAnalyzer<OrphanAnalysis> {
	detectOrphans(): Promise<AnalysisResult<OrphanAnalysis>>;
	findUnreferencedEntities(): Promise<AnalysisResult<string[]>>;
}
