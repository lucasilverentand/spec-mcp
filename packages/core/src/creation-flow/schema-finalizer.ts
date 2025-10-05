/**
 * Schema-driven finalization for creation flow drafts
 *
 * Extracts .describe() metadata from entity schemas and uses them to:
 * 1. Provide LLM with schema instructions
 * 2. Validate final draft data against actual entity schemas
 */

import {
	RequirementStorageSchema,
	PlanStorageSchema,
	AppComponentStorageSchema,
	ServiceComponentStorageSchema,
	LibraryComponentStorageSchema,
	ConstitutionStorageSchema,
	DecisionStorageSchema,
	type ComponentType,
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
		const defaultMark = field.default !== undefined ? ` [default: ${JSON.stringify(field.default)}]` : "";
		const enumMark = field.enum_values ? ` [options: ${field.enum_values.join(", ")}]` : "";

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
