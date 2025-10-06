import { describe, expect, it } from "vitest";
import { StepValidator } from "../../src/creation-flow/step-validator.js";

describe("StepValidator", () => {
	let validator: StepValidator;

	beforeEach(() => {
		validator = new StepValidator();
	});

	describe("Requirement Steps", () => {
		describe("problem_identification", () => {
			it("should pass with valid description including rationale", () => {
				const result = validator.validate(
					"requirement",
					"problem_identification",
					{
						description:
							"Users need secure authentication because we handle sensitive financial data",
					},
				);

				expect(result.passed).toBe(true);
				expect(result.issues).toHaveLength(0);
				expect(result.strengths).toContain(
					"Clear problem identification with rationale",
				);
			});

			it("should suggest expanding very short descriptions", () => {
				const result = validator.validate(
					"requirement",
					"problem_identification",
					{
						description: "Short",
					},
				);

				expect(result.passed).toBe(true);
				expect(result.suggestions.length).toBeGreaterThan(0);
			});

			it("should suggest adding rationale when missing common keywords", () => {
				const result = validator.validate(
					"requirement",
					"problem_identification",
					{
						description:
							"This is a sufficiently long description but it lacks any explanation",
					},
				);

				expect(result.passed).toBe(true);
				expect(result.suggestions.some((s) => s.includes("WHY"))).toBe(true);
			});

			it("should accept 'so that' as rationale", () => {
				const result = validator.validate(
					"requirement",
					"problem_identification",
					{
						description:
							"Users need password reset capability so that they can regain access to locked accounts",
					},
				);

				expect(result.passed).toBe(true);
			});
		});

		describe("avoid_implementation", () => {
			it("should pass with implementation-agnostic description", () => {
				const result = validator.validate(
					"requirement",
					"avoid_implementation",
					{
						description:
							"System must authenticate users and maintain session state throughout their interaction",
					},
				);

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"Implementation-agnostic description",
				);
			});

			it("should fail when mentioning database technologies", () => {
				const result = validator.validate(
					"requirement",
					"avoid_implementation",
					{
						description:
							"Store user data in MongoDB with redis for session caching",
					},
				);

				expect(result.passed).toBe(false);
				expect(
					result.issues.some((i) => i.includes("implementation details")),
				).toBe(true);
			});

			it("should fail when mentioning frontend frameworks", () => {
				const result = validator.validate(
					"requirement",
					"avoid_implementation",
					{
						description: "Build a react component for user login",
					},
				);

				expect(result.passed).toBe(false);
			});

			it("should fail when mentioning specific UI elements", () => {
				const result = validator.validate(
					"requirement",
					"avoid_implementation",
					{
						description: "Add a login button and form with input fields",
					},
				);

				expect(result.passed).toBe(false);
			});
		});

		describe("measurability", () => {
			it("should pass with 2+ measurable criteria", () => {
				const result = validator.validate("requirement", "measurability", {
					criteria: [
						{
							id: "crit-001",
							description:
								"User can authenticate within 3 seconds with valid credentials",
							status: "active",
						},
						{
							id: "crit-002",
							description:
								"System displays error message within 1 second for invalid credentials",
							status: "active",
						},
					],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain("Well-defined measurable criteria");
			});

			it("should pass with single criterion", () => {
				const result = validator.validate("requirement", "measurability", {
					criteria: [
						{
							id: "crit-001",
							description: "User can log in successfully",
							status: "active",
						},
					],
				});

				expect(result.passed).toBe(true);
			});

			it("should suggest metrics when criteria lack measurable keywords", () => {
				const result = validator.validate("requirement", "measurability", {
					criteria: [
						{
							id: "crit-001",
							description: "Login works well",
							status: "active",
						},
						{
							id: "crit-002",
							description: "User experience is good",
							status: "active",
						},
					],
				});

				expect(result.passed).toBe(true);
				expect(result.suggestions.some((s) => s.includes("metrics"))).toBe(
					true,
				);
			});
		});

		describe("specific_language", () => {
			it("should pass without vague terms", () => {
				const result = validator.validate("requirement", "specific_language", {
					description:
						"Authentication must complete in under 3 seconds with response time under 200ms for 95% of requests",
					criteria: [
						{
							id: "crit-001",
							description:
								"Login form accepts email (max 254 chars) and password (8-128 chars)",
							status: "active",
						},
					],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"Specific, quantifiable language used",
				);
			});

			it("should suggest avoiding vague terms like 'fast'", () => {
				const result = validator.validate("requirement", "specific_language", {
					description: "System must provide fast authentication for users",
					criteria: [],
				});

				expect(result.passed).toBe(true);
				expect(result.suggestions.some((s) => s.includes("vague"))).toBe(true);
			});

			it("should suggest avoiding terms like 'easy' or 'simple'", () => {
				const result = validator.validate("requirement", "specific_language", {
					description:
						"Create an easy to use and simple authentication system that is efficient",
					criteria: [],
				});

				expect(result.passed).toBe(true);
				expect(result.suggestions.length).toBeGreaterThan(0);
			});
		});

		describe("acceptance_criteria", () => {
			it("should pass with defined criteria array", () => {
				const result = validator.validate(
					"requirement",
					"acceptance_criteria",
					{
						criteria: [
							{
								id: "crit-001",
								description:
									"Given valid credentials, user is authenticated within 3 seconds",
								status: "active",
							},
						],
					},
				);

				expect(result.passed).toBe(true);
			});

			it("should fail with empty criteria array", () => {
				const result = validator.validate(
					"requirement",
					"acceptance_criteria",
					{
						criteria: [],
					},
				);

				expect(result.passed).toBe(false);
			});
		});

		describe("priority_assignment", () => {
			it("should pass with valid priority", () => {
				const result = validator.validate(
					"requirement",
					"priority_assignment",
					{
						priority: "critical",
					},
				);

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"Clear priority assignment: critical",
				);
			});

			it("should accept all valid priority levels", () => {
				const priorities = ["critical", "required", "ideal", "optional"];

				for (const priority of priorities) {
					const result = validator.validate(
						"requirement",
						"priority_assignment",
						{ priority },
					);
					expect(result.passed).toBe(true);
				}
			});

			it("should fail with invalid priority", () => {
				const result = validator.validate(
					"requirement",
					"priority_assignment",
					{
						priority: "high",
					},
				);

				expect(result.passed).toBe(false);
			});
		});

		describe("review_and_refine", () => {
			it("should pass with all required fields", () => {
				const result = validator.validate("requirement", "review_and_refine", {
					type: "requirement",
					number: 1,
					slug: "user-authentication",
					name: "User Authentication",
					description:
						"Users need secure authentication because we handle sensitive financial data",
					priority: "critical",
					criteria: [
						{
							id: "crit-001",
							description: "User authenticates within 3 seconds",
							status: "active",
						},
					],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"Complete requirement schema validated successfully",
				);
			});

			it("should fail with invalid slug format", () => {
				const result = validator.validate("requirement", "review_and_refine", {
					type: "requirement",
					number: 1,
					slug: "User Authentication",
					name: "User Authentication",
					description: "Test description with rationale because of security",
					priority: "critical",
					criteria: [
						{ id: "crit-001", description: "Test criterion", status: "active" },
					],
				});

				expect(result.passed).toBe(false);
				expect(result.issues.some((i) => i.includes("lowercase"))).toBe(true);
			});
		});
	});

	describe("Component Steps", () => {
		describe("analyze_requirements", () => {
			it("should pass with requirement linkage description", () => {
				const result = validator.validate("component", "analyze_requirements", {
					description:
						"This component satisfies req-001-authentication by providing secure credential validation",
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"Clear requirement traceability established",
				);
			});

			it("should fail with empty description", () => {
				const result = validator.validate("component", "analyze_requirements", {
					description: "",
				});

				expect(result.passed).toBe(false);
			});
		});

		describe("define_boundaries", () => {
			it("should pass with clear boundaries description", () => {
				const result = validator.validate("component", "define_boundaries", {
					description:
						"Responsible for: credential validation, session tokens. NOT responsible for: user profiles, password reset",
				});

				expect(result.passed).toBe(true);
			});

			it("should suggest expanding very short descriptions", () => {
				const result = validator.validate("component", "define_boundaries", {
					description: "Handles auth",
				});

				expect(result.passed).toBe(true);
				expect(result.suggestions.length).toBeGreaterThan(0);
			});
		});

		describe("define_responsibilities", () => {
			it("should pass with capabilities array", () => {
				const result = validator.validate(
					"component",
					"define_responsibilities",
					{
						capabilities: [
							"Validate user credentials",
							"Generate JWT tokens",
							"Track authentication state",
						],
					},
				);

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain("3 capabilities clearly defined");
			});

			it("should fail with empty capabilities", () => {
				const result = validator.validate(
					"component",
					"define_responsibilities",
					{
						capabilities: [],
					},
				);

				expect(result.passed).toBe(false);
			});
		});

		describe("map_dependencies", () => {
			it("should pass with dependencies defined", () => {
				const result = validator.validate("component", "map_dependencies", {
					depends_on: ["svc-001-user-service"],
					external_dependencies: ["bcrypt@5.1.0", "jsonwebtoken@9.0.0"],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"Dependencies mapped: 1 internal, 2 external",
				);
			});

			it("should pass with no dependencies", () => {
				const result = validator.validate("component", "map_dependencies", {
					depends_on: [],
					external_dependencies: [],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"No dependencies - self-contained component",
				);
			});
		});

		describe("quality_attributes", () => {
			it("should pass with constraints defined", () => {
				const result = validator.validate("component", "quality_attributes", {
					constraints: [
						"Performance: Authenticate in under 200ms p95",
						"Security: bcrypt cost factor 12",
					],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain("2 quality attributes defined");
			});
		});

		describe("validate_refine", () => {
			it("should pass with all component fields", () => {
				const result = validator.validate("component", "validate_refine", {
					type: "service",
					slug: "auth-service",
					name: "Authentication Service",
					description: "Handles user authentication",
					capabilities: ["Validate credentials", "Generate tokens"],
					tech_stack: ["Node.js", "Express"],
				});

				expect(result.passed).toBe(true);
			});

			it("should fail with invalid component type", () => {
				const result = validator.validate("component", "validate_refine", {
					type: "backend",
					slug: "auth-service",
					name: "Auth Service",
					description: "Auth",
					capabilities: ["Auth"],
					tech_stack: ["Node"],
				});

				expect(result.passed).toBe(false);
			});
		});
	});

	describe("Plan Steps", () => {
		describe("review_context", () => {
			it("should pass with criteria_id and description", () => {
				const result = validator.validate("plan", "review_context", {
					criteria_id: "req-001-authentication/crit-001",
					description:
						"Fulfilling authentication requirement which needs login under 3 seconds",
				});

				expect(result.passed).toBe(true);
			});

			it("should fail with invalid criteria_id format", () => {
				const result = validator.validate("plan", "review_context", {
					criteria_id: "invalid-format",
					description: "Test description for plan context and requirements",
				});

				expect(result.passed).toBe(false);
			});
		});

		describe("break_down_tasks", () => {
			it("should pass with task array", () => {
				const result = validator.validate("plan", "break_down_tasks", {
					tasks: [
						{
							id: "task-001",
							description: "Setup dependencies",
							estimated_days: 1,
						},
						{
							id: "task-002",
							description: "Implement core logic",
							estimated_days: 2,
						},
					],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"2 tasks defined with effort estimates",
				);
			});

			it("should fail with empty tasks array", () => {
				const result = validator.validate("plan", "break_down_tasks", {
					tasks: [],
				});

				expect(result.passed).toBe(false);
			});
		});

		describe("validate_refine", () => {
			it("should pass with all plan fields", () => {
				const result = validator.validate("plan", "validate_refine", {
					slug: "implement-auth",
					name: "Implement Authentication",
					description: "Implementation plan for auth system",
					criteria_id: "req-001-auth/crit-001",
					acceptance_criteria: "All tests pass with 90% coverage",
					tasks: [{ id: "task-001", description: "Setup" }],
				});

				expect(result.passed).toBe(true);
			});
		});
	});

	describe("Constitution Steps", () => {
		describe("basic_info", () => {
			it("should pass with name and description", () => {
				const result = validator.validate("constitution", "basic_info", {
					name: "Engineering Principles",
					description: "Core principles guiding development decisions",
				});

				expect(result.passed).toBe(true);
			});

			it("should suggest expanding very short descriptions", () => {
				const result = validator.validate("constitution", "basic_info", {
					name: "Principles",
					description: "Short",
				});

				expect(result.passed).toBe(true);
				expect(result.suggestions.length).toBeGreaterThan(0);
			});
		});

		describe("articles", () => {
			it("should pass with article array", () => {
				const result = validator.validate("constitution", "articles", {
					articles: [
						{
							id: "art-001",
							title: "Library-First",
							principle: "Prefer libraries over custom code",
							rationale: "Reduces maintenance burden",
							examples: ["Use lodash"],
							exceptions: ["Performance-critical"],
							status: "active",
						},
					],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"1 principle(s) defined with rationale",
				);
			});

			it("should fail with empty articles", () => {
				const result = validator.validate("constitution", "articles", {
					articles: [],
				});

				expect(result.passed).toBe(false);
			});
		});

		describe("finalize", () => {
			it("should pass with name", () => {
				const result = validator.validate("constitution", "finalize", {
					name: "Engineering Principles Constitution",
				});

				expect(result.passed).toBe(true);
			});
		});
	});

	describe("Decision Steps", () => {
		describe("decision_statement", () => {
			it("should pass with valid decision statement", () => {
				const result = validator.validate("decision", "decision_statement", {
					decision: "We will use PostgreSQL as our primary database",
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain("Decision clearly stated");
			});

			it("should suggest expanding very short statements", () => {
				const result = validator.validate("decision", "decision_statement", {
					decision: "Use DB",
				});

				expect(result.passed).toBe(true);
				expect(result.suggestions.length).toBeGreaterThan(0);
			});

			it("should suggest shortening very long statements", () => {
				const result = validator.validate("decision", "decision_statement", {
					decision: "x".repeat(301),
				});

				expect(result.passed).toBe(true);
				expect(result.suggestions.length).toBeGreaterThan(0);
			});
		});

		describe("context", () => {
			it("should pass with valid context", () => {
				const result = validator.validate("decision", "context", {
					context:
						"We need a relational database for complex queries and ACID compliance",
				});

				expect(result.passed).toBe(true);
			});
		});

		describe("alternatives_and_consequences", () => {
			it("should pass with alternatives and consequences", () => {
				const result = validator.validate(
					"decision",
					"alternatives_and_consequences",
					{
						alternatives: ["MongoDB", "MySQL"],
						consequences: {
							positive: ["ACID compliance"],
							negative: ["Higher resource usage"],
							risks: ["Learning curve"],
							mitigation: ["Provide training"],
						},
					},
				);

				expect(result.passed).toBe(true);
			});
		});

		describe("relationships", () => {
			it("should pass with relationship arrays", () => {
				const result = validator.validate("decision", "relationships", {
					affects_components: ["svc-001-database"],
					affects_requirements: ["req-001-data"],
					affects_plans: ["pln-001-migration"],
					informed_by_articles: ["con-001-eng/art-001"],
				});

				expect(result.passed).toBe(true);
				expect(result.strengths).toContain(
					"Impact documented across 3 entities",
				);
				expect(result.strengths).toContain(
					"Aligned with 1 guiding principle(s)",
				);
			});

			it("should pass with empty relationships", () => {
				const result = validator.validate("decision", "relationships", {
					affects_components: [],
					affects_requirements: [],
					affects_plans: [],
					informed_by_articles: [],
				});

				expect(result.passed).toBe(true);
			});
		});
	});
});
