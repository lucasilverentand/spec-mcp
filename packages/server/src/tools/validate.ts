import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

/**
 * Parse validation errors grouped by field
 */
function parseValidationErrors(errors: string[]): Map<string, string[]> {
	const fieldErrors = new Map<string, string[]>();

	for (const error of errors) {
		// Check if error contains multiple field errors separated by commas
		if (error.includes(",") && error.includes(":")) {
			// Split by comma and process each part
			const parts = error.split(",").map((p) => p.trim());

			for (const part of parts) {
				// Extract field path and message
				const match = part.match(/^(.+?):\s*(.+)$/);
				if (match && match[1] && match[2]) {
					const field = match[1];
					const message = match[2];
					if (!fieldErrors.has(field)) {
						fieldErrors.set(field, []);
					}
					fieldErrors.get(field)?.push(message);
				}
			}
		} else {
			// Single error, try to extract field
			const match = error.match(/^(.+?):\s*(.+)$/);
			if (match && match[1] && match[2]) {
				const field = match[1];
				const message = match[2];
				if (!fieldErrors.has(field)) {
					fieldErrors.set(field, []);
				}
				fieldErrors.get(field)?.push(message);
			} else {
				// No field, use generic key
				if (!fieldErrors.has("_general")) {
					fieldErrors.set("_general", []);
				}
				fieldErrors.get("_general")?.push(error);
			}
		}
	}

	return fieldErrors;
}

/**
 * Format validation results for LLM consumption
 */
function formatValidationResults(validations: Array<{
	entity: { type: string; number: number; slug: string };
	errors: string[];
	warnings: string[];
}>): string {
	const output: string[] = [];

	for (const validation of validations) {
		const entity = validation.entity;
		const entityId = `${entity.type}-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
		const fileName = `${entity.slug}.yaml`;
		const hasErrors = validation.errors.length > 0;
		const hasWarnings = validation.warnings.length > 0;

		if (!hasErrors && !hasWarnings) {
			output.push(`✓ ${fileName} (${entityId}): Valid`);
			continue;
		}

		const status = hasErrors ? "✗ ERRORS" : "⚠ WARNINGS";
		output.push(`\n${status}: ${fileName} (${entityId})`);

		const errorFields = parseValidationErrors(validation.errors);
		const warningFields = parseValidationErrors(validation.warnings);
		const allFields = new Set([
			...errorFields.keys(),
			...warningFields.keys(),
		]);

		for (const field of allFields) {
			const fieldName = field === "_general" ? "general" : field;
			output.push(`  Field: ${fieldName}`);

			const errors = errorFields.get(field) || [];
			for (const error of errors) {
				output.push(`    ERROR: ${error}`);
			}

			const warnings = warningFields.get(field) || [];
			for (const warning of warnings) {
				output.push(`    WARNING: ${warning}`);
			}
		}
	}

	return output.join("\n");
}

/**
 * Register validation tool
 */
export function registerValidateTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"validate",
		{
			title: "Validate Specifications",
			description:
				"Validate all specifications or specific entities. Returns structured validation results with errors and warnings grouped by field.",
			inputSchema: {
				entity_id: z
					.string()
					.optional()
					.describe(
						"Optional: Validate a specific entity by ID (e.g., 'req-001-auth')",
					),
			},
		},
		wrapToolHandler("validate", async (args) => {
			const { SpecService } = await import("@spec-mcp/core");
			const service = new SpecService({
				specsPath: operations.getManager().config.path ?? "./specs",
			});
			await service.initialize();

			// Get all entities
			const entitiesResult = await service.getAllEntities();
			if (!entitiesResult.success || !entitiesResult.data) {
				throw new Error("Failed to load entities");
			}

			const { requirements, plans, components } = entitiesResult.data;

			// If specific entity requested, validate only that one
			if (args.entity_id) {
				const allEntities = [...requirements, ...plans, ...components];
				const entity = allEntities.find((e) => {
					const id = `${e.type}-${e.number.toString().padStart(3, "0")}-${e.slug}`;
					return id === args.entity_id || e.slug === args.entity_id;
				});

				if (!entity) {
					throw new Error(`Entity not found: ${args.entity_id}`);
				}

				const result = await service.validateEntity(entity);
				const validation = {
					entity,
					errors: result.errors,
					warnings: result.warnings,
				};

				const formatted = formatValidationResults([validation]);
				const summary = `Validation Results for ${args.entity_id}\n\n${formatted}`;

				return {
					content: [
						{
							type: "text",
							text: summary,
						},
					],
				};
			}

			// Validate all entities
			const requirementValidations = await Promise.all(
				requirements.map(async (req) => {
					const result = await service.validateEntity(req);
					return {
						entity: req,
						errors: result.errors,
						warnings: result.warnings,
					};
				}),
			);

			const planValidations = await Promise.all(
				plans.map(async (plan) => {
					const result = await service.validateEntity(plan);
					return {
						entity: plan,
						errors: result.errors,
						warnings: result.warnings,
					};
				}),
			);

			const componentValidations = await Promise.all(
				components.map(async (component) => {
					const result = await service.validateEntity(component);
					return {
						entity: component,
						errors: result.errors,
						warnings: result.warnings,
					};
				}),
			);

			// Calculate summary statistics
			const totalErrors =
				requirementValidations.reduce(
					(sum, v) => sum + v.errors.length,
					0,
				) +
				planValidations.reduce((sum, v) => sum + v.errors.length, 0) +
				componentValidations.reduce((sum, v) => sum + v.errors.length, 0);

			const totalWarnings =
				requirementValidations.reduce(
					(sum, v) => sum + v.warnings.length,
					0,
				) +
				planValidations.reduce((sum, v) => sum + v.warnings.length, 0) +
				componentValidations.reduce((sum, v) => sum + v.warnings.length, 0);

			const validRequirements = requirementValidations.filter(
				(v) => v.errors.length === 0 && v.warnings.length === 0,
			).length;
			const validPlans = planValidations.filter(
				(v) => v.errors.length === 0 && v.warnings.length === 0,
			).length;
			const validComponents = componentValidations.filter(
				(v) => v.errors.length === 0 && v.warnings.length === 0,
			).length;

			// Format results
			const output: string[] = [];

			output.push("VALIDATION REPORT");
			output.push("=".repeat(60));
			output.push("");

			// Summary
			output.push("SUMMARY:");
			output.push(`  Total Errors: ${totalErrors}`);
			output.push(`  Total Warnings: ${totalWarnings}`);
			output.push(
				`  Requirements: ${requirements.length} total, ${validRequirements} valid`,
			);
			output.push(
				`  Plans: ${plans.length} total, ${validPlans} valid`,
			);
			output.push(
				`  Components: ${components.length} total, ${validComponents} valid`,
			);
			output.push("");

			// Requirements
			if (requirements.length > 0) {
				output.push("REQUIREMENTS:");
				output.push("-".repeat(60));
				output.push(formatValidationResults(requirementValidations));
				output.push("");
			}

			// Plans
			if (plans.length > 0) {
				output.push("PLANS:");
				output.push("-".repeat(60));
				output.push(formatValidationResults(planValidations));
				output.push("");
			}

			// Components
			if (components.length > 0) {
				output.push("COMPONENTS:");
				output.push("-".repeat(60));
				output.push(formatValidationResults(componentValidations));
				output.push("");
			}

			return {
				content: [
					{
						type: "text",
						text: output.join("\n"),
					},
				],
			};
		}, context),
	);
}
