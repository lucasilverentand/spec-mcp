import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import type { ServerConfig } from "../config/index.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { getCreationFlowHelper } from "../utils/creation-flow-helper.js";

const SpecTypeSchema = z.enum([
	"requirement",
	"component",
	"plan",
	"constitution",
	"decision",
]);

/**
 * Register start_draft tool - initiates a new spec draft
 */
export function registerStartDraftTool(
	server: McpServer,
	_operations: SpecOperations,
	config: ServerConfig,
) {
	server.registerTool(
		"start_draft",
		{
			title: "Start Draft",
			description:
				"Start creating a new specification (requirement, component, plan, constitution, or decision). " +
				"Creates a draft and returns the first field to fill. Drafts are persisted as .draft.yml files.",
			inputSchema: {
				type: SpecTypeSchema.describe(
					"Type of specification to create: requirement, component, plan, constitution, or decision",
				),
			},
		},
		wrapToolHandler(
			"start_draft",
			async ({ type }) => {
				// Get shared helper instance with resolved specs path
				const helper = getCreationFlowHelper(config.specsPath);

				// Start creation flow session
				const response = await helper.start(
					type as "requirement" | "component" | "plan" | "constitution" | "decision",
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
										draft_file: `${config.specsPath}/.drafts/${response.draft_id}.draft.yml`,
										next_action:
											"Use update_draft to provide the value for this field",
									},
								},
								null,
								2,
							),
						},
					],
				};
			},
		),
	);
}
