import {
	ConsequenceSchema,
	type Decision,
	DecisionSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createDecisionDrafterConfig(): EntityDrafterConfig<Decision> {
	return {
		schema: DecisionSchema,
		questions: [
			{
				id: "q-001",
				question: "What is the title of this decision?",
				answer: null,
			},
			{
				id: "q-002",
				question: "Provide a detailed description of this decision.",
				answer: null,
			},
			{
				id: "q-003",
				question: "What was decided? (clear statement)",
				answer: null,
			},
			{
				id: "q-004",
				question: "What situation or problem prompted this decision?",
				answer: null,
			},
			{
				id: "q-005",
				question:
					"What is the status of this decision? (proposed, accepted, deprecated, superseded)",
				answer: null,
			},
			{
				id: "q-006",
				question:
					"Does this supersede a previous decision? (provide decision ID or leave blank)",
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "consequences",
				itemSchema: ConsequenceSchema,
				collectionQuestion: {
					id: "q-consequences",
					question:
						"List the consequences of this decision (comma-separated descriptions, e.g., 'faster development', 'increased complexity')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "cq-q-001",
						question:
							"What type of consequence is this? (positive, negative, risk)",
						answer: null,
					},
					{
						id: "cq-q-002",
						question: "Describe this consequence",
						answer: null,
					},
					{
						id: "cq-q-003",
						question:
							"What is the mitigation strategy? (optional, for negative/risk)",
						answer: null,
						optional: true,
					},
				],
			},
		],
	};
}
