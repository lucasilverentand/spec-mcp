import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { ServerConfig } from "../config/index.js";
import type { InputValidator } from "../middleware/input-validator.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { registerAnalyzeTool } from "./analyze.js";
import { registerComponentTool } from "./component.js";
import { registerGuidanceTool } from "./guidance.js";
import { registerPlanTool } from "./plan.js";
import { registerRequirementTool } from "./requirement.js";
import { registerSearchTools } from "./search.js";
import { registerSubEntityTools } from "./sub-entities.js";

export interface ToolContext {
	rateLimiter: RateLimiter;
	inputValidator: InputValidator;
	config: ServerConfig;
}

/**
 * Register all MCP tools for the spec server
 */
export function registerAllTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Consolidated entity management tools (3 tools)
	registerRequirementTool(server, operations, context);
	registerPlanTool(server, operations, context);
	registerComponentTool(server, operations, context);

	// Consolidated analysis and guidance (2 tools)
	registerAnalyzeTool(server, operations, context);
	registerGuidanceTool(server, operations, context);

	// Sub-entity accessors and search (6 tools)
	registerSubEntityTools(server, operations, context); // get-plan-task, get-plan-test-case, etc.
	registerSearchTools(server, operations, context); // search-specs
}
