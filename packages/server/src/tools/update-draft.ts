import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import { creationFlowHelper } from "../utils/creation-flow-helper.js";
import type { ToolContext } from "./index.js";

/**
 * Register update_draft tool - updates a draft one field at a time
 */
export function registerUpdateDraftTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
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
				// Get the draft to check its type
				const draft = creationFlowHelper.getDraft(draft_id);
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

				// Sanitize string values
				let sanitizedValue = value;
				if (typeof value === "string") {
					sanitizedValue = context.inputValidator.sanitizeString(value);
				}

				// Process the creation flow step with the field data
				const stepData = { [field]: sanitizedValue };
				const stepResponse = await creationFlowHelper.step(draft_id, stepData);

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
					const finalizedDraft = creationFlowHelper.getDraft(draft_id);
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
								const validatedSlug = context.inputValidator.validateSlug(
									(draftData.slug as string) || "",
								);
								const validatedName = context.inputValidator.sanitizeString(
									(draftData.name as string) || "",
								);
								const validatedDescription =
									context.inputValidator.sanitizeString(
										(draftData.description as string) || "",
									);

								const reqData = {
									type: "requirement" as const,
									slug: validatedSlug,
									name: validatedName,
									description: validatedDescription,
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
								const validatedSlug = context.inputValidator.validateSlug(
									(draftData.slug as string) || "",
								);
								const validatedName = context.inputValidator.sanitizeString(
									(draftData.name as string) || "",
								);
								const validatedDescription =
									context.inputValidator.sanitizeString(
										(draftData.description as string) || "",
									);
								const validatedCriteria = context.inputValidator.sanitizeString(
									(draftData.acceptance_criteria as string) || "",
								);

								const planData = {
									type: "plan" as const,
									slug: validatedSlug,
									name: validatedName,
									description: validatedDescription,
									criteria_id: (draftData.criteria_id as string) || undefined,
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
									priority:
										(draftData.priority as
											| "critical"
											| "high"
											| "medium"
											| "low") || "medium",
									acceptance_criteria: validatedCriteria,
									depends_on: (draftData.depends_on as string[]) || [],
									tasks: (draftData.tasks as unknown[]) || [],
								};

								// @ts-expect-error - Type system limitation
								result = await operations.createPlan(planData);
								break;
							}

							case "component": {
								const validatedSlug = context.inputValidator.validateSlug(
									(draftData.slug as string) || "",
								);
								const validatedName = context.inputValidator.sanitizeString(
									(draftData.name as string) || "",
								);
								const validatedDescription =
									context.inputValidator.sanitizeString(
										(draftData.description as string) || "",
									);
								const validatedFolder = context.inputValidator.sanitizeString(
									(draftData.folder as string) || ".",
								);

								const compData = {
									type:
										(draftData.type as "app" | "service" | "library") ||
										"service",
									slug: validatedSlug,
									name: validatedName,
									description: validatedDescription,
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
									folder: validatedFolder,
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
							await creationFlowHelper.deleteDraft(draft_id);
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
									draft_file: `.specs/.drafts/${draft_id}.draft.yml`,
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
			context,
		),
	);
}
