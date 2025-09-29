import { z } from "zod";

// Core spec configuration schema
export const SpecConfigSchema = z.object({
	specsPath: z.string().optional(),
	autoDetect: z.boolean().optional(),
	schemaValidation: z.boolean().optional(),
	referenceValidation: z.boolean().optional(),

	// Analysis configuration
	analysis: z
		.object({
			enableCycleDetection: z.boolean().optional(),
			enableOrphanDetection: z.boolean().optional(),
			enableCoverageAnalysis: z.boolean().optional(),
			maxAnalysisDepth: z.number().optional(),
			cacheResults: z.boolean().optional(),
		})
		.optional(),

	// Validation configuration
	validation: z
		.object({
			strictMode: z.boolean().optional(),
			allowPartialValidation: z.boolean().optional(),
			customValidators: z.array(z.string()).optional(),
			skipPatterns: z.array(z.string()).optional(),
		})
		.optional(),

	// Performance configuration
	performance: z
		.object({
			maxConcurrency: z.number().optional(),
			timeout: z.number().optional(),
			enableProfiling: z.boolean().optional(),
		})
		.optional(),

	// Logging configuration
	logging: z
		.object({
			level: z.enum(["error", "warn", "info", "debug"]).optional(),
			enableMetrics: z.boolean().optional(),
			output: z.enum(["console", "file", "none"]).optional(),
		})
		.optional(),
});

export type SpecConfig = z.infer<typeof SpecConfigSchema>;

// Service configuration schema (extends SpecConfig)
export const ServiceConfigSchema = SpecConfigSchema.extend({
	services: z
		.object({
			enabledServices: z.array(z.string()).optional(),
			serviceTimeout: z.number().optional(),
			retryAttempts: z.number().optional(),
		})
		.optional(),
});

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;

// Reference validation options
export const ReferenceValidationOptionsSchema = z.object({
	allowMissingReferences: z.boolean().optional(),
	followTransitiveReferences: z.boolean().optional(),
	maxReferenceDepth: z.number().optional(),
});

export type ReferenceValidationOptions = z.infer<
	typeof ReferenceValidationOptionsSchema
>;

// Workflow validation options
export const WorkflowValidationOptionsSchema = z.object({
	validateDependencyChain: z.boolean().optional(),
	requireTestCases: z.boolean().optional(),
	allowCyclicDependencies: z.boolean().optional(),
});

export type WorkflowValidationOptions = z.infer<
	typeof WorkflowValidationOptionsSchema
>;
