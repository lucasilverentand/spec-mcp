import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type { Milestone, Reference, Plan } from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// MILESTONE STATUS CALCULATION
// ============================================================================

/**
 * Milestone status computed from linked plans
 */
export type MilestoneStatus = {
	started_at: string | null;
	completed_at: string | null;
	verified_at: string | null;
	notes: string[];
};

/**
 * Calculate milestone status from its linked plans
 * A milestone is:
 * - started: if any linked plan task has started
 * - completed: if all linked plan tasks are completed (or verified)
 * - verified: if all linked plan tasks are verified
 */
export function calculateMilestoneStatus(
	linkedPlans: Plan[],
): MilestoneStatus {
	// If no plans are linked, milestone is not started
	if (linkedPlans.length === 0) {
		return {
			started_at: null,
			completed_at: null,
			verified_at: null,
			notes: [],
		};
	}

	// Collect all task statuses from all linked plans
	const allTaskStatuses = linkedPlans.flatMap(
		(plan) => plan.tasks?.map((t) => t.status) || [],
	);

	// If no tasks exist, milestone is not started
	if (allTaskStatuses.length === 0) {
		return {
			started_at: null,
			completed_at: null,
			verified_at: null,
			notes: [],
		};
	}

	// Find earliest started_at across all tasks
	const startedTimestamps = allTaskStatuses
		.map((s) => s.started_at)
		.filter((t): t is string => t !== null);
	const started_at =
		startedTimestamps.length > 0
			? startedTimestamps.sort()[0] || null
			: null;

	// Check if all tasks are completed or verified
	const allTasksCompleted = allTaskStatuses.every(
		(s) => s.completed_at !== null || s.verified_at !== null,
	);

	// Find latest completed_at across all tasks (if all are completed)
	let completed_at: string | null = null;
	if (allTasksCompleted) {
		const completedTimestamps = allTaskStatuses
			.map((s) => s.completed_at || s.verified_at)
			.filter((t): t is string => t !== null);
		completed_at =
			completedTimestamps.length > 0
				? completedTimestamps.sort().reverse()[0] || null
				: null;
	}

	// Check if all tasks are verified
	const allTasksVerified = allTaskStatuses.every((s) => s.verified_at !== null);

	// Find latest verified_at across all tasks (if all are verified)
	let verified_at: string | null = null;
	if (allTasksVerified) {
		const verifiedTimestamps = allTaskStatuses
			.map((s) => s.verified_at)
			.filter((t): t is string => t !== null);
		verified_at =
			verifiedTimestamps.length > 0
				? verifiedTimestamps.sort().reverse()[0] || null
				: null;
	}

	// Collect all notes from all tasks
	const notes = allTaskStatuses.flatMap((s) => s.notes);

	return {
		started_at,
		completed_at,
		verified_at,
		notes,
	};
}

/**
 * Get milestone status by fetching linked plans
 */
export async function getMilestoneStatus(
	specManager: SpecManager,
	milestoneId: string,
): Promise<MilestoneStatus> {
	const allPlans = await specManager.plans.list();
	const linkedPlans = allPlans.filter((p) =>
		p.milestones?.includes(milestoneId),
	);
	return calculateMilestoneStatus(linkedPlans);
}

// ============================================================================
// REFERENCE TOOLS (for Milestones)
// ============================================================================

export async function addReferenceToMilestone(
	specManager: SpecManager,
	milestoneId: string,
	reference: Reference,
): Promise<CallToolResult> {
	const config: ArrayToolConfig<Milestone, Reference> = {
		toolName: "add_reference",
		description: "Add reference to a milestone",
		specType: "milestone",
		arrayFieldName: "references",
		idPrefix: "",
		getArray: (spec) => spec.references || [],
		setArray: (_spec, items) => ({ references: items }),
	};

	return addSimpleItem(specManager, milestoneId, reference, config);
}

export const addReferenceToMilestoneTool = {
	name: "add_reference_to_milestone",
	description:
		"Add a reference (URL, documentation, file, code) to a Milestone for supporting documentation.",
	inputSchema: {
		type: "object",
		properties: {
			milestone_id: {
				type: "string",
				description: "Milestone identifier (e.g., mls-001-v1-launch)",
			},
			reference: {
				type: "object",
				description:
					"Reference object with type-specific fields (url, documentation, file, code, or other)",
				properties: {
					type: {
						type: "string",
						enum: ["url", "documentation", "file", "code", "other"],
					},
					name: { type: "string" },
					description: { type: "string" },
					importance: {
						type: "string",
						enum: ["low", "medium", "high", "critical"],
					},
				},
				required: ["type", "name", "description"],
			},
		},
		required: ["milestone_id", "reference"],
	} as const,
};

export const removeReferenceFromMilestoneTool = {
	name: "remove_reference_from_milestone",
	description: "Remove a reference from a Milestone by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			milestone_id: {
				type: "string",
				description: "Milestone identifier (e.g., mls-001-v1-launch)",
			},
			index: {
				type: "number",
				description: "Index of the reference to remove (0-based)",
			},
		},
		required: ["milestone_id", "index"],
	} as const,
};
