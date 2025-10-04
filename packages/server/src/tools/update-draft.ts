import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config/index.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { getCreationFlowHelper } from "../utils/creation-flow-helper.js";

/**
 * Register update_draft tool - updates a draft one field at a time
 */
export function registerUpdateDraftTool(
	server: McpServer,
	operations: SpecOperations,
	config: ServerConfig,
) {
	server.registerTool(
		"update_draft",
		{
			title: "Update Draft",
			description:
				"Update a spec draft by providing ONE field value at a time. " +
				"The tool validates the field, saves to .draft.yml, and returns guidance for the next field. " +
				"When all required fields are complete, the spec is automatically finalized and created.",
			inputSchema: {
				draft_id: z
					.string()
					.describe(
						"Draft ID returned from start_spec (e.g., 'req-auth-1234567890')",
					),
				field: z
					.string()
					.describe(
						"Field name to update (use the 'current_field' from the previous response)",
					),
				value: z
					.unknown()
					.describe(
						"Value for the field. Can be string, number, boolean, array, or object depending on the field type.",
					),
			},
		},
		wrapToolHandler(
			"update_draft",
			async ({ draft_id, field, value }) => {
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
				if (field === "locked") {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: "Drafts cannot be locked. Only finalized specs can be locked.",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Sanitize string values and parse JSON if needed
				let sanitizedValue = value;

				// Debug: Log the type and value
				console.error(`[DEBUG] Field: ${field}, Type: ${typeof value}, Value:`, value);

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
							} catch (e) {
								// Not valid JSON, return sanitized string
								return val;
							}
						}
						// Regular string, sanitize it
						return val;
					}

					// Recursively process arrays
					if (Array.isArray(val)) {
						return val.map(item => deepParseJson(item));
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

				sanitizedValue = deepParseJson(value);
				console.error(`[DEBUG] After deep parse:`, sanitizedValue);

				// Process the creation flow step with the field data
				const stepData = { [field]: sanitizedValue };
				const stepResponse = await helper.step(draft_id, stepData);

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
										success: false,
										draft_id,
										field,
										validation_issues: stepResponse.validation.issues,
										suggestions: stepResponse.validation.suggestions || [],
										instructions:
											"Please correct the field value and try again.",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Check if all steps are completed (auto-finalize)
				if (stepResponse.completed) {
					// Finalize the spec
					const finalizedDraft = helper.getDraft(draft_id);
					if (!finalizedDraft) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: false,
											error: `Draft not found during finalization: ${draft_id}`,
										},
										null,
										2,
									),
								},
							],
							isError: true,
						};
					}

					// Create the spec based on type
					const draftData = finalizedDraft.data;
					const specType = finalizedDraft.type;
					let result: unknown;

					try {
						switch (specType) {
							case "requirement": {
								const reqData = {
									type: "requirement" as const,
									slug: (draftData.slug as string) || "",
									name: (draftData.name as string) || "",
									description: (draftData.description as string) || "",
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
									priority:
										(draftData.priority as
											| "critical"
											| "required"
											| "ideal"
											| "optional") || "required",
									criteria: (draftData.criteria as unknown[]) || [],
								};

								// @ts-expect-error - Type system limitation
								result = await operations.createRequirement(reqData);
								break;
							}

							case "plan": {
								const planData = {
									type: "plan" as const,
									slug: (draftData.slug as string) || "",
									name: (draftData.name as string) || "",
									description: (draftData.description as string) || "",
									criteria_id: (draftData.criteria_id as string) || undefined,
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
									priority:
										(draftData.priority as
											| "critical"
											| "high"
											| "medium"
											| "low") || "medium",
									acceptance_criteria: (draftData.acceptance_criteria as string) || "",
									depends_on: (draftData.depends_on as string[]) || [],
									tasks: (draftData.tasks as unknown[]) || [],
								};

								// @ts-expect-error - Type system limitation
								result = await operations.createPlan(planData);
								break;
							}

							case "component": {
								const compData = {
									type:
										(draftData.type as "app" | "service" | "library") ||
										"service",
									slug: (draftData.slug as string) || "",
									name: (draftData.name as string) || "",
									description: (draftData.description as string) || "",
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
									folder: (draftData.folder as string) || ".",
									tech_stack: (draftData.tech_stack as string[]) || [],
									depends_on: (draftData.depends_on as string[]) || [],
									external_dependencies:
										(draftData.external_dependencies as string[]) || [],
									capabilities: (draftData.capabilities as string[]) || [],
									constraints: (draftData.constraints as string[]) || [],
								};

								// @ts-expect-error - Type system limitation
								result = await operations.createComponent(compData);
								break;
							}

							default:
								return {
									content: [
										{
											type: "text",
											text: JSON.stringify(
												{
													success: false,
													error: `Unsupported spec type: ${specType}`,
												},
												null,
												2,
											),
										},
									],
									isError: true,
								};
						}

						// Delete draft after successful creation
						// @ts-expect-error - Result can be any entity type
						if (result.success) {
							await helper.deleteDraft(draft_id);
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify(
											{
												success: true,
												completed: true,
												message: `${specType} created successfully!`,
												// @ts-expect-error - Result can be any entity type
												spec_id: result.data?.id,
												// @ts-expect-error - Result can be any entity type
												spec: result.data,
											},
											null,
											2,
										),
									},
								],
							};
						}

						// @ts-expect-error - Result can be any entity type, formatResult handles all
						return formatResult(result);
					} catch (error) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: false,
											error: `Failed to create ${specType}: ${error instanceof Error ? error.message : String(error)}`,
										},
										null,
										2,
									),
								},
							],
							isError: true,
						};
					}
				}

				// Return next step guidance
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: true,
									draft_id,
									step: stepResponse.step,
									total_steps: stepResponse.total_steps,
									current_field: stepResponse.current_step_name,
									instructions: stepResponse.prompt,
									validation:
										stepResponse.validation?.passed === false
											? {
													passed: false,
													issues: stepResponse.validation.issues,
													suggestions: stepResponse.validation.suggestions,
												}
											: { passed: true },
									draft_file: `${config.specsPath}/.drafts/${draft_id}.draft.yml`,
									next_action:
										"Use update_draft again to provide the next field value",
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
