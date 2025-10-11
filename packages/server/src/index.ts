#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DraftStore, SpecManager } from "@spec-mcp/core";
import { z } from "zod";
import {
	addTask,
	addTaskTool,
	answerQuestion,
	continueDraft,
	deleteDraft,
	deleteSpec,
	deleteSpecTool,
	deleteTask,
	deleteTaskTool,
	finalizeEntity,
	finishTask,
	finishTaskTool,
	getSpec,
	getSpecTool,
	listDrafts,
	skipAnswer,
	startDraft,
	startTask,
	startTaskTool,
	validateEntityTool,
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
 * Register MCP tools for draft workflow (New unified API - 7 tools)
 */
function registerTools(
	server: McpServer,
	draftStore: DraftStore,
	specManager: SpecManager,
) {
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
				const result = await startDraft(args, draftStore);
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
		"Finalize an entity with LLM-generated data. For main entity: provide only non-array fields (arrays auto-merged). For array items: provide complete item data. Auto-saves when finalizing main entity.",
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
					"JSON object for entity/item. Main entity: ONLY non-array fields (arrays auto-merged from finalized items). Array items: complete item data.",
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

	// 5. delete_draft - Delete a draft session
	server.tool(
		"delete_draft",
		"Delete a draft session. This will permanently remove the draft from active sessions.",
		{
			draftId: z.string().describe("The draft ID to delete"),
		},
		async (args) => {
			try {
				const result = await deleteDraft(args, draftStore);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error({ error, tool: "delete_draft" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 6. skip_answer - Skip an optional question
	server.tool(
		"skip_answer",
		"Skip an optional question in the draft. Only works for questions marked as optional.",
		{
			draftId: z.string().describe("The draft session ID"),
			questionId: z.string().describe("The unique question ID to skip"),
		},
		async (args) => {
			try {
				const result = await skipAnswer(args, draftStore);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error({ error, tool: "skip_answer" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 7. continue_draft - Get intelligent next-step instructions
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

	// 8. validate_entity - Validate an entity by ID
	server.tool(
		"validate_entity",
		"Validate an entity by its ID. Accepts formats: typ-123, typ-123-slug-here, or typ-123-slug-here.yml. Returns validation status and entity details.",
		{
			id: z
				.string()
				.describe(
					"Entity identifier. Accepts: typ-123, typ-123-slug-here, or typ-123-slug-here.yml",
				),
		},
		async (args) => {
			try {
				const result = await validateEntityTool(args, specManager);
				return {
					content: [{ type: "text", text: result }],
				};
			} catch (error) {
				logger.error(
					{ error, tool: "validate_entity" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 9. delete_spec - Delete a spec entity
	server.tool(
		deleteSpecTool.name,
		deleteSpecTool.description,
		{
			id: z.string().describe(deleteSpecTool.inputSchema.properties.id.description),
		},
		async (args) => {
			try {
				return await deleteSpec(specManager, args.id);
			} catch (error) {
				logger.error({ error, tool: "delete_spec" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 10. get_spec - Get a spec entity
	server.tool(
		getSpecTool.name,
		getSpecTool.description,
		{
			id: z.string().describe(getSpecTool.inputSchema.properties.id.description),
			format: z
				.enum(["yaml", "markdown"])
				.optional()
				.describe(getSpecTool.inputSchema.properties.format.description),
		},
		async (args) => {
			try {
				return await getSpec(
					specManager,
					args.id,
					args.format as "yaml" | "markdown" | undefined,
				);
			} catch (error) {
				logger.error({ error, tool: "get_spec" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 11. add_task - Add a task to a plan
	server.tool(
		addTaskTool.name,
		addTaskTool.description,
		{
			plan_id: z
				.string()
				.describe(addTaskTool.inputSchema.properties.plan_id.description),
			task: z.string().describe(addTaskTool.inputSchema.properties.task.description),
			priority: z
				.enum(["critical", "high", "medium", "low", "nice-to-have"])
				.optional()
				.describe(addTaskTool.inputSchema.properties.priority?.description || ""),
			depends_on: z
				.array(z.string())
				.optional()
				.describe(addTaskTool.inputSchema.properties.depends_on?.description || ""),
			considerations: z
				.array(z.string())
				.optional()
				.describe(
					addTaskTool.inputSchema.properties.considerations?.description || "",
				),
		},
		async (args) => {
			try {
				const options: {
					priority?: "critical" | "high" | "medium" | "low" | "nice-to-have";
					depends_on?: string[];
					considerations?: string[];
				} = {};

				if (args.priority) options.priority = args.priority;
				if (args.depends_on) options.depends_on = args.depends_on;
				if (args.considerations) options.considerations = args.considerations;

				return await addTask(specManager, args.plan_id, args.task, options);
			} catch (error) {
				logger.error({ error, tool: "add_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 12. delete_task - Delete a task from a plan
	server.tool(
		deleteTaskTool.name,
		deleteTaskTool.description,
		{
			plan_id: z
				.string()
				.describe(deleteTaskTool.inputSchema.properties.plan_id.description),
			task_id: z
				.string()
				.describe(deleteTaskTool.inputSchema.properties.task_id.description),
		},
		async (args) => {
			try {
				return await deleteTask(specManager, args.plan_id, args.task_id);
			} catch (error) {
				logger.error({ error, tool: "delete_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 13. start_task - Mark a task as started
	server.tool(
		startTaskTool.name,
		startTaskTool.description,
		{
			plan_id: z
				.string()
				.describe(startTaskTool.inputSchema.properties.plan_id.description),
			task_id: z
				.string()
				.describe(startTaskTool.inputSchema.properties.task_id.description),
		},
		async (args) => {
			try {
				return await startTask(specManager, args.plan_id, args.task_id);
			} catch (error) {
				logger.error({ error, tool: "start_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 14. finish_task - Mark a task as completed
	server.tool(
		finishTaskTool.name,
		finishTaskTool.description,
		{
			plan_id: z
				.string()
				.describe(finishTaskTool.inputSchema.properties.plan_id.description),
			task_id: z
				.string()
				.describe(finishTaskTool.inputSchema.properties.task_id.description),
		},
		async (args) => {
			try {
				return await finishTask(specManager, args.plan_id, args.task_id);
			} catch (error) {
				logger.error({ error, tool: "finish_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	logger.info("Registered 14 tools (7 draft workflow + 1 validation + 6 manipulation)");
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
		const specManager = new SpecManager("./specs");
		const draftStore = new DraftStore(specManager);

		// Ensure spec folders exist
		await specManager.ensureFolders();

		// Load existing drafts from disk
		await draftStore.loadAll();

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
