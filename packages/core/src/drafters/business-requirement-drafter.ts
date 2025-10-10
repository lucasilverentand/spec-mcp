import {
	type BusinessRequirement,
	BusinessRequirementSchema,
	BusinessValueSchema,
	CriteriaSchema,
	StakeholderSchema,
	UserStorySchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createBusinessRequirementDrafterConfig(): EntityDrafterConfig<BusinessRequirement> {
	return {
		schema: BusinessRequirementSchema,
		questions: [
			{
				id: "q-001",
				question: "What is the title/name of this business requirement?",
				answer: null,
			},
			{
				id: "q-002",
				question:
					"Provide a detailed description of this business requirement.",
				answer: null,
			},
		],
		arrayFields: [
			{
				fieldName: "business_value",
				itemSchema: BusinessValueSchema,
				collectionQuestion: {
					id: "q-business-value",
					question:
						"List the business values this requirement delivers (comma-separated descriptions, e.g., 'increased revenue', 'improved customer satisfaction')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "bv-q-001",
						question: "What type of business value is this?",
						answer: null,
					},
					{
						id: "bv-q-002",
						question: "Describe the business value, ROI, or benefit",
						answer: null,
					},
				],
			},
			{
				fieldName: "stakeholders",
				itemSchema: StakeholderSchema,
				collectionQuestion: {
					id: "q-stakeholders",
					question:
						"List the key stakeholders (comma-separated names or roles, e.g., 'Product Owner', 'Engineering Lead')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "sh-q-001",
						question: "What is the stakeholder's role?",
						answer: null,
					},
					{
						id: "sh-q-002",
						question: "What is the stakeholder's name?",
						answer: null,
					},
					{
						id: "sh-q-003",
						question: "What is the stakeholder's interest in this requirement?",
						answer: null,
					},
					{
						id: "sh-q-004",
						question: "What is the stakeholder's email? (optional)",
						answer: null,
					},
				],
			},
			{
				fieldName: "user_stories",
				itemSchema: UserStorySchema,
				collectionQuestion: {
					id: "q-user-stories",
					question:
						"List the user stories (comma-separated brief descriptions, e.g., 'user can login', 'admin can view reports')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "us-q-001",
						question: "As a [role]...",
						answer: null,
					},
					{
						id: "us-q-002",
						question: "I want [feature]...",
						answer: null,
					},
					{
						id: "us-q-003",
						question: "So that [benefit]...",
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
						"List the acceptance criteria (comma-separated descriptions, e.g., 'user receives confirmation email', 'response time under 200ms')",
					answer: null,
				},
				itemQuestions: [
					{
						id: "cr-q-001",
						question: "Describe this acceptance criterion in detail",
						answer: null,
					},
				],
			},
		],
	};
}
