/**
 * Validation rule for a step
 */
export interface ValidationRule {
	type: "min_length" | "max_length" | "contains_rationale" | "no_implementation" | "required" | "pattern";
	field?: string;
	value?: number | string | string[];
	keywords?: string[];
	pattern?: RegExp;
	message?: string;
}

/**
 * Definition for a single step in the wizard
 */
export interface StepDefinition {
	id: string;
	order: number;
	name: string;
	description: string;
	prompt: string;
	required_fields: string[];
	validation_rules: ValidationRule[];
	next_step: string | null;
}

/**
 * Requirement creation steps (7 steps)
 */
export const REQUIREMENT_STEPS: StepDefinition[] = [
	{
		id: "problem_identification",
		order: 1,
		name: "Identify Problem",
		description: "Define the problem or opportunity this requirement addresses",
		prompt:
			"What problem are we solving? What's the business value? Include rationale using 'because' or 'needed' to explain why this is important.",
		required_fields: ["description"],
		validation_rules: [
			{
				type: "min_length",
				field: "description",
				value: 50,
				message: "Description should be at least 50 characters",
			},
			{
				type: "contains_rationale",
				field: "description",
				keywords: ["because", "needed", "why", "to enable", "so that"],
				message: "Description should include rationale (because, needed, why, etc.)",
			},
		],
		next_step: "avoid_implementation",
	},
	{
		id: "avoid_implementation",
		order: 2,
		name: "Ensure Implementation-Agnostic",
		description: "Verify no implementation details are present",
		prompt:
			"Review the description to ensure it focuses on WHAT is needed, not HOW to implement it. Remove any technology-specific details, architecture decisions, or implementation approaches.",
		required_fields: [],
		validation_rules: [
			{
				type: "no_implementation",
				field: "description",
				keywords: [
					"using",
					"implement",
					"database",
					"API",
					"frontend",
					"backend",
					"class",
					"function",
					"method",
					"service",
					"component",
					"React",
					"Vue",
					"Angular",
					"Node",
					"Python",
					"Java",
				],
				message: "Description should not contain implementation details",
			},
		],
		next_step: "measurability",
	},
	{
		id: "measurability",
		order: 3,
		name: "Add Measurable Criteria",
		description: "Define measurable acceptance criteria",
		prompt:
			"What measurable criteria will determine when this requirement is satisfied? Define 2-4 specific, testable acceptance criteria. Each should be verifiable and unambiguous.",
		required_fields: ["criteria"],
		validation_rules: [
			{
				type: "required",
				field: "criteria",
				message: "At least one acceptance criterion is required",
			},
		],
		next_step: "specific_language",
	},
	{
		id: "specific_language",
		order: 4,
		name: "Use Specific Language",
		description: "Replace vague terms with specific, measurable language",
		prompt:
			"Review all text for vague terms like 'user-friendly', 'fast', 'easy', 'simple', 'intuitive'. Replace with specific, measurable criteria. For example: 'fast' → 'responds within 200ms', 'easy' → 'requires fewer than 3 clicks'.",
		required_fields: [],
		validation_rules: [
			{
				type: "pattern",
				field: "description",
				pattern: /(user-friendly|fast|easy|simple|intuitive|efficient|flexible)/i,
				message:
					"Consider replacing vague terms with specific, measurable criteria",
			},
		],
		next_step: "acceptance_criteria",
	},
	{
		id: "acceptance_criteria",
		order: 5,
		name: "Finalize Acceptance Criteria",
		description: "Ensure 2-4 clear, testable acceptance criteria",
		prompt:
			"Review and finalize acceptance criteria. Ensure you have 2-4 criteria that are:\n- Specific and unambiguous\n- Testable and verifiable\n- Independent of implementation\n- Clearly linked to the requirement",
		required_fields: ["criteria"],
		validation_rules: [
			{
				type: "required",
				field: "criteria",
				message: "2-4 acceptance criteria are required",
			},
		],
		next_step: "priority_assignment",
	},
	{
		id: "priority_assignment",
		order: 6,
		name: "Assign Priority",
		description: "Set appropriate priority level",
		prompt:
			"Assign priority based on impact and urgency:\n- critical: System cannot function without this\n- required: Core functionality needed for launch\n- ideal: Enhances value but not required for launch\n- optional: Nice to have, can be deferred",
		required_fields: ["priority"],
		validation_rules: [
			{
				type: "required",
				field: "priority",
				message: "Priority must be set",
			},
		],
		next_step: "review_and_refine",
	},
	{
		id: "review_and_refine",
		order: 7,
		name: "Review and Finalize",
		description: "Final review before creating requirement",
		prompt:
			"Final review:\n- Does description clearly state WHAT (not HOW)?\n- Is rationale included?\n- Are acceptance criteria specific and testable?\n- Is language concrete (no vague terms)?\n- Is priority appropriate?\n\nMake any final refinements before finalizing.",
		required_fields: ["slug", "name", "description", "priority", "criteria"],
		validation_rules: [
			{
				type: "required",
				field: "slug",
				message: "Slug is required",
			},
			{
				type: "required",
				field: "name",
				message: "Name is required",
			},
		],
		next_step: null, // Final step
	},
];

/**
 * Component creation steps (10 steps)
 */
export const COMPONENT_STEPS: StepDefinition[] = [
	{
		id: "analyze_requirements",
		order: 1,
		name: "Analyze Requirements",
		description: "Review which requirements this component satisfies",
		prompt:
			"Which requirements does this component satisfy? List the requirement IDs and explain how this component addresses them. This ensures proper traceability.",
		required_fields: ["description"],
		validation_rules: [
			{
				type: "min_length",
				field: "description",
				value: 50,
				message: "Description should explain how this addresses requirements",
			},
		],
		next_step: "define_boundaries",
	},
	{
		id: "define_boundaries",
		order: 2,
		name: "Define Boundaries",
		description: "Apply single responsibility principle",
		prompt:
			"What is the single, clear responsibility of this component? Define its boundaries - what it DOES and what it DOES NOT do. Each component should have one primary purpose.",
		required_fields: [],
		validation_rules: [],
		next_step: "define_responsibilities",
	},
	{
		id: "define_responsibilities",
		order: 3,
		name: "Define Responsibilities",
		description: "List specific capabilities this component provides",
		prompt:
			"What specific capabilities does this component provide? List 3-7 concrete functionalities. Be specific about what services or features it offers.",
		required_fields: ["capabilities"],
		validation_rules: [
			{
				type: "required",
				field: "capabilities",
				message: "At least one capability is required",
			},
		],
		next_step: "define_interfaces",
	},
	{
		id: "define_interfaces",
		order: 4,
		name: "Define Interfaces",
		description: "Specify inputs, outputs, and contracts",
		prompt:
			"What are the key interfaces? Consider:\n- What data/events does it consume? (inputs)\n- What data/events does it produce? (outputs)\n- What contracts/protocols does it expose?\n\nAdd this information to the description.",
		required_fields: [],
		validation_rules: [],
		next_step: "map_dependencies",
	},
	{
		id: "map_dependencies",
		order: 5,
		name: "Map Dependencies",
		description: "Identify internal and external dependencies",
		prompt:
			"What are this component's dependencies?\n- Internal: Other components in this system (use component IDs)\n- External: Third-party services, libraries, APIs\n\nList them clearly to understand the dependency graph.",
		required_fields: [],
		validation_rules: [],
		next_step: "define_ownership",
	},
	{
		id: "define_ownership",
		order: 6,
		name: "Define Ownership",
		description: "Specify state management and data ownership",
		prompt:
			"What state does this component own? What data is it responsible for managing? Clarify ownership to prevent conflicts and ensure clear responsibilities.",
		required_fields: [],
		validation_rules: [],
		next_step: "identify_patterns",
	},
	{
		id: "identify_patterns",
		order: 7,
		name: "Identify Patterns",
		description: "Document architectural patterns used",
		prompt:
			"What architectural patterns does this component follow? Examples:\n- Repository pattern\n- Observer pattern\n- Factory pattern\n- Microservice\n- API Gateway\n- Event-driven\n\nAdd relevant patterns to the description.",
		required_fields: [],
		validation_rules: [],
		next_step: "quality_attributes",
	},
	{
		id: "quality_attributes",
		order: 8,
		name: "Quality Attributes",
		description: "Define performance, security, testability requirements",
		prompt:
			"What are the quality attributes and constraints?\n- Performance requirements\n- Security considerations\n- Scalability needs\n- Testability requirements\n- Other technical constraints\n\nList important constraints.",
		required_fields: ["constraints"],
		validation_rules: [],
		next_step: "trace_requirements",
	},
	{
		id: "trace_requirements",
		order: 9,
		name: "Trace Requirements",
		description: "Link to specific requirements",
		prompt:
			"Verify traceability: List the specific requirement IDs this component implements. Update the description to reference them (e.g., 'Implements REQ-001, REQ-003').",
		required_fields: [],
		validation_rules: [],
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 10,
		name: "Validate and Refine",
		description: "Final validation before creating component",
		prompt:
			"Final review:\n- Single clear responsibility? ✓\n- Capabilities well-defined? ✓\n- Dependencies mapped? ✓\n- Requirements traced? ✓\n- Constraints documented? ✓\n\nProvide slug, name, and make final refinements.",
		required_fields: ["slug", "name", "description", "type"],
		validation_rules: [
			{
				type: "required",
				field: "slug",
				message: "Slug is required",
			},
			{
				type: "required",
				field: "name",
				message: "Name is required",
			},
			{
				type: "required",
				field: "type",
				message: "Component type is required",
			},
		],
		next_step: null,
	},
];

/**
 * Plan creation steps (12 steps)
 */
export const PLAN_STEPS: StepDefinition[] = [
	{
		id: "review_context",
		order: 1,
		name: "Review Context",
		description: "Review requirements and components",
		prompt:
			"Which acceptance criteria does this plan fulfill? (criteria_id)\nReview related requirements and components to understand the full context.",
		required_fields: ["criteria_id"],
		validation_rules: [
			{
				type: "required",
				field: "criteria_id",
				message:
					"Plans must be linked to an acceptance criteria (criteria_id)",
			},
		],
		next_step: "identify_phases",
	},
	{
		id: "identify_phases",
		order: 2,
		name: "Identify Phases",
		description: "Break work into major phases",
		prompt:
			"What are the major phases of this implementation? Break the work into 2-5 high-level phases (e.g., Setup, Core Implementation, Testing, Documentation).",
		required_fields: [],
		validation_rules: [],
		next_step: "analyze_dependencies",
	},
	{
		id: "analyze_dependencies",
		order: 3,
		name: "Analyze Dependencies",
		description: "Map dependency graph and ordering",
		prompt:
			"What are the dependencies between work items?\n- What must be completed first?\n- What can be done in parallel?\n- What depends on external factors?\n\nMap out the dependency graph.",
		required_fields: [],
		validation_rules: [],
		next_step: "break_down_tasks",
	},
	{
		id: "break_down_tasks",
		order: 4,
		name: "Break Down Tasks",
		description: "Create actionable tasks (0.5-3 days each)",
		prompt:
			"Break work into specific, actionable tasks. Each task should:\n- Take 0.5-3 days\n- Have a clear deliverable\n- Be independently testable\n- Have clear acceptance criteria",
		required_fields: ["tasks"],
		validation_rules: [
			{
				type: "required",
				field: "tasks",
				message: "At least one task is required",
			},
		],
		next_step: "estimate_effort",
	},
	{
		id: "estimate_effort",
		order: 5,
		name: "Estimate Effort",
		description: "Add effort estimates with buffer",
		prompt:
			"Estimate effort for each task in days. Include:\n- Optimistic estimate\n- Realistic estimate\n- Pessimistic estimate\n\nSum estimates and add 20% buffer for unknowns.",
		required_fields: [],
		validation_rules: [],
		next_step: "define_acceptance",
	},
	{
		id: "define_acceptance",
		order: 6,
		name: "Define Acceptance",
		description: "Acceptance criteria for the plan",
		prompt:
			"What conditions must be met for this plan to be considered complete? Define clear, testable acceptance criteria for the entire plan.",
		required_fields: ["acceptance_criteria"],
		validation_rules: [
			{
				type: "required",
				field: "acceptance_criteria",
				message: "Acceptance criteria is required",
			},
		],
		next_step: "identify_milestones",
	},
	{
		id: "identify_milestones",
		order: 7,
		name: "Identify Milestones",
		description: "Define major checkpoints",
		prompt:
			"What are the key milestones? Identify 2-4 major checkpoints that represent significant progress. Each milestone should have concrete deliverables.",
		required_fields: [],
		validation_rules: [],
		next_step: "plan_testing",
	},
	{
		id: "plan_testing",
		order: 8,
		name: "Plan Testing",
		description: "Define testing strategy",
		prompt:
			"What is the testing strategy?\n- Unit tests needed?\n- Integration tests?\n- E2E tests?\n- Manual testing?\n\nDefine test cases for critical paths.",
		required_fields: [],
		validation_rules: [],
		next_step: "plan_risks",
	},
	{
		id: "plan_risks",
		order: 9,
		name: "Plan Risks",
		description: "Identify risks and mitigation",
		prompt:
			"What are the risks?\n- Technical risks (unknowns, complexity)\n- Dependency risks (external services, teams)\n- Timeline risks (estimates, scope creep)\n\nFor each risk, define mitigation strategies.",
		required_fields: [],
		validation_rules: [],
		next_step: "create_timeline",
	},
	{
		id: "create_timeline",
		order: 10,
		name: "Create Timeline",
		description: "Build schedule with critical path",
		prompt:
			"Create a timeline:\n- When can each task start?\n- What's the critical path?\n- What's the total duration (with 20% buffer)?\n- When are milestones reached?",
		required_fields: [],
		validation_rules: [],
		next_step: "trace_specs",
	},
	{
		id: "trace_specs",
		order: 11,
		name: "Trace Specifications",
		description: "Link to requirements and components",
		prompt:
			"Verify traceability:\n- Which requirement does this plan fulfill?\n- Which components does it involve?\n- Is criteria_id properly set?\n\nEnsure all links are correct.",
		required_fields: ["criteria_id"],
		validation_rules: [
			{
				type: "required",
				field: "criteria_id",
				message: "criteria_id must be set for traceability",
			},
		],
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 12,
		name: "Validate and Refine",
		description: "Final validation (20% buffer check)",
		prompt:
			"Final checklist:\n- ✓ Linked to acceptance criteria?\n- ✓ Tasks are 0.5-3 days each?\n- ✓ Dependencies mapped?\n- ✓ 20% time buffer included?\n- ✓ Testing strategy defined?\n- ✓ Risks identified?\n\nProvide slug, name, priority and finalize.",
		required_fields: [
			"slug",
			"name",
			"description",
			"criteria_id",
			"acceptance_criteria",
		],
		validation_rules: [
			{
				type: "required",
				field: "slug",
				message: "Slug is required",
			},
			{
				type: "required",
				field: "name",
				message: "Name is required",
			},
		],
		next_step: null,
	},
];

/**
 * Get step definitions for a spec type
 */
export function getStepsForType(
	type: "requirement" | "component" | "plan",
): StepDefinition[] {
	switch (type) {
		case "requirement":
			return REQUIREMENT_STEPS;
		case "component":
			return COMPONENT_STEPS;
		case "plan":
			return PLAN_STEPS;
	}
}

/**
 * Get a specific step by ID and type
 */
export function getStep(
	type: "requirement" | "component" | "plan",
	stepId: string,
): StepDefinition | undefined {
	const steps = getStepsForType(type);
	return steps.find((s) => s.id === stepId);
}

/**
 * Get step by order number
 */
export function getStepByOrder(
	type: "requirement" | "component" | "plan",
	order: number,
): StepDefinition | undefined {
	const steps = getStepsForType(type);
	return steps.find((s) => s.order === order);
}
