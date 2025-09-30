import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import {
	formatDeleteResult,
	formatListResult,
	formatResult,
} from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// Criterion schema
const CriterionSchema = z.object({
	id: z.string().regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/),
	description: z.string(),
});

const OperationSchema = z.enum(["create", "get", "update", "delete", "list"]);

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
				"Manage requirements: create, get, update, delete, or list requirements",
			inputSchema: {
				operation: OperationSchema.describe(
					"Operation to perform: create, get, update, delete, or list",
				),
				// Common fields
				id: z
					.string()
					.optional()
					.describe("Requirement ID (required for get, update, delete)"),
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
				slug,
				name,
				description,
				priority,
				criteria,
				search,
			}) => {
				switch (operation) {
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
