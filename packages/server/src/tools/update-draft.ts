import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ServerConfig } from "../config/index.js";
import { getCreationFlowHelper } from "../utils/creation-flow-helper.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";

/**
 * Register update_draft tool - updates a draft one field at a time
 */
export function registerUpdateDraftTool(
	server: McpServer,
	config: ServerConfig,
) {
	server.registerTool(
		"update_draft",
		{
			title: "Update Draft",
			description:
				"Answer a question in the creation flow Q&A process. Provide data to answer the current question.\n\n" +
				"IMPORTANT: The first steps of any spec creation flow are RESEARCH steps:\n" +
				"- Use query tool to search for similar specs and review constitutions\n" +
				"- Use context7 (resolve-library-id → get-library-docs) to research third-party libraries\n" +
				"- Use WebFetch to research best practices, standards, and architectural patterns\n" +
				"- Document your findings thoroughly to prevent duplicates and ensure alignment\n\n" +
				"Success response: { draft_id, question: 'next question', guidance: '...', step: N, total_steps: M }\n" +
				"Validation error: { draft_id, issues: ['error messages'], suggestions: ['helpful tips'] }\n" +
				"Completion: { draft_id, completed: true, next_action: 'Call finalize_draft...', finalization_instructions: '...' }\n\n" +
				"When completed=true, review the finalization_instructions which contain schema details, then map the collected Q&A data to the schema and call finalize_draft.\n\n" +
				"Example: update_draft({ draft_id: 'req-...', data: { research_findings: 'Found similar req-003...', constitution_articles: ['con-001/art-002'] } })",
			inputSchema: {
				draft_id: z.string().describe("Draft ID returned from start_draft"),
				data: z
					.record(z.unknown())
					.describe(
						"Data to answer the current question. Can be any structure - string, object, array, etc. The key names are flexible.",
					),
			},
		},
		wrapToolHandler("update_draft", async ({ draft_id, data }) => {
			// Create helper with resolved specs path
			const helper = getCreationFlowHelper(config.specsPath);

			// Get the draft to check its type
			const draft = helper.getDraft(draft_id);
			if (!draft) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: false,
									error: `Draft not found: ${draft_id}`,
								},
								null,
								2,
							),
						},
					],
					isError: true,
				};
			}

			// Prevent locking drafts - only finalized specs can be locked
			if ("locked" in data) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: false,
									error:
										"Drafts cannot be locked. Only finalized specs can be locked.",
								},
								null,
								2,
							),
						},
					],
					isError: true,
				};
			}

			/**
			 * Recursively parse JSON strings to ensure proper data structure
			 * This handles cases where MCP transmission double-stringifies complex objects
			 */
			const deepParseJson = (val: unknown): unknown => {
				if (typeof val === "string") {
					const trimmed = val.trim();
					// Check if it looks like JSON
					if (
						(trimmed.startsWith("[") && trimmed.endsWith("]")) ||
						(trimmed.startsWith("{") && trimmed.endsWith("}"))
					) {
						try {
							const parsed = JSON.parse(val);
							// Recursively parse in case of nested JSON strings
							return deepParseJson(parsed);
						} catch (_e) {
							// Not valid JSON, return sanitized string
							return val;
						}
					}
					// Regular string, sanitize it
					return val;
				}

				// Recursively process arrays
				if (Array.isArray(val)) {
					return val.map((item) => deepParseJson(item));
				}

				// Recursively process objects
				if (val !== null && typeof val === "object") {
					const result: Record<string, unknown> = {};
					for (const [key, value] of Object.entries(val)) {
						result[key] = deepParseJson(value);
					}
					return result;
				}

				// Primitive values pass through
				return val;
			};

			// Sanitize the entire data object
			const sanitizedData = deepParseJson(data) as Record<string, unknown>;

			// Process the creation flow step with the data
			const stepResponse = await helper.step(draft_id, sanitizedData);

			if ("error" in stepResponse) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: false,
									error: stepResponse.error,
								},
								null,
								2,
							),
						},
					],
					isError: true,
				};
			}

			// Check if validation failed
			if (
				stepResponse.validation &&
				!stepResponse.validation.passed &&
				stepResponse.validation.issues
			) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									id: draft_id,
									issues: stepResponse.validation.issues,
									suggestions: stepResponse.validation.suggestions || [],
								},
								null,
								2,
							),
						},
					],
					isError: true,
				};
			}

			// Check if all steps are completed
			if (stepResponse.completed) {
				// Return finalization instructions for LLM
				// The LLM will map the Q&A data to the schema and call finalize_draft()
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									draft_id,
									completed: true,
									message: "All creation flow steps completed!",
									next_action:
										"Call the finalize_draft tool to finalize and create the specification",
									finalization_instructions:
										stepResponse.finalization_instructions,
									collected_data: stepResponse.guidance, // Contains schema instructions
								},
								null,
								2,
							),
						},
					],
				};
			}

			// Return next step guidance
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								draft_id,
								step: stepResponse.step,
								total_steps: stepResponse.total_steps,
								current_step_name: stepResponse.current_step_name,
								question: stepResponse.question,
								guidance: stepResponse.guidance,
								progress_summary: stepResponse.progress_summary,
							},
							null,
							2,
						),
					},
				],
			};
		}),
	);
}
