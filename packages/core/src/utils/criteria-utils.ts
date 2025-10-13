/**
 * Criteria utility functions
 * Extracted from schemas package to maintain separation of concerns
 */

import type { Criteria } from "@spec-mcp/schemas";

/**
 * Check if criteria is currently active (not superseded)
 */
export function isActiveCriteria(criteria: Criteria): boolean {
	return criteria.superseded_by === null;
}

/**
 * Get all active (non-superseded) criteria from a list
 */
export function getActiveCriteria(criteriaList: Criteria[]): Criteria[] {
	return criteriaList.filter(isActiveCriteria);
}

/**
 * Get the supersession history for a criteria (walking backwards)
 */
export function getCriteriaHistory(
	criteriaList: Criteria[],
	criteriaId: string,
): Criteria[] {
	const history: Criteria[] = [];
	let current = criteriaList.find((c) => c.id === criteriaId);

	// Walk backwards through supersedes chain
	while (current?.supersedes) {
		const prev = criteriaList.find((c) => c.id === current?.supersedes);
		if (prev) {
			history.unshift(prev);
			current = prev;
		} else {
			break;
		}
	}

	// Add the current criteria at the end
	if (current) {
		history.push(current);
	}

	return history;
}

/**
 * Get the latest version of a criteria (following superseded_by chain)
 */
export function getLatestCriteria(
	criteriaList: Criteria[],
	criteriaId: string,
): Criteria | null {
	let current = criteriaList.find((c) => c.id === criteriaId);

	// Walk forwards through superseded_by chain
	while (current?.superseded_by) {
		const next = criteriaList.find((c) => c.id === current?.superseded_by);
		if (next) {
			current = next;
		} else {
			break;
		}
	}

	return current || null;
}
