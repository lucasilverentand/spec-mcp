import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Plan,
	Reference,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// REFERENCE TOOLS FOR PLANS
// ============================================================================

export async function addReferenceToPlan(
	specManager: SpecManager,
	planId: string,
	reference: Reference,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Plan, Reference> = {
		toolName: "add_reference_to_plan",
		description: "Add reference to a plan",
		specType: "plan",
		arrayFieldName: "references",
		idPrefix: "",
		getArray: (spec) => spec.references || [],
		setArray: (_spec, items) => ({ references: items }),
	};

	return addSimpleItem(specManager, planId, reference, config);
}

// ============================================================================
// REFERENCE TOOLS FOR BUSINESS REQUIREMENTS
// ============================================================================

export async function addReferenceToBrd(
	specManager: SpecManager,
	brdId: string,
	reference: Reference,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<BusinessRequirement, Reference> = {
		toolName: "add_reference_to_brd",
		description: "Add reference to a business requirement",
		specType: "business-requirement",
		arrayFieldName: "references",
		idPrefix: "",
		getArray: (spec) => spec.references || [],
		setArray: (_spec, items) => ({ references: items }),
	};

	return addSimpleItem(specManager, brdId, reference, config);
}

// ============================================================================
// TECHNICAL DEPENDENCY TOOLS (References) FOR TECHNICAL REQUIREMENTS
// ============================================================================

export async function addTechnicalDependency(
	specManager: SpecManager,
	prdId: string,
	reference: Reference,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<TechnicalRequirement, Reference> = {
		toolName: "add_technical_dependency",
		description: "Add technical dependency to a technical requirement",
		specType: "technical-requirement",
		arrayFieldName: "technical_dependencies",
		idPrefix: "",
		getArray: (spec) => spec.technical_dependencies || [],
		setArray: (_spec, items) => ({ technical_dependencies: items }),
	};

	return addSimpleItem(specManager, prdId, reference, config);
}

// ============================================================================
// REFERENCE TOOLS FOR TECHNICAL REQUIREMENTS
// ============================================================================

export async function addReferenceToPrd(
	specManager: SpecManager,
	prdId: string,
	reference: Reference,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<TechnicalRequirement, Reference> = {
		toolName: "add_reference_to_prd",
		description: "Add reference to a technical requirement",
		specType: "technical-requirement",
		arrayFieldName: "references",
		idPrefix: "",
		getArray: (spec) => spec.references || [],
		setArray: (_spec, items) => ({ references: items }),
	};

	return addSimpleItem(specManager, prdId, reference, config);
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const addReferenceToPlanTool = {
	name: "add_reference_to_plan",
	description: "Add a reference (URL, documentation, file, code) to a Plan.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001-user-auth)",
			},
			reference: {
				type: "object",
				description: "Reference object with type-specific fields",
				properties: {
					type: {
						type: "string",
						enum: ["url", "documentation", "file", "code", "other"],
					},
					name: { type: "string" },
					description: { type: "string" },
					importance: {
						type: "string",
						enum: ["low", "medium", "high", "critical"],
					},
				},
				required: ["type", "name", "description"],
			},
		},
		required: ["plan_id", "reference"],
	} as const,
};

export const removeReferenceFromPlanTool = {
	name: "remove_reference_from_plan",
	description: "Remove a reference from a Plan by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001-user-auth)",
			},
			index: {
				type: "number",
				description: "Index of the reference to remove (0-based)",
			},
		},
		required: ["plan_id", "index"],
	} as const,
};

export const addReferenceToBrdTool = {
	name: "add_reference_to_brd",
	description:
		"Add a reference (URL, documentation, file, code) to a Business Requirement.",
	inputSchema: {
		type: "object",
		properties: {
			brd_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			reference: {
				type: "object",
				description: "Reference object with type-specific fields",
				properties: {
					type: {
						type: "string",
						enum: ["url", "documentation", "file", "code", "other"],
					},
					name: { type: "string" },
					description: { type: "string" },
					importance: {
						type: "string",
						enum: ["low", "medium", "high", "critical"],
					},
				},
				required: ["type", "name", "description"],
			},
		},
		required: ["brd_id", "reference"],
	} as const,
};

export const removeReferenceFromBrdTool = {
	name: "remove_reference_from_brd",
	description:
		"Remove a reference from a Business Requirement by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			brd_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			index: {
				type: "number",
				description: "Index of the reference to remove (0-based)",
			},
		},
		required: ["brd_id", "index"],
	} as const,
};

export const addTechnicalDependencyTool = {
	name: "add_technical_dependency",
	description:
		"Add a technical dependency (library, framework, API, system) to a Technical Requirement.",
	inputSchema: {
		type: "object",
		properties: {
			prd_id: {
				type: "string",
				description:
					"Technical Requirement identifier (e.g., prd-001-api-design)",
			},
			reference: {
				type: "object",
				description: "Reference object describing the technical dependency",
				properties: {
					type: {
						type: "string",
						enum: ["url", "documentation", "file", "code", "other"],
					},
					name: { type: "string" },
					description: { type: "string" },
					importance: {
						type: "string",
						enum: ["low", "medium", "high", "critical"],
					},
				},
				required: ["type", "name", "description"],
			},
		},
		required: ["prd_id", "reference"],
	} as const,
};

export const removeTechnicalDependencyTool = {
	name: "remove_technical_dependency",
	description:
		"Remove a technical dependency from a Technical Requirement by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			prd_id: {
				type: "string",
				description:
					"Technical Requirement identifier (e.g., prd-001-api-design)",
			},
			index: {
				type: "number",
				description: "Index of the technical dependency to remove (0-based)",
			},
		},
		required: ["prd_id", "index"],
	} as const,
};

export const addReferenceToPrdTool = {
	name: "add_reference_to_prd",
	description:
		"Add a reference (URL, documentation, file, code) to a Technical Requirement.",
	inputSchema: {
		type: "object",
		properties: {
			prd_id: {
				type: "string",
				description:
					"Technical Requirement identifier (e.g., prd-001-api-design)",
			},
			reference: {
				type: "object",
				description: "Reference object with type-specific fields",
				properties: {
					type: {
						type: "string",
						enum: ["url", "documentation", "file", "code", "other"],
					},
					name: { type: "string" },
					description: { type: "string" },
					importance: {
						type: "string",
						enum: ["low", "medium", "high", "critical"],
					},
				},
				required: ["type", "name", "description"],
			},
		},
		required: ["prd_id", "reference"],
	} as const,
};

export const removeReferenceFromPrdTool = {
	name: "remove_reference_from_prd",
	description:
		"Remove a reference from a Technical Requirement by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			prd_id: {
				type: "string",
				description:
					"Technical Requirement identifier (e.g., prd-001-api-design)",
			},
			index: {
				type: "number",
				description: "Index of the reference to remove (0-based)",
			},
		},
		required: ["prd_id", "index"],
	} as const,
};
