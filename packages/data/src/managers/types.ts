import z from "zod";

// Filter schemas extracted from removed managers
export const RequirementFilterSchema = z.object({
	priority: z
		.array(z.enum(["critical", "required", "ideal", "optional"]))
		.optional()
		.describe("Filter by requirement priority levels"),
	completed: z.boolean().optional().describe("Filter by completion status"),
});

export const PlanFilterSchema = z.object({
	priority: z
		.array(z.enum(["critical", "high", "medium", "low"]))
		.optional()
		.describe("Filter by plan priority levels"),
	completed: z.boolean().optional().describe("Filter by completion status"),
	approved: z.boolean().optional().describe("Filter by approval status"),
});

export const ComponentFilterSchema = z.object({
	type: z
		.array(z.enum(["app", "service", "library"]))
		.optional()
		.describe("Filter by component type"),
	folder: z.string().optional().describe("Filter by folder path"),
});

export const ConstitutionFilterSchema = z.object({
	status: z
		.array(z.enum(["draft", "active", "archived"]))
		.optional()
		.describe("Filter by constitution status"),
	applies_to: z
		.array(
			z.enum([
				"all",
				"requirements",
				"components",
				"plans",
				"architecture",
				"testing",
			]),
		)
		.optional()
		.describe("Filter by applies_to scope"),
});

export const DecisionFilterSchema = z.object({
	status: z
		.array(z.enum(["proposed", "accepted", "deprecated", "superseded"]))
		.optional()
		.describe("Filter by decision status"),
});

export const EntityFilterSchema = z.union([
	RequirementFilterSchema,
	PlanFilterSchema,
	ComponentFilterSchema,
	ConstitutionFilterSchema,
	DecisionFilterSchema,
]);

// Export inferred types for backward compatibility
export type RequirementFilter = z.infer<typeof RequirementFilterSchema>;
export type PlanFilter = z.infer<typeof PlanFilterSchema>;
export type ComponentFilter = z.infer<typeof ComponentFilterSchema>;
export type ConstitutionFilter = z.infer<typeof ConstitutionFilterSchema>;
export type DecisionFilter = z.infer<typeof DecisionFilterSchema>;
export type EntityFilter = z.infer<typeof EntityFilterSchema>;

// Re-export component types
export type {
	AnyComponent,
	AppComponent,
	LibraryComponent,
	ServiceComponent,
} from "../entities/components/component.js";
export type { Constitution } from "../entities/constitutions/constitution.js";
export type { Plan } from "../entities/plans/plan.js";
// Re-export other entity types
export type { Requirement } from "../entities/requirements/requirement.js";

// Union type for any entity
export type AnyEntity =
	| import("../entities/requirements/requirement.js").Requirement
	| import("../entities/plans/plan.js").Plan
	| import("../entities/components/component.js").AnyComponent
	| import("../entities/constitutions/constitution.js").Constitution;
