import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Criteria,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { type ArrayToolConfig, addItemWithId } from "./array-tool-builder.js";

/**
 * Add a criteria to a Business or Technical Requirement
 * Supports superseding existing criteria by providing supersede_id
 */
export async function addCriteria(
	specManager: SpecManager,
	specId: string,
	description: string,
	rationale: string,
	supersede_id?: string,
): Promise<ToolResponse> {
	// Determine spec type from ID
	const specType = specId.startsWith("brd-")
		? "business-requirement"
		: specId.startsWith("prd-")
			? "technical-requirement"
			: null;

	if (!specType) {
		return {
			content: [
				{
					type: "text",
					text: `Invalid spec ID format: ${specId}. Must start with brd- or prd-`,
				},
			],
			isError: true,
		};
	}

	const config: ArrayToolConfig<
		BusinessRequirement | TechnicalRequirement,
		Criteria
	> = {
		toolName: "add_criteria",
		description: "Add acceptance criteria to a requirement",
		specType,
		arrayFieldName: "criteria" as keyof (
			| BusinessRequirement
			| TechnicalRequirement
		),
		idPrefix: "crit",
		getArray: (spec) => spec.criteria || [],
		setArray: (_spec, items) => ({ criteria: items }),
	};

	return addItemWithId(
		specManager,
		specId,
		{
			description,
			rationale,
		} as Omit<
			Criteria,
			"id" | "supersedes" | "superseded_by" | "superseded_at"
		>,
		config,
		supersede_id,
	);
}

export const addCriteriaTool = {
	name: "add_criteria",
	description:
		"Add acceptance criteria to a Business or Technical Requirement. Creates a new criteria with auto-generated ID. Optionally supersede an existing criteria by providing supersede_id - this will create a new version, mark the old criteria as superseded, and update all references.",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Requirement identifier (e.g., brd-001-user-auth or prd-001-api-design)",
			},
			description: {
				type: "string",
				description: "Description of the acceptance criterion",
			},
			rationale: {
				type: "string",
				description: "Rationale explaining why this criterion is important",
			},
			supersede_id: {
				type: "string",
				description:
					"Optional: ID of an existing criteria to supersede (e.g., 'crit-001'). The old criteria will be marked as superseded and all references will be updated.",
			},
		},
		required: ["spec_id", "description", "rationale"],
	} as const,
};
