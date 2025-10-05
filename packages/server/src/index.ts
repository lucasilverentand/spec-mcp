#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SpecOperations } from "@spec-mcp/core";
import { loadConfig } from "./config/index.js";
import { registerPrompts } from "./prompts/index.js";
import { registerResources } from "./resources/index.js";
import { registerAllTools } from "./tools/index.js";
import { ErrorCode, McpError } from "./utils/error-codes.js";
import { logger } from "./utils/logger.js";
import { VERSION } from "./utils/version.js";

/**
 * Graceful shutdown handler
 */
class ShutdownHandler {
	private shuttingDown = false;
	private readonly cleanupHandlers: Array<() => Promise<void>> = [];

	constructor() {
		// Handle shutdown signals
		process.on("SIGTERM", () => this.shutdown("SIGTERM"));
		process.on("SIGINT", () => this.shutdown("SIGINT"));

		// Handle uncaught errors
		process.on("uncaughtException", (error) => {
			logger.fatal({ error }, "Uncaught exception");
			this.shutdown("uncaughtException");
		});

		process.on("unhandledRejection", (reason) => {
			logger.fatal({ reason }, "Unhandled rejection");
			this.shutdown("unhandledRejection");
		});
	}

	addCleanupHandler(handler: () => Promise<void>): void {
		this.cleanupHandlers.push(handler);
	}

	private async shutdown(signal: string): Promise<void> {
		if (this.shuttingDown) {
			return;
		}

		this.shuttingDown = true;
		logger.info({ signal }, "Shutting down gracefully");

		// Run all cleanup handlers
		const timeout = setTimeout(() => {
			logger.error("Cleanup timeout, forcing exit");
			process.exit(1);
		}, 10000); // 10 second timeout

		try {
			await Promise.all(
				this.cleanupHandlers.map((handler) =>
					handler().catch((error) => {
						logger.error({ error }, "Cleanup handler failed");
					}),
				),
			);
			clearTimeout(timeout);
			logger.info("Shutdown complete");
			process.exit(0);
		} catch (error) {
			clearTimeout(timeout);
			logger.error({ error }, "Shutdown failed");
			process.exit(1);
		}
	}
}

/**
 * Connection manager with retry logic
 */
class ConnectionManager {
	private connected = false;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private readonly reconnectDelayMs = 1000;

	constructor(
		private readonly server: McpServer,
		private readonly transport: StdioServerTransport,
	) {}

	async connect(): Promise<void> {
		while (
			this.reconnectAttempts < this.maxReconnectAttempts &&
			!this.connected
		) {
			try {
				logger.info(
					{ attempt: this.reconnectAttempts + 1 },
					"Attempting to connect",
				);
				await this.server.connect(this.transport);
				this.connected = true;
				this.reconnectAttempts = 0;
				logger.info("Connected successfully");
				return;
			} catch (error) {
				this.reconnectAttempts++;
				logger.error(
					{
						error,
						attempt: this.reconnectAttempts,
						maxAttempts: this.maxReconnectAttempts,
					},
					"Connection failed",
				);

				if (this.reconnectAttempts >= this.maxReconnectAttempts) {
					throw new McpError(
						ErrorCode.CONNECTION_LOST,
						"Max reconnection attempts reached",
						{ attempts: this.reconnectAttempts },
						error instanceof Error ? error : undefined,
					);
				}

				// Exponential backoff
				const delay = this.reconnectDelayMs * 2 ** (this.reconnectAttempts - 1);
				logger.info({ delay }, "Retrying connection");
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	async disconnect(): Promise<void> {
		if (this.connected) {
			logger.info("Disconnecting");
			// MCP SDK doesn't have explicit disconnect, but we can mark as disconnected
			this.connected = false;
		}
	}

	isConnected(): boolean {
		return this.connected;
	}
}

/**
 * Main entry point for the Spec MCP Server
 */
async function main() {
	// Set up shutdown handler
	const shutdownHandler = new ShutdownHandler();

	try {
		// Load and validate configuration
		const config = await loadConfig();

		// Initialize the MCP server
		const server = new McpServer({
			name: "spec-mcp",
			version: VERSION,
			capabilities: {
				resources: {},
				prompts: {},
			},
		});

		// Initialize spec operations
		const operations = new SpecOperations({
			specsPath: config.specsPath,
		});

		// Register all tools, resources, and prompts
		registerAllTools(server, operations, config);
		registerResources(server, config);
		registerPrompts(server, config);

		// Set up connection with retry logic
		const transport = new StdioServerTransport();
		const connectionManager = new ConnectionManager(server, transport);

		// Add cleanup handlers
		shutdownHandler.addCleanupHandler(async () => {
			await connectionManager.disconnect();
		});

		// Connect with retry
		await connectionManager.connect();

		logger.info(
			{
				specsPath: config.specsPath,
				version: VERSION,
			},
			"Spec MCP Server running",
		);
	} catch (error) {
		logger.fatal({ error }, "Failed to start server");
		throw error;
	}
}

// Run the server
main().catch((error) => {
	logger.fatal({ error }, "Fatal error");
	process.exit(1);
});
