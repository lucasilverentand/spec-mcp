import type {
	AnyEntity,
	AppComponent,
	LibraryComponent,
	Plan,
	Requirement,
	ServiceComponent,
	ToolComponent,
} from "@spec-mcp/data";
import {
	AppComponentSchema,
	ConstitutionSchema,
	LibraryComponentSchema,
	PlanSchema,
	RequirementSchema,
	ServiceComponentSchema,
	ToolComponentSchema,
} from "@spec-mcp/data";
import z from "zod";
import type { ValidationResult } from "../../interfaces/results.js";

interface FieldRule {
	type: string;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	allowedValues?: readonly unknown[];
	isArray?: boolean;
	itemType?: FieldRule;
	optional?: boolean;
	innerType?: FieldRule;
}

interface ZodStringCheck {
	kind: string;
	value?: number | string;
	regex?: RegExp;
}

interface ZodDefWithChecks {
	checks?: ZodStringCheck[];
}

function validateEntity(entity: AnyEntity): ValidationResult {
	try {
		const entityType = entity.type;
		switch (entityType) {
			case "requirement":
				RequirementSchema.parse(entity);
				break;
			case "plan":
				PlanSchema.parse(entity);
				break;
			case "app":
				AppComponentSchema.parse(entity);
				break;
			case "service":
				ServiceComponentSchema.parse(entity);
				break;
			case "library":
				LibraryComponentSchema.parse(entity);
				break;
			case "tool":
				ToolComponentSchema.parse(entity);
				break;
			case "constitution":
				ConstitutionSchema.parse(entity);
				break;
			default:
				// This should never happen due to AnyEntity typing
				entityType satisfies never;
				return {
					valid: false,
					errors: [`Unknown entity type: ${String(entityType)}`],
					warnings: [],
				};
		}

		return {
			valid: true,
			errors: [],
			warnings: [],
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				valid: false,
				errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
				warnings: [],
			};
		}

		return {
			valid: false,
			errors: [
				error instanceof Error ? error.message : "Unknown validation error",
			],
			warnings: [],
		};
	}
}

function validateEntityBatch(entities: AnyEntity[]): ValidationResult {
	const allErrors: string[] = [];
	const allWarnings: string[] = [];

	entities.forEach((entity, index) => {
		const result = validateEntity(entity);

		if (!result.valid) {
			allErrors.push(
				...result.errors.map((error: string) => `Entity ${index}: ${error}`),
			);
		}

		allWarnings.push(
			...result.warnings.map(
				(warning: string) => `Entity ${index}: ${warning}`,
			),
		);
	});

	return {
		valid: allErrors.length === 0,
		errors: allErrors,
		warnings: allWarnings,
	};
}

function validatePartialEntity(
	partialEntity: Partial<AnyEntity>,
	entityType: string,
): ValidationResult {
	try {
		// Create a minimal valid entity for the type to test against
		const baseEntity = createBaseEntity(entityType);
		const mergedEntity = { ...baseEntity, ...partialEntity } as AnyEntity;

		return validateEntity(mergedEntity);
	} catch (error) {
		return {
			valid: false,
			errors: [
				error instanceof Error ? error.message : "Unknown validation error",
			],
			warnings: [],
		};
	}
}

function getSchemaForType(entityType: string): z.Schema {
	switch (entityType) {
		case "requirement":
			return RequirementSchema as unknown as z.Schema;
		case "plan":
			return PlanSchema as unknown as z.Schema;
		case "app":
			return AppComponentSchema as unknown as z.Schema;
		case "service":
			return ServiceComponentSchema as unknown as z.Schema;
		case "library":
			return LibraryComponentSchema as unknown as z.Schema;
		case "tool":
			return ToolComponentSchema as unknown as z.Schema;
		default:
			throw new Error(`Unknown entity type: ${entityType}`);
	}
}

function validateFieldValue(
	entityType: string,
	fieldPath: string,
	value: unknown,
): ValidationResult {
	try {
		const schema = getSchemaForType(entityType);

		// Extract the field schema
		const fieldSchema = extractFieldSchema(schema, fieldPath);

		fieldSchema.parse(value);

		return {
			valid: true,
			errors: [],
			warnings: [],
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				valid: false,
				errors: error.errors.map((e) => e.message),
				warnings: [],
			};
		}

		return {
			valid: false,
			errors: [
				error instanceof Error ? error.message : "Unknown validation error",
			],
			warnings: [],
		};
	}
}

function getValidationRules(entityType: string): Record<string, unknown> {
	try {
		const schema = getSchemaForType(entityType);
		return extractSchemaRules(schema);
	} catch (_error) {
		return {};
	}
}

function getSuggestions(entityType: string, fieldPath: string): string[] {
	const suggestions: string[] = [];

	try {
		const schema = getSchemaForType(entityType);
		const fieldSchema = extractFieldSchema(schema, fieldPath);

		// Add type-specific suggestions
		if (fieldSchema instanceof z.ZodEnum) {
			suggestions.push(`Allowed values: ${fieldSchema.options.join(", ")}`);
		}

		if (fieldSchema instanceof z.ZodString) {
			const checks: Array<{
				kind: string;
				value?: number | string;
				regex?: RegExp;
			}> =
				"_def" in fieldSchema &&
				fieldSchema._def &&
				typeof fieldSchema._def === "object" &&
				"checks" in fieldSchema._def &&
				Array.isArray(fieldSchema._def.checks)
					? (fieldSchema._def.checks as Array<{
							kind: string;
							value?: number | string;
							regex?: RegExp;
						}>)
					: [];
			checks.forEach((check) => {
				switch (check.kind) {
					case "min":
						suggestions.push(`Minimum length: ${check.value}`);
						break;
					case "max":
						suggestions.push(`Maximum length: ${check.value}`);
						break;
					case "regex":
						suggestions.push(`Must match pattern: ${check.regex}`);
						break;
				}
			});
		}

		if (fieldSchema instanceof z.ZodArray) {
			suggestions.push("This field expects an array of values");
			const itemType = fieldSchema.element;
			if (itemType instanceof z.ZodObject) {
				suggestions.push("Array items should be objects");
			}
		}
	} catch (_error) {
		// Silently fail for suggestion generation
	}

	return suggestions;
}

function validateEntityStructure(entity: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check basic structure
	if (!entity || typeof entity !== "object") {
		errors.push("Entity must be an object");
		return { valid: false, errors, warnings };
	}

	// Type guard to narrow entity type
	const record = entity as Record<string, unknown>;

	// Check required fields
	if (!record.type) {
		errors.push("Entity must have a type field");
	}

	if (!record.name) {
		errors.push("Entity must have a name field");
	}

	if (!record.slug) {
		errors.push("Entity must have a slug field");
	}

	// Check type-specific structure
	switch (record.type) {
		case "requirement":
			if (!record.criteria || !Array.isArray(record.criteria)) {
				errors.push("Requirements must have criteria array");
			}
			break;

		case "plan":
			if (!record.acceptance_criteria) {
				errors.push("Plans must have acceptance_criteria");
			}
			if (!record.tasks || !Array.isArray(record.tasks)) {
				warnings.push("Plans should have tasks array");
			}
			break;

		case "app":
		case "service":
		case "library":
		case "tool":
			if (!record.capabilities || !Array.isArray(record.capabilities)) {
				warnings.push("Components should have capabilities array");
			}
			break;
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

function createBaseEntity(entityType: string): AnyEntity {
	const baseFields = {
		id: "test-entity-001",
		name: "Test Entity",
		slug: "test-entity",
		description: "Test description",
		number: 1,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	switch (entityType) {
		case "requirement":
			return {
				...baseFields,
				type: "requirement",
				priority: "required",
				criteria: [
					{
						id: "req-001-test-entity/crit-001",
						description: "Test criteria",
					},
				],
			} as Requirement;

		case "plan":
			return {
				...baseFields,
				type: "plan",
				criteria_id: "req-001-test-entity/crit-001",
				priority: "medium",
				acceptance_criteria: "Test criteria",
				depends_on: [],
				tasks: [],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				completed: false,
				approved: false,
			} as Plan;

		case "app":
			return {
				...baseFields,
				type: "app",
				folder: ".",
				setup_tasks: [],
				depends_on: [],
				external_dependencies: [],
				capabilities: [],
				constraints: [],
				tech_stack: [],
				deployment_targets: [],
				environments: ["development"],
			} as AppComponent;

		case "service":
			return {
				...baseFields,
				type: "service",
				folder: ".",
				setup_tasks: [],
				depends_on: [],
				external_dependencies: [],
				capabilities: [],
				constraints: [],
				tech_stack: [],
				// Add any other required ServiceComponent properties here if missing
			} as ServiceComponent;

		case "library":
			return {
				...baseFields,
				type: "library",
				folder: ".",
				setup_tasks: [],
				depends_on: [],
				external_dependencies: [],
				capabilities: [],
				constraints: [],
				tech_stack: [],
				environments: ["development"],
			} as LibraryComponent;

		case "tool":
			return {
				...baseFields,
				type: "tool",
				folder: ".",
				setup_tasks: [],
				depends_on: [],
				external_dependencies: [],
				capabilities: [],
				constraints: [],
				tech_stack: [],
				// Add any required fields for ToolComponent that are missing here.
			} as ToolComponent;

		default:
			throw new Error(`Unknown entity type: ${entityType}`);
	}
}

function extractFieldSchema(
	schema: z.ZodSchema,
	fieldPath: string,
): z.ZodSchema {
	const pathParts = fieldPath.split(".");
	let currentSchema = schema;

	for (const part of pathParts) {
		if (currentSchema instanceof z.ZodObject) {
			const shape = currentSchema.shape;
			if (shape[part]) {
				currentSchema = shape[part];
			} else {
				throw new Error(`Field ${part} not found in schema`);
			}
		} else if (currentSchema instanceof z.ZodArray) {
			currentSchema = currentSchema.element;
		} else {
			throw new Error(`Cannot navigate to field ${part} in schema`);
		}
	}

	return currentSchema;
}

function extractSchemaRules(schema: z.ZodSchema): Record<string, unknown> {
	const rules: Record<string, unknown> = {};

	if (schema instanceof z.ZodObject) {
		const shape = schema.shape;
		for (const [key, fieldSchema] of Object.entries(shape)) {
			rules[key] = extractFieldRules(fieldSchema as z.ZodSchema);
		}
	}

	return rules;
}

function extractFieldRules(schema: z.ZodSchema): FieldRule {
	const rules: FieldRule = {
		type: schema.constructor.name,
	};

	if (schema instanceof z.ZodString) {
		const def = (schema as z.ZodString & { _def: ZodDefWithChecks })._def;
		const checks = def.checks || [];
		for (const check of checks) {
			switch (check.kind) {
				case "min":
					if (typeof check.value === "number") {
						rules.minLength = check.value;
					}
					break;
				case "max":
					if (typeof check.value === "number") {
						rules.maxLength = check.value;
					}
					break;
				case "regex":
					if (check.regex) {
						rules.pattern = check.regex.toString();
					}
					break;
			}
		}
	}

	if (schema instanceof z.ZodEnum) {
		rules.allowedValues = schema.options;
	}

	if (schema instanceof z.ZodArray) {
		rules.isArray = true;
		rules.itemType = extractFieldRules(schema.element);
	}

	if (schema instanceof z.ZodOptional) {
		rules.optional = true;
		rules.innerType = extractFieldRules(schema.unwrap());
	}

	return rules;
}

export const SchemaValidator = {
	validateEntity,
	validateEntityBatch,
	validatePartialEntity,
	getSchemaForType,
	validateFieldValue,
	getValidationRules,
	getSuggestions,
	validateEntityStructure,
};
