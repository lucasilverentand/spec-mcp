/**
 * Mode configuration for the MCP server
 *
 * Modes control which tools are available to optimize performance and UX:
 * - PLAN: For creating and designing specifications (lightweight)
 * - WORK: For executing plans with git workflow (implementation-focused)
 * - FULL: All tools available (complete access)
 */

export type ServerMode = "plan" | "work" | "full";

export interface ModeConfig {
	mode: ServerMode;
	enabledTools: Set<string>;
	description: string;
}

/**
 * Tool categories for mode configuration
 */
export const ToolCategories = {
	// Draft workflow tools (6)
	DRAFT_WORKFLOW: [
		"start_draft",
		"answer_question",
		"finalize_entity",
		"continue_draft",
		"skip_answer",
		"list_drafts",
	],

	// Core spec management (3)
	SPEC_MANAGEMENT: ["get_spec", "validate_entity", "delete"],

	// Task workflow tools (2)
	TASK_WORKFLOW: ["start_task", "finish_task"],

	// Task management (1)
	TASK_MANAGEMENT: ["add_task"],

	// Reference management (1)
	REFERENCE_MANAGEMENT: ["add_reference"],

	// Update tools (5)
	UPDATE_TOOLS: [
		"update_plan",
		"update_business_requirement",
		"update_technical_requirement",
		"update_decision",
		"update_component",
	],

	// Array manipulation - Business Requirements (3)
	BRD_ARRAY_TOOLS: ["add_user_story", "add_business_value", "add_stakeholder"],

	// Array manipulation - Technical Requirements (1)
	PRD_ARRAY_TOOLS: ["add_constraint"],

	// Array manipulation - Plans (4)
	PLAN_ARRAY_TOOLS: [
		"add_test_case",
		"add_flow",
		"add_api_contract",
		"add_data_model",
	],

	// Array manipulation - Decisions (2)
	DECISION_ARRAY_TOOLS: ["add_alternative", "add_consequence"],

	// Array manipulation - Components (3)
	COMPONENT_ARRAY_TOOLS: [
		"add_tech",
		"add_deployment",
		"add_external_dependency",
	],

	// Array manipulation - Criteria (1)
	CRITERIA_TOOLS: ["add_criteria"],
} as const;

/**
 * Mode configurations
 */
export const ModeConfigs: Record<ServerMode, ModeConfig> = {
	plan: {
		mode: "plan",
		description:
			"Plan mode: Lightweight specification creation and design tools",
		enabledTools: new Set([
			...ToolCategories.DRAFT_WORKFLOW,
			...ToolCategories.SPEC_MANAGEMENT,
			...ToolCategories.REFERENCE_MANAGEMENT,
			...ToolCategories.UPDATE_TOOLS,
		]),
	},

	work: {
		mode: "work",
		description:
			"Work mode: Implementation and task workflow tools with essential spec access",
		enabledTools: new Set([
			...ToolCategories.TASK_WORKFLOW,
			...ToolCategories.TASK_MANAGEMENT,
			...ToolCategories.SPEC_MANAGEMENT,
			...ToolCategories.UPDATE_TOOLS.filter((t) => t === "update_plan"), // Only allow updating plan scope
			// Essential array tools for implementation
			"add_test_case",
			"add_criteria",
			"add_flow",
			"add_api_contract",
			"add_data_model",
		]),
	},

	full: {
		mode: "full",
		description: "Full mode: All tools available",
		enabledTools: new Set([
			...ToolCategories.DRAFT_WORKFLOW,
			...ToolCategories.SPEC_MANAGEMENT,
			...ToolCategories.TASK_WORKFLOW,
			...ToolCategories.TASK_MANAGEMENT,
			...ToolCategories.REFERENCE_MANAGEMENT,
			...ToolCategories.UPDATE_TOOLS,
			...ToolCategories.BRD_ARRAY_TOOLS,
			...ToolCategories.PRD_ARRAY_TOOLS,
			...ToolCategories.PLAN_ARRAY_TOOLS,
			...ToolCategories.DECISION_ARRAY_TOOLS,
			...ToolCategories.COMPONENT_ARRAY_TOOLS,
			...ToolCategories.CRITERIA_TOOLS,
		]),
	},
};

/**
 * Get the current mode from environment variables
 * Defaults to FULL mode if not specified
 */
export function getServerMode(): ServerMode {
	const mode = process.env.MODE?.toLowerCase();

	if (mode === "plan" || mode === "work" || mode === "full") {
		return mode;
	}

	// Default to full mode
	return "full";
}

/**
 * Check if a tool is enabled in the current mode
 */
export function isToolEnabled(toolName: string, mode: ServerMode): boolean {
	return ModeConfigs[mode].enabledTools.has(toolName);
}

/**
 * Get mode configuration
 */
export function getModeConfig(mode: ServerMode): ModeConfig {
	return ModeConfigs[mode];
}

/**
 * Get summary of enabled tools for a mode
 */
export function getModeSummary(mode: ServerMode): {
	mode: ServerMode;
	description: string;
	toolCount: number;
	tools: string[];
} {
	const config = ModeConfigs[mode];
	return {
		mode: config.mode,
		description: config.description,
		toolCount: config.enabledTools.size,
		tools: Array.from(config.enabledTools).sort(),
	};
}
