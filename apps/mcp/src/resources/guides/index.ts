/**
 * Guide resources for spec-mcp MCP server
 * Each guide is in its own file for better maintainability
 */

export { bestPracticesGuide } from "./best-practices.js";
export { businessRequirementGuide } from "./business-requirement.js";
// Workflow Guides
export { choosingSpecTypesGuide } from "./choosing-spec-types.js";
export { componentGuide } from "./component.js";
export { constitutionGuide } from "./constitution.js";
export { decisionGuide } from "./decision.js";
export { gettingStartedGuide } from "./getting-started.js";
export { implementationWorkflowGuide } from "./implementation-workflow.js";
export { milestoneGuide } from "./milestone.js";
// Spec Type Guides
export { planGuide } from "./plan.js";
export { planningWorkflowGuide } from "./planning-workflow.js";
export { queryGuide } from "./query-guide.js";
export { specRelationshipsGuide } from "./spec-relationships.js";
export { technicalRequirementGuide } from "./technical-requirement.js";

import { bestPracticesGuide } from "./best-practices.js";
import { businessRequirementGuide } from "./business-requirement.js";
import { choosingSpecTypesGuide } from "./choosing-spec-types.js";
import { componentGuide } from "./component.js";
import { constitutionGuide } from "./constitution.js";
import { decisionGuide } from "./decision.js";
import { gettingStartedGuide } from "./getting-started.js";
import { implementationWorkflowGuide } from "./implementation-workflow.js";
import { milestoneGuide } from "./milestone.js";
// Combined guide resources array
import { planGuide } from "./plan.js";
import { planningWorkflowGuide } from "./planning-workflow.js";
import { queryGuide } from "./query-guide.js";
import { specRelationshipsGuide } from "./spec-relationships.js";
import { technicalRequirementGuide } from "./technical-requirement.js";

export const GUIDE_RESOURCES = [
	// Spec Type Guides
	planGuide,
	businessRequirementGuide,
	technicalRequirementGuide,
	decisionGuide,
	componentGuide,
	constitutionGuide,
	milestoneGuide,

	// Workflow Guides
	choosingSpecTypesGuide,
	specRelationshipsGuide,
	gettingStartedGuide,
	planningWorkflowGuide,
	implementationWorkflowGuide,
	bestPracticesGuide,
	queryGuide,
] as const;
