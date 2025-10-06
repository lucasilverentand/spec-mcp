import type { OperationResult } from "./results.js";

export interface ITransformer<TInput = unknown, TOutput = unknown> {
	readonly name: string;
	readonly version: string;

	transform(input: TInput): Promise<OperationResult<TOutput>>;
	canTransform(input: unknown): input is TInput;
	supports(inputType: string, outputType: string): boolean;
}

export interface IIdGenerator extends ITransformer<string, string> {
	generateId(prefix?: string): string;
	generateUniqueId(existingIds: string[], prefix?: string): string;
	validateId(id: string): boolean;
}

export interface ISlugGenerator extends ITransformer<string, string> {
	generateSlug(input: string): string;
	generateUniqueSlug(input: string, existingSlugs: string[]): string;
	validateSlug(slug: string): boolean;
}
