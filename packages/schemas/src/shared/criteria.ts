import { z } from "zod";

export const CriteriaIdSchema = z.string().regex(/^crit-\d{3}$/, {
	message: "Criteria ID must follow format: crit-XXX",
});

/**
 * Criteria schema - NO status field
 * Status is computed from all plans that implement this criterion
 */
export const CriteriaSchema = z.object({
	id: CriteriaIdSchema.describe("Unique identifier for the criterion"),
	description: z
		.string()
		.min(1)
		.describe("Description of the acceptance criterion"),
	rationale: z
		.string()
		.min(1)
		.describe("Rationale explaining why this criterion is important"),
	// NO status field - computed from tasks in plans!
	// Supersession tracking - for audit trail and updates
	supersedes: CriteriaIdSchema.nullable()
		.default(null)
		.describe("ID of the criteria this replaces (if any)"),
	superseded_by: CriteriaIdSchema.nullable()
		.default(null)
		.describe("ID of the criteria that replaces this (if superseded)"),
	superseded_at: z
		.string()
		.datetime()
		.nullable()
		.default(null)
		.describe("Timestamp when this criteria was superseded"),
});

export type CriteriaId = z.infer<typeof CriteriaIdSchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;

// Note: Helper functions for computing criteria state moved to requirement-status.ts
// Criteria no longer have a status field - it's computed from plans/tasks

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
