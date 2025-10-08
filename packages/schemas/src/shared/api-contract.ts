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

export const ApiContractIdSchema = z
	.string()
	.regex(/^api-\d{3}$/, {
		message: "API Contract ID must follow format: api-XXX",
	})
	.describe("Unique identifier for the API contract");

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
	examples: z
		.array(ApiContractExampleSchema)
		.default([])
		.describe("Usage examples for the API"),
});

export const ApiContractsSchema = z
	.array(ApiContractSchema)
	.default([])
	.describe("Array of API contracts");

export type ApiContractId = z.infer<typeof ApiContractIdSchema>;
export type ApiContractExample = z.infer<typeof ApiContractExampleSchema>;
export type ApiContract = z.infer<typeof ApiContractSchema>;
export type ApiContracts = z.infer<typeof ApiContractsSchema>;
