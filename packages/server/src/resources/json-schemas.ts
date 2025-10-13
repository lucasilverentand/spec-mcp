/**
 * Generated JSON Schema resources - DO NOT EDIT
 * Run 'pnpm generate-schemas' to regenerate
 */

interface SchemaResource {
	uri: string;
	name: string;
	description: string;
	schema: unknown;
}

/**
 * Pure JSON Schema resources for each spec type
 * These are generated from Zod schemas and contain no additional documentation
 */
export const JSON_SCHEMA_RESOURCES: SchemaResource[] = [
	{
		uri: "spec-mcp://schema/plan",
		name: "Plan Schema",
		description: "JSON Schema for Plan specifications",
		schema: {
			$ref: "#/definitions/Plan",
			definitions: {
				Plan: {
					type: "object",
					properties: {
						type: {
							type: "string",
							const: "plan",
							description: "Entity type is always 'plan'",
						},
						number: {
							type: "integer",
							minimum: 0,
							description: "Unique sequential number",
						},
						slug: {
							allOf: [
								{
									type: "string",
									minLength: 1,
								},
								{
									type: "string",
									minLength: 1,
									pattern: "^[a-z0-9-]+$",
								},
							],
							description: "URL-friendly identifier",
						},
						name: {
							type: "string",
							minLength: 1,
							description: "Display name of the entity",
						},
						description: {
							type: "string",
							minLength: 1,
							description: "Detailed description of the entity",
						},
						priority: {
							type: "string",
							enum: ["critical", "high", "medium", "low", "nice-to-have"],
							default: "medium",
							description:
								"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was created",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was last updated",
						},
						criteria: {
							type: "object",
							properties: {
								requirement: {
									type: "string",
									pattern: "^(brd|prd)-\\d{3}-[a-z0-9-]+$",
									description: "ID of the requirement",
								},
								criteria: {
									type: "string",
									pattern: "^crt-\\d{3}$",
									description: "ID of the acceptance criteria",
								},
							},
							required: ["requirement", "criteria"],
							additionalProperties: false,
							description:
								"The acceptance criteria ID this plan fulfills (format: req-XXX-slug/crt-XXX). Optional for orchestration/milestone plans.",
						},
						scope: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: {
										type: "string",
										enum: ["in-scope", "out-of-scope"],
									},
									description: {
										type: "string",
										minLength: 1,
										description:
											"Description of what this scope item includes or excludes",
									},
									rationale: {
										type: "string",
										description:
											"Explanation for why this item is in or out of scope",
									},
								},
								required: ["type", "description"],
								additionalProperties: false,
							},
							default: [],
							description:
								"Defines what is included and excluded from this plan's scope",
						},
						depends_on: {
							type: "array",
							items: {
								type: "string",
								pattern: "^pln-\\d{3}-[a-z0-9-]+$",
							},
							default: [],
							description: "Other plans this plan relies on",
						},
						milestones: {
							type: "array",
							items: {
								type: "string",
								pattern: "^mls-\\d{3}-[a-z0-9-]+$",
							},
							default: [],
							description: "Milestones this plan contributes to",
						},
						tasks: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^tsk-\\d{3}$",
										minLength: 1,
										description: "Unique identifier for the task",
									},
									priority: {
										type: "string",
										enum: ["critical", "high", "medium", "low", "nice-to-have"],
										description: "Priority level for task ordering",
										default: "medium",
									},
									depends_on: {
										type: "array",
										items: {
											type: "string",
											pattern: "^tsk-\\d{3}$",
											minLength: 1,
										},
										default: [],
										description: "Array of task IDs this task depends on",
									},
									task: {
										type: "string",
										minLength: 10,
										maxLength: 300,
										description:
											"Clear and concise description of the task to be performed",
									},
									considerations: {
										type: "array",
										items: {
											type: "string",
											minLength: 10,
											maxLength: 100,
										},
										default: [],
										description: "Things to consider while performing the task",
									},
									references: {
										type: "array",
										items: {
											anyOf: [
												{
													type: "object",
													properties: {
														type: {
															type: "string",
															const: "url",
														},
														name: {
															type: "string",
															minLength: 1,
															description:
																"A short, descriptive name for the reference",
														},
														description: {
															type: "string",
															minLength: 1,
															description:
																"A brief description of the contents of the reference",
														},
														importance: {
															type: "string",
															enum: ["low", "medium", "high", "critical"],
															default: "medium",
															description:
																"The importance level of this reference",
														},
														url: {
															type: "string",
															format: "uri",
														},
														mime_type: {
															type: "string",
														},
													},
													required: ["type", "name", "description", "url"],
													additionalProperties: false,
												},
												{
													type: "object",
													properties: {
														type: {
															type: "string",
															const: "documentation",
														},
														name: {
															type: "string",
															minLength: 1,
															description:
																"A short, descriptive name for the reference",
														},
														description: {
															type: "string",
															minLength: 1,
															description:
																"A brief description of the contents of the reference",
														},
														importance: {
															type: "string",
															enum: ["low", "medium", "high", "critical"],
															default: "medium",
															description:
																"The importance level of this reference",
														},
														library: {
															type: "string",
															minLength: 1,
														},
														search_term: {
															type: "string",
															minLength: 1,
														},
													},
													required: [
														"type",
														"name",
														"description",
														"library",
														"search_term",
													],
													additionalProperties: false,
												},
												{
													type: "object",
													properties: {
														type: {
															type: "string",
															const: "file",
														},
														name: {
															type: "string",
															minLength: 1,
															description:
																"A short, descriptive name for the reference",
														},
														description: {
															type: "string",
															minLength: 1,
															description:
																"A brief description of the contents of the reference",
														},
														importance: {
															type: "string",
															enum: ["low", "medium", "high", "critical"],
															default: "medium",
															description:
																"The importance level of this reference",
														},
														path: {
															type: "string",
															minLength: 1,
														},
													},
													required: ["type", "name", "description", "path"],
													additionalProperties: false,
												},
												{
													type: "object",
													properties: {
														type: {
															type: "string",
															const: "code",
														},
														name: {
															type: "string",
															minLength: 1,
															description:
																"A short, descriptive name for the reference",
														},
														description: {
															type: "string",
															minLength: 1,
															description:
																"A brief description of the contents of the reference",
														},
														importance: {
															type: "string",
															enum: ["low", "medium", "high", "critical"],
															default: "medium",
															description:
																"The importance level of this reference",
														},
														code: {
															type: "string",
															minLength: 1,
															description: "The code snippet or example",
														},
														language: {
															type: "string",
															description: "Programming language of the code",
														},
													},
													required: ["type", "name", "description", "code"],
													additionalProperties: false,
												},
												{
													type: "object",
													properties: {
														type: {
															type: "string",
															const: "other",
														},
														name: {
															type: "string",
															minLength: 1,
															description:
																"A short, descriptive name for the reference",
														},
														description: {
															type: "string",
															minLength: 1,
															description:
																"A brief description of the contents of the reference",
														},
														importance: {
															type: "string",
															enum: ["low", "medium", "high", "critical"],
															default: "medium",
															description:
																"The importance level of this reference",
														},
													},
													required: ["type", "name", "description"],
													additionalProperties: false,
												},
											],
										},
										default: [],
										description:
											"External references for additional context or information",
									},
									files: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: {
													type: "string",
													pattern: "^file-\\d{3}$",
													minLength: 1,
													description: "Unique identifier for the file action",
												},
												path: {
													type: "string",
													pattern: "^[\\w\\-./]+$",
													minLength: 1,
													description:
														"Relative path to the file from the project root",
												},
												action: {
													type: "string",
													enum: ["create", "modify", "delete"],
													description: "Action to be performed on the file",
												},
												action_description: {
													type: "string",
													minLength: 1,
													description:
														"Description of what changes will be made to the file",
												},
												applied: {
													type: "boolean",
													default: false,
													description:
														"Whether the file action has been applied",
												},
											},
											required: ["id", "path", "action"],
											additionalProperties: false,
										},
										default: [],
										description:
											"Files that will be created or modified as part of the task",
									},
									status: {
										type: "object",
										properties: {
											created_at: {
												type: "string",
												format: "date-time",
												description: "Timestamp when the item was created",
											},
											started_at: {
												anyOf: [
													{
														type: "string",
														format: "date-time",
													},
													{
														type: "null",
													},
												],
												default: null,
												description:
													"Timestamp when work on the item was started",
											},
											completed_at: {
												anyOf: [
													{
														type: "string",
														format: "date-time",
													},
													{
														type: "null",
													},
												],
												default: null,
												description: "Timestamp when the item was completed",
											},
											verified_at: {
												anyOf: [
													{
														type: "string",
														format: "date-time",
													},
													{
														type: "null",
													},
												],
												default: null,
												description: "Timestamp when the item was verified",
											},
											notes: {
												type: "array",
												items: {
													type: "string",
													minLength: 1,
													description: "Note content",
												},
												default: [],
												description:
													"Log of timestamped notes taken during item execution",
											},
										},
										required: ["created_at"],
										additionalProperties: false,
										description: "Current status of the task",
									},
									blocked: {
										type: "array",
										items: {
											type: "object",
											properties: {
												reason: {
													type: "string",
													minLength: 10,
													description:
														"Clear description of why this task is blocked",
												},
												blocked_by: {
													type: "array",
													items: {
														type: "string",
														pattern: "^tsk-\\d{3}$",
														minLength: 1,
													},
													default: [],
													description:
														"IDs of tasks that are blocking this one (if applicable)",
												},
												external_dependency: {
													type: "string",
													description:
														"External factor blocking this task (e.g., 'Waiting for API access', 'Legal review pending')",
												},
												blocked_at: {
													type: "string",
													format: "date-time",
													description: "Timestamp when the task became blocked",
												},
												resolved_at: {
													anyOf: [
														{
															type: "string",
															format: "date-time",
														},
														{
															type: "null",
														},
													],
													default: null,
													description:
														"Timestamp when the blocker was resolved",
												},
											},
											required: ["reason", "blocked_at"],
											additionalProperties: false,
										},
										default: [],
										description:
											"List of blocking issues (current and historical). Only unresolved blocks (resolved_at is null) are active.",
									},
									supersedes: {
										anyOf: [
											{
												type: "string",
												pattern: "^tsk-\\d{3}$",
												minLength: 1,
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "ID of the task this replaces (if any)",
									},
									superseded_by: {
										anyOf: [
											{
												type: "string",
												pattern: "^tsk-\\d{3}$",
												minLength: 1,
											},
											{
												type: "null",
											},
										],
										default: null,
										description:
											"ID of the task that replaces this (if superseded)",
									},
									superseded_at: {
										anyOf: [
											{
												type: "string",
												format: "date-time",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "Timestamp when this task was superseded",
									},
								},
								required: ["id", "task", "status"],
								additionalProperties: false,
							},
							default: [],
							description: "List of tasks to be completed",
						},
						flows: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^flw-\\d{3}$",
										description: "Unique identifier for a flow",
									},
									type: {
										type: "string",
										description: "Type of flow, e.g., user, system, data",
									},
									name: {
										type: "string",
										minLength: 1,
										description: "Display name of the flow",
									},
									description: {
										type: "string",
										description: "High-level description of the flow's purpose",
									},
									steps: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: {
													type: "string",
													pattern: "^step-\\d{3}$",
												},
												name: {
													type: "string",
													minLength: 1,
													description: "Display name of the step",
												},
												description: {
													type: "string",
													description: "High-level description of the step",
												},
												next_steps: {
													type: "array",
													items: {
														type: "string",
														pattern: "^step-\\d{3}$",
													},
													default: [],
													description: "IDs of subsequent steps in the flow",
												},
											},
											required: ["id", "name"],
											additionalProperties: false,
										},
										minItems: 1,
										description: "Ordered list of steps in the flow",
									},
									supersedes: {
										anyOf: [
											{
												type: "string",
												pattern: "^flw-\\d{3}$",
												description: "Unique identifier for a flow",
											},
											{
												type: "null",
											},
										],
										description: "ID of the item this replaces (if any)",
										default: null,
									},
									superseded_by: {
										anyOf: [
											{
												type: "string",
												pattern: "^flw-\\d{3}$",
												description: "Unique identifier for a flow",
											},
											{
												type: "null",
											},
										],
										description:
											"ID of the item that replaces this (if superseded)",
										default: null,
									},
									superseded_at: {
										anyOf: [
											{
												type: "string",
												format: "date-time",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "Timestamp when this item was superseded",
									},
								},
								required: ["id", "type", "name", "steps"],
								additionalProperties: false,
							},
							default: [],
							description: "List of flows involved in the plan",
						},
						test_cases: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^tst-\\d{3}$",
										description: "Unique identifier for the test case",
									},
									name: {
										type: "string",
										minLength: 1,
										description: "Display name of the test case",
									},
									description: {
										type: "string",
										minLength: 1,
										description:
											"Detailed description of what the test case covers",
									},
									steps: {
										type: "array",
										items: {
											type: "string",
											minLength: 1,
										},
										description:
											"Ordered list of steps to execute the test case",
									},
									expected_result: {
										type: "string",
										minLength: 1,
										description: "Expected outcome of the test case",
									},
									implemented: {
										type: "boolean",
										default: false,
										description: "Whether the test case has been implemented",
									},
									passing: {
										type: "boolean",
										default: false,
										description: "Whether the test case is currently passing",
									},
									supersedes: {
										anyOf: [
											{
												type: "string",
												pattern: "^tst-\\d{3}$",
												description: "Unique identifier for the test case",
											},
											{
												type: "null",
											},
										],
										description: "ID of the item this replaces (if any)",
										default: null,
									},
									superseded_by: {
										anyOf: [
											{
												type: "string",
												pattern: "^tst-\\d{3}$",
												description: "Unique identifier for the test case",
											},
											{
												type: "null",
											},
										],
										description:
											"ID of the item that replaces this (if superseded)",
										default: null,
									},
									superseded_at: {
										anyOf: [
											{
												type: "string",
												format: "date-time",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "Timestamp when this item was superseded",
									},
								},
								required: [
									"id",
									"name",
									"description",
									"steps",
									"expected_result",
								],
								additionalProperties: false,
							},
							default: [],
							description: "Test cases to validate the plan",
						},
						api_contracts: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^api-\\d{3}$",
										description: "Unique identifier for the API contract",
									},
									name: {
										type: "string",
										minLength: 1,
										description: "Display name of the API",
									},
									description: {
										type: "string",
										minLength: 1,
										description: "Detailed description of what this API does",
									},
									contract_type: {
										type: "string",
										minLength: 1,
										description:
											"Type of API contract (e.g., 'rest', 'graphql', 'grpc', 'library', 'cli', 'websocket', etc.)",
									},
									specification: {
										type: "string",
										description:
											"Flexible specification object that can hold any API contract format (OpenAPI, GraphQL schema, TypeScript definitions, etc.)",
									},
									examples: {
										type: "array",
										items: {
											type: "object",
											properties: {
												name: {
													type: "string",
													minLength: 1,
													description: "Name of the example",
												},
												description: {
													type: "string",
													minLength: 1,
													description:
														"Description of what this example demonstrates",
												},
												code: {
													type: "string",
													minLength: 1,
													description: "Example code or usage",
												},
												language: {
													type: "string",
													description:
														"Programming language or format of the example",
												},
											},
											required: ["name", "description", "code"],
											additionalProperties: false,
										},
										default: [],
										description: "Usage examples for the API",
									},
									supersedes: {
										anyOf: [
											{
												type: "string",
												pattern: "^api-\\d{3}$",
												description: "Unique identifier for the API contract",
											},
											{
												type: "null",
											},
										],
										description: "ID of the item this replaces (if any)",
										default: null,
									},
									superseded_by: {
										anyOf: [
											{
												type: "string",
												pattern: "^api-\\d{3}$",
												description: "Unique identifier for the API contract",
											},
											{
												type: "null",
											},
										],
										description:
											"ID of the item that replaces this (if superseded)",
										default: null,
									},
									superseded_at: {
										anyOf: [
											{
												type: "string",
												format: "date-time",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "Timestamp when this item was superseded",
									},
								},
								required: [
									"id",
									"name",
									"description",
									"contract_type",
									"specification",
								],
								additionalProperties: false,
							},
							default: [],
							description: "API contracts defined or consumed by this plan",
						},
						data_models: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^dat-\\d{3}$",
										description: "Unique identifier for the data model",
									},
									name: {
										type: "string",
										minLength: 1,
										description: "Display name of the data model",
									},
									description: {
										type: "string",
										minLength: 1,
										description:
											"Detailed description of what this data model represents",
									},
									format: {
										type: "string",
										minLength: 1,
										description:
											"Format/notation used (e.g., 'json-schema', 'sql', 'typescript', 'protobuf', 'avro', 'graphql', etc.)",
									},
									schema: {
										type: "string",
										minLength: 1,
										description: "The actual model definition/schema",
									},
									fields: {
										type: "array",
										items: {
											type: "object",
											properties: {
												name: {
													type: "string",
													minLength: 1,
													description: "Name of the field",
												},
												type: {
													type: "string",
													minLength: 1,
													description: "Data type of the field",
												},
												description: {
													type: "string",
													minLength: 1,
													description:
														"Description of what this field represents",
												},
												constraints: {
													type: "array",
													items: {
														type: "string",
														minLength: 1,
													},
													default: [],
													description:
														"Validation constraints for this field, e.g., 'max length', 'pattern', required, optional",
												},
											},
											required: ["name", "type", "description"],
											additionalProperties: false,
										},
										default: [],
										description: "Key fields/properties of the data model",
									},
									relationships: {
										type: "array",
										items: {
											type: "object",
											properties: {
												name: {
													type: "string",
													minLength: 1,
													description: "Name of the relationship",
												},
												target_model: {
													type: "string",
													minLength: 1,
													description: "Target data model or entity",
												},
												relationship_type: {
													type: "string",
													minLength: 1,
													description:
														"Type of relationship (e.g., 'one-to-many', 'many-to-many', 'foreign-key')",
												},
												description: {
													type: "string",
													minLength: 1,
													description: "Description of the relationship",
												},
											},
											required: [
												"name",
												"target_model",
												"relationship_type",
												"description",
											],
											additionalProperties: false,
										},
										default: [],
										description: "Relationships to other data models",
									},
									constraints: {
										type: "array",
										items: {
											type: "string",
											minLength: 1,
										},
										default: [],
										description: "Business rules or constraints",
									},
									indexes: {
										type: "array",
										items: {
											type: "string",
											minLength: 1,
										},
										default: [],
										description: "Indexes for database models",
									},
									examples: {
										type: "array",
										items: {
											type: "object",
											properties: {
												name: {
													type: "string",
													minLength: 1,
													description: "Name of the example",
												},
												description: {
													type: "string",
													minLength: 1,
													description:
														"Description of what this example demonstrates",
												},
												data: {
													type: "string",
													minLength: 1,
													description: "Example data instance",
												},
												format: {
													type: "string",
													description: "Format of the example data",
												},
											},
											required: ["name", "description", "data"],
											additionalProperties: false,
										},
										default: [],
										description: "Example instances of the data model",
									},
									supersedes: {
										anyOf: [
											{
												type: "string",
												pattern: "^dat-\\d{3}$",
												description: "Unique identifier for the data model",
											},
											{
												type: "null",
											},
										],
										description: "ID of the item this replaces (if any)",
										default: null,
									},
									superseded_by: {
										anyOf: [
											{
												type: "string",
												pattern: "^dat-\\d{3}$",
												description: "Unique identifier for the data model",
											},
											{
												type: "null",
											},
										],
										description:
											"ID of the item that replaces this (if superseded)",
										default: null,
									},
									superseded_at: {
										anyOf: [
											{
												type: "string",
												format: "date-time",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "Timestamp when this item was superseded",
									},
								},
								required: ["id", "name", "description", "format", "schema"],
								additionalProperties: false,
							},
							default: [],
							description:
								"Data models, schemas, and structures defined or used by this plan",
						},
						references: {
							type: "array",
							items: {
								anyOf: [
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "url",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											url: {
												type: "string",
												format: "uri",
											},
											mime_type: {
												type: "string",
											},
										},
										required: ["type", "name", "description", "url"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "documentation",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											library: {
												type: "string",
												minLength: 1,
											},
											search_term: {
												type: "string",
												minLength: 1,
											},
										},
										required: [
											"type",
											"name",
											"description",
											"library",
											"search_term",
										],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "file",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											path: {
												type: "string",
												minLength: 1,
											},
										},
										required: ["type", "name", "description", "path"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "code",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											code: {
												type: "string",
												minLength: 1,
												description: "The code snippet or example",
											},
											language: {
												type: "string",
												description: "Programming language of the code",
											},
										},
										required: ["type", "name", "description", "code"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "other",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
										},
										required: ["type", "name", "description"],
										additionalProperties: false,
									},
								],
							},
							default: [],
							description: "References that inform this plan",
						},
					},
					required: [
						"type",
						"number",
						"slug",
						"name",
						"description",
						"created_at",
						"updated_at",
						"criteria",
					],
					additionalProperties: false,
				},
			},
			$schema: "http://json-schema.org/draft-07/schema#",
		},
	},
	{
		uri: "spec-mcp://schema/business-requirement",
		name: "Business Requirement Schema",
		description: "JSON Schema for Business Requirement (BRD) specifications",
		schema: {
			$ref: "#/definitions/BusinessRequirement",
			definitions: {
				BusinessRequirement: {
					type: "object",
					properties: {
						type: {
							type: "string",
							const: "business-requirement",
							description: "Entity type",
						},
						number: {
							type: "integer",
							minimum: 0,
							description: "Unique sequential number",
						},
						slug: {
							allOf: [
								{
									type: "string",
									minLength: 1,
								},
								{
									type: "string",
									minLength: 1,
									pattern: "^[a-z0-9-]+$",
								},
							],
							description: "URL-friendly identifier",
						},
						name: {
							type: "string",
							minLength: 1,
							description: "Display name of the entity",
						},
						description: {
							type: "string",
							minLength: 1,
							description: "Detailed description of the entity",
						},
						priority: {
							type: "string",
							enum: ["critical", "high", "medium", "low", "nice-to-have"],
							default: "medium",
							description:
								"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was created",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was last updated",
						},
						business_value: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: {
										type: "string",
										enum: [
											"revenue",
											"cost-savings",
											"customer-satisfaction",
											"other",
										],
										description: "Type of business value",
									},
									value: {
										type: "string",
										minLength: 1,
										description:
											"The business value, ROI, or benefit this delivers",
									},
								},
								required: ["type", "value"],
								additionalProperties: false,
							},
							minItems: 1,
							description: "The business value, ROI, or benefit this delivers",
						},
						stakeholders: {
							type: "array",
							items: {
								type: "object",
								properties: {
									role: {
										type: "string",
										enum: [
											"product-owner",
											"business-analyst",
											"project-manager",
											"customer",
											"end-user",
											"executive",
											"developer",
											"other",
										],
										description: "Role of the stakeholder",
									},
									interest: {
										type: "string",
										minLength: 10,
										description: "Stakeholder's interest",
									},
									name: {
										type: "string",
										minLength: 3,
										description: "Name of the stakeholder",
									},
									email: {
										type: "string",
										format: "email",
										description: "Email of the stakeholder",
									},
								},
								required: ["role", "interest", "name"],
								additionalProperties: false,
							},
							default: [],
							description: "Key stakeholders with interest in this requirement",
						},
						user_stories: {
							type: "array",
							items: {
								type: "object",
								properties: {
									role: {
										type: "string",
										minLength: 3,
										description: "The role of the user",
									},
									feature: {
										type: "string",
										minLength: 10,
										description: "The feature the user wants",
									},
									benefit: {
										type: "string",
										minLength: 10,
										description: "The benefit the user expects",
									},
								},
								required: ["role", "feature", "benefit"],
								additionalProperties: false,
							},
							minItems: 1,
							description: "User stories that illustrate the requirement",
						},
						criteria: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^crt-\\d{3}$",
										description: "Unique identifier for the criterion",
									},
									description: {
										type: "string",
										minLength: 1,
										description: "Description of the acceptance criterion",
									},
									rationale: {
										type: "string",
										minLength: 1,
										description:
											"Rationale explaining why this criterion is important",
									},
									supersedes: {
										anyOf: [
											{
												type: "string",
												pattern: "^crt-\\d{3}$",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "ID of the criteria this replaces (if any)",
									},
									superseded_by: {
										anyOf: [
											{
												type: "string",
												pattern: "^crt-\\d{3}$",
											},
											{
												type: "null",
											},
										],
										default: null,
										description:
											"ID of the criteria that replaces this (if superseded)",
									},
									superseded_at: {
										anyOf: [
											{
												type: "string",
												format: "date-time",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "Timestamp when this criteria was superseded",
									},
								},
								required: ["id", "description", "rationale"],
								additionalProperties: false,
							},
							minItems: 1,
							description: "Acceptance criteria that must be met",
						},
						references: {
							type: "array",
							items: {
								anyOf: [
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "url",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											url: {
												type: "string",
												format: "uri",
											},
											mime_type: {
												type: "string",
											},
										},
										required: ["type", "name", "description", "url"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "documentation",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											library: {
												type: "string",
												minLength: 1,
											},
											search_term: {
												type: "string",
												minLength: 1,
											},
										},
										required: [
											"type",
											"name",
											"description",
											"library",
											"search_term",
										],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "file",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											path: {
												type: "string",
												minLength: 1,
											},
										},
										required: ["type", "name", "description", "path"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "code",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											code: {
												type: "string",
												minLength: 1,
												description: "The code snippet or example",
											},
											language: {
												type: "string",
												description: "Programming language of the code",
											},
										},
										required: ["type", "name", "description", "code"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "other",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
										},
										required: ["type", "name", "description"],
										additionalProperties: false,
									},
								],
							},
							default: [],
							description: "External references, documentation, or resources",
						},
					},
					required: [
						"type",
						"number",
						"slug",
						"name",
						"description",
						"created_at",
						"updated_at",
						"business_value",
						"user_stories",
						"criteria",
					],
					additionalProperties: false,
				},
			},
			$schema: "http://json-schema.org/draft-07/schema#",
		},
	},
	{
		uri: "spec-mcp://schema/technical-requirement",
		name: "Technical Requirement Schema",
		description: "JSON Schema for Technical Requirement (PRD) specifications",
		schema: {
			$ref: "#/definitions/TechnicalRequirement",
			definitions: {
				TechnicalRequirement: {
					type: "object",
					properties: {
						type: {
							type: "string",
							const: "technical-requirement",
							description: "Entity type",
						},
						number: {
							type: "integer",
							minimum: 0,
							description: "Unique sequential number",
						},
						slug: {
							allOf: [
								{
									type: "string",
									minLength: 1,
								},
								{
									type: "string",
									minLength: 1,
									pattern: "^[a-z0-9-]+$",
								},
							],
							description: "URL-friendly identifier",
						},
						name: {
							type: "string",
							minLength: 1,
							description: "Display name of the entity",
						},
						description: {
							type: "string",
							minLength: 1,
							description: "Detailed description of the entity",
						},
						priority: {
							type: "string",
							enum: ["critical", "high", "medium", "low", "nice-to-have"],
							default: "medium",
							description:
								"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was created",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was last updated",
						},
						technical_context: {
							type: "string",
							minLength: 1,
							description: "Technical context, background, or rationale",
						},
						implementation_approach: {
							type: "string",
							description: "High-level description of implementation approach",
						},
						technical_dependencies: {
							type: "array",
							items: {
								anyOf: [
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "url",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											url: {
												type: "string",
												format: "uri",
											},
											mime_type: {
												type: "string",
											},
										},
										required: ["type", "name", "description", "url"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "documentation",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											library: {
												type: "string",
												minLength: 1,
											},
											search_term: {
												type: "string",
												minLength: 1,
											},
										},
										required: [
											"type",
											"name",
											"description",
											"library",
											"search_term",
										],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "file",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											path: {
												type: "string",
												minLength: 1,
											},
										},
										required: ["type", "name", "description", "path"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "code",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											code: {
												type: "string",
												minLength: 1,
												description: "The code snippet or example",
											},
											language: {
												type: "string",
												description: "Programming language of the code",
											},
										},
										required: ["type", "name", "description", "code"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "other",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
										},
										required: ["type", "name", "description"],
										additionalProperties: false,
									},
								],
							},
							default: [],
							description:
								"Technical dependencies (libraries, frameworks, APIs, systems)",
						},
						constraints: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: {
										type: "string",
										enum: [
											"performance",
											"security",
											"scalability",
											"compatibility",
											"infrastructure",
											"other",
										],
										description: "Type of technical constraint",
									},
									description: {
										type: "string",
										minLength: 1,
										description: "Description of the constraint",
									},
								},
								required: ["type", "description"],
								additionalProperties: false,
							},
							default: [],
							description: "Technical constraints to consider",
						},
						implementation_notes: {
							type: "string",
							description: "Additional implementation notes or considerations",
						},
						criteria: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^crt-\\d{3}$",
										description: "Unique identifier for the criterion",
									},
									description: {
										type: "string",
										minLength: 1,
										description: "Description of the acceptance criterion",
									},
									rationale: {
										type: "string",
										minLength: 1,
										description:
											"Rationale explaining why this criterion is important",
									},
									supersedes: {
										anyOf: [
											{
												type: "string",
												pattern: "^crt-\\d{3}$",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "ID of the criteria this replaces (if any)",
									},
									superseded_by: {
										anyOf: [
											{
												type: "string",
												pattern: "^crt-\\d{3}$",
											},
											{
												type: "null",
											},
										],
										default: null,
										description:
											"ID of the criteria that replaces this (if superseded)",
									},
									superseded_at: {
										anyOf: [
											{
												type: "string",
												format: "date-time",
											},
											{
												type: "null",
											},
										],
										default: null,
										description: "Timestamp when this criteria was superseded",
									},
								},
								required: ["id", "description", "rationale"],
								additionalProperties: false,
							},
							minItems: 1,
							description: "Technical acceptance criteria that must be met",
						},
						references: {
							type: "array",
							items: {
								anyOf: [
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "url",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											url: {
												type: "string",
												format: "uri",
											},
											mime_type: {
												type: "string",
											},
										},
										required: ["type", "name", "description", "url"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "documentation",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											library: {
												type: "string",
												minLength: 1,
											},
											search_term: {
												type: "string",
												minLength: 1,
											},
										},
										required: [
											"type",
											"name",
											"description",
											"library",
											"search_term",
										],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "file",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											path: {
												type: "string",
												minLength: 1,
											},
										},
										required: ["type", "name", "description", "path"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "code",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											code: {
												type: "string",
												minLength: 1,
												description: "The code snippet or example",
											},
											language: {
												type: "string",
												description: "Programming language of the code",
											},
										},
										required: ["type", "name", "description", "code"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "other",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
										},
										required: ["type", "name", "description"],
										additionalProperties: false,
									},
								],
							},
							default: [],
							description: "External references, documentation, or resources",
						},
					},
					required: [
						"type",
						"number",
						"slug",
						"name",
						"description",
						"created_at",
						"updated_at",
						"technical_context",
						"criteria",
					],
					additionalProperties: false,
				},
			},
			$schema: "http://json-schema.org/draft-07/schema#",
		},
	},
	{
		uri: "spec-mcp://schema/decision",
		name: "Decision Schema",
		description: "JSON Schema for Decision (DEC) specifications",
		schema: {
			$ref: "#/definitions/Decision",
			definitions: {
				Decision: {
					type: "object",
					properties: {
						type: {
							type: "string",
							const: "decision",
						},
						number: {
							type: "integer",
							minimum: 0,
							description: "Unique sequential number",
						},
						slug: {
							allOf: [
								{
									type: "string",
									minLength: 1,
								},
								{
									type: "string",
									minLength: 1,
									pattern: "^[a-z0-9-]+$",
								},
							],
							description: "URL-friendly identifier",
						},
						name: {
							type: "string",
							minLength: 1,
							description: "Display name of the entity",
						},
						description: {
							type: "string",
							minLength: 1,
							description: "Detailed description of the entity",
						},
						priority: {
							type: "string",
							enum: ["critical", "high", "medium", "low", "nice-to-have"],
							default: "medium",
							description:
								"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was created",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was last updated",
						},
						decision: {
							type: "string",
							minLength: 20,
							maxLength: 500,
							description: "Clear statement of what was decided",
						},
						context: {
							type: "string",
							minLength: 20,
							maxLength: 1000,
							description: "Situation or problem that prompted this decision",
						},
						decision_status: {
							type: "string",
							enum: ["proposed", "accepted", "deprecated", "superseded"],
							default: "proposed",
							description: "Current status of this decision",
						},
						alternatives: {
							type: "array",
							items: {
								type: "string",
							},
							default: [],
							description: "Options considered but not chosen",
						},
						supersedes: {
							type: "string",
							pattern: "^dec-\\d{3}-[a-z0-9-]+$",
							description: "Previous decision this replaces",
						},
						references: {
							type: "array",
							items: {
								anyOf: [
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "url",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											url: {
												type: "string",
												format: "uri",
											},
											mime_type: {
												type: "string",
											},
										},
										required: ["type", "name", "description", "url"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "documentation",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											library: {
												type: "string",
												minLength: 1,
											},
											search_term: {
												type: "string",
												minLength: 1,
											},
										},
										required: [
											"type",
											"name",
											"description",
											"library",
											"search_term",
										],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "file",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											path: {
												type: "string",
												minLength: 1,
											},
										},
										required: ["type", "name", "description", "path"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "code",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											code: {
												type: "string",
												minLength: 1,
												description: "The code snippet or example",
											},
											language: {
												type: "string",
												description: "Programming language of the code",
											},
										},
										required: ["type", "name", "description", "code"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "other",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
										},
										required: ["type", "name", "description"],
										additionalProperties: false,
									},
								],
							},
							default: [],
							description: "Supporting documentation, research, benchmarks",
						},
						consequences: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: {
										type: "string",
										enum: ["positive", "negative", "risk"],
										description: "Type of consequence",
									},
									description: {
										type: "string",
										minLength: 10,
										maxLength: 300,
										description: "Description of the consequence",
									},
									mitigation: {
										type: "string",
										minLength: 10,
										maxLength: 300,
										description:
											"Mitigation strategy for negative consequences or risks",
									},
								},
								required: ["type", "description"],
								additionalProperties: false,
							},
							default: [],
							description:
								"Positive and negative consequences of this decision",
						},
					},
					required: [
						"type",
						"number",
						"slug",
						"name",
						"description",
						"created_at",
						"updated_at",
						"decision",
						"context",
					],
					additionalProperties: false,
				},
			},
			$schema: "http://json-schema.org/draft-07/schema#",
		},
	},
	{
		uri: "spec-mcp://schema/component",
		name: "Component Schema",
		description: "JSON Schema for Component (CMP) specifications",
		schema: {
			$ref: "#/definitions/Component",
			definitions: {
				Component: {
					type: "object",
					properties: {
						type: {
							type: "string",
							const: "component",
						},
						number: {
							type: "integer",
							minimum: 0,
							description: "Unique sequential number",
						},
						slug: {
							allOf: [
								{
									type: "string",
									minLength: 1,
								},
								{
									type: "string",
									minLength: 1,
									pattern: "^[a-z0-9-]+$",
								},
							],
							description: "URL-friendly identifier",
						},
						name: {
							type: "string",
							minLength: 1,
							description: "Display name of the entity",
						},
						description: {
							type: "string",
							minLength: 1,
							description: "Detailed description of the entity",
						},
						priority: {
							type: "string",
							enum: ["critical", "high", "medium", "low", "nice-to-have"],
							default: "medium",
							description:
								"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was created",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was last updated",
						},
						component_type: {
							type: "string",
							enum: ["app", "service", "library"],
							description: "Type of the component (app, service, library)",
						},
						folder: {
							type: "string",
							minLength: 1,
							default: ".",
							description: "Relative path from repository root",
						},
						tech_stack: {
							type: "array",
							items: {
								type: "string",
							},
							default: [],
							description: "Technologies and frameworks used in this component",
						},
						deployments: {
							type: "array",
							items: {
								type: "object",
								properties: {
									platform: {
										type: "string",
										minLength: 1,
										description:
											"Deployment platform (e.g., 'AWS ECS', 'Vercel', 'Railway', 'Kubernetes', 'npm', 'App Store', 'Google Play')",
									},
									url: {
										type: "string",
										minLength: 1,
										description: "Production URL or endpoint",
									},
									build_command: {
										type: "string",
										minLength: 1,
										description: "Command to build the component",
									},
									deploy_command: {
										type: "string",
										minLength: 1,
										description: "Command to deploy the component",
									},
									environment_vars: {
										type: "array",
										items: {
											type: "string",
										},
										default: [],
										description: "Required environment variables",
									},
									secrets: {
										type: "array",
										items: {
											type: "string",
										},
										default: [],
										description: "Required secrets (e.g., API keys, passwords)",
									},
									notes: {
										type: "string",
										minLength: 1,
										description: "Additional deployment notes or instructions",
									},
								},
								required: ["platform"],
								additionalProperties: false,
							},
							default: [],
							description:
								"Deployment configuration including platform, URLs, commands, and environment variables",
						},
						scope: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: {
										type: "string",
										enum: ["in-scope", "out-of-scope"],
									},
									description: {
										type: "string",
										minLength: 1,
										description:
											"Description of what this scope item includes or excludes",
									},
									rationale: {
										type: "string",
										description:
											"Explanation for why this item is in or out of scope",
									},
								},
								required: ["type", "description"],
								additionalProperties: false,
							},
							default: [],
							description:
								"Explicit scope definition with in-scope and out-of-scope items with reasoning",
						},
						depends_on: {
							type: "array",
							items: {
								type: "string",
								pattern: "^cmp-\\d{3}-[a-z0-9-]+$",
							},
							default: [],
							description: "Other components this component relies on",
						},
						external_dependencies: {
							type: "array",
							items: {
								type: "string",
							},
							default: [],
							description: "Third-party services or libraries used",
						},
						dev_port: {
							type: "number",
							minimum: 1,
							maximum: 65535,
							description: "Dev server port",
						},
						notes: {
							type: "string",
							minLength: 1,
							description: "Additional notes or comments about the component",
						},
					},
					required: [
						"type",
						"number",
						"slug",
						"name",
						"description",
						"created_at",
						"updated_at",
						"component_type",
					],
					additionalProperties: false,
				},
			},
			$schema: "http://json-schema.org/draft-07/schema#",
		},
	},
	{
		uri: "spec-mcp://schema/constitution",
		name: "Constitution Schema",
		description: "JSON Schema for Constitution (CON) specifications",
		schema: {
			$ref: "#/definitions/Constitution",
			definitions: {
				Constitution: {
					type: "object",
					properties: {
						type: {
							type: "string",
							const: "constitution",
						},
						number: {
							type: "integer",
							minimum: 0,
							description: "Unique sequential number",
						},
						slug: {
							allOf: [
								{
									type: "string",
									minLength: 1,
								},
								{
									type: "string",
									minLength: 1,
									pattern: "^[a-z0-9-]+$",
								},
							],
							description: "URL-friendly identifier",
						},
						name: {
							type: "string",
							minLength: 1,
							description: "Display name of the entity",
						},
						description: {
							type: "string",
							minLength: 1,
							description: "Detailed description of the entity",
						},
						priority: {
							type: "string",
							enum: ["critical", "high", "medium", "low", "nice-to-have"],
							default: "medium",
							description:
								"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was created",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was last updated",
						},
						articles: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
										pattern: "^art-\\d{3}$",
										description: "Unique identifier for an article",
									},
									title: {
										type: "string",
										minLength: 1,
										description:
											"Article title (e.g., 'Library-First Principle')",
									},
									principle: {
										type: "string",
										minLength: 1,
										description:
											"The core principle or rule this article establishes",
									},
									rationale: {
										type: "string",
										minLength: 1,
										description:
											"Explanation of why this principle exists and its benefits",
									},
									examples: {
										type: "array",
										items: {
											type: "string",
										},
										default: [],
										description:
											"Concrete examples demonstrating the principle",
									},
									exceptions: {
										type: "array",
										items: {
											type: "string",
										},
										default: [],
										description:
											"Situations where this principle may not apply",
									},
									status: {
										type: "string",
										enum: ["needs-review", "active", "archived"],
										description:
											"Article status: needs-review (drafted), active (approved), archived (no longer in effect)",
										default: "needs-review",
									},
								},
								required: ["id", "title", "principle", "rationale"],
								additionalProperties: false,
							},
							minItems: 1,
							description:
								"Core principles that govern all development decisions",
						},
					},
					required: [
						"type",
						"number",
						"slug",
						"name",
						"description",
						"created_at",
						"updated_at",
						"articles",
					],
					additionalProperties: false,
				},
			},
			$schema: "http://json-schema.org/draft-07/schema#",
		},
	},
	{
		uri: "spec-mcp://schema/milestone",
		name: "Milestone Schema",
		description: "JSON Schema for Milestone (MLS) specifications",
		schema: {
			$ref: "#/definitions/Milestone",
			definitions: {
				Milestone: {
					type: "object",
					properties: {
						type: {
							type: "string",
							const: "milestone",
							description: "Entity type is always 'milestone'",
						},
						number: {
							type: "integer",
							minimum: 0,
							description: "Unique sequential number",
						},
						slug: {
							allOf: [
								{
									type: "string",
									minLength: 1,
								},
								{
									type: "string",
									minLength: 1,
									pattern: "^[a-z0-9-]+$",
								},
							],
							description: "URL-friendly identifier",
						},
						name: {
							type: "string",
							minLength: 1,
							description: "Display name of the entity",
						},
						description: {
							type: "string",
							minLength: 1,
							description: "Detailed description of the entity",
						},
						priority: {
							type: "string",
							enum: ["critical", "high", "medium", "low", "nice-to-have"],
							default: "medium",
							description:
								"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was created",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Timestamp when entity was last updated",
						},
						target_date: {
							anyOf: [
								{
									type: "string",
									format: "date-time",
								},
								{
									type: "null",
								},
							],
							default: null,
							description: "Target completion date for the milestone",
						},
						references: {
							type: "array",
							items: {
								anyOf: [
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "url",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											url: {
												type: "string",
												format: "uri",
											},
											mime_type: {
												type: "string",
											},
										},
										required: ["type", "name", "description", "url"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "documentation",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											library: {
												type: "string",
												minLength: 1,
											},
											search_term: {
												type: "string",
												minLength: 1,
											},
										},
										required: [
											"type",
											"name",
											"description",
											"library",
											"search_term",
										],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "file",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											path: {
												type: "string",
												minLength: 1,
											},
										},
										required: ["type", "name", "description", "path"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "code",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
											code: {
												type: "string",
												minLength: 1,
												description: "The code snippet or example",
											},
											language: {
												type: "string",
												description: "Programming language of the code",
											},
										},
										required: ["type", "name", "description", "code"],
										additionalProperties: false,
									},
									{
										type: "object",
										properties: {
											type: {
												type: "string",
												const: "other",
											},
											name: {
												type: "string",
												minLength: 1,
												description:
													"A short, descriptive name for the reference",
											},
											description: {
												type: "string",
												minLength: 1,
												description:
													"A brief description of the contents of the reference",
											},
											importance: {
												type: "string",
												enum: ["low", "medium", "high", "critical"],
												default: "medium",
												description: "The importance level of this reference",
											},
										},
										required: ["type", "name", "description"],
										additionalProperties: false,
									},
								],
							},
							default: [],
							description: "External references for additional context",
						},
					},
					required: [
						"type",
						"number",
						"slug",
						"name",
						"description",
						"created_at",
						"updated_at",
					],
					additionalProperties: false,
				},
			},
			$schema: "http://json-schema.org/draft-07/schema#",
		},
	},
];
