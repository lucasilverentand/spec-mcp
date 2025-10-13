/**
 * Core tool registration with conditional mode support
 * This file contains the registration logic for all core MCP tools
 */

import type { DraftStore, SpecManager } from "@spec-mcp/core";
import { ReferenceSchema } from "@spec-mcp/schemas";
import { z } from "zod";
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
	finishTaskGit,
	finishTaskGitTool,
	getSpec,
	getSpecTool,
	listDrafts,
	querySpecs,
	querySpecsTool,
	skipAnswer,
	startDraft,
	startTaskGit,
	startTaskGitTool,
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
import type { ConditionalToolRegistrar } from "./utils/conditional-tool-registration.js";
import { logger } from "./utils/logger.js";

/**
 * Register all core MCP tools with mode-based filtering
 */
export function registerCoreTools(
	registrar: ConditionalToolRegistrar,
	draftStore: DraftStore,
	specManager: SpecManager,
	_projectRoot: string,
): void {
	// ========== DRAFT WORKFLOW TOOLS (6) ==========

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
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

	registrar.registerTool(
		"skip_answer",
		"Skip an optional question in the draft. Only works for questions marked as optional.",
		{
			draftId: z.string().describe("The draft session ID"),
			questionId: z.string().describe("The unique question ID to skip"),
		},
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
		"continue_draft",
		"Get continuation instructions for a draft. Intelligently shows next question or finalization context.",
		{
			draftId: z.string().describe("The draft session ID"),
		},
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	// ========== SPEC MANAGEMENT TOOLS (3) ==========

	registrar.registerTool(
		"validate_entity",
		"Validate an entity by its ID. Accepts formats: typ-123, typ-123-slug-here, or typ-123-slug-here.yml. Returns validation status and entity details.",
		{
			id: z
				.string()
				.describe(
					"Entity identifier. Accepts: typ-123, typ-123-slug-here, or typ-123-slug-here.yml",
				),
		},
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
		deleteTool.name,
		deleteTool.description,
		{
			id: z.string().describe(deleteTool.inputSchema.properties.id.description),
		},
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
			try {
				return await deleteEntity(specManager, args.id, draftStore);
			} catch (error) {
				logger.error({ error, tool: "delete" }, "Tool execution failed");
				throw error;
			}
		},
	);

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	// ========== TASK MANAGEMENT (1) ==========

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	// ========== TASK WORKFLOW TOOLS (2) ==========

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
			try {
				return await startTaskGit(specManager, args.plan_id, args.task_id);
			} catch (error) {
				logger.error({ error, tool: "start_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
			try {
				return await finishTaskGit(
					specManager,
					args.plan_id,
					args.task_id,
					args.summary,
				);
			} catch (error) {
				logger.error({ error, tool: "finish_task" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// ========== REFERENCE MANAGEMENT (1) ==========

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	// ========== UPDATE TOOLS (5) ==========

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	registrar.registerTool(
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
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
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

	// ========== QUERY TOOLS (1) ==========

	registrar.registerTool(
		querySpecsTool.name,
		querySpecsTool.description,
		{
			draft: z.boolean().optional(),
			id: z.union([z.string(), z.array(z.string())]).optional(),
			objects: z
				.object({
					specTypes: z
						.array(
							z.enum([
								"business-requirement",
								"technical-requirement",
								"plan",
								"component",
								"constitution",
								"decision",
								"milestone",
							]),
						)
						.optional(),
					itemTypes: z
						.array(
							z.enum([
								"task",
								"test-case",
								"criteria",
								"flow",
								"api-contract",
								"data-model",
								"user-story",
							]),
						)
						.optional(),
				})
				.optional(),
			completed: z.boolean().optional(),
			verified: z.boolean().optional(),
			priority: z
				.array(z.enum(["critical", "high", "medium", "low", "nice-to-have"]))
				.optional(),
			milestone: z.string().optional(),
			status: z
				.array(z.enum(["not-started", "in-progress", "completed", "verified"]))
				.optional(),
			textSearch: z.string().optional(),
			searchFields: z.array(z.enum(["title", "description", "all"])).optional(),
			createdAfter: z.string().datetime().optional(),
			createdBefore: z.string().datetime().optional(),
			updatedAfter: z.string().datetime().optional(),
			updatedBefore: z.string().datetime().optional(),
			dependencyStatus: z
				.array(
					z.enum([
						"blocked",
						"blocking",
						"no-dependencies",
						"has-dependencies",
					]),
				)
				.optional(),
			limit: z.number().int().positive().max(1000).optional(),
			offset: z.number().int().nonnegative().optional(),
			includeRelated: z.boolean().optional(),
			relatedTypes: z
				.array(z.enum(["dependencies", "blocking", "linked-specs"]))
				.optional(),
			includeStats: z.boolean().optional(),
			orderBy: z
				.enum(["next-to-do", "created", "updated"])
				.optional()
				.default("created"),
			direction: z.enum(["asc", "desc"]).optional().default("desc"),
		},
		// biome-ignore lint/suspicious/noExplicitAny: Handler receives validated args from Zod schema
		async (args: any) => {
			try {
				return await querySpecs(specManager, args);
			} catch (error) {
				logger.error({ error, tool: "query_specs" }, "Tool execution failed");
				throw error;
			}
		},
	);
}
