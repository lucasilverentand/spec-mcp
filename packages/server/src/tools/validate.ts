import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import {
	type AnyEntity,
	computeEntityId,
	type EntityType,
} from "@spec-mcp/data";
import { z } from "zod";
import type { ServerConfig } from "../config/index.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";

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
				if (match?.[1] && match[2]) {
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
			if (match?.[1] && match[2]) {
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
function formatValidationResults(
	validations: Array<{
		entity: AnyEntity;
		errors: string[];
		warnings: string[];
	}>,
): string {
	const output: string[] = [];

	for (const validation of validations) {
		const entity = validation.entity;
		const entityId = computeEntityId(
			entity.type as EntityType,
			entity.number,
			entity.slug,
		);
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
		const allFields = new Set([...errorFields.keys(), ...warningFields.keys()]);

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
	_config: ServerConfig,
) {
	server.registerTool(
		"validate",
		{
			title: "Validate Specifications",
			description:
				"Check specifications for errors, broken references, and circular dependencies.\n\n" +
				"Examples:\n" +
				"• Validate all: { check_references: true, check_cycles: true }\n" +
				"• Validate one: { entity_id: 'req-001-auth' }\n" +
				"• With health score: { include_health: true }",
			inputSchema: {
				entity_id: z
					.string()
					.optional()
					.describe(
						"Optional: Validate a specific entity by ID (e.g., 'req-001-auth')",
					),
				check_references: z
					.boolean()
					.optional()
					.default(true)
					.describe("Check for broken references between entities"),
				check_cycles: z
					.boolean()
					.optional()
					.default(true)
					.describe("Check for circular dependencies"),
				include_health: z
					.boolean()
					.optional()
					.default(false)
					.describe("Include overall system health score"),
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

			// Check references if requested
			let referenceErrors: string[] = [];
			if (args.check_references !== false) {
				const refResult = await service.validateReferences();
				if (!refResult.valid) {
					referenceErrors = refResult.errors.filter((e) =>
						e.toLowerCase().includes("reference"),
					);
				}
			}

			// Check cycles if requested
			let cycleErrors: string[] = [];
			if (args.check_cycles !== false) {
				const cycleResult = await operations.detectCycles();
				if (
					cycleResult.success &&
					cycleResult.data &&
					cycleResult.data.hasCycles
				) {
					cycleErrors = cycleResult.data.cycles.map(
						(cycle: string[], index: number) =>
							`Circular dependency ${index + 1}: ${cycle.join(" → ")}`,
					);
				}
			}

			// If specific entity requested, validate only that one
			if (args.entity_id) {
				const allEntities: AnyEntity[] = [
					...(requirements as AnyEntity[]),
					...(plans as AnyEntity[]),
					...(components as AnyEntity[]),
				];
				const entity = allEntities.find((e) => {
					const id = computeEntityId(e.type as EntityType, e.number, e.slug);
					return id === args.entity_id || e.slug === args.entity_id;
				});

				if (!entity) {
					throw new Error(`Entity not found: ${args.entity_id}`);
				}

				const result = await service.validateEntity(entity);
				const validation = {
					entity,
					errors: result.errors,
					warnings: result.warnings || [],
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
				(requirements as AnyEntity[]).map(async (req) => {
					const result = await service.validateEntity(req);
					return {
						entity: req,
						errors: result.errors,
						warnings: result.warnings || [],
					};
				}),
			);

			const planValidations = await Promise.all(
				(plans as AnyEntity[]).map(async (plan) => {
					const result = await service.validateEntity(plan);
					return {
						entity: plan,
						errors: result.errors,
						warnings: result.warnings || [],
					};
				}),
			);

			const componentValidations = await Promise.all(
				(components as AnyEntity[]).map(async (component) => {
					const result = await service.validateEntity(component);
					return {
						entity: component,
						errors: result.errors,
						warnings: result.warnings || [],
					};
				}),
			);

			// Calculate summary statistics
			const totalErrors =
				requirementValidations.reduce((sum, v) => sum + v.errors.length, 0) +
				planValidations.reduce((sum, v) => sum + v.errors.length, 0) +
				componentValidations.reduce((sum, v) => sum + v.errors.length, 0) +
				referenceErrors.length +
				cycleErrors.length;

			const totalWarnings =
				requirementValidations.reduce((sum, v) => sum + v.warnings.length, 0) +
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

			// Get health score if requested
			let healthScore = null;
			if (args.include_health) {
				const healthResult = await operations.getHealthScore();
				if (healthResult.success && healthResult.data) {
					healthScore = healthResult.data;
				}
			}

			// Summary
			output.push("SUMMARY:");
			output.push(`  Total Errors: ${totalErrors}`);
			output.push(`  Total Warnings: ${totalWarnings}`);
			if (referenceErrors.length > 0) {
				output.push(`  Reference Errors: ${referenceErrors.length}`);
			}
			if (cycleErrors.length > 0) {
				output.push(`  Circular Dependencies: ${cycleErrors.length}`);
			}
			if (healthScore) {
				const status =
					healthScore.overall >= 80
						? "Healthy"
						: healthScore.overall >= 60
							? "Needs Attention"
							: "Critical";
				output.push(`  Health Score: ${healthScore.overall}/100 (${status})`);
			}
			output.push(
				`  Requirements: ${requirements.length} total, ${validRequirements} valid`,
			);
			output.push(`  Plans: ${plans.length} total, ${validPlans} valid`);
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

			// Reference errors
			if (referenceErrors.length > 0) {
				output.push("REFERENCE ERRORS:");
				output.push("-".repeat(60));
				for (const error of referenceErrors) {
					output.push(`  ✗ ${error}`);
				}
				output.push("");
			}

			// Cycle errors
			if (cycleErrors.length > 0) {
				output.push("CIRCULAR DEPENDENCIES:");
				output.push("-".repeat(60));
				for (const error of cycleErrors) {
					output.push(`  ✗ ${error}`);
				}
				output.push("");
			}

			// Health breakdown
			if (healthScore) {
				output.push("HEALTH BREAKDOWN:");
				output.push("-".repeat(60));
				output.push(`  Coverage: ${healthScore.breakdown.coverage}/100`);
				output.push(
					`  Dependencies: ${healthScore.breakdown.dependencies}/100`,
				);
				output.push(`  Validation: ${healthScore.breakdown.validation}/100`);
				output.push("");
				if (healthScore.recommendations.length > 0) {
					output.push("  Recommendations:");
					for (const rec of healthScore.recommendations) {
						output.push(`    - ${rec}`);
					}
					output.push("");
				}
			}

			return {
				content: [
					{
						type: "text",
						text: output.join("\n"),
					},
				],
			};
		}),
	);
}
