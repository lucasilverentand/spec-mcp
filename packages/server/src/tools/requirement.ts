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

// Criterion schema
const CriterionSchema = z.object({
	id: z.string().regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/),
	description: z.string(),
});

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
 * Register consolidated requirement tool
 */
export function registerRequirementTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"requirement",
		{
			title: "Requirement",
			description:
				"Manage requirements: create, get, update, delete, list, or use wizard (start, step, validate, finalize)",
			inputSchema: {
				operation: OperationSchema.describe(
					"Operation to perform: create (direct), get, update, delete, list, start (wizard), step (wizard), validate (wizard), finalize (wizard)",
				),
				// Common fields
				id: z
					.string()
					.optional()
					.describe("Requirement ID (required for get, update, delete)"),
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
				priority: z
					.enum(["critical", "required", "ideal", "optional"])
					.optional()
					.describe("Priority level"),
				criteria: z
					.array(CriterionSchema)
					.optional()
					.describe("Acceptance criteria"),
				// List filters
				search: z.string().optional().describe("Search query"),
			},
		},
		wrapToolHandler(
			"requirement",
			async ({
				operation,
				id,
				draft_id,
				data,
				slug,
				name,
				description,
				priority,
				criteria,
				search,
			}) => {
				switch (operation) {
					case "start": {
						// Start wizard
						const response = wizardHelper.start("requirement");
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({ success: true, data: response }, null, 2),
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
						// Finalize wizard and create requirement
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

						const reqData = {
							type: "requirement" as const,
							slug: validatedSlug,
							name: validatedName,
							description: validatedDescription,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							priority: (draftData.priority as
								| "critical"
								| "required"
								| "ideal"
								| "optional") || "required",
							criteria: (draftData.criteria as typeof criteria) || [],
						};

						// @ts-expect-error - Type system limitation
						const result = await operations.createRequirement(reqData);

						// Delete draft after successful creation
						if (result.success) {
							wizardHelper.deleteDraft(draft_id);
						}

						return formatResult(result);
					}

					case "create": {
						if (!slug || !name || !description || !priority || !criteria) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												"Missing required fields for create: slug, name, description, priority, criteria",
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

						const data = {
							type: "requirement" as const,
							slug: validatedSlug,
							name: validatedName,
							description: validatedDescription,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							priority,
							criteria,
						};
						// @ts-expect-error - Type system limitation
						const result = await operations.createRequirement(data);
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
						const result = await operations.getRequirement(validatedId);
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
						if (priority) updateData.priority = priority;
						if (criteria) updateData.criteria = criteria;

						const result = await operations.updateRequirement(
							validatedId,
							updateData,
						);
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
						const result = await operations.deleteRequirement(validatedId);
						return formatDeleteResult(result, "requirement", validatedId);
					}

					case "list": {
						const filter: Record<string, string> = {};
						if (priority) filter.priority = priority;
						if (search) {
							filter.search = context.inputValidator.sanitizeString(search);
						}

						const result = await operations.listRequirements(
							Object.keys(filter).length > 0 ? filter : undefined,
						);
						return formatListResult(result, "requirement");
					}
				}
			},
			context,
		),
	);
}
