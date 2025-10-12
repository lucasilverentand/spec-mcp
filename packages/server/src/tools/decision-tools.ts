import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	Consequence,
	ConsequenceType,
	Decision,
	Reference,
} from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// ALTERNATIVE TOOLS (string array)
// ============================================================================

export async function addAlternative(
	specManager: SpecManager,
	decisionId: string,
	alternative: string,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Decision, string> = {
		toolName: "add_alternative",
		description: "Add alternative to a decision",
		specType: "decision",
		arrayFieldName: "alternatives",
		idPrefix: "",
		getArray: (spec) => spec.alternatives || [],
		setArray: (_spec, items) => ({ alternatives: items }),
	};

	return addSimpleItem(specManager, decisionId, alternative, config);
}

export const addAlternativeTool = {
	name: "add_alternative",
	description:
		"Add an alternative option to a Decision. Alternatives are options that were considered but not chosen.",
	inputSchema: {
		type: "object",
		properties: {
			decision_id: {
				type: "string",
				description: "Decision identifier (e.g., dec-001-use-postgres)",
			},
			alternative: {
				type: "string",
				description: "Description of the alternative option",
			},
		},
		required: ["decision_id", "alternative"],
	} as const,
};

export const removeAlternativeTool = {
	name: "remove_alternative",
	description: "Remove an alternative from a Decision by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			decision_id: {
				type: "string",
				description: "Decision identifier (e.g., dec-001-use-postgres)",
			},
			index: {
				type: "number",
				description: "Index of the alternative to remove (0-based)",
			},
		},
		required: ["decision_id", "index"],
	} as const,
};

// ============================================================================
// CONSEQUENCE TOOLS
// ============================================================================

export async function addConsequence(
	specManager: SpecManager,
	decisionId: string,
	type: ConsequenceType,
	description: string,
	mitigation?: string,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Decision, Consequence> = {
		toolName: "add_consequence",
		description: "Add consequence to a decision",
		specType: "decision",
		arrayFieldName: "consequences",
		idPrefix: "",
		getArray: (spec) => spec.consequences || [],
		setArray: (_spec, items) => ({ consequences: items }),
	};

	const consequence: Consequence = {
		type,
		description,
		...(mitigation && { mitigation }),
	};

	return addSimpleItem(specManager, decisionId, consequence, config);
}

export const addConsequenceTool = {
	name: "add_consequence",
	description:
		"Add a consequence to a Decision. Consequences can be positive, negative, or risks.",
	inputSchema: {
		type: "object",
		properties: {
			decision_id: {
				type: "string",
				description: "Decision identifier (e.g., dec-001-use-postgres)",
			},
			type: {
				type: "string",
				enum: ["positive", "negative", "risk"],
				description: "Type of consequence",
			},
			description: {
				type: "string",
				description: "Description of the consequence (10-300 characters)",
			},
			mitigation: {
				type: "string",
				description:
					"Mitigation strategy for negative consequences or risks (optional, 10-300 characters)",
			},
		},
		required: ["decision_id", "type", "description"],
	} as const,
};

export const removeConsequenceTool = {
	name: "remove_consequence",
	description: "Remove a consequence from a Decision by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			decision_id: {
				type: "string",
				description: "Decision identifier (e.g., dec-001-use-postgres)",
			},
			index: {
				type: "number",
				description: "Index of the consequence to remove (0-based)",
			},
		},
		required: ["decision_id", "index"],
	} as const,
};

// ============================================================================
// REFERENCE TOOLS (for Decisions)
// ============================================================================

export async function addReferenceToDecision(
	specManager: SpecManager,
	decisionId: string,
	reference: Reference,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Decision, Reference> = {
		toolName: "add_reference",
		description: "Add reference to a decision",
		specType: "decision",
		arrayFieldName: "references",
		idPrefix: "",
		getArray: (spec) => spec.references || [],
		setArray: (_spec, items) => ({ references: items }),
	};

	return addSimpleItem(specManager, decisionId, reference, config);
}

export const addReferenceToDecisionTool = {
	name: "add_reference_to_decision",
	description:
		"Add a reference (URL, documentation, file, code) to a Decision for supporting documentation.",
	inputSchema: {
		type: "object",
		properties: {
			decision_id: {
				type: "string",
				description: "Decision identifier (e.g., dec-001-use-postgres)",
			},
			reference: {
				type: "object",
				description:
					"Reference object with type-specific fields (url, documentation, file, code, or other)",
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
		required: ["decision_id", "reference"],
	} as const,
};

export const removeReferenceFromDecisionTool = {
	name: "remove_reference_from_decision",
	description: "Remove a reference from a Decision by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			decision_id: {
				type: "string",
				description: "Decision identifier (e.g., dec-001-use-postgres)",
			},
			index: {
				type: "number",
				description: "Index of the reference to remove (0-based)",
			},
		},
		required: ["decision_id", "index"],
	} as const,
};
