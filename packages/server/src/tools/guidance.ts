import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { AnyEntity, Plan, Requirement, Task } from "@spec-mcp/data";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

type Component = Extract<
	AnyEntity,
	{ type: "app" | "service" | "library" }
>;

const SpecTypeSchema = z.enum(["requirement", "component", "plan"]);

interface AnalysisResult {
	id: string;
	type: string;
	overall_quality: "good" | "needs_improvement";
	issues: string[];
	suggestions: string[];
	strengths: string[];
	guide_reference: string;
}

/**
 * Analyze a requirement against the 7-step reasoning process
 */
function analyzeRequirement(req: Requirement): AnalysisResult {
	const issues: string[] = [];
	const suggestions: string[] = [];
	const strengths: string[] = [];

	// Step 1: Problem identification
	if (
		!req.description ||
		req.description.length < 50 ||
		(!req.description.includes("because") &&
			!req.description.includes("needed"))
	) {
		issues.push(
			"Description should clearly state the problem/opportunity and rationale (include 'because' or 'why needed')",
		);
		suggestions.push(
			"Add context: What problem does this solve? What's the business value?",
		);
	} else {
		strengths.push("Description includes clear rationale");
	}

	// Step 2: Implementation details check
	const implementationKeywords = [
		"using",
		"with",
		"redis",
		"postgresql",
		"react",
		"component",
		"class",
		"function",
	];
	if (
		implementationKeywords.some((keyword) =>
			req.description.toLowerCase().includes(keyword),
		)
	) {
		issues.push(
			"Requirements should avoid implementation details - focus on WHAT, not HOW",
		);
		suggestions.push(
			"Rewrite to describe user needs or outcomes, not technical solutions",
		);
	} else {
		strengths.push("Appropriately avoids implementation details");
	}

	// Step 3: Measurability check
	const measurableKeywords = [
		"within",
		"seconds",
		"ms",
		"percentage",
		"number",
		"count",
		"support",
	];
	const hasMeasurableTerms = measurableKeywords.some((keyword) =>
		req.description.toLowerCase().includes(keyword),
	);
	if (!hasMeasurableTerms) {
		suggestions.push(
			"Consider adding measurable criteria (e.g., response times, capacity limits, percentages)",
		);
	} else {
		strengths.push("Includes measurable criteria");
	}

	// Step 4: Vague terms check
	const vagueTerms = [
		"fast",
		"slow",
		"user-friendly",
		"intuitive",
		"easy",
		"simple",
		"better",
	];
	const foundVagueTerms = vagueTerms.filter((term) =>
		req.description.toLowerCase().includes(term),
	);
	if (foundVagueTerms.length > 0) {
		issues.push(
			`Avoid vague terms: ${foundVagueTerms.join(", ")} - use specific, measurable criteria instead`,
		);
	} else {
		strengths.push("Uses specific, unambiguous language");
	}

	// Step 5: Acceptance criteria
	if (!req.criteria || req.criteria.length === 0) {
		issues.push(
			"Missing acceptance criteria - requirements must be verifiable",
		);
		suggestions.push(
			"Add at least 2-4 criteria describing what 'done' looks like",
		);
	} else if (req.criteria.length < 2) {
		suggestions.push(
			"Consider adding more acceptance criteria for comprehensive coverage",
		);
	} else {
		strengths.push(`Has ${req.criteria.length} acceptance criteria`);
	}

	// Step 6: Priority validation
	if (!req.priority || req.priority === "optional") {
		suggestions.push(
			"Review priority - should this really be optional? Consider required/critical.",
		);
	}

	return {
		id: req.id,
		type: "requirement",
		overall_quality: issues.length === 0 ? "good" : "needs_improvement",
		issues,
		suggestions,
		strengths,
		guide_reference: "See docs/REQUIREMENTS-GUIDE.md for detailed guidance",
	};
}

/**
 * Analyze a component against the 10-step reasoning process
 */
function analyzeComponent(comp: Component): AnalysisResult {
	const issues: string[] = [];
	const suggestions: string[] = [];
	const strengths: string[] = [];

	// Step 1: Single responsibility
	if (comp.capabilities && comp.capabilities.length > 5) {
		issues.push(
			`Component has ${comp.capabilities.length} capabilities - may violate single responsibility principle`,
		);
		suggestions.push("Consider breaking into smaller, focused components");
	} else if (comp.capabilities && comp.capabilities.length > 0) {
		strengths.push(`Defines ${comp.capabilities.length} capabilities`);
	}

	// Step 2: Clear description
	if (!comp.description || comp.description.length < 50) {
		issues.push(
			"Component description is too brief - should clearly explain purpose and role",
		);
		suggestions.push(
			"Add context: What does this component do? Why does it exist?",
		);
	} else {
		strengths.push("Has detailed description");
	}

	// Step 3: Type appropriateness
	if (
		comp.type === "library" &&
		comp.depends_on &&
		comp.depends_on.length > 3
	) {
		suggestions.push(
			"Libraries should have minimal dependencies - consider if this should be a service",
		);
	}

	// Step 4: Technology stack
	if (!comp.tech_stack || comp.tech_stack.length === 0) {
		issues.push("Missing tech stack definition");
		suggestions.push(
			"Define technologies used (e.g., language, framework, database)",
		);
	} else {
		strengths.push(`Tech stack defined: ${comp.tech_stack.join(", ")}`);
	}

	// Step 5: Dependencies
	const hasInternal = comp.depends_on && comp.depends_on.length > 0;
	const hasExternal =
		comp.external_dependencies && comp.external_dependencies.length > 0;

	if (!hasInternal && !hasExternal) {
		suggestions.push(
			"Consider documenting dependencies (internal components and external packages)",
		);
	}

	if (comp.depends_on && comp.depends_on.length > 10) {
		issues.push(
			`High coupling: depends on ${comp.depends_on.length} other components`,
		);
		suggestions.push("Consider introducing abstraction layers or facades");
	} else if (hasInternal) {
		strengths.push(`Depends on ${comp.depends_on!.length} internal components`);
	}

	// Step 6: Constraints
	if (!comp.constraints || comp.constraints.length === 0) {
		suggestions.push(
			"Document constraints (performance, security, compatibility requirements)",
		);
	} else {
		strengths.push(`Documents ${comp.constraints.length} constraints`);
	}

	// Step 7: Folder structure
	if (!comp.folder || comp.folder === ".") {
		suggestions.push("Specify folder location in repository");
	} else {
		strengths.push(`Located at: ${comp.folder}`);
	}

	// Step 8: Capabilities documentation
	if (comp.capabilities && comp.capabilities.length === 0) {
		suggestions.push("Define key capabilities - what can this component do?");
	}

	return {
		id: comp.id,
		type: comp.type,
		overall_quality: issues.length === 0 ? "good" : "needs_improvement",
		issues,
		suggestions,
		strengths,
		guide_reference: "See docs/COMPONENTS-GUIDE.md for detailed guidance",
	};
}

/**
 * Analyze a plan against the 12-step reasoning process
 */
function analyzePlan(plan: Plan): AnalysisResult {
	const issues: string[] = [];
	const suggestions: string[] = [];
	const strengths: string[] = [];

	// Step 1: Scope and description
	if (!plan.description || plan.description.length < 100) {
		issues.push(
			"Plan description is too brief - should explain scope, approach, and rationale",
		);
		suggestions.push(
			"Add context: What will be built? Why this approach? What's the scope?",
		);
	} else {
		strengths.push("Has detailed description");
	}

	// Step 2: Acceptance criteria
	if (!plan.acceptance_criteria || plan.acceptance_criteria.length < 50) {
		issues.push("Missing or insufficient acceptance criteria");
		suggestions.push(
			"Define clear completion criteria - how do we know when this is done?",
		);
	} else {
		strengths.push("Has acceptance criteria defined");
	}

	// Step 3: Tasks
	if (!plan.tasks || plan.tasks.length === 0) {
		issues.push("No tasks defined - plan must include implementation steps");
		suggestions.push("Break down the plan into concrete, actionable tasks");
	} else if (plan.tasks.length === 1) {
		suggestions.push(
			"Single task detected - consider breaking into smaller steps",
		);
	} else {
		strengths.push(`Includes ${plan.tasks.length} tasks`);

		// Task dependencies
		const tasksWithDeps = plan.tasks.filter(
			(t: Task) => t.depends_on && t.depends_on.length > 0,
		);
		if (tasksWithDeps.length === 0 && plan.tasks.length > 3) {
			issues.push(
				"No task dependencies defined - are all tasks truly independent?",
			);
			suggestions.push("Define task ordering and dependencies");
		} else if (tasksWithDeps.length > 0) {
			strengths.push(`${tasksWithDeps.length} tasks have dependencies defined`);
		}

		// Task considerations
		const tasksWithoutCriteria = plan.tasks.filter(
			(t: Task) => !t.considerations || t.considerations.length === 0,
		);
		if (tasksWithoutCriteria.length > plan.tasks.length * 0.5) {
			suggestions.push(
				`${tasksWithoutCriteria.length} tasks lack considerations - add 'what to think about' for each task`,
			);
		}
	}

	// Step 4: Test cases
	if (!plan.test_cases || plan.test_cases.length === 0) {
		suggestions.push(
			"Consider adding test_cases to define how this plan will be validated",
		);
	} else {
		strengths.push(`Includes ${plan.test_cases.length} test cases`);
	}

	// Step 5: Flows
	if (!plan.flows || plan.flows.length === 0) {
		suggestions.push(
			"Consider adding flows (user/system/data flows) to document interactions",
		);
	} else {
		strengths.push(`Documents ${plan.flows.length} flows`);
	}

	// Step 6: Traceability
	if (!plan.criteria_id) {
		suggestions.push("Link plan to requirement criteria_id for traceability");
	} else {
		strengths.push(`Linked to requirement criteria: ${plan.criteria_id}`);
	}

	if (plan.depends_on && plan.depends_on.length > 0) {
		strengths.push(`Traces to ${plan.depends_on.length} prerequisite plan(s)`);
	}

	// Step 7: Priority validation
	const criticalPlans = ["critical", "high"];
	if (!plan.priority || !criticalPlans.includes(plan.priority)) {
		suggestions.push(
			"Review priority - is this plan critical/high/medium/low priority?",
		);
	}

	// Step 8: Buffer check
	if (
		plan.tasks &&
		plan.tasks.length > 5 &&
		plan.description &&
		!plan.description.toLowerCase().includes("buffer")
	) {
		suggestions.push(
			"For plans with 5+ tasks, consider including buffer time (typically 20%) in estimates",
		);
	}

	return {
		id: plan.id,
		type: "plan",
		overall_quality: issues.length === 0 ? "good" : "needs_improvement",
		issues,
		suggestions,
		strengths,
		guide_reference: "See docs/PLANS-GUIDE.md for detailed guidance",
	};
}

/**
 * Register consolidated guidance tool
 */
export function registerGuidanceTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"guidance",
		{
			title: "Guidance",
			description:
				"Validate specifications against best practices: requirements (7-step), components (10-step), or plans (12-step)",
			inputSchema: {
				spec_type: SpecTypeSchema.describe("Type of specification to validate"),
				id: z.string().describe("The specification ID to validate"),
			},
		},
		wrapToolHandler(
			"guidance",
			async ({ spec_type, id }) => {
				const validatedId = context.inputValidator.validateId(id);

				let result: AnalysisResult;

				switch (spec_type) {
					case "requirement": {
						const reqResult = await operations.getRequirement(validatedId);
						if (!reqResult.success || !reqResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												reqResult.error ||
												`Requirement '${validatedId}' not found`,
										}),
									},
								],
								isError: true,
							};
						}
						result = analyzeRequirement(reqResult.data);
						break;
					}

					case "component": {
						const compResult = await operations.getComponent(validatedId);
						if (!compResult.success || !compResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												compResult.error ||
												`Component '${validatedId}' not found`,
										}),
									},
								],
								isError: true,
							};
						}
						result = analyzeComponent(compResult.data as Component);
						break;
					}

					case "plan": {
						const planResult = await operations.getPlan(validatedId);
						if (!planResult.success || !planResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												planResult.error || `Plan '${validatedId}' not found`,
										}),
									},
								],
								isError: true,
							};
						}
						result = analyzePlan(planResult.data);
						break;
					}
				}

				return formatResult({
					success: true,
					data: result,
				});
			},
			context,
		),
	);
}
