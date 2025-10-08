import z from "zod";
import { ApiContractsSchema } from "../shared/api-contract.js";
import { BaseSchema } from "../shared/base.js";
import { CriteriaIdSchema } from "../shared/criteria.js";
import { DataModelsSchema } from "../shared/data-model.js";
import { FlowsSchema } from "../shared/flow.js";
import { ReferencesSchema } from "../shared/reference.js";
import { ScopeSchema } from "../shared/scope.js";
import { TasksSchema } from "../shared/task.js";
import { TestCasesSchema } from "../shared/test-case.js";

export const PlanIdSchema = z.string().regex(/^pln-\d{3}-[a-z0-9-]+$/, {
	message: "Plan ID must follow format: pln-XXX-slug-here",
});

export const RequirementIdSchema = z
	.string()
	.regex(/^(brd|prd)-\d{3}-[a-z0-9-]+$/, {
		message: "Requirement ID must follow format: req-XXX-slug-here",
	});

// Schema for stored plans (no ID field)
export const PlanSchema = BaseSchema.extend({
	type: z.literal("plan").describe("Entity type is always 'plan'"),
	criteria: z
		.object({
			requirement: RequirementIdSchema.describe("ID of the requirement"),
			criteria: CriteriaIdSchema.describe("ID of the acceptance criteria"),
		})
		.describe(
			"The acceptance criteria ID this plan fulfills (format: req-XXX-slug/crit-XXX). Optional for orchestration/milestone plans.",
		),

	scope: ScopeSchema.describe(
		"Defines what is included and excluded from this plan's scope",
	),
	depends_on: z
		.array(PlanIdSchema)
		.default([])
		.describe("Other plans this plan relies on"),
	tasks: TasksSchema.describe("List of tasks to be completed"),
	flows: FlowsSchema.describe("List of flows involved in the plan"),
	test_cases: TestCasesSchema.describe("Test cases to validate the plan"),
	api_contracts: ApiContractsSchema.describe(
		"API contracts defined or consumed by this plan",
	),
	data_models: DataModelsSchema.describe(
		"Data models, schemas, and structures defined or used by this plan",
	),
	references: ReferencesSchema.describe("References that inform this plan"),
}).strict();

export type PlanId = z.infer<typeof PlanIdSchema>;
export type RequirementId = z.infer<typeof RequirementIdSchema>;
export type Plan = z.infer<typeof PlanSchema>;
