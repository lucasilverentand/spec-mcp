/**
 * Generate a URL-friendly slug from a string
 * @param input - The string to convert to a slug
 * @returns A lowercase, hyphenated slug with no special characters
 */
export function generateSlug(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
