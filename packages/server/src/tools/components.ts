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

// NOTE: These schemas are duplicated from @spec-mcp/data because:
// 1. @spec-mcp/data uses Zod v4
// 2. @spec-mcp/server uses Zod v3 (required by MCP SDK)
// 3. Zod v3 and v4 have incompatible types
// Source of truth remains in @spec-mcp/data - keep these in sync manually

// ComponentTypeSchema - matches ComponentTypeSchema from data package
const ComponentTypeSchema = z.enum(["app", "service", "library", "tool"]);

// ComponentIdSchema - matches ComponentIdSchema from data package
const ComponentIdSchema = z.string().regex(/^(app|svc|lib|tol)-\d{3}-[a-z0-9-]+$/);

/**
 * Register all component-related tools
 */
export function registerComponentTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Create Component Tool
	server.registerTool(
		"create-component",
		{
			title: "Create Component",
			description: "Create a new component specification",
			inputSchema: {
				type: ComponentTypeSchema
					.describe("Type of component"),
				slug: z.string().describe("URL-friendly identifier"),
				name: z.string().describe("Display name of the component"),
				description: z.string().describe("Detailed description"),
				folder: z
					.string()
					.default(".")
					.describe("Relative path from repository root"),
				tech_stack: z
					.array(z.string())
					.optional()
					.describe("Technologies used (e.g., ['React', 'TypeScript'])"),
				depends_on: z
					.array(ComponentIdSchema)
					.optional()
					.describe("Component IDs this depends on"),
				external_dependencies: z
					.array(z.string())
					.optional()
					.describe("Third-party dependencies"),
				capabilities: z
					.array(z.string())
					.optional()
					.describe("Key functionalities provided"),
				constraints: z
					.array(z.string())
					.optional()
					.describe("Technical and business constraints"),
			},
		},
		wrapToolHandler(
			"create-component",
			async ({
				type,
				slug,
				name,
				description,
				folder,
				tech_stack,
				depends_on,
				external_dependencies,
				capabilities,
				constraints,
			}) => {
				const validatedSlug = context.inputValidator.validateSlug(slug);
				const validatedName = context.inputValidator.sanitizeString(name);
				const validatedDescription =
					context.inputValidator.sanitizeString(description);
				const validatedFolder = context.inputValidator.sanitizeString(folder);

				// Note: `id` and `number` are computed by the system
				const data = {
					type,
					slug: validatedSlug,
					name: validatedName,
					description: validatedDescription,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					folder: validatedFolder,
					tech_stack: tech_stack ?? [],
					depends_on: depends_on ?? [],
					external_dependencies: external_dependencies ?? [],
					capabilities: capabilities ?? [],
					constraints: constraints ?? [],
					setup_tasks: [],
				};
				// @ts-expect-error - Type system limitation: system computes missing fields
				const result = await operations.createComponent(data);
				return formatResult(result);
			},
			context,
		),
	);

	// Get Component Tool
	server.registerTool(
		"get-component",
		{
			title: "Get Component",
			description: "Retrieve a component by its ID",
			inputSchema: {
				id: z.string().describe("Component ID (e.g., 'cmp-001-slug')"),
			},
		},
		wrapToolHandler(
			"get-component",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const result = await operations.getComponent(validatedId);
				return formatResult(result);
			},
			context,
		),
	);

	// Update Component Tool
	server.registerTool(
		"update-component",
		{
			title: "Update Component",
			description: "Update an existing component",
			inputSchema: {
				id: z.string().describe("Component ID to update"),
				name: z.string().optional().describe("Updated name"),
				description: z.string().optional().describe("Updated description"),
				folder: z.string().optional().describe("Updated folder path"),
				tech_stack: z
					.array(z.string())
					.optional()
					.describe("Updated tech stack"),
				depends_on: z
					.array(ComponentIdSchema)
					.optional()
					.describe("Updated dependencies"),
				external_dependencies: z
					.array(z.string())
					.optional()
					.describe("Updated third-party dependencies"),
				capabilities: z
					.array(z.string())
					.optional()
					.describe("Updated capabilities"),
				constraints: z
					.array(z.string())
					.optional()
					.describe("Updated constraints"),
			},
		},
		wrapToolHandler(
			"update-component",
			async ({ id, ...updates }) => {
				const validatedId = context.inputValidator.validateId(id);

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
				if (updates.folder) {
					updateData.folder = context.inputValidator.sanitizeString(
						updates.folder,
					);
				}
				if (updates.tech_stack) {
					updateData.tech_stack = updates.tech_stack;
				}
				if (updates.depends_on) {
					updateData.depends_on = updates.depends_on;
				}
				if (updates.external_dependencies) {
					updateData.external_dependencies = updates.external_dependencies;
				}
				if (updates.capabilities) {
					updateData.capabilities = updates.capabilities;
				}
				if (updates.constraints) {
					updateData.constraints = updates.constraints;
				}

				const result = await operations.updateComponent(
					validatedId,
					updateData,
				);
				return formatResult(result);
			},
			context,
		),
	);

	// Delete Component Tool
	server.registerTool(
		"delete-component",
		{
			title: "Delete Component",
			description: "Delete a component by its ID",
			inputSchema: {
				id: z.string().describe("Component ID to delete"),
			},
		},
		wrapToolHandler(
			"delete-component",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const result = await operations.deleteComponent(validatedId);
				return formatDeleteResult(result, "component", validatedId);
			},
			context,
		),
	);

	// List Components Tool
	server.registerTool(
		"list-components",
		{
			title: "List Components",
			description: "List all components with optional filtering",
			inputSchema: {
				type: ComponentTypeSchema
					.optional()
					.describe("Filter by component type"),
				tech_stack: z.string().optional().describe("Filter by technology"),
				search: z
					.string()
					.optional()
					.describe("Search in name and description"),
			},
		},
		wrapToolHandler(
			"list-components",
			async ({ type, tech_stack, search }) => {
				const filter: Record<string, string> = {};
				if (type) filter.type = type;
				if (tech_stack) {
					filter.tech_stack = context.inputValidator.sanitizeString(tech_stack);
				}
				if (search) {
					filter.search = context.inputValidator.sanitizeString(search);
				}

				const result = await operations.listComponents(
					Object.keys(filter).length > 0 ? filter : undefined,
				);
				return formatListResult(result, "component");
			},
			context,
		),
	);
}
