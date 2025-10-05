import {
	generateSlug as dataGenerateSlug,
	generateUniqueSlug as dataGenerateUniqueSlug,
	validateSlug as dataValidateSlug,
} from "@spec-mcp/data";
import type { OperationResult } from "./types.js";
import type { ISlugGenerator } from "./types.js";

// Re-export from data package for backward compatibility
export {
	generateSlug,
	generateSlugFromTitle,
	generateUniqueSlug,
	sanitizeSlug,
	validateSlug,
} from "@spec-mcp/data";

export class SlugGenerator implements ISlugGenerator {
	readonly name = "SlugGenerator";
	readonly version = "2.0.0";

	async transform(input: string): Promise<OperationResult<string>> {
		return {
			success: true,
			data: this.generateSlug(input),
			
		};
	}

	canTransform(input: unknown): input is string {
		return typeof input === "string";
	}

	supports(inputType: string, outputType: string): boolean {
		return inputType === "string" && outputType === "string";
	}

	generateSlug(input: string): string {
		return dataGenerateSlug(input);
	}

	generateUniqueSlug(input: string, existingSlugs: string[]): string {
		return dataGenerateUniqueSlug(input, existingSlugs);
	}

	validateSlug(slug: string): boolean {
		return dataValidateSlug(slug);
	}
}

