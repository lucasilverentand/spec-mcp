#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DraftStore, SpecManager } from "@spec-mcp/core";
import { ReferenceSchema } from "@spec-mcp/schemas";
import { z } from "zod";
import { registerArrayManipulationTools } from "./register-array-tools.js";
import {
	addReference,
	addReferenceTool,
	addTask,
	addTaskTool,
	answerQuestion,
	continueDraft,
	deleteEntity,
	deleteTool,
	finalizeEntity,
	finishPlan,
	finishPlanTool,
	finishTaskGit,
	finishTaskGitTool,
	getSpec,
	getSpecTool,
	getWorktreeContext,
	getWorktreeContextTool,
	listDrafts,
	skipAnswer,
	startDraft,
	startPlan,
	startPlanTool,
	startTaskGit,
	startTaskGitTool,
	switchToMain,
	switchToMainTool,
	switchWorktree,
	switchWorktreeTool,
	updateBusinessRequirement,
	updateBusinessRequirementTool,
	updateComponent,
	updateComponentTool,
	updateDecision,
	updateDecisionTool,
	updatePlan,
	updatePlanTool,
	updateTechnicalRequirement,
	updateTechnicalRequirementTool,
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
 * Register MCP tools for draft workflow (New unified API - 6 draft tools + core tools)
 */
function registerTools(
	server: McpServer,
	draftStore: DraftStore,
	specManager: SpecManager,
	projectRoot: string,
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
					"milestone",
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

	// 5. skip_answer - Skip an optional question
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

	// 6. continue_draft - Get intelligent next-step instructions
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

	// 7. validate_entity - Validate an entity by ID
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

	// 8. delete - Delete any entity (specs, nested items, or drafts)
	server.tool(
		deleteTool.name,
		deleteTool.description,
		{
			id: z.string().describe(deleteTool.inputSchema.properties.id.description),
		},
		async (args) => {
			try {
				return await deleteEntity(specManager, args.id, draftStore);
			} catch (error) {
				logger.error({ error, tool: "delete" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 9. get_spec - Get a spec entity
	server.tool(
		getSpecTool.name,
		getSpecTool.description,
		{
			id: z
				.string()
				.describe(getSpecTool.inputSchema.properties.id.description),
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

	// 10. add_task - Add a task to a plan
	server.tool(
		addTaskTool.name,
		addTaskTool.description,
		{
			plan_id: z
				.string()
				.describe(addTaskTool.inputSchema.properties.plan_id.description),
			task: z
				.string()
				.describe(addTaskTool.inputSchema.properties.task.description),
			priority: z
				.enum(["critical", "high", "medium", "low", "nice-to-have"])
				.optional()
				.describe(
					addTaskTool.inputSchema.properties.priority?.description || "",
				),
			depends_on: z
				.array(z.string())
				.optional()
				.describe(
					addTaskTool.inputSchema.properties.depends_on?.description || "",
				),
			considerations: z
				.array(z.string())
				.optional()
				.describe(
					addTaskTool.inputSchema.properties.considerations?.description || "",
				),
			supersede_id: z
				.string()
				.optional()
				.describe(
					addTaskTool.inputSchema.properties.supersede_id?.description || "",
				),
		},
		async (args) => {
			try {
				const options: {
					priority?: "critical" | "high" | "medium" | "low" | "nice-to-have";
					depends_on?: string[];
					considerations?: string[];
					supersede_id?: string;
				} = {};

				if (args.priority) options.priority = args.priority;
				if (args.depends_on) options.depends_on = args.depends_on;
				if (args.considerations) options.considerations = args.considerations;
				if (args.supersede_id) options.supersede_id = args.supersede_id;

				return await addTask(specManager, args.plan_id, args.task, options);
			} catch (error) {
				logger.error({ error, tool: "add_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 11. start_plan - Create worktree and branch for a plan
	server.tool(
		startPlanTool.name,
		startPlanTool.description,
		{
			plan_id: z
				.string()
				.describe(startPlanTool.inputSchema.properties.plan_id.description),
		},
		async (args) => {
			try {
				return await startPlan(specManager, args.plan_id, projectRoot);
			} catch (error) {
				logger.error({ error, tool: "start_plan" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 12. start_task - Mark a task as started
	server.tool(
		startTaskGitTool.name,
		startTaskGitTool.description,
		{
			plan_id: z
				.string()
				.describe(startTaskGitTool.inputSchema.properties.plan_id.description),
			task_id: z
				.string()
				.describe(startTaskGitTool.inputSchema.properties.task_id.description),
		},
		async (args) => {
			try {
				return await startTaskGit(specManager, args.plan_id, args.task_id);
			} catch (error) {
				logger.error({ error, tool: "start_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 13. finish_task - Commit task and mark as completed
	server.tool(
		finishTaskGitTool.name,
		finishTaskGitTool.description,
		{
			plan_id: z
				.string()
				.describe(finishTaskGitTool.inputSchema.properties.plan_id.description),
			task_id: z
				.string()
				.describe(finishTaskGitTool.inputSchema.properties.task_id.description),
			summary: z
				.string()
				.describe(finishTaskGitTool.inputSchema.properties.summary.description),
		},
		async (args) => {
			try {
				return await finishTaskGit(
					specManager,
					args.plan_id,
					args.task_id,
					args.summary,
					projectRoot,
				);
			} catch (error) {
				logger.error({ error, tool: "finish_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 14. finish_plan - Push branch and create PR
	server.tool(
		finishPlanTool.name,
		finishPlanTool.description,
		{
			plan_id: z
				.string()
				.describe(finishPlanTool.inputSchema.properties.plan_id.description),
		},
		async (args) => {
			try {
				return await finishPlan(specManager, args.plan_id, projectRoot);
			} catch (error) {
				logger.error({ error, tool: "finish_plan" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 15. get_worktree_context - Get current worktree
	server.tool(
		getWorktreeContextTool.name,
		getWorktreeContextTool.description,
		async () => {
			try {
				return await getWorktreeContext(specManager);
			} catch (error) {
				logger.error(
					{ error, tool: "get_worktree_context" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 16. switch_worktree - Switch to a plan worktree
	server.tool(
		switchWorktreeTool.name,
		switchWorktreeTool.description,
		{
			plan_id: z
				.string()
				.describe(
					switchWorktreeTool.inputSchema.properties.plan_id.description,
				),
		},
		async (args) => {
			try {
				return await switchWorktree(specManager, args.plan_id, projectRoot);
			} catch (error) {
				logger.error(
					{ error, tool: "switch_worktree" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 17. switch_to_main - Switch back to main
	server.tool(switchToMainTool.name, switchToMainTool.description, async () => {
		try {
			return await switchToMain(specManager);
		} catch (error) {
			logger.error({ error, tool: "switch_to_main" }, "Tool execution failed");
			throw error;
		}
	});

	// 18. add_reference - Unified reference tool
	server.tool(
		addReferenceTool.name,
		addReferenceTool.description,
		{
			spec_id: z
				.string()
				.describe(addReferenceTool.inputSchema.properties.spec_id.description),
			reference: ReferenceSchema.describe(
				"Reference object with type-specific fields",
			),
			is_technical_dependency: z
				.boolean()
				.optional()
				.describe(
					addReferenceTool.inputSchema.properties.is_technical_dependency
						?.description || "",
				),
		},
		async (args) => {
			try {
				return await addReference(
					specManager,
					args.spec_id,
					args.reference,
					args.is_technical_dependency,
				);
			} catch (error) {
				logger.error({ error, tool: "add_reference" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 19. update_plan
	server.tool(
		updatePlanTool.name,
		updatePlanTool.description,
		{
			plan_id: z
				.string()
				.describe(updatePlanTool.inputSchema.properties.plan_id.description),
			title: z
				.string()
				.optional()
				.describe(
					updatePlanTool.inputSchema.properties.title?.description || "",
				),
			description: z
				.string()
				.optional()
				.describe(
					updatePlanTool.inputSchema.properties.description?.description || "",
				),
			scope: z
				.object({
					in_scope: z.array(z.string()),
					out_of_scope: z.array(z.string()),
				})
				.optional()
				.describe(
					updatePlanTool.inputSchema.properties.scope?.description || "",
				),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.scope !== undefined) updates.scope = args.scope;
				return await updatePlan(specManager, args.plan_id, updates);
			} catch (error) {
				logger.error({ error, tool: "update_plan" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// 20. update_business_requirement
	server.tool(
		updateBusinessRequirementTool.name,
		updateBusinessRequirementTool.description,
		{
			brd_id: z
				.string()
				.describe(
					updateBusinessRequirementTool.inputSchema.properties.brd_id
						.description,
				),
			title: z
				.string()
				.optional()
				.describe(
					updateBusinessRequirementTool.inputSchema.properties.title
						?.description || "",
				),
			description: z
				.string()
				.optional()
				.describe(
					updateBusinessRequirementTool.inputSchema.properties.description
						?.description || "",
				),
			business_goals: z
				.array(z.string())
				.optional()
				.describe("New business goals (if updating)"),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.business_goals !== undefined)
					updates.business_goals = args.business_goals;
				return await updateBusinessRequirement(
					specManager,
					args.brd_id,
					updates,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "update_business_requirement" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 21. update_technical_requirement
	server.tool(
		updateTechnicalRequirementTool.name,
		updateTechnicalRequirementTool.description,
		{
			requirement_id: z
				.string()
				.describe(
					updateTechnicalRequirementTool.inputSchema.properties.prd_id
						.description,
				),
			title: z
				.string()
				.optional()
				.describe(
					updateTechnicalRequirementTool.inputSchema.properties.title
						?.description || "",
				),
			description: z
				.string()
				.optional()
				.describe(
					updateTechnicalRequirementTool.inputSchema.properties.description
						?.description || "",
				),
			priority: z
				.enum(["critical", "high", "medium", "low"])
				.optional()
				.describe("New priority level (if updating)"),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.priority !== undefined) updates.priority = args.priority;
				return await updateTechnicalRequirement(
					specManager,
					args.requirement_id,
					updates,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "update_technical_requirement" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 22. update_decision
	server.tool(
		updateDecisionTool.name,
		updateDecisionTool.description,
		{
			decision_id: z
				.string()
				.describe(
					updateDecisionTool.inputSchema.properties.decision_id.description,
				),
			title: z
				.string()
				.optional()
				.describe(
					updateDecisionTool.inputSchema.properties.title?.description || "",
				),
			context: z
				.string()
				.optional()
				.describe(
					updateDecisionTool.inputSchema.properties.context?.description || "",
				),
			decision: z
				.string()
				.optional()
				.describe(
					updateDecisionTool.inputSchema.properties.decision?.description || "",
				),
			status: z
				.enum(["proposed", "accepted", "rejected", "deprecated"])
				.optional()
				.describe(
					updateDecisionTool.inputSchema.properties.decision_status
						?.description || "",
				),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.context !== undefined) updates.context = args.context;
				if (args.decision !== undefined) updates.decision = args.decision;
				if (args.status !== undefined) updates.status = args.status;
				return await updateDecision(specManager, args.decision_id, updates);
			} catch (error) {
				logger.error(
					{ error, tool: "update_decision" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// 23. update_component
	server.tool(
		updateComponentTool.name,
		updateComponentTool.description,
		{
			component_id: z
				.string()
				.describe(
					updateComponentTool.inputSchema.properties.component_id.description,
				),
			title: z
				.string()
				.optional()
				.describe(
					updateComponentTool.inputSchema.properties.title?.description || "",
				),
			description: z
				.string()
				.optional()
				.describe(
					updateComponentTool.inputSchema.properties.description?.description ||
						"",
				),
			type: z
				.enum(["service", "library", "application", "database", "other"])
				.optional()
				.describe(
					updateComponentTool.inputSchema.properties.component_type
						?.description || "",
				),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.type !== undefined) updates.type = args.type;
				return await updateComponent(specManager, args.component_id, updates);
			} catch (error) {
				logger.error(
					{ error, tool: "update_component" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	logger.info(
		"Registered 23 core tools (6 draft workflow + 1 validation + 1 delete + 1 get_spec + 8 git workflow + 1 unified reference + 5 update tools)",
	);
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
		const projectRoot = process.cwd();
		const specManager = new SpecManager("./specs");
		const draftStore = new DraftStore(specManager);

		// Ensure spec folders exist
		await specManager.ensureFolders();

		// Load existing drafts from disk
		await draftStore.loadAll();

		// Register tools
		registerTools(server, draftStore, specManager, projectRoot);
		registerArrayManipulationTools(server, specManager);

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
