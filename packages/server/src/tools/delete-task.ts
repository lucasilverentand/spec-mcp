import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type { Plan } from "@spec-mcp/schemas";

/**
 * Delete a task from a plan
 */
export async function deleteTask(
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

		// Check if other tasks depend on this task
		const dependentTasks = existingTasks.filter((t) =>
			t.depends_on?.includes(taskId),
		);

		if (dependentTasks.length > 0) {
			const dependentIds = dependentTasks.map((t) => t.id).join(", ");
			return {
				content: [
					{
						type: "text",
						text: `Cannot delete task ${taskId}: other tasks depend on it (${dependentIds})`,
					},
				],
				isError: true,
			};
		}

		// Remove the task
		const taskDescription = existingTasks[taskIndex].task;
		const updatedTasks = existingTasks.filter((t) => t.id !== taskId);

		// Update the plan
		await specManager.plans.update(plan.number, {
			tasks: updatedTasks,
		});

		return {
			content: [
				{
					type: "text",
					text: `Successfully deleted task ${taskId} from plan ${planId}: ${taskDescription}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error deleting task: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const deleteTaskTool = {
	name: "delete_task",
	description:
		"Delete a task from a plan. Will fail if other tasks depend on the task being deleted.",
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
