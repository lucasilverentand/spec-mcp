import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type { Plan } from "@spec-mcp/schemas";
import { canCompleteTask, canStartTask } from "@spec-mcp/schemas";

/**
 * Get the path for a plan's worktree
 */
function getWorktreePath(planId: string, projectRoot: string): string {
	return path.join(projectRoot, "..", "plan", planId);
}

/**
 * Get the branch name for a plan
 */
function getBranchName(planId: string): string {
	return `plans/${planId}`;
}

/**
 * Start a plan by creating a worktree and branch
 */
export async function startPlan(
	specManager: SpecManager,
	planId: string,
	projectRoot: string,
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

		const branchName = getBranchName(planId);
		const worktreePath = getWorktreePath(planId, projectRoot);

		// Check if worktree already exists
		if (fs.existsSync(worktreePath)) {
			return {
				content: [
					{
						type: "text",
						text: `Worktree already exists at ${worktreePath}. Use 'git worktree remove ${worktreePath}' to remove it first.`,
					},
				],
				isError: true,
			};
		}

		// Create the worktree branch from main
		try {
			execSync(`git worktree add -b "${branchName}" "${worktreePath}" main`, {
				cwd: projectRoot,
				stdio: "pipe",
			});
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to create worktree: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}

		// Switch SpecManager to the worktree
		try {
			await specManager.switchToWorktree(worktreePath);
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to switch to worktree: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}

		const specsPath = path.join(worktreePath, "specs");

		return {
			content: [
				{
					type: "text",
					text: `Successfully started plan ${planId}:
- Created branch: ${branchName}
- Worktree location: ${worktreePath}
- Specs directory: ${specsPath}
- Switched to worktree context

All spec operations will now be performed in: ${specsPath}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error starting plan: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const startPlanTool = {
	name: "start_plan",
	description:
		"Start working on a plan by creating a Git worktree and branch. Creates a worktree at ../plan/<plan-id> with branch name 'plans/<plan-id>' from main.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001, pln-001-user-auth)",
			},
		},
		required: ["plan_id"],
	} as const,
};

/**
 * Updated start_task that marks task as started (no git operations)
 */
export async function startTaskGit(
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

export const startTaskGitTool = {
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

/**
 * Finish a task by staging files, creating a commit with LLM summary, and handling flow
 */
export async function finishTaskGit(
	specManager: SpecManager,
	planId: string,
	taskId: string,
	summary: string,
	projectRoot: string,
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

		const worktreePath = getWorktreePath(planId, projectRoot);

		// Check if worktree exists
		if (!fs.existsSync(worktreePath)) {
			return {
				content: [
					{
						type: "text",
						text: `Worktree not found at ${worktreePath}. Run start_plan first.`,
					},
				],
				isError: true,
			};
		}

		// Check if there are any staged changes
		try {
			const status = execSync("git diff --cached --name-only", {
				cwd: worktreePath,
				encoding: "utf-8",
			}).trim();

			if (!status) {
				return {
					content: [
						{
							type: "text",
							text: `No staged changes found. Please stage your changes with 'git add' before finishing the task.`,
						},
					],
					isError: true,
				};
			}
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to check staged changes: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}

		// Create commit with standard format
		const commitMessage = `${task.task}

${summary}

Task: ${taskId}
Plan: ${planId}`;

		try {
			execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
				cwd: worktreePath,
				stdio: "pipe",
			});
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to create commit: ${error instanceof Error ? error.message : String(error)}`,
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
				completed_at: now,
				notes: [...task.status.notes, completionNote],
			},
		};

		const updatedTasks = [...existingTasks];
		updatedTasks[taskIndex] = updatedTask as typeof task;

		// Update the plan
		await specManager.plans.update(plan.number, {
			tasks: updatedTasks,
		});

		// Check if there are more tasks
		const incompleteTasks = updatedTasks.filter(
			(t) => !t.status.completed_at && t.id !== taskId,
		);

		if (incompleteTasks.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: `Successfully completed task ${taskId} in plan ${planId}: ${task.task}

All tasks are complete! Use finish_plan() to push the branch and create a PR.`,
					},
				],
			};
		}

		// Find the next task that can be started
		const nextTask = incompleteTasks.find((t) => {
			const { canStart } = canStartTask(t, updatedTasks);
			return canStart;
		});

		if (nextTask) {
			return {
				content: [
					{
						type: "text",
						text: `Successfully completed task ${taskId} in plan ${planId}: ${task.task}

Next task available: ${nextTask.id} - ${nextTask.task}
Use start_task("${planId}", "${nextTask.id}") to begin.`,
					},
				],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Successfully completed task ${taskId} in plan ${planId}: ${task.task}

${incompleteTasks.length} task(s) remaining, but they are blocked by dependencies.`,
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

export const finishTaskGitTool = {
	name: "finish_task",
	description:
		"Mark a task as completed by creating a Git commit with staged changes and an LLM-generated summary. IMPORTANT: You must stage your changes with 'git add' before calling this tool. Will fail if dependencies are not completed or no changes are staged.",
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
			summary: {
				type: "string",
				description:
					"Brief summary of what was accomplished in this task. This will be included in the commit message.",
			},
		},
		required: ["plan_id", "task_id", "summary"],
	} as const,
};

/**
 * Finish a plan by pushing the branch and creating a PR
 */
export async function finishPlan(
	specManager: SpecManager,
	planId: string,
	projectRoot: string,
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

		// Check if all tasks are completed
		const existingTasks = plan.tasks || [];
		const incompleteTasks = existingTasks.filter((t) => !t.status.completed_at);

		if (incompleteTasks.length > 0) {
			return {
				content: [
					{
						type: "text",
						text: `Cannot finish plan ${planId}: ${incompleteTasks.length} task(s) still incomplete:
${incompleteTasks.map((t) => `- ${t.id}: ${t.task}`).join("\n")}`,
					},
				],
				isError: true,
			};
		}

		const branchName = getBranchName(planId);
		const worktreePath = getWorktreePath(planId, projectRoot);

		// Check if worktree exists
		if (!fs.existsSync(worktreePath)) {
			return {
				content: [
					{
						type: "text",
						text: `Worktree not found at ${worktreePath}. The plan may have already been finished.`,
					},
				],
				isError: true,
			};
		}

		// Push the branch
		try {
			execSync(`git push -u origin "${branchName}"`, {
				cwd: worktreePath,
				stdio: "pipe",
			});
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to push branch: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}

		// Create PR using gh CLI
		let prUrl = "";
		let prError: Error | null = null;
		try {
			prUrl = execSync(
				`gh pr create --base main --head "${branchName}" --title "${plan.name}" --body "Implements plan ${planId}\n\n${plan.description || ""}"`,
				{
					cwd: worktreePath,
					encoding: "utf-8",
				},
			).trim();
		} catch (error) {
			prError = error instanceof Error ? error : new Error(String(error));
		}

		// Switch back to main
		try {
			await specManager.switchToMain();
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Warning: Failed to switch back to main: ${error instanceof Error ? error.message : String(error)}

You may need to manually switch context.`,
					},
				],
				isError: true,
			};
		}

		// Return result based on PR creation
		if (prError) {
			return {
				content: [
					{
						type: "text",
						text: `Branch pushed successfully, but failed to create PR: ${prError.message}

You can create the PR manually with:
gh pr create --base main --head "${branchName}"

Switched back to main context.`,
					},
				],
				isError: false, // Not a critical error since the branch was pushed
			};
		}

		const mainSpecsPath = specManager.getBasePath();

		return {
			content: [
				{
					type: "text",
					text: `Successfully finished plan ${planId}:
- Pushed branch: ${branchName}
- Created PR: ${prUrl}
- Switched back to main context
- Specs directory: ${mainSpecsPath}

You can now review and merge the PR. The worktree at ${worktreePath} can be removed with:
git worktree remove ${worktreePath}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error finishing plan: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const finishPlanTool = {
	name: "finish_plan",
	description:
		"Finish a plan by pushing the branch and creating a PR back into main. All tasks must be completed before calling this tool.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001, pln-001-user-auth)",
			},
		},
		required: ["plan_id"],
	} as const,
};

/**
 * Get current worktree context
 */
export async function getWorktreeContext(
	specManager: SpecManager,
): Promise<CallToolResult> {
	try {
		const currentWorktree = specManager.getCurrentWorktree();
		const specsPath = specManager.getBasePath();

		if (!currentWorktree) {
			return {
				content: [
					{
						type: "text",
						text: `Currently on main branch (no active worktree).
Specs directory: ${specsPath}`,
					},
				],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Currently in worktree: ${currentWorktree}
Specs directory: ${specsPath}

All spec operations are being performed in: ${specsPath}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error getting worktree context: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const getWorktreeContextTool = {
	name: "get_worktree_context",
	description:
		"Get the current worktree context. Shows if you're working in a plan worktree or on main.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	} as const,
};

/**
 * Switch to a specific plan worktree
 */
export async function switchWorktree(
	specManager: SpecManager,
	planId: string,
	projectRoot: string,
): Promise<CallToolResult> {
	try {
		const worktreePath = getWorktreePath(planId, projectRoot);

		// Check if worktree exists
		if (!fs.existsSync(worktreePath)) {
			return {
				content: [
					{
						type: "text",
						text: `Worktree not found at ${worktreePath}. Use start_plan() to create it first.`,
					},
				],
				isError: true,
			};
		}

		// Switch to the worktree
		await specManager.switchToWorktree(worktreePath);
		const specsPath = path.join(worktreePath, "specs");

		return {
			content: [
				{
					type: "text",
					text: `Switched to worktree for plan ${planId}:
- Worktree location: ${worktreePath}
- Specs directory: ${specsPath}

All spec operations will now be performed in: ${specsPath}`,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error switching worktree: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const switchWorktreeTool = {
	name: "switch_worktree",
	description:
		"Switch to a specific plan's worktree. Use this to work on a different plan or to resume work on an existing plan.",
	inputSchema: {
		type: "object",
		properties: {
			plan_id: {
				type: "string",
				description: "Plan identifier (e.g., pln-001, pln-001-user-auth)",
			},
		},
		required: ["plan_id"],
	} as const,
};

/**
 * Switch back to main
 */
export async function switchToMain(
	specManager: SpecManager,
): Promise<CallToolResult> {
	try {
		if (!specManager.isInWorktree()) {
			return {
				content: [
					{
						type: "text",
						text: "Already on main (no active worktree).",
					},
				],
			};
		}

		await specManager.switchToMain();

		return {
			content: [
				{
					type: "text",
					text: "Switched back to main branch.\n\nAll spec operations will now be performed in the main repository.",
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error switching to main: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const switchToMainTool = {
	name: "switch_to_main",
	description:
		"Switch back to the main branch context. Use this when you want to stop working on a plan and return to the main repository.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	} as const,
};
