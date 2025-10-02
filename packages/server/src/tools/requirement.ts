import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import {
	DraftManager,
	StepValidator,
	getStepByOrder,
} from "@spec-mcp/core";
import { z } from "zod";
import {
	formatDeleteResult,
	formatListResult,
	formatResult,
} from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// Criterion schema
const CriterionSchema = z.object({
	id: z.string().regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/),
	description: z.string(),
});

const OperationSchema = z.enum([
	"create",
	"get",
	"update",
	"delete",
	"list",
	"start",
	"step",
	"finalize",
]);

// Global draft manager instance (in-memory)
const draftManager = new DraftManager();
const stepValidator = new StepValidator();

/**
 * Register consolidated requirement tool
 */
export function registerRequirementTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"requirement",
		{
			title: "Requirement",
			description:
				"Manage requirements with wizard-based creation or direct CRUD operations. Wizard mode (start/step/finalize) guides you through 7 structured steps for best practices. Direct mode (create) allows quick creation with all fields at once.",
			inputSchema: {
				operation: OperationSchema.describe(
					"Operation: 'start' begins wizard, 'step' advances through steps, 'finalize' completes wizard. Traditional: 'create', 'get', 'update', 'delete', 'list'",
				),
				// Common fields
				id: z
					.string()
					.optional()
					.describe("Requirement ID (required for get, update, delete)"),
				// Wizard fields
				draft_id: z
					.string()
					.optional()
					.describe(
						"Draft ID (returned from 'start', required for 'step' and 'finalize')",
					),
				data: z
					.record(z.unknown())
					.optional()
					.describe(
						"Data for current step (for 'step' operation). Field names depend on current step.",
					),
				// Create/Update fields
				slug: z.string().optional().describe("URL-friendly identifier"),
				name: z.string().optional().describe("Display name"),
				description: z.string().optional().describe("Detailed description"),
				priority: z
					.enum(["critical", "required", "ideal", "optional"])
					.optional()
					.describe("Priority level"),
				criteria: z
					.array(CriterionSchema)
					.optional()
					.describe("Acceptance criteria"),
				// List filters
				search: z.string().optional().describe("Search query"),
			},
		},
		wrapToolHandler(
			"requirement",
			async ({
				operation,
				id,
				draft_id,
				data: stepData,
				slug,
				name,
				description,
				priority,
				criteria,
				search,
			}) => {
				switch (operation) {
					case "start": {
						// Create a new draft for requirement creation
						const draft = draftManager.createDraft("requirement");
						const currentStep = getStepByOrder("requirement", 1);

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										draft_id: draft.id,
										step: 1,
										total_steps: 7,
										step_name: currentStep?.name,
										step_description: currentStep?.description,
										prompt: currentStep?.prompt,
										required_fields: currentStep?.required_fields || [],
										expires_at: draft.expires_at,
									}),
								},
							],
						};
					}

					case "step": {
						// Process a step in the wizard
						if (!draft_id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: draft_id",
										}),
									},
								],
								isError: true,
							};
						}

						const draft = draftManager.getDraft(draft_id);
						if (!draft) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: `Draft '${draft_id}' not found or expired`,
										}),
									},
								],
								isError: true,
							};
						}

						// Update draft with step data
						if (stepData) {
							draftManager.updateDraft(draft_id, stepData);
						}

						// Validate current step
						const currentStep = getStepByOrder(
							"requirement",
							draft.current_step,
						);
						if (!currentStep) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Invalid step",
										}),
									},
								],
								isError: true,
							};
						}

						const validation = stepValidator.validateStep(
							currentStep,
							draft.data,
						);
						draftManager.addValidationResult(draft_id, validation);

						// If validation fails, return errors without advancing
						if (!validation.passed) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											draft_id: draft.id,
											step: draft.current_step,
											total_steps: draft.total_steps,
											step_name: currentStep.name,
											validation,
											current_data: draft.data,
										}),
									},
								],
								isError: true,
							};
						}

						// Advance to next step
						const updatedDraft = draftManager.advanceStep(draft_id);
						if (!updatedDraft) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Failed to advance step",
										}),
									},
								],
								isError: true,
							};
						}

						// Get next step info
						const nextStep = getStepByOrder(
							"requirement",
							updatedDraft.current_step,
						);

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										draft_id: updatedDraft.id,
										step: updatedDraft.current_step,
										total_steps: updatedDraft.total_steps,
										step_name: nextStep?.name,
										step_description: nextStep?.description,
										prompt: nextStep?.prompt,
										required_fields: nextStep?.required_fields || [],
										current_data: updatedDraft.data,
										validation,
										completed: updatedDraft.current_step > updatedDraft.total_steps,
									}),
								},
							],
						};
					}

					case "finalize": {
						// Finalize and create the requirement
						if (!draft_id) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: "Missing required field: draft_id",
										}),
									},
								],
								isError: true,
							};
						}

						const draft = draftManager.getDraft(draft_id);
						if (!draft) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: `Draft '${draft_id}' not found or expired`,
										}),
									},
								],
								isError: true,
							};
						}

						// Validate all required fields are present
						const finalValidation = stepValidator.validateForFinalization(
							"requirement",
							draft.data,
						);

						if (!finalValidation.passed) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											draft_id: draft.id,
											validation: finalValidation,
										}),
									},
								],
								isError: true,
							};
						}

						// Create the requirement
						const requirementData = {
							type: "requirement" as const,
							slug: context.inputValidator.validateSlug(draft.data.slug as string),
							name: context.inputValidator.sanitizeString(draft.data.name as string),
							description: context.inputValidator.sanitizeString(
								draft.data.description as string,
							),
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							priority: draft.data.priority as
								| "critical"
								| "required"
								| "ideal"
								| "optional",
							criteria: draft.data.criteria as Array<{
								id: string;
								description: string;
							}>,
						};

						// @ts-expect-error - Type system limitation
						const result = await operations.createRequirement(requirementData);

						// Clean up draft
						draftManager.deleteDraft(draft_id);

						return formatResult(result);
					}

					case "create": {
						if (!slug || !name || !description || !priority || !criteria) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												"Missing required fields for create: slug, name, description, priority, criteria",
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
							type: "requirement" as const,
							slug: validatedSlug,
							name: validatedName,
							description: validatedDescription,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
							priority,
							criteria,
						};
						// @ts-expect-error - Type system limitation
						const result = await operations.createRequirement(data);
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
						const result = await operations.getRequirement(validatedId);
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
						if (priority) updateData.priority = priority;
						if (criteria) updateData.criteria = criteria;

						const result = await operations.updateRequirement(
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
						const result = await operations.deleteRequirement(validatedId);
						return formatDeleteResult(result, "requirement", validatedId);
					}

					case "list": {
						const filter: Record<string, string> = {};
						if (priority) filter.priority = priority;
						if (search) {
							filter.search = context.inputValidator.sanitizeString(search);
						}

						const result = await operations.listRequirements(
							Object.keys(filter).length > 0 ? filter : undefined,
						);
						return formatListResult(result, "requirement");
					}
				}
			},
			context,
		),
	);
}
