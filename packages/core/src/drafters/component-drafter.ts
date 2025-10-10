import {
	type Component,
	ComponentSchema,
	DeploymentSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createComponentDrafterConfig(): EntityDrafterConfig<Component> {
	return {
		schema: ComponentSchema,
		questions: [
			{
				id: "q-001",
				question: "What is the name of this component?",
				answer: null,
			},
			{
				id: "q-002",
				question: "Provide a detailed description of this component.",
				answer: null,
			},
			{
				id: "q-003",
				question: "What type of component is this? (app, service, library)",
				answer: null,
			},
			{
				id: "q-004",
				question:
					"What is the relative folder path from the repository root? (default: .)",
				answer: null,
			},
			{
				id: "q-005",
				question: "What is the dev server port? (optional)",
				answer: null,
				optional: true,
			},
			{
				id: "q-006",
				question: "Any additional notes about this component? (optional)",
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "deployments",
				itemSchema: DeploymentSchema,
				collectionQuestion: {
					id: "q-deployments",
					question:
						"List the deployment environments (comma-separated, e.g., 'production', 'staging', 'development')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "dp-q-001",
						question:
							"What platform is this deployed to? (e.g., AWS ECS, Vercel, Railway)",
						answer: null,
					},
					{
						id: "dp-q-002",
						question: "What is the production URL or endpoint? (optional)",
						answer: null,
						optional: true,
					},
					{
						id: "dp-q-003",
						question: "What is the build command? (optional)",
						answer: null,
						optional: true,
					},
					{
						id: "dp-q-004",
						question: "What is the deploy command? (optional)",
						answer: null,
						optional: true,
					},
					{
						id: "dp-q-005",
						question:
							"List required environment variables (comma-separated, optional)",
						answer: null,
						optional: true,
					},
					{
						id: "dp-q-006",
						question: "List required secrets (comma-separated, optional)",
						answer: null,
						optional: true,
					},
					{
						id: "dp-q-007",
						question: "Any additional deployment notes? (optional)",
						answer: null,
						optional: true,
					},
				],
			},
		],
	};
}
