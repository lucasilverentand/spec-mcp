import type { StepDefinition } from "./types.js";

/**
 * Step definitions for Requirements (10 steps)
 */
export const REQUIREMENT_STEPS: StepDefinition[] = [
	{
		id: "research_similar_requirements",
		order: 1,
		name: "Research Similar Requirements",
		description:
			"Search for existing requirements that might already address this need",
		question:
			"Search for existing requirements that might already address this need. Have you checked if similar requirements already exist?",
		guidance:
			"Use the query tool to search for related requirements. Review the results to confirm this requirement is unique or explain how it differs from existing ones. This prevents duplicate work and ensures proper scoping.",
		next_step: "constitution_review",
		tool_hints: {
			query_examples: [
				"query({ search_terms: 'authentication user login', types: ['requirement'], mode: 'summary' })",
				"query({ search_terms: '<key terms from your requirement>', types: ['requirement'] })",
			],
		},
	},
	{
		id: "constitution_review",
		order: 2,
		name: "Constitution Review",
		description:
			"Identify constitution articles that apply to this requirement",
		question:
			"Which constitution articles apply to this requirement? Are there any guiding principles you must follow?",
		guidance:
			"Use the query tool to list all constitutions and review their articles. Identify any that apply to this requirement and reference their specific article IDs (e.g., con-001-architecture/art-002). If no constitutions exist yet, state 'none exist'.",
		next_step: "technology_research",
		tool_hints: {
			query_examples: ["query({ types: ['constitution'], mode: 'full' })"],
		},
	},
	{
		id: "technology_research",
		order: 3,
		name: "Technology Research",
		description:
			"Research available libraries and solutions (optional for technical requirements)",
		question:
			"For technical requirements, research available libraries, frameworks, and solutions. What options exist?",
		guidance:
			"If this requirement involves external libraries or frameworks, research them to inform your decisions. You can use context7 to get up-to-date docs (resolve-library-id then get-library-docs) or describe what you know. If not technical, mark as 'not applicable'.",
		next_step: "problem_identification",
		tool_hints: {
			context7_examples: [
				"Preferred: resolve-library-id({ libraryName: 'passport' }) → get-library-docs({ context7CompatibleLibraryID: '/jaredhanson/passport' })",
				"Alternative: Describe library options from your knowledge",
			],
		},
	},
	{
		id: "problem_identification",
		order: 4,
		name: "Identify Problem",
		description: "Define the problem or opportunity",
		question: "What problem are we solving and why is it important?",
		guidance:
			"Explain the problem or opportunity this requirement addresses. Include the business value and rationale using words like 'because', 'needed', or 'so that'.",
		next_step: "avoid_implementation",
	},
	{
		id: "avoid_implementation",
		order: 5,
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
		order: 6,
		name: "Define Measurability",
		description: "Add measurable success criteria",
		question: "How will you know when this requirement is successfully met?",
		guidance:
			"Define 2-4 measurable acceptance criteria. Each should be specific, testable, and clearly define what success looks like. Use concrete metrics where possible.",
		next_step: "specific_language",
	},
	{
		id: "specific_language",
		order: 7,
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
		order: 8,
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
		order: 9,
		name: "Assign Priority",
		description: "Set appropriate priority level",
		question: "What is the priority of this requirement?",
		guidance:
			"Choose a priority level: 'critical' (must-have for launch), 'required' (needed soon after launch), 'ideal' (nice to have), 'optional' (future consideration). Consider business value and urgency.",
		next_step: "review_and_refine",
	},
	{
		id: "review_and_refine",
		order: 10,
		name: "Review and Finalize",
		description: "Create complete requirement schema",
		question:
			"Create the complete requirement specification using all information from previous steps.",
		guidance:
			"Final step: Create a complete requirement object with ALL fields properly structured. Use the schema provided in the finalization instructions. Ensure criteria have IDs (crit-001, crit-002, etc.), type is 'requirement', and all data from previous steps is included. The system will validate this against the schema.",
		next_step: null,
	},
];

/**
 * Step definitions for Components (14 steps)
 */
export const COMPONENT_STEPS: StepDefinition[] = [
	{
		id: "research_existing_components",
		order: 1,
		name: "Research Existing Components",
		description:
			"Search for similar components that might already fulfill this need",
		question:
			"Search for similar components. Have you checked if a component like this already exists?",
		guidance:
			"Use the query tool to search for similar components across all types (app, service, library). Review the results to confirm this component is needed and not redundant.",
		next_step: "library_research",
		tool_hints: {
			query_examples: [
				"query({ search_terms: 'authentication service', types: ['app', 'service', 'library'], mode: 'summary' })",
				"query({ search_terms: '<component purpose>', types: ['service', 'library'] })",
			],
		},
	},
	{
		id: "library_research",
		order: 2,
		name: "Library Research",
		description:
			"Research third-party libraries that could provide this functionality",
		question:
			"Research third-party libraries that could provide this functionality. What external solutions exist?",
		guidance:
			"Before building custom solutions, research available libraries. Use context7 for up-to-date documentation (resolve-library-id then get-library-docs preferred) or describe options from your knowledge. Document your findings and explain why you're building custom vs using a library.",
		next_step: "constitution_alignment",
		tool_hints: {
			context7_examples: [
				"Preferred: resolve-library-id({ libraryName: 'express' }) → get-library-docs({ context7CompatibleLibraryID: '/expressjs/express' })",
				"Alternative: Describe library options from knowledge",
			],
			query_examples: [
				"query({ types: ['library'] }) to see what internal libraries exist",
			],
		},
	},
	{
		id: "constitution_alignment",
		order: 3,
		name: "Constitution Alignment",
		description: "Verify component design aligns with project principles",
		question:
			"Which constitution articles guide this component's design? How does it align with architectural principles?",
		guidance:
			"Query all constitutions and identify relevant articles (especially architecture, quality, and design principles). Reference specific article IDs (e.g., con-001-architecture/art-001 for library-first principle). Explain how this component aligns with or differs from these principles.",
		next_step: "duplicate_prevention",
		tool_hints: {
			query_examples: ["query({ types: ['constitution'], mode: 'full' })"],
		},
	},
	{
		id: "duplicate_prevention",
		order: 4,
		name: "Duplicate Prevention",
		description: "Confirm component is unique and necessary",
		question:
			"Based on your research, confirm this component is unique and necessary. Why can't existing components or libraries be used?",
		guidance:
			"Reference your findings from the research and library research steps. Explicitly justify why a new component is needed rather than: (1) using an existing internal component, (2) using a third-party library, or (3) extending an existing component.",
		next_step: "analyze_requirements",
	},
	{
		id: "analyze_requirements",
		order: 5,
		name: "Analyze Requirements",
		description: "Review which requirements this component satisfies",
		question: "Which requirements does this component satisfy and how?",
		guidance:
			"Use the query tool to find and review relevant requirements. List the requirement IDs and explain how this component addresses them. Describe the connection between requirements and this component's purpose.",
		next_step: "define_boundaries",
		tool_hints: {
			query_examples: [
				"query({ entity_id: 'req-001-...' }) to get specific requirement",
				"query({ types: ['requirement'], search_terms: '...' }) to search requirements",
			],
		},
	},
	{
		id: "define_boundaries",
		order: 6,
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
		order: 7,
		name: "Define Responsibilities",
		description: "List what the component does and doesn't do",
		question: "What specific capabilities does this component provide?",
		guidance:
			"List the specific responsibilities or capabilities this component handles. For each capability, be clear about whether it's handled directly or delegated.",
		next_step: "define_interfaces",
	},
	{
		id: "define_interfaces",
		order: 8,
		name: "Define Interfaces",
		description: "Specify inputs, outputs, and contracts",
		question: "What are this component's inputs, outputs, and contracts?",
		guidance:
			"Describe the component's interface: What inputs does it accept? What outputs does it produce? What APIs or contracts does it expose? Include data formats and protocols.",
		next_step: "map_dependencies",
	},
	{
		id: "map_dependencies",
		order: 9,
		name: "Map Dependencies",
		description: "Identify internal and external dependencies",
		question: "What does this component depend on?",
		guidance:
			"List both internal dependencies (other components in your system) and external dependencies (third-party libraries with versions). If none, provide empty arrays: depends_on: [], external_dependencies: [].",
		next_step: "define_ownership",
	},
	{
		id: "define_ownership",
		order: 10,
		name: "Define Ownership",
		description: "Specify state management and data ownership",
		question: "What data and state does this component own versus borrow?",
		guidance:
			"Define data ownership clearly: What data does this component create and manage? What state is it responsible for? What data does it access from other components?",
		next_step: "identify_patterns",
	},
	{
		id: "identify_patterns",
		order: 11,
		name: "Identify Patterns",
		description: "List architectural patterns used",
		question: "What architectural patterns does this component use?",
		guidance:
			"List the architectural patterns employed (e.g., Repository, Service, Factory, Observer, Singleton, Strategy). Explain why each pattern was chosen.",
		next_step: "quality_attributes",
	},
	{
		id: "quality_attributes",
		order: 12,
		name: "Define Quality Attributes",
		description: "Specify performance, security, and testability requirements",
		question: "What are the quality requirements for this component?",
		guidance:
			"Define quality attributes: Performance targets (response time, throughput), security requirements, testability needs, scalability goals, reliability expectations.",
		next_step: "trace_requirements",
	},
	{
		id: "trace_requirements",
		order: 13,
		name: "Trace to Requirements",
		description: "Create traceability matrix",
		question: "How do the capabilities trace back to requirements?",
		guidance:
			"Create a traceability map linking each capability to the requirement(s) it satisfies. Ensure complete coverage - every capability should trace to at least one requirement.",
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 14,
		name: "Validate and Refine",
		description: "Create complete component schema",
		question:
			"Create the complete component specification using all information from previous steps.",
		guidance:
			"Final step: Create a complete component object with ALL fields properly structured. Use the schema provided in the finalization instructions. Ensure type is 'app', 'service', or 'library', number is set, and all data from previous steps is included. The system will validate this against the schema.",
		next_step: null,
	},
];

/**
 * Step definitions for Plans (15 steps)
 */
export const PLAN_STEPS: StepDefinition[] = [
	{
		id: "context_discovery",
		order: 1,
		name: "Context Discovery",
		description: "Search and review related requirements and components",
		question:
			"Search and review the requirements and components this plan will implement. What's the full context?",
		guidance:
			"Use the query tool to find and review: (1) The specific requirement(s) this plan addresses, (2) Related components that will be affected or used. Understanding the full context is critical for proper planning.",
		next_step: "technology_stack_research",
		tool_hints: {
			query_examples: [
				"query({ entity_id: 'req-001-...' }) to get specific requirement",
				"query({ types: ['service', 'app', 'library'], search_terms: '...' }) to find relevant components",
				"query({ entity_id: 'req-001-.../crit-001' }) to get specific criteria",
			],
		},
	},
	{
		id: "technology_stack_research",
		order: 2,
		name: "Technology Stack Research",
		description: "Research libraries, frameworks, and tools needed",
		question:
			"Research the libraries, frameworks, and tools needed for implementation. What technologies will you use?",
		guidance:
			"For each major technology, research to inform your approach. Use context7 for up-to-date library docs (resolve-library-id then get-library-docs preferred) or describe from knowledge. Document all findings.",
		next_step: "constitution_compliance",
		tool_hints: {
			context7_examples: [
				"Preferred: resolve-library-id({ libraryName: 'jest' }) → get-library-docs({ context7CompatibleLibraryID: '/jestjs/jest' })",
				"Alternative: Describe technologies from knowledge",
			],
		},
	},
	{
		id: "constitution_compliance",
		order: 3,
		name: "Constitution Compliance",
		description: "Verify approach aligns with project standards",
		question:
			"Which constitution articles apply to this implementation? How does your approach comply with project standards?",
		guidance:
			"Query all constitutions and verify your implementation approach aligns with project standards (testing requirements, architecture principles, quality standards, security guidelines). Reference specific article IDs.",
		next_step: "similar_plans_review",
		tool_hints: {
			query_examples: ["query({ types: ['constitution'], mode: 'full' })"],
		},
	},
	{
		id: "similar_plans_review",
		order: 4,
		name: "Similar Plans Review",
		description: "Learn from similar or related plans",
		question:
			"Search for similar or related plans. What can you learn from existing plans to avoid duplication and improve estimates?",
		guidance:
			"Use query to find similar plans and review them for: (1) Task breakdown patterns, (2) Estimation accuracy (compare estimates vs actual), (3) Common risks encountered, (4) Successful approaches. Reference helpful plan IDs.",
		next_step: "review_context",
		tool_hints: {
			query_examples: [
				"query({ types: ['plan'], search_terms: 'authentication', mode: 'summary' })",
				"query({ types: ['plan'], filters: { plan_completed: true } }) to learn from completed plans",
			],
		},
	},
	{
		id: "review_context",
		order: 5,
		name: "Review Context",
		description: "Summarize context and criteria being addressed",
		question:
			"What acceptance criteria are you fulfilling and what's the context summary?",
		guidance:
			"Based on your research (step 1), summarize: the acceptance criteria this plan addresses, relevant requirements and components, and the overall implementation context.",
		next_step: "identify_phases",
	},
	{
		id: "identify_phases",
		order: 6,
		name: "Identify Phases",
		description: "Break work into major phases",
		question: "What are the major phases of work for this plan?",
		guidance:
			"Break the plan into 2-5 major phases (e.g., Setup, Core Implementation, Testing, Documentation). Describe what each phase accomplishes.",
		next_step: "analyze_dependencies",
	},
	{
		id: "analyze_dependencies",
		order: 7,
		name: "Analyze Dependencies",
		description: "Create dependency graph and ordering",
		question: "What dependencies exist for this plan?",
		guidance:
			"List what other plans must complete before this one starts. If there are no dependencies, provide an empty array []. Also consider task dependencies within this plan - which tasks must happen before others?",
		next_step: "break_down_tasks",
	},
	{
		id: "break_down_tasks",
		order: 8,
		name: "Break Down Tasks",
		description: "Create actionable tasks (0.5-3 days each)",
		question: "What specific tasks need to be completed with effort estimates?",
		guidance:
			"Break down the work into specific, actionable tasks. Each task should be: 0.5-3 days of effort, independently testable, and clearly described. Provide task IDs, descriptions, and estimated_days (be realistic and add a 20% buffer for unknowns).",
		next_step: "define_acceptance",
	},
	{
		id: "define_acceptance",
		order: 9,
		name: "Define Acceptance Criteria",
		description: "Add acceptance criteria for the plan",
		question: "How will you know when this plan is complete?",
		guidance:
			"Define clear acceptance criteria for the overall plan. What conditions must be met to consider this plan done? Be specific and measurable.",
		next_step: "identify_milestones",
	},
	{
		id: "identify_milestones",
		order: 10,
		name: "Identify Milestones",
		description: "Define major checkpoints",
		question: "What are the major milestones for this plan?",
		guidance:
			"Identify 2-4 major milestones - deliverable checkpoints where stakeholders can review progress. Each milestone should represent a meaningful accomplishment.",
		next_step: "plan_testing",
	},
	{
		id: "plan_testing",
		order: 11,
		name: "Plan Testing Strategy",
		description: "Define how work will be tested",
		question: "How will you test the work in this plan?",
		guidance:
			"Define your testing strategy: unit tests, integration tests, E2E tests. Specify coverage goals (aim for 90%+) and testing approach for each type.",
		next_step: "plan_risks",
	},
	{
		id: "plan_risks",
		order: 12,
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
		order: 13,
		name: "Create Timeline",
		description: "Build schedule and critical path",
		question: "What's the timeline for this plan?",
		guidance:
			"Create a timeline: when will each phase complete? What's the critical path (longest sequence of dependent tasks)? What's the target completion date?",
		next_step: "trace_specs",
	},
	{
		id: "trace_specs",
		order: 14,
		name: "Trace to Specs",
		description: "Link to requirements and components",
		question: "How do the tasks trace to requirements and components?",
		guidance:
			"Link each task to requirement IDs and component IDs. Ensure full traceability - every task should support at least one requirement or component.",
		next_step: "validate_refine",
	},
	{
		id: "validate_refine",
		order: 15,
		name: "Validate and Refine",
		description: "Create complete plan schema",
		question:
			"Create the complete plan specification using all information from previous steps.",
		guidance:
			"Final step: Create a complete plan object with ALL fields properly structured. Use the schema provided in the finalization instructions. Ensure type is 'plan', number is set, tasks have IDs and structure, and all data from previous steps is included. The system will validate this against the schema.",
		next_step: null,
	},
];

/**
 * Step definitions for Constitutions (7 steps)
 */
export const CONSTITUTION_STEPS: StepDefinition[] = [
	{
		id: "research_existing_constitutions",
		order: 1,
		name: "Research Existing Constitutions",
		description: "Review all existing constitutions and principles",
		question:
			"What constitutions and principles already exist in this project? Have you reviewed all existing articles?",
		guidance:
			"Use the query tool to list all existing constitutions and carefully review their articles. This prevents creating conflicting or duplicate principles. Document what you find.",
		next_step: "best_practices_research",
		tool_hints: {
			query_examples: ["query({ types: ['constitution'], mode: 'full' })"],
		},
	},
	{
		id: "best_practices_research",
		order: 2,
		name: "Best Practices Research",
		description: "Research industry standards for these types of principles",
		question:
			"Research industry standards and best practices for these types of principles. What established frameworks exist?",
		guidance:
			"Research established frameworks relevant to your principles (SOLID, 12-factor apps, OWASP, etc.). Describe from your knowledge or web research. Examples: SOLID principles, 12-factor apps, OWASP security, Google SRE best practices.",
		next_step: "framework_review",
	},
	{
		id: "framework_review",
		order: 3,
		name: "Framework Review",
		description: "Review framework-specific best practices if applicable",
		question:
			"Are you establishing principles around specific technologies or frameworks? If so, research their recommended practices.",
		guidance:
			"If your principles involve specific libraries/frameworks, research their best practices. Use context7 for latest docs (resolve-library-id then get-library-docs preferred) or describe from knowledge. If not applicable, state 'not applicable'.",
		next_step: "basic_info",
		tool_hints: {
			context7_examples: [
				"Preferred: resolve-library-id({ libraryName: 'react' }) → get-library-docs({ context7CompatibleLibraryID: '/facebook/react', topic: 'best practices' })",
				"Alternative: Describe framework best practices from knowledge",
			],
		},
	},
	{
		id: "basic_info",
		order: 4,
		name: "Basic Information",
		description: "Provide basic constitution information",
		question: "What is this constitution about and what will it govern?",
		guidance:
			"Provide a name and description for this constitution. Explain what principles it will establish and what aspects of development it will govern. Ensure this fills a unique gap not covered by existing constitutions.",
		next_step: "articles",
	},
	{
		id: "articles",
		order: 5,
		name: "Define Articles",
		description: "Create the core principles/articles",
		question: "What are the core principles or articles of this constitution?",
		guidance:
			"Define the articles (core principles) that make up this constitution. For each article, include: title, the principle itself, rationale explaining why it exists, optional examples demonstrating it, optional exceptions where it doesn't apply, and status (needs-review, active, or archived).",
		next_step: "conflict_check",
	},
	{
		id: "conflict_check",
		order: 6,
		name: "Conflict Check",
		description: "Verify no conflicts with existing constitutional principles",
		question:
			"Do any of your articles conflict with or duplicate existing constitutional principles?",
		guidance:
			"Review the articles from your initial research (step 1). For each of your new articles, explicitly state: (1) 'No conflicts' if it's unique, OR (2) 'Conflicts with con-XXX/art-XXX: [explanation]' if it supersedes or modifies an existing principle. You must reference specific existing articles or explicitly confirm no conflicts.",
		next_step: "finalize",
		tool_hints: {
			query_examples: [
				"query({ types: ['constitution'], mode: 'full' }) to review existing articles again",
			],
		},
	},
	{
		id: "finalize",
		order: 7,
		name: "Finalize",
		description: "Create complete constitution schema",
		question:
			"Create the complete constitution specification using all information from previous steps.",
		guidance:
			"Final step: Create a complete constitution object with ALL fields properly structured. Use the schema provided in the finalization instructions. Ensure type is 'constitution', articles array has proper IDs and structure, and all data from previous steps is included. The system will validate this against the schema.",
		next_step: null,
	},
];

/**
 * Step definitions for Decisions (8 steps)
 */
export const DECISION_STEPS: StepDefinition[] = [
	{
		id: "related_decisions_research",
		order: 1,
		name: "Related Decisions Research",
		description: "Search for related or similar decisions",
		question:
			"Search for related or similar decisions already made. Have you checked if this decision already exists or modifies a previous one?",
		guidance:
			"Use the query tool to search for related decisions. Check if: (1) this decision already exists, (2) this modifies/supersedes a previous decision (use 'supersedes' field if so), or (3) there are related decisions to reference.",
		next_step: "technology_options_research",
		tool_hints: {
			query_examples: [
				"query({ types: ['decision'], search_terms: 'database postgresql', mode: 'summary' })",
				"query({ types: ['decision'], search_terms: '<key terms>' })",
			],
		},
	},
	{
		id: "technology_options_research",
		order: 2,
		name: "Technology Options Research",
		description: "Research each alternative being considered",
		question:
			"For each alternative/option being considered, research the detailed capabilities and trade-offs. What are the pros and cons?",
		guidance:
			"For each option, research capabilities and trade-offs. Use context7 for library docs (resolve-library-id then get-library-docs preferred) or describe from knowledge. Document findings to support your decision.",
		next_step: "basic_info",
		tool_hints: {
			context7_examples: [
				"Preferred: resolve-library-id({ libraryName: 'postgresql' }) → get-library-docs({ context7CompatibleLibraryID: '/postgres/postgres' })",
				"Alternative: Describe technology options from knowledge",
			],
		},
	},
	{
		id: "basic_info",
		order: 3,
		name: "Basic Information",
		description: "Provide basic decision information",
		question: "What is this decision about?",
		guidance:
			"Provide a name and brief description summarizing what this decision addresses. Keep it concise but informative.",
		next_step: "decision_statement",
	},
	{
		id: "decision_statement",
		order: 4,
		name: "Decision Statement",
		description: "State what was decided",
		question: "What exactly was decided?",
		guidance:
			"State clearly and concisely what was decided. This should be 20-500 characters - specific enough to be actionable but concise enough to be memorable.",
		next_step: "context",
	},
	{
		id: "context",
		order: 5,
		name: "Context",
		description: "Explain the situation that prompted this decision",
		question: "What situation or problem led to this decision?",
		guidance:
			"Describe the context that prompted this decision. Explain the problem, opportunity, or situation that needed to be addressed (20-1000 characters).",
		next_step: "alternatives_and_consequences",
	},
	{
		id: "alternatives_and_consequences",
		order: 6,
		name: "Alternatives and Consequences",
		description: "Document alternatives considered and consequences",
		question:
			"What alternatives were considered and what are the consequences?",
		guidance:
			"Reference your research from step 2. List the alternatives that were considered but not chosen. Then describe the consequences: positive outcomes, negative outcomes or costs, risks, and mitigation strategies for those risks.",
		next_step: "relationships",
	},
	{
		id: "relationships",
		order: 7,
		name: "Relationships",
		description:
			"Link to affected entities and informing constitution articles",
		question:
			"What does this decision impact and which constitution articles informed it? (Constitution references are required)",
		guidance:
			"Specify what this decision affects: which components, requirements, and plans are impacted? REQUIRED: Identify which constitution articles informed this decision (or explicitly state why none apply if no constitutions exist). Does it supersede any previous decisions?",
		next_step: "finalize",
		tool_hints: {
			query_examples: [
				"query({ types: ['constitution'], mode: 'full' }) to find relevant articles",
			],
		},
	},
	{
		id: "finalize",
		order: 8,
		name: "Finalize",
		description: "Create complete decision schema",
		question:
			"Create the complete decision specification using all information from previous steps.",
		guidance:
			"Final step: Create a complete decision object with ALL fields properly structured. Use the schema provided in the finalization instructions. Ensure type is 'decision', number is set, consequences object is properly structured, and all data from previous steps is included. The system will validate this against the schema.",
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
