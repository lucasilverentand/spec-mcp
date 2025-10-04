import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { ServerConfig } from "../config/index.js";
import { registerDeleteSpecTool } from "./delete-spec.js";
import { registerQueryTool } from "./query.js";
import { registerStartDraftTool } from "./start-draft.js";
import { registerUpdateDraftTool } from "./update-draft.js";
import { registerUpdateSpecTool } from "./update-spec.js";
import { registerValidateTool } from "./validate.js";

/**
 * Register all MCP tools for the spec server
 */
export function registerAllTools(
	server: McpServer,
	operations: SpecOperations,
	config: ServerConfig,
) {
	// Simplified creation flow CRUD tools (4 tools)
	registerStartDraftTool(server, operations, config); // start_draft - create a draft
	registerUpdateDraftTool(server, operations, config); // update_draft - fill draft fields one at a time
	registerUpdateSpecTool(server, operations, config); // update_spec - update finalized specs with validation
	registerDeleteSpecTool(server, operations, config); // delete_spec - delete draft or finalized spec

	// Validation tool (includes reference checking, cycle detection, health scoring)
	registerValidateTool(server, operations, config);

	// Unified query tool (includes dependency analysis, orphan/coverage filters, next task)
	registerQueryTool(server, operations, config); // query (read-only queries)
}
