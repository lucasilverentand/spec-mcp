#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
	RequirementSchema,
	ComponentSchema,
	PlanSchema,
	ConstitutionSchema,
	DecisionSchema,
} from "@spec-mcp/schemas";
import { ErrorCode, McpError } from "./utils/error-codes.js";
import { logger } from "./utils/logger.js";
import { VERSION } from "./utils/version.js";
import {
	createDraftTool,
	submitDraftAnswerTool,
	createRequirementTool,
	createComponentTool,
	createPlanTool,
	createConstitutionTool,
	createDecisionTool,
} from "./tools/index.js";

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
 * Register MCP tools
 */
function registerTools(server: McpServer) {
	// Draft creation workflow tools
	server.tool(
		"create_draft",
		"Start a new draft creation flow for a specification entity",
		{
			type: z
				.enum(["requirement", "component", "plan", "constitution", "decision"])
				.describe(
					"Type of entity to create (requirement, component, plan, constitution, decision)",
				),
			name: z.string().min(1).describe("Name of the entity being created"),
		},
		async ({ type, name }) => {
			const result = await createDraftTool(type, name);
			return {
				content: [
					{
						type: "text" as const,
						text: result.success
							? `${result.guidance}\n\n**First Question:**\n${result.first_question}`
							: (result.error || "Unknown error"),
					},
				],
				isError: !result.success,
			};
		},
	);

	server.tool(
		"submit_draft_answer",
		"Submit an answer to the current question in a draft",
		{
			draft_id: z
				.string()
				.regex(/^draft-\d{3}$/)
				.describe("The draft ID (format: draft-XXX)"),
			answer: z.string().min(1).describe("Your answer to the current question"),
		},
		async ({ draft_id, answer }) => {
			const result = await submitDraftAnswerTool(draft_id, answer);
			if (!result.success) {
				return {
					content: [{ type: "text" as const, text: result.error || "Unknown error" }],
					isError: true,
				};
			}

			let text = result.guidance || "";
			if (!result.completed && result.next_question) {
				text += `\n\n**Next Question:**\n${result.next_question}`;
			}

			return {
				content: [{ type: "text" as const, text }],
			};
		},
	);

	server.tool(
		"create_requirement",
		"Create a requirement from a completed draft. The draft_id serves as proof that all questions were answered through the Q&A flow.",
		{
			draft_id: z
				.string()
				.regex(/^draft-\d{3}$/)
				.describe(
					"The draft ID (must be a completed requirement draft, format: draft-XXX). This proves all questions were answered.",
				),
			data: RequirementSchema.partial()
				.optional()
				.describe(
					"Optional: Full requirement specification data. If provided, will be validated and merged with draft data.",
				),
		},
		async ({ draft_id, data }) => {
			const result = await createRequirementTool(draft_id, data as any);
			return {
				content: [
					{
						type: "text" as const,
						text: result.success
							? `${result.message}\n\nEntity ID: ${result.entity_id}`
							: (result.error || "Unknown error"),
					},
				],
				isError: !result.success,
			};
		},
	);

	server.tool(
		"create_component",
		"Create a component from a completed draft. The draft_id serves as proof that all questions were answered through the Q&A flow.",
		{
			draft_id: z
				.string()
				.regex(/^draft-\d{3}$/)
				.describe(
					"The draft ID (must be a completed component draft, format: draft-XXX). This proves all questions were answered.",
				),
			data: ComponentSchema.partial()
				.optional()
				.describe(
					"Optional: Full component specification data. If provided, will be validated and merged with draft data.",
				),
		},
		async ({ draft_id, data }) => {
			const result = await createComponentTool(draft_id, data as any);
			return {
				content: [
					{
						type: "text" as const,
						text: result.success
							? `${result.message}\n\nEntity ID: ${result.entity_id}`
							: (result.error || "Unknown error"),
					},
				],
				isError: !result.success,
			};
		},
	);

	server.tool(
		"create_plan",
		"Create a plan from a completed draft. The draft_id serves as proof that all questions were answered through the Q&A flow.",
		{
			draft_id: z
				.string()
				.regex(/^draft-\d{3}$/)
				.describe(
					"The draft ID (must be a completed plan draft, format: draft-XXX). This proves all questions were answered.",
				),
			data: PlanSchema.partial()
				.optional()
				.describe(
					"Optional: Full plan specification data. If provided, will be validated and merged with draft data.",
				),
		},
		async ({ draft_id, data }) => {
			const result = await createPlanTool(draft_id, data as any);
			return {
				content: [
					{
						type: "text" as const,
						text: result.success
							? `${result.message}\n\nEntity ID: ${result.entity_id}`
							: (result.error || "Unknown error"),
					},
				],
				isError: !result.success,
			};
		},
	);

	server.tool(
		"create_constitution",
		"Create a constitution from a completed draft. The draft_id serves as proof that all questions were answered through the Q&A flow.",
		{
			draft_id: z
				.string()
				.regex(/^draft-\d{3}$/)
				.describe(
					"The draft ID (must be a completed constitution draft, format: draft-XXX). This proves all questions were answered.",
				),
			data: ConstitutionSchema.partial()
				.optional()
				.describe(
					"Optional: Full constitution specification data. If provided, will be validated and merged with draft data.",
				),
		},
		async ({ draft_id, data }) => {
			const result = await createConstitutionTool(draft_id, data as any);
			return {
				content: [
					{
						type: "text" as const,
						text: result.success
							? `${result.message}\n\nEntity ID: ${result.entity_id}`
							: (result.error || "Unknown error"),
					},
				],
				isError: !result.success,
			};
		},
	);

	server.tool(
		"create_decision",
		"Create a decision from a completed draft. The draft_id serves as proof that all questions were answered through the Q&A flow.",
		{
			draft_id: z
				.string()
				.regex(/^draft-\d{3}$/)
				.describe(
					"The draft ID (must be a completed decision draft, format: draft-XXX). This proves all questions were answered.",
				),
			data: DecisionSchema.partial()
				.optional()
				.describe(
					"Optional: Full decision specification data. If provided, will be validated and merged with draft data.",
				),
		},
		async ({ draft_id, data }) => {
			const result = await createDecisionTool(draft_id, data as any);
			return {
				content: [
					{
						type: "text" as const,
						text: result.success
							? `${result.message}\n\nEntity ID: ${result.entity_id}`
							: (result.error || "Unknown error"),
					},
				],
				isError: !result.success,
			};
		},
	);

	logger.info("Tools registered successfully");
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

		// Register tools
		registerTools(server);

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
