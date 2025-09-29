/**
 * String utility functions for spec management
 */

// Common stop words to filter out when generating slugs
export const STOP_WORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"by",
	"for",
	"from",
	"has",
	"he",
	"in",
	"is",
	"it",
	"its",
	"of",
	"on",
	"that",
	"the",
	"to",
	"was",
	"were",
	"will",
	"with",
	"would",
]);

export function isStopWord(word: string): boolean {
	return STOP_WORDS.has(word.toLowerCase());
}

export function sanitizeString(input: string): string {
	return input
		.trim()
		.replace(/\s+/g, " ")
		.replace(/[^\w\s-]/g, "");
}

export function truncateString(
	str: string,
	maxLength: number,
	suffix = "...",
): string {
	if (str.length <= maxLength) {
		return str;
	}

	const truncated = str.substring(0, maxLength - suffix.length);
	const lastSpace = truncated.lastIndexOf(" ");

	// If we can find a word boundary, break there
	if (lastSpace > maxLength * 0.7) {
		return truncated.substring(0, lastSpace) + suffix;
	}

	return truncated + suffix;
}

export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelCaseToKebabCase(str: string): string {
	return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function kebabCaseToCamelCase(str: string): string {
	return str
		.split("-")
		.map((word, index) => (index === 0 ? word : capitalizeFirstLetter(word)))
		.join("");
}

export function normalizeWhitespace(str: string): string {
	return str.replace(/\s+/g, " ").trim();
}

export function removeExtraSpaces(str: string): string {
	return str.replace(/\s{2,}/g, " ").trim();
}

export function extractWords(text: string, minLength = 2): string[] {
	return text
		.toLowerCase()
		.split(/\W+/)
		.filter((word) => word.length >= minLength && !isStopWord(word));
}

export function calculateStringSimilarity(a: string, b: string): number {
	if (a === b) return 1;
	if (a.length === 0 || b.length === 0) return 0;

	// Simple Levenshtein distance-based similarity
	const matrix: number[][] = Array(b.length + 1)
		.fill(null)
		.map(() => Array(a.length + 1).fill(null));

	// Initialize first row and column
	for (let i = 0; i <= a.length; i++) {
		const row = matrix[0];
		if (row) row[i] = i;
	}
	for (let j = 0; j <= b.length; j++) {
		const row = matrix[j];
		if (row) row[0] = j;
	}

	// Fill the matrix
	for (let j = 1; j <= b.length; j++) {
		for (let i = 1; i <= a.length; i++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const currentRow = matrix[j];
			const prevRow = matrix[j - 1];
			if (currentRow && prevRow) {
				const deletion = (prevRow[i] ?? 0) + 1;
				const insertion = (currentRow[i - 1] ?? 0) + 1;
				const substitution = (prevRow[i - 1] ?? 0) + cost;
				currentRow[i] = Math.min(deletion, insertion, substitution);
			}
		}
	}

	const distance = matrix[b.length]?.[a.length] ?? 0;
	const maxLength = Math.max(a.length, b.length);

	return 1 - distance / maxLength;
}

export function pluralize(word: string, count: number): string {
	if (count === 1) return word;

	// Simple pluralization rules
	if (word.endsWith("y")) {
		return `${word.slice(0, -1)}ies`;
	}
	if (
		word.endsWith("s") ||
		word.endsWith("sh") ||
		word.endsWith("ch") ||
		word.endsWith("x") ||
		word.endsWith("z")
	) {
		return `${word}es`;
	}
	return `${word}s`;
}

export function formatList(items: string[], conjunction = "and"): string {
	if (items.length === 0) return "";
	if (items.length === 1) return items[0] ?? "";
	if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

	const lastItem = items[items.length - 1];
	const otherItems = items.slice(0, -1);

	return `${otherItems.join(", ")}, ${conjunction} ${lastItem}`;
}

export function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function containsWord(
	text: string,
	word: string,
	caseSensitive = false,
): boolean {
	const flags = caseSensitive ? "g" : "gi";
	const escapedWord = escapeRegExp(word);
	const regex = new RegExp(`\\b${escapedWord}\\b`, flags);

	return regex.test(text);
}
