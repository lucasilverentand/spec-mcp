import type { StepDefinition } from "./types.js";

/**
 * Step definitions for Requirements (7 steps)
 */
export const REQUIREMENT_STEPS: StepDefinition[] = [
	{
		id: "problem_identification",
		order: 1,
		name: "Identify Problem",
		description: "Define the problem or opportunity",
		prompt:
			"What problem are we solving? What's the business value? Include rationale using 'because' or 'needed'.",
		required_fields: ["description"],
		next_step: "avoid_implementation",
	},
	{
		id: "avoid_implementation",
		order: 2,
		name: "Avoid Implementation Details",
		description: "Ensure requirement is implementation-agnostic",
		prompt:
			"Review the description to ensure no implementation details (like specific technologies, databases, or UI frameworks) are mentioned. Focus on WHAT, not HOW.",
		required_fields: ["description"],
		next_step: "measurability",
	},
	{
		id: "measurability",
		order: 3,
		name: "Define Measurability",
		description: "Add measurable success criteria",
		prompt:
			"Define 2-4 measurable acceptance criteria. Each should be specific, testable, and define what success looks like.",
		required_fields: ["criteria"],
		next_step: "specific_language",
	},
	{
		id: "specific_language",
		order: 4,
		name: "Use Specific Language",
		description: "Remove vague terms",
		prompt:
			"Review description and criteria for vague terms like 'fast', 'easy', 'simple'. Replace with specific, quantifiable language.",
		required_fields: ["description", "criteria"],
		next_step: "acceptance_criteria",
	},
	{
		id: "acceptance_criteria",
		order: 5,
		name: "Finalize Acceptance Criteria",
		description: "Ensure criteria are complete and testable",
		prompt:
			"Review acceptance criteria. Each should be: (1) Testable, (2) Independent, (3) Clear, (4) Achievable.",
		required_fields: ["criteria"],
		next_step: "priority_assignment",
	},
	{
		id: "priority_assignment",
		order: 6,
		name: "Assign Priority",
		description: "Set appropriate priority level",
		prompt:
			"Assign a priority: critical (must-have for launch), required (needed soon), ideal (nice to have), optional (future consideration).",
		required_fields: ["priority"],
		next_step: "review_and_refine",
	},
	{
		id: "review_and_refine",
		order: 7,
		name: "Review and Finalize",
		description: "Final validation before creation",
		prompt:
			"Final review: Ensure all fields are complete, description is clear, criteria are measurable, and priority is appropriate.",
		required_fields: ["slug", "name", "description", "priority", "criteria"],
		next_step: null,
	},
];

/**
 * Step definitions for Components (10 steps)
 */
export const COMPONENT_STEPS: StepDefinition[] = [
	{
		id: "analyze_requirements",
		order: 1,
		name: "Analyze Requirements",
		description: "Review which requirements this component satisfies",
		prompt:
			"Which requirements does this component satisfy? List the requirement IDs and explain how this component addresses them.",
		required_fields: ["description"],
		next_step: "define_boundaries",
	},
	{
		id: "define_boundaries",
		order: 2,
		name: "Define Boundaries",
		description: "Apply single responsibility principle",
		prompt:
			"Define clear boundaries: What is this component responsible for? What is NOT its responsibility?",
		required_fields: ["description"],
		next_step: "define_responsibilities",
	},
	{
		id: "define_responsibilities",
		order: 3,
		name: "Define Responsibilities",
		description: "List what the component does and doesn't do",
		prompt:
			"List specific responsibilities (capabilities) this component handles. Be clear about what it does AND what it delegates to other components.",
		required_fields: ["capabilities"],
		next_step: "define_interfaces",
	},
	{
		id: "define_interfaces",
		order: 4,
		name: "Define Interfaces",
		description: "Specify inputs, outputs, and contracts",
		prompt:
			"Define the component's interface: What inputs does it accept? What outputs does it produce? What contracts/APIs does it expose?",
		required_fields: ["description"],
		next_step: "map_dependencies",
	},
	{
		id: "map_dependencies",
		order: 5,
		name: "Map Dependencies",
		description: "Identify internal and external dependencies",
		prompt:
			"List dependencies: (1) Internal component dependencies (depends_on), (2) External/third-party dependencies (external_dependencies).",
		required_fields: ["depends_on", "external_dependencies"],
		next_step: "define_ownership",
	},
	{
		id: "define_ownership",
		order: 6,
		name: "Define Ownership",
		description: "Specify state management and data ownership",
		prompt:
			"Define ownership: What data does this component own? What state does it manage? What data does it borrow from other components?",
		required_fields: ["description"],
		next_step: "identify_patterns",
	},
	{
		id: "identify_patterns",
		order: 7,
		name: "Identify Patterns",
		description: "List architectural patterns used",
		prompt:
			"What architectural patterns does this component use? (e.g., Repository, Service, Factory, Observer, etc.)",
		required_fields: ["description"],
		next_step: "quality_attributes",
	},
	{
		id: "quality_attributes",
		order: 8,
		name: "Define Quality Attributes",
		description: "Specify performance, security, and testability requirements",
		prompt:
			"Define quality attributes: Performance requirements, security considerations, testability concerns, scalability needs.",
		required_fields: ["constraints"],
		next_step: "trace_requirements",
	},
	{
		id: "trace_requirements",
		order: 9,
		name: "Trace to Requirements",
		description: "Create traceability matrix",
		prompt:
			"Explicitly link this component back to requirement IDs. Ensure every capability traces to at least one requirement.",
		required_fields: ["description"],
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 10,
		name: "Validate and Refine",
		description: "Final validation before creation",
		prompt:
			"Final review: Ensure all fields are complete, boundaries are clear, dependencies are mapped, and traceability is established.",
		required_fields: [
			"type",
			"slug",
			"name",
			"description",
			"capabilities",
			"tech_stack",
		],
		next_step: null,
	},
];

/**
 * Step definitions for Plans (12 steps)
 */
export const PLAN_STEPS: StepDefinition[] = [
	{
		id: "review_context",
		order: 1,
		name: "Review Context",
		description: "Review requirements and components",
		prompt:
			"Review the acceptance criteria (criteria_id) you're fulfilling. What requirements and components are relevant to this plan?",
		required_fields: ["criteria_id", "description"],
		next_step: "identify_phases",
	},
	{
		id: "identify_phases",
		order: 2,
		name: "Identify Phases",
		description: "Break work into major phases",
		prompt:
			"Break this plan into 2-5 major phases (e.g., Setup, Core Implementation, Testing, Documentation).",
		required_fields: ["description"],
		next_step: "analyze_dependencies",
	},
	{
		id: "analyze_dependencies",
		order: 3,
		name: "Analyze Dependencies",
		description: "Create dependency graph and ordering",
		prompt:
			"List dependencies: What other plans must complete before this one? What tasks within this plan depend on each other?",
		required_fields: ["depends_on"],
		next_step: "break_down_tasks",
	},
	{
		id: "break_down_tasks",
		order: 4,
		name: "Break Down Tasks",
		description: "Create actionable tasks (0.5-3 days each)",
		prompt:
			"Break down work into specific tasks. Each task should be: 0.5-3 days of effort, independently testable, clearly described.",
		required_fields: ["tasks"],
		next_step: "estimate_effort",
	},
	{
		id: "estimate_effort",
		order: 5,
		name: "Estimate Effort",
		description: "Add effort estimates with buffer",
		prompt:
			"For each task, estimate effort in days. Add 20% buffer for unknowns. Be realistic.",
		required_fields: ["tasks"],
		next_step: "define_acceptance",
	},
	{
		id: "define_acceptance",
		order: 6,
		name: "Define Acceptance Criteria",
		description: "Add acceptance criteria per task",
		prompt:
			"For each task, define clear acceptance criteria. How will you know it's done?",
		required_fields: ["acceptance_criteria"],
		next_step: "identify_milestones",
	},
	{
		id: "identify_milestones",
		order: 7,
		name: "Identify Milestones",
		description: "Define major checkpoints",
		prompt:
			"Identify 2-4 major milestones. These are deliverable checkpoints where stakeholders can review progress.",
		required_fields: ["description"],
		next_step: "plan_testing",
	},
	{
		id: "plan_testing",
		order: 8,
		name: "Plan Testing Strategy",
		description: "Define how work will be tested",
		prompt:
			"Define testing strategy: Unit tests, integration tests, E2E tests. Aim for 90%+ coverage.",
		required_fields: ["description"],
		next_step: "plan_risks",
	},
	{
		id: "plan_risks",
		order: 9,
		name: "Plan for Risks",
		description: "Identify risks and mitigation strategies",
		prompt:
			"Identify 2-5 key risks and how you'll mitigate them. What could go wrong? How will you handle it?",
		required_fields: ["description"],
		next_step: "create_timeline",
	},
	{
		id: "create_timeline",
		order: 10,
		name: "Create Timeline",
		description: "Build schedule and critical path",
		prompt:
			"Create a timeline: When will each phase complete? What's the critical path? When's the target completion date?",
		required_fields: ["description"],
		next_step: "trace_specs",
	},
	{
		id: "trace_specs",
		order: 11,
		name: "Trace to Specs",
		description: "Link to requirements and components",
		prompt:
			"Explicitly link tasks to requirement IDs and component IDs. Ensure full traceability.",
		required_fields: ["description"],
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 12,
		name: "Validate and Refine",
		description: "Final validation with 20% buffer check",
		prompt:
			"Final review: All tasks defined? Dependencies mapped? 20% buffer included? Traceability complete?",
		required_fields: [
			"slug",
			"name",
			"description",
			"criteria_id",
			"acceptance_criteria",
			"tasks",
		],
		next_step: null,
	},
];

/**
 * Step definitions for Constitutions (3 steps)
 */
export const CONSTITUTION_STEPS: StepDefinition[] = [
	{
		id: "basic_info",
		order: 1,
		name: "Basic Information",
		description: "Provide basic constitution information",
		prompt:
			"Provide a name and description for this constitution. What principles will it govern?",
		required_fields: ["name", "description"],
		next_step: "articles",
	},
	{
		id: "articles",
		order: 2,
		name: "Define Articles",
		description: "Create the core principles/articles",
		prompt:
			"Define articles (core principles). Each article needs: title, principle, rationale, examples (optional), exceptions (optional), and status (needs-review/active/archived).",
		required_fields: ["articles"],
		next_step: "finalize",
	},
	{
		id: "finalize",
		order: 3,
		name: "Finalize",
		description: "Review and create the constitution",
		prompt: "Review the constitution details and confirm creation.",
		required_fields: ["name"],
		next_step: null,
	},
];

/**
 * Step definitions for Decisions (6 steps)
 */
export const DECISION_STEPS: StepDefinition[] = [
	{
		id: "basic_info",
		order: 1,
		name: "Basic Information",
		description: "Provide basic decision information",
		prompt:
			"Provide a name and brief description summarizing what this decision is about.",
		required_fields: ["name", "description"],
		next_step: "decision_statement",
	},
	{
		id: "decision_statement",
		order: 2,
		name: "Decision Statement",
		description: "State what was decided",
		prompt:
			"Provide a clear statement of what was decided (20-500 characters).",
		required_fields: ["decision"],
		next_step: "context",
	},
	{
		id: "context",
		order: 3,
		name: "Context",
		description: "Explain the situation that prompted this decision",
		prompt:
			"Describe the situation or problem that prompted this decision (20-1000 characters).",
		required_fields: ["context"],
		next_step: "alternatives_and_consequences",
	},
	{
		id: "alternatives_and_consequences",
		order: 4,
		name: "Alternatives and Consequences",
		description: "Document alternatives considered and consequences",
		prompt:
			"List alternatives considered (array), and define consequences (positive, negative, risks, mitigation - all arrays).",
		required_fields: ["alternatives", "consequences"],
		next_step: "relationships",
	},
	{
		id: "relationships",
		order: 5,
		name: "Relationships",
		description: "Link to affected entities and informing articles",
		prompt:
			"Specify: affects_components (array of component IDs), affects_requirements (array of requirement IDs), affects_plans (array of plan IDs), informed_by_articles (array of article references like 'con-001-slug/art-001'), and optionally supersedes (decision ID this replaces).",
		required_fields: [],
		next_step: "finalize",
	},
	{
		id: "finalize",
		order: 6,
		name: "Finalize",
		description: "Review and create the decision",
		prompt: "Review the decision details and confirm creation.",
		required_fields: ["name"],
		next_step: null,
	},
];

/**
 * Get step definitions for a spec type
 */
export function getStepDefinitions(
	type: "requirement" | "component" | "plan" | "constitution" | "decision",
): StepDefinition[] {
	switch (type) {
		case "requirement":
			return REQUIREMENT_STEPS;
		case "component":
			return COMPONENT_STEPS;
		case "plan":
			return PLAN_STEPS;
		case "constitution":
			return CONSTITUTION_STEPS;
		case "decision":
			return DECISION_STEPS;
	}
}
