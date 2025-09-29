import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { ServerConfig } from "../config/index.js";
import type { InputValidator } from "../middleware/input-validator.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { registerAnalysisTools } from "./analysis.js";
import { registerComponentTools } from "./components.js";
import { registerPlanTools } from "./plans.js";
import { registerReportingTools } from "./reporting.js";
import { registerRequirementTools } from "./requirements.js";
import { registerSearchTools } from "./search.js";
import { registerValidationTools } from "./validation.js";

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
	registerRequirementTools(server, operations, context);
	registerPlanTools(server, operations, context);
	registerComponentTools(server, operations, context);
	registerAnalysisTools(server, operations, context);
	registerReportingTools(server, operations, context);
	registerSearchTools(server, operations, context);
	registerValidationTools(server, operations, context);
}
