/**
 * Parse and format validation errors grouped by field
 * @param errors - Array of error strings in the format "field: message" or "message"
 * @returns Map of field names to error messages
 */
export function parseValidationErrors(errors: string[]): Map<string, string[]> {
	const fieldErrors = new Map<string, string[]>();

	for (const error of errors) {
		// Check if error contains multiple field errors separated by commas
		if (error.includes(",") && error.includes(":")) {
			// Split by comma and process each part
			const parts = error.split(",").map((p) => p.trim());

			for (const part of parts) {
				// Extract field path and message
				const match = part.match(/^(.+?):\s*(.+)$/);
				if (match?.[1] && match[2]) {
					const field = match[1];
					const message = match[2];
					if (!fieldErrors.has(field)) {
						fieldErrors.set(field, []);
					}
					fieldErrors.get(field)?.push(message);
				}
			}
		} else {
			// Single error, try to extract field
			const match = error.match(/^(.+?):\s*(.+)$/);
			if (match?.[1] && match[2]) {
				const field = match[1];
				const message = match[2];
				if (!fieldErrors.has(field)) {
					fieldErrors.set(field, []);
				}
				fieldErrors.get(field)?.push(message);
			} else {
				// No field, use generic key
				if (!fieldErrors.has("_general")) {
					fieldErrors.set("_general", []);
				}
				fieldErrors.get("_general")?.push(error);
			}
		}
	}

	return fieldErrors;
}

/**
 * ANSI color codes for terminal output
 */
export const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
} as const;

/**
 * Format an entity ID in the standard format
 * @param type - Entity type
 * @param number - Entity number
 * @param slug - Entity slug
 * @returns Formatted entity ID (e.g., "requirement-001-test-req")
 */
export function formatEntityId(
	type: string,
	number: number,
	slug: string,
): string {
	return `${type}-${number.toString().padStart(3, "0")}-${slug}`;
}

/**
 * Get the validation status icon based on errors and warnings
 * @param hasErrors - Whether the entity has errors
 * @param hasWarnings - Whether the entity has warnings
 * @returns Colored icon string
 */
export function getValidationIcon(
	hasErrors: boolean,
	hasWarnings: boolean,
): string {
	if (hasErrors) {
		return `${colors.red}✗${colors.reset}`;
	}
	if (hasWarnings) {
		return `${colors.yellow}!${colors.reset}`;
	}
	return `${colors.green}✓${colors.reset}`;
}

/**
 * Get tree structure prefix based on position
 * @param isLast - Whether this is the last item in the tree
 * @returns Tree prefix string
 */
export function getTreePrefix(isLast: boolean): string {
	return isLast ? "└─" : "├─";
}

/**
 * Get tree continuation based on position
 * @param isLast - Whether this is the last item in the tree
 * @returns Tree continuation string
 */
export function getTreeContinuation(isLast: boolean): string {
	return isLast ? "  " : "│ ";
}
