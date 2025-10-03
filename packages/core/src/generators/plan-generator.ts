import type {
	AcceptanceCriteria,
	Plan,
	Requirement,
	Task,
} from "@spec-mcp/data";
import { SlugGenerator } from "../transformation/index.js";

export interface PlanGenerationOptions {
	priority?: "critical" | "high" | "medium" | "low";
	includeTestCases?: boolean;
	includeFlows?: boolean;
	estimatedDays?: number;
	assignedTo?: string;
	tags?: string[];
}

export interface GeneratedPlan {
	plan: Omit<Plan, "number" | "id" | "created_at" | "updated_at">;
	metadata: {
		generatedFrom: string;
		generationReason: string;
		suggestedReviews: string[];
	};
}

function generateFromRequirement(
	requirement: Requirement,
	options: PlanGenerationOptions = {},
): GeneratedPlan[] {
	const plans: GeneratedPlan[] = [];

	// For each acceptance criteria, generate a potential plan
	for (const criteria of requirement.criteria) {
		const plan = createPlanFromCriteria(requirement, criteria, options);
		plans.push(plan);
	}

	// If requirement is complex, suggest additional supporting plans
	if (requirement.criteria.length > 3 || requirement.priority === "critical") {
		const supportingPlans = generateSupportingPlans(requirement, options);
		plans.push(...supportingPlans);
	}

	return plans;
}

function generateImplementationPlans(
	requirements: Requirement[],
	options: PlanGenerationOptions = {},
): GeneratedPlan[] {
	const plans: GeneratedPlan[] = [];

	// Group requirements by priority
	const priorityGroups = groupRequirementsByPriority(requirements);

	// Generate plans for each priority group
	for (const [priority, reqs] of Object.entries(priorityGroups)) {
		for (const requirement of reqs) {
			const reqPlans = generateFromRequirement(requirement, {
				...options,
				priority: priority as "critical" | "high" | "medium" | "low",
			});
			plans.push(...reqPlans);
		}
	}

	// Generate integration plans if multiple requirements
	if (requirements.length > 1) {
		const integrationPlans = generateIntegrationPlans(requirements, options);
		plans.push(...integrationPlans);
	}

	return plans;
}

function generateMilestonePlans(
	requirements: Requirement[],
	milestoneCount: number = 3,
): GeneratedPlan[] {
	const plans: GeneratedPlan[] = [];

	// Sort requirements by priority
	const sortedRequirements = sortRequirementsByPriority(requirements);

	// Divide requirements into milestones
	const milestones = divideIntoMilestones(sortedRequirements, milestoneCount);

	milestones.forEach((milestone, index) => {
		const plan = createMilestonePlan(milestone, index + 1, milestoneCount);
		plans.push(plan);
	});

	return plans;
}

function createPlanFromCriteria(
	requirement: Requirement,
	criteria: AcceptanceCriteria,
	options: PlanGenerationOptions,
): GeneratedPlan {
	const requirementId = `req-${requirement.number.toString().padStart(3, "0")}-${requirement.slug}`;
	const generator = new SlugGenerator();
	const planSlug = generator.generateSlug(criteria.description);

	const plan: Omit<Plan, "number" | "id" | "created_at" | "updated_at"> = {
		type: "plan",
		criteria_id: criteria.id,
		name: `Implementation: ${criteria.description}`,
		slug: planSlug,
		description: `Implementation plan for acceptance criteria: ${criteria.description}`,
		priority: options.priority || derivePriorityFromRequirement(requirement),
		acceptance_criteria: generateAcceptanceCriteria(criteria, requirement),
		depends_on: [],
		tasks: generateTasksFromCriteria(criteria, requirement),
		flows: options.includeFlows ? generateFlowsFromCriteria(criteria) : [],
		test_cases: options.includeTestCases
			? generateTestCasesFromCriteria(criteria)
			: [],
		api_contracts: [],
		data_models: [],
		references: [
			{
				type: "file",
				name: `Requirement: ${requirement.name}`,
				description: `Source requirement for this plan`,
				importance: "high",
				path: `requirements/${requirementId}.yml`,
			},
		],
		completed: false,
		approved: false,
	};

	return {
		plan,
		metadata: {
			generatedFrom: `${requirementId}/${criteria.id}`,
			generationReason: "Automatic plan generation from acceptance criteria",
			suggestedReviews: [
				"Review task breakdown for completeness",
				"Validate acceptance criteria alignment",
				"Check dependency requirements",
				"Verify test case coverage",
			],
		},
	};
}

function generateSupportingPlans(
	requirement: Requirement,
	options: PlanGenerationOptions,
): GeneratedPlan[] {
	const plans: GeneratedPlan[] = [];

	// Generate infrastructure/setup plan if needed
	if (requiresInfrastructure(requirement)) {
		plans.push(createInfrastructurePlan(requirement, options));
	}

	// Generate testing plan if complex
	if (requirement.criteria.length > 2) {
		plans.push(createTestingPlan(requirement, options));
	}

	// Generate documentation plan if critical
	if (requirement.priority === "critical") {
		plans.push(createDocumentationPlan(requirement, options));
	}

	return plans;
}

function generateIntegrationPlans(
	requirements: Requirement[],
	options: PlanGenerationOptions,
): GeneratedPlan[] {
	const plans: GeneratedPlan[] = [];

	// Find requirements that likely need integration
	const integrationCandidates = findIntegrationCandidates(requirements);

	if (integrationCandidates.length > 0) {
		const integrationPlan = createIntegrationPlan(
			integrationCandidates,
			options,
		);
		plans.push(integrationPlan);
	}

	return plans;
}

function createMilestonePlan(
	requirements: Requirement[],
	milestoneNumber: number,
	totalMilestones: number,
): GeneratedPlan {
	const milestoneSlug = `milestone-${milestoneNumber}`;
	const requirementNames = requirements.map((r) => r.name).join(", ");

	const plan: Omit<Plan, "number" | "id" | "created_at" | "updated_at"> = {
		type: "plan",
		name: `Milestone ${milestoneNumber} of ${totalMilestones}`,
		slug: milestoneSlug,
		description: `Implementation milestone covering: ${requirementNames}`,
		priority: calculateMilestonePriority(requirements),
		acceptance_criteria: generateMilestoneAcceptanceCriteria(
			requirements,
			milestoneNumber,
		),
		depends_on:
			milestoneNumber > 1 ? [`pln-001-milestone-${milestoneNumber - 1}`] : [],
		tasks: generateMilestoneTasks(requirements, milestoneNumber),
		flows: [],
		test_cases: generateMilestoneTestCases(requirements),
		api_contracts: [],
		data_models: [],
		references: requirements.map((req) => ({
			type: "file" as const,
			name: `Requirement: ${req.name}`,
			description: `Source requirement for this milestone`,
			importance: "high" as const,
			path: `requirements/req-${req.number.toString().padStart(3, "0")}-${req.slug}.yml`,
		})),
		completed: false,
		approved: false,
	};

	return {
		plan,
		metadata: {
			generatedFrom: requirements
				.map((r) => `req-${r.number.toString().padStart(3, "0")}-${r.slug}`)
				.join(", "),
			generationReason: `Milestone plan generation for ${requirements.length} requirements`,
			suggestedReviews: [
				"Review milestone scope and timeline",
				"Validate requirement dependencies",
				"Check resource allocation",
				"Verify deliverable completeness",
			],
		},
	};
}

function generateTasksFromCriteria(
	criteria: AcceptanceCriteria,
	_requirement: Requirement,
): Task[] {
	const tasks: Task[] = [];

	// Analysis task
	tasks.push({
		id: "task-001",
		description: `Analyze requirements for: ${criteria.description}`,
		priority: "high",
		depends_on: [],
		completed: false,
		verified: false,
		considerations: [],
		references: [],
		files: [],
		notes: [],
	});

	// Design task
	tasks.push({
		id: "task-002",
		description: `Design solution for: ${criteria.description}`,
		priority: "high",
		depends_on: ["task-001"],
		completed: false,
		verified: false,
		considerations: [],
		references: [],
		files: [],
		notes: [],
	});

	// Implementation task
	tasks.push({
		id: "task-003",
		description: `Implement: ${criteria.description}`,
		priority: "medium",
		depends_on: ["task-002"],
		completed: false,
		verified: false,
		considerations: [],
		references: [],
		files: [],
		notes: [],
	});

	// Testing task
	tasks.push({
		id: "task-004",
		description: `Test implementation of: ${criteria.description}`,
		priority: "medium",
		depends_on: ["task-003"],
		completed: false,
		verified: false,
		considerations: [],
		references: [],
		files: [],
		notes: [],
	});

	return tasks;
}

function generateFlowsFromCriteria(criteria: { description: string }): Array<{
	id: string;
	type: string;
	name: string;
	description?: string;
	steps: Array<{
		id: string;
		name: string;
		description?: string;
		next_steps: string[];
	}>;
}> {
	return [
		{
			id: "flow-001",
			type: "user_flow",
			name: "Main Implementation Flow",
			description: `Primary flow for implementing ${criteria.description}`,
			steps: [
				{
					id: "step-001",
					name: "Initialize",
					description: "Initialize the implementation process",
					next_steps: ["step-002"],
				},
				{
					id: "step-002",
					name: "Process",
					description: "Execute the main processing logic",
					next_steps: ["step-003"],
				},
				{
					id: "step-003",
					name: "Complete",
					description: "Finalize and confirm completion",
					next_steps: [],
				},
			],
		},
	];
}

function generateTestCasesFromCriteria(criteria: {
	description: string;
}): Array<{
	id: string;
	name: string;
	description: string;
	steps: string[];
	expected_result: string;
	implemented: boolean;
	passing: boolean;
	components: string[];
	related_flows: string[];
}> {
	return [
		{
			id: "tc-001",
			name: "Positive Test Case",
			description: `Test successful execution of ${criteria.description}`,
			steps: [
				"Execute the primary flow",
				"Verify expected behavior",
				"Confirm success criteria",
			],
			expected_result: criteria.description,
			implemented: false,
			passing: false,
			components: [],
			related_flows: ["flow-001"],
		},
	];
}

function generateAcceptanceCriteria(
	criteria: { description: string },
	requirement: Requirement,
): string {
	return `
Implementation is complete when:
- ${criteria.description} is fully functional
- All related tests pass
- Code meets quality standards
- Documentation is updated
- Requirement "${requirement.name}" acceptance criteria is satisfied
	`.trim();
}

function derivePriorityFromRequirement(
	requirement: Requirement,
): "critical" | "high" | "medium" | "low" {
	switch (requirement.priority) {
		case "critical":
			return "critical";
		case "required":
			return "high";
		case "ideal":
			return "medium";
		case "optional":
			return "low";
		default:
			return "medium";
	}
}

function groupRequirementsByPriority(
	requirements: Requirement[],
): Record<string, Requirement[]> {
	return requirements.reduce(
		(groups, req) => {
			const priority = req.priority;
			if (!groups[priority]) {
				groups[priority] = [];
			}
			groups[priority].push(req);
			return groups;
		},
		{} as Record<string, Requirement[]>,
	);
}

function sortRequirementsByPriority(
	requirements: Requirement[],
): Requirement[] {
	const priorityOrder = { critical: 0, required: 1, ideal: 2, optional: 3 };
	return [...requirements].sort((a, b) => {
		return priorityOrder[a.priority] - priorityOrder[b.priority];
	});
}

function divideIntoMilestones(
	requirements: Requirement[],
	milestoneCount: number,
): Requirement[][] {
	const milestones: Requirement[][] = Array(milestoneCount)
		.fill(null)
		.map(() => []);

	requirements.forEach((req, index) => {
		const milestoneIndex = index % milestoneCount;
		milestones[milestoneIndex]?.push(req);
	});

	return milestones.filter((milestone) => milestone.length > 0);
}

function requiresInfrastructure(requirement: Requirement): boolean {
	const infrastructureKeywords = [
		"database",
		"api",
		"service",
		"deployment",
		"infrastructure",
		"security",
	];
	const text = `${requirement.name} ${requirement.description}`.toLowerCase();
	return infrastructureKeywords.some((keyword) => text.includes(keyword));
}

function findIntegrationCandidates(requirements: Requirement[]): Requirement[] {
	// Simple heuristic: requirements that mention similar concepts
	const concepts = new Map<string, Requirement[]>();

	requirements.forEach((req) => {
		const words = `${req.name} ${req.description}`
			.toLowerCase()
			.split(/\s+/)
			.filter((word) => word.length > 3);

		words.forEach((word) => {
			if (!concepts.has(word)) {
				concepts.set(word, []);
			}
			concepts.get(word)?.push(req);
		});
	});

	// Find requirements that share concepts
	const candidates = new Set<Requirement>();
	for (const [, reqs] of concepts) {
		if (reqs.length > 1) {
			for (const req of reqs) {
				candidates.add(req);
			}
		}
	}

	return Array.from(candidates);
}

function calculateMilestonePriority(
	requirements: Requirement[],
): "critical" | "high" | "medium" | "low" {
	const hasCritical = requirements.some((r) => r.priority === "critical");
	const hasRequired = requirements.some((r) => r.priority === "required");

	if (hasCritical) return "critical";
	if (hasRequired) return "high";
	return "medium";
}

function generateMilestoneAcceptanceCriteria(
	requirements: Requirement[],
	milestoneNumber: number,
): string {
	const reqList = requirements.map((r) => `- ${r.name}`).join("\n");
	return `
Milestone ${milestoneNumber} is complete when:
${reqList}

All requirements have their acceptance criteria satisfied and tested.
	`.trim();
}

function generateMilestoneTasks(
	requirements: Requirement[],
	milestoneNumber: number,
): Task[] {
	const tasks: Task[] = [];

	tasks.push({
		id: "task-001",
		description: `Plan implementation for milestone ${milestoneNumber}`,
		priority: "high",
		depends_on: [],
		completed: false,
		verified: false,
		considerations: [],
		references: [],
		files: [],
		notes: [],
	});

	requirements.forEach((req, index) => {
		const priority =
			req.priority === "critical" || req.priority === "required"
				? "high"
				: "medium";
		tasks.push({
			id: `task-${(index + 2).toString().padStart(3, "0")}`,
			description: `Implement requirement: ${req.name}`,
			priority,
			depends_on: ["task-001"],
			completed: false,
			verified: false,
			considerations: [],
			references: [],
			files: [],
			notes: [],
		});
	});

	tasks.push({
		id: `task-${(requirements.length + 2).toString().padStart(3, "0")}`,
		description: `Integration testing for milestone ${milestoneNumber}`,
		priority: "medium",
		depends_on: tasks.slice(1).map((t) => t.id),
		completed: false,
		verified: false,
		considerations: [],
		references: [],
		files: [],
		notes: [],
	});

	return tasks;
}

function generateMilestoneTestCases(requirements: Requirement[]): Array<{
	id: string;
	name: string;
	description: string;
	steps: string[];
	expected_result: string;
	implemented: boolean;
	passing: boolean;
	components: string[];
	related_flows: string[];
}> {
	return requirements.map((req, index) => ({
		id: `tc-${(index + 1).toString().padStart(3, "0")}`,
		name: `Test ${req.name}`,
		description: `Integration test for requirement: ${req.name}`,
		steps: [
			`Execute ${req.name} functionality`,
			"Verify all acceptance criteria",
		],
		expected_result: `${req.name} works as specified`,
		implemented: false,
		passing: false,
		components: [],
		related_flows: [],
	}));
}

function createInfrastructurePlan(
	requirement: Requirement,
	_options: PlanGenerationOptions,
): GeneratedPlan {
	const planSlug = `${requirement.slug}-infrastructure`;

	const plan: Omit<Plan, "number" | "id" | "created_at" | "updated_at"> = {
		type: "plan",
		name: `Infrastructure: ${requirement.name}`,
		slug: planSlug,
		description: `Infrastructure setup plan for requirement: ${requirement.name}`,
		priority: "high",
		acceptance_criteria:
			"Infrastructure is provisioned and configured to support the requirement implementation",
		depends_on: [],
		tasks: [
			{
				id: "task-001",
				description: "Analyze infrastructure requirements",
				priority: "high",
				depends_on: [],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
			{
				id: "task-002",
				description: "Set up required infrastructure",
				priority: "high",
				depends_on: ["task-001"],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
		],
		flows: [],
		test_cases: [],
		api_contracts: [],
		data_models: [],
		references: [],
		completed: false,
		approved: false,
	};

	return {
		plan,
		metadata: {
			generatedFrom: `req-${requirement.number.toString().padStart(3, "0")}-${requirement.slug}`,
			generationReason: "Infrastructure requirements detected",
			suggestedReviews: [
				"Review infrastructure requirements",
				"Validate setup procedures",
			],
		},
	};
}

function createTestingPlan(
	requirement: Requirement,
	_options: PlanGenerationOptions,
): GeneratedPlan {
	const planSlug = `${requirement.slug}-testing`;

	const plan: Omit<Plan, "number" | "id" | "created_at" | "updated_at"> = {
		type: "plan",
		name: `Testing: ${requirement.name}`,
		slug: planSlug,
		description: `Comprehensive testing plan for requirement: ${requirement.name}`,
		priority: "medium",
		acceptance_criteria:
			"All test cases pass and requirement is fully validated",
		depends_on: [],
		tasks: [
			{
				id: "task-001",
				description: "Plan comprehensive testing strategy",
				priority: "high",
				depends_on: [],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
			{
				id: "task-002",
				description: "Implement automated tests",
				priority: "medium",
				depends_on: ["task-001"],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
		],
		flows: [],
		test_cases: [],
		api_contracts: [],
		data_models: [],
		references: [],
		completed: false,
		approved: false,
	};

	return {
		plan,
		metadata: {
			generatedFrom: `req-${requirement.number.toString().padStart(3, "0")}-${requirement.slug}`,
			generationReason: "Complex requirement requires dedicated testing plan",
			suggestedReviews: ["Review testing coverage", "Validate test scenarios"],
		},
	};
}

function createDocumentationPlan(
	requirement: Requirement,
	_options: PlanGenerationOptions,
): GeneratedPlan {
	const planSlug = `${requirement.slug}-documentation`;

	const plan: Omit<Plan, "number" | "id" | "created_at" | "updated_at"> = {
		type: "plan",
		name: `Documentation: ${requirement.name}`,
		slug: planSlug,
		description: `Documentation plan for critical requirement: ${requirement.name}`,
		priority: "medium",
		acceptance_criteria: "Complete documentation is created and maintained",
		depends_on: [],
		tasks: [
			{
				id: "task-001",
				description: "Plan documentation structure and content",
				priority: "medium",
				depends_on: [],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
			{
				id: "task-002",
				description: "Create comprehensive documentation",
				priority: "medium",
				depends_on: ["task-001"],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
		],
		flows: [],
		test_cases: [],
		api_contracts: [],
		data_models: [],
		references: [],
		completed: false,
		approved: false,
	};

	return {
		plan,
		metadata: {
			generatedFrom: `req-${requirement.number.toString().padStart(3, "0")}-${requirement.slug}`,
			generationReason: "Critical requirement requires dedicated documentation",
			suggestedReviews: [
				"Review documentation scope",
				"Validate content requirements",
			],
		},
	};
}

function createIntegrationPlan(
	requirements: Requirement[],
	_options: PlanGenerationOptions,
): GeneratedPlan {
	const planSlug = "integration-plan";

	const plan: Omit<Plan, "number" | "id" | "created_at" | "updated_at"> = {
		type: "plan",
		name: "Integration Plan",
		slug: planSlug,
		description: `Integration plan for related requirements: ${requirements.map((r) => r.name).join(", ")}`,
		priority: "high",
		acceptance_criteria: "All integrated requirements work together seamlessly",
		depends_on: [],
		tasks: [
			{
				id: "task-001",
				description: "Analyze integration requirements and dependencies",
				priority: "high",
				depends_on: [],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
			{
				id: "task-002",
				description: "Implement integration layer",
				priority: "high",
				depends_on: ["task-001"],
				completed: false,
				verified: false,
				considerations: [],
				references: [],
				files: [],
				notes: [],
			},
		],
		flows: [],
		test_cases: [],
		api_contracts: [],
		data_models: [],
		references: requirements.map((req) => ({
			type: "file" as const,
			name: `Requirement: ${req.name}`,
			description: `Source requirement for this milestone`,
			importance: "high" as const,
			path: `requirements/req-${req.number.toString().padStart(3, "0")}-${req.slug}.yml`,
		})),
		completed: false,
		approved: false,
	};

	return {
		plan,
		metadata: {
			generatedFrom: requirements
				.map((r) => `req-${r.number.toString().padStart(3, "0")}-${r.slug}`)
				.join(", "),
			generationReason:
				"Integration requirements detected between multiple requirements",
			suggestedReviews: [
				"Review integration approach",
				"Validate requirement dependencies",
			],
		},
	};
}

export const PlanGenerator = {
	generateFromRequirement,
	generateImplementationPlans,
	generateMilestonePlans,
};
