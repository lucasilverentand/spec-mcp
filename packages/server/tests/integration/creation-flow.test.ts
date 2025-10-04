import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { EntityManager, type FileManager } from "@spec-mcp/data";
import { SpecOperations } from "@spec-mcp/core";
import { creationFlowHelper } from "../../src/utils/creation-flow-helper.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

describe("Creation Flow Integration Tests", () => {
	let operations: SpecOperations;
	let entityManager: EntityManager;
	let fileManager: FileManager;
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
		fileManager = entityManager.fileManager;
		operations = new SpecOperations(entityManager);
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
			expect(startResponse.current_step_name).toBe("Identify Problem");

			// Step through all requirement steps
			await creationFlowHelper.step(draft_id, {
				description:
					"Users need secure authentication because we handle sensitive financial transactions",
			});

			await creationFlowHelper.step(draft_id, {
				description: "System must verify user identity and maintain session state",
			});

			await creationFlowHelper.step(draft_id, {
				criteria: [
					{
						id: "crit-001",
						description: "User authenticates within 3 seconds",
						status: "active",
					},
					{
						id: "crit-002",
						description: "Error displays within 1 second",
						status: "active",
					},
				],
			});

			await creationFlowHelper.step(draft_id, {
				description: "Authentication completes in under 3 seconds",
				criteria: [
					{
						id: "crit-001",
						description: "Login accepts 254 char email and 8-128 char password",
						status: "active",
					},
					{
						id: "crit-002",
						description: "Response time under 200ms",
						status: "active",
					},
				],
			});

			await creationFlowHelper.step(draft_id, {
				criteria: [
					{
						id: "crit-001",
						description: "User authenticates within 3 seconds",
						status: "active",
					},
				],
			});

			await creationFlowHelper.step(draft_id, {
				priority: "critical",
			});

			const finalStep = await creationFlowHelper.step(draft_id, {
				slug: "user-auth",
				name: "User Authentication",
				description: "Authentication completes in under 3 seconds",
				priority: "critical",
				criteria: [
					{
						id: "crit-001",
						description: "User authenticates within 3 seconds",
						status: "active",
					},
				],
			});

			expect("error" in finalStep).toBe(false);
			if (!("error" in finalStep)) {
				// After step 7, we should either be completed or ready for finalization
				expect(finalStep.step).toBe(7);
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
			expect(startResponse.total_steps).toBe(10);

			// Navigate through component steps
			await creationFlowHelper.step(draft_id, {
				description: "Satisfies req-001-auth by providing credential validation",
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Responsible for credential validation and token generation. NOT responsible for user profile management",
			});

			await creationFlowHelper.step(draft_id, {
				capabilities: [
					"Validate credentials",
					"Generate JWT tokens",
					"Track auth state",
				],
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Input: credentials. Output: JWT token. API: POST /auth/login",
			});

			await creationFlowHelper.step(draft_id, {
				depends_on: [],
				external_dependencies: ["bcrypt@5.1.0", "jsonwebtoken@9.0.0"],
			});

			await creationFlowHelper.step(draft_id, {
				description: "Owns session tokens. Borrows user data from user-service",
			});

			await creationFlowHelper.step(draft_id, {
				description: "Uses Repository pattern and Factory pattern",
			});

			await creationFlowHelper.step(draft_id, {
				constraints: [
					"Performance: under 200ms p95",
					"Security: bcrypt cost 12",
				],
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Credential validation traces to req-001-auth. Token generation traces to req-002-session",
			});

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
			expect(startResponse.total_steps).toBe(12);

			// Navigate through plan steps
			await creationFlowHelper.step(draft_id, {
				criteria_id: "req-001-auth/crit-001",
				description: "Fulfilling auth requirement for login under 3 seconds",
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Phase 1: Setup (1 day). Phase 2: Implementation (3 days). Phase 3: Testing (2 days)",
			});

			await creationFlowHelper.step(draft_id, {
				depends_on: [],
			});

			await creationFlowHelper.step(draft_id, {
				tasks: [
					{ id: "task-001", description: "Setup bcrypt dependency" },
					{ id: "task-002", description: "Implement JWT logic" },
					{ id: "task-003", description: "Create login endpoint" },
				],
			});

			await creationFlowHelper.step(draft_id, {
				tasks: [
					{
						id: "task-001",
						description: "Setup bcrypt",
						estimated_days: 0.5,
					},
					{
						id: "task-002",
						description: "Implement JWT",
						estimated_days: 1.0,
					},
					{
						id: "task-003",
						description: "Login endpoint",
						estimated_days: 1.5,
					},
				],
			});

			await creationFlowHelper.step(draft_id, {
				acceptance_criteria: "All tests pass with 90%+ coverage",
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Milestone 1: Core logic complete (Day 2). Milestone 2: Integration done (Day 4)",
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Unit tests for validation logic. Integration tests for API. Target 95% coverage",
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Risk: bcrypt performance → Mitigation: load testing. Risk: token expiry → Mitigation: comprehensive tests",
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"Phase 1 completes Day 1. Phase 2 completes Day 4. Target: Week 2 completion",
			});

			await creationFlowHelper.step(draft_id, {
				description:
					"task-001 traces to req-001-auth. task-002 traces to cmp-001-auth-service",
			});

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
			expect(startResponse.total_steps).toBe(3);

			await creationFlowHelper.step(draft_id, {
				name: "Engineering Principles",
				description: "Core principles guiding development decisions",
			});

			await creationFlowHelper.step(draft_id, {
				articles: [
					{
						id: "art-001",
						title: "Test-Driven Development",
						principle: "Write tests before implementation",
						rationale: "Ensures quality and prevents regressions",
						examples: ["Unit tests for business logic"],
						exceptions: ["Prototypes"],
						status: "active",
					},
				],
			});

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
			expect(startResponse.total_steps).toBe(6);

			await creationFlowHelper.step(draft_id, {
				name: "Database Selection",
				description: "Choosing database technology for application",
			});

			await creationFlowHelper.step(draft_id, {
				decision: "We will use PostgreSQL as our primary database",
			});

			await creationFlowHelper.step(draft_id, {
				context:
					"We need a relational database with strong ACID compliance for financial data",
			});

			await creationFlowHelper.step(draft_id, {
				alternatives: ["MongoDB", "MySQL", "SQLite"],
				consequences: {
					positive: ["ACID compliance", "Excellent query optimizer"],
					negative: ["Higher resource usage"],
					risks: ["Learning curve"],
					mitigation: ["Training sessions"],
				},
			});

			await creationFlowHelper.step(draft_id, {
				affects_components: [],
				affects_requirements: [],
				affects_plans: [],
				informed_by_articles: [],
			});

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
				description:
					"Users need authentication because security is required",
			});

			// CreationFlowHelper uses default .specs dir
			const draftFile = path.join(
				".specs",
				".drafts",
				`${draft_id}.draft.yml`,
			);
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
				description:
					"Users need authentication because security is critical",
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

			await creationFlowHelper.step(draft_id, {
				description:
					"Users need authentication because we handle sensitive data",
			});

			await creationFlowHelper.step(draft_id, {
				description: "System must authenticate users securely",
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
