import { z } from "zod";
import {
	RequirementIdSchema,
	AcceptanceCriteriaSchema,
	PlanIdSchema,
	CriteriaReferenceSchema,
	ComponentIdSchema,
	ComponentTypeSchema,
	ArticleSchema,
	DecisionIdSchema,
	ConsequencesSchema,
	ArticleReferenceSchema,
} from "@spec-mcp/data";

/**
 * Requirement step submission schemas
 */

// Step 1: Problem Identification
export const RequirementProblemIdentificationSchema = z.object({
	step: z.literal("problem_identification"),
	description: z
		.string()
		.min(50, "Description must be at least 50 characters")
		.refine(
			(val) => {
				const lower = val.toLowerCase();
				return (
					lower.includes("because") ||
					lower.includes("needed") ||
					lower.includes("why") ||
					lower.includes("so that")
				);
			},
			{
				message:
					"Description should include rationale (use words like 'because', 'needed', 'so that')",
			},
		),
}).passthrough();

// Step 2: Avoid Implementation
export const RequirementAvoidImplementationSchema = z.object({
	step: z.literal("avoid_implementation"),
	description: z.string().refine(
		(val) => {
			const lower = val.toLowerCase();
			const implKeywords = [
				"database",
				"mongodb",
				"postgres",
				"redis",
				"react",
				"vue",
				"angular",
				"api endpoint",
				"rest api",
				"graphql",
				"button",
				"form",
				"table",
				"component",
				"class",
				"function",
				"method",
			];
			return !implKeywords.some((keyword) => lower.includes(keyword));
		},
		{
			message: "Description should not contain implementation details",
		},
	),
}).passthrough();

// Step 3: Measurability
export const RequirementMeasurabilitySchema = z.object({
	step: z.literal("measurability"),
	criteria: z
		.array(AcceptanceCriteriaSchema)
		.min(2, "At least 2 acceptance criteria are required")
		.refine(
			(criteria) => {
				return criteria.some((c) => {
					const desc = c.description;
					return (
						/\d+/.test(desc) ||
						/(must|should|will|can)\s+(display|show|allow|enable|provide)/i.test(
							desc,
						) ||
						/(successfully|correctly|accurately)/i.test(desc)
					);
				});
			},
			{
				message: "Criteria should be measurable and testable",
			},
		),
}).passthrough();

// Step 4: Specific Language
export const RequirementSpecificLanguageSchema = z.object({
	step: z.literal("specific_language"),
	description: z.string().refine(
		(val) => {
			const lower = val.toLowerCase();
			const vagueTerms = [
				"fast",
				"slow",
				"easy",
				"hard",
				"simple",
				"complex",
				"good",
				"bad",
				"nice",
				"better",
				"efficient",
			];
			return !vagueTerms.some((term) => lower.includes(term));
		},
		{
			message: "Avoid vague terms; use specific, quantifiable language",
		},
	),
	criteria: z.array(AcceptanceCriteriaSchema).min(1),
}).passthrough();

// Step 5: Acceptance Criteria
export const RequirementAcceptanceCriteriaSchema = z.object({
	step: z.literal("acceptance_criteria"),
	criteria: z
		.array(AcceptanceCriteriaSchema)
		.min(1, "Acceptance criteria must be defined"),
}).passthrough();

// Step 6: Priority Assignment
export const RequirementPriorityAssignmentSchema = z.object({
	step: z.literal("priority_assignment"),
	priority: z.enum(
		["critical", "required", "ideal", "optional"],
		{
			errorMap: () => ({
				message: "Priority must be one of: critical, required, ideal, optional",
			}),
		},
	),
}).passthrough();

// Step 7: Review and Refine
export const RequirementReviewRefineSchema = z.object({
	step: z.literal("review_and_refine"),
	slug: z
		.string()
		.min(1, "URL-friendly slug is required")
		.regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
	name: z.string().min(1, "Display name is required"),
	description: z.string().min(50),
	priority: z.enum(["critical", "required", "ideal", "optional"]),
	criteria: z.array(AcceptanceCriteriaSchema).min(1),
}).passthrough();

// Union of all requirement step schemas
export const RequirementStepSubmissionSchema = z.discriminatedUnion("step", [
	RequirementProblemIdentificationSchema,
	RequirementAvoidImplementationSchema,
	RequirementMeasurabilitySchema,
	RequirementSpecificLanguageSchema,
	RequirementAcceptanceCriteriaSchema,
	RequirementPriorityAssignmentSchema,
	RequirementReviewRefineSchema,
]);

/**
 * Component step submission schemas
 */

// Step 1: Analyze Requirements
export const ComponentAnalyzeRequirementsSchema = z.object({
	step: z.literal("analyze_requirements"),
	description: z
		.string()
		.min(1, "Description linking to requirements is required"),
}).passthrough();

// Step 2: Define Boundaries
export const ComponentDefineBoundariesSchema = z.object({
	step: z.literal("define_boundaries"),
	description: z.string().min(50, "Description must clearly define boundaries"),
}).passthrough();

// Step 3: Define Responsibilities
export const ComponentDefineResponsibilitiesSchema = z.object({
	step: z.literal("define_responsibilities"),
	capabilities: z
		.array(z.string())
		.min(1, "At least one capability must be defined"),
}).passthrough();

// Step 4: Define Interfaces
export const ComponentDefineInterfacesSchema = z.object({
	step: z.literal("define_interfaces"),
	description: z.string().min(50, "Interface description must be detailed"),
}).passthrough();

// Step 5: Map Dependencies
export const ComponentMapDependenciesSchema = z.object({
	step: z.literal("map_dependencies"),
	depends_on: z.array(ComponentIdSchema).default([]),
	external_dependencies: z.array(z.string()).default([]),
}).passthrough();

// Step 6: Define Ownership
export const ComponentDefineOwnershipSchema = z.object({
	step: z.literal("define_ownership"),
	description: z.string().min(50, "Ownership description required"),
}).passthrough();

// Step 7: Identify Patterns
export const ComponentIdentifyPatternsSchema = z.object({
	step: z.literal("identify_patterns"),
	description: z.string().min(1),
}).passthrough();

// Step 8: Quality Attributes
export const ComponentQualityAttributesSchema = z.object({
	step: z.literal("quality_attributes"),
	constraints: z
		.array(z.string())
		.min(1)
		.default([]),
}).passthrough();

// Step 9: Trace Requirements
export const ComponentTraceRequirementsSchema = z.object({
	step: z.literal("trace_requirements"),
	description: z.string().min(50, "Traceability description required"),
}).passthrough();

// Step 10: Validate and Refine
export const ComponentValidateRefineSchema = z.object({
	step: z.literal("validate_refine"),
	type: ComponentTypeSchema,
	slug: z
		.string()
		.min(1, "URL-friendly slug is required")
		.regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
	name: z.string().min(1, "Display name is required"),
	description: z.string().min(1),
	capabilities: z.array(z.string()).min(1),
	tech_stack: z.array(z.string()).min(1),
}).passthrough();

// Union of all component step schemas
export const ComponentStepSubmissionSchema = z.discriminatedUnion("step", [
	ComponentAnalyzeRequirementsSchema,
	ComponentDefineBoundariesSchema,
	ComponentDefineResponsibilitiesSchema,
	ComponentDefineInterfacesSchema,
	ComponentMapDependenciesSchema,
	ComponentDefineOwnershipSchema,
	ComponentIdentifyPatternsSchema,
	ComponentQualityAttributesSchema,
	ComponentTraceRequirementsSchema,
	ComponentValidateRefineSchema,
]);

/**
 * Plan step submission schemas
 */

// Step 1: Review Context
export const PlanReviewContextSchema = z.object({
	step: z.literal("review_context"),
	criteria_id: CriteriaReferenceSchema,
	description: z.string().min(50, "Context description required"),
}).passthrough();

// Step 2: Identify Phases
export const PlanIdentifyPhasesSchema = z.object({
	step: z.literal("identify_phases"),
	description: z.string().min(50, "Phase description required"),
}).passthrough();

// Step 3: Analyze Dependencies
export const PlanAnalyzeDependenciesSchema = z.object({
	step: z.literal("analyze_dependencies"),
	depends_on: z.array(PlanIdSchema).default([]),
}).passthrough();

// Step 4: Break Down Tasks
export const PlanBreakDownTasksSchema = z.object({
	step: z.literal("break_down_tasks"),
	tasks: z
		.array(
			z.object({
				id: z.string(),
				description: z.string(),
			}),
		)
		.min(1, "At least one task is required"),
}).passthrough();

// Step 5: Estimate Effort
export const PlanEstimateEffortSchema = z.object({
	step: z.literal("estimate_effort"),
	tasks: z
		.array(
			z.object({
				id: z.string(),
				description: z.string(),
				estimated_days: z.number().optional(),
			}),
		)
		.min(1, "Tasks with estimates required"),
}).passthrough();

// Step 6: Define Acceptance
export const PlanDefineAcceptanceSchema = z.object({
	step: z.literal("define_acceptance"),
	acceptance_criteria: z.string().min(1, "Overall acceptance criteria required"),
}).passthrough();

// Step 7: Identify Milestones
export const PlanIdentifyMilestonesSchema = z.object({
	step: z.literal("identify_milestones"),
	description: z.string().min(50, "Milestone description required"),
}).passthrough();

// Step 8: Plan Testing
export const PlanPlanTestingSchema = z.object({
	step: z.literal("plan_testing"),
	description: z.string().min(50, "Testing strategy description required"),
}).passthrough();

// Step 9: Plan Risks
export const PlanPlanRisksSchema = z.object({
	step: z.literal("plan_risks"),
	description: z.string().min(50, "Risk mitigation description required"),
}).passthrough();

// Step 10: Create Timeline
export const PlanCreateTimelineSchema = z.object({
	step: z.literal("create_timeline"),
	description: z.string().min(50, "Timeline description required"),
}).passthrough();

// Step 11: Trace Specs
export const PlanTraceSpecsSchema = z.object({
	step: z.literal("trace_specs"),
	description: z.string().min(50, "Traceability description required"),
}).passthrough();

// Step 12: Validate and Refine
export const PlanValidateRefineSchema = z.object({
	step: z.literal("validate_refine"),
	slug: z
		.string()
		.min(1, "URL-friendly slug is required")
		.regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
	name: z.string().min(1, "Display name is required"),
	description: z.string().min(1),
	criteria_id: CriteriaReferenceSchema,
	acceptance_criteria: z.string().min(1),
	tasks: z.array(z.object({ id: z.string(), description: z.string() })).min(1),
}).passthrough();

// Union of all plan step schemas
export const PlanStepSubmissionSchema = z.discriminatedUnion("step", [
	PlanReviewContextSchema,
	PlanIdentifyPhasesSchema,
	PlanAnalyzeDependenciesSchema,
	PlanBreakDownTasksSchema,
	PlanEstimateEffortSchema,
	PlanDefineAcceptanceSchema,
	PlanIdentifyMilestonesSchema,
	PlanPlanTestingSchema,
	PlanPlanRisksSchema,
	PlanCreateTimelineSchema,
	PlanTraceSpecsSchema,
	PlanValidateRefineSchema,
]);

/**
 * Constitution step submission schemas
 */

// Step 1: Basic Info
export const ConstitutionBasicInfoSchema = z.object({
	step: z.literal("basic_info"),
	name: z.string().min(1, "Constitution name is required"),
	description: z
		.string()
		.min(20, "Description must be at least 20 characters"),
}).passthrough();

// Step 2: Articles
export const ConstitutionArticlesSchema = z.object({
	step: z.literal("articles"),
	articles: z
		.array(ArticleSchema)
		.min(1, "At least one article is required"),
}).passthrough();

// Step 3: Finalize
export const ConstitutionFinalizeSchema = z.object({
	step: z.literal("finalize"),
	name: z.string().min(1, "Display name is required"),
}).passthrough();

// Union of all constitution step schemas
export const ConstitutionStepSubmissionSchema = z.discriminatedUnion("step", [
	ConstitutionBasicInfoSchema,
	ConstitutionArticlesSchema,
	ConstitutionFinalizeSchema,
]);

/**
 * Decision step submission schemas
 */

// Step 1: Basic Info
export const DecisionBasicInfoSchema = z.object({
	step: z.literal("basic_info"),
	name: z.string().min(1, "Decision name is required"),
	description: z.string().min(1, "Decision description is required"),
}).passthrough();

// Step 2: Decision Statement
export const DecisionStatementSchema = z.object({
	step: z.literal("decision_statement"),
	decision: z
		.string()
		.min(20, "Decision must be at least 20 characters")
		.max(500, "Decision must be at most 500 characters"),
}).passthrough();

// Step 3: Context
export const DecisionContextSchema = z.object({
	step: z.literal("context"),
	context: z
		.string()
		.min(20, "Context must be at least 20 characters")
		.max(1000, "Context must be at most 1000 characters"),
}).passthrough();

// Step 4: Alternatives and Consequences
export const DecisionAlternativesConsequencesSchema = z.object({
	step: z.literal("alternatives_and_consequences"),
	alternatives: z.array(z.string()).default([]),
	consequences: ConsequencesSchema,
}).passthrough();

// Step 5: Relationships
export const DecisionRelationshipsSchema = z.object({
	step: z.literal("relationships"),
	affects_components: z.array(ComponentIdSchema).default([]),
	affects_requirements: z.array(RequirementIdSchema).default([]),
	affects_plans: z.array(PlanIdSchema).default([]),
	informed_by_articles: z.array(ArticleReferenceSchema).default([]),
	supersedes: DecisionIdSchema.optional(),
}).passthrough();

// Step 6: Finalize
export const DecisionFinalizeSchema = z.object({
	step: z.literal("finalize"),
	name: z.string().min(1, "Display name is required"),
}).passthrough();

// Union of all decision step schemas
export const DecisionStepSubmissionSchema = z.discriminatedUnion("step", [
	DecisionBasicInfoSchema,
	DecisionStatementSchema,
	DecisionContextSchema,
	DecisionAlternativesConsequencesSchema,
	DecisionRelationshipsSchema,
	DecisionFinalizeSchema,
]);

/**
 * Master discriminated union for all step submissions
 */
export const StepSubmissionSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("requirement"),
		data: RequirementStepSubmissionSchema,
	}),
	z.object({
		type: z.literal("component"),
		data: ComponentStepSubmissionSchema,
	}),
	z.object({
		type: z.literal("plan"),
		data: PlanStepSubmissionSchema,
	}),
	z.object({
		type: z.literal("constitution"),
		data: ConstitutionStepSubmissionSchema,
	}),
	z.object({
		type: z.literal("decision"),
		data: DecisionStepSubmissionSchema,
	}),
]);

export type RequirementStepSubmission = z.infer<
	typeof RequirementStepSubmissionSchema
>;
export type ComponentStepSubmission = z.infer<
	typeof ComponentStepSubmissionSchema
>;
export type PlanStepSubmission = z.infer<typeof PlanStepSubmissionSchema>;
export type ConstitutionStepSubmission = z.infer<
	typeof ConstitutionStepSubmissionSchema
>;
export type DecisionStepSubmission = z.infer<
	typeof DecisionStepSubmissionSchema
>;
export type StepSubmission = z.infer<typeof StepSubmissionSchema>;
