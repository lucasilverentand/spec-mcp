import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type { Constraint, TechnicalRequirement } from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// CONSTRAINT TOOLS
// ============================================================================

export async function addConstraint(
	specManager: SpecManager,
	requirementId: string,
	type:
		| "performance"
		| "security"
		| "scalability"
		| "compatibility"
		| "infrastructure"
		| "other",
	description: string,
): Promise<ToolResponse> {
	const config: ArrayToolConfig<TechnicalRequirement, Constraint> = {
		toolName: "add_constraint",
		description: "Add technical constraint to a requirement",
		specType: "technical-requirement",
		arrayFieldName: "constraints",
		idPrefix: "",
		getArray: (spec) => spec.constraints || [],
		setArray: (_spec, items) => ({ constraints: items }),
	};

	const constraint: Constraint = {
		type,
		description,
	};

	return addSimpleItem(specManager, requirementId, constraint, config);
}

export const addConstraintTool = {
	name: "add_constraint",
	description:
		"Add a technical constraint to a Technical Requirement (performance, security, scalability, etc.).",
	inputSchema: {
		type: "object",
		properties: {
			requirement_id: {
				type: "string",
				description:
					"Technical Requirement identifier (e.g., prd-001-api-design)",
			},
			type: {
				type: "string",
				enum: [
					"performance",
					"security",
					"scalability",
					"compatibility",
					"infrastructure",
					"other",
				],
				description: "Type of technical constraint",
			},
			description: {
				type: "string",
				description: "Description of the constraint",
			},
		},
		required: ["requirement_id", "type", "description"],
	} as const,
};

export const removeConstraintTool = {
	name: "remove_constraint",
	description:
		"Remove a technical constraint from a Technical Requirement by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			requirement_id: {
				type: "string",
				description:
					"Technical Requirement identifier (e.g., prd-001-api-design)",
			},
			index: {
				type: "number",
				description: "Index of the constraint to remove (0-based)",
			},
		},
		required: ["requirement_id", "index"],
	} as const,
};
