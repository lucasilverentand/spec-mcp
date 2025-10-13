/**
 * Requirement status utility functions
 * Extracted from schemas package to maintain separation of concerns
 */

import type { PlanRef, RequirementRef } from "@spec-mcp/schemas";
import { getTaskState, isCompleted } from "./task-utils.js";

/**
 * State of a requirement or criterion
 */
export type RequirementState =
	| "not-started"
	| "in-progress"
	| "completed"
	| "verified";

/**
 * Get the state of a plan based on its tasks
 */
export function getPlanState(plan: PlanRef): RequirementState {
	if (!plan.tasks || plan.tasks.length === 0) {
		return "not-started";
	}

	const taskStates = plan.tasks.map((t) => getTaskState(t.status));

	if (taskStates.every((s) => s === "verified")) return "verified";
	if (taskStates.every((s) => s === "completed" || s === "verified"))
		return "completed";
	if (taskStates.some((s) => s === "in-progress" || s === "completed"))
		return "in-progress";
	return "not-started";
}

/**
 * Get the state of a criterion based on plans that implement it
 */
export function getCriterionState(
	criterion: { id: string },
	allPlans: PlanRef[],
): RequirementState {
	const implementingPlans = allPlans.filter(
		(p) => p.criteria?.criteria === criterion.id,
	);

	if (implementingPlans.length === 0) {
		return "not-started";
	}

	const planStates = implementingPlans.map((p) => getPlanState(p));

	// If all implementing plans are verified, criterion is verified
	if (planStates.every((s) => s === "verified")) return "verified";
	// If all are completed or verified, criterion is completed
	if (planStates.every((s) => s === "completed" || s === "verified"))
		return "completed";
	// If any are in progress or completed, criterion is in progress
	if (planStates.some((s) => s === "in-progress" || s === "completed"))
		return "in-progress";

	return "not-started";
}

/**
 * Get the state of a requirement based on its criteria
 */
export function getRequirementState(
	requirement: RequirementRef,
	allPlans: PlanRef[],
): RequirementState {
	if (!requirement.criteria || requirement.criteria.length === 0) {
		return "not-started";
	}

	const criteriaStates = requirement.criteria.map((c) =>
		getCriterionState(c, allPlans),
	);

	if (criteriaStates.every((s) => s === "verified")) return "verified";
	if (criteriaStates.every((s) => s === "completed" || s === "verified"))
		return "completed";
	if (criteriaStates.some((s) => s === "in-progress" || s === "completed"))
		return "in-progress";

	return "not-started";
}

/**
 * Get completion statistics for a requirement
 */
export function getRequirementCompletionStats(
	requirement: RequirementRef,
	allPlans: PlanRef[],
): {
	totalCriteria: number;
	completedCriteria: number;
	totalTasks: number;
	completedTasks: number;
} {
	const criteria = requirement.criteria || [];
	let totalTasks = 0;
	let completedTasks = 0;
	let completedCriteria = 0;

	for (const criterion of criteria) {
		const implementingPlans = allPlans.filter(
			(p) => p.criteria?.criteria === criterion.id,
		);

		for (const plan of implementingPlans) {
			if (plan.tasks) {
				totalTasks += plan.tasks.length;
				completedTasks += plan.tasks.filter((t) =>
					isCompleted(t.status),
				).length;
			}
		}

		const criterionState = getCriterionState(criterion, allPlans);
		if (criterionState === "completed" || criterionState === "verified") {
			completedCriteria++;
		}
	}

	return {
		totalCriteria: criteria.length,
		completedCriteria,
		totalTasks,
		completedTasks,
	};
}
