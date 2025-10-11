import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Component,
	ComponentType,
	Decision,
	DecisionStatus,
	Plan,
	Scope,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { updateSpec } from "./update-spec-builder.js";

// ============================================================================
// PLAN UPDATE
// ============================================================================

export async function updatePlan(
	specManager: SpecManager,
	planId: string,
	updates: {
		title?: string;
		description?: string;
		scope?: Scope;
	},
): Promise<ToolResponse> {
	return updateSpec<Plan>(specManager, planId, updates, "plan");
}

export const updatePlanTool = {
	name: "update_plan",
	description:
		"Update scalar fields of a Plan (title, description, scope). Use this to fix typos or improve documentation without recreating the entire plan.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001-user-auth)",
			},
			title: {
				type: "string",
				description: "New title (if updating)",
			},
			description: {
				type: "string",
				description: "New description (if updating)",
			},
			scope: {
				type: "object",
				description: "New scope definition (if updating)",
				properties: {
					in_scope: {
						type: "array",
						items: {
							type: "object",
							properties: {
								item: { type: "string" },
								reasoning: { type: "string" },
							},
							required: ["item", "reasoning"],
						},
					},
					out_of_scope: {
						type: "array",
						items: {
							type: "object",
							properties: {
								item: { type: "string" },
								reasoning: { type: "string" },
							},
							required: ["item", "reasoning"],
						},
					},
				},
				required: ["in_scope", "out_of_scope"],
			},
		},
		required: ["plan_id"],
	} as const,
};

// ============================================================================
// BUSINESS REQUIREMENT UPDATE
// ============================================================================

export async function updateBusinessRequirement(
	specManager: SpecManager,
	brdId: string,
	updates: {
		title?: string;
		description?: string;
	},
): Promise<ToolResponse> {
	return updateSpec<BusinessRequirement>(
		specManager,
		brdId,
		updates,
		"business-requirement",
	);
}

export const updateBusinessRequirementTool = {
	name: "update_business_requirement",
	description:
		"Update scalar fields of a Business Requirement (title, description). Use this to fix typos or improve documentation.",
	inputSchema: {
		type: "object",
		properties: {
			brd_id: {
				type: "string",
				description:
					"Business Requirement identifier (e.g., brd-001-user-auth)",
			},
			title: {
				type: "string",
				description: "New title (if updating)",
			},
			description: {
				type: "string",
				description: "New description (if updating)",
			},
		},
		required: ["brd_id"],
	} as const,
};

// ============================================================================
// TECHNICAL REQUIREMENT UPDATE
// ============================================================================

export async function updateTechnicalRequirement(
	specManager: SpecManager,
	prdId: string,
	updates: {
		title?: string;
		description?: string;
		technical_context?: string;
		implementation_approach?: string;
		implementation_notes?: string;
	},
): Promise<ToolResponse> {
	return updateSpec<TechnicalRequirement>(
		specManager,
		prdId,
		updates,
		"technical-requirement",
	);
}

export const updateTechnicalRequirementTool = {
	name: "update_technical_requirement",
	description:
		"Update scalar fields of a Technical Requirement (title, description, technical_context, implementation_approach, implementation_notes).",
	inputSchema: {
		type: "object",
		properties: {
			prd_id: {
				type: "string",
				description:
					"Technical Requirement identifier (e.g., prd-001-api-design)",
			},
			title: {
				type: "string",
				description: "New title (if updating)",
			},
			description: {
				type: "string",
				description: "New description (if updating)",
			},
			technical_context: {
				type: "string",
				description: "New technical context (if updating)",
			},
			implementation_approach: {
				type: "string",
				description: "New implementation approach (if updating)",
			},
			implementation_notes: {
				type: "string",
				description: "New implementation notes (if updating)",
			},
		},
		required: ["prd_id"],
	} as const,
};

// ============================================================================
// DECISION UPDATE
// ============================================================================

export async function updateDecision(
	specManager: SpecManager,
	decisionId: string,
	updates: {
		title?: string;
		description?: string;
		decision?: string;
		context?: string;
		decision_status?: DecisionStatus;
	},
): Promise<ToolResponse> {
	return updateSpec<Decision>(specManager, decisionId, updates, "decision");
}

export const updateDecisionTool = {
	name: "update_decision",
	description:
		"Update scalar fields of a Decision (title, description, decision, context, decision_status). Use this to update the decision text or change status (proposed → accepted).",
	inputSchema: {
		type: "object",
		properties: {
			decision_id: {
				type: "string",
				description: "Decision identifier (e.g., dec-001-use-postgres)",
			},
			title: {
				type: "string",
				description: "New title (if updating)",
			},
			description: {
				type: "string",
				description: "New description (if updating)",
			},
			decision: {
				type: "string",
				description: "New decision statement (if updating, 20-500 characters)",
			},
			context: {
				type: "string",
				description: "New context/situation (if updating, 20-1000 characters)",
			},
			decision_status: {
				type: "string",
				enum: ["proposed", "accepted", "deprecated", "superseded"],
				description: "New decision status (if updating)",
			},
		},
		required: ["decision_id"],
	} as const,
};

// ============================================================================
// COMPONENT UPDATE
// ============================================================================

export async function updateComponent(
	specManager: SpecManager,
	componentId: string,
	updates: {
		title?: string;
		description?: string;
		component_type?: ComponentType;
		folder?: string;
		scope?: Scope;
		dev_port?: number;
		notes?: string;
	},
): Promise<ToolResponse> {
	return updateSpec<Component>(specManager, componentId, updates, "component");
}

export const updateComponentTool = {
	name: "update_component",
	description:
		"Update scalar fields of a Component (title, description, component_type, folder, scope, dev_port, notes).",
	inputSchema: {
		type: "object",
		properties: {
			component_id: {
				type: "string",
				description: "Component identifier (e.g., cmp-001-web-app)",
			},
			title: {
				type: "string",
				description: "New title (if updating)",
			},
			description: {
				type: "string",
				description: "New description (if updating)",
			},
			component_type: {
				type: "string",
				enum: ["app", "service", "library"],
				description: "New component type (if updating)",
			},
			folder: {
				type: "string",
				description: "New folder path from repository root (if updating)",
			},
			scope: {
				type: "object",
				description: "New scope definition (if updating)",
				properties: {
					in_scope: {
						type: "array",
						items: {
							type: "object",
							properties: {
								item: { type: "string" },
								reasoning: { type: "string" },
							},
							required: ["item", "reasoning"],
						},
					},
					out_of_scope: {
						type: "array",
						items: {
							type: "object",
							properties: {
								item: { type: "string" },
								reasoning: { type: "string" },
							},
							required: ["item", "reasoning"],
						},
					},
				},
				required: ["in_scope", "out_of_scope"],
			},
			dev_port: {
				type: "number",
				description: "New development server port (if updating, 1-65535)",
			},
			notes: {
				type: "string",
				description: "New notes (if updating)",
			},
		},
		required: ["component_id"],
	} as const,
};
