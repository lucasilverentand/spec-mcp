import type { OperationResult } from "../interfaces/results.js";
import type { ISlugGenerator } from "../interfaces/transformer.js";
import { extractWords, isStopWord } from "../utils/string-utils.js";

export class SlugGenerator implements ISlugGenerator {
	readonly name = "SlugGenerator";
	readonly version = "2.0.0";

	async transform(input: string): Promise<OperationResult<string>> {
		return {
			success: true,
			data: this.generateSlug(input),
			timestamp: new Date(),
		};
	}

	canTransform(input: unknown): input is string {
		return typeof input === "string";
	}

	supports(inputType: string, outputType: string): boolean {
		return inputType === "string" && outputType === "string";
	}

	generateSlug(input: string): string {
		return (
			input
				.toLowerCase()
				.trim()
				// Replace spaces and underscores with hyphens
				.replace(/[\s_]+/g, "-")
				// Remove special characters except hyphens
				.replace(/[^a-z0-9-]/g, "")
				// Remove consecutive hyphens
				.replace(/-+/g, "-")
				// Remove leading/trailing hyphens
				.replace(/^-+|-+$/g, "")
				// Limit length
				.substring(0, 50)
		);
	}

	generateUniqueSlug(input: string, existingSlugs: string[]): string {
		let slug = this.generateSlug(input);
		let counter = 1;

		while (existingSlugs.includes(slug)) {
			const baseSlug = this.generateSlug(input);
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		return slug;
	}

	validateSlug(slug: string): boolean {
		// Valid slug: lowercase, alphanumeric, hyphens, no consecutive hyphens, no leading/trailing hyphens
		const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
		return slugRegex.test(slug) && slug.length <= 50 && slug.length >= 1;
	}
}

// Backward compatibility functions
const defaultGenerator = new SlugGenerator();

export function generateSlug(input: string): string {
	return defaultGenerator.generateSlug(input);
}

export function generateSlugFromTitle(title: string): string {
	// Extract meaningful words and create a slug
	const words = extractWords(title, 2)
		.filter((word) => !isStopWord(word))
		.slice(0, 5); // Limit to 5 words

	return generateSlug(words.join(" "));
}

export function generateUniqueSlug(
	base: string,
	existingIds: string[],
): string {
	return defaultGenerator.generateUniqueSlug(base, existingIds);
}

export function validateSlug(slug: string): boolean {
	return defaultGenerator.validateSlug(slug);
}

export function sanitizeSlug(slug: string): string {
	return generateSlug(slug);
}
