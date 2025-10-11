import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type { Plan } from "@spec-mcp/schemas";
import { canCompleteTask, getTaskState } from "@spec-mcp/schemas";

/**
 * Mark a task as completed
 */
export async function finishTask(
	specManager: SpecManager,
	planId: string,
	taskId: string,
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

		// Find the task
		const existingTasks = plan.tasks || [];
		const taskIndex = existingTasks.findIndex((t) => t.id === taskId);

		if (taskIndex === -1) {
			return {
				content: [
					{
						type: "text",
						text: `Task ${taskId} not found in plan ${planId}`,
					},
				],
				isError: true,
			};
		}

		const task = existingTasks[taskIndex];

		// Check if task can be completed using the helper function
		const { canComplete, reason } = canCompleteTask(task, existingTasks);
		if (!canComplete) {
			return {
				content: [
					{
						type: "text",
						text: `Cannot complete task ${taskId}: ${reason}`,
					},
				],
				isError: true,
			};
		}

		// Mark task as completed
		const now = new Date().toISOString();
		const completionNote = `Completed at ${now}`;

		const updatedTask = {
			...task,
			status: {
				...task.status,
				updated_at: now,
				completed: true,
				completed_at: now,
				notes: [...task.status.notes, completionNote],
			},
		};

		const updatedTasks = [...existingTasks];
		updatedTasks[taskIndex] = updatedTask;

		// Update the plan
		await specManager.plans.update(plan.number, {
			tasks: updatedTasks,
		});

		return {
			content: [
				{
					type: "text",
					text: `Successfully completed task ${taskId} in plan ${planId}: ${task.task}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error completing task: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const finishTaskTool = {
	name: "finish_task",
	description:
		"Mark a task as completed with a completion timestamp. Will fail if dependencies are not completed.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001, pln-001-user-auth)",
			},
			task_id: {
				type: "string",
				description: "Task identifier (e.g., task-001)",
			},
		},
		required: ["plan_id", "task_id"],
	} as const,
};
