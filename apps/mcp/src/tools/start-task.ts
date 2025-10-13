import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { canStartTask, validateEntity } from "@spec-mcp/core";
import type { Plan } from "@spec-mcp/schemas";

/**
 * Mark a task as started by adding a note
 */
export async function startTask(
	specManager: SpecManager,
	planId: string,
	taskId: string,
): Promise<CallToolResult> {
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
		if (!task) {
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

		// Check if task can be started using the helper function
		const { canStart, reason } = canStartTask(task, existingTasks);
		if (!canStart) {
			return {
				content: [
					{
						type: "text",
						text: `Cannot start task ${taskId}: ${reason}`,
					},
				],
				isError: true,
			};
		}

		// Mark task as started
		const now = new Date().toISOString();
		const startNote = `Started at ${now}`;

		// Update the task
		const updatedTask = {
			...task,
			status: {
				...task.status,
				updated_at: now,
				started_at: now,
				notes: [...task.status.notes, startNote],
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
					text: `Successfully started task ${taskId} in plan ${planId}: ${task.task}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error starting task: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const startTaskTool = {
	name: "start_task",
	description:
		"Mark a task as started by adding a timestamped note. Will fail if dependencies are not completed.",
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
