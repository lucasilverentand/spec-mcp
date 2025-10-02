import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import {
	formatDeleteResult,
	formatListResult,
	formatResult,
} from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { wizardHelper } from "../utils/wizard-helper.js";
import type { ToolContext } from "./index.js";

// Schemas
const TaskIdSchema = z.string().regex(/^task-\d{3}$/);
const TaskPrioritySchema = z.enum([
	"critical",
	"high",
	"normal",
	"low",
	"optional",
]);
const TaskSchema = z.object({
	id: TaskIdSchema,
	priority: TaskPrioritySchema.default("normal"),
	depends_on: z.array(TaskIdSchema).default([]),
	description: z.string().min(1),
	considerations: z.array(z.string()).default([]),
	completed: z.boolean().default(false),
});

const PlanPrioritySchema = z.enum(["critical", "high", "medium", "low"]);
const PlanIdSchema = z.string().regex(/^pln-\d{3}-[a-z0-9-]+$/);
const AcceptanceCriteriaIdSchema = z
	.string()
	.regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/);

const OperationSchema = z.enum([
	"create",
	"get",
	"update",
	"delete",
	"list",
	"start",
	"step",
	"validate",
	"finalize",
]);

/**
 * Register consolidated plan tool
 */
export function registerPlanTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"plan",
		{
			title: "Plan",
			description:
				"Manage plans: create, get, update, delete, list, or use wizard (start, step, validate, finalize)",
			inputSchema: {
				operation: OperationSchema.describe(
					"Operation to perform: create (direct), get, update, delete, list, start (wizard), step (wizard), validate (wizard), finalize (wizard)",
				),
				// Common fields
				id: z
					.string()
					.optional()
					.describe("Plan ID (required for get, update, delete)"),
				// Wizard fields
				draft_id: z
					.string()
					.optional()
					.describe("Draft ID (required for step, validate, finalize)"),
				data: z
					.record(z.unknown())
					.optional()
					.describe("Step data (for wizard step operation)"),
				// Create/Update fields
				slug: z.string().optional().describe("URL-friendly identifier"),
				name: z.string().optional().describe("Display name"),
				description: z.string().optional().describe("Detailed description"),
				criteria_id: AcceptanceCriteriaIdSchema.optional().describe(
					"Acceptance criteria ID this plan fulfills",
				),
				priority: PlanPrioritySchema.optional().describe("Priority level"),
				acceptance_criteria: z
					.string()
					.optional()
					.describe("Conditions for completion"),
				depends_on: z
					.array(PlanIdSchema)
					.optional()
					.describe("Plan dependencies"),
				tasks: z.array(TaskSchema).optional().describe("Implementation tasks"),
				// List filters
				completed: z.boolean().optional().describe("Filter by completion"),
				search: z.string().optional().describe("Search query"),
			},
		},
		wrapToolHandler(
			"plan",
			async ({
				operation,
				id,
				draft_id,
				data,
				slug,
				name,
				description,
				criteria_id,
				priority,
				acceptance_criteria,
				depends_on,
				tasks,
				completed,
				search,
			}) => {
				switch (operation) {
					case "start": {
						// Start wizard
						const response = wizardHelper.start("plan");
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{ success: true, data: response },
										null,
										2,
									),
								},
							],
						};
					}

					case "step": {
						// Process wizard step
						if (!draft_id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: draft_id",
										}),
									},
								],
								isError: true,
							};
						}

						const stepResponse = wizardHelper.step(draft_id, data || {});
						if ("error" in stepResponse) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: stepResponse.error,
										}),
									},
								],
								isError: true,
							};
						}

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{ success: true, data: stepResponse },
										null,
										2,
									),
								},
							],
						};
					}

					case "validate": {
						// Validate current draft
						if (!draft_id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: draft_id",
										}),
									},
								],
								isError: true,
							};
						}

						const validateResponse = wizardHelper.validate(draft_id);
						if ("error" in validateResponse) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: validateResponse.error,
										}),
									},
								],
								isError: true,
							};
						}

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{ success: true, data: validateResponse },
										null,
										2,
									),
								},
							],
						};
					}

					case "finalize": {
						// Finalize wizard and create plan
						if (!draft_id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: draft_id",
										}),
									},
								],
								isError: true,
							};
						}

						const draft = wizardHelper.getDraft(draft_id);
						if (!draft) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: `Draft not found: ${draft_id}`,
										}),
									},
								],
								isError: true,
							};
						}

						// Extract data from draft
						const draftData = draft.data;
						const validatedSlug = context.inputValidator.validateSlug(
							(draftData.slug as string) || "",
						);
						const validatedName = context.inputValidator.sanitizeString(
							(draftData.name as string) || "",
						);
						const validatedDescription = context.inputValidator.sanitizeString(
							(draftData.description as string) || "",
						);
						const validatedCriteria = context.inputValidator.sanitizeString(
							(draftData.acceptance_criteria as string) || "",
						);

						const planData = {
							type: "plan" as const,
							slug: validatedSlug,
							name: validatedName,
							description: validatedDescription,
							criteria_id: (draftData.criteria_id as string) || undefined,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							priority:
								(draftData.priority as
									| "critical"
									| "high"
									| "medium"
									| "low") || "medium",
							acceptance_criteria: validatedCriteria,
							depends_on: (draftData.depends_on as string[]) || [],
							tasks: (draftData.tasks as typeof tasks) || [],
						};

						// @ts-expect-error - Type system limitation
						const result = await operations.createPlan(planData);

						// Delete draft after successful creation
						if (result.success) {
							wizardHelper.deleteDraft(draft_id);
						}

						return formatResult(result);
					}

					case "create": {
						if (!slug || !name || !description || !acceptance_criteria) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												"Missing required fields for create: slug, name, description, acceptance_criteria",
										}),
									},
								],
								isError: true,
							};
						}

						const validatedSlug = context.inputValidator.validateSlug(slug);
						const validatedName = context.inputValidator.sanitizeString(name);
						const validatedDescription =
							context.inputValidator.sanitizeString(description);
						const validatedCriteria =
							context.inputValidator.sanitizeString(acceptance_criteria);

						const data = {
							type: "plan" as const,
							slug: validatedSlug,
							name: validatedName,
							description: validatedDescription,
							criteria_id,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							priority: priority ?? "medium",
							acceptance_criteria: validatedCriteria,
							depends_on: depends_on ?? [],
							tasks: tasks ?? [],
						};
						// @ts-expect-error - Type system limitation
						const result = await operations.createPlan(data);
						return formatResult(result);
					}

					case "get": {
						if (!id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: id",
										}),
									},
								],
								isError: true,
							};
						}

						const validatedId = context.inputValidator.validateId(id);
						const result = await operations.getPlan(validatedId);
						return formatResult(result);
					}

					case "update": {
						if (!id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: id",
										}),
									},
								],
								isError: true,
							};
						}

						const validatedId = context.inputValidator.validateId(id);
						const updateData: Record<string, unknown> = {
							updated_at: new Date().toISOString(),
						};

						if (name)
							updateData.name = context.inputValidator.sanitizeString(name);
						if (description)
							updateData.description =
								context.inputValidator.sanitizeString(description);
						if (criteria_id) updateData.criteria_id = criteria_id;
						if (acceptance_criteria)
							updateData.acceptance_criteria =
								context.inputValidator.sanitizeString(acceptance_criteria);
						if (priority) updateData.priority = priority;
						if (depends_on) updateData.depends_on = depends_on;
						if (tasks) updateData.tasks = tasks;

						const result = await operations.updatePlan(validatedId, updateData);
						return formatResult(result);
					}

					case "delete": {
						if (!id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: id",
										}),
									},
								],
								isError: true,
							};
						}

						const validatedId = context.inputValidator.validateId(id);
						const result = await operations.deletePlan(validatedId);
						return formatDeleteResult(result, "plan", validatedId);
					}

					case "list": {
						const filter: Record<string, unknown> = {};
						if (priority) filter.priority = priority;
						if (completed !== undefined) filter.completed = completed;
						if (search) {
							filter.search = context.inputValidator.sanitizeString(search);
						}

						const result = await operations.listPlans(
							Object.keys(filter).length > 0 ? filter : undefined,
						);
						return formatListResult(result, "plan");
					}
				}
			},
			context,
		),
	);
}
