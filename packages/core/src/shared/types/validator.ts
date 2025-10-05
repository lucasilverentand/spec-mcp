import type { AnyEntity } from "@spec-mcp/data";
import type { SpecConfig } from "./config.js";
import type { ValidationResult } from "./results.js";

export interface IValidator<TEntity = AnyEntity> {
	readonly name: string;
	readonly version: string;

	validate(entity: TEntity): Promise<ValidationResult>;
	configure(config: Partial<SpecConfig>): void;
	supports(entity: unknown): entity is TEntity;
}

export interface ISchemaValidator extends IValidator<AnyEntity> {
	validateSchema(entity: AnyEntity): Promise<ValidationResult>;
	getSchemaErrors(entity: AnyEntity): Promise<string[]>;
}

export interface IReferenceValidator extends IValidator<AnyEntity> {
	validateReferences(entity: AnyEntity): Promise<ValidationResult>;
	findBrokenReferences(entity: AnyEntity): Promise<string[]>;
	resolveReference(reference: string): Promise<AnyEntity | null>;
}

export interface IWorkflowValidator extends IValidator<AnyEntity> {
	validateWorkflow(entities: AnyEntity[]): Promise<ValidationResult>;
	checkWorkflowConsistency(entities: AnyEntity[]): Promise<ValidationResult>;
}

export interface IValidationEngine {
	validateEntity(entity: AnyEntity): Promise<ValidationResult>;
	validateAll(): Promise<ValidationResult>;
	validateReferences(): Promise<ValidationResult>;
	validateBusinessRules(): Promise<ValidationResult>;
	runFullValidation(): Promise<ValidationResult>;

	registerValidator(validator: IValidator): void;
	removeValidator(name: string): void;
	getValidators(): IValidator[];
}

// Re-export types from config.ts to avoid duplication
export type { ReferenceValidationOptions, WorkflowValidationOptions } from "./config.js";
