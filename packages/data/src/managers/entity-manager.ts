import z from "zod";
import { computeEntityId } from "../core/base-entity.js";
import { ComponentIdSchema } from "../entities/components/component.js";
import { ConstitutionIdSchema } from "../entities/constitutions/constitution.js";
import type { AnyEntity, EntityType } from "../entities/index.js";
import { PlanIdSchema } from "../entities/plans/plan.js";
import { RequirementIdSchema } from "../entities/requirements/requirement.js";
import { FileManager } from "./file-manager.js";
import {
	ComponentFilterSchema,
	ConstitutionFilterSchema,
	PlanFilterSchema,
	RequirementFilterSchema,
} from "./types.js";
import { ValidationManager } from "./validation-manager.js";

// Entity management types and schemas
export const ListOptionsSchema = z.object({
	priority: z
		.array(z.string())
		.optional()
		.describe("Filter by priority levels"),
	status: z.array(z.string()).optional().describe("Filter by status values"),
	type: z.array(z.string()).optional().describe("Filter by entity types"),
	tags: z.array(z.string()).optional().describe("Filter by tags"),
	sortBy: z.string().optional().describe("Field to sort by"),
	sortOrder: z
		.enum(["asc", "desc"])
		.optional()
		.describe("Sort order direction"),
	limit: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("Maximum number of results"),
	offset: z
		.number()
		.int()
		.nonnegative()
		.optional()
		.describe("Number of results to skip"),
});

export const UpdateOptionsSchema = z
	.record(z.string(), z.unknown())
	.describe("Options for updating entities");

// Export inferred types
export type ListOptions = z.infer<typeof ListOptionsSchema>;
export type UpdateOptions = z.infer<typeof UpdateOptionsSchema>;

export const EntityManagerConfigSchema = z.object({
	path: z.string().min(1).describe("Path to the specifications directory"),
	autoDetect: z
		.boolean()
		.optional()
		.default(true)
		.describe("Automatically detect entity structure"),
	schemaValidation: z
		.boolean()
		.optional()
		.default(true)
		.describe("Enable schema validation"),
	referenceValidation: z
		.boolean()
		.optional()
		.default(true)
		.describe("Enable reference validation"),
});

export type EntityManagerConfig = z.input<typeof EntityManagerConfigSchema>;

/**
 * EntityManager handles CRUD operations for spec entities
 * Responsibilities:
 * - Create, read, update, delete entities
 * - List entities with filtering
 * - Validate entities before operations
 * - Generate unique IDs for new entities
 */
export class EntityManager {
	private fileManager: FileManager;
	private validationManager: ValidationManager;

	constructor(config: EntityManagerConfig) {
		const parsedConfig = EntityManagerConfigSchema.parse(config);
		this.fileManager = new FileManager({
			path: parsedConfig.path,
			autoDetect: parsedConfig.autoDetect,
		});
		this.validationManager = new ValidationManager({
			path: parsedConfig.path,
			autoDetect: parsedConfig.autoDetect,
			schemaValidation: parsedConfig.schemaValidation,
			referenceValidation: parsedConfig.referenceValidation,
		});
	}

	// === CREATE OPERATIONS ===

	async create(
		entityType: EntityType,
		data: Partial<AnyEntity>,
	): Promise<
		{ success: true; data: AnyEntity } | { success: false; error: string }
	> {
		try {
			// Generate number if not provided
			let number = (data as { number?: number }).number;
			if (number === undefined) {
				number = await this.fileManager.getNextNumber(entityType);
			}

			// Generate slug if not provided
			const slug = data.slug || this.generateSlug(data.name || "untitled");

			// Compute the entity ID
			const entityId = computeEntityId(entityType, number, slug);

			// Set metadata (without ID field for storage)
			const now = new Date().toISOString();
			let entity: AnyEntity = {
				...data,
				type: entityType,
				number: number,
				slug: slug,
				created_at: now,
				updated_at: now,
			} as AnyEntity;

			// Fix criteria IDs for requirements to match the parent requirement ID
			if (entityType === "requirement") {
				const reqEntity = entity as Record<string, unknown>;
				if (reqEntity.criteria && Array.isArray(reqEntity.criteria)) {
					entity = {
						...entity,
						criteria: reqEntity.criteria.map(
							(criterion: Record<string, unknown>, index: number) => ({
								...criterion,
								id: `${entityId}/crit-${(index + 1).toString().padStart(3, "0")}`,
							}),
						),
					} as AnyEntity;
				}
			}

			// Sanitize entity (remove invalid fields)
			const sanitizedEntity = this.validationManager.sanitizeEntity(
				entityType,
				entity,
			);

			// Validate entity
			const validationResult = await this.validationManager.validateEntity(
				entityType,
				sanitizedEntity,
			);
			if (!validationResult.success) {
				return {
					success: false,
					error: validationResult.error ?? "Validation failed",
				};
			}

			// Check if entity already exists
			const exists = await this.fileManager.entityExists(entityType, entityId);
			if (exists) {
				return {
					success: false,
					error: `${this.getEntityTypeName(entityType)} with ID '${entityId}' already exists`,
				};
			}

			// Write entity (without ID field)
			await this.fileManager.writeEntity(entityType, entityId, sanitizedEntity);

			// Return entity with computed ID for runtime use
			const entityWithId = { ...sanitizedEntity, id: entityId };
			return { success: true, data: entityWithId };
		} catch (error) {
			return {
				success: false,
				error: `Failed to create entity: ${(error as Error).message}`,
			};
		}
	}

	// === READ OPERATIONS ===

	async get(
		entityType: EntityType,
		id: string,
	): Promise<
		{ success: true; data: AnyEntity } | { success: false; error: string }
	> {
		try {
			// Validate ID format based on entity type
			this.validateEntityId(entityType, id);

			const entity = await this.fileManager.readEntity(entityType, id);
			if (!entity) {
				return {
					success: false,
					error: `${this.getEntityTypeName(entityType)} with ID '${id}' not found`,
				};
			}

			// Add computed ID for runtime use
			const entityWithId = { ...entity, id };
			return { success: true, data: entityWithId };
		} catch (error) {
			return {
				success: false,
				error: `YAML parsing error: ${(error as Error).message}`,
			};
		}
	}

	async list(
		entityType: EntityType,
		options: ListOptions = {},
	): Promise<
		{ success: true; data: AnyEntity[] } | { success: false; error: string }
	> {
		try {
			// Validate list options
			ListOptionsSchema.parse(options);

			const ids = await this.fileManager.listEntityIds(entityType);
			const entities: AnyEntity[] = [];

			for (const id of ids) {
				const entity = await this.fileManager.readEntity(entityType, id);
				if (entity) {
					// Add computed ID for runtime use
					const entityWithId = { ...entity, id };
					entities.push(entityWithId);
				}
			}

			// Apply filters
			let filteredEntities = entities;

			if (options.priority && options.priority.length > 0) {
				filteredEntities = filteredEntities.filter(
					(entity) =>
						"priority" in entity &&
						entity.priority &&
						options.priority?.includes(entity.priority as string),
				);
			}

			if (options.status && options.status.length > 0) {
				filteredEntities = filteredEntities.filter(
					(entity) =>
						"status" in entity &&
						entity.status &&
						options.status?.includes(entity.status as string),
				);
			}

			if (options.type && options.type.length > 0) {
				filteredEntities = filteredEntities.filter(
					(entity) =>
						"type" in entity &&
						entity.type &&
						options.type?.includes(entity.type as string),
				);
			}

			if (options.tags && options.tags.length > 0) {
				filteredEntities = filteredEntities.filter((entity) => {
					if (!("tags" in entity) || !entity.tags) return false;
					return options.tags?.some((tag) =>
						(entity.tags as string[]).includes(tag),
					);
				});
			}

			// Apply sorting
			if (options.sortBy) {
				const sortField = options.sortBy;
				filteredEntities.sort((a, b) => {
					const aValue = (a as unknown as Record<string, unknown>)[sortField];
					const bValue = (b as unknown as Record<string, unknown>)[sortField];

					if (aValue === bValue) return 0;

					// Type-safe comparison
					if (typeof aValue === typeof bValue) {
						if (typeof aValue === "string" || typeof aValue === "number") {
							const result =
								(aValue as string | number) < (bValue as string | number)
									? -1
									: 1;
							return options.sortOrder === "desc" ? -result : result;
						}
					}

					// Fallback to string comparison
					const aStr = String(aValue);
					const bStr = String(bValue);
					const result = aStr < bStr ? -1 : 1;
					return options.sortOrder === "desc" ? -result : result;
				});
			}

			// Apply pagination
			if (options.limit || options.offset) {
				const offset = options.offset || 0;
				const limit = options.limit || filteredEntities.length;
				filteredEntities = filteredEntities.slice(offset, offset + limit);
			}

			return { success: true, data: filteredEntities };
		} catch (error) {
			return {
				success: false,
				error: `Failed to list entities: ${(error as Error).message}`,
			};
		}
	}

	// === UPDATE OPERATIONS ===

	async update(
		entityType: EntityType,
		id: string,
		updates: UpdateOptions,
	): Promise<
		{ success: true; data: AnyEntity } | { success: false; error: string }
	> {
		try {
			// Validate ID format based on entity type
			this.validateEntityId(entityType, id);

			// Get existing entity
			const existingEntity = await this.fileManager.readEntity(entityType, id);
			if (!existingEntity) {
				return {
					success: false,
					error: `${this.getEntityTypeName(entityType)} with ID '${id}' not found`,
				};
			}

			// Apply updates
			const updatedEntity: AnyEntity = {
				...existingEntity,
				...updates,
				id: existingEntity.id, // Preserve original ID
				created_at: existingEntity.created_at, // Preserve creation time
				updated_at: new Date().toISOString(),
			} as AnyEntity;

			// Validate updated entity
			const validationResult = await this.validationManager.validateEntity(
				entityType,
				updatedEntity,
			);
			if (!validationResult.success) {
				return {
					success: false,
					error: validationResult.error ?? "Validation failed",
				};
			}

			// Write updated entity
			await this.fileManager.writeEntity(entityType, id, updatedEntity);

			return { success: true, data: updatedEntity };
		} catch (error) {
			return {
				success: false,
				error: `Failed to update entity: ${(error as Error).message}`,
			};
		}
	}

	// === DELETE OPERATIONS ===

	async delete(
		entityType: EntityType,
		id: string,
	): Promise<{ success: true } | { success: false; error: string }> {
		try {
			// Validate ID format based on entity type
			this.validateEntityId(entityType, id);

			const deleted = await this.fileManager.deleteEntity(entityType, id);
			if (!deleted) {
				return {
					success: false,
					error: `${this.getEntityTypeName(entityType)} with ID '${id}' not found`,
				};
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to delete entity: ${(error as Error).message}`,
			};
		}
	}

	// === BATCH OPERATIONS ===

	async batchCreate(
		operations: Array<{ entityType: EntityType; data: Partial<AnyEntity> }>,
	): Promise<
		{ success: true; data: AnyEntity[] } | { success: false; error: string }
	> {
		try {
			const entities: AnyEntity[] = [];
			const fileOperations: Array<{
				entityType: EntityType;
				id: string;
				entity: AnyEntity;
			}> = [];

			// Prepare all entities and validate
			for (const op of operations) {
				const createResult = await this.prepareEntityForCreation(
					op.entityType,
					op.data,
				);
				if (!createResult.success) {
					return { success: false, error: createResult.error };
				}
				entities.push(createResult.data);
				fileOperations.push({
					entityType: op.entityType,
					id: createResult.data.id,
					entity: createResult.data,
				});
			}

			// Perform transactional batch write
			await this.fileManager.batchWriteWithTransaction(fileOperations);

			return { success: true, data: entities };
		} catch (error) {
			return {
				success: false,
				error: `Failed to batch create entities: ${(error as Error).message}`,
			};
		}
	}

	async batchUpdate(
		operations: Array<{
			entityType: EntityType;
			id: string;
			updates: UpdateOptions;
		}>,
	): Promise<
		{ success: true; data: AnyEntity[] } | { success: false; error: string }
	> {
		try {
			const entities: AnyEntity[] = [];
			const fileOperations: Array<{
				entityType: EntityType;
				id: string;
				entity: AnyEntity;
			}> = [];

			// Prepare all updates and validate
			for (const op of operations) {
				const updateResult = await this.prepareEntityForUpdate(
					op.entityType,
					op.id,
					op.updates,
				);
				if (!updateResult.success) {
					return { success: false, error: updateResult.error };
				}
				entities.push(updateResult.data);
				fileOperations.push({
					entityType: op.entityType,
					id: op.id,
					entity: updateResult.data,
				});
			}

			// Perform transactional batch write
			await this.fileManager.batchWriteWithTransaction(fileOperations);

			return { success: true, data: entities };
		} catch (error) {
			return {
				success: false,
				error: `Failed to batch update entities: ${(error as Error).message}`,
			};
		}
	}

	// === TYPE-SPECIFIC HELPER METHODS ===

	async createRequirement(
		data: Omit<
			import("../entities/requirements/requirement.js").Requirement,
			"number"
		>,
	): Promise<import("../entities/requirements/requirement.js").Requirement> {
		const result = await this.create("requirement", {
			...data,
			type: "requirement",
		});
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("../entities/requirements/requirement.js").Requirement;
	}

	async getRequirement(
		id: string,
	): Promise<
		import("../entities/requirements/requirement.js").Requirement | null
	> {
		// Validate ID format
		RequirementIdSchema.parse(id);
		const result = await this.get("requirement", id);
		if (!result.success) {
			// If the error suggests parsing issues, throw it instead of returning null
			if (
				result.error &&
				(result.error.includes("parsing") ||
					result.error.includes("yaml") ||
					result.error.includes("YAML"))
			) {
				throw new Error(result.error);
			}
			return null;
		}
		return result.data as import("../entities/requirements/requirement.js").Requirement;
	}

	async updateRequirement(
		id: string,
		data: Partial<
			import("../entities/requirements/requirement.js").Requirement
		>,
	): Promise<import("../entities/requirements/requirement.js").Requirement> {
		// Validate ID format
		RequirementIdSchema.parse(id);
		const result = await this.update("requirement", id, data);
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("../entities/requirements/requirement.js").Requirement;
	}

	async deleteRequirement(id: string): Promise<boolean> {
		// Validate ID format
		RequirementIdSchema.parse(id);
		const result = await this.delete("requirement", id);
		return result.success;
	}

	async listRequirements(
		filter?: import("./types.js").RequirementFilter,
	): Promise<import("../entities/requirements/requirement.js").Requirement[]> {
		// Validate filter if provided
		if (filter !== undefined) {
			RequirementFilterSchema.parse(filter);
		}

		const result = await this.list("requirement", {
			...(filter?.priority && { priority: filter.priority }),
			sortBy: "number",
			sortOrder: "asc",
		});
		if (!result.success) {
			throw new Error(result.error);
		}

		// Apply completed filter (custom logic)
		let requirements =
			result.data as import("../entities/requirements/requirement.js").Requirement[];
		if (filter?.completed !== undefined) {
			requirements = requirements.filter((req) => {
				const isCompleted =
					"criteria" in req && Array.isArray(req.criteria)
						? req.criteria.every(
								(c) =>
									typeof c === "object" &&
									c !== null &&
									"completed" in c &&
									c.completed,
							)
						: false;
				return filter.completed === isCompleted;
			});
		}

		return requirements;
	}

	async createPlan(
		data: Omit<import("../entities/plans/plan.js").Plan, "number">,
	): Promise<import("../entities/plans/plan.js").Plan> {
		const result = await this.create("plan", {
			...data,
			type: "plan",
		});
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("../entities/plans/plan.js").Plan;
	}

	async getPlan(
		id: string,
	): Promise<import("../entities/plans/plan.js").Plan | null> {
		// Validate ID format
		PlanIdSchema.parse(id);
		const result = await this.get("plan", id);
		if (!result.success) {
			return null;
		}
		return result.data as import("../entities/plans/plan.js").Plan;
	}

	async updatePlan(
		id: string,
		data: Partial<import("../entities/plans/plan.js").Plan>,
	): Promise<import("../entities/plans/plan.js").Plan> {
		// Validate ID format
		PlanIdSchema.parse(id);
		const result = await this.update("plan", id, data);
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("../entities/plans/plan.js").Plan;
	}

	async deletePlan(id: string): Promise<boolean> {
		// Validate ID format
		PlanIdSchema.parse(id);
		const result = await this.delete("plan", id);
		return result.success;
	}

	async listPlans(
		filter?: import("./types.js").PlanFilter,
	): Promise<import("../entities/plans/plan.js").Plan[]> {
		// Validate filter if provided
		if (filter !== undefined) {
			PlanFilterSchema.parse(filter);
		}

		const result = await this.list("plan", {
			...(filter?.priority && { priority: filter.priority }),
			sortBy: "number",
			sortOrder: "asc",
		});
		if (!result.success) {
			throw new Error(result.error);
		}

		// Apply completed and approved filters (custom logic)
		let plans = result.data as import("../entities/plans/plan.js").Plan[];
		if (filter?.completed !== undefined) {
			plans = plans.filter(
				(plan) => "completed" in plan && plan.completed === filter.completed,
			);
		}
		if (filter?.approved !== undefined) {
			plans = plans.filter(
				(plan) => "approved" in plan && plan.approved === filter.approved,
			);
		}

		return plans;
	}

	async createComponent(
		data: Omit<import("./types.js").AnyComponent, "number">,
	): Promise<import("./types.js").AnyComponent> {
		const result = await this.create(data.type as EntityType, data);
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("./types.js").AnyComponent;
	}

	async getComponent(
		id: string,
	): Promise<import("./types.js").AnyComponent | null> {
		// Validate ID format
		ComponentIdSchema.parse(id);
		// Determine component type from ID prefix
		const componentType = this.getComponentTypeFromId(id);
		const result = await this.get(componentType, id);
		if (!result.success) {
			return null;
		}
		return result.data as import("./types.js").AnyComponent;
	}

	async updateComponent(
		id: string,
		data: Partial<import("./types.js").AnyComponent>,
	): Promise<import("./types.js").AnyComponent> {
		// Validate ID format
		ComponentIdSchema.parse(id);
		const componentType = this.getComponentTypeFromId(id);
		const result = await this.update(componentType, id, data);
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("./types.js").AnyComponent;
	}

	async deleteComponent(id: string): Promise<boolean> {
		// Validate ID format
		ComponentIdSchema.parse(id);
		const componentType = this.getComponentTypeFromId(id);
		const result = await this.delete(componentType, id);
		return result.success;
	}

	async listComponents(
		filter?: import("./types.js").ComponentFilter,
	): Promise<import("./types.js").AnyComponent[]> {
		// Validate filter if provided
		if (filter !== undefined) {
			ComponentFilterSchema.parse(filter);
		}

		// Since all component types are stored in the same "components" folder,
		// we only need to call list once and filter by type afterwards
		const result = await this.list("app", {
			...(filter?.type && { type: filter.type }),
			sortBy: "number",
			sortOrder: "asc",
		});

		if (!result.success) {
			return [];
		}

		let allComponents = result.data as import("./types.js").AnyComponent[];

		// Apply folder filter
		if (filter?.folder) {
			allComponents = allComponents.filter(
				(component) =>
					"folder" in component && component.folder === filter.folder,
			);
		}

		return allComponents.sort((a, b) => {
			const aNumber = "number" in a ? (a.number as number) : 0;
			const bNumber = "number" in b ? (b.number as number) : 0;
			return aNumber - bNumber;
		});
	}

	async createConstitution(
		data: Omit<
			import("../entities/constitutions/constitution.js").Constitution,
			"number"
		>,
	): Promise<import("../entities/constitutions/constitution.js").Constitution> {
		const result = await this.create("constitution", {
			...data,
			type: "constitution",
		});
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("../entities/constitutions/constitution.js").Constitution;
	}

	async getConstitution(
		id: string,
	): Promise<
		import("../entities/constitutions/constitution.js").Constitution | null
	> {
		// Validate ID format
		ConstitutionIdSchema.parse(id);
		const result = await this.get("constitution", id);
		if (!result.success) {
			return null;
		}
		return result.data as import("../entities/constitutions/constitution.js").Constitution;
	}

	async updateConstitution(
		id: string,
		data: Partial<
			import("../entities/constitutions/constitution.js").Constitution
		>,
	): Promise<import("../entities/constitutions/constitution.js").Constitution> {
		// Validate ID format
		ConstitutionIdSchema.parse(id);
		const result = await this.update("constitution", id, data);
		if (!result.success) {
			throw new Error(result.error);
		}
		return result.data as import("../entities/constitutions/constitution.js").Constitution;
	}

	async deleteConstitution(id: string): Promise<boolean> {
		// Validate ID format
		ConstitutionIdSchema.parse(id);
		const result = await this.delete("constitution", id);
		return result.success;
	}

	async listConstitutions(
		filter?: import("./types.js").ConstitutionFilter,
	): Promise<
		import("../entities/constitutions/constitution.js").Constitution[]
	> {
		// Validate filter if provided
		if (filter !== undefined) {
			ConstitutionFilterSchema.parse(filter);
		}

		const result = await this.list("constitution", {
			...(filter?.status && { status: filter.status }),
			sortBy: "number",
			sortOrder: "asc",
		});
		if (!result.success) {
			throw new Error(result.error);
		}

		// Apply applies_to filter (custom logic)
		let constitutions =
			result.data as import("../entities/constitutions/constitution.js").Constitution[];
		if (filter?.applies_to !== undefined) {
			constitutions = constitutions.filter((con) => {
				if (!filter.applies_to) return true;
				return filter.applies_to.some((scope) =>
					con.applies_to.includes(scope),
				);
			});
		}

		return constitutions;
	}

	// === BATCH OPERATIONS (from OperationManager) ===

	async createMultipleEntities(
		entities: Array<Omit<AnyEntity, "number">>,
	): Promise<AnyEntity[]> {
		const operations = entities.map((entity) => ({
			entityType: entity.type as EntityType,
			data: entity,
		}));

		const result = await this.batchCreate(operations);
		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	}

	async getAllEntities(): Promise<{
		requirements: import("../entities/requirements/requirement.js").Requirement[];
		plans: import("../entities/plans/plan.js").Plan[];
		components: import("./types.js").AnyComponent[];
	}> {
		const [requirementsResult, plansResult, componentsResult] =
			await Promise.all([
				this.list("requirement", { sortBy: "number", sortOrder: "asc" }),
				this.list("plan", { sortBy: "number", sortOrder: "asc" }),
				this.list("app", { sortBy: "number", sortOrder: "asc" }),
			]);

		const requirements = requirementsResult.success
			? (requirementsResult.data as import("../entities/requirements/requirement.js").Requirement[])
			: [];
		const plans = plansResult.success
			? (plansResult.data as import("../entities/plans/plan.js").Plan[])
			: [];
		const components = componentsResult.success
			? (componentsResult.data as import("./types.js").AnyComponent[])
			: [];

		return { requirements, plans, components };
	}

	// === VALIDATION METHODS (from ValidationFacade) ===

	async validateEntityReferences(entity: AnyEntity): Promise<void> {
		const result = await this.validationManager.validateEntity(
			entity.type as EntityType,
			entity,
		);
		if (!result.success) {
			throw new Error(result.error);
		}
	}

	// Basic reference validation for backward compatibility
	// This is a simplified version that only checks existence
	async validateReferences(): Promise<
		import("./validation-manager.js").ValidationResult
	> {
		const errors: string[] = [];

		// Get all entities
		const { requirements, plans, components } = await this.getAllEntities();

		// Validate plan dependencies
		for (const plan of plans) {
			if (plan.depends_on && plan.depends_on.length > 0) {
				for (const depId of plan.depends_on) {
					const depExists = plans.some((p) => {
						const planId = `pln-${p.number.toString().padStart(3, "0")}-${p.slug}`;
						return planId === depId;
					});
					if (!depExists) {
						errors.push(
							`Plan '${plan.slug}' depends on non-existent plan '${depId}'`,
						);
					}
				}
			}
		}

		// Validate component dependencies
		for (const component of components) {
			if (component.depends_on && component.depends_on.length > 0) {
				for (const depId of component.depends_on) {
					const depExists = components.some((c) => {
						const prefix =
							c.type === "app"
								? "app"
								: c.type === "service"
									? "svc"
									: "lib";
						const componentId = `${prefix}-${c.number.toString().padStart(3, "0")}-${c.slug}`;
						return componentId === depId;
					});
					if (!depExists) {
						errors.push(
							`Component '${component.slug}' depends on non-existent component '${depId}'`,
						);
					}
				}
			}
		}

		// Validate plan criteria_id references to requirement criteria
		for (const plan of plans) {
			if (plan.criteria_id) {
				const criteriaExists = requirements.some((req) =>
					req.criteria.some((crit) => crit.id === plan.criteria_id),
				);
				if (!criteriaExists) {
					errors.push(
						`Plan '${plan.slug}' references non-existent criteria '${plan.criteria_id}'`,
					);
				}
			}
		}

		return {
			success: errors.length === 0,
			valid: errors.length === 0,
			errors,
		};
	}

	// === UTILITY METHODS ===

	async exists(entityType: EntityType, id: string): Promise<boolean> {
		return this.fileManager.entityExists(entityType, id);
	}

	async count(entityType: EntityType): Promise<number> {
		const ids = await this.fileManager.listEntityIds(entityType);
		return ids.length;
	}

	// Helper method to determine component type from ID
	private getComponentTypeFromId(
		id: string,
	): import("../entities/components/component.js").ComponentType {
		if (id.startsWith("app-")) return "app";
		if (id.startsWith("svc-")) return "service";
		if (id.startsWith("lib-")) return "library";
		throw new Error(`Invalid component ID format: ${id}`);
	}

	// === PRIVATE HELPER METHODS ===

	private validateEntityId(entityType: EntityType, id: string): void {
		switch (entityType) {
			case "requirement":
				RequirementIdSchema.parse(id);
				break;
			case "plan":
				PlanIdSchema.parse(id);
				break;
			case "app":
			case "service":
			case "library":
			case "tool":
				ComponentIdSchema.parse(id);
				break;
			case "constitution":
				ConstitutionIdSchema.parse(id);
				break;
			default:
				throw new Error(`Unknown entity type: ${entityType}`);
		}
	}

	private getEntityTypeName(entityType: EntityType): string {
		switch (entityType) {
			case "requirement":
				return "Requirement";
			case "plan":
				return "Plan";
			case "app":
				return "Component";
			case "service":
				return "Component";
			case "library":
				return "Component";
			case "tool":
				return "Component";
			case "constitution":
				return "Constitution";
			default:
				return "Entity";
		}
	}

	private async prepareEntityForCreation(
		entityType: EntityType,
		data: Partial<AnyEntity>,
	): Promise<
		{ success: true; data: AnyEntity } | { success: false; error: string }
	> {
		// Generate ID and number if not provided
		let number = (data as { number?: number }).number;
		if (!data.id) {
			number = await this.fileManager.getNextNumber(entityType);
			const slug = this.generateSlug(data.name || "untitled");
			data.id = this.generateId(entityType, number, slug);
		}

		// Set metadata
		const now = new Date().toISOString();
		const entity: AnyEntity = {
			...data,
			id: data.id,
			number: number,
			created_at: now,
			updated_at: now,
		} as AnyEntity;

		// Validate entity
		const validationResult = await this.validationManager.validateEntity(
			entityType,
			entity,
		);
		if (!validationResult.success) {
			return {
				success: false,
				error: validationResult.error ?? "Validation failed",
			};
		}

		// Check if entity already exists
		const exists = await this.fileManager.entityExists(entityType, entity.id);
		if (exists) {
			return {
				success: false,
				error: `${this.getEntityTypeName(entityType)} with ID '${entity.id}' already exists`,
			};
		}

		return { success: true, data: entity };
	}

	private async prepareEntityForUpdate(
		entityType: EntityType,
		id: string,
		updates: UpdateOptions,
	): Promise<
		{ success: true; data: AnyEntity } | { success: false; error: string }
	> {
		// Get existing entity
		const existingEntity = await this.fileManager.readEntity(entityType, id);
		if (!existingEntity) {
			return { success: false, error: `Entity with ID '${id}' not found` };
		}

		// Apply updates
		const updatedEntity: AnyEntity = {
			...existingEntity,
			...updates,
			id: existingEntity.id, // Preserve original ID
			created_at: existingEntity.created_at, // Preserve creation time
			updated_at: new Date().toISOString(),
		} as AnyEntity;

		// Validate updated entity
		const validationResult = await this.validationManager.validateEntity(
			entityType,
			updatedEntity,
		);
		if (!validationResult.success) {
			return {
				success: false,
				error: validationResult.error ?? "Validation failed",
			};
		}

		return { success: true, data: updatedEntity };
	}

	private generateId(
		entityType: EntityType,
		number: number,
		slug: string,
	): string {
		if (number === undefined || number === null) {
			throw new Error(`Invalid number for ${entityType}: ${number}`);
		}
		const shortPrefix = this.getEntityTypePrefix(entityType);
		const paddedNumber = number.toString().padStart(3, "0");
		return `${shortPrefix}-${paddedNumber}-${slug}`;
	}

	private getEntityTypePrefix(entityType: EntityType): string {
		switch (entityType) {
			case "requirement":
				return "req";
			case "plan":
				return "pln";
			case "app":
				return "app";
			case "service":
				return "svc";
			case "library":
				return "lib";
			default:
				throw new Error(`Unknown entity type: ${entityType}`);
		}
	}

	private generateSlug(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "")
			.substring(0, 50);
	}
}
