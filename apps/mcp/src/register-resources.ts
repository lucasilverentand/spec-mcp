/**
 * Resource registration for guide documents and JSON schemas
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GUIDE_RESOURCES } from "./resources/guides/index.js";
import { JSON_SCHEMA_RESOURCES } from "./resources/json-schemas.js";
import { logger } from "./utils/logger.js";

/**
 * Register all resources with the MCP server
 */
export function registerResources(server: McpServer): void {
	logger.info("Registering resources");

	// Register guide resources
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

	// Register JSON schema resources
	for (const schema of JSON_SCHEMA_RESOURCES) {
		server.resource(
			schema.name,
			schema.uri,
			{
				description: schema.description,
				mimeType: "application/schema+json",
			},
			async () => {
				return {
					contents: [
						{
							uri: schema.uri,
							mimeType: "application/schema+json",
							text: JSON.stringify(schema.schema, null, 2),
						},
					],
				};
			},
		);

		logger.debug({ uri: schema.uri, name: schema.name }, "Registered schema");
	}

	logger.info(
		{
			guides: GUIDE_RESOURCES.length,
			schemas: JSON_SCHEMA_RESOURCES.length,
			total: GUIDE_RESOURCES.length + JSON_SCHEMA_RESOURCES.length,
		},
		"Resources registered successfully",
	);
}
