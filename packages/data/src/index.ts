// Export schemas directly from their sources
export {
	type Base,
	BaseSchema,
	BaseWithIdSchema,
	computeEntityId,
	type EntitySlug,
	EntitySlugSchema,
	type EntityType,
	EntityTypeSchema,
	EntityTypeShortMap,
	shortenEntityType,
} from "./core/base-entity.js";
export {
	AppComponentSchema,
	ComponentIdSchema,
	ComponentTypeSchema,
	LibraryComponentSchema,
	ServiceComponentSchema,
	ToolComponentSchema,
} from "./entities/components/component.js";
export * from "./entities/index.js";
export {
	PlanIdSchema,
	PlanPrioritySchema,
	PlanSchema,
} from "./entities/plans/plan.js";
export {
	AcceptanceCriteriaSchema,
	RequirementIdSchema,
	RequirementSchema,
} from "./entities/requirements/requirement.js";
export {
	type Reference,
	ReferenceSchema,
	type ReferenceType,
	ReferenceTypeSchema,
} from "./entities/shared/reference-schema.js";
export type { SpecConfig } from "./manager.js";
// Main manager and types - export separately to avoid conflicts
export {
	SpecConfigSchema,
	SpecsManager,
	SpecsManagerConfig,
} from "./manager.js";
export type {
	EntityManagerConfig,
	ListOptions,
	UpdateOptions,
} from "./managers/entity-manager.js";
export * from "./managers/entity-manager.js";
export {
	EntityManagerConfigSchema,
	ListOptionsSchema,
	UpdateOptionsSchema,
} from "./managers/entity-manager.js";
export type { FileManagerConfig } from "./managers/file-manager.js";
export * from "./managers/file-manager.js";
export { FileManagerConfigSchema } from "./managers/file-manager.js";
export type {
	AnyComponent,
	ComponentFilter,
	EntityFilter,
	PlanFilter,
	RequirementFilter,
} from "./managers/types.js";
export {
	ComponentFilterSchema,
	EntityFilterSchema,
	PlanFilterSchema,
	RequirementFilterSchema,
} from "./managers/types.js";
// Export types from their colocated positions
export type {
	ValidationManagerConfig,
	ValidationResult,
} from "./managers/validation-manager.js";
export * from "./managers/validation-manager.js";
export {
	ValidationManagerConfigSchema,
	ValidationResultSchema,
} from "./managers/validation-manager.js";
