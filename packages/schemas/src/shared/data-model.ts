import z from "zod";
import { createSupersessionSchema } from "./supersession.js";

export const DataModelIdSchema = z
	.string()
	.regex(/^dat-\d{3}$/, {
		message: "Data Model ID must follow format: dat-XXX",
	})
	.describe("Unique identifier for the data model");

export const DataModelFieldSchema = z.object({
	name: z.string().min(1).describe("Name of the field"),
	type: z.string().min(1).describe("Data type of the field"),
	description: z
		.string()
		.min(1)
		.describe("Description of what this field represents"),
	constraints: z
		.array(z.string().min(1))
		.default([])
		.describe(
			"Validation constraints for this field, e.g., 'max length', 'pattern', required, optional",
		),
});

export const DataModelRelationshipSchema = z.object({
	name: z.string().min(1).describe("Name of the relationship"),
	target_model: z.string().min(1).describe("Target data model or entity"),
	relationship_type: z
		.string()
		.min(1)
		.describe(
			"Type of relationship (e.g., 'one-to-many', 'many-to-many', 'foreign-key')",
		),
	description: z.string().min(1).describe("Description of the relationship"),
});

export const DataModelExampleSchema = z.object({
	name: z.string().min(1).describe("Name of the example"),
	description: z
		.string()
		.min(1)
		.describe("Description of what this example demonstrates"),
	data: z.string().min(1).describe("Example data instance"),
	format: z.string().optional().describe("Format of the example data"),
});

export const DataModelSchema = z.object({
	id: DataModelIdSchema,
	name: z.string().min(1).describe("Display name of the data model"),
	description: z
		.string()
		.min(1)
		.describe("Detailed description of what this data model represents"),
	format: z
		.string()
		.min(1)
		.describe(
			"Format/notation used (e.g., 'json-schema', 'sql', 'typescript', 'protobuf', 'avro', 'graphql', etc.)",
		),
	schema: z.string().min(1).describe("The actual model definition/schema"),
	fields: z
		.array(DataModelFieldSchema)
		.default([])
		.describe("Key fields/properties of the data model"),
	relationships: z
		.array(DataModelRelationshipSchema)
		.default([])
		.describe("Relationships to other data models"),
	constraints: z
		.array(z.string().min(1))
		.default([])
		.describe("Business rules or constraints"),
	indexes: z
		.array(z.string().min(1))
		.default([])
		.describe("Indexes for database models"),
	examples: z
		.array(DataModelExampleSchema)
		.default([])
		.describe("Example instances of the data model"),
	...createSupersessionSchema(DataModelIdSchema),
});

export const DataModelsSchema = z
	.array(DataModelSchema)
	.default([])
	.describe("Array of data models");

export type DataModelId = z.infer<typeof DataModelIdSchema>;
export type DataModelField = z.infer<typeof DataModelFieldSchema>;
export type DataModelRelationship = z.infer<typeof DataModelRelationshipSchema>;
export type DataModelExample = z.infer<typeof DataModelExampleSchema>;
export type DataModel = z.infer<typeof DataModelSchema>;
export type DataModels = z.infer<typeof DataModelsSchema>;
