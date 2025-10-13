import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	ApiContract,
	DataModel,
	Flow,
	FlowStep,
	Plan,
} from "@spec-mcp/schemas";
import {
	type ArrayToolConfig,
	addItemWithId,
	supersedeItemWithId,
} from "./array-tool-builder.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format a flow step ID with consistent padding
 * Step IDs are internal to flows and use the format: step-001, step-002, etc.
 */
function formatStepId(stepNumber: number): string {
	return `step-${String(stepNumber).padStart(3, "0")}`;
}

// ============================================================================
// FLOW TOOLS
// ============================================================================

export async function addFlow(
	specManager: SpecManager,
	planId: string,
	name: string,
	description: string | undefined,
	steps: string[] | FlowStep[],
	type?: string,
	supersede_id?: string,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, Flow> = {
		toolName: "add_flow",
		description: "Add flow to a plan",
		specType: "plan",
		arrayFieldName: "flows",
		idPrefix: "flw",
		getArray: (spec) => spec.flows || [],
		setArray: (_spec, items) => ({ flows: items }),
	};

	// Convert string array to FlowStep array if needed
	const flowSteps: FlowStep[] = steps.map((step, index) => {
		if (typeof step === "string") {
			return {
				id: formatStepId(index + 1),
				name: step,
				description: step,
				next_steps: index < steps.length - 1 ? [formatStepId(index + 2)] : [],
			};
		}
		return step;
	});

	return addItemWithId(
		specManager,
		planId,
		{
			type: type || "user",
			name,
			description,
			steps: flowSteps,
		} as Omit<Flow, "id" | "supersedes" | "superseded_by" | "superseded_at">,
		config,
		supersede_id,
	);
}

export const addFlowTool = {
	name: "add_flow",
	description:
		"Add a flow to a Plan. Flows describe user, system, or data flows. Optionally supersede an existing flow by providing supersede_id - this will create a new version, mark the old flow as superseded, and update all references.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001-user-auth)",
			},
			type: {
				type: "string",
				description: "Type of flow (e.g., user, system, data)",
			},
			name: {
				type: "string",
				description: "Display name of the flow",
			},
			description: {
				type: "string",
				description: "High-level description of the flow's purpose (optional)",
			},
			steps: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Step ID (e.g., step-001)",
						},
						name: {
							type: "string",
							description: "Display name of the step",
						},
						description: {
							type: "string",
							description: "Description of the step (optional)",
						},
						next_steps: {
							type: "array",
							items: { type: "string" },
							description: "IDs of subsequent steps",
						},
					},
					required: ["id", "name"],
				},
				description: "Ordered list of steps in the flow",
			},
			supersede_id: {
				type: "string",
				description:
					"Optional: ID of an existing flow to supersede (e.g., 'flw-001'). The old flow will be marked as superseded and all references will be updated.",
			},
		},
		required: ["plan_id", "type", "name", "steps"],
	} as const,
};

/**
 * Supersede an existing flow with updated values
 * Creates a new flow with a new ID and marks the old one as superseded
 */
export async function supersedeFlow(
	specManager: SpecManager,
	planId: string,
	flowId: string,
	updates: Partial<Pick<Flow, "type" | "name" | "description" | "steps">>,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, Flow> = {
		toolName: "supersede_flow",
		description: "Supersede flow in a plan",
		specType: "plan",
		arrayFieldName: "flows",
		idPrefix: "flw",
		getArray: (spec) => spec.flows || [],
		setArray: (_spec, items) => ({ flows: items }),
	};

	return supersedeItemWithId(specManager, planId, flowId, updates, config);
}

// ============================================================================
// API CONTRACT TOOLS
// ============================================================================

export async function addApiContract(
	specManager: SpecManager,
	planId: string,
	endpoint: string,
	method: string,
	description: string,
	requestBody?: string,
	responseBody?: string,
	options?: {
		examples?: Array<{
			name: string;
			description: string;
			code: string;
			language?: string;
		}>;
		supersede_id?: string;
	},
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, ApiContract> = {
		toolName: "add_api_contract",
		description: "Add API contract to a plan",
		specType: "plan",
		arrayFieldName: "api_contracts",
		idPrefix: "api",
		getArray: (spec) => spec.api_contracts || [],
		setArray: (_spec, items) => ({ api_contracts: items }),
	};

	// Build the specification as an OpenAPI-style object
	const specification = JSON.stringify(
		{
			endpoint,
			method,
			requestBody: requestBody ? JSON.parse(requestBody) : undefined,
			responseBody: responseBody ? JSON.parse(responseBody) : undefined,
		},
		null,
		2,
	);

	return addItemWithId(
		specManager,
		planId,
		{
			name: `${method} ${endpoint}`,
			description,
			contract_type: "rest",
			specification,
			examples: options?.examples || [],
		} as Omit<
			ApiContract,
			"id" | "supersedes" | "superseded_by" | "superseded_at"
		>,
		config,
		options?.supersede_id,
	);
}

/**
 * Supersede an existing API contract with updated values
 * Creates a new API contract with a new ID and marks the old one as superseded
 */
export async function supersedeApiContract(
	specManager: SpecManager,
	planId: string,
	contractId: string,
	updates: Partial<
		Pick<
			ApiContract,
			"name" | "description" | "contract_type" | "specification" | "examples"
		>
	>,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, ApiContract> = {
		toolName: "supersede_api_contract",
		description: "Supersede API contract in a plan",
		specType: "plan",
		arrayFieldName: "api_contracts",
		idPrefix: "api",
		getArray: (spec) => spec.api_contracts || [],
		setArray: (_spec, items) => ({ api_contracts: items }),
	};

	return supersedeItemWithId(specManager, planId, contractId, updates, config);
}

export const addApiContractTool = {
	name: "add_api_contract",
	description:
		"Add an API contract to a Plan. API contracts define interfaces (REST, GraphQL, gRPC, library, CLI, etc.). Optionally supersede an existing API contract by providing supersede_id - this will create a new version, mark the old contract as superseded, and update all references.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001-user-auth)",
			},
			name: { type: "string", description: "Display name of the API" },
			description: {
				type: "string",
				description: "Detailed description of what this API does",
			},
			contract_type: {
				type: "string",
				description:
					"Type of API contract (e.g., 'rest', 'graphql', 'grpc', 'library', 'cli')",
			},
			specification: {
				type: "string",
				description:
					"API specification (OpenAPI, GraphQL schema, TypeScript definitions, etc.)",
			},
			examples: {
				type: "array",
				items: {
					type: "object",
					properties: {
						name: { type: "string" },
						description: { type: "string" },
						code: { type: "string" },
						language: { type: "string" },
					},
					required: ["name", "description", "code"],
				},
				description: "Usage examples (optional)",
			},
			supersede_id: {
				type: "string",
				description:
					"Optional: ID of an existing API contract to supersede (e.g., 'api-001'). The old contract will be marked as superseded and all references will be updated.",
			},
		},
		required: [
			"plan_id",
			"name",
			"description",
			"contract_type",
			"specification",
		],
	} as const,
};

// ============================================================================
// DATA MODEL TOOLS
// ============================================================================

export async function addDataModel(
	specManager: SpecManager,
	planId: string,
	name: string,
	description: string,
	fields: string[],
	format?: string,
	supersede_id?: string,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, DataModel> = {
		toolName: "add_data_model",
		description: "Add data model to a plan",
		specType: "plan",
		arrayFieldName: "data_models",
		idPrefix: "dat",
		getArray: (spec) => spec.data_models || [],
		setArray: (_spec, items) => ({ data_models: items }),
	};

	// Convert fields array to a schema string
	const schema = fields.join("\n");

	return addItemWithId(
		specManager,
		planId,
		{
			name,
			description,
			format: format || "typescript",
			schema,
			fields: [],
			relationships: [],
			constraints: [],
			indexes: [],
			examples: [],
		} as Omit<
			DataModel,
			"id" | "supersedes" | "superseded_by" | "superseded_at"
		>,
		config,
		supersede_id,
	);
}

/**
 * Supersede an existing data model with updated values
 * Creates a new data model with a new ID and marks the old one as superseded
 */
export async function supersedeDataModel(
	specManager: SpecManager,
	planId: string,
	modelId: string,
	updates: Partial<
		Pick<
			DataModel,
			| "name"
			| "description"
			| "format"
			| "schema"
			| "fields"
			| "relationships"
			| "constraints"
			| "indexes"
			| "examples"
		>
	>,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, DataModel> = {
		toolName: "supersede_data_model",
		description: "Supersede data model in a plan",
		specType: "plan",
		arrayFieldName: "data_models",
		idPrefix: "dat",
		getArray: (spec) => spec.data_models || [],
		setArray: (_spec, items) => ({ data_models: items }),
	};

	return supersedeItemWithId(specManager, planId, modelId, updates, config);
}

export const addDataModelTool = {
	name: "add_data_model",
	description:
		"Add a data model to a Plan. Data models define schemas, databases, and data structures. Optionally supersede an existing data model by providing supersede_id - this will create a new version, mark the old model as superseded, and update all references.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001-user-auth)",
			},
			name: { type: "string", description: "Display name of the data model" },
			description: {
				type: "string",
				description: "Detailed description of what this data model represents",
			},
			format: {
				type: "string",
				description:
					"Format/notation (e.g., 'json-schema', 'sql', 'typescript', 'protobuf')",
			},
			schema: {
				type: "string",
				description: "The actual model definition/schema",
			},
			supersede_id: {
				type: "string",
				description:
					"Optional: ID of an existing data model to supersede (e.g., 'dat-001'). The old model will be marked as superseded and all references will be updated.",
			},
		},
		required: ["plan_id", "name", "description", "format", "schema"],
	} as const,
};
