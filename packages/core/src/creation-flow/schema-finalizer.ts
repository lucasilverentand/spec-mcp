/**
 * Schema-driven finalization for creation flow drafts
 *
 * Extracts .describe() metadata from entity schemas and uses them to:
 * 1. Provide LLM with schema instructions
 * 2. Validate final draft data against actual entity schemas
 */

import {
	AppComponentStorageSchema,
	type ComponentType,
	ConstitutionStorageSchema,
	DecisionStorageSchema,
	LibraryComponentStorageSchema,
	PlanStorageSchema,
	RequirementStorageSchema,
	ServiceComponentStorageSchema,
} from "@spec-mcp/data";
import { z } from "zod";

type SpecType =
	| "requirement"
	| "component"
	| "plan"
	| "constitution"
	| "decision";

/**
 * Result of schema finalization
 */
export interface FinalizationResult {
	success: boolean;
	data?: unknown;
	errors?: string[];
	spec_id?: string;
}

/**
 * Schema instructions for LLM
 */
export interface SchemaInstructions {
	type: SpecType;
	instructions: string;
	schema_fields: Record<string, FieldDescription>;
	example?: Record<string, unknown>;
}

interface FieldDescription {
	type: string;
	description: string;
	required: boolean;
	default?: unknown;
	enum_values?: string[];
	nested?: Record<string, FieldDescription>;
}

/**
 * Extract field descriptions from a Zod schema
 */
function extractFieldDescriptions(
	schema: z.ZodTypeAny,
	isRequired = true,
): FieldDescription {
	// Handle ZodObject
	if (schema instanceof z.ZodObject) {
		const shape = schema.shape;
		const nested: Record<string, FieldDescription> = {};

		for (const [key, value] of Object.entries(shape)) {
			nested[key] = extractFieldDescriptions(
				value as z.ZodTypeAny,
				!schema.isOptional(),
			);
		}

		return {
			type: "object",
			description: schema.description || "Object field",
			required: isRequired,
			nested,
		};
	}

	// Handle ZodArray
	if (schema instanceof z.ZodArray) {
		const itemDesc = extractFieldDescriptions(schema.element, true);
		return {
			type: "array",
			description: schema.description || "Array field",
			required: isRequired,
			nested: { items: itemDesc },
		};
	}

	// Handle ZodEnum
	if (schema instanceof z.ZodEnum) {
		return {
			type: "enum",
			description: schema.description || "Enum field",
			required: isRequired,
			enum_values: schema.options as string[],
		};
	}

	// Handle ZodString
	if (schema instanceof z.ZodString) {
		return {
			type: "string",
			description: schema.description || "String field",
			required: isRequired,
		};
	}

	// Handle ZodNumber
	if (schema instanceof z.ZodNumber) {
		return {
			type: "number",
			description: schema.description || "Number field",
			required: isRequired,
		};
	}

	// Handle ZodBoolean
	if (schema instanceof z.ZodBoolean) {
		return {
			type: "boolean",
			description: schema.description || "Boolean field",
			required: isRequired,
		};
	}

	// Handle ZodDefault
	if (schema instanceof z.ZodDefault) {
		const inner = extractFieldDescriptions(schema._def.innerType, isRequired);
		inner.default = schema._def.defaultValue();
		inner.required = false;
		return inner;
	}

	// Handle ZodOptional
	if (schema instanceof z.ZodOptional) {
		return extractFieldDescriptions(schema.unwrap(), false);
	}

	// Handle ZodLiteral
	if (schema instanceof z.ZodLiteral) {
		return {
			type: "literal",
			description: schema.description || "Literal value",
			required: isRequired,
			default: schema.value,
		};
	}

	// Fallback
	return {
		type: "unknown",
		description: schema.description || "Field",
		required: isRequired,
	};
}

/**
 * Get schema for a spec type
 */
function getSchemaForType(
	type: SpecType,
	componentType?: ComponentType,
): z.ZodTypeAny {
	switch (type) {
		case "requirement":
			return RequirementStorageSchema;
		case "plan":
			return PlanStorageSchema;
		case "component":
			switch (componentType) {
				case "app":
					return AppComponentStorageSchema;
				case "service":
					return ServiceComponentStorageSchema;
				case "library":
					return LibraryComponentStorageSchema;
				default:
					return ServiceComponentStorageSchema;
			}
		case "constitution":
			return ConstitutionStorageSchema;
		case "decision":
			return DecisionStorageSchema;
	}
}

/**
 * Generate LLM instructions from schema
 */
export function generateSchemaInstructions(
	type: SpecType,
	draftData: Record<string, unknown>,
): SchemaInstructions {
	const componentType = draftData.type as ComponentType | undefined;
	const schema = getSchemaForType(type, componentType);

	// Extract field descriptions
	const schemaDesc = extractFieldDescriptions(schema);
	const fields = schemaDesc.nested || {};

	// Build instruction text
	let instructions = `You have completed all creation flow steps!\n\n`;
	instructions += `Now map the collected information to the ${type.toUpperCase()} schema.\n\n`;
	instructions += `Review the information gathered during the Q&A flow and fill in the schema fields below.\n`;
	instructions += `Use the descriptions as guidance for what each field should contain.\n\n`;

	return {
		type,
		instructions,
		schema_fields: fields,
	};
}

/**
 * Format field descriptions as readable text for LLM
 */
export function formatSchemaFieldsForLLM(
	fields: Record<string, FieldDescription>,
	indent = 0,
): string {
	const indentStr = "  ".repeat(indent);
	let result = "";

	for (const [fieldName, field] of Object.entries(fields)) {
		const requiredMark = field.required ? " (required)" : " (optional)";
		const defaultMark =
			field.default !== undefined
				? ` [default: ${JSON.stringify(field.default)}]`
				: "";
		const enumMark = field.enum_values
			? ` [options: ${field.enum_values.join(", ")}]`
			: "";

		result += `${indentStr}${fieldName}: ${field.type}${requiredMark}${defaultMark}${enumMark}\n`;
		result += `${indentStr}  → ${field.description}\n`;

		if (field.nested && Object.keys(field.nested).length > 0) {
			if (field.type === "array") {
				result += `${indentStr}  Array items:\n`;
				result += formatSchemaFieldsForLLM(field.nested, indent + 2);
			} else if (field.type === "object") {
				result += `${indentStr}  Object fields:\n`;
				result += formatSchemaFieldsForLLM(field.nested, indent + 2);
			}
		}

		result += "\n";
	}

	return result;
}

/**
 * Validate and finalize draft data
 */
export function finalizeDraft(
	type: SpecType,
	draftData: Record<string, unknown>,
): FinalizationResult {
	try {
		const componentType = draftData.type as ComponentType | undefined;
		const schema = getSchemaForType(type, componentType);

		// Auto-convert criteria to proper format for requirements
		if (type === "requirement" && draftData.criteria) {
			const criteria = draftData.criteria as Array<
				string | { id?: string; description: string }
			>;
			draftData.criteria = criteria.map((item, index) => {
				if (typeof item === "string") {
					// String criteria -> convert to object with ID
					return {
						id: `crit-${String(index + 1).padStart(3, "0")}`,
						description: item,
					};
				} else if (typeof item === "object" && !item.id) {
					// Object with description but no ID -> add ID
					return {
						id: `crit-${String(index + 1).padStart(3, "0")}`,
						description: item.description,
					};
				}
				// Already has ID -> keep as is
				return item;
			});
		}

		// Auto-fill empty arrays only for fields that exist in the schema
		// Get the schema shape to check which fields are actually in the schema
		const schemaShape = schema instanceof z.ZodObject ? schema.shape : {};
		const fieldsWithEmptyArrayDefault = [
			"depends_on",
			"external_dependencies",
			"tech_stack",
			"tasks",
			"flows",
			"test_cases",
			"api_contracts",
			"data_models",
			"references",
			"alternatives",
			"affects_components",
			"affects_requirements",
			"affects_plans",
			"informed_by_articles",
		];

		for (const field of fieldsWithEmptyArrayDefault) {
			// Only add the field if it exists in the schema AND isn't already in draftData
			if (field in schemaShape && !(field in draftData)) {
				draftData[field] = [];
			}
			// Remove the field if it exists in draftData but NOT in the schema
			else if (!(field in schemaShape) && field in draftData) {
				delete draftData[field];
			}
		}

		// Auto-fill deployment object for components if missing
		// DeploymentSchema requires platform (min 1 char), others have defaults
		if (type === "component" && !draftData.deployment) {
			draftData.deployment = {
				platform: (draftData.platform as string) || "unknown",
				environment_vars: (draftData.environment_vars as string[]) || [],
				secrets: (draftData.secrets as string[]) || [],
			};
		}

		// Auto-fill scope object for components if missing
		// Note: ComponentScopeSchema requires min(1) for both arrays, so only auto-fill if we have data
		if (type === "component" && !draftData.scope) {
			const inScope = draftData.in_scope as unknown[] | undefined;
			const outScope = draftData.out_of_scope as unknown[] | undefined;

			// Only create scope if we have at least one item in each array (schema requires min 1)
			if (inScope && outScope && inScope.length > 0 && outScope.length > 0) {
				draftData.scope = {
					in_scope: inScope,
					out_of_scope: outScope,
				};
			}
			// If scope data was collected but not structured, let validation fail with clear message
		}

		// Auto-fill consequences object for decisions if missing
		if (type === "decision" && !draftData.consequences) {
			draftData.consequences = {
				positive: draftData.positive || [],
				negative: draftData.negative || [],
				risks: draftData.risks || [],
				mitigation: draftData.mitigation || [],
			};
		}

		// Remove flow-specific fields that aren't part of the entity schema
		const flowSpecificFields = [
			"research_findings",
			"no_constitutions",
			"technology_notes",
			"in_scope",
			"out_of_scope",
			"environment_vars",
			"secrets",
			"platform",
			"positive",
			"negative",
			"risks",
			"mitigation",
		];

		for (const field of flowSpecificFields) {
			if (!(field in schemaShape) && field in draftData) {
				delete draftData[field];
			}
		}

		// Add automatic timestamps if not present
		const dataWithTimestamps = {
			...draftData,
			created_at: draftData.created_at || new Date().toISOString(),
			updated_at: draftData.updated_at || new Date().toISOString(),
		};

		// Validate against schema
		const validated = schema.parse(dataWithTimestamps);

		return {
			success: true,
			data: validated,
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errors = error.errors.map((err) => {
				const path = err.path.join(".");
				return `${path}: ${err.message}`;
			});

			return {
				success: false,
				errors,
			};
		}

		return {
			success: false,
			errors: [String(error)],
		};
	}
}

/**
 * Get complete finalization instructions for LLM
 */
export function getFinalizationPrompt(
	type: SpecType,
	draftData: Record<string, unknown>,
): string {
	const instructions = generateSchemaInstructions(type, draftData);
	const fieldText = formatSchemaFieldsForLLM(instructions.schema_fields);

	let prompt = instructions.instructions;
	prompt += `SCHEMA FIELDS:\n\n${fieldText}`;
	prompt += `\nIMPORTANT:\n`;
	prompt += `- Use the information from all previous Q&A steps\n`;
	prompt += `- Ensure all required fields are filled\n`;
	prompt += `- Follow the exact data types and formats specified\n`;
	prompt += `- Use default values where appropriate\n`;
	prompt += `- Return the complete schema as a valid JSON object\n`;

	return prompt;
}
