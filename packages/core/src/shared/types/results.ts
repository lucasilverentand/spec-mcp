import { z } from "zod";

// Base operation result schema
export const OperationResultSchema = z.object({
	success: z.boolean(),
	data: z.unknown().optional(),
	error: z.string().optional(),
	warnings: z.array(z.string()).optional(),
	timestamp: z.date().optional(),
});

export type OperationResult<TData = unknown> = Omit<
	z.infer<typeof OperationResultSchema>,
	"data"
> & {
	data?: TData;
};

// Re-export ValidationResult from @spec-mcp/data
export type {
	ValidationManagerConfig,
	ValidationResult,
} from "@spec-mcp/data";
export {
	ValidationManagerConfigSchema,
	ValidationResultSchema,
} from "@spec-mcp/data";

// Analysis result schema
export const AnalysisResultSchema = z.object({
	success: z.boolean(),
	data: z.unknown(),
	metadata: z
		.object({
			executionTime: z.number().optional(),
			version: z.string().optional(),
			source: z.string().optional(),
		})
		.optional(),
	warnings: z.array(z.string()).optional(),
	errors: z.array(z.string()).optional(),
});

export type AnalysisResult<TData = unknown> = Omit<
	z.infer<typeof AnalysisResultSchema>,
	"data"
> & {
	data: TData;
};

// Result type for functional programming patterns
export const ResultSchema = z.union([
	z.object({
		success: z.literal(true),
		data: z.unknown(),
		error: z.never().optional(),
	}),
	z.object({
		success: z.literal(false),
		error: z.unknown(),
		data: z.never().optional(),
	}),
]);

export type Result<T, E = Error> =
	| { success: true; data: T; error?: never }
	| { success: false; error: E; data?: never };

// Spec operation result schema (legacy)
export const SpecOperationResultSchema = z.object({
	success: z.boolean(),
	data: z.unknown().optional(),
	error: z.string().optional(),
	warnings: z.array(z.string()).optional(),
});

export type SpecOperationResult<T> = Omit<
	z.infer<typeof SpecOperationResultSchema>,
	"data"
> & {
	data?: T;
};
