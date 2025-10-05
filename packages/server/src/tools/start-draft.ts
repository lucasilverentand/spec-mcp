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
				"Begin creating a specification through a guided Q&A workflow. Returns the draft ID and first question.\n\n" +
				"Response format: { draft_id: 'draft-id', question: 'first question', guidance: 'how to answer', step: 1, total_steps: N }\n\n" +
				"The creation flow guides you through a series of questions to gather information. After all questions are answered, " +
				"you'll receive schema instructions to map the collected data and call create_spec.\n\n" +
				"Example: To create a requirement, call start_draft with type='requirement', then use update_draft to answer each question.",
			inputSchema: {
				type: SpecTypeSchema.describe(
					"Type of specification to create: requirement, component, plan, constitution, or decision",
				),
				name: z.string().optional().describe("Optional name for the specification"),
				slug: z.string().optional().describe("Optional slug (URL-friendly identifier) for the specification"),
			},
		},
		wrapToolHandler(
			"start_draft",
			async ({ type, name, slug }) => {
				// Get shared helper instance with resolved specs path
				const helper = getCreationFlowHelper(config.specsPath);

				// Start creation flow session
				const response = await helper.start(
					type as "requirement" | "component" | "plan" | "constitution" | "decision",
					slug,
					name,
				);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									draft_id: response.draft_id,
									step: response.step,
									total_steps: response.total_steps,
									current_step_name: response.current_step_name,
									question: response.question,
									guidance: response.guidance,
									progress_summary: response.progress_summary,
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
