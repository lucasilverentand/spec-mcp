/**
 * Resource registration for guide documents
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GUIDE_RESOURCES } from "./resources/guides.js";
import { logger } from "./utils/logger.js";

/**
 * Register all guide resources with the MCP server
 */
export function registerResources(server: McpServer): void {
	logger.info("Registering guide resources");

	// Register each guide as a static resource
	for (const guide of GUIDE_RESOURCES) {
		server.resource(
			guide.name,
			guide.uri,
			{
				description: guide.description,
				mimeType: guide.mimeType,
			},
			async () => {
				return {
					contents: [
						{
							uri: guide.uri,
							mimeType: guide.mimeType,
							text: guide.content,
						},
					],
				};
			},
		);

		logger.debug({ uri: guide.uri, name: guide.name }, "Registered guide");
	}

	logger.info(
		{ count: GUIDE_RESOURCES.length },
		"Guide resources registered successfully",
	);
}
