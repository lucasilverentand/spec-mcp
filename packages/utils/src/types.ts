/**
 * Shared types for utils package
 */

// Operation result type
export type OperationResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

// Transformer interfaces
export interface IIdGenerator {
	generateId(prefix?: string): string;
	generateUniqueId(existingIds: string[], prefix?: string): string;
	validateId(id: string): boolean;
}

export interface ISlugGenerator {
	generateSlug(input: string): string;
	generateUniqueSlug(input: string, existingSlugs: string[]): string;
	validateSlug(slug: string): boolean;
}

export interface IYamlTransformer {
	parseYaml<T = unknown>(yaml: string): OperationResult<T>;
	stringifyYaml(data: unknown): OperationResult<string>;
	validateYamlSyntax(yaml: string): boolean;
}
