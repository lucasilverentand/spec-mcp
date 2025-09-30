import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// Input schemas for guidance tools (ZodRawShape format for MCP SDK)
const AnalyzeRequirementInputSchema = {
	id: z
		.string()
		.describe("The requirement ID to analyze (e.g., req-001-user-auth)"),
};

const AnalyzeComponentInputSchema = {
	id: z
		.string()
		.describe(
			"The component ID to analyze (e.g., app-001-dashboard, svc-002-api)",
		),
};

const AnalyzePlanInputSchema = {
	id: z
		.string()
		.describe("The plan ID to analyze (e.g., pln-001-implementation)"),
};

const ValidateSpecInputSchema = {
	type: z
		.enum(["requirement", "component", "plan"])
		.describe("Type of specification to validate"),
	id: z.string().describe("The specification ID to validate"),
};

// Zod object schemas for validation
const AnalyzeRequirementSchema = z.object(AnalyzeRequirementInputSchema);
const AnalyzeComponentSchema = z.object(AnalyzeComponentInputSchema);
const AnalyzePlanSchema = z.object(AnalyzePlanInputSchema);
const ValidateSpecSchema = z.object(ValidateSpecInputSchema);

/**
 * Analyze a requirement against the 7-step reasoning process
 */
function analyzeRequirement(req: any): any {
	const issues: string[] = [];
	const suggestions: string[] = [];
	const strengths: string[] = [];

	// Step 1: Problem identification
	if (
		!req.description ||
		req.description.length < 50 ||
		!req.description.includes("because") ||
		!req.description.includes("needed")
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

	// Step 6: Criteria linking to plans
	if (req.criteria && req.criteria.length > 0) {
		const unlinkedCriteria = req.criteria.filter((c: any) => !c.plan_id);
		if (unlinkedCriteria.length > 0) {
			suggestions.push(
				`${unlinkedCriteria.length} criteria not linked to plans - link them once plans are created`,
			);
		} else {
			strengths.push("All criteria linked to implementation plans");
		}
	}

	// Step 7: Priority validation
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
function analyzeComponent(comp: any): any {
	const issues: string[] = [];
	const suggestions: string[] = [];
	const strengths: string[] = [];

	// Step 1: Single Responsibility Check
	if (
		!comp.description ||
		comp.description.length < 100 ||
		!comp.description.includes("responsible for")
	) {
		issues.push(
			"Description should clearly state the component's single responsibility",
		);
		suggestions.push(
			'Add "responsible for" statement and explicitly state what it does NOT do',
		);
	} else {
		strengths.push("Has clear responsibility statement");
	}

	// Step 2: God component detection
	if (comp.capabilities && comp.capabilities.length > 8) {
		issues.push(
			`Component has ${comp.capabilities.length} capabilities - risk of being a 'God' component`,
		);
		suggestions.push(
			"Consider breaking into smaller, more focused components (aim for 3-6 capabilities)",
		);
	} else if (comp.capabilities && comp.capabilities.length > 0) {
		strengths.push(`Well-scoped with ${comp.capabilities.length} capabilities`);
	}

	// Step 3: Dependencies check
	if (!comp.depends_on || comp.depends_on.length === 0) {
		suggestions.push(
			"No dependencies listed - verify this component is truly independent",
		);
	} else if (comp.depends_on.length > 5) {
		issues.push(
			`High coupling: depends on ${comp.depends_on.length} other components`,
		);
		suggestions.push(
			"Consider reducing dependencies or introducing an abstraction layer",
		);
	} else {
		strengths.push(
			`Reasonable coupling with ${comp.depends_on.length} dependencies`,
		);
	}

	// Step 4: Circular dependency detection
	if (comp.depends_on && comp.depends_on.includes(comp.id)) {
		issues.push("Component depends on itself - circular dependency detected");
	}

	// Step 5: Tech stack validation
	if (!comp.tech_stack || comp.tech_stack.length === 0) {
		suggestions.push("Consider adding tech stack information for clarity");
	} else {
		strengths.push(
			`Tech stack defined: ${comp.tech_stack.slice(0, 3).join(", ")}`,
		);
	}

	// Step 6: Constraints check
	if (!comp.constraints || comp.constraints.length === 0) {
		suggestions.push(
			"Add constraints (performance, scalability, technical limitations)",
		);
	} else {
		strengths.push(`Has ${comp.constraints.length} constraints defined`);
	}

	// Step 7: Setup tasks
	if (!comp.setup_tasks || comp.setup_tasks.length === 0) {
		issues.push("Missing setup tasks - how is this component initialized?");
		suggestions.push(
			"Add setup tasks with file actions and dependency ordering",
		);
	} else {
		strengths.push(`Has ${comp.setup_tasks.length} setup tasks`);

		// Check task dependencies
		const tasksWithDeps = comp.setup_tasks.filter(
			(t: any) => t.depends_on && t.depends_on.length > 0,
		);
		if (tasksWithDeps.length === 0 && comp.setup_tasks.length > 1) {
			suggestions.push(
				"No task dependencies defined - ensure proper ordering is captured",
			);
		}
	}

	// Step 8: Type-specific validation
	if (comp.type === "service" && !comp.dev_port) {
		suggestions.push(
			"Services should specify dev_port for local development coordination",
		);
	}

	if (comp.type === "library" && !comp.package_name) {
		suggestions.push(
			"Libraries should specify package_name for distribution clarity",
		);
	}

	if (comp.type === "app" && !comp.deployment_targets) {
		suggestions.push(
			"Apps should specify deployment_targets (web, mobile, desktop, etc.)",
		);
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
function analyzePlan(plan: any): any {
	const issues: string[] = [];
	const suggestions: string[] = [];
	const strengths: string[] = [];

	// Step 1: Scope definition
	if (!plan.scope) {
		issues.push("Missing scope definition - what's in/out of scope?");
		suggestions.push(
			"Add scope object with in_scope, out_of_scope, boundaries, assumptions, constraints",
		);
	} else {
		strengths.push("Has scope definition");

		if (!plan.scope.assumptions || plan.scope.assumptions.length === 0) {
			suggestions.push(
				"Add assumptions - what are you assuming to be true for this plan?",
			);
		}

		if (!plan.scope.constraints || plan.scope.constraints.length === 0) {
			suggestions.push("Add constraints - what limitations affect this plan?");
		}
	}

	// Step 2: Acceptance criteria
	if (
		!plan.acceptance_criteria ||
		plan.acceptance_criteria.trim().length < 50
	) {
		issues.push(
			"Missing or insufficient acceptance criteria for the overall plan",
		);
		suggestions.push(
			"Define clear, measurable completion criteria for the entire plan",
		);
	} else {
		strengths.push("Has clear acceptance criteria");
	}

	// Step 3: Tasks validation
	if (!plan.tasks || plan.tasks.length === 0) {
		issues.push("No tasks defined - plan needs actionable work items");
	} else {
		strengths.push(`Contains ${plan.tasks.length} tasks`);

		// Check task size (description length as proxy)
		const largeTasks = plan.tasks.filter(
			(t: any) => t.description && t.description.length > 500,
		);
		if (largeTasks.length > 0) {
			suggestions.push(
				`${largeTasks.length} tasks have very detailed descriptions - consider breaking into smaller tasks`,
			);
		}

		// Check task priorities
		const withoutPriority = plan.tasks.filter(
			(t: any) => !t.priority || t.priority === "normal",
		);
		if (withoutPriority.length === plan.tasks.length) {
			suggestions.push(
				"All tasks have normal/no priority - identify critical path items",
			);
		}

		// Check task dependencies
		const tasksWithDeps = plan.tasks.filter(
			(t: any) => t.depends_on && t.depends_on.length > 0,
		);
		if (tasksWithDeps.length === 0 && plan.tasks.length > 3) {
			issues.push(
				"No task dependencies defined - are all tasks truly independent?",
			);
			suggestions.push("Define task ordering and dependencies");
		} else if (tasksWithDeps.length > 0) {
			strengths.push(`${tasksWithDeps.length} tasks have dependencies defined`);
		}

		// Check task acceptance criteria (considerations)
		const tasksWithoutCriteria = plan.tasks.filter(
			(t: any) => !t.considerations || t.considerations.length === 0,
		);
		if (tasksWithoutCriteria.length > plan.tasks.length * 0.5) {
			suggestions.push(
				`${tasksWithoutCriteria.length} tasks lack considerations - add 'what to think about' for each task`,
			);
		}

		// Check file actions
		const tasksWithFiles = plan.tasks.filter(
			(t: any) => t.files && t.files.length > 0,
		);
		if (tasksWithFiles.length === 0) {
			suggestions.push(
				"No file actions specified - add concrete file changes for implementation tasks",
			);
		} else {
			strengths.push(`${tasksWithFiles.length} tasks specify file actions`);
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

	// Step 8: Buffer check (heuristic)
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
 * Register all guidance and analysis tools
 */
export function registerGuidanceTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Analyze Requirement Tool
	server.registerTool(
		"analyze-requirement",
		{
			title: "Analyze Requirement",
			description:
				"Analyze a requirement specification against best practices from the 7-step Requirements Guide reasoning process. Identifies issues, provides suggestions, and highlights strengths. Checks for: clear problem statements, absence of implementation details, measurability, acceptance criteria quality, and traceability.",
			inputSchema: AnalyzeRequirementInputSchema,
		},
		wrapToolHandler(
			"analyze-requirement",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const requirement = await operations.getRequirement(validatedId);
				const analysis = analyzeRequirement(requirement);
				return formatResult(analysis);
			},
			context,
			AnalyzeRequirementSchema,
		),
	);

	// Analyze Component Tool
	server.registerTool(
		"analyze-component",
		{
			title: "Analyze Component",
			description:
				"Analyze a component specification against best practices from the 10-step Components Guide reasoning process. Identifies issues, provides suggestions, and highlights strengths. Checks for: single responsibility, appropriate coupling, clear dependencies, tech stack definition, constraints, setup tasks, and type-specific requirements.",
			inputSchema: AnalyzeComponentInputSchema,
		},
		wrapToolHandler(
			"analyze-component",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const component = await operations.getComponent(validatedId);
				const analysis = analyzeComponent(component);
				return formatResult(analysis);
			},
			context,
			AnalyzeComponentSchema,
		),
	);

	// Analyze Plan Tool
	server.registerTool(
		"analyze-plan",
		{
			title: "Analyze Plan",
			description:
				"Analyze a plan specification against best practices from the 12-step Plans Guide reasoning process. Identifies issues, provides suggestions, and highlights strengths. Checks for: scope definition, acceptance criteria, task breakdown, dependencies, file actions, test cases, flows, traceability, and appropriate buffer planning.",
			inputSchema: AnalyzePlanInputSchema,
		},
		wrapToolHandler(
			"analyze-plan",
			async ({ id }) => {
				const validatedId = context.inputValidator.validateId(id);
				const plan = await operations.getPlan(validatedId);
				const analysis = analyzePlan(plan);
				return formatResult(analysis);
			},
			context,
			AnalyzePlanSchema,
		),
	);

	// Validate Spec Tool (universal)
	server.registerTool(
		"validate-spec",
		{
			title: "Validate Specification",
			description:
				"Universal validation tool that routes to the appropriate analyzer (requirement, component, or plan) based on the specification type. Use this when you want to validate any specification against best practices and get actionable feedback.",
			inputSchema: ValidateSpecInputSchema,
		},
		wrapToolHandler(
			"validate-spec",
			async ({ type, id }) => {
				const validatedId = context.inputValidator.validateId(id);

				let spec: any;
				let analysis: any;

				switch (type) {
					case "requirement":
						spec = await operations.getRequirement(validatedId);
						analysis = analyzeRequirement(spec);
						break;
					case "component":
						spec = await operations.getComponent(validatedId);
						analysis = analyzeComponent(spec);
						break;
					case "plan":
						spec = await operations.getPlan(validatedId);
						analysis = analyzePlan(spec);
						break;
					default:
						throw new Error(`Unknown spec type: ${type}`);
				}

				return formatResult({
					...analysis,
					spec_type: type,
					validation_timestamp: new Date().toISOString(),
				});
			},
			context,
			ValidateSpecSchema,
		),
	);
}
