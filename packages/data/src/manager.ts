import z from "zod";
import { ComponentIdSchema } from "./entities/components/component.js";
import { PlanIdSchema } from "./entities/plans/plan.js";
import { RequirementIdSchema } from "./entities/requirements/requirement.js";
import { EntityManager } from "./managers/entity-manager.js";
import type {
	AnyComponent,
	ComponentFilter,
	PlanFilter,
	RequirementFilter,
} from "./managers/types.js";
import {
	ComponentFilterSchema,
	PlanFilterSchema,
	RequirementFilterSchema,
} from "./managers/types.js";
import type { ValidationResult } from "./managers/validation-manager.js";

export const SpecsManagerConfig = z.object({
	path: z.string().nonempty().optional(),
	autoDetect: z
		.boolean()
		.default(true)
		.describe("Automatically detect .specs folder location"),
	schemaValidation: z
		.boolean()
		.default(true)
		.describe("Enable schema validation"),
	referenceValidation: z
		.boolean()
		.default(true)
		.describe("Enable reference validation"),
});

// General configuration schema (for broader use)
export const SpecConfigSchema = z.object({
	specsPath: z.string().optional().describe("Path to specifications directory"),
	autoDetect: z
		.boolean()
		.optional()
		.describe("Whether to auto-detect specification files"),
	schemaValidation: z
		.boolean()
		.optional()
		.describe("Whether to enable schema validation"),
	referenceValidation: z
		.boolean()
		.optional()
		.describe("Whether to enable reference validation"),
});

export type SpecsManagerConfig = z.infer<typeof SpecsManagerConfig>;
export type SpecConfig = z.infer<typeof SpecConfigSchema>;

// Re-export types for backward compatibility
export type { AnyEntity } from "./entities/index.js";
export type { AnyComponent } from "./managers/types.js";
export type { RequirementFilter, PlanFilter, ComponentFilter };
export type EntityFilter = RequirementFilter | PlanFilter | ComponentFilter;

export class SpecsManager {
	config: z.infer<typeof SpecsManagerConfig>;
	private entityManager: EntityManager;

	constructor(config: Partial<z.infer<typeof SpecsManagerConfig>> = {}) {
		this.config = SpecsManagerConfig.parse(config);
		this.entityManager = new EntityManager({
			path: this.config.path ?? "./specs",
			autoDetect: this.config.autoDetect,
			schemaValidation: this.config.schemaValidation,
			referenceValidation: this.config.referenceValidation,
		});
	}

	// === REQUIREMENT CRUD OPERATIONS ===

	async createRequirement(
		data: Omit<
			import("./entities/requirements/requirement.js").Requirement,
			"number"
		>,
	) {
		return this.entityManager.createRequirement(data);
	}

	async getRequirement(id: string) {
		// Validate ID format
		RequirementIdSchema.parse(id);
		return this.entityManager.getRequirement(id);
	}

	async updateRequirement(
		id: string,
		data: Partial<import("./entities/requirements/requirement.js").Requirement>,
	) {
		// Validate ID format
		RequirementIdSchema.parse(id);
		return this.entityManager.updateRequirement(id, data);
	}

	async deleteRequirement(id: string) {
		// Validate ID format
		RequirementIdSchema.parse(id);
		return this.entityManager.deleteRequirement(id);
	}

	async listRequirements(filter?: RequirementFilter) {
		// Validate filter if provided
		if (filter !== undefined) {
			RequirementFilterSchema.parse(filter);
		}
		return this.entityManager.listRequirements(filter);
	}

	// === PLAN CRUD OPERATIONS ===

	async createPlan(
		data: Omit<import("./entities/plans/plan.js").Plan, "number">,
	) {
		return this.entityManager.createPlan(data);
	}

	async getPlan(id: string) {
		// Validate ID format
		PlanIdSchema.parse(id);
		return this.entityManager.getPlan(id);
	}

	async updatePlan(
		id: string,
		data: Partial<import("./entities/plans/plan.js").Plan>,
	) {
		// Validate ID format
		PlanIdSchema.parse(id);
		return this.entityManager.updatePlan(id, data);
	}

	async deletePlan(id: string) {
		// Validate ID format
		PlanIdSchema.parse(id);
		return this.entityManager.deletePlan(id);
	}

	async listPlans(filter?: PlanFilter) {
		// Validate filter if provided
		if (filter !== undefined) {
			PlanFilterSchema.parse(filter);
		}
		return this.entityManager.listPlans(filter);
	}

	// === COMPONENT CRUD OPERATIONS ===

	async createComponent(data: Omit<AnyComponent, "number">) {
		return this.entityManager.createComponent(data);
	}

	async getComponent(id: string) {
		// Validate ID format
		ComponentIdSchema.parse(id);
		return this.entityManager.getComponent(id);
	}

	async updateComponent(id: string, data: Partial<AnyComponent>) {
		// Validate ID format
		ComponentIdSchema.parse(id);
		return this.entityManager.updateComponent(id, data);
	}

	async deleteComponent(id: string) {
		// Validate ID format
		ComponentIdSchema.parse(id);
		return this.entityManager.deleteComponent(id);
	}

	async listComponents(filter?: ComponentFilter) {
		// Validate filter if provided
		if (filter !== undefined) {
			ComponentFilterSchema.parse(filter);
		}
		return this.entityManager.listComponents(filter);
	}

	// === BATCH OPERATIONS ===

	async createMultipleEntities(
		entities: Array<Omit<import("./entities/index.js").AnyEntity, "number">>,
	) {
		return this.entityManager.createMultipleEntities(entities);
	}

	async getAllEntities() {
		return this.entityManager.getAllEntities();
	}

	// === BASIC VALIDATION METHODS ===

	async validateEntityReferences(
		entity: import("./entities/index.js").AnyEntity,
	): Promise<void> {
		return this.entityManager.validateEntityReferences(entity);
	}

	async validateReferences(): Promise<ValidationResult> {
		return this.entityManager.validateReferences();
	}
}
