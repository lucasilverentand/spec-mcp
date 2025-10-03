import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { creationFlowHelper } from "../utils/creation-flow-helper.js";
import type { ToolContext } from "./index.js";

const SpecTypeSchema = z.enum([
	"requirement",
	"component",
	"plan",
	"constitution",
	"decision",
]);

/**
 * Register start_spec tool - initiates a new spec draft
 */
export function registerStartSpecTool(
	server: McpServer,
	_operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"start_spec",
		{
			title: "Start Spec",
			description:
				"Start creating a new specification (requirement, component, plan, constitution, or decision). " +
				"Creates a draft and returns the first field to fill. Drafts are persisted as .draft.yml files.",
			inputSchema: {
				type: SpecTypeSchema.describe(
					"Type of specification to create: requirement, component, plan, constitution, or decision",
				),
				slug: z
					.string()
					.describe(
						"Slug/identifier for the spec (e.g., 'user-auth', 'api-gateway'). Must be lowercase with hyphens.",
					),
			},
		},
		wrapToolHandler(
			"start_spec",
			async ({ type, slug }) => {
				// Validate slug
				const validatedSlug = context.inputValidator.validateSlug(slug);

				// Start creation flow session
				const response = await creationFlowHelper.start(
					type as "requirement" | "component" | "plan" | "constitution" | "decision",
					validatedSlug,
				);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: true,
									data: {
										draft_id: response.draft_id,
										spec_type: type,
										step: response.step,
										total_steps: response.total_steps,
										current_field: response.current_step_name,
										instructions: response.prompt,
										draft_file: `.specs/.drafts/${response.draft_id}.draft.yml`,
										next_action:
											"Use update_spec to provide the value for this field",
									},
								},
								null,
								2,
							),
						},
					],
				};
			},
			context,
		),
	);
}
