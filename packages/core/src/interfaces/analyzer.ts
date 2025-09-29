import type { SpecConfig } from "./config.js";
import type { AnalysisResult } from "./results.js";

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

// Analysis result types
export interface DependencyGraph {
	nodes: string[];
	edges: Array<{ from: string; to: string; weight?: number }>;
	cycles?: string[][];
	metadata?: {
		nodeCount: number;
		edgeCount: number;
		cycleCount: number;
	};
}

export interface CycleAnalysis {
	hasCycles: boolean;
	cycles: string[][];
	summary: {
		totalCycles: number;
		maxCycleLength: number;
		affectedNodes: string[];
	};
}

export interface OrphanAnalysis {
	orphans: string[];
	summary: {
		totalOrphans: number;
		byType: Record<string, number>;
	};
}

export interface CoverageReport {
	totalSpecs: number;
	coveredSpecs: number;
	coveragePercentage: number;
	uncoveredSpecs: string[];
	orphanedSpecs: string[];
	byCategory?: Record<
		string,
		{
			total: number;
			covered: number;
			percentage: number;
		}
	>;
}

export interface DepthAnalysis {
	maxDepth: number;
	averageDepth: number;
	depths: Record<string, number>;
	criticalPath: string[];
}

export interface DependencyAnalysisResult {
	graph: DependencyGraph;
	health: {
		score: number;
		issues: string[];
		recommendations: string[];
	};
	depth: DepthAnalysis;
}

export interface CoverageAnalysisResult {
	report: CoverageReport;
	recommendations: string[];
	trends?: {
		previousCoverage?: number;
		improvement: number;
	};
}
