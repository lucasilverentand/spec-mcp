import type { Criteria } from "./criteria.js";
import { getTaskState } from "./task.js";
import type { Task } from "./task.js";

/**
 * Requirement state derived from criteria completion
 */
export type RequirementState =
	| "not-started"
	| "in-progress"
	| "completed"
	| "verified";

/**
 * Plan reference structure from Plan schema
 */
export interface PlanRef {
	tasks: Task[];
}

/**
 * Get the state of a plan from its tasks
 */
export function getPlanState(plan: PlanRef): RequirementState {
	if (plan.tasks.length === 0) return "not-started";

	const states = plan.tasks.map((t) => getTaskState(t.status));

	if (states.every((s) => s === "verified")) return "verified";
	if (states.every((s) => s === "completed" || s === "verified"))
		return "completed";
	if (states.some((s) => s !== "not-started")) return "in-progress";
	return "not-started";
}

/**
 * Get the state of a single criterion from all plans that implement it
 */
export function getCriterionState(
	criterionId: string,
	requirementId: string,
	allPlans: Array<{ criteria?: { requirement: string; criteria: string }; tasks: Task[] }>,
): RequirementState {
	const implementingPlans = allPlans.filter(
		(p) =>
			p.criteria?.requirement === requirementId &&
			p.criteria?.criteria === criterionId,
	);

	if (implementingPlans.length === 0) return "not-started";

	const states = implementingPlans.map(getPlanState);

	if (states.every((s) => s === "verified")) return "verified";
	if (states.every((s) => s === "completed" || s === "verified"))
		return "completed";
	if (states.some((s) => s !== "not-started")) return "in-progress";
	return "not-started";
}

/**
 * Calculate the overall state of a requirement based on its criteria
 * This is a computed property - state is derived from all plans
 */
export function getRequirementState(
	requirement: { id: string; criteria: Criteria[] },
	allPlans: Array<{ criteria?: { requirement: string; criteria: string }; tasks: Task[] }>,
): RequirementState {
	if (requirement.criteria.length === 0) {
		return "not-started";
	}

	const criteriaStates = requirement.criteria.map((c) =>
		getCriterionState(c.id, requirement.id, allPlans),
	);

	if (criteriaStates.every((s) => s === "verified")) return "verified";
	if (criteriaStates.every((s) => s === "completed" || s === "verified"))
		return "completed";
	if (criteriaStates.some((s) => s !== "not-started")) return "in-progress";
	return "not-started";
}

/**
 * Get completion statistics for a requirement (computed from plans)
 */
export function getRequirementCompletionStats(
	requirement: { id: string; criteria: Criteria[] },
	allPlans: Array<{ criteria?: { requirement: string; criteria: string }; tasks: Task[] }>,
): {
	total: number;
	notStarted: number;
	inProgress: number;
	completed: number;
	verified: number;
	percentage: number;
} {
	const total = requirement.criteria.length;

	if (total === 0) {
		return {
			total: 0,
			notStarted: 0,
			inProgress: 0,
			completed: 0,
			verified: 0,
			percentage: 0,
		};
	}

	let notStarted = 0;
	let inProgress = 0;
	let completed = 0;
	let verified = 0;

	for (const criterion of requirement.criteria) {
		const state = getCriterionState(criterion.id, requirement.id, allPlans);

		if (state === "verified") {
			verified++;
		} else if (state === "completed") {
			completed++;
		} else if (state === "in-progress") {
			inProgress++;
		} else {
			notStarted++;
		}
	}

	const percentage = Math.round(((completed + verified) / total) * 100);

	return {
		total,
		notStarted,
		inProgress,
		completed,
		verified,
		percentage,
	};
}
