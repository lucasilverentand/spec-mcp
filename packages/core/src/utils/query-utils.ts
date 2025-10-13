/**
 * Query utility functions
 * Extracted from schemas package to maintain separation of concerns
 */

import type { ItemType, Query } from "@spec-mcp/schemas";

/**
 * Check if a query is filtering by item types
 */
export function isItemTypeQuery(query: Query): boolean {
	return (
		query.objects?.itemTypes !== undefined && query.objects.itemTypes.length > 0
	);
}

/**
 * Check if a query is filtering by spec types
 */
export function isSpecTypeQuery(query: Query): boolean {
	return (
		query.objects?.specTypes !== undefined && query.objects.specTypes.length > 0
	);
}

/**
 * Get spec types from a query
 */
export function getSpecTypes(query: Query): string[] | undefined {
	return query.objects?.specTypes;
}

/**
 * Get item types from a query
 */
export function getItemTypes(query: Query): ItemType[] | undefined {
	return query.objects?.itemTypes;
}
