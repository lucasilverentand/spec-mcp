// Main entry point

// Re-export commonly used types from schemas for convenience
export type {
	AcceptanceCriteria,
	AcceptanceCriteriaId,
	ApiContract,
	Article,
	ArticleId,
	Base,
	Component,
	ComponentId,
	ComponentType,
	Constitution,
	ConstitutionId,
	DataModel,
	Decision,
	DecisionId,
	Draft,
	DraftQuestion,
	EntitySlug,
	// Shared types
	EntityType,
	Flow,
	Plan,
	PlanId,
	Reference,
	ReferenceType,
	// Entity types
	Requirement,
	RequirementId,
	Scope,
	ScopeItem,
	Task,
	TestCase,
} from "@spec-mcp/schemas";

// Core abstractions
export { EntityManager, SpecManager } from "./core";

// Storage layer
export { FileManager } from "./storage";

// Draft workflow system
export {
	BaseDraftManager,
	type CreateDraftResult,
	type SubmitAnswerResult,
} from "./drafts";

// Entity-specific managers
export {
	ComponentDraftManager,
	ComponentManager,
	ConstitutionDraftManager,
	ConstitutionManager,
	DecisionDraftManager,
	DecisionManager,
	PlanDraftManager,
	PlanManager,
	RequirementDraftManager,
	RequirementManager,
} from "./managers";

// Migration utilities
export {
	MigrationRegistry,
	MigrationRunner,
	SpecMetadataMigrator,
	migrations,
	type Migration,
	type MigrationResult,
} from "./migration";
