import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import {
	formatDeleteResult,
	formatListResult,
	formatResult,
} from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";
import {
	CreateRequirementInputSchema,
	CreateRequirementSchema,
	DeleteRequirementInputSchema,
	DeleteRequirementSchema,
	GetRequirementInputSchema,
	GetRequirementSchema,
	ListRequirementsInputSchema,
	ListRequirementsSchema,
	UpdateRequirementInputSchema,
	UpdateRequirementSchema,
} from "./schemas/requirements.js";

/**
 * Register all requirement-related tools
 */
export function registerRequirementTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Create Requirement Tool
	server.registerTool(
		"create-requirement",
		{
			title: "Create Requirement",
			description: "Create a new requirement specification",
			inputSchema: CreateRequirementInputSchema,
		},
		wrapToolHandler(
			"create-requirement",
			async ({ slug, name, description, priority, criteria }) => {
				// Validate and sanitize inputs
				const validatedSlug = context.inputValidator.validateSlug(slug);
				const validatedName = context.inputValidator.sanitizeString(name);
				const validatedDescription =
					context.inputValidator.sanitizeString(description);

				// Note: `id` and `number` are computed by the system
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
				// @ts-expect-error - Type system limitation: system computes missing fields
				const result = await operations.createRequirement(data);
				return formatResult(result);
			},
			context,
			CreateRequirementSchema,
		),
	);

	// Get Requirement Tool
	server.registerTool(
		"get-requirement",
		{
			title: "Get Requirement",
			description: "Retrieve a requirement by its ID",
			inputSchema: GetRequirementInputSchema,
		},
		wrapToolHandler(
			"get-requirement",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const result = await operations.getRequirement(validatedId);
				return formatResult(result);
			},
			context,
			GetRequirementSchema,
		),
	);

	// Update Requirement Tool
	server.registerTool(
		"update-requirement",
		{
			title: "Update Requirement",
			description: "Update an existing requirement",
			inputSchema: UpdateRequirementInputSchema,
		},
		wrapToolHandler(
			"update-requirement",
			async ({ id, ...updates }) => {
				const validatedId = context.inputValidator.validateId(id);

				// Sanitize string fields
				const updateData: Record<string, unknown> = {
					updated_at: new Date().toISOString(),
				};

				if (updates.name) {
					updateData.name = context.inputValidator.sanitizeString(updates.name);
				}
				if (updates.description) {
					updateData.description = context.inputValidator.sanitizeString(
						updates.description,
					);
				}
				if (updates.priority) {
					updateData.priority = updates.priority;
				}
				if (updates.criteria) {
					updateData.criteria = updates.criteria;
				}

				const result = await operations.updateRequirement(
					validatedId,
					updateData,
				);
				return formatResult(result);
			},
			context,
			UpdateRequirementSchema,
		),
	);

	// Delete Requirement Tool
	server.registerTool(
		"delete-requirement",
		{
			title: "Delete Requirement",
			description: "Delete a requirement by its ID",
			inputSchema: DeleteRequirementInputSchema,
		},
		wrapToolHandler(
			"delete-requirement",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const result = await operations.deleteRequirement(validatedId);
				return formatDeleteResult(result, "requirement", validatedId);
			},
			context,
			DeleteRequirementSchema,
		),
	);

	// List Requirements Tool
	server.registerTool(
		"list-requirements",
		{
			title: "List Requirements",
			description: "List all requirements with optional filtering",
			inputSchema: ListRequirementsInputSchema,
		},
		wrapToolHandler(
			"list-requirements",
			async ({ priority, search }) => {
				const filter: Record<string, string> = {};
				if (priority) filter.priority = priority;
				if (search) {
					filter.search = context.inputValidator.sanitizeString(search);
				}

				const result = await operations.listRequirements(
					Object.keys(filter).length > 0 ? filter : undefined,
				);
				return formatListResult(result, "requirement");
			},
			context,
			ListRequirementsSchema,
		),
	);
}
