import type { AnyEntity } from "@spec-mcp/data";
import { SpecsManager } from "@spec-mcp/data";
import type { SpecConfig } from "../interfaces/config.js";
import type { ValidationResult } from "../interfaces/results.js";
import type { IValidationEngine, IValidator } from "../interfaces/validator.js";

export class ValidationEngine implements IValidationEngine {
	private manager: SpecsManager;
	private config: Partial<SpecConfig>;
	private validators = new Map<string, IValidator>();

	constructor(config: Partial<SpecConfig> = {}) {
		this.config = config;
		this.manager = new SpecsManager(config);
	}

	configure(config: Partial<SpecConfig>): void {
		this.config = { ...this.config, ...config };
		this.manager = new SpecsManager(this.config);
	}

	async validateEntity(entity: AnyEntity): Promise<ValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];
		const timestamp = new Date();

		try {
			// Use registered validators
			for (const validator of this.validators.values()) {
				if (validator.supports(entity)) {
					const result = await validator.validate(entity);
					errors.push(...result.errors);
					warnings.push(...result.warnings);
				}
			}

			// If no specific validators, use default validation
			if (this.validators.size === 0) {
				try {
					await this.manager.validateEntityReferences(entity);
				} catch (error) {
					errors.push(
						error instanceof Error ? error.message : "Entity validation failed",
					);
				}
			}

			return {
				valid: errors.length === 0,
				errors,
				warnings,
				timestamp,
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					error instanceof Error
						? error.message
						: "Entity validation failed with unknown error",
				],
				warnings,
				timestamp,
			};
		}
	}

	async validateAll(): Promise<ValidationResult> {
		try {
			const { requirements, plans, components } =
				await this.manager.getAllEntities();
			const allEntities: AnyEntity[] = [
				...requirements,
				...plans,
				...components,
			];

			const results = await Promise.all(
				allEntities.map((entity) => this.validateEntity(entity)),
			);

			const allErrors = results.flatMap((r) => r.errors);
			const allWarnings = results.flatMap((r) => r.warnings);

			return {
				valid: allErrors.length === 0,
				errors: allErrors,
				warnings: allWarnings,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					error instanceof Error
						? error.message
						: "Failed to validate all entities",
				],
				warnings: [],
				timestamp: new Date(),
			};
		}
	}

	async validateReferences(): Promise<ValidationResult> {
		try {
			const result = await this.manager.validateReferences();
			return {
				valid: result.success,
				errors: result.errors || [],
				warnings: result.warnings || [],
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					error instanceof Error
						? error.message
						: "Reference validation failed",
				],
				warnings: [],
				timestamp: new Date(),
			};
		}
	}

	async validateBusinessRules(): Promise<ValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];
		const timestamp = new Date();

		try {
			const { requirements, plans, components } =
				await this.manager.getAllEntities();

			// Validate requirement priorities
			const criticalRequirements = requirements.filter(
				(r) => r.priority === "critical",
			);
			if (criticalRequirements.length === 0) {
				warnings.push(
					"No critical requirements defined - consider marking important requirements as critical",
				);
			}

			// Validate requirement coverage
			for (const requirement of requirements) {
				const hasLinkedPlans = requirement.criteria.some(
					(criteria: { plan_id: string }) => {
						return plans.some(
							(plan) =>
								`pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}` ===
								criteria.plan_id,
						);
					},
				);

				if (!hasLinkedPlans) {
					errors.push(
						`Requirement '${requirement.slug}' has no linked implementation plans`,
					);
				}
			}

			// Validate plan dependencies
			for (const plan of plans) {
				if (
					plan.priority === "critical" &&
					plan.depends_on.length === 0 &&
					plans.length > 1
				) {
					warnings.push(
						`Critical plan '${plan.slug}' has no dependencies - verify if this is correct`,
					);
				}

				// Check for incomplete critical plans
				if (plan.priority === "critical" && !plan.completed) {
					const incompleteTasks = plan.tasks.filter(
						(t: { completed: boolean }) => !t.completed,
					);
					if (incompleteTasks.length > 0) {
						warnings.push(
							`Critical plan '${plan.slug}' has ${incompleteTasks.length} incomplete tasks`,
						);
					}
				}

				// Validate acceptance criteria
				if (
					!plan.acceptance_criteria ||
					plan.acceptance_criteria.trim().length === 0
				) {
					errors.push(`Plan '${plan.slug}' missing acceptance criteria`);
				}

				// Validate test cases
				if (!plan.test_cases || plan.test_cases.length === 0) {
					warnings.push(`Plan '${plan.slug}' has no test cases defined`);
				}
			}

			// Validate components
			for (const component of components) {
				// Check if component has proper documentation
				if (
					!component.description ||
					component.description.trim().length < 10
				) {
					warnings.push(
						`Component '${component.slug}' has insufficient description`,
					);
				}

				// Validate component dependencies exist
				for (const depId of component.depends_on) {
					const dependencyExists = components.some((c) => {
						const componentId = this.getComponentId(c);
						return componentId === depId;
					});

					if (!dependencyExists) {
						errors.push(
							`Component '${component.slug}' depends on non-existent component '${depId}'`,
						);
					}
				}
			}

			// Check for circular dependencies in components
			const componentCycles = this.detectComponentCycles(components);
			for (const cycle of componentCycles) {
				errors.push(
					`Circular dependency detected in components: ${cycle.join(" -> ")}`,
				);
			}

			return {
				valid: errors.length === 0,
				errors,
				warnings,
				timestamp,
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					error instanceof Error
						? error.message
						: "Business rule validation failed",
				],
				warnings,
				timestamp,
			};
		}
	}

	async runFullValidation(): Promise<ValidationResult> {
		try {
			const [entityValidation, referenceValidation, businessValidation] =
				await Promise.all([
					this.validateAll(),
					this.validateReferences(),
					this.validateBusinessRules(),
				]);

			const allErrors = [
				...entityValidation.errors,
				...referenceValidation.errors,
				...businessValidation.errors,
			];

			const allWarnings = [
				...entityValidation.warnings,
				...referenceValidation.warnings,
				...businessValidation.warnings,
			];

			return {
				valid: allErrors.length === 0,
				errors: allErrors,
				warnings: allWarnings,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					error instanceof Error ? error.message : "Full validation failed",
				],
				warnings: [],
				timestamp: new Date(),
			};
		}
	}

	registerValidator(validator: IValidator): void {
		this.validators.set(validator.name, validator);
	}

	removeValidator(name: string): void {
		this.validators.delete(name);
	}

	getValidators(): IValidator[] {
		return Array.from(this.validators.values());
	}

	private detectComponentCycles(
		components: Array<{
			type: string;
			number: number;
			slug: string;
			depends_on?: string[];
		}>,
	): string[][] {
		const cycles: string[][] = [];
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const adjacencyList = new Map<string, string[]>();

		// Build adjacency list
		for (const component of components) {
			const componentId = this.getComponentId(component);
			adjacencyList.set(componentId, component.depends_on || []);
		}

		// DFS to detect cycles
		const dfs = (nodeId: string, path: string[]): void => {
			if (recursionStack.has(nodeId)) {
				// Found a cycle
				const cycleStart = path.indexOf(nodeId);
				if (cycleStart !== -1) {
					cycles.push([...path.slice(cycleStart), nodeId]);
				}
				return;
			}

			if (visited.has(nodeId)) {
				return;
			}

			visited.add(nodeId);
			recursionStack.add(nodeId);

			const dependencies = adjacencyList.get(nodeId) || [];
			for (const depId of dependencies) {
				dfs(depId, [...path, nodeId]);
			}

			recursionStack.delete(nodeId);
		};

		for (const component of components) {
			const componentId = this.getComponentId(component);
			if (!visited.has(componentId)) {
				dfs(componentId, []);
			}
		}

		return cycles;
	}

	private getComponentId(component: {
		type: string;
		number: number;
		slug: string;
	}): string {
		switch (component.type) {
			case "app":
				return `app-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			case "service":
				return `svc-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			case "library":
				return `lib-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			case "tool":
				return `tol-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			default:
				return `cmp-${component.number.toString().padStart(3, "0")}-${component.slug}`;
		}
	}
}
