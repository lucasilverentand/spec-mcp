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
		question:
			"What problem are we solving and why is it important?",
		guidance:
			"Explain the problem or opportunity this requirement addresses. Include the business value and rationale using words like 'because', 'needed', or 'so that'.",
		next_step: "avoid_implementation",
	},
	{
		id: "avoid_implementation",
		order: 2,
		name: "Avoid Implementation Details",
		description: "Ensure requirement is implementation-agnostic",
		question:
			"What needs to happen, without specifying how it should be implemented?",
		guidance:
			"Describe WHAT the system should do, not HOW it should do it. Avoid mentioning specific technologies, databases, frameworks, or UI components. Focus on outcomes and behavior.",
		next_step: "measurability",
	},
	{
		id: "measurability",
		order: 3,
		name: "Define Measurability",
		description: "Add measurable success criteria",
		question:
			"How will you know when this requirement is successfully met?",
		guidance:
			"Define 2-4 measurable acceptance criteria. Each should be specific, testable, and clearly define what success looks like. Use concrete metrics where possible.",
		next_step: "specific_language",
	},
	{
		id: "specific_language",
		order: 4,
		name: "Use Specific Language",
		description: "Remove vague terms",
		question:
			"Can you make the description and criteria more specific and quantifiable?",
		guidance:
			"Replace vague terms like 'fast', 'easy', 'simple', 'good' with specific, measurable language. For example: instead of 'fast', use 'completes in under 2 seconds'; instead of 'easy', use 'requires no more than 3 clicks'.",
		next_step: "acceptance_criteria",
	},
	{
		id: "acceptance_criteria",
		order: 5,
		name: "Finalize Acceptance Criteria",
		description: "Ensure criteria are complete and testable",
		question:
			"Are all acceptance criteria testable, independent, clear, and achievable?",
		guidance:
			"Review each acceptance criterion to ensure it is: (1) Testable - can be verified objectively, (2) Independent - doesn't depend on other criteria, (3) Clear - unambiguous, (4) Achievable - realistic to implement.",
		next_step: "priority_assignment",
	},
	{
		id: "priority_assignment",
		order: 6,
		name: "Assign Priority",
		description: "Set appropriate priority level",
		question:
			"What is the priority of this requirement?",
		guidance:
			"Choose a priority level: 'critical' (must-have for launch), 'required' (needed soon after launch), 'ideal' (nice to have), 'optional' (future consideration). Consider business value and urgency.",
		next_step: "review_and_refine",
	},
	{
		id: "review_and_refine",
		order: 7,
		name: "Review and Finalize",
		description: "Final review before creation",
		question:
			"Ready to create this requirement? Let's do a final review.",
		guidance:
			"This is the final step. Review all the information you've provided to ensure it's complete and accurate. Make any final adjustments needed.",
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
		question:
			"Which requirements does this component satisfy and how?",
		guidance:
			"List the requirement IDs and explain how this component addresses them. Describe the connection between requirements and this component's purpose.",
		next_step: "define_boundaries",
	},
	{
		id: "define_boundaries",
		order: 2,
		name: "Define Boundaries",
		description: "Apply single responsibility principle",
		question:
			"What is this component responsible for, and what is NOT its responsibility?",
		guidance:
			"Define clear boundaries using the single responsibility principle. Be explicit about what this component handles AND what it delegates to other components.",
		next_step: "define_responsibilities",
	},
	{
		id: "define_responsibilities",
		order: 3,
		name: "Define Responsibilities",
		description: "List what the component does and doesn't do",
		question:
			"What specific capabilities does this component provide?",
		guidance:
			"List the specific responsibilities or capabilities this component handles. For each capability, be clear about whether it's handled directly or delegated.",
		next_step: "define_interfaces",
	},
	{
		id: "define_interfaces",
		order: 4,
		name: "Define Interfaces",
		description: "Specify inputs, outputs, and contracts",
		question:
			"What are this component's inputs, outputs, and contracts?",
		guidance:
			"Describe the component's interface: What inputs does it accept? What outputs does it produce? What APIs or contracts does it expose? Include data formats and protocols.",
		next_step: "map_dependencies",
	},
	{
		id: "map_dependencies",
		order: 5,
		name: "Map Dependencies",
		description: "Identify internal and external dependencies",
		question:
			"What does this component depend on?",
		guidance:
			"List both internal dependencies (other components in your system) and external dependencies (third-party libraries, services, databases). Be specific about versions where applicable.",
		next_step: "define_ownership",
	},
	{
		id: "define_ownership",
		order: 6,
		name: "Define Ownership",
		description: "Specify state management and data ownership",
		question:
			"What data and state does this component own versus borrow?",
		guidance:
			"Define data ownership clearly: What data does this component create and manage? What state is it responsible for? What data does it access from other components?",
		next_step: "identify_patterns",
	},
	{
		id: "identify_patterns",
		order: 7,
		name: "Identify Patterns",
		description: "List architectural patterns used",
		question:
			"What architectural patterns does this component use?",
		guidance:
			"List the architectural patterns employed (e.g., Repository, Service, Factory, Observer, Singleton, Strategy). Explain why each pattern was chosen.",
		next_step: "quality_attributes",
	},
	{
		id: "quality_attributes",
		order: 8,
		name: "Define Quality Attributes",
		description: "Specify performance, security, and testability requirements",
		question:
			"What are the quality requirements for this component?",
		guidance:
			"Define quality attributes: Performance targets (response time, throughput), security requirements, testability needs, scalability goals, reliability expectations.",
		next_step: "trace_requirements",
	},
	{
		id: "trace_requirements",
		order: 9,
		name: "Trace to Requirements",
		description: "Create traceability matrix",
		question:
			"How do the capabilities trace back to requirements?",
		guidance:
			"Create a traceability map linking each capability to the requirement(s) it satisfies. Ensure complete coverage - every capability should trace to at least one requirement.",
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 10,
		name: "Validate and Refine",
		description: "Final review before creation",
		question:
			"Ready to create this component? Let's do a final review.",
		guidance:
			"This is the final step. Review everything: boundaries are clear, dependencies are mapped, capabilities are defined, quality attributes are specified, and traceability is complete.",
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
		question:
			"What acceptance criteria are you fulfilling and what's the context?",
		guidance:
			"Identify the acceptance criteria this plan addresses. Explain which requirements and components are relevant to this plan and how they relate.",
		next_step: "identify_phases",
	},
	{
		id: "identify_phases",
		order: 2,
		name: "Identify Phases",
		description: "Break work into major phases",
		question:
			"What are the major phases of work for this plan?",
		guidance:
			"Break the plan into 2-5 major phases (e.g., Setup, Core Implementation, Testing, Documentation). Describe what each phase accomplishes.",
		next_step: "analyze_dependencies",
	},
	{
		id: "analyze_dependencies",
		order: 3,
		name: "Analyze Dependencies",
		description: "Create dependency graph and ordering",
		question:
			"What dependencies exist for this plan?",
		guidance:
			"List what other plans must complete before this one starts. Also consider task dependencies within this plan - which tasks must happen before others?",
		next_step: "break_down_tasks",
	},
	{
		id: "break_down_tasks",
		order: 4,
		name: "Break Down Tasks",
		description: "Create actionable tasks (0.5-3 days each)",
		question:
			"What specific tasks need to be completed?",
		guidance:
			"Break down the work into specific, actionable tasks. Each task should be: 0.5-3 days of effort, independently testable, and clearly described. Provide task IDs and descriptions.",
		next_step: "estimate_effort",
	},
	{
		id: "estimate_effort",
		order: 5,
		name: "Estimate Effort",
		description: "Add effort estimates with buffer",
		question:
			"How much effort will each task require?",
		guidance:
			"Estimate effort for each task in days. Be realistic and add a 20% buffer for unknowns. Consider complexity, uncertainty, and team experience.",
		next_step: "define_acceptance",
	},
	{
		id: "define_acceptance",
		order: 6,
		name: "Define Acceptance Criteria",
		description: "Add acceptance criteria for the plan",
		question:
			"How will you know when this plan is complete?",
		guidance:
			"Define clear acceptance criteria for the overall plan. What conditions must be met to consider this plan done? Be specific and measurable.",
		next_step: "identify_milestones",
	},
	{
		id: "identify_milestones",
		order: 7,
		name: "Identify Milestones",
		description: "Define major checkpoints",
		question:
			"What are the major milestones for this plan?",
		guidance:
			"Identify 2-4 major milestones - deliverable checkpoints where stakeholders can review progress. Each milestone should represent a meaningful accomplishment.",
		next_step: "plan_testing",
	},
	{
		id: "plan_testing",
		order: 8,
		name: "Plan Testing Strategy",
		description: "Define how work will be tested",
		question:
			"How will you test the work in this plan?",
		guidance:
			"Define your testing strategy: unit tests, integration tests, E2E tests. Specify coverage goals (aim for 90%+) and testing approach for each type.",
		next_step: "plan_risks",
	},
	{
		id: "plan_risks",
		order: 9,
		name: "Plan for Risks",
		description: "Identify risks and mitigation strategies",
		question:
			"What risks could impact this plan and how will you mitigate them?",
		guidance:
			"Identify 2-5 key risks: technical challenges, dependencies, resource constraints, etc. For each risk, describe mitigation strategies.",
		next_step: "create_timeline",
	},
	{
		id: "create_timeline",
		order: 10,
		name: "Create Timeline",
		description: "Build schedule and critical path",
		question:
			"What's the timeline for this plan?",
		guidance:
			"Create a timeline: when will each phase complete? What's the critical path (longest sequence of dependent tasks)? What's the target completion date?",
		next_step: "trace_specs",
	},
	{
		id: "trace_specs",
		order: 11,
		name: "Trace to Specs",
		description: "Link to requirements and components",
		question:
			"How do the tasks trace to requirements and components?",
		guidance:
			"Link each task to requirement IDs and component IDs. Ensure full traceability - every task should support at least one requirement or component.",
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 12,
		name: "Validate and Refine",
		description: "Final review before creation",
		question:
			"Ready to create this plan? Let's do a final review.",
		guidance:
			"This is the final step. Verify: all tasks are defined, dependencies are mapped, 20% buffer is included in estimates, traceability is complete.",
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
		question:
			"What is this constitution about and what will it govern?",
		guidance:
			"Provide a name and description for this constitution. Explain what principles it will establish and what aspects of development it will govern.",
		next_step: "articles",
	},
	{
		id: "articles",
		order: 2,
		name: "Define Articles",
		description: "Create the core principles/articles",
		question:
			"What are the core principles or articles of this constitution?",
		guidance:
			"Define the articles (core principles) that make up this constitution. For each article, include: title, the principle itself, rationale explaining why it exists, optional examples demonstrating it, optional exceptions where it doesn't apply, and status (needs-review, active, or archived).",
		next_step: "finalize",
	},
	{
		id: "finalize",
		order: 3,
		name: "Finalize",
		description: "Review and create the constitution",
		question:
			"Ready to create this constitution? Let's do a final review.",
		guidance:
			"This is the final step. Review the constitution name, description, and all articles to ensure they're complete and accurate.",
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
		question:
			"What is this decision about?",
		guidance:
			"Provide a name and brief description summarizing what this decision addresses. Keep it concise but informative.",
		next_step: "decision_statement",
	},
	{
		id: "decision_statement",
		order: 2,
		name: "Decision Statement",
		description: "State what was decided",
		question:
			"What exactly was decided?",
		guidance:
			"State clearly and concisely what was decided. This should be 20-500 characters - specific enough to be actionable but concise enough to be memorable.",
		next_step: "context",
	},
	{
		id: "context",
		order: 3,
		name: "Context",
		description: "Explain the situation that prompted this decision",
		question:
			"What situation or problem led to this decision?",
		guidance:
			"Describe the context that prompted this decision. Explain the problem, opportunity, or situation that needed to be addressed (20-1000 characters).",
		next_step: "alternatives_and_consequences",
	},
	{
		id: "alternatives_and_consequences",
		order: 4,
		name: "Alternatives and Consequences",
		description: "Document alternatives considered and consequences",
		question:
			"What alternatives were considered and what are the consequences?",
		guidance:
			"List the alternatives that were considered but not chosen. Then describe the consequences: positive outcomes, negative outcomes or costs, risks, and mitigation strategies for those risks.",
		next_step: "relationships",
	},
	{
		id: "relationships",
		order: 5,
		name: "Relationships",
		description: "Link to affected entities and informing articles",
		question:
			"What does this decision impact and what principles informed it?",
		guidance:
			"Specify what this decision affects: which components, requirements, and plans are impacted? Which constitution articles informed this decision? Does it supersede any previous decisions?",
		next_step: "finalize",
	},
	{
		id: "finalize",
		order: 6,
		name: "Finalize",
		description: "Review and create the decision",
		question:
			"Ready to create this decision? Let's do a final review.",
		guidance:
			"This is the final step. Review all the decision details to ensure they're complete and accurate.",
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
