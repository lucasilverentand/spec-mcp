import { extractWords, isStopWord } from "./string-utils.js";

/**
 * Generate a URL-friendly slug from input text
 */
export function generateSlug(input: string): string {
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

/**
 * Generate slug from title, extracting meaningful words
 */
export function generateSlugFromTitle(title: string): string {
	// Extract meaningful words and create a slug
	const words = extractWords(title, 2)
		.filter((word) => !isStopWord(word))
		.slice(0, 5); // Limit to 5 words

	return generateSlug(words.join(" "));
}

/**
 * Generate unique slug by appending counter if needed
 */
export function generateUniqueSlug(
	base: string,
	existingSlugs: string[],
): string {
	let slug = generateSlug(base);
	let counter = 1;

	while (existingSlugs.includes(slug)) {
		const baseSlug = generateSlug(base);
		slug = `${baseSlug}-${counter}`;
		counter++;
	}

	return slug;
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): boolean {
	// Valid slug: lowercase, alphanumeric, hyphens, no consecutive hyphens, no leading/trailing hyphens
	const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
	return slugRegex.test(slug) && slug.length <= 50 && slug.length >= 1;
}

/**
 * Sanitize slug (alias for generateSlug)
 */
export function sanitizeSlug(slug: string): string {
	return generateSlug(slug);
}
