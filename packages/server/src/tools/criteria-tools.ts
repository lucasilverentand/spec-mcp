import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Criteria,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import {
	type ArrayToolConfig,
	addItemWithId,
	removeItemWithId,
	supersedeItemWithId,
} from "./array-tool-builder.js";

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
): Promise<CallToolResult> {
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
		idPrefix: "crt",
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
					"Optional: ID of an existing criteria to supersede (e.g., 'crt-001'). The old criteria will be marked as superseded and all references will be updated.",
			},
		},
		required: ["spec_id", "description", "rationale"],
	} as const,
};

/**
 * Supersede an existing criteria with updated values
 * Creates a new criteria with a new ID and marks the old one as superseded
 */
export async function supersedeCriteria(
	specManager: SpecManager,
	specId: string,
	criteriaId: string,
	updates: Partial<Pick<Criteria, "description" | "rationale">>,
): Promise<CallToolResult> {
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
		toolName: "supersede_criteria",
		description: "Supersede acceptance criteria in a requirement",
		specType,
		arrayFieldName: "criteria" as keyof (
			| BusinessRequirement
			| TechnicalRequirement
		),
		idPrefix: "crt",
		getArray: (spec) => spec.criteria || [],
		setArray: (_spec, items) => ({ criteria: items }),
	};

	return supersedeItemWithId(specManager, specId, criteriaId, updates, config);
}

/**
 * Remove a criteria from a requirement completely
 */
export async function removeCriteria(
	specManager: SpecManager,
	specId: string,
	criteriaId: string,
): Promise<CallToolResult> {
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
		toolName: "remove_criteria",
		description: "Remove acceptance criteria from a requirement",
		specType,
		arrayFieldName: "criteria" as keyof (
			| BusinessRequirement
			| TechnicalRequirement
		),
		idPrefix: "crt",
		getArray: (spec) => spec.criteria || [],
		setArray: (_spec, items) => ({ criteria: items }),
	};

	return removeItemWithId(specManager, specId, criteriaId, config);
}
