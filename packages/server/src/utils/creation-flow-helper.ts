import {
	type Draft,
	DraftManager,
	getStepDefinitions,
	type StepResponse,
	StepValidator,
} from "@spec-mcp/core";

/**
 * Shared creation-flow helper for all spec tools
 */
export class CreationFlowHelper {
	private draftManager: DraftManager;
	private stepValidator: StepValidator;

	constructor() {
		this.draftManager = new DraftManager();
		this.stepValidator = new StepValidator();
	}

	/**
	 * Start a new creation-flow session
	 */
	async start(
		type: "requirement" | "component" | "plan" | "constitution" | "decision",
		slug?: string,
		name?: string,
	): Promise<StepResponse> {
		const draft = await this.draftManager.create(type, slug, name);
		const steps = getStepDefinitions(type);
		const firstStep = steps[0];

		if (!firstStep) {
			throw new Error("No steps defined for this spec type");
		}

		// Generate helpful hints and examples for first step
		const { field_hints, examples } = this.generateStepGuidance(
			firstStep,
			draft.type,
		);

		return {
			draft_id: draft.id,
			step: 1,
			total_steps: draft.total_steps,
			current_step_name: firstStep.name,
			prompt: firstStep.prompt,
			field_hints,
			examples,
			progress_summary: this.generateProgressSummary(1, draft.total_steps, type),
			...(firstStep.next_step ? { next_step: firstStep.next_step } : {}),
		};
	}

	/**
	 * Process a creation-flow step
	 */
	async step(
		draft_id: string,
		data: Record<string, unknown>,
	): Promise<StepResponse | { error: string }> {
		const draft = this.draftManager.get(draft_id);
		if (!draft) {
			return { error: `Draft not found: ${draft_id}` };
		}

		// Prevent locking drafts - only finalized specs can be locked
		if ("locked" in data) {
			return {
				error: "Drafts cannot be locked. Only finalized specs can be locked.",
			};
		}

		const steps = getStepDefinitions(draft.type);
		const currentStepIndex = draft.current_step - 1;

		if (currentStepIndex >= steps.length) {
			return {
				error:
					"All steps completed. Use 'finalize' operation to create the spec.",
			};
		}

		const currentStep = steps[currentStepIndex];
		if (!currentStep) {
			return { error: "Invalid step index" };
		}

		// Merge new data with existing draft data
		const updatedData = { ...draft.data, ...data };

		// Validate current step
		const validation = this.stepValidator.validate(
			draft.type,
			currentStep.id,
			updatedData,
		);

		// Update draft with new data and validation
		const updatedDraft = await this.draftManager.update(draft_id, {
			data: updatedData,
			validation_results: [...draft.validation_results, validation],
		});

		if (!updatedDraft) {
			return { error: `Failed to update draft: ${draft_id}` };
		}

		// If validation failed, return error with suggestions
		if (!validation.passed) {
			return {
				draft_id,
				step: draft.current_step,
				total_steps: draft.total_steps,
				current_step_name: currentStep.name,
				prompt: currentStep.prompt,
				validation,
			};
		}

		// Move to next step
		const nextStepIndex = currentStepIndex + 1;
		if (nextStepIndex >= steps.length) {
			// All steps complete
			return {
				draft_id,
				step: draft.current_step,
				total_steps: draft.total_steps,
				current_step_name: currentStep.name,
				prompt:
					"All steps completed! Use 'finalize' operation to create the spec.",
				completed: true,
			};
		}

		const nextStep = steps[nextStepIndex];
		if (!nextStep) {
			return { error: "Invalid next step index" };
		}

		const finalDraft = await this.draftManager.update(draft_id, {
			current_step: nextStepIndex + 1,
		});

		if (!finalDraft) {
			return { error: `Failed to advance to next step: ${draft_id}` };
		}

		// Generate helpful hints and examples for next step
		const { field_hints, examples } = this.generateStepGuidance(
			nextStep,
			draft.type,
		);

		return {
			draft_id,
			step: nextStepIndex + 1,
			total_steps: draft.total_steps,
			current_step_name: nextStep.name,
			prompt: nextStep.prompt,
			validation,
			field_hints,
			examples,
			progress_summary: this.generateProgressSummary(
				nextStepIndex + 1,
				draft.total_steps,
				draft.type,
			),
			...(nextStep.next_step ? { next_step: nextStep.next_step } : {}),
		};
	}

	/**
	 * Validate current draft state
	 */
	validate(draft_id: string): StepResponse | { error: string } {
		const draft = this.draftManager.get(draft_id);
		if (!draft) {
			return { error: `Draft not found: ${draft_id}` };
		}

		const steps = getStepDefinitions(draft.type);
		const currentStepIndex = draft.current_step - 1;

		if (currentStepIndex >= steps.length) {
			return { error: "All steps already completed" };
		}

		const currentStep = steps[currentStepIndex];
		if (!currentStep) {
			return { error: "Invalid step index" };
		}

		const validation = this.stepValidator.validate(
			draft.type,
			currentStep.id,
			draft.data,
		);

		return {
			draft_id,
			step: draft.current_step,
			total_steps: draft.total_steps,
			current_step_name: currentStep.name,
			prompt: currentStep.prompt,
			validation,
		};
	}

	/**
	 * Get draft for finalization
	 */
	getDraft(draft_id: string): Draft | null {
		return this.draftManager.get(draft_id);
	}

	/**
	 * Delete draft after finalization
	 */
	async deleteDraft(draft_id: string): Promise<boolean> {
		return await this.draftManager.delete(draft_id);
	}

	/**
	 * Generate helpful hints and examples for a step
	 */
	private generateStepGuidance(
		step: import("@spec-mcp/core").StepDefinition,
		specType: "requirement" | "component" | "plan" | "constitution" | "decision",
	): { field_hints: Record<string, string>; examples: Record<string, unknown> } {
		const field_hints: Record<string, string> = {};
		const examples: Record<string, unknown> = {};

		// Common hints based on step ID
		switch (step.id) {
			case "basic_info":
				field_hints.name = "Use a clear, descriptive name (e.g., 'User Authentication', 'Payment Gateway')";
				field_hints.description = "Explain what this is and why it's needed in 2-3 sentences";
				examples.name = specType === "requirement" ? "User Authentication" : "Auth Service";
				examples.description = `A brief but informative description explaining the ${specType}'s purpose and business value`;
				break;

			// REQUIREMENT STEPS
			case "problem_identification":
				field_hints.description = "Describe the problem or opportunity. Include rationale using 'because', 'needed', or 'so that' (min 50 chars)";
				examples.description = "Users need secure authentication because we handle sensitive financial data and must prevent unauthorized access";
				break;

			case "avoid_implementation":
				field_hints.description = "Review and ensure no implementation details (technologies, frameworks, UI components) are mentioned. Focus on WHAT, not HOW";
				examples.description = "System must authenticate users and maintain session state throughout their interaction";
				break;

			case "measurability":
				field_hints.criteria = "Define 2-4 measurable, testable acceptance criteria. Each should be specific and define success clearly";
				examples.criteria = [
					{
						id: "crit-001",
						description: "User can authenticate with email and password in under 3 seconds",
						status: "active",
					},
					{
						id: "crit-002",
						description: "System displays clear error messages for invalid credentials within 1 second",
						status: "active",
					},
				];
				break;

			case "specific_language":
				field_hints.description = "Replace vague terms (fast, easy, simple) with specific, quantifiable language (under 200ms, 3 clicks, 5 fields)";
				field_hints.criteria = "Review criteria for vague terms and make them measurable";
				examples.description = "Authentication must complete in under 3 seconds with response time under 200ms for 95% of requests";
				examples.criteria = [
					{
						id: "crit-001",
						description: "Login form accepts email (max 254 chars) and password (8-128 chars)",
						status: "active",
					},
				];
				break;

			case "acceptance_criteria":
				field_hints.criteria = "Ensure each criterion is: (1) Testable, (2) Independent, (3) Clear, (4) Achievable";
				examples.criteria = [
					{
						id: "crit-001",
						description: "Given valid credentials, user is authenticated within 3 seconds",
						status: "active",
					},
					{
						id: "crit-002",
						description: "Given invalid credentials, system displays error within 1 second",
						status: "active",
					},
				];
				break;

			case "priority_assignment":
				field_hints.priority = "critical = must-have for launch, required = needed soon, ideal = nice to have, optional = future";
				examples.priority = "critical";
				break;

			case "review_and_refine":
				field_hints.slug = "URL-friendly identifier using lowercase letters, numbers, and hyphens only (e.g., 'user-authentication')";
				field_hints.name = "Display name for the requirement (e.g., 'User Authentication')";
				field_hints.description = "Final review - ensure description is clear, implementation-agnostic, and includes rationale";
				field_hints.criteria = "Final review - ensure all criteria are testable, independent, and measurable";
				field_hints.priority = "Final review - ensure priority reflects business value";
				examples.slug = "user-authentication";
				examples.name = "User Authentication";
				break;

			// COMPONENT STEPS
			case "analyze_requirements":
				field_hints.description = "List requirement IDs this component satisfies and explain how it addresses them";
				examples.description = "This component satisfies req-001-authentication by providing secure credential validation and session management. It addresses req-002-security through encryption and token-based auth.";
				break;

			case "define_boundaries":
				field_hints.description = "Clearly state what this component IS responsible for AND what it is NOT responsible for (min 50 chars)";
				examples.description = "Responsible for: user credential validation, session token generation, auth state management. NOT responsible for: user profile data, password reset emails, role permissions.";
				break;

			case "define_responsibilities":
				field_hints.capabilities = "List specific capabilities this component handles. Be clear about what it does AND what it delegates";
				examples.capabilities = [
					"Validate user credentials against stored hashes",
					"Generate and manage JWT session tokens",
					"Track authentication state across requests",
					"Delegate password reset to notification service",
				];
				break;

			case "define_interfaces":
				field_hints.description = "Specify inputs accepted, outputs produced, and contracts/APIs exposed (min 50 chars)";
				examples.description = "Input: username/password credentials. Output: JWT token or error code. API: POST /auth/login, POST /auth/logout, GET /auth/verify. Contracts: returns 200 with token or 401 with error details.";
				break;

			case "map_dependencies":
				field_hints.depends_on = "List internal component IDs this component depends on (e.g., ['cmp-001-user-service'])";
				field_hints.external_dependencies = "List external/third-party dependencies (e.g., ['bcrypt', 'jsonwebtoken'])";
				examples.depends_on = ["cmp-002-user-service", "cmp-003-token-manager"];
				examples.external_dependencies = ["bcrypt@5.1.0", "jsonwebtoken@9.0.0", "redis@4.6.0"];
				break;

			case "define_ownership":
				field_hints.description = "Define what data/state this component owns vs borrows from others (min 50 chars)";
				examples.description = "Owns: active session tokens, authentication attempts count. Borrows: user credentials from user-service, encryption keys from key-vault.";
				break;

			case "identify_patterns":
				field_hints.description = "List architectural patterns used (e.g., Repository, Service, Factory, Observer, Singleton)";
				examples.description = "Uses Repository pattern for credential storage, Factory pattern for token generation, and Observer pattern for auth state changes.";
				break;

			case "quality_attributes":
				field_hints.constraints = "Define performance, security, testability, and scalability requirements";
				examples.constraints = [
					"Performance: Authenticate requests in under 200ms p95",
					"Security: Hash passwords with bcrypt cost factor 12",
					"Testability: 90%+ code coverage with unit tests",
					"Scalability: Handle 1000 concurrent authentications",
				];
				break;

			case "trace_requirements":
				field_hints.description = "Explicitly link capabilities back to requirement IDs. Ensure full traceability (min 50 chars)";
				examples.description = "Capability 'credential validation' traces to req-001-authentication. Capability 'session management' traces to req-002-security and req-003-performance.";
				break;

			case "validate_refine":
				if (specType === "component") {
					field_hints.type = "app = user-facing application, service = backend service, library = shared code";
					field_hints.slug = "URL-friendly identifier (e.g., 'auth-service')";
					field_hints.name = "Display name (e.g., 'Authentication Service')";
					field_hints.description = "Final component description";
					field_hints.capabilities = "Final list of component capabilities";
					field_hints.tech_stack = "Technologies used (e.g., ['Node.js', 'Express', 'Redis'])";
					examples.type = "service";
					examples.slug = "auth-service";
					examples.name = "Authentication Service";
					examples.tech_stack = ["Node.js", "Express", "bcrypt", "jsonwebtoken"];
				} else if (specType === "plan") {
					field_hints.slug = "URL-friendly identifier (e.g., 'implement-auth')";
					field_hints.name = "Display name (e.g., 'Implement Authentication')";
					field_hints.description = "Final plan description";
					field_hints.criteria_id = "Criteria reference (e.g., 'crit-001')";
					field_hints.acceptance_criteria = "Overall plan acceptance criteria";
					field_hints.tasks = "List of tasks with IDs and descriptions";
					examples.slug = "implement-auth";
					examples.name = "Implement Authentication";
					examples.criteria_id = "crit-001";
				}
				break;

			// PLAN STEPS
			case "review_context":
				field_hints.criteria_id = "Criteria reference in format 'crit-001'";
				field_hints.description = "Review and explain which requirements/components are relevant (min 50 chars)";
				examples.criteria_id = "crit-001";
				examples.description = "Fulfilling crit-001 which requires login completion in under 3 seconds. Relevant components: cmp-001-auth-service, cmp-002-user-service.";
				break;

			case "identify_phases":
				field_hints.description = "Break work into 2-5 major phases (e.g., Setup, Core Implementation, Testing, Documentation)";
				examples.description = "Phase 1: Project setup and dependencies (1 day). Phase 2: Core auth logic implementation (3 days). Phase 3: Integration and testing (2 days). Phase 4: Documentation and deployment (1 day).";
				break;

			case "analyze_dependencies":
				field_hints.depends_on = "List plan IDs that must complete before this one (e.g., ['pln-001-database-setup'])";
				examples.depends_on = ["pln-001-setup-database", "pln-002-user-service"];
				break;

			case "break_down_tasks":
				field_hints.tasks = "Break into 0.5-3 day tasks. Each should be independently testable with clear description";
				examples.tasks = [
					{
						id: "task-001",
						description: "Set up bcrypt dependency and create password hashing utility",
					},
					{
						id: "task-002",
						description: "Implement JWT token generation and validation logic",
					},
					{
						id: "task-003",
						description: "Create login endpoint with credential validation",
					},
				];
				break;

			case "estimate_effort":
				field_hints.tasks = "Add effort estimates in days for each task. Include 20% buffer for unknowns";
				examples.tasks = [
					{
						id: "task-001",
						description: "Set up bcrypt and password hashing",
						estimated_days: 0.6,
					},
					{
						id: "task-002",
						description: "Implement JWT logic",
						estimated_days: 1.2,
					},
				];
				break;

			case "define_acceptance":
				field_hints.acceptance_criteria = "Define overall criteria for the plan. How will you know it's done?";
				examples.acceptance_criteria = "Authentication system processes login requests in under 3 seconds, handles invalid credentials gracefully, and maintains session state across requests. All tests pass with 90%+ coverage.";
				break;

			case "identify_milestones":
				field_hints.description = "Define 2-4 major deliverable checkpoints for stakeholder review";
				examples.description = "Milestone 1: Core auth logic complete with unit tests (Day 3). Milestone 2: Integration with user service complete (Day 5). Milestone 3: E2E tests passing (Day 6). Milestone 4: Production deployment ready (Day 7).";
				break;

			case "plan_testing":
				field_hints.description = "Define testing strategy: unit, integration, E2E tests. Target 90%+ coverage";
				examples.description = "Unit tests: Test credential validation, token generation, error handling in isolation. Integration tests: Test auth flow with user service. E2E tests: Full login/logout workflows. Target: 95% code coverage.";
				break;

			case "plan_risks":
				field_hints.description = "Identify 2-5 key risks with mitigation strategies";
				examples.description = "Risk 1: bcrypt performance issues under load → Mitigation: Load test early, consider caching. Risk 2: Token expiration edge cases → Mitigation: Comprehensive expiry tests. Risk 3: Integration delays with user-service → Mitigation: Mock service for parallel development.";
				break;

			case "create_timeline":
				field_hints.description = "Build schedule with phase completion dates, critical path, target completion";
				examples.description = "Phase 1 completes Day 1. Phase 2 (critical path) completes Day 4. Phase 3 completes Day 6. Phase 4 completes Day 7. Target completion: End of Week 2 with 1 day buffer.";
				break;

			case "trace_specs":
				field_hints.description = "Link tasks to requirement IDs and component IDs. Ensure full traceability (min 50 chars)";
				examples.description = "task-001 and task-002 trace to req-001-authentication. task-003 traces to cmp-001-auth-service. All tasks collectively satisfy crit-001 acceptance criterion.";
				break;

			// CONSTITUTION STEPS
			case "articles":
				field_hints.articles = "Define core principles that guide development decisions";
				examples.articles = [
					{
						id: "art-001",
						title: "Library-First Principle",
						principle: "Prefer reusable libraries over one-off implementations",
						rationale: "Reduces duplication and improves maintainability",
						examples: ["Use lodash for utilities", "Use date-fns for dates"],
						exceptions: ["Performance-critical code", "Tiny one-line helpers"],
						status: "active",
					},
				];
				break;

			case "finalize":
				if (specType === "constitution") {
					field_hints.name = "Final review - ensure constitution name is clear and descriptive";
					examples.name = "Engineering Principles Constitution";
				} else if (specType === "decision") {
					field_hints.name = "Final review - ensure decision name is clear and descriptive";
					examples.name = "Database Selection Decision";
				}
				break;

			// DECISION STEPS
			case "decision_statement":
				field_hints.decision = "State clearly what was decided (20-500 chars)";
				examples.decision = "We will use PostgreSQL as our primary database";
				break;

			case "context":
				field_hints.context = "Explain the situation that led to this decision (20-1000 chars)";
				examples.context = "We need a reliable relational database that supports complex queries and transactions. Our data model is highly relational and requires ACID compliance.";
				break;

			case "alternatives_and_consequences":
				field_hints.alternatives = "List other options that were considered";
				field_hints.consequences = "Document positive/negative outcomes, risks, and mitigation";
				examples.alternatives = ["MongoDB", "MySQL", "SQLite"];
				examples.consequences = {
					positive: ["Strong ACID compliance", "Excellent query optimizer"],
					negative: ["Higher resource usage than MySQL"],
					risks: ["Learning curve for team"],
					mitigation: ["Provide training", "Start with simple queries"],
				};
				break;

			case "relationships":
				field_hints.affects_components = "List component IDs affected by this decision (e.g., ['cmp-001-auth'])";
				field_hints.affects_requirements = "List requirement IDs affected (e.g., ['req-001-auth'])";
				field_hints.affects_plans = "List plan IDs affected (e.g., ['pln-001-setup'])";
				field_hints.informed_by_articles = "List article references that informed this decision (e.g., ['con-001-principles/art-001'])";
				field_hints.supersedes = "Optional: Decision ID this replaces (e.g., 'dec-001-old-decision')";
				examples.affects_components = ["cmp-001-database-service", "cmp-002-api-gateway"];
				examples.affects_requirements = ["req-003-data-persistence"];
				examples.affects_plans = ["pln-001-database-migration"];
				examples.informed_by_articles = ["con-001-engineering/art-002-proven-tech"];
				break;
		}

		return { field_hints, examples };
	}

	/**
	 * Generate progress summary
	 */
	private generateProgressSummary(
		currentStep: number,
		totalSteps: number,
		specType: string,
	): string {
		const percentage = Math.round((currentStep / totalSteps) * 100);
		return `Creating ${specType} - Step ${currentStep}/${totalSteps} (${percentage}% complete)`;
	}

	/**
	 * Cleanup on destroy
	 */
	destroy(): void {
		this.draftManager.destroy();
	}
}

// Global creation flow helper instance
export const creationFlowHelper = new CreationFlowHelper();
