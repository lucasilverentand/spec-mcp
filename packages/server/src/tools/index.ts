import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { ServerConfig } from "../config/index.js";
import { registerFinalizeDraftTool } from "./finalize-draft.js";
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
	// Creation flow tools (Q&A-based guided creation)
	registerStartDraftTool(server, operations, config); // start_draft - start Q&A flow
	registerUpdateDraftTool(server, config); // update_draft - answer questions, collect data
	registerFinalizeDraftTool(server, operations, config); // finalize_draft - finalize draft and create spec

	// Spec management tools
	registerUpdateSpecTool(server, operations, config); // update_spec - update finalized specs with validation
	registerDeleteSpecTool(server, operations, config); // delete_spec - delete draft or finalized spec

	// Validation tool (includes reference checking, cycle detection, health scoring)
	registerValidateTool(server, operations, config);

	// Unified query tool (includes dependency analysis, orphan/coverage filters, next task)
	registerQueryTool(server, operations, config); // query (read-only queries)
}
