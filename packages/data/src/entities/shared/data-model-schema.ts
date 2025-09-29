import z from "zod";

export const DataModelIdSchema = z
	.string()
	.regex(/^dm-\d{3}$/, {
		message: "Data Model ID must follow format: dm-XXX",
	})
	.describe("Unique identifier for the data model");

export const DataModelFieldSchema = z.object({
	name: z.string().min(1).describe("Name of the field"),
	type: z.string().min(1).describe("Data type of the field"),
	description: z
		.string()
		.min(1)
		.describe("Description of what this field represents"),
	required: z
		.boolean()
		.default(false)
		.describe("Whether this field is required"),
	constraints: z
		.array(z.string().min(1))
		.default([])
		.describe("Validation constraints for this field"),
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

export const DataModelMigrationSchema = z.object({
	version: z.string().min(1).describe("Version this migration applies to"),
	description: z
		.string()
		.min(1)
		.describe("Description of what this migration does"),
	changes: z
		.array(z.string().min(1))
		.describe("List of changes made in this migration"),
	breaking: z
		.boolean()
		.default(false)
		.describe("Whether this migration introduces breaking changes"),
});

export const DataModelSchema = z.object({
	id: DataModelIdSchema,
	name: z.string().min(1).describe("Display name of the data model"),
	description: z
		.string()
		.min(1)
		.describe("Detailed description of what this data model represents"),
	model_type: z
		.string()
		.min(1)
		.describe(
			"Type of data model (e.g., 'database', 'api', 'domain', 'view', 'cache', 'message', 'event', etc.)",
		),
	format: z
		.string()
		.min(1)
		.describe(
			"Format/notation used (e.g., 'json-schema', 'sql', 'typescript', 'protobuf', 'avro', 'graphql', etc.)",
		),
	schema: z.string().min(1).describe("The actual model definition/schema"),
	version: z.string().default("1.0.0").describe("Version of the data model"),
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
	validations: z
		.array(z.string().min(1))
		.default([])
		.describe("Validation rules"),
	examples: z
		.array(DataModelExampleSchema)
		.default([])
		.describe("Example instances of the data model"),
	migrations: z
		.array(DataModelMigrationSchema)
		.default([])
		.describe("Schema change history"),
	metadata: z
		.record(z.string(), z.unknown())
		.default({})
		.describe("Additional metadata specific to the model type"),
});

export type DataModelId = z.infer<typeof DataModelIdSchema>;
export type DataModelField = z.infer<typeof DataModelFieldSchema>;
export type DataModelRelationship = z.infer<typeof DataModelRelationshipSchema>;
export type DataModelExample = z.infer<typeof DataModelExampleSchema>;
export type DataModelMigration = z.infer<typeof DataModelMigrationSchema>;
export type DataModel = z.infer<typeof DataModelSchema>;
