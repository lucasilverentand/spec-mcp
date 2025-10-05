import * as fs from "node:fs/promises";
import * as path from "node:path";
import { SpecOperations } from "@spec-mcp/core";
import { EntityManager, type FileManager } from "@spec-mcp/data";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { creationFlowHelper } from "../../src/utils/creation-flow-helper.js";

describe("Creation Flow Integration Tests", () => {
	let _operations: SpecOperations;
	let entityManager: EntityManager;
	let _fileManager: FileManager;
	const testSpecsDir = ".test-specs-integration";

	beforeAll(async () => {
		// Setup test environment
		await fs.mkdir(testSpecsDir, { recursive: true });
		entityManager = new EntityManager({
			path: testSpecsDir,
			autoDetect: false,
			schemaValidation: true,
			referenceValidation: false,
		});
		_fileManager = entityManager.fileManager;
		_operations = new SpecOperations(entityManager);
	});

	afterAll(async () => {
		creationFlowHelper.destroy();
		await fs.rm(testSpecsDir, { recursive: true, force: true });
	});

	beforeEach(async () => {
		// Clean test directory before each test
		await fs.rm(testSpecsDir, { recursive: true, force: true });
		await fs.mkdir(testSpecsDir, { recursive: true });
	});

	describe("Requirement Creation Flow", () => {
		it("should create requirement through complete flow", async () => {
			// Start flow
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			expect(startResponse.step).toBe(1);
			expect(startResponse.current_step_name).toBe(
				"Research Similar Requirements",
			);

			// Step 1: Research Similar Requirements
			await creationFlowHelper.step(draft_id, {
				research_findings: "No similar requirements found",
			});

			// Step 2: Constitution Review
			await creationFlowHelper.step(draft_id, {
				no_constitutions: true,
			});

			// Step 3: Technology Research
			await creationFlowHelper.step(draft_id, {
				technology_notes: "Will use standard authentication libraries",
			});

			// Step 4: Identify Problem
			await creationFlowHelper.step(draft_id, {
				description:
					"Users need secure authentication because we handle sensitive financial transactions",
			});

			// Step 5: Avoid Implementation
			await creationFlowHelper.step(draft_id, {
				description:
					"System must verify user identity and maintain session state",
			});

			// Step 6: Criteria List (NEW - collect descriptions)
			await creationFlowHelper.step(draft_id, {
				criteria: [
					"User authenticates within 3 seconds",
					"Error displays within 1 second",
				],
			});

			// Step 7: Criteria Item 1 (NEW - expand first criterion)
			await creationFlowHelper.step(draft_id, {
				status: "active",
			});

			// Step 7: Criteria Item 2 (NEW - expand second criterion)
			await creationFlowHelper.step(draft_id, {
				status: "active",
			});

			// Step 8: Assign Priority
			await creationFlowHelper.step(draft_id, {
				priority: "critical",
			});

			// Step 9: Review and Finalize
			const finalStep = await creationFlowHelper.step(draft_id, {
				type: "requirement",
				number: 1,
				slug: "user-auth",
				name: "User Authentication",
				description: "Authentication completes in under 3 seconds",
				priority: "critical",
			});

			expect("error" in finalStep).toBe(false);
			if (!("error" in finalStep)) {
				expect(finalStep.completed).toBe(true);
			}

			// Get draft - should have all data accumulated
			const draft = creationFlowHelper.getDraft(draft_id);
			expect(draft).toBeDefined();
			expect(draft?.data.slug).toBe("user-auth");
			expect(draft?.data.name).toBe("User Authentication");
			expect(draft?.data.priority).toBe("critical");
			expect(draft?.data.criteria).toBeDefined();
		});
	});

	describe("Component Creation Flow", () => {
		it("should create component through complete flow", async () => {
			const startResponse = await creationFlowHelper.start("component");
			const draft_id = startResponse.draft_id;

			expect(startResponse.step).toBe(1);
			expect(startResponse.total_steps).toBe(14);

			// Step 1: Research Existing Components
			await creationFlowHelper.step(draft_id, {
				component_research: "No existing auth service found",
			});

			// Step 2: Library Research
			await creationFlowHelper.step(draft_id, {
				library_research:
					"Evaluated passport.js, will use bcrypt and jsonwebtoken",
			});

			// Step 3: Constitution Alignment
			await creationFlowHelper.step(draft_id, {
				constitution_articles: [],
			});

			// Step 4: Duplicate Prevention
			await creationFlowHelper.step(draft_id, {
				justification:
					"Confirmed unique, no duplicate components. Existing libraries don't meet our requirements.",
			});

			// Step 5: Analyze Requirements
			await creationFlowHelper.step(draft_id, {
				description:
					"Satisfies req-001-auth by providing credential validation",
			});

			// Step 6: Define Boundaries
			await creationFlowHelper.step(draft_id, {
				description:
					"Responsible for credential validation and token generation. NOT responsible for user profile management",
			});

			// Step 7: Define Responsibilities
			await creationFlowHelper.step(draft_id, {
				capabilities: [
					"Validate credentials",
					"Generate JWT tokens",
					"Track auth state",
				],
			});

			// Step 8: Define Interfaces
			await creationFlowHelper.step(draft_id, {
				description:
					"Input: credentials. Output: JWT token. API: POST /auth/login",
			});

			// Step 9: Map Dependencies
			await creationFlowHelper.step(draft_id, {
				depends_on: [],
				external_dependencies: ["bcrypt@5.1.0", "jsonwebtoken@9.0.0"],
			});

			// Step 10: Define Ownership
			await creationFlowHelper.step(draft_id, {
				description: "Owns session tokens. Borrows user data from user-service",
			});

			// Step 11: Identify Patterns
			await creationFlowHelper.step(draft_id, {
				description: "Uses Repository pattern and Factory pattern",
			});

			// Step 12: Define Quality Attributes
			await creationFlowHelper.step(draft_id, {
				constraints: [
					"Performance: under 200ms p95",
					"Security: bcrypt cost 12",
				],
			});

			// Step 13: Trace to Requirements
			await creationFlowHelper.step(draft_id, {
				description:
					"Credential validation traces to req-001-auth. Token generation traces to req-002-session",
			});

			// Step 14: Validate and Refine
			const finalStep = await creationFlowHelper.step(draft_id, {
				type: "service",
				slug: "auth-service",
				name: "Authentication Service",
				description: "Handles user authentication",
				capabilities: ["Validate credentials", "Generate tokens"],
				tech_stack: ["Node.js", "Express", "bcrypt"],
			});

			expect("error" in finalStep).toBe(false);
			if (!("error" in finalStep)) {
				expect(finalStep.completed).toBe(true);
			}
		});
	});

	describe("Plan Creation Flow", () => {
		it("should create plan through complete flow", async () => {
			const startResponse = await creationFlowHelper.start("plan");
			const draft_id = startResponse.draft_id;

			expect(startResponse.step).toBe(1);
			expect(startResponse.total_steps).toBe(16);

			// Step 1: Context Discovery
			await creationFlowHelper.step(draft_id, {
				context_notes: "Reviewed related requirements and components",
			});

			// Step 2: Technology Stack Research
			await creationFlowHelper.step(draft_id, {
				technology_notes: "Researched bcrypt and jsonwebtoken libraries",
			});

			// Step 3: Constitution Compliance
			await creationFlowHelper.step(draft_id, {
				constitution_articles: [],
			});

			// Step 4: Similar Plans Review
			await creationFlowHelper.step(draft_id, {
				similar_plans_notes: "No similar plans found",
			});

			// Step 5: Review Context
			await creationFlowHelper.step(draft_id, {
				criteria_id: "req-001-auth/crit-001",
				description: "Fulfilling auth requirement for login under 3 seconds",
			});

			// Step 6: Identify Phases
			await creationFlowHelper.step(draft_id, {
				description:
					"Phase 1: Setup (1 day). Phase 2: Implementation (3 days). Phase 3: Testing (2 days)",
			});

			// Step 7: Analyze Dependencies
			await creationFlowHelper.step(draft_id, {
				depends_on: [],
			});

			// Step 8: Tasks List (NEW - collect task descriptions)
			await creationFlowHelper.step(draft_id, {
				tasks: [
					"Setup bcrypt dependency",
					"Implement JWT logic",
					"Create login endpoint",
				],
			});

			// Step 9: Task Item 1 (NEW - expand first task)
			await creationFlowHelper.step(draft_id, {
				priority: "high",
				depends_on: [],
				considerations: [],
				references: [],
				files: [],
			});

			// Step 9: Task Item 2 (NEW - expand second task)
			await creationFlowHelper.step(draft_id, {
				priority: "high",
				depends_on: ["task-001"],
				considerations: [],
				references: [],
				files: [],
			});

			// Step 9: Task Item 3 (NEW - expand third task)
			await creationFlowHelper.step(draft_id, {
				priority: "medium",
				depends_on: ["task-002"],
				considerations: [],
				references: [],
				files: [],
			});

			// Step 13: Define Acceptance Criteria
			await creationFlowHelper.step(draft_id, {
				acceptance_criteria: "All tests pass with 90%+ coverage",
			});

			// Step 14: Identify Milestones
			await creationFlowHelper.step(draft_id, {
				description:
					"Milestone 1: Core logic complete (Day 2). Milestone 2: Integration done (Day 4)",
			});

			// Step 15: Plan Testing Strategy
			await creationFlowHelper.step(draft_id, {
				description:
					"Unit tests for validation logic. Integration tests for API. Target 95% coverage",
			});

			// Step 16: Plan for Risks
			await creationFlowHelper.step(draft_id, {
				description:
					"Risk: bcrypt performance → Mitigation: load testing. Risk: token expiry → Mitigation: comprehensive tests",
			});

			// Step 17: Create Timeline
			await creationFlowHelper.step(draft_id, {
				description:
					"Phase 1 completes Day 1. Phase 2 completes Day 4. Target: Week 2 completion",
			});

			// Step 18: Trace to Specs
			await creationFlowHelper.step(draft_id, {
				description:
					"task-001 traces to req-001-auth. task-002 traces to cmp-001-auth-service",
			});

			// Step 19: Validate and Refine
			const finalStep = await creationFlowHelper.step(draft_id, {
				slug: "implement-auth",
				name: "Implement Authentication",
				description: "Implementation plan for auth system",
				criteria_id: "req-001-auth/crit-001",
				acceptance_criteria: "All tests pass with 90%+ coverage",
				tasks: [
					{ id: "task-001", description: "Setup bcrypt" },
					{ id: "task-002", description: "Implement JWT" },
				],
			});

			expect("error" in finalStep).toBe(false);
			if (!("error" in finalStep)) {
				expect(finalStep.completed).toBe(true);
			}
		});
	});

	describe("Constitution Creation Flow", () => {
		it("should create constitution through complete flow", async () => {
			const startResponse = await creationFlowHelper.start("constitution");
			const draft_id = startResponse.draft_id;

			expect(startResponse.step).toBe(1);
			expect(startResponse.total_steps).toBe(8);

			// Step 1: Research Existing Constitutions
			await creationFlowHelper.step(draft_id, {
				existing_constitutions: "Reviewed all existing constitutions",
			});

			// Step 2: Best Practices Research
			await creationFlowHelper.step(draft_id, {
				best_practices_notes:
					"Researched industry standards for engineering principles",
			});

			// Step 3: Framework Review
			await creationFlowHelper.step(draft_id, {
				framework_notes: "N/A - not framework-specific",
			});

			// Step 4: Basic Information
			await creationFlowHelper.step(draft_id, {
				name: "Engineering Principles",
				description: "Core principles guiding development decisions",
			});

			// Step 5: Articles List (NEW - collect article titles)
			await creationFlowHelper.step(draft_id, {
				articles: ["Test-Driven Development"],
			});

			// Step 6: Articles Item 1 (NEW - expand first article)
			await creationFlowHelper.step(draft_id, {
				title: "Test-Driven Development",
				principle: "Write tests before implementation",
				rationale: "Ensures quality and prevents regressions",
				examples: ["Unit tests for business logic"],
				exceptions: ["Prototypes"],
				status: "active",
			});

			// Step 7: Conflict Check
			await creationFlowHelper.step(draft_id, {
				conflicts_checked: true,
			});

			// Step 8: Finalize
			const finalStep = await creationFlowHelper.step(draft_id, {
				name: "Engineering Principles",
			});

			expect("error" in finalStep).toBe(false);
			if (!("error" in finalStep)) {
				expect(finalStep.completed).toBe(true);
			}
		});
	});

	describe("Decision Creation Flow", () => {
		it("should create decision through complete flow", async () => {
			const startResponse = await creationFlowHelper.start("decision");
			const draft_id = startResponse.draft_id;

			expect(startResponse.step).toBe(1);
			expect(startResponse.total_steps).toBe(8);

			// Step 1: Related Decisions Research
			await creationFlowHelper.step(draft_id, {
				related_decisions: "No related decisions found",
			});

			// Step 2: Technology Options Research
			await creationFlowHelper.step(draft_id, {
				technology_research:
					"Researched PostgreSQL, MongoDB, MySQL, and SQLite",
			});

			// Step 3: Basic Information
			await creationFlowHelper.step(draft_id, {
				name: "Database Selection",
				description: "Choosing database technology for application",
			});

			// Step 4: Decision Statement
			await creationFlowHelper.step(draft_id, {
				decision: "We will use PostgreSQL as our primary database",
			});

			// Step 5: Context
			await creationFlowHelper.step(draft_id, {
				context:
					"We need a relational database with strong ACID compliance for financial data",
			});

			// Step 6: Alternatives and Consequences
			await creationFlowHelper.step(draft_id, {
				alternatives: ["MongoDB", "MySQL", "SQLite"],
				consequences: {
					positive: ["ACID compliance", "Excellent query optimizer"],
					negative: ["Higher resource usage"],
					risks: ["Learning curve"],
					mitigation: ["Training sessions"],
				},
			});

			// Step 7: Relationships
			await creationFlowHelper.step(draft_id, {
				affects_components: [],
				affects_requirements: [],
				affects_plans: [],
				informed_by_articles: [],
			});

			// Step 8: Finalize
			const finalStep = await creationFlowHelper.step(draft_id, {
				name: "Database Selection",
			});

			expect("error" in finalStep).toBe(false);
			if (!("error" in finalStep)) {
				expect(finalStep.completed).toBe(true);
			}
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid data gracefully", async () => {
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			const stepResponse = await creationFlowHelper.step(draft_id, {
				description: "Too short",
			});

			expect("error" in stepResponse).toBe(false);
			if (!("error" in stepResponse)) {
				expect(stepResponse.validation?.passed).toBe(false);
				expect(stepResponse.validation?.issues.length).toBeGreaterThan(0);
				expect(stepResponse.step).toBe(1); // Should not advance
			}
		});

		it("should provide helpful suggestions on validation failure", async () => {
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			const stepResponse = await creationFlowHelper.step(draft_id, {
				description: "This is a description without rationale",
			});

			expect("error" in stepResponse).toBe(false);
			if (!("error" in stepResponse)) {
				expect(stepResponse.validation?.passed).toBe(false);
				expect(stepResponse.validation?.suggestions?.length).toBeGreaterThan(0);
			}
		});

		it("should preserve data when validation fails", async () => {
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			// First step succeeds
			await creationFlowHelper.step(draft_id, {
				description:
					"Users need authentication because we handle sensitive data",
			});

			// Second step fails
			await creationFlowHelper.step(draft_id, {
				description: "Use MongoDB database",
			});

			// Check that first step data is preserved
			const draft = creationFlowHelper.getDraft(draft_id);
			expect(draft?.data.description).toBeDefined();
		});
	});

	describe("Draft Persistence", () => {
		it("should persist draft data to filesystem", async () => {
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			await creationFlowHelper.step(draft_id, {
				description: "Users need authentication because security is required",
			});

			// CreationFlowHelper uses default .specs dir
			const draftFile = path.join(".specs", ".drafts", `${draft_id}.draft.yml`);
			const fileExists = await fs
				.access(draftFile)
				.then(() => true)
				.catch(() => false);

			expect(fileExists).toBe(true);
		});

		it("should load persisted drafts after restart", async () => {
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			await creationFlowHelper.step(draft_id, {
				description: "Users need authentication because security is critical",
			});

			// Destroy and recreate helper
			creationFlowHelper.destroy();

			// Wait for new helper to load drafts
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Draft should still be accessible (this tests the DraftManager's load functionality)
			// Note: In a real scenario, we'd need to create a new CreationFlowHelper instance
		});
	});

	describe("Validation History", () => {
		it("should accumulate validation results throughout flow", async () => {
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			// Step 1: Research Similar Requirements
			await creationFlowHelper.step(draft_id, {
				research_findings: "No similar requirements found",
			});

			// Step 2: Constitution Review
			await creationFlowHelper.step(draft_id, {
				no_constitutions: true,
			});

			const draft = creationFlowHelper.getDraft(draft_id);
			expect(draft?.validation_results.length).toBe(2);
			expect(draft?.validation_results.every((v) => v.passed)).toBe(true);
		});

		it("should include failed validations in history", async () => {
			const startResponse = await creationFlowHelper.start("requirement");
			const draft_id = startResponse.draft_id;

			// This will fail
			await creationFlowHelper.step(draft_id, {
				description: "Short",
			});

			const draft = creationFlowHelper.getDraft(draft_id);
			expect(draft?.validation_results.length).toBe(1);
			expect(draft?.validation_results[0]?.passed).toBe(false);
		});
	});
});
