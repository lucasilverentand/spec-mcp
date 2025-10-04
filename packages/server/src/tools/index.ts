import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { ServerConfig } from "../config/index.js";
import type { InputValidator } from "../middleware/input-validator.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { registerAnalyzeTool } from "./analyze.js";
import { registerDeleteSpecTool } from "./delete-spec.js";
import { registerQueryTool } from "./query.js";
import { registerStartDraftTool } from "./start-draft.js";
import { registerUpdateDraftTool } from "./update-draft.js";
import { registerUpdateSpecTool } from "./update-spec.js";
import { registerValidateTool } from "./validate.js";

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
	// Simplified creation flow CRUD tools (4 tools)
	registerStartDraftTool(server, operations, context); // start_draft - create a draft
	registerUpdateDraftTool(server, operations, context); // update_draft - fill draft fields one at a time
	registerUpdateSpecTool(server, operations, context); // update_spec - update finalized specs with validation
	registerDeleteSpecTool(server, operations, context); // delete_spec - delete draft or finalized spec

	// Analysis tool
	registerAnalyzeTool(server, operations, context);

	// Validation tool
	registerValidateTool(server, operations, context);

	// Unified query tool (1 tool)
	registerQueryTool(server, operations, context); // query (read-only queries)
}
