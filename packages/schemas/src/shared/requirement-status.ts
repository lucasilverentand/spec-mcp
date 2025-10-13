import type { Criteria } from "./criteria.js";
import type { Task } from "./task.js";

/**
 * Requirement state derived from criteria completion
 */
export type RequirementState =
	| "not-started"
	| "in-progress"
	| "completed"
	| "verified";

/**
 * Plan reference structure from Plan schema
 */
export interface PlanRef {
	tasks: Task[];
	criteria?: { requirement: string; criteria: string };
}

/**
 * Requirement reference structure
 */
export interface RequirementRef {
	id: string;
	criteria: Criteria[];
}

// Note: All requirement utility functions have been moved to @spec-mcp/core/utils/requirement-utils
// Import them from there instead:
//   import { getPlanState, getCriterionState, getRequirementState, etc } from "@spec-mcp/core";
