import z from "zod";

export const ApiContractExampleSchema = z.object({
	name: z.string().min(1).describe("Name of the example"),
	description: z
		.string()
		.min(1)
		.describe("Description of what this example demonstrates"),
	code: z.string().min(1).describe("Example code or usage"),
	language: z
		.string()
		.optional()
		.describe("Programming language or format of the example"),
});

export const ApiContractDeprecationSchema = z.object({
	deprecated_since: z
		.string()
		.min(1)
		.describe("Version when this API was deprecated"),
	removal_planned: z
		.string()
		.optional()
		.describe("Version when this API will be removed"),
	alternative: z
		.string()
		.optional()
		.describe("Recommended alternative API to use"),
	reason: z.string().min(1).describe("Reason for deprecation"),
});

export const ApiContractSchema = z.object({
	id: ApiContractIdSchema,
	name: z.string().min(1).describe("Display name of the API"),
	description: z
		.string()
		.min(1)
		.describe("Detailed description of what this API does"),
	contract_type: z
		.string()
		.min(1)
		.describe(
			"Type of API contract (e.g., 'rest', 'graphql', 'grpc', 'library', 'cli', 'websocket', etc.)",
		),
	specification: z
		.string()
		.describe(
			"Flexible specification object that can hold any API contract format (OpenAPI, GraphQL schema, TypeScript definitions, etc.)",
		),
	dependencies: z
		.array(ApiContractIdSchema)
		.default([])
		.describe("Other API contracts this API depends on"),
	deprecation: ApiContractDeprecationSchema.optional().describe(
		"Deprecation information if the API is deprecated",
	),
	examples: z
		.array(ApiContractExampleSchema)
		.default([])
		.describe("Usage examples for the API"),
});

export type ApiContractId = z.infer<typeof ApiContractIdSchema>;
export type ApiContractStability = z.infer<typeof ApiContractStabilitySchema>;
export type ApiContractExample = z.infer<typeof ApiContractExampleSchema>;
export type ApiContractDeprecation = z.infer<
	typeof ApiContractDeprecationSchema
>;
export type ApiContract = z.infer<typeof ApiContractSchema>;
