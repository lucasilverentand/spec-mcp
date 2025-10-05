import { z } from "zod";
import {
	CoverageAnalysisResultSchema,
	OrphanAnalysisSchema,
} from "./analysis.js";
import { ValidationResultSchema } from "./results.js";

// Health score schema
export const HealthScoreSchema = z.object({
	overall: z.number(),
	breakdown: z.object({
		coverage: z.number(),
		dependencies: z.number(),
		validation: z.number(),
	}),
	issues: z.array(z.string()),
	recommendations: z.array(z.string()),
	timestamp: z.date(),
});

export type HealthScore = z.infer<typeof HealthScoreSchema>;

// Entity collection schema
export const EntityCollectionSchema = z.object({
	requirements: z.array(z.unknown()), // AnyEntity[]
	plans: z.array(z.unknown()), // AnyEntity[]
	components: z.array(z.unknown()), // AnyEntity[]
	total: z.number(),
	lastModified: z.date(),
});

export type EntityCollection = z.infer<typeof EntityCollectionSchema>;

// Spec report schema
export const SpecReportSchema = z.object({
	summary: z.object({
		totalSpecs: z.number(),
		healthScore: z.number(),
		issues: z.number(),
		lastUpdated: z.date(),
	}),
	coverage: CoverageAnalysisResultSchema,
	validation: ValidationResultSchema,
	dependencies: z.object({
		cycles: z.number(),
		health: z.number(),
		graph: z.object({
			nodes: z.number(),
			edges: z.number(),
		}),
	}),
	orphans: OrphanAnalysisSchema,
	trends: z
		.object({
			healthTrend: z.enum(["improving", "declining", "stable"]),
			coverageTrend: z.number(),
		})
		.optional(),
});

export type SpecReport = z.infer<typeof SpecReportSchema>;

// Service factory type
export const ServiceFactorySchema = z
	.function()
	.args(z.unknown().optional())
	.returns(z.unknown());

// Service registration schema
export const ServiceRegistrationSchema = z.object({
	factory: z.function(),
	singleton: z.boolean(),
	instance: z.unknown().optional(),
});

export type ServiceRegistration<T = unknown> = {
	factory: (config?: unknown) => T;
	singleton: boolean;
	instance?: T;
};

// Service tokens schema
export const ServiceTokensSchema = z.object({
	SPEC_SERVICE: z.literal("SpecService"),
	DEPENDENCY_ANALYZER: z.literal("DependencyAnalyzer"),
	COVERAGE_ANALYZER: z.literal("CoverageAnalyzer"),
	CYCLE_DETECTOR: z.literal("CycleDetector"),
	ORPHAN_DETECTOR: z.literal("OrphanDetector"),
	VALIDATION_ENGINE: z.literal("ValidationEngine"),
	ID_GENERATOR: z.literal("IdGenerator"),
	SLUG_GENERATOR: z.literal("SlugGenerator"),
	YAML_TRANSFORMER: z.literal("YamlTransformer"),
});

export type ServiceToken = z.infer<typeof ServiceTokensSchema>[keyof z.infer<
	typeof ServiceTokensSchema
>];
