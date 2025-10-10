import {
	ApiContractSchema,
	DataModelSchema,
	FlowSchema,
	type Plan,
	PlanSchema,
	TaskSchema,
	TestCaseSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createPlanDrafterConfig(): EntityDrafterConfig<Plan> {
	return {
		schema: PlanSchema,
		questions: [
			{
				id: "q-001",
				question: "What is the title of this plan?",
				answer: null,
			},
			{
				id: "q-002",
				question: "Provide a detailed description of this plan.",
				answer: null,
			},
			{
				id: "q-003",
				question:
					"What requirement ID does this fulfill? (format: brd-XXX-slug or prd-XXX-slug)",
				answer: null,
			},
			{
				id: "q-004",
				question: "What criteria ID does this fulfill? (format: crit-XXX)",
				answer: null,
			},
		],
		arrayFields: [
			{
				fieldName: "tasks",
				itemSchema: TaskSchema,
				collectionQuestion: {
					id: "q-tasks",
					question:
						"List the tasks (comma-separated descriptions, e.g., 'implement authentication', 'write unit tests')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "tk-q-001",
						question: "Describe this task in detail",
						answer: null,
					},
					{
						id: "tk-q-002",
						question: "What is the priority? (low, medium, high, critical)",
						answer: null,
					},
					{
						id: "tk-q-003",
						question:
							"List task IDs this depends on (comma-separated, e.g., 'task-001,task-002', or leave blank)",
						answer: null,
					},
					{
						id: "tk-q-004",
						question:
							"What should be considered while performing this task? (comma-separated, optional)",
						answer: null,
					},
					{
						id: "tk-q-005",
						question:
							"What is the status? (pending, in-progress, completed, blocked)",
						answer: null,
					},
				],
			},
			{
				fieldName: "flows",
				itemSchema: FlowSchema,
				collectionQuestion: {
					id: "q-flows",
					question:
						"List the flows (comma-separated names, e.g., 'user login flow', 'payment processing flow')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "fl-q-001",
						question: "What type of flow is this? (user, system, data)",
						answer: null,
					},
					{
						id: "fl-q-002",
						question: "What is the name of this flow?",
						answer: null,
					},
					{
						id: "fl-q-003",
						question: "Describe the purpose of this flow (optional)",
						answer: null,
						optional: true,
					},
					// Note: steps would need their own nested drafter, but for now we'll keep it simple
					{
						id: "fl-q-004",
						question:
							"Describe the steps in this flow (comma-separated, e.g., 'user enters credentials', 'system validates', 'user redirected')",
						answer: null,
					},
				],
			},
			{
				fieldName: "test_cases",
				itemSchema: TestCaseSchema,
				collectionQuestion: {
					id: "q-test-cases",
					question:
						"List the test cases (comma-separated names, e.g., 'valid login', 'invalid password', 'session timeout')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "tc-q-001",
						question: "What is the name of this test case?",
						answer: null,
					},
					{
						id: "tc-q-002",
						question: "Describe what this test case covers",
						answer: null,
					},
					{
						id: "tc-q-003",
						question: "List the steps to execute this test (comma-separated)",
						answer: null,
					},
					{
						id: "tc-q-004",
						question: "What is the expected result?",
						answer: null,
					},
				],
			},
			{
				fieldName: "api_contracts",
				itemSchema: ApiContractSchema,
				collectionQuestion: {
					id: "q-api-contracts",
					question:
						"List the API contracts (comma-separated names, e.g., 'POST /auth/login', 'GET /users/:id')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "ac-q-001",
						question: "What is the name of this API?",
						answer: null,
					},
					{
						id: "ac-q-002",
						question: "Describe what this API does",
						answer: null,
					},
					{
						id: "ac-q-003",
						question:
							"What type of contract is this? (rest, graphql, grpc, library, cli, websocket, etc.)",
						answer: null,
					},
					{
						id: "ac-q-004",
						question:
							"Provide the API specification (OpenAPI, GraphQL schema, TypeScript definitions, etc.)",
						answer: null,
					},
				],
			},
			{
				fieldName: "data_models",
				itemSchema: DataModelSchema,
				collectionQuestion: {
					id: "q-data-models",
					question:
						"List the data models (comma-separated names, e.g., 'User', 'Post', 'Comment')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "dm-q-001",
						question: "What is the name of this data model?",
						answer: null,
					},
					{
						id: "dm-q-002",
						question: "Describe what this data model represents",
						answer: null,
					},
					{
						id: "dm-q-003",
						question:
							"What format/notation is used? (json-schema, sql, typescript, protobuf, etc.)",
						answer: null,
					},
					{
						id: "dm-q-004",
						question: "Provide the actual model definition/schema",
						answer: null,
					},
				],
			},
		],
	};
}
