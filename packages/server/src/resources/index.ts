import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { GUIDE_RESOURCES } from "./guides.js";

/**
 * Register all MCP resources for the spec server
 */
export function registerResources(
	server: McpServer,
	_config: ServerConfig,
): void {
	// Register each guide as a static resource
	for (const guide of GUIDE_RESOURCES) {
		server.registerResource(
			guide.name,
			guide.uri,
			{
				title: guide.name,
				description: guide.description,
				mimeType: guide.mimeType,
			},
			async (uri) => {
				logger.debug({ uri: uri.href }, "Reading resource");

				try {
					return {
						contents: [
							{
								uri: uri.href,
								mimeType: guide.mimeType,
								text: guide.content,
							},
						],
					};
				} catch (error) {
					logger.error({ uri: uri.href, error }, "Failed to read resource");
					throw new Error(
						`Failed to read resource ${uri.href}: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			},
		);
	}

	logger.info(
		{ resourceCount: GUIDE_RESOURCES.length },
		"Resources registered successfully",
	);
}
