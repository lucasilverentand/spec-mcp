import {
	ConstraintSchema,
	CriteriaSchema,
	type TechnicalRequirement,
	TechnicalRequirementSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createTechnicalRequirementDrafterConfig(): EntityDrafterConfig<TechnicalRequirement> {
	return {
		schema: TechnicalRequirementSchema,
		questions: [
			{
				id: "q-001",
				question: "What is the title/name of this technical requirement?",
				answer: null,
			},
			{
				id: "q-002",
				question:
					"Provide a detailed description of this technical requirement.",
				answer: null,
			},
			{
				id: "q-003",
				question:
					"Describe the technical context, background, or rationale for this requirement.",
				answer: null,
			},
			{
				id: "q-004",
				question: "Describe the high-level implementation approach (optional).",
				answer: null,
				optional: true,
			},
			{
				id: "q-005",
				question:
					"Any additional implementation notes or considerations? (optional)",
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "constraints",
				itemSchema: ConstraintSchema,
				collectionQuestion: {
					id: "q-constraints",
					question:
						"List the technical constraints (comma-separated descriptions, e.g., 'must support 10k concurrent users', 'response time under 100ms')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "cn-q-001",
						question: "What type of constraint is this?",
						answer: null,
					},
					{
						id: "cn-q-002",
						question: "Describe the constraint in detail",
						answer: null,
					},
				],
			},
			{
				fieldName: "criteria",
				itemSchema: CriteriaSchema,
				collectionQuestion: {
					id: "q-criteria",
					question:
						"List the technical acceptance criteria (comma-separated descriptions, e.g., 'passes load test', 'security scan shows no vulnerabilities')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "cr-q-001",
						question: "Describe this technical acceptance criterion in detail",
						answer: null,
					},
				],
			},
		],
	};
}
