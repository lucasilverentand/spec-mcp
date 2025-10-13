import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Decision,
	Milestone,
	Plan,
	Reference,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// UNIFIED REFERENCE TOOL
// ============================================================================

type SpecWithReferences =
	| Plan
	| BusinessRequirement
	| TechnicalRequirement
	| Decision
	| Milestone;

/**
 * Add a reference to any spec that supports references
 * Automatically determines spec type from the ID prefix
 */
export async function addReference(
	specManager: SpecManager,
	specId: string,
	reference: Reference,
	isTechnicalDependency = false,
): Promise<CallToolResult> {
	// Extract spec type from ID prefix
	const specType = getSpecTypeFromId(specId);

	// For technical requirements, support both references and technical_dependencies
	const isTechDep =
		specType === "technical-requirement" && isTechnicalDependency;

	const config: ArrayToolConfig<SpecWithReferences, Reference> = {
		toolName: "add_reference",
		description: `Add reference to a ${specType}`,
		specType,
		arrayFieldName: (isTechDep
			? "technical_dependencies"
			: "references") as keyof SpecWithReferences,
		idPrefix: "",
		getArray: (spec) => {
			if (isTechDep) {
				return (spec as TechnicalRequirement).technical_dependencies || [];
			}
			return spec.references || [];
		},
		setArray: (_spec, items) =>
			isTechDep
				? ({ technical_dependencies: items } as Partial<TechnicalRequirement>)
				: ({ references: items } as Partial<SpecWithReferences>),
	};

	return addSimpleItem(specManager, specId, reference, config);
}

/**
 * Extract spec type from ID prefix
 */
function getSpecTypeFromId(
	specId: string,
):
	| "plan"
	| "business-requirement"
	| "technical-requirement"
	| "decision"
	| "milestone" {
	const prefix = specId.split("-")[0];

	switch (prefix?.toLowerCase()) {
		case "pln":
			return "plan";
		case "brd":
			return "business-requirement";
		case "prd":
		case "trd":
			return "technical-requirement";
		case "dec":
			return "decision";
		case "mls":
			return "milestone";
		default:
			throw new Error(
				`Unknown spec type prefix: ${prefix}. Expected: pln, brd, prd/trd, dec, or mls`,
			);
	}
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const addReferenceTool = {
	name: "add_reference",
	description:
		"Add a reference (URL, documentation, file, code) to any spec. Automatically determines the spec type from the ID prefix. For technical requirements, can add to either 'references' or 'technical_dependencies' field.",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Spec identifier with type prefix (e.g., pln-001, brd-002, prd-003, dec-004, mls-005)",
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
			is_technical_dependency: {
				type: "boolean",
				description:
					"For technical requirements only: if true, adds to 'technical_dependencies' instead of 'references'. Ignored for other spec types.",
			},
		},
		required: ["spec_id", "reference"],
	} as const,
};
