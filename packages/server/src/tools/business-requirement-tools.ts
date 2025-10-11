import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	BusinessValue,
	Stakeholder,
	StakeholderRole,
	UserStory,
} from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// USER STORY TOOLS
// ============================================================================

export async function addUserStory(
	specManager: SpecManager,
	specId: string,
	role: string,
	feature: string,
	benefit: string,
): Promise<ToolResponse> {
	const config: ArrayToolConfig<BusinessRequirement, UserStory> = {
		toolName: "add_user_story",
		description: "Add user story to a business requirement",
		specType: "business-requirement",
		arrayFieldName: "user_stories",
		idPrefix: "",
		getArray: (spec) => spec.user_stories || [],
		setArray: (_spec, items) => ({ user_stories: items }),
	};

	return addSimpleItem(specManager, specId, { role, feature, benefit }, config);
}

export const addUserStoryTool = {
	name: "add_user_story",
	description:
		"Add a user story to a Business Requirement. User stories follow the format: As a [role], I want [feature], so that [benefit].",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			role: {
				type: "string",
				description: "The role of the user (minimum 3 characters)",
			},
			feature: {
				type: "string",
				description: "The feature the user wants (minimum 10 characters)",
			},
			benefit: {
				type: "string",
				description: "The benefit the user expects (minimum 10 characters)",
			},
		},
		required: ["spec_id", "role", "feature", "benefit"],
	} as const,
};

export const removeUserStoryTool = {
	name: "remove_user_story",
	description:
		"Remove a user story from a Business Requirement by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			index: {
				type: "number",
				description: "Index of the user story to remove (0-based)",
			},
		},
		required: ["spec_id", "index"],
	} as const,
};

// ============================================================================
// BUSINESS VALUE TOOLS
// ============================================================================

export async function addBusinessValue(
	specManager: SpecManager,
	specId: string,
	type: "revenue" | "cost-savings" | "customer-satisfaction" | "other",
	value: string,
): Promise<ToolResponse> {
	const config: ArrayToolConfig<BusinessRequirement, BusinessValue> = {
		toolName: "add_business_value",
		description: "Add business value to a business requirement",
		specType: "business-requirement",
		arrayFieldName: "business_value",
		idPrefix: "",
		getArray: (spec) => spec.business_value || [],
		setArray: (_spec, items) => ({ business_value: items }),
	};

	return addSimpleItem(specManager, specId, { type, value }, config);
}

export const addBusinessValueTool = {
	name: "add_business_value",
	description:
		"Add business value proposition to a Business Requirement. Describes the ROI, revenue impact, cost savings, or other business benefits.",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			type: {
				type: "string",
				enum: ["revenue", "cost-savings", "customer-satisfaction", "other"],
				description: "Type of business value",
			},
			value: {
				type: "string",
				description: "Description of the business value, ROI, or benefit",
			},
		},
		required: ["spec_id", "type", "value"],
	} as const,
};

export const removeBusinessValueTool = {
	name: "remove_business_value",
	description:
		"Remove a business value from a Business Requirement by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			index: {
				type: "number",
				description: "Index of the business value to remove (0-based)",
			},
		},
		required: ["spec_id", "index"],
	} as const,
};

// ============================================================================
// STAKEHOLDER TOOLS
// ============================================================================

export async function addStakeholder(
	specManager: SpecManager,
	specId: string,
	role: StakeholderRole,
	name: string,
	interest: string,
	email?: string,
): Promise<ToolResponse> {
	const config: ArrayToolConfig<BusinessRequirement, Stakeholder> = {
		toolName: "add_stakeholder",
		description: "Add stakeholder to a business requirement",
		specType: "business-requirement",
		arrayFieldName: "stakeholders",
		idPrefix: "",
		getArray: (spec) => spec.stakeholders || [],
		setArray: (_spec, items) => ({ stakeholders: items }),
	};

	const stakeholder: Stakeholder = {
		role,
		name,
		interest,
		...(email && { email }),
	};

	return addSimpleItem(specManager, specId, stakeholder, config);
}

export const addStakeholderTool = {
	name: "add_stakeholder",
	description:
		"Add a stakeholder to a Business Requirement. Stakeholders are people or groups with an interest in this requirement.",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			role: {
				type: "string",
				enum: [
					"product-owner",
					"business-analyst",
					"project-manager",
					"customer",
					"end-user",
					"executive",
					"developer",
					"other",
				],
				description: "Role of the stakeholder",
			},
			name: {
				type: "string",
				description: "Name of the stakeholder (minimum 3 characters)",
			},
			interest: {
				type: "string",
				description:
					"Stakeholder's interest in this requirement (minimum 10 characters)",
			},
			email: {
				type: "string",
				description: "Email address of the stakeholder (optional)",
			},
		},
		required: ["spec_id", "role", "name", "interest"],
	} as const,
};

export const removeStakeholderTool = {
	name: "remove_stakeholder",
	description:
		"Remove a stakeholder from a Business Requirement by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			spec_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			index: {
				type: "number",
				description: "Index of the stakeholder to remove (0-based)",
			},
		},
		required: ["spec_id", "index"],
	} as const,
};
