import z from "zod";
import { BaseSchema, computeEntityId } from "../../core/base-entity.js";
import { ApiContractSchema } from "../shared/api-contract-schema.js";
import { DataModelSchema } from "../shared/data-model-schema.js";
import { FlowSchema } from "../shared/flow-schema.js";
import { ReferenceSchema } from "../shared/reference-schema.js";
import { ScopeSchema } from "../shared/scope-schema.js";
import { TaskSchema } from "../shared/task-schema.js";
import { TestCaseSchema } from "../shared/test-case-schema.js";

export const PlanIdSchema = z.string().regex(/^pln-\d{3}-[a-z0-9-]+$/, {
	message: "Plan ID must follow format: pln-XXX-slug-here",
});

export const PlanPrioritySchema = z.enum(["critical", "high", "medium", "low"]);

// Criteria reference format: req-XXX-slug/crit-XXX
export const CriteriaReferenceSchema = z
	.string()
	.regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/, {
		message:
			"Criteria reference must follow format: req-XXX-slug/crit-XXX (e.g., req-001-user-auth/crit-001)",
	})
	.describe(
		"Full path reference to requirement acceptance criteria including parent requirement",
	);

// Schema for stored plans (no ID field)
export const PlanStorageSchema = BaseSchema.extend({
	type: z.literal("plan").describe("Entity type is always 'plan'"),
	criteria_id: CriteriaReferenceSchema.nullable().optional().describe(
		"The acceptance criteria ID this plan fulfills (format: req-XXX-slug/crit-XXX). Optional for orchestration/milestone plans.",
	),
	priority: PlanPrioritySchema.default("medium").describe(
		"Priority level of the plan. 'critical' plans must be completed before 'high', 'high' before 'medium', and 'medium' before 'low'.",
	),
	acceptance_criteria: z
		.string()
		.min(1)
		.describe(
			"Conditions that must be met for the plan to be considered complete",
		),
	scope: ScopeSchema.nullable().optional().describe(
		"Defines what is included and excluded from this plan's scope",
	),
	depends_on: z
		.array(PlanIdSchema)
		.default([])
		.describe("Other plans this plan relies on"),
	tasks: z
		.array(TaskSchema)
		.default([])
		.describe("List of tasks to be completed"),
	flows: z
		.array(FlowSchema)
		.default([])
		.describe("List of flows involved in the plan"),
	test_cases: z
		.array(TestCaseSchema)
		.default([])
		.describe("Test cases to validate the plan"),
	api_contracts: z
		.array(ApiContractSchema)
		.default([])
		.describe("API contracts defined or consumed by this plan"),
	data_models: z
		.array(DataModelSchema)
		.default([])
		.describe(
			"Data models, schemas, and structures defined or used by this plan",
		),
	references: z
		.array(ReferenceSchema)
		.default([])
		.describe("Related references"),

	// State
	completed: z
		.boolean()
		.default(false)
		.describe("Whether the plan has been completed"),
	completed_at: z
		.string()
		.datetime()
		.nullable()
		.optional()
		.describe("Timestamp when the plan was completed"),
	approved: z
		.boolean()
		.default(false)
		.describe("Whether the plan has been approved"),
}).strict();

// Schema for runtime plans (with computed ID)
export const PlanSchema = PlanStorageSchema.transform((data) => ({
	...data,
	id: computeEntityId(data.type, data.number, data.slug),
})).describe("Schema for runtime plans with computed ID");

export type PlanId = z.infer<typeof PlanIdSchema>;
export type PlanPriority = z.infer<typeof PlanPrioritySchema>;
export type CriteriaReference = z.infer<typeof CriteriaReferenceSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type PlanInput = z.input<typeof PlanStorageSchema>;
