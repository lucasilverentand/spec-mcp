import {
	ArticleSchema,
	type Constitution,
	ConstitutionSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createConstitutionDrafterConfig(): EntityDrafterConfig<Constitution> {
	return {
		schema: ConstitutionSchema,
		questions: [
			{
				id: "q-001",
				question: "What is the title of this constitution?",
				answer: null,
			},
			{
				id: "q-002",
				question: "Provide a detailed description of this constitution.",
				answer: null,
			},
		],
		arrayFields: [
			{
				fieldName: "articles",
				itemSchema: ArticleSchema,
				collectionQuestion: {
					id: "q-articles",
					question:
						"List the articles/principles (comma-separated titles, e.g., 'Library-First Principle', 'Code Review Standards')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "ar-q-001",
						question: "What is the title of this article?",
						answer: null,
					},
					{
						id: "ar-q-002",
						question: "What is the core principle or rule?",
						answer: null,
					},
					{
						id: "ar-q-003",
						question: "What is the rationale for this principle?",
						answer: null,
					},
					{
						id: "ar-q-004",
						question:
							"Provide concrete examples demonstrating this principle (comma-separated, optional)",
						answer: null,
					},
					{
						id: "ar-q-005",
						question:
							"Are there exceptions where this principle doesn't apply? (comma-separated, optional)",
						answer: null,
					},
					{
						id: "ar-q-006",
						question: "What is the status? (needs-review, active, archived)",
						answer: null,
					},
				],
			},
		],
	};
}
