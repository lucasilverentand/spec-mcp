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

// Article schema
const ArticleSchema = z.object({
	id: z.string().regex(/^art-\d{3}$/),
	title: z.string(),
	principle: z.string(),
	rationale: z.string(),
	examples: z.array(z.string()).optional(),
	exceptions: z.array(z.string()).optional(),
});

// Amendment schema
const AmendmentSchema = z.object({
	id: z.string().regex(/^amd-\d{3}$/),
	article_id: z.string().regex(/^art-\d{3}$/),
	change_description: z.string(),
	rationale: z.string(),
	backwards_compatibility: z.string(),
	approved_by: z.array(z.string()).optional(),
	approved_at: z.string().datetime().optional(),
});

const OperationSchema = z.enum(["create", "get", "update", "delete", "list"]);

/**
 * Register consolidated constitution tool
 */
export function registerConstitutionTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"constitution",
		{
			title: "Constitution",
			description:
				"Manage constitutions: create, get, update, delete, or list constitutions",
			inputSchema: {
				operation: OperationSchema.describe(
					"Operation to perform: create, get, update, delete, or list",
				),
				// Common fields
				id: z
					.string()
					.optional()
					.describe("Constitution ID (required for get, update, delete)"),
				// Create/Update fields
				slug: z.string().optional().describe("URL-friendly identifier"),
				name: z.string().optional().describe("Display name"),
				description: z.string().optional().describe("Detailed description"),
				articles: z
					.array(ArticleSchema)
					.optional()
					.describe("Core principles that govern development"),
				amendments: z
					.array(AmendmentSchema)
					.optional()
					.describe("Historical amendments to articles"),
				applies_to: z
					.array(
						z.enum([
							"all",
							"requirements",
							"components",
							"plans",
							"architecture",
							"testing",
						]),
					)
					.optional()
					.describe("Which specification types this constitution governs"),
				maintainers: z
					.array(z.string())
					.optional()
					.describe("List of maintainers who can approve amendments"),
				review_required: z
					.boolean()
					.optional()
					.describe("Whether amendments require maintainer review"),
				status: z
					.enum(["draft", "active", "archived"])
					.optional()
					.describe("Current status of this constitution"),
				version: z
					.string()
					.optional()
					.describe("Semantic version of this constitution"),
				// List filters
				search: z.string().optional().describe("Search query"),
			},
		},
		wrapToolHandler(
			"constitution",
			async ({
				operation,
				id,
				slug,
				name,
				description,
				articles,
				amendments,
				applies_to,
				maintainers,
				review_required,
				status,
				version,
			}) => {
				switch (operation) {
					case "create": {
						if (!slug || !name || !description || !articles) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												"Missing required fields for create: slug, name, description, articles",
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
							type: "constitution" as const,
							slug: validatedSlug,
							name: validatedName,
							description: validatedDescription,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							articles: articles,
							amendments: amendments || [],
							applies_to: applies_to || ["all"],
							maintainers: maintainers || [],
							review_required: review_required ?? true,
							status: status || "active",
							version: version || "1.0.0",
						};
						// @ts-expect-error - Type system limitation
						const result = await operations.createConstitution(data);
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

						const result = await operations.getConstitution(id);
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

						const updates: Record<string, unknown> = {
							updated_at: new Date().toISOString(),
						};

						if (slug !== undefined)
							updates.slug = context.inputValidator.validateSlug(slug);
						if (name !== undefined)
							updates.name = context.inputValidator.sanitizeString(name);
						if (description !== undefined)
							updates.description =
								context.inputValidator.sanitizeString(description);
						if (articles !== undefined) updates.articles = articles;
						if (amendments !== undefined) updates.amendments = amendments;
						if (applies_to !== undefined) updates.applies_to = applies_to;
						if (maintainers !== undefined) updates.maintainers = maintainers;
						if (review_required !== undefined)
							updates.review_required = review_required;
						if (status !== undefined) updates.status = status;
						if (version !== undefined) updates.version = version;

						const result = await operations.updateConstitution(id, updates);
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

						const result = await operations.deleteConstitution(id);
						return formatDeleteResult(result, "Constitution", id);
					}

					case "list": {
						const filter: {
							status?: Array<"draft" | "active" | "archived">;
							applies_to?: Array<
								| "all"
								| "requirements"
								| "components"
								| "plans"
								| "architecture"
								| "testing"
							>;
						} = {};

						if (status) filter.status = [status];
						if (applies_to) filter.applies_to = applies_to;

						const result = await operations.listConstitutions(filter);
						return formatListResult(result, "constitution");
					}

					default:
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: false,
										error: `Unknown operation: ${operation}`,
									}),
								},
							],
							isError: true,
						};
				}
			},
			context,
		),
	);
}
