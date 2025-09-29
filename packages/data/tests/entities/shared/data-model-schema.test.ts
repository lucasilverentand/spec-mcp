import { describe, expect, it } from "vitest";
import {
	DataModelExampleSchema,
	DataModelFieldSchema,
	DataModelIdSchema,
	DataModelMigrationSchema,
	DataModelRelationshipSchema,
	DataModelSchema,
} from "../../../src/entities/shared/data-model-schema.js";

describe("DataModelIdSchema", () => {
	it("should accept valid data model IDs", () => {
		const validIds = ["dm-001", "dm-999", "dm-042", "dm-100"];

		for (const id of validIds) {
			expect(() => DataModelIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid data model IDs", () => {
		const invalidIds = [
			"dm-1", // not padded
			"dm-abc", // non-numeric
			"model-001", // wrong prefix
			"dm-001-extra", // extra suffix
			"DM-001", // wrong case
			"dm-1234", // too many digits
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => DataModelIdSchema.parse(id)).toThrow();
		}
	});
});

describe("DataModelFieldSchema", () => {
	it("should accept minimal valid field", () => {
		const validField = {
			name: "user_id",
			type: "string",
			description: "Unique identifier for the user",
		};

		expect(() => DataModelFieldSchema.parse(validField)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const field = {
			name: "user_id",
			type: "string",
			description: "Unique identifier for the user",
		};

		const parsed = DataModelFieldSchema.parse(field);
		expect(parsed.required).toBe(false);
		expect(parsed.constraints).toEqual([]);
	});

	it("should accept complete field with all properties", () => {
		const completeField = {
			name: "email",
			type: "string",
			description: "User email address",
			required: true,
			constraints: ["email format", "unique", "max length 255"],
		};

		const parsed = DataModelFieldSchema.parse(completeField);
		expect(parsed.name).toBe("email");
		expect(parsed.type).toBe("string");
		expect(parsed.description).toBe("User email address");
		expect(parsed.required).toBe(true);
		expect(parsed.constraints).toEqual([
			"email format",
			"unique",
			"max length 255",
		]);
	});

	it("should require all mandatory fields", () => {
		const requiredFields = ["name", "type", "description"];

		for (const field of requiredFields) {
			const invalidField = {
				name: "field_name",
				type: "string",
				description: "Field description",
			};
			delete (invalidField as Record<string, unknown>)[field];

			expect(() => DataModelFieldSchema.parse(invalidField)).toThrow();
		}
	});

	it("should reject empty strings for required fields", () => {
		const fieldsWithEmptyStrings = [
			{ name: "", type: "string", description: "Test" },
			{ name: "field", type: "", description: "Test" },
			{ name: "field", type: "string", description: "" },
		];

		for (const field of fieldsWithEmptyStrings) {
			expect(() => DataModelFieldSchema.parse(field)).toThrow();
		}
	});

	it("should reject empty strings in constraints array", () => {
		const fieldWithEmptyConstraint = {
			name: "field",
			type: "string",
			description: "Test",
			constraints: ["valid constraint", "", "another constraint"],
		};

		expect(() =>
			DataModelFieldSchema.parse(fieldWithEmptyConstraint),
		).toThrow();
	});
});

describe("DataModelRelationshipSchema", () => {
	it("should accept valid relationship", () => {
		const validRelationship = {
			name: "user_orders",
			target_model: "Order",
			relationship_type: "one-to-many",
			description: "User can have multiple orders",
		};

		expect(() =>
			DataModelRelationshipSchema.parse(validRelationship),
		).not.toThrow();
	});

	it("should accept various relationship types", () => {
		const relationshipTypes = [
			"one-to-many",
			"many-to-many",
			"foreign-key",
			"one-to-one",
			"many-to-one",
		];

		for (const type of relationshipTypes) {
			const relationship = {
				name: "test_relation",
				target_model: "TargetModel",
				relationship_type: type,
				description: "Test relationship",
			};
			expect(() =>
				DataModelRelationshipSchema.parse(relationship),
			).not.toThrow();
		}
	});

	it("should require all mandatory fields", () => {
		const requiredFields = [
			"name",
			"target_model",
			"relationship_type",
			"description",
		];

		for (const field of requiredFields) {
			const invalidRelationship = {
				name: "test_relation",
				target_model: "Target",
				relationship_type: "one-to-many",
				description: "Test",
			};
			delete (invalidRelationship as Record<string, unknown>)[field];

			expect(() =>
				DataModelRelationshipSchema.parse(invalidRelationship),
			).toThrow();
		}
	});

	it("should reject empty strings for required fields", () => {
		const relationshipsWithEmptyStrings = [
			{
				name: "",
				target_model: "Target",
				relationship_type: "one-to-many",
				description: "Test",
			},
			{
				name: "relation",
				target_model: "",
				relationship_type: "one-to-many",
				description: "Test",
			},
			{
				name: "relation",
				target_model: "Target",
				relationship_type: "",
				description: "Test",
			},
			{
				name: "relation",
				target_model: "Target",
				relationship_type: "one-to-many",
				description: "",
			},
		];

		for (const relationship of relationshipsWithEmptyStrings) {
			expect(() => DataModelRelationshipSchema.parse(relationship)).toThrow();
		}
	});
});

describe("DataModelExampleSchema", () => {
	it("should accept minimal valid example", () => {
		const validExample = {
			name: "Basic User",
			description: "Example of a basic user record",
			data: '{"id": "user-001", "name": "John Doe"}',
		};

		expect(() => DataModelExampleSchema.parse(validExample)).not.toThrow();
	});

	it("should accept complete example with format", () => {
		const completeExample = {
			name: "JSON User Example",
			description: "User record in JSON format",
			data: '{"id": "user-001", "name": "John Doe", "email": "john@example.com"}',
			format: "json",
		};

		const parsed = DataModelExampleSchema.parse(completeExample);
		expect(parsed.name).toBe("JSON User Example");
		expect(parsed.format).toBe("json");
	});

	it("should accept various data formats", () => {
		const formats = ["json", "xml", "yaml", "protobuf", "avro"];

		for (const format of formats) {
			const example = {
				name: "Test Example",
				description: "Test data",
				data: "sample data",
				format,
			};
			expect(() => DataModelExampleSchema.parse(example)).not.toThrow();
		}
	});

	it("should require all mandatory fields", () => {
		const requiredFields = ["name", "description", "data"];

		for (const field of requiredFields) {
			const invalidExample = {
				name: "Test Example",
				description: "Test description",
				data: "sample data",
			};
			delete (invalidExample as Record<string, unknown>)[field];

			expect(() => DataModelExampleSchema.parse(invalidExample)).toThrow();
		}
	});

	it("should reject empty strings for required fields", () => {
		const examplesWithEmptyStrings = [
			{ name: "", description: "Test", data: "data" },
			{ name: "Example", description: "", data: "data" },
			{ name: "Example", description: "Test", data: "" },
		];

		for (const example of examplesWithEmptyStrings) {
			expect(() => DataModelExampleSchema.parse(example)).toThrow();
		}
	});
});

describe("DataModelMigrationSchema", () => {
	it("should accept minimal valid migration", () => {
		const validMigration = {
			version: "1.0.0",
			description: "Initial schema",
			changes: ["Create user table"],
		};

		expect(() => DataModelMigrationSchema.parse(validMigration)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const migration = {
			version: "2.0.0",
			description: "Add email field",
			changes: ["Add email column to user table"],
		};

		const parsed = DataModelMigrationSchema.parse(migration);
		expect(parsed.breaking).toBe(false);
	});

	it("should accept complete migration with breaking flag", () => {
		const completeMigration = {
			version: "3.0.0",
			description: "Rename column",
			changes: ["Rename user_name to username", "Update all queries"],
			breaking: true,
		};

		const parsed = DataModelMigrationSchema.parse(completeMigration);
		expect(parsed.version).toBe("3.0.0");
		expect(parsed.description).toBe("Rename column");
		expect(parsed.changes).toHaveLength(2);
		expect(parsed.breaking).toBe(true);
	});

	it("should require all mandatory fields", () => {
		const requiredFields = ["version", "description", "changes"];

		for (const field of requiredFields) {
			const invalidMigration = {
				version: "1.0.0",
				description: "Test migration",
				changes: ["Test change"],
			};
			delete (invalidMigration as Record<string, unknown>)[field];

			expect(() => DataModelMigrationSchema.parse(invalidMigration)).toThrow();
		}
	});

	it("should reject empty strings for required fields", () => {
		const migrationsWithEmptyStrings = [
			{ version: "", description: "Test", changes: ["change"] },
			{ version: "1.0.0", description: "", changes: ["change"] },
		];

		for (const migration of migrationsWithEmptyStrings) {
			expect(() => DataModelMigrationSchema.parse(migration)).toThrow();
		}
	});

	it("should accept empty changes array", () => {
		const migrationWithEmptyChanges = {
			version: "1.0.0",
			description: "Test migration",
			changes: [],
		};

		expect(() =>
			DataModelMigrationSchema.parse(migrationWithEmptyChanges),
		).not.toThrow();
	});

	it("should reject empty strings in changes array", () => {
		const migrationWithEmptyChange = {
			version: "1.0.0",
			description: "Test migration",
			changes: ["Valid change", "", "Another change"],
		};

		expect(() =>
			DataModelMigrationSchema.parse(migrationWithEmptyChange),
		).toThrow();
	});
});

describe("DataModelSchema", () => {
	it("should accept minimal valid data model", () => {
		const validDataModel = {
			id: "dm-001",
			name: "User",
			description: "User data model",
			model_type: "database",
			format: "json-schema",
			schema: '{"type": "object", "properties": {}}',
		};

		expect(() => DataModelSchema.parse(validDataModel)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const dataModel = {
			id: "dm-001",
			name: "User",
			description: "User data model",
			model_type: "database",
			format: "json-schema",
			schema: '{"type": "object"}',
		};

		const parsed = DataModelSchema.parse(dataModel);
		expect(parsed.version).toBe("1.0.0");
		expect(parsed.fields).toEqual([]);
		expect(parsed.relationships).toEqual([]);
		expect(parsed.constraints).toEqual([]);
		expect(parsed.indexes).toEqual([]);
		expect(parsed.validations).toEqual([]);
		expect(parsed.examples).toEqual([]);
		expect(parsed.migrations).toEqual([]);
		expect(parsed.metadata).toEqual({});
	});

	it("should accept complete data model with all fields", () => {
		const completeDataModel = {
			id: "dm-001",
			name: "User",
			description: "User data model for authentication",
			model_type: "database",
			format: "sql",
			schema: "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));",
			version: "2.1.0",
			fields: [
				{
					name: "id",
					type: "integer",
					description: "Primary key",
					required: true,
					constraints: ["primary key", "auto-increment"],
				},
				{
					name: "email",
					type: "string",
					description: "User email",
					required: true,
					constraints: ["unique", "email format"],
				},
			],
			relationships: [
				{
					name: "user_posts",
					target_model: "Post",
					relationship_type: "one-to-many",
					description: "User can have multiple posts",
				},
			],
			constraints: [
				"Email must be unique",
				"Name cannot be null",
				"Age must be positive",
			],
			indexes: ["idx_user_email", "idx_user_created_at"],
			validations: ["Email must be valid format", "Password min length 8"],
			examples: [
				{
					name: "Basic User",
					description: "Standard user example",
					data: '{"id": 1, "email": "user@example.com"}',
					format: "json",
				},
			],
			migrations: [
				{
					version: "1.0.0",
					description: "Initial schema",
					changes: ["Create users table"],
					breaking: false,
				},
				{
					version: "2.0.0",
					description: "Add email field",
					changes: ["Add email column"],
					breaking: true,
				},
			],
			metadata: {
				database: "postgresql",
				table_name: "users",
				created_by: "admin",
			},
		};

		const parsed = DataModelSchema.parse(completeDataModel);
		expect(parsed.id).toBe("dm-001");
		expect(parsed.name).toBe("User");
		expect(parsed.version).toBe("2.1.0");
		expect(parsed.fields).toHaveLength(2);
		expect(parsed.relationships).toHaveLength(1);
		expect(parsed.constraints).toHaveLength(3);
		expect(parsed.indexes).toHaveLength(2);
		expect(parsed.validations).toHaveLength(2);
		expect(parsed.examples).toHaveLength(1);
		expect(parsed.migrations).toHaveLength(2);
		expect(parsed.metadata.database).toBe("postgresql");
	});

	it("should require all mandatory fields", () => {
		const requiredFields = [
			"id",
			"name",
			"description",
			"model_type",
			"format",
			"schema",
		];

		for (const field of requiredFields) {
			const invalidDataModel = {
				id: "dm-001",
				name: "User",
				description: "User model",
				model_type: "database",
				format: "json-schema",
				schema: "{}",
			};
			delete (invalidDataModel as Record<string, unknown>)[field];

			expect(() => DataModelSchema.parse(invalidDataModel)).toThrow();
		}
	});

	it("should reject empty strings for required fields", () => {
		const dataModelsWithEmptyStrings = [
			{
				id: "dm-001",
				name: "",
				description: "Test",
				model_type: "database",
				format: "json",
				schema: "{}",
			},
			{
				id: "dm-001",
				name: "Test",
				description: "",
				model_type: "database",
				format: "json",
				schema: "{}",
			},
			{
				id: "dm-001",
				name: "Test",
				description: "Test",
				model_type: "",
				format: "json",
				schema: "{}",
			},
			{
				id: "dm-001",
				name: "Test",
				description: "Test",
				model_type: "database",
				format: "",
				schema: "{}",
			},
			{
				id: "dm-001",
				name: "Test",
				description: "Test",
				model_type: "database",
				format: "json",
				schema: "",
			},
		];

		for (const dataModel of dataModelsWithEmptyStrings) {
			expect(() => DataModelSchema.parse(dataModel)).toThrow();
		}
	});

	it("should accept various model types", () => {
		const modelTypes = [
			"database",
			"api",
			"domain",
			"view",
			"cache",
			"message",
			"event",
		];

		for (const model_type of modelTypes) {
			const dataModel = {
				id: "dm-001",
				name: "Test Model",
				description: "Test",
				model_type,
				format: "json-schema",
				schema: "{}",
			};
			expect(() => DataModelSchema.parse(dataModel)).not.toThrow();
		}
	});

	it("should accept various format types", () => {
		const formats = [
			"json-schema",
			"sql",
			"typescript",
			"protobuf",
			"avro",
			"graphql",
		];

		for (const format of formats) {
			const dataModel = {
				id: "dm-001",
				name: "Test Model",
				description: "Test",
				model_type: "database",
				format,
				schema: "{}",
			};
			expect(() => DataModelSchema.parse(dataModel)).not.toThrow();
		}
	});

	it("should validate nested field schemas", () => {
		const dataModelWithInvalidField = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "json-schema",
			schema: "{}",
			fields: [
				{
					name: "",
					type: "string",
					description: "Invalid field",
				},
			],
		};

		expect(() => DataModelSchema.parse(dataModelWithInvalidField)).toThrow();
	});

	it("should validate nested relationship schemas", () => {
		const dataModelWithInvalidRelationship = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "json-schema",
			schema: "{}",
			relationships: [
				{
					name: "test_relation",
					target_model: "",
					relationship_type: "one-to-many",
					description: "Test",
				},
			],
		};

		expect(() =>
			DataModelSchema.parse(dataModelWithInvalidRelationship),
		).toThrow();
	});

	it("should validate nested example schemas", () => {
		const dataModelWithInvalidExample = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "json-schema",
			schema: "{}",
			examples: [
				{
					name: "",
					description: "Test",
					data: "{}",
				},
			],
		};

		expect(() => DataModelSchema.parse(dataModelWithInvalidExample)).toThrow();
	});

	it("should validate nested migration schemas", () => {
		const dataModelWithInvalidMigration = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "json-schema",
			schema: "{}",
			migrations: [
				{
					version: "",
					description: "Test",
					changes: ["test"],
				},
			],
		};

		expect(() =>
			DataModelSchema.parse(dataModelWithInvalidMigration),
		).toThrow();
	});

	it("should reject empty strings in string arrays", () => {
		const dataModel = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "json-schema",
			schema: "{}",
		};

		const dataModelWithEmptyConstraint = {
			...dataModel,
			constraints: ["Valid constraint", "", "Another constraint"],
		};
		expect(() => DataModelSchema.parse(dataModelWithEmptyConstraint)).toThrow();

		const dataModelWithEmptyIndex = {
			...dataModel,
			indexes: ["valid_index", "", "another_index"],
		};
		expect(() => DataModelSchema.parse(dataModelWithEmptyIndex)).toThrow();

		const dataModelWithEmptyValidation = {
			...dataModel,
			validations: ["Valid validation", "", "Another validation"],
		};
		expect(() => DataModelSchema.parse(dataModelWithEmptyValidation)).toThrow();
	});

	it("should accept arbitrary metadata structure", () => {
		const dataModelWithComplexMetadata = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "json-schema",
			schema: "{}",
			metadata: {
				database: "postgresql",
				table_name: "users",
				performance: {
					query_time: 50,
					index_count: 3,
				},
				tags: ["critical", "user-facing"],
				enabled: true,
			},
		};

		const parsed = DataModelSchema.parse(dataModelWithComplexMetadata);
		expect(parsed.metadata.database).toBe("postgresql");
		expect(parsed.metadata.performance).toEqual({
			query_time: 50,
			index_count: 3,
		});
		expect(parsed.metadata.tags).toEqual(["critical", "user-facing"]);
		expect(parsed.metadata.enabled).toBe(true);
	});

	it("should accept complex schema definitions", () => {
		const jsonSchema = JSON.stringify({
			$schema: "http://json-schema.org/draft-07/schema#",
			type: "object",
			properties: {
				id: { type: "integer" },
				name: { type: "string", minLength: 1 },
				email: { type: "string", format: "email" },
			},
			required: ["id", "name", "email"],
		});

		const dataModelWithComplexSchema = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "api",
			format: "json-schema",
			schema: jsonSchema,
		};

		const parsed = DataModelSchema.parse(dataModelWithComplexSchema);
		expect(parsed.schema).toBe(jsonSchema);
	});

	it("should validate multiple fields with various configurations", () => {
		const dataModelWithMultipleFields = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "sql",
			schema: "CREATE TABLE users...",
			fields: [
				{
					name: "id",
					type: "integer",
					description: "Primary key",
					required: true,
				},
				{
					name: "email",
					type: "string",
					description: "Email address",
					required: true,
					constraints: ["unique", "email format"],
				},
				{
					name: "bio",
					type: "text",
					description: "User biography",
					required: false,
					constraints: [],
				},
			],
		};

		const parsed = DataModelSchema.parse(dataModelWithMultipleFields);
		expect(parsed.fields).toHaveLength(3);
		expect(parsed.fields[0].required).toBe(true);
		expect(parsed.fields[1].constraints).toHaveLength(2);
		expect(parsed.fields[2].required).toBe(false);
	});

	it("should validate multiple relationships", () => {
		const dataModelWithMultipleRelationships = {
			id: "dm-001",
			name: "User",
			description: "User model",
			model_type: "database",
			format: "sql",
			schema: "CREATE TABLE users...",
			relationships: [
				{
					name: "user_posts",
					target_model: "Post",
					relationship_type: "one-to-many",
					description: "User posts",
				},
				{
					name: "user_profile",
					target_model: "Profile",
					relationship_type: "one-to-one",
					description: "User profile",
				},
				{
					name: "user_roles",
					target_model: "Role",
					relationship_type: "many-to-many",
					description: "User roles",
				},
			],
		};

		const parsed = DataModelSchema.parse(dataModelWithMultipleRelationships);
		expect(parsed.relationships).toHaveLength(3);
		expect(parsed.relationships[0].relationship_type).toBe("one-to-many");
		expect(parsed.relationships[1].relationship_type).toBe("one-to-one");
		expect(parsed.relationships[2].relationship_type).toBe("many-to-many");
	});
});
