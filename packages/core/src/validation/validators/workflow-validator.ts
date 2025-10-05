import type { Plan } from "@spec-mcp/data";
import type { ValidationResult } from "../../shared/types/results.js";
import type { WorkflowValidationOptions } from "../../shared/types/validator.js";

export interface WorkflowContext {
	plans: Plan[];
	currentPlanId?: string;
	currentStep?: string;
	completedSteps?: string[];
	nextSteps?: string[];
	blockers?: string[];
}

function validatePlanWorkflow(
	plan: Plan,
	options: WorkflowValidationOptions = {},
): ValidationResult {
	const {
		checkFlowContinuity = true,
		checkTaskDependencies = true,
		checkTestCoverage = true,
		allowParallelTasks = true,
	} = options;

	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		// Validate flows
		if (checkFlowContinuity) {
			validateFlows(plan, errors, warnings);
		}

		// Validate task dependencies
		if (checkTaskDependencies) {
			validateTaskDependencies(plan, allowParallelTasks, errors, warnings);
		}

		// Validate test coverage
		if (checkTestCoverage) {
			validateTestCoverage(plan, errors, warnings);
		}

		// Validate overall workflow integrity
		validateWorkflowIntegrity(plan, errors, warnings);
	} catch (error) {
		errors.push(
			error instanceof Error ? error.message : "Workflow validation failed",
		);
	}

	return {
		success: errors.length === 0,
		valid: errors.length === 0,
		errors,
		...(errors.length > 0 && { error: errors.join(", ") }),
		...(warnings.length > 0 && { warnings }),
	};
}

function validateFlowExecution(
	plan: Plan,
	flowId: string,
	currentStepId?: string,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const flow = plan.flows.find((f) => f.id === flowId);
	if (!flow) {
		const errorMsg = `Flow '${flowId}' not found in plan`;
		errors.push(errorMsg);
		return {
			success: false,
			valid: false,
			errors,
			error: errorMsg,
			...(warnings.length > 0 && { warnings }),
		};
	}

	// Validate flow structure
	const stepIds = flow.steps.map((s) => s.id);
	const startSteps = flow.steps.filter(
		(s) => !flow.steps.some((other) => other.next_steps.includes(s.id)),
	);

	if (startSteps.length === 0) {
		errors.push(`Flow '${flowId}' has no starting step`);
	} else if (startSteps.length > 1) {
		warnings.push(`Flow '${flowId}' has multiple starting steps`);
	}

	// Check reachability from current step
	if (currentStepId) {
		const reachable = getReachableSteps(flow, currentStepId);
		const unreachable = stepIds.filter(
			(id) => !reachable.has(id) && id !== currentStepId,
		);

		if (unreachable.length > 0) {
			warnings.push(
				`Steps unreachable from '${currentStepId}': ${unreachable.join(", ")}`,
			);
		}
	}

	return {
		success: errors.length === 0,
		valid: errors.length === 0,
		errors,
		...(errors.length > 0 && { error: errors.join(", ") }),
		...(warnings.length > 0 && { warnings }),
	};
}

function generateWorkflowContext(plan: Plan): WorkflowContext {
	const completedTasks = plan.tasks.filter((t) => t.completed).map((t) => t.id);
	const incompleteTasks = plan.tasks.filter((t) => !t.completed);

	// Find next available tasks (no incomplete dependencies)
	const nextSteps = incompleteTasks
		.filter((task) =>
			task.depends_on.every((depId) => completedTasks.includes(depId)),
		)
		.map((t) => t.id);

	// Find blocked tasks
	const blockers = incompleteTasks
		.filter((task) =>
			task.depends_on.some((depId) => !completedTasks.includes(depId)),
		)
		.map((t) => t.id);

	return {
		plans: [plan],
		currentStep: "planning", // Default step
		completedSteps: completedTasks,
		nextSteps,
		blockers,
	};
}

function validateTaskSequence(
	tasks: Array<{ id: string; depends_on: string[] }>,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for cycles in task dependencies
	const cycles = detectTaskCycles(tasks);
	if (cycles.length > 0) {
		errors.push(
			`Circular dependencies detected: ${cycles.map((cycle) => cycle.join(" -> ")).join(", ")}`,
		);
	}

	// Check for orphaned tasks
	const taskIds = new Set(tasks.map((t) => t.id));
	const referencedTasks = new Set<string>();

	tasks.forEach((task) => {
		task.depends_on.forEach((depId: string) => {
			referencedTasks.add(depId);
		});
	});

	const orphanedTasks = tasks.filter(
		(task) =>
			!referencedTasks.has(task.id) &&
			task.depends_on.length === 0 &&
			tasks.length > 1,
	);

	if (orphanedTasks.length > 0) {
		warnings.push(
			`Orphaned tasks (no dependencies and not depended upon): ${orphanedTasks.map((t) => t.id).join(", ")}`,
		);
	}

	// Check for missing dependencies
	tasks.forEach((task) => {
		task.depends_on.forEach((depId: string) => {
			if (!taskIds.has(depId)) {
				errors.push(
					`Task '${task.id}' depends on non-existent task '${depId}'`,
				);
			}
		});
	});

	return {
		success: errors.length === 0,
		valid: errors.length === 0,
		errors,
		...(errors.length > 0 && { error: errors.join(", ") }),
		...(warnings.length > 0 && { warnings }),
	};
}

function optimizeTaskOrder<T extends { id: string; depends_on: string[] }>(
	tasks: T[],
): T[] {
	// Topological sort to optimize task execution order
	const graph = new Map<string, string[]>();
	const inDegree = new Map<string, number>();

	// Initialize
	tasks.forEach((task) => {
		graph.set(task.id, []);
		inDegree.set(task.id, 0);
	});

	// Build graph
	tasks.forEach((task) => {
		task.depends_on.forEach((depId: string) => {
			if (graph.has(depId)) {
				graph.get(depId)?.push(task.id);
				inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
			}
		});
	});

	const sorted: T[] = [];
	const queue: string[] = [];

	// Find tasks with no dependencies
	for (const [taskId, degree] of inDegree) {
		if (degree === 0) {
			queue.push(taskId);
		}
	}

	while (queue.length > 0) {
		const taskId = queue.shift();
		if (!taskId) continue;
		const task = tasks.find((t) => t.id === taskId);
		if (!task) continue;
		sorted.push(task);

		const dependents = graph.get(taskId) || [];
		dependents.forEach((depId) => {
			const newDegree = (inDegree.get(depId) || 0) - 1;
			inDegree.set(depId, newDegree);

			if (newDegree === 0) {
				queue.push(depId);
			}
		});
	}

	return sorted;
}

function validateFlows(plan: Plan, errors: string[], warnings: string[]): void {
	plan.flows.forEach((flow) => {
		const stepIds = flow.steps.map((s) => s.id);

		// Check for duplicate step IDs
		const duplicates = stepIds.filter(
			(id, index) => stepIds.indexOf(id) !== index,
		);
		if (duplicates.length > 0) {
			errors.push(
				`Flow '${flow.id}' has duplicate step IDs: ${duplicates.join(", ")}`,
			);
		}

		// Check step references
		flow.steps.forEach((step) => {
			step.next_steps.forEach((nextStepId) => {
				if (!stepIds.includes(nextStepId)) {
					errors.push(
						`Flow '${flow.id}' step '${step.id}' references non-existent step '${nextStepId}'`,
					);
				}
			});
		});

		// Check for start and end steps
		const startSteps = flow.steps.filter(
			(s) => !flow.steps.some((other) => other.next_steps.includes(s.id)),
		);

		const endSteps = flow.steps.filter((s) => s.next_steps.length === 0);

		if (startSteps.length === 0) {
			errors.push(`Flow '${flow.id}' has no starting step`);
		}

		if (endSteps.length === 0) {
			warnings.push(`Flow '${flow.id}' has no ending step`);
		}

		// Check for unreachable steps
		if (startSteps.length > 0) {
			const reachable = new Set<string>();
			const queue = startSteps.map((s) => s.id);

			while (queue.length > 0) {
				const stepId = queue.shift();
				if (!stepId || reachable.has(stepId)) continue;

				reachable.add(stepId);
				const step = flow.steps.find((s) => s.id === stepId);
				if (step) {
					queue.push(...step.next_steps);
				}
			}

			const unreachable = stepIds.filter((id) => !reachable.has(id));
			if (unreachable.length > 0) {
				warnings.push(
					`Flow '${flow.id}' has unreachable steps: ${unreachable.join(", ")}`,
				);
			}
		}
	});
}

function validateTaskDependencies(
	plan: Plan,
	allowParallelTasks: boolean,
	errors: string[],
	warnings: string[],
): void {
	const taskIds = plan.tasks.map((t) => t.id);

	// Check task references
	plan.tasks.forEach((task) => {
		task.depends_on.forEach((depId) => {
			if (!taskIds.includes(depId)) {
				errors.push(
					`Task '${task.id}' depends on non-existent task '${depId}'`,
				);
			}
		});
	});

	// Check for cycles
	const cycles = detectTaskCycles(plan.tasks);
	if (cycles.length > 0) {
		errors.push(
			`Task dependency cycles detected: ${cycles.map((cycle) => cycle.join(" -> ")).join(", ")}`,
		);
	}

	// Check for excessive parallelism
	if (!allowParallelTasks) {
		const parallelTasks = plan.tasks.filter(
			(task) => task.depends_on.length === 0,
		);
		if (parallelTasks.length > 3) {
			warnings.push(
				`High number of parallel tasks (${parallelTasks.length}) may cause resource contention`,
			);
		}
	}
}

function validateTestCoverage(
	plan: Plan,
	_errors: string[],
	warnings: string[],
): void {
	// Check if flows are covered by test cases
	const testedFlows = new Set<string>();
	plan.test_cases.forEach((testCase) => {
		testCase.related_flows.forEach((flowId) => {
			testedFlows.add(flowId);
		});
	});

	const untestedFlows = plan.flows.filter((flow) => !testedFlows.has(flow.id));
	if (untestedFlows.length > 0) {
		warnings.push(
			`Flows not covered by test cases: ${untestedFlows.map((f) => f.id).join(", ")}`,
		);
	}

	// Check test case coverage
	if (plan.test_cases.length === 0) {
		warnings.push("No test cases defined for this plan");
	}
}

function validateWorkflowIntegrity(
	plan: Plan,
	_errors: string[],
	warnings: string[],
): void {
	// Check if plan has both tasks and flows but they're not connected
	if (plan.tasks.length > 0 && plan.flows.length > 0) {
		// const taskIds = new Set(plan.tasks.map((t) => t.id));
		const flowStepIds = new Set(
			plan.flows.flatMap((f) => f.steps.map((s) => s.id)),
		);

		// Check if any task references flows or vice versa
		const hasTaskFlowConnection = plan.tasks.some(
			(task) => task.id && flowStepIds.has(task.id),
		);

		if (!hasTaskFlowConnection) {
			warnings.push(
				"Plan has both tasks and flows but they appear to be disconnected",
			);
		}
	}

	// Check completion criteria alignment
	if (plan.tasks.length > 0) {
		const criticalTasks = plan.tasks.filter((t) => t.priority === "high");
		if (criticalTasks.length === 0) {
			warnings.push(
				"No high-priority tasks defined - consider marking important tasks as high priority",
			);
		}
	}
}

function detectTaskCycles(
	tasks: Array<{ id: string; depends_on: string[] }>,
): string[][] {
	const cycles: string[][] = [];
	const graph = new Map<string, string[]>();

	// Build adjacency list
	tasks.forEach((task) => {
		graph.set(task.id, task.depends_on);
	});

	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	const dfs = (taskId: string, path: string[]): void => {
		if (recursionStack.has(taskId)) {
			const cycleStart = path.indexOf(taskId);
			if (cycleStart !== -1) {
				cycles.push([...path.slice(cycleStart), taskId]);
			}
			return;
		}

		if (visited.has(taskId)) {
			return;
		}

		visited.add(taskId);
		recursionStack.add(taskId);
		path.push(taskId);

		const dependencies = graph.get(taskId) || [];
		dependencies.forEach((depId) => {
			dfs(depId, path);
		});

		recursionStack.delete(taskId);
		path.pop();
	};

	tasks.forEach((task) => {
		if (!visited.has(task.id)) {
			dfs(task.id, []);
		}
	});

	return cycles;
}

function getReachableSteps(
	flow: { steps: Array<{ id: string; next_steps: string[] }> },
	startStepId: string,
): Set<string> {
	const reachable = new Set<string>();
	const queue = [startStepId];

	while (queue.length > 0) {
		const stepId = queue.shift();
		if (!stepId || reachable.has(stepId)) continue;

		reachable.add(stepId);
		const step = flow.steps.find((s) => s.id === stepId);
		if (step) {
			queue.push(...step.next_steps);
		}
	}

	return reachable;
}

export const WorkflowValidator = {
	validatePlanWorkflow,
	validateFlowExecution,
	generateWorkflowContext,
	validateTaskSequence,
	optimizeTaskOrder,
};
