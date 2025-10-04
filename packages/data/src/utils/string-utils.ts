/**
 * String utility functions for data operations
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

export function extractWords(text: string, minLength = 2): string[] {
	return text
		.toLowerCase()
		.split(/\W+/)
		.filter((word) => word.length >= minLength && !isStopWord(word));
}
