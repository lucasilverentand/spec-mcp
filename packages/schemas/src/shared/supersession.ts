import z from "zod";

/**
 * Generic supersession fields for any item with an ID
 * Used to track update history while maintaining ID immutability
 */
export function createSupersessionSchema<T extends z.ZodString>(idSchema: T) {
	return {
		supersedes: idSchema
			.nullable()
			.default(null)
			.describe("ID of the item this replaces (if any)"),
		superseded_by: idSchema
			.nullable()
			.default(null)
			.describe("ID of the item that replaces this (if superseded)"),
		superseded_at: z
			.string()
			.datetime()
			.nullable()
			.default(null)
			.describe("Timestamp when this item was superseded"),
	};
}

/**
 * Generic interface for items that support supersession
 */
export interface Supersedable {
	supersedes: string | null;
	superseded_by: string | null;
	superseded_at: string | null;
}

/**
 * Check if an item is currently active (not superseded)
 */
export function isActive<T extends Supersedable>(item: T): boolean {
	return item.superseded_by === null;
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
	let current = items.find((i) => i.id === itemId);

	// Walk backwards through supersedes chain
	while (current?.supersedes) {
		const prev = items.find((i) => i.id === current?.supersedes);
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
	let current = items.find((i) => i.id === itemId);

	// Walk forwards through superseded_by chain
	while (current?.superseded_by) {
		const next = items.find((i) => i.id === current?.superseded_by);
		if (next) {
			current = next;
		} else {
			break;
		}
	}

	return current || null;
}
