import type { AnyEntity, ValidationResult } from "@spec-mcp/data";

/**
 * BusinessRulesValidator handles complex business rule validation
 * that goes beyond basic schema validation
 */
export class BusinessRulesValidator {
	async validateBusinessRules(entities: {
		requirements: AnyEntity[];
		plans: AnyEntity[];
		components: AnyEntity[];
	}): Promise<ValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Validate requirement priorities
			const criticalRequirements = entities.requirements.filter(
				(r) => "priority" in r && r.priority === "critical",
			);
			if (criticalRequirements.length === 0) {
				warnings.push(
					"No critical requirements defined - consider marking important requirements as critical",
				);
			}

			// Validate plan dependencies
			for (const plan of entities.plans) {
				if (
					"priority" in plan &&
					plan.priority === "critical" &&
					"depends_on" in plan &&
					Array.isArray(plan.depends_on) &&
					plan.depends_on.length === 0 &&
					entities.plans.length > 1
				) {
					warnings.push(
						`Critical plan '${plan.slug}' has no dependencies - verify if this is correct`,
					);
				}

				// Check for incomplete critical plans
				if (
					"priority" in plan &&
					plan.priority === "critical" &&
					"tasks" in plan &&
					Array.isArray(plan.tasks)
				) {
					const incompleteTasks = plan.tasks.filter(
						(t: unknown): t is { completed: boolean } =>
							typeof t === "object" &&
							t !== null &&
							"completed" in t &&
							!(t as { completed: boolean }).completed,
					);
					if (incompleteTasks.length > 0) {
						warnings.push(
							`Critical plan '${plan.slug}' has ${incompleteTasks.length} incomplete tasks`,
						);
					}
				}

				// Validate acceptance criteria
				if (
					!("acceptance_criteria" in plan) ||
					typeof plan.acceptance_criteria !== "string" ||
					plan.acceptance_criteria.trim().length === 0
				) {
					errors.push(`Plan '${plan.slug}' missing acceptance criteria`);
				}
			}

			// Validate plan-criteria linkage
			for (const plan of entities.plans) {
				if ("criteria_id" in plan && plan.criteria_id) {
					const criteriaExists = entities.requirements.some((req) =>
						"criteria" in req
							? req.criteria.some(
									(crit: { id: string }) => crit.id === plan.criteria_id,
								)
							: false,
					);

					if (!criteriaExists) {
						errors.push(
							`Plan '${plan.slug}' references non-existent criteria: ${plan.criteria_id}`,
						);
					}
				}
			}
		} catch (error) {
			errors.push(
				`Business rule validation failed: ${(error as Error).message}`,
			);
		}

		return {
			success: errors.length === 0,
			...(errors.length > 0 && { error: errors.join(", ") }),
			...(warnings.length > 0 && { warnings }),
			// Legacy format for backward compatibility
			valid: errors.length === 0,
			errors: errors,
		};
	}
}
