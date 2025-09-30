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

// Schemas
const ComponentTypeSchema = z.enum(["app", "service", "library", "tool"]);
const ComponentIdSchema = z
	.string()
	.regex(/^(app|svc|lib|tol)-\d{3}-[a-z0-9-]+$/);

const OperationSchema = z.enum(["create", "get", "update", "delete", "list"]);

// Task schema for setup_tasks
const TaskIdSchema = z.string().regex(/^task-\d{3}$/);
const TaskPrioritySchema = z.enum([
	"critical",
	"high",
	"normal",
	"low",
	"optional",
]);
const SetupTaskSchema = z.object({
	id: TaskIdSchema,
	description: z.string().min(1),
	priority: TaskPrioritySchema.default("normal"),
	depends_on: z.array(TaskIdSchema).default([]),
	completed: z.boolean().default(false),
	completed_at: z.string().datetime().optional(),
	verified: z.boolean().default(false),
	verified_at: z.string().datetime().optional(),
	notes: z.array(z.string()).default([]),
	considerations: z.array(z.string()).default([]),
});

/**
 * Register consolidated component tool
 */
export function registerComponentTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"component",
		{
			title: "Component",
			description:
				"Manage components: create, get, update, delete, or list component specifications",
			inputSchema: {
				operation: OperationSchema.describe(
					"Operation to perform: create, get, update, delete, or list",
				),
				// Common fields
				id: z
					.string()
					.optional()
					.describe("Component ID (required for get, update, delete)"),
				// Create/Update fields
				type: ComponentTypeSchema.optional().describe("Component type"),
				slug: z.string().optional().describe("URL-friendly identifier"),
				name: z.string().optional().describe("Display name"),
				description: z.string().optional().describe("Detailed description"),
				folder: z
					.string()
					.optional()
					.describe("Relative path from repository root"),
				tech_stack: z
					.array(z.string())
					.optional()
					.describe("Technologies used"),
				depends_on: z
					.array(ComponentIdSchema)
					.optional()
					.describe("Component dependencies"),
				external_dependencies: z
					.array(z.string())
					.optional()
					.describe("Third-party dependencies"),
				capabilities: z
					.array(z.string())
					.optional()
					.describe("Key functionalities"),
				constraints: z
					.array(z.string())
					.optional()
					.describe("Technical and business constraints"),
				setup_tasks: z
					.array(SetupTaskSchema)
					.optional()
					.describe("Tasks required to set up the component"),
				test_setup: z
					.array(SetupTaskSchema)
					.optional()
					.describe("Tasks required to configure testing for the component"),
				// List filters
				search: z.string().optional().describe("Search query"),
			},
		},
		wrapToolHandler(
			"component",
			async ({
				operation,
				id,
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
				setup_tasks,
				test_setup,
				search,
			}) => {
				switch (operation) {
					case "create": {
						if (!type || !slug || !name || !description) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												"Missing required fields for create: type, slug, name, description",
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
						const validatedFolder = context.inputValidator.sanitizeString(
							folder ?? ".",
						);

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
							test_setup: test_setup ?? [],
						};
						// @ts-expect-error - Type system limitation
						const result = await operations.createComponent(data);
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
						const result = await operations.getComponent(validatedId);
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
						if (folder)
							updateData.folder = context.inputValidator.sanitizeString(folder);
						if (tech_stack) updateData.tech_stack = tech_stack;
						if (depends_on) updateData.depends_on = depends_on;
						if (external_dependencies)
							updateData.external_dependencies = external_dependencies;
						if (capabilities) updateData.capabilities = capabilities;
						if (constraints) updateData.constraints = constraints;
						if (setup_tasks) updateData.setup_tasks = setup_tasks;
						if (test_setup) updateData.test_setup = test_setup;

						const result = await operations.updateComponent(
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
						const result = await operations.deleteComponent(validatedId);
						return formatDeleteResult(result, "component", validatedId);
					}

					case "list": {
						const filter: Record<string, string> = {};
						if (type) filter.type = type;
						if (search) {
							filter.search = context.inputValidator.sanitizeString(search);
						}

						const result = await operations.listComponents(
							Object.keys(filter).length > 0 ? filter : undefined,
						);
						return formatListResult(result, "component");
					}
				}
			},
			context,
		),
	);
}
