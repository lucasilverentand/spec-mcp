import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type { Milestone, Reference } from "@spec-mcp/schemas";
import { getTaskState } from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// MILESTONE STATUS TOOLS
// ============================================================================

/**
 * Start a milestone - marks it as started
 */
export async function startMilestone(
	specManager: SpecManager,
	milestoneId: string,
): Promise<ToolResponse> {
	try {
		const result = await validateEntity(specManager, milestoneId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find milestone: ${result.errors?.join(", ") || "Milestone not found"}`,
					},
				],
				isError: true,
			};
		}

		const milestone = result.entity as Milestone;

		if (milestone.type !== "milestone") {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${milestoneId} is not a milestone (found: ${milestone.type})`,
					},
				],
				isError: true,
			};
		}

		if (milestone.status.started_at !== null) {
			return {
				content: [
					{
						type: "text",
						text: `Milestone ${milestoneId} has already been started at ${milestone.status.started_at}`,
					},
				],
				isError: true,
			};
		}

		const now = new Date().toISOString();

		await specManager.milestones.update(milestone.number, {
			status: {
				...milestone.status,
				started_at: now,
			},
		});

		return {
			content: [
				{
					type: "text",
					text: `Successfully started milestone ${milestoneId}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error starting milestone: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const startMilestoneTool = {
	name: "start_milestone",
	description: "Mark a milestone as started by setting started_at timestamp.",
	inputSchema: {
		type: "object",
		properties: {
			milestone_id: {
				type: "string",
				description: "Milestone identifier (e.g., mls-001-v1-launch)",
			},
		},
		required: ["milestone_id"],
	} as const,
};

/**
 * Complete a milestone - marks it as completed
 */
export async function completeMilestone(
	specManager: SpecManager,
	milestoneId: string,
): Promise<ToolResponse> {
	try {
		const result = await validateEntity(specManager, milestoneId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find milestone: ${result.errors?.join(", ") || "Milestone not found"}`,
					},
				],
				isError: true,
			};
		}

		const milestone = result.entity as Milestone;

		if (milestone.type !== "milestone") {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${milestoneId} is not a milestone (found: ${milestone.type})`,
					},
				],
				isError: true,
			};
		}

		if (milestone.status.completed_at !== null) {
			return {
				content: [
					{
						type: "text",
						text: `Milestone ${milestoneId} has already been completed at ${milestone.status.completed_at}`,
					},
				],
				isError: true,
			};
		}

		// Check if all plans in the milestone are completed
		const allPlans = await specManager.plans.list();
		const milestonePlans = allPlans.filter((p) =>
			p.milestones?.includes(milestoneId),
		);

		if (milestonePlans.length > 0) {
			const incompletePlans = milestonePlans.filter((p) => {
				if (!p.tasks || p.tasks.length === 0) return true;
				return !p.tasks.every((t) => {
					const state = getTaskState(t.status);
					return state === "completed" || state === "verified";
				});
			});

			if (incompletePlans.length > 0) {
				const planIds = incompletePlans.map((p) => `${p.type}-${p.number}-${p.slug}`).join(", ");
				return {
					content: [
						{
							type: "text",
							text: `Cannot complete milestone ${milestoneId}. The following plans are not yet complete: ${planIds}`,
						},
					],
					isError: true,
				};
			}
		}

		const now = new Date().toISOString();

		await specManager.milestones.update(milestone.number, {
			status: {
				...milestone.status,
				started_at: milestone.status.started_at || now,
				completed_at: now,
			},
		});

		return {
			content: [
				{
					type: "text",
					text: `Successfully completed milestone ${milestoneId}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error completing milestone: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const completeMilestoneTool = {
	name: "complete_milestone",
	description:
		"Mark a milestone as completed. Validates that all plans associated with this milestone have their tasks completed.",
	inputSchema: {
		type: "object",
		properties: {
			milestone_id: {
				type: "string",
				description: "Milestone identifier (e.g., mls-001-v1-launch)",
			},
		},
		required: ["milestone_id"],
	} as const,
};

/**
 * Verify a milestone - marks it as verified
 */
export async function verifyMilestone(
	specManager: SpecManager,
	milestoneId: string,
	note?: string,
): Promise<ToolResponse> {
	try {
		const result = await validateEntity(specManager, milestoneId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find milestone: ${result.errors?.join(", ") || "Milestone not found"}`,
					},
				],
				isError: true,
			};
		}

		const milestone = result.entity as Milestone;

		if (milestone.type !== "milestone") {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${milestoneId} is not a milestone (found: ${milestone.type})`,
					},
				],
				isError: true,
			};
		}

		if (milestone.status.completed_at === null) {
			return {
				content: [
					{
						type: "text",
						text: `Milestone ${milestoneId} must be completed before it can be verified`,
					},
				],
				isError: true,
			};
		}

		if (milestone.status.verified_at !== null) {
			return {
				content: [
					{
						type: "text",
						text: `Milestone ${milestoneId} has already been verified at ${milestone.status.verified_at}`,
					},
				],
				isError: true,
			};
		}

		const now = new Date().toISOString();
		const notes = note
			? [...milestone.status.notes, { text: note, timestamp: now }]
			: milestone.status.notes;

		await specManager.milestones.update(milestone.number, {
			status: {
				...milestone.status,
				verified_at: now,
				notes,
			},
		});

		return {
			content: [
				{
					type: "text",
					text: `Successfully verified milestone ${milestoneId}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error verifying milestone: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const verifyMilestoneTool = {
	name: "verify_milestone",
	description:
		"Mark a milestone as verified. The milestone must be completed first.",
	inputSchema: {
		type: "object",
		properties: {
			milestone_id: {
				type: "string",
				description: "Milestone identifier (e.g., mls-001-v1-launch)",
			},
			note: {
				type: "string",
				description:
					"Optional note about the verification (e.g., 'Tested and approved by stakeholders')",
			},
		},
		required: ["milestone_id"],
	} as const,
};

// ============================================================================
// REFERENCE TOOLS (for Milestones)
// ============================================================================

export async function addReferenceToMilestone(
	specManager: SpecManager,
	milestoneId: string,
	reference: Reference,
): Promise<ToolResponse> {
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
