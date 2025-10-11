import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type { Plan, Task } from "@spec-mcp/schemas";

/**
 * Add a new task to a plan
 */
export async function addTask(
	specManager: SpecManager,
	planId: string,
	task: string,
	options?: {
		priority?: "critical" | "high" | "medium" | "low" | "nice-to-have";
		depends_on?: string[];
		considerations?: string[];
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

		// Get the next task ID
		const existingTasks = plan.tasks || [];
		const maxTaskNum = existingTasks.reduce((max, t) => {
			const match = t.id.match(/^task-(\d+)$/);
			if (match) {
				const num = Number.parseInt(match[1], 10);
				return num > max ? num : max;
			}
			return max;
		}, 0);

		const newTaskId = `task-${String(maxTaskNum + 1).padStart(3, "0")}`;

		// Create the new task
		const now = new Date().toISOString();
		const newTask: Task = {
			id: newTaskId,
			priority: options?.priority || "medium",
			depends_on: options?.depends_on || [],
			task,
			considerations: options?.considerations || [],
			references: [],
			files: [],
			status: {
				created_at: now,
				updated_at: now,
				started_at: null,
				completed: false,
				completed_at: null,
				verified: false,
				verified_at: null,
				notes: [],
			},
			blocked: [],
		};

		// Add the task to the plan
		const updatedTasks = [...existingTasks, newTask];

		// Update the plan
		await specManager.plans.update(plan.number, {
			tasks: updatedTasks,
		});

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
		"Add a new task to a plan. The task will be assigned the next available task ID automatically.",
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
				description: "Array of task IDs this task depends on (e.g., ['task-001'])",
			},
			considerations: {
				type: "array",
				items: { type: "string" },
				description: "Things to consider while performing the task",
			},
		},
		required: ["plan_id", "task"],
	} as const,
};
