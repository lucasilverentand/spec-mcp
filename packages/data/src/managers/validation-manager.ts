import z from "zod";
import type { AnyEntity, EntityType } from "../entities/index.js";
import {
	AppComponentStorageSchema,
	ConstitutionStorageSchema,
	LibraryComponentStorageSchema,
	PlanStorageSchema,
	RequirementStorageSchema,
	ServiceComponentStorageSchema,
} from "../entities/index.js";
import { FileManager } from "./file-manager.js";

// Validation-related types and schemas
export const ValidationResultSchema = z.object({
	success: z.boolean().describe("Whether validation succeeded"),
	error: z.string().optional().describe("Error message if validation failed"),
	warnings: z
		.array(z.string())
		.optional()
		.describe("Warning messages from validation"),
	timestamp: z.string().optional().describe("Timestamp of validation"),
	// Legacy format for backward compatibility
	valid: z.boolean().describe("Legacy field for backward compatibility"),
	errors: z.array(z.string()).describe("List of validation errors"),
});

// Export inferred types
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const ValidationManagerConfigSchema = z.object({
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

export type ValidationManagerConfig = z.input<
	typeof ValidationManagerConfigSchema
>;

/**
 * ValidationManager handles basic validation operations for spec entities
 * Responsibilities:
 * - Schema validation for entity structure
 * - Basic reference existence validation
 * - Entity sanitization
 */
export class ValidationManager {
	private fileManager: FileManager;
	private config: Required<ValidationManagerConfig>;

	constructor(config: ValidationManagerConfig) {
		const parsedConfig = ValidationManagerConfigSchema.parse(config);
		this.config = {
			path: parsedConfig.path,
			autoDetect: parsedConfig.autoDetect,
			schemaValidation: parsedConfig.schemaValidation,
			referenceValidation: parsedConfig.referenceValidation,
		};
		this.fileManager = new FileManager({
			path: this.config.path,
			autoDetect: this.config.autoDetect,
		});
	}

	// === SCHEMA VALIDATION ===

	async validateEntity(
		entityType: EntityType,
		entity: AnyEntity,
	): Promise<ValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Basic schema validation
			const schemaResult = this.validateEntitySchema(entityType, entity);
			errors.push(...schemaResult.errors);
			warnings.push(...schemaResult.warnings);

			// Basic reference validation if enabled
			if (this.config.referenceValidation) {
				const referenceResult = await this.validateBasicReferences(entity);
				errors.push(...referenceResult.errors);
				warnings.push(...referenceResult.warnings);
			}

			return {
				success: errors.length === 0,
				...(errors.length > 0 && { error: errors.join(", ") }),
				...(warnings.length > 0 && { warnings }),
				// Legacy format for backward compatibility
				valid: errors.length === 0,
				errors: errors,
			};
		} catch (error) {
			return {
				success: false,
				error: `Validation failed: ${(error as Error).message}`,
				// Legacy format for backward compatibility
				valid: false,
				errors: [`Validation failed: ${(error as Error).message}`],
			};
		}
	}

	private validateEntitySchema(
		entityType: EntityType,
		entity: AnyEntity,
	): { errors: string[]; warnings: string[] } {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Get the appropriate schema and validate
			const schema = this.getSchemaForEntityType(entityType);
			const result = schema.safeParse(entity);

			if (!result.success) {
				// Extract error messages from Zod validation
				for (const issue of result.error.issues) {
					const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
					errors.push(`${path}${issue.message}`);
				}
			}
		} catch (error) {
			errors.push(`Schema validation failed: ${(error as Error).message}`);
		}

		return { errors, warnings };
	}

	private getSchemaForEntityType(entityType: EntityType) {
		switch (entityType) {
			case "requirement":
				return RequirementStorageSchema;
			case "plan":
				return PlanStorageSchema;
			case "app":
				return AppComponentStorageSchema;
			case "service":
				return ServiceComponentStorageSchema;
			case "library":
				return LibraryComponentStorageSchema;
			case "constitution":
				return ConstitutionStorageSchema;
			default:
				throw new Error(`Unknown entity type: ${entityType}`);
		}
	}

	// === BASIC REFERENCE VALIDATION (existence only) ===

	private async validateBasicReferences(
		entity: AnyEntity,
	): Promise<{ errors: string[]; warnings: string[] }> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Validate dependencies exist (basic check only)
			if ("depends_on" in entity && Array.isArray(entity.depends_on)) {
				for (const dependencyId of entity.depends_on) {
					if (typeof dependencyId === "string") {
						const exists = await this.checkEntityExists(dependencyId);
						if (!exists) {
							errors.push(`Referenced entity '${dependencyId}' does not exist`);
						}
					}
				}
			}

			// Basic plan reference check in requirements
			if ("criteria" in entity && Array.isArray(entity.criteria)) {
				for (const criterion of entity.criteria) {
					const criterionObj = criterion as { plan_id?: string };
					if (criterionObj.plan_id) {
						const planExists = await this.fileManager.entityExists(
							"plan",
							criterionObj.plan_id,
						);
						if (!planExists) {
							errors.push(
								`Referenced plan '${criterionObj.plan_id}' does not exist`,
							);
						}
					}
				}
			}
		} catch (error) {
			errors.push(`Reference validation failed: ${(error as Error).message}`);
		}

		return { errors, warnings };
	}

	private async checkEntityExists(entityId: string): Promise<boolean> {
		// Basic entity existence check based on ID prefix
		if (entityId.startsWith("pln-")) {
			return await this.fileManager.entityExists("plan", entityId);
		} else if (
			entityId.startsWith("app-") ||
			entityId.startsWith("svc-") ||
			entityId.startsWith("lib-")
		) {
			return await this.fileManager.entityExists("app", entityId);
		} else if (entityId.startsWith("req-")) {
			return await this.fileManager.entityExists("requirement", entityId);
		} else if (entityId.startsWith("con-")) {
			return await this.fileManager.entityExists("constitution", entityId);
		}
		return false;
	}

	// === ENTITY SANITIZATION ===

	sanitizeEntity(entityType: EntityType, entity: AnyEntity): AnyEntity {
		try {
			const schema = this.getSchemaForEntityType(entityType);

			const result = schema.safeParse(entity);

			if (result.success) {
				return result.data as AnyEntity;
			} else {
				// If full validation fails, try to extract just the base fields
				const cleanEntity = this.extractValidFields(entityType, entity);
				return cleanEntity;
			}
		} catch (_error) {
			// If schema parsing fails, return original entity
			return entity;
		}
	}

	private extractValidFields(
		entityType: EntityType,
		entity: AnyEntity,
	): AnyEntity {
		// Start with base fields that all entities should have
		const baseFields = {
			type: entity.type,
			number: entity.number,
			slug: entity.slug,
			name: entity.name,
			description: entity.description,
			id: entity.id,
			created_at: entity.created_at,
			updated_at: entity.updated_at,
		};

		// Add entity-specific fields based on type
		switch (entityType) {
			case "requirement": {
				const req = entity as Record<string, unknown>;
				return {
					...baseFields,
					priority: req.priority,
					criteria: req.criteria,
				} as AnyEntity;
			}
			case "plan": {
				const plan = entity as Record<string, unknown>;
				return {
					...baseFields,
					priority: plan.priority,
					acceptance_criteria: plan.acceptance_criteria,
					scope: plan.scope,
					depends_on: plan.depends_on || [],
					tasks: plan.tasks || [],
					flows: plan.flows || [],
					test_cases: plan.test_cases || [],
					api_contracts: plan.api_contracts || [],
					data_models: plan.data_models || [],
					references: plan.references || [],
					completed: plan.completed,
					completed_at: plan.completed_at,
					approved: plan.approved,
				} as AnyEntity;
			}
			case "app":
			case "service":
			case "library": {
				const comp = entity as Record<string, unknown>;
				const base = {
					...baseFields,
					folder: comp.folder,
					tech_stack: comp.tech_stack || [],
					testing_setup: comp.testing_setup || {
						frameworks: [],
						coverage_target: 90,
						test_commands: {},
						test_patterns: [],
					},
					deployment: comp.deployment || {
						platform: "unknown",
						environment_vars: [],
						secrets: [],
					},
					scope: comp.scope || {
						in_scope: [],
						out_of_scope: [],
					},
					depends_on: comp.depends_on || [],
					external_dependencies: comp.external_dependencies || [],
				};

				// Add type-specific fields
				if (entityType === "app") {
					return {
						...base,
						deployment_targets: comp.deployment_targets || [],
						environments: comp.environments || [
							"development",
							"staging",
							"production",
						],
					} as AnyEntity;
				} else if (entityType === "service") {
					return {
						...base,
						dev_port: comp.dev_port,
					} as AnyEntity;
				} else if (entityType === "library") {
					return {
						...base,
						package_name: comp.package_name,
					} as AnyEntity;
				} else {
					return base as AnyEntity;
				}
			}
			case "constitution": {
				const con = entity as Record<string, unknown>;
				return {
					...baseFields,
					articles: con.articles || [],
				} as AnyEntity;
			}
			case "decision": {
				const dec = entity as Record<string, unknown>;
				return {
					...baseFields,
					decision: dec.decision || "",
					context: dec.context || "",
					status: dec.status || "proposed",
					alternatives: dec.alternatives || [],
					consequences: dec.consequences || {
						positive: [],
						negative: [],
						risks: [],
						mitigation: [],
					},
					affects_components: dec.affects_components || [],
					affects_requirements: dec.affects_requirements || [],
					affects_plans: dec.affects_plans || [],
					informed_by_articles: dec.informed_by_articles || [],
					supersedes: dec.supersedes,
					references: dec.references || [],
				} as AnyEntity;
			}
			default:
				return entity;
		}
	}
}
