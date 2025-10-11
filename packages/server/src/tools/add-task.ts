import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type { Plan, Task } from "@spec-mcp/schemas";

/**
 * Add a new task to a plan
 * Supports superseding existing tasks by providing supersede_id
 */
export async function addTask(
	specManager: SpecManager,
	planId: string,
	task: string,
	options?: {
		priority?: "critical" | "high" | "medium" | "low" | "nice-to-have";
		depends_on?: string[];
		considerations?: string[];
		supersede_id?: string;
	},
): Promise<ToolResponse> {
	try {
		// Validate and find the plan
		const result = await validateEntity(specManager, planId);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to find plan: ${result.errors?.join(", ") || "Plan not found"}`,
					},
				],
				isError: true,
			};
		}

		const plan = result.entity as Plan;

		if (plan.type !== "plan") {
			return {
				content: [
					{
						type: "text",
						text: `Entity ${planId} is not a plan (found: ${plan.type})`,
					},
				],
				isError: true,
			};
		}

		const existingTasks = plan.tasks || [];

		// If superseding, validate the old task exists and isn't already superseded
		let oldTask: Task | undefined;
		if (options?.supersede_id) {
			oldTask = existingTasks.find((t) => t.id === options.supersede_id);

			if (!oldTask) {
				return {
					content: [
						{
							type: "text",
							text: `Task ${options.supersede_id} not found in plan ${planId}`,
						},
					],
					isError: true,
				};
			}

			// Check if already superseded
			if (oldTask.superseded_by !== null) {
				return {
					content: [
						{
							type: "text",
							text: `Task ${options.supersede_id} has already been superseded by ${oldTask.superseded_by}`,
						},
					],
					isError: true,
				};
			}
		}

		// Get the next globally unique task ID
		const newTaskId = await specManager.getNextTaskId();
		const now = new Date().toISOString();

		// Create the new task
		const newTask: Task = {
			...(oldTask || {}),
			id: newTaskId,
			priority: options?.priority || oldTask?.priority || "medium",
			depends_on: options?.depends_on || oldTask?.depends_on || [],
			task,
			considerations: options?.considerations || oldTask?.considerations || [],
			references: oldTask?.references || [],
			files: oldTask?.files || [],
			status: oldTask
				? {
						...oldTask.status,
						created_at: now,
						started_at: null,
						completed_at: null,
						verified_at: null,
						notes: [
							{
								text: `Created by superseding ${options.supersede_id}`,
								timestamp: now,
							},
						],
					}
				: {
						created_at: now,
						started_at: null,
						completed_at: null,
						verified_at: null,
						notes: [],
					},
			blocked: oldTask?.blocked || [],
			supersedes: options?.supersede_id || null,
			superseded_by: null,
			superseded_at: null,
		};

		let updatedTasks: Task[];

		if (options?.supersede_id && oldTask) {
			// Mark the old task as superseded
			const updatedOldTask: Task = {
				...oldTask,
				superseded_by: newTaskId,
				superseded_at: now,
			};

			// Update all references to the old ID with the new ID
			updatedTasks = existingTasks.map((t) => {
				if (t.id === options.supersede_id) {
					return updatedOldTask;
				}
				// Update references in depends_on
				const updatedTask = { ...t };
				if (t.depends_on && t.depends_on.length > 0) {
					updatedTask.depends_on = t.depends_on.map((depId) =>
						depId === options.supersede_id ? newTaskId : depId,
					);
				}
				// Update references in blocked_by within blocked array
				if (t.blocked && t.blocked.length > 0) {
					updatedTask.blocked = t.blocked.map((block) => ({
						...block,
						blocked_by: block.blocked_by.map((blockId) =>
							blockId === options.supersede_id ? newTaskId : blockId,
						),
					}));
				}
				return updatedTask;
			});

			// Add the new task
			updatedTasks.push(newTask);
		} else {
			// Simple add without supersession
			updatedTasks = [...existingTasks, newTask];
		}

		// Update the plan
		await specManager.plans.update(plan.number, {
			tasks: updatedTasks,
		});

		if (options?.supersede_id) {
			// Show what changed
			const changes: string[] = [];
			if (task !== oldTask?.task) {
				changes.push("- Task description updated");
			}
			if (options.priority && options.priority !== oldTask?.priority) {
				changes.push(
					`- Priority changed from ${oldTask?.priority} to ${options.priority}`,
				);
			}
			if (options.depends_on) {
				changes.push("- Dependencies updated");
			}
			if (options.considerations) {
				changes.push("- Considerations updated");
			}

			const changesSummary =
				changes.length > 0
					? `\n\nChanges:\n${changes.join("\n")}`
					: "\n\n(No field changes, task cloned with new ID)";

			return {
				content: [
					{
						type: "text",
						text: `Successfully superseded task ${options.supersede_id} with new task ${newTaskId}${changesSummary}\n\nThe old task remains in the plan for audit trail but is marked as superseded.\n\nAll references to ${options.supersede_id} have been updated to ${newTaskId}.`,
					},
				],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Successfully added task ${newTaskId} to plan ${planId}: ${task}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error adding task: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const addTaskTool = {
	name: "add_task",
	description:
		"Add a new task to a plan. The task will be assigned the next available task ID automatically. Optionally supersede an existing task by providing supersede_id - this will create a new version, mark the old task as superseded, and update all references to point to the new task.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001, pln-001-user-auth)",
			},
			task: {
				type: "string",
				description:
					"Clear and concise description of the task (10-300 characters)",
			},
			priority: {
				type: "string",
				enum: ["critical", "high", "medium", "low", "nice-to-have"],
				description: "Priority level for the task. Default: medium",
			},
			depends_on: {
				type: "array",
				items: { type: "string" },
				description:
					"Array of task IDs this task depends on (e.g., ['task-001'])",
			},
			considerations: {
				type: "array",
				items: { type: "string" },
				description: "Things to consider while performing the task",
			},
			supersede_id: {
				type: "string",
				description:
					"Optional: ID of an existing task to supersede (e.g., 'task-001'). The old task will be marked as superseded and all references will be updated to the new task.",
			},
		},
		required: ["plan_id", "task"],
	} as const,
};
