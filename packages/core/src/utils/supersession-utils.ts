/**
 * Supersession utility functions
 * Extracted from schemas package to maintain separation of concerns
 */

/**
 * Items that support supersession
 */
export interface Supersedable {
	supersedes: string | null | undefined;
	superseded_by: string | null | undefined;
	superseded_at: string | null | undefined;
}

/**
 * Check if an item is currently active (not superseded)
 */
export function isActive<T extends Supersedable>(item: T): boolean {
	return item.superseded_by === null || item.superseded_by === undefined;
}

/**
 * Get all active (non-superseded) items from a list
 */
export function getActiveItems<T extends Supersedable>(items: T[]): T[] {
	return items.filter(isActive);
}

/**
 * Get the supersession history for an item (walking backwards)
 */
export function getItemHistory<T extends Supersedable & { id: string }>(
	items: T[],
	itemId: string,
): T[] {
	const history: T[] = [];
	let current = items.find((item) => item.id === itemId);

	// Walk backwards through supersedes chain
	while (current?.supersedes) {
		const prev = items.find((item) => item.id === current?.supersedes);
		if (prev) {
			history.unshift(prev);
			current = prev;
		} else {
			break;
		}
	}

	// Add the current item at the end
	if (current) {
		history.push(current);
	}

	return history;
}

/**
 * Get the latest version of an item (following superseded_by chain)
 */
export function getLatestItem<T extends Supersedable & { id: string }>(
	items: T[],
	itemId: string,
): T | null {
	let current = items.find((item) => item.id === itemId);

	// Walk forwards through superseded_by chain
	while (current?.superseded_by) {
		const next = items.find((item) => item.id === current?.superseded_by);
		if (next) {
			current = next;
		} else {
			break;
		}
	}

	return current || null;
}
