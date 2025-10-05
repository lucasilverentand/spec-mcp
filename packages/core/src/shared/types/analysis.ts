import { z } from "zod";

// Dependency graph schema
export const DependencyGraphSchema = z.object({
	nodes: z.array(z.string()),
	edges: z.array(
		z.object({
			from: z.string(),
			to: z.string(),
			weight: z.number().optional(),
		}),
	),
	cycles: z.array(z.array(z.string())).optional(),
	metadata: z
		.object({
			nodeCount: z.number(),
			edgeCount: z.number(),
			cycleCount: z.number(),
		})
		.optional(),
});

export type DependencyGraph = z.infer<typeof DependencyGraphSchema>;

// Cycle analysis schema
export const CycleAnalysisSchema = z.object({
	hasCycles: z.boolean(),
	cycles: z.array(z.array(z.string())),
	summary: z.object({
		totalCycles: z.number(),
		maxCycleLength: z.number(),
		affectedNodes: z.array(z.string()),
	}),
});

export type CycleAnalysis = z.infer<typeof CycleAnalysisSchema>;

// Orphan analysis schema
export const OrphanAnalysisSchema = z.object({
	orphans: z.array(z.string()),
	summary: z.object({
		totalOrphans: z.number(),
		byType: z.record(z.string(), z.number()),
	}),
});

export type OrphanAnalysis = z.infer<typeof OrphanAnalysisSchema>;

// Coverage report schema
export const CoverageReportSchema = z.object({
	totalSpecs: z.number(),
	coveredSpecs: z.number(),
	coveragePercentage: z.number(),
	uncoveredSpecs: z.array(z.string()),
	orphanedSpecs: z.array(z.string()),
	byCategory: z
		.record(
			z.string(),
			z.object({
				total: z.number(),
				covered: z.number(),
				percentage: z.number(),
			}),
		)
		.optional(),
});

export type CoverageReport = z.infer<typeof CoverageReportSchema>;

// Depth analysis schema
export const DepthAnalysisSchema = z.object({
	maxDepth: z.number(),
	averageDepth: z.number(),
	depths: z.record(z.string(), z.number()),
	criticalPath: z.array(z.string()),
});

export type DepthAnalysis = z.infer<typeof DepthAnalysisSchema>;

// Dependency analysis result schema
export const DependencyAnalysisResultSchema = z.object({
	graph: DependencyGraphSchema,
	health: z.object({
		score: z.number(),
		issues: z.array(z.string()),
		recommendations: z.array(z.string()),
	}),
	depth: DepthAnalysisSchema,
});

export type DependencyAnalysisResult = z.infer<
	typeof DependencyAnalysisResultSchema
>;

// Coverage analysis result schema
export const CoverageAnalysisResultSchema = z.object({
	report: CoverageReportSchema,
	recommendations: z.array(z.string()),
	trends: z
		.object({
			previousCoverage: z.number().optional(),
			improvement: z.number(),
		})
		.optional(),
});

export type CoverageAnalysisResult = z.infer<
	typeof CoverageAnalysisResultSchema
>;

// Analysis type enum
export const AnalysisTypeSchema = z.enum([
	"dependency",
	"coverage",
	"cycles",
	"orphans",
	"validation",
	"full",
]);

export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;

// Analysis history schema
export const AnalysisHistorySchema = z.object({
	id: z.string(),
	type: AnalysisTypeSchema,
	timestamp: z.date(),
	result: z.unknown(), // OperationResult<unknown>
	duration: z.number(),
	success: z.boolean(),
});

export type AnalysisHistory = z.infer<typeof AnalysisHistorySchema>;
