#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DraftStore, SpecManager } from "@spec-mcp/core";
import { z } from "zod";
import {
	answerQuestion,
	continueDraft,
	finalizeEntity,
	listDrafts,
	startDraft,
} from "./tools/index.js";
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
 * Register MCP tools for draft workflow (New unified API - 5 tools)
 */
function registerTools(
	server: McpServer,
	draftStore: DraftStore,
	specManager: SpecManager,
) {
	// Use a simple draft ID (in a real implementation, this could be generated per request)
	const draftId = "default";

	// 1. start_draft - Create a new draft
	server.tool(
		"start_draft",
		"Start a new draft creation workflow. Returns draft ID and first question.",
		{
			type: z
				.enum([
					"plan",
					"component",
					"decision",
					"business-requirement",
					"technical-requirement",
					"constitution",
				])
				.describe("Type of spec to create"),
		},
		async (args) => {
			try {
				const result = await startDraft(args, draftStore, draftId);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error({ error, tool: "start_draft" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 2. answer_question - Answer any question by ID
	server.tool(
		"answer_question",
		"Answer a question in the draft by question ID. Works for main, collection, and array item questions.",
		{
			draftId: z.string().describe("The draft session ID"),
			questionId: z.string().describe("The unique question ID to answer"),
			answer: z
				.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
				.describe(
					"Answer to the question. Can be string, number, boolean, or array of strings.",
				),
		},
		async (args) => {
			try {
				const result = await answerQuestion(args, draftStore);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error(
					{ error, tool: "answer_question" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 3. finalize_entity - Finalize any entity (main or array item)
	server.tool(
		"finalize_entity",
		"Finalize an entity with LLM-generated data. Use entityId 'main' or omit for main entity, 'fieldName[index]' for array items. Auto-saves when finalizing main entity.",
		{
			draftId: z.string().describe("The draft session ID"),
			entityId: z
				.string()
				.optional()
				.describe(
					"Entity ID: omit/'main' for main entity, 'fieldName[index]' for array items (e.g., 'business_value[0]')",
				),
			data: z
				.record(z.any())
				.describe(
					"Complete JSON object for the entity/item, matching the schema",
				),
		},
		async (args) => {
			try {
				const result = await finalizeEntity(args, draftStore, specManager);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error(
					{ error, tool: "finalize_entity" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 4. list_drafts - List all active drafts
	server.tool(
		"list_drafts",
		"List all active draft sessions with their status and progress.",
		async () => {
			try {
				const result = await listDrafts({}, draftStore);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error({ error, tool: "list_drafts" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 5. continue_draft - Get intelligent next-step instructions
	server.tool(
		"continue_draft",
		"Get continuation instructions for a draft. Intelligently shows next question or finalization context.",
		{
			draftId: z.string().describe("The draft session ID"),
		},
		async (args) => {
			try {
				const result = await continueDraft(args, draftStore);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error(
					{ error, tool: "continue_draft" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	logger.info("Registered 5 draft workflow tools (unified API)");
}

/**
 * Main entry point for the Spec MCP Server
 */
async function main() {
	// Set up shutdown handler
	const shutdownHandler = new ShutdownHandler();

	try {
		// Initialize the MCP server
		const server = new McpServer({
			name: "spec-mcp",
			version: VERSION,
		});

		// Initialize core managers
		const draftStore = new DraftStore();
		const specManager = new SpecManager("./specs");

		// Ensure spec folders exist
		await specManager.ensureFolders();

		// Register tools
		registerTools(server, draftStore, specManager);

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
