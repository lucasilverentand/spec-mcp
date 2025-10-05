import type {
	AnyComponent,
	AnyEntity,
	Plan,
	Requirement,
} from "@spec-mcp/data";
import { SpecsManager } from "@spec-mcp/data";
import type { SpecConfig } from "../../shared/types/config.js";
import { toDataConfig } from "../../shared/types/config.js";
import type { ValidationResult } from "../../shared/types/results.js";

export interface ReferenceValidationOptions {
	checkExistence?: boolean;
	checkCycles?: boolean;
	checkOrphans?: boolean;
	allowSelfReferences?: boolean;
}

export class ReferenceValidator {
	private manager: SpecsManager;

	constructor(config: SpecConfig = {}) {
		this.manager = new SpecsManager(toDataConfig(config));
	}

	async validateEntityReferences(
		entity: AnyEntity,
		options: ReferenceValidationOptions = {},
	): Promise<ValidationResult> {
		const {
			checkExistence = true,
			checkCycles = true,
			checkOrphans = false,
			allowSelfReferences = false,
		} = options;

		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Get current entities for reference checking
			const { requirements, plans, components } =
				await this.manager.getAllEntities();

			// Validate based on entity type
			switch (entity.type) {
				case "requirement":
					await this.validateRequirementReferences(
						entity,
						plans,
						{ checkExistence, allowSelfReferences },
						errors,
						warnings,
					);
					break;

				case "plan":
					if (entity.type === "plan") {
						await this.validatePlanReferences(
							entity,
							requirements,
							plans,
							components,
							{ checkExistence, checkCycles, allowSelfReferences },
							errors,
							warnings,
						);
					}
					break;

				case "app":
				case "service":
				case "library":
					if (
						entity.type === "app" ||
						entity.type === "service" ||
						entity.type === "library"
					) {
						await this.validateComponentReferences(
							entity,
							components,
							{ checkExistence, checkCycles, allowSelfReferences },
							errors,
							warnings,
						);
					}
					break;
			}

			// Check for orphan references if requested
			if (checkOrphans) {
				await this.checkOrphanReferences(
					entity,
					requirements,
					plans,
					components,
					warnings,
				);
			}
		} catch (error) {
			errors.push(
				error instanceof Error ? error.message : "Reference validation failed",
			);
		}

		return {
			success: errors.length === 0,
			valid: errors.length === 0,
			errors,
			warnings,
			...(errors.length > 0 && { error: errors.join(", ") }),
		};
	}

	async validateAllReferences(
		_options: ReferenceValidationOptions = {},
	): Promise<ValidationResult> {
		try {
			const result: unknown = await this.manager.validateReferences();
			// Transform the result to match ValidationResult interface
			const resultObj =
				typeof result === "object" && result !== null
					? (result as {
							valid?: boolean;
							success?: boolean;
							errors?: string[];
							error?: string;
							warnings?: string[];
						})
					: {};
			const isValid = resultObj.valid ?? resultObj.success ?? false;
			const errors =
				resultObj.errors ?? (resultObj.error ? [resultObj.error] : []);
			const warnings = resultObj.warnings ?? [];
			return {
				success: isValid,
				valid: isValid,
				errors,
				warnings,
				...(errors.length > 0 && { error: errors.join(", ") }),
			};
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Reference validation failed";
			return {
				success: false,
				valid: false,
				errors: [errorMsg],
				error: errorMsg,
			};
		}
	}

	async findBrokenReferences(): Promise<{
		requirements: Array<{ id: string; brokenRefs: string[] }>;
		plans: Array<{ id: string; brokenRefs: string[] }>;
		components: Array<{ id: string; brokenRefs: string[] }>;
	}> {
		const { requirements, plans, components } =
			await this.manager.getAllEntities();
		const brokenRefs = {
			requirements: [] as Array<{ id: string; brokenRefs: string[] }>,
			plans: [] as Array<{ id: string; brokenRefs: string[] }>,
			components: [] as Array<{ id: string; brokenRefs: string[] }>,
		};

		// Check requirement references - verify that criteria are referenced by plans
		for (const requirement of requirements) {
			const reqId = this.getRequirementId(requirement);
			const broken: string[] = [];

			// Note: In the new model, requirements don't directly reference plans
			// Instead, plans reference criteria via criteria_id
			// No broken references to check here for requirements

			if (broken.length > 0) {
				brokenRefs.requirements.push({ id: reqId, brokenRefs: broken });
			}
		}

		// Check plan references
		for (const plan of plans) {
			const planId = this.getPlanId(plan);
			const broken: string[] = [];

			// Check criteria_id reference to requirement criteria
			if (plan.criteria_id) {
				const criteriaExists = requirements.some((req) =>
					req.criteria.some((crit) => crit.id === plan.criteria_id),
				);
				if (!criteriaExists) {
					broken.push(plan.criteria_id);
				}
			}

			// Check plan dependencies
			for (const depId of plan.depends_on) {
				const depExists = plans.some((p) => this.getPlanId(p) === depId);
				if (!depExists) {
					broken.push(depId);
				}
			}

			// Check test case component references
			for (const testCase of plan.test_cases) {
				for (const componentId of testCase.components) {
					const componentExists = components.some(
						(c) => this.getComponentId(c) === componentId,
					);
					if (!componentExists) {
						broken.push(componentId);
					}
				}
			}

			if (broken.length > 0) {
				brokenRefs.plans.push({ id: planId, brokenRefs: broken });
			}
		}

		// Check component references
		for (const component of components) {
			const componentId = this.getComponentId(component);
			const broken: string[] = [];

			for (const depId of component.depends_on) {
				const depExists = components.some(
					(c) => this.getComponentId(c) === depId,
				);
				if (!depExists) {
					broken.push(depId);
				}
			}

			if (broken.length > 0) {
				brokenRefs.components.push({ id: componentId, brokenRefs: broken });
			}
		}

		return brokenRefs;
	}

	async suggestReferenceFixes(entity: AnyEntity): Promise<{
		missingReferences: Array<{
			reference: string;
			suggestions: string[];
		}>;
		cyclicReferences: Array<{
			cycle: string[];
			suggestions: string[];
		}>;
	}> {
		const { plans, components } = await this.manager.getAllEntities();
		const fixes = {
			missingReferences: [] as Array<{
				reference: string;
				suggestions: string[];
			}>,
			cyclicReferences: [] as Array<{ cycle: string[]; suggestions: string[] }>,
		};

		// Find missing references and suggest alternatives
		if (entity.type === "requirement") {
			// Note: In the new model, requirements don't directly reference plans
			// Instead, plans reference criteria via criteria_id
			// No missing references to check here for requirements
		}

		if (entity.type === "plan") {
			for (const depId of entity.depends_on) {
				const depExists = plans.some((p) => this.getPlanId(p) === depId);
				if (!depExists) {
					const suggestions = this.findSimilarPlanIds(depId, plans);
					fixes.missingReferences.push({
						reference: depId,
						suggestions,
					});
				}
			}
		}

		if (
			entity.type === "app" ||
			entity.type === "service" ||
			entity.type === "library"
		) {
			for (const depId of entity.depends_on) {
				const depExists = components.some(
					(c) => this.getComponentId(c) === depId,
				);
				if (!depExists) {
					const suggestions = this.findSimilarComponentIds(depId, components);
					fixes.missingReferences.push({
						reference: depId,
						suggestions,
					});
				}
			}
		}

		return fixes;
	}

	async validateReferenceFormat(
		reference: string,
		expectedType: string,
	): Promise<ValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		const patterns = {
			requirement: /^req-\d{3}-[a-z0-9-]+$/,
			plan: /^pln-\d{3}-[a-z0-9-]+$/,
			component: /^(app|svc|lib)-\d{3}-[a-z0-9-]+$/,
			criteria: /^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/,
			task: /^task-\d{3}-[a-z0-9-]+$/,
			flow: /^flow-\d{3}-[a-z0-9-]+$/,
			test: /^test-\d{3}-[a-z0-9-]+$/,
		};

		const pattern = patterns[expectedType as keyof typeof patterns];
		if (!pattern) {
			errors.push(`Unknown reference type: ${expectedType}`);
		} else if (!pattern.test(reference)) {
			errors.push(`Invalid ${expectedType} reference format: ${reference}`);
			warnings.push(`Expected format: ${pattern.source}`);
		}

		return {
			success: errors.length === 0,
			valid: errors.length === 0,
			errors,
			warnings,
			...(errors.length > 0 && { error: errors.join(", ") }),
		};
	}

	private async validateRequirementReferences(
		_requirement: Requirement,
		_plans: Plan[],
		_options: { checkExistence: boolean; allowSelfReferences: boolean },
		_errors: string[],
		_warnings: string[],
	): Promise<void> {
		// Note: In the new model, requirements don't directly reference plans
		// Instead, plans reference criteria via criteria_id
		// No references to validate here for requirements
	}

	private async validatePlanReferences(
		plan: Plan,
		requirements: Requirement[],
		plans: Plan[],
		components: AnyComponent[],
		options: {
			checkExistence: boolean;
			checkCycles: boolean;
			allowSelfReferences: boolean;
		},
		errors: string[],
		_warnings: string[],
	): Promise<void> {
		const planId = this.getPlanId(plan);

		// Check criteria_id reference
		if (options.checkExistence && plan.criteria_id) {
			const criteriaExists = requirements.some((req) =>
				req.criteria.some((crit) => crit.id === plan.criteria_id),
			);
			if (!criteriaExists) {
				errors.push(
					`Plan '${planId}' references non-existent criteria '${plan.criteria_id}'`,
				);
			}
		}

		// Check plan dependencies
		if (options.checkExistence) {
			for (const depId of plan.depends_on) {
				if (!options.allowSelfReferences && depId === planId) {
					errors.push(`Plan cannot depend on itself: ${depId}`);
					continue;
				}

				const depExists = plans.some((p) => this.getPlanId(p) === depId);
				if (!depExists) {
					errors.push(`Plan depends on non-existent plan '${depId}'`);
				}
			}
		}

		// Check cycles
		if (options.checkCycles) {
			const hasCycle = await this.checkPlanCycle(
				planId,
				plan.depends_on,
				plans,
			);
			if (hasCycle) {
				errors.push("Creating this plan would create a cyclical dependency");
			}
		}

		// Check test case component references
		if (options.checkExistence) {
			for (const testCase of plan.test_cases) {
				for (const componentId of testCase.components) {
					const componentExists = components.some(
						(c) => this.getComponentId(c) === componentId,
					);
					if (!componentExists) {
						errors.push(
							`Test case '${testCase.id}' references non-existent component '${componentId}'`,
						);
					}
				}
			}
		}

		// Check internal flow references
		for (const flow of plan.flows) {
			const stepIds = flow.steps.map((s) => s.id);
			for (const step of flow.steps) {
				for (const nextStepId of step.next_steps) {
					if (!stepIds.includes(nextStepId)) {
						errors.push(
							`Flow '${flow.id}' step '${step.id}' references non-existent step '${nextStepId}'`,
						);
					}
				}
			}
		}

		// Check internal task dependencies
		for (const task of plan.tasks) {
			const taskIds = plan.tasks.map((t) => t.id);
			for (const depId of task.depends_on) {
				if (!taskIds.includes(depId)) {
					errors.push(
						`Task '${task.id}' depends on non-existent task '${depId}'`,
					);
				}
			}
		}
	}

	private async validateComponentReferences(
		component: AnyComponent,
		components: AnyComponent[],
		options: {
			checkExistence: boolean;
			checkCycles: boolean;
			allowSelfReferences: boolean;
		},
		errors: string[],
		_warnings: string[],
	): Promise<void> {
		const componentId = this.getComponentId(component);

		if (options.checkExistence) {
			for (const depId of component.depends_on) {
				if (!options.allowSelfReferences && depId === componentId) {
					errors.push(`Component cannot depend on itself: ${depId}`);
					continue;
				}

				const depExists = components.some(
					(c) => this.getComponentId(c) === depId,
				);
				if (!depExists) {
					errors.push(`Component depends on non-existent component '${depId}'`);
				}
			}
		}

		if (options.checkCycles) {
			const hasCycle = await this.checkComponentCycle(
				componentId,
				component.depends_on,
				components,
			);
			if (hasCycle) {
				errors.push(
					"Creating this component would create a cyclical dependency",
				);
			}
		}
	}

	private async checkOrphanReferences(
		entity: AnyEntity,
		requirements: Requirement[],
		plans: Plan[],
		components: AnyComponent[],
		warnings: string[],
	): Promise<void> {
		// Check if entity is referenced by others
		const entityId = this.getEntityId(entity);

		if (entity.type === "plan") {
			const isReferenced =
				plans.some((p) => p.depends_on.includes(entityId)) ||
				(entity.type === "plan" &&
					entity.criteria_id &&
					requirements.some((req) =>
						req.criteria.some((c) => c.id === entity.criteria_id),
					));

			if (!isReferenced) {
				warnings.push(
					"This plan is not referenced by any other plan and does not fulfill any criteria",
				);
			}
		}

		if (["app", "service", "library"].includes(entity.type)) {
			const isReferenced =
				plans.some((p) =>
					p.test_cases.some((tc) => tc.components.includes(entityId)),
				) || components.some((c) => c.depends_on.includes(entityId));

			if (!isReferenced) {
				warnings.push(
					"This component is not referenced by any plan or other component",
				);
			}
		}
	}

	private async checkPlanCycle(
		_planId: string,
		dependencies: string[],
		allPlans: Plan[],
	): Promise<boolean> {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const hasCycle = (currentId: string): boolean => {
			if (recursionStack.has(currentId)) {
				return true;
			}
			if (visited.has(currentId)) {
				return false;
			}

			visited.add(currentId);
			recursionStack.add(currentId);

			const plan = allPlans.find((p) => this.getPlanId(p) === currentId);
			if (plan) {
				for (const depId of plan.depends_on) {
					if (hasCycle(depId)) {
						return true;
					}
				}
			}

			recursionStack.delete(currentId);
			return false;
		};

		// Check if adding these dependencies would create a cycle
		for (const depId of dependencies) {
			if (hasCycle(depId)) {
				return true;
			}
		}

		return false;
	}

	private async checkComponentCycle(
		_componentId: string,
		dependencies: string[],
		allComponents: AnyComponent[],
	): Promise<boolean> {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const hasCycle = (currentId: string): boolean => {
			if (recursionStack.has(currentId)) {
				return true;
			}
			if (visited.has(currentId)) {
				return false;
			}

			visited.add(currentId);
			recursionStack.add(currentId);

			const component = allComponents.find(
				(c) => this.getComponentId(c) === currentId,
			);
			if (component) {
				for (const depId of component.depends_on) {
					if (hasCycle(depId)) {
						return true;
					}
				}
			}

			recursionStack.delete(currentId);
			return false;
		};

		for (const depId of dependencies) {
			if (hasCycle(depId)) {
				return true;
			}
		}

		return false;
	}

	private findSimilarPlanIds(targetId: string, plans: Plan[]): string[] {
		return plans
			.map((p) => this.getPlanId(p))
			.filter((id) => this.calculateSimilarity(id, targetId) > 0.6)
			.sort(
				(a, b) =>
					this.calculateSimilarity(b, targetId) -
					this.calculateSimilarity(a, targetId),
			)
			.slice(0, 3);
	}

	private findSimilarComponentIds(
		targetId: string,
		components: AnyComponent[],
	): string[] {
		return components
			.map((c) => this.getComponentId(c))
			.filter((id) => this.calculateSimilarity(id, targetId) > 0.6)
			.sort(
				(a, b) =>
					this.calculateSimilarity(b, targetId) -
					this.calculateSimilarity(a, targetId),
			)
			.slice(0, 3);
	}

	private calculateSimilarity(a: string, b: string): number {
		const maxLength = Math.max(a.length, b.length);
		if (maxLength === 0) return 1;

		const distance = this.levenshteinDistance(a, b);
		return 1 - distance / maxLength;
	}

	private levenshteinDistance(a: string, b: string): number {
		const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
			Array.from({ length: a.length + 1 }, () => 0),
		);

		// Initialize first column
		for (let i = 0; i <= b.length; i++) {
			matrix[i]![0] = i;
		}

		// Initialize first row
		for (let j = 0; j <= a.length; j++) {
			matrix[0]![j] = j;
		}

		// Fill the matrix
		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i]![j] = matrix[i - 1]![j - 1]!;
				} else {
					matrix[i]![j] = Math.min(
						matrix[i - 1]![j - 1]! + 1,
						matrix[i]![j - 1]! + 1,
						matrix[i - 1]![j]! + 1,
					);
				}
			}
		}

		return matrix[b.length]![a.length]!;
	}

	private getRequirementId(requirement: Requirement): string {
		return `req-${requirement.number.toString().padStart(3, "0")}-${requirement.slug}`;
	}

	private getPlanId(plan: Plan): string {
		return `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;
	}

	private getComponentId(component: AnyComponent): string {
		const typeMap: Record<string, string> = {
			app: "app",
			service: "svc",
			library: "lib",
		};

		const prefix = typeMap[component.type];
		return `${prefix}-${component.number.toString().padStart(3, "0")}-${component.slug}`;
	}

	private getEntityId(entity: AnyEntity): string {
		switch (entity.type) {
			case "requirement":
				return this.getRequirementId(entity);
			case "plan":
				return this.getPlanId(entity);
			case "constitution":
				// Constitutions follow same ID pattern as components
				return `con-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
			case "decision":
				// Decisions follow same ID pattern
				return `dec-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
			default:
				return this.getComponentId(entity);
		}
	}
}
