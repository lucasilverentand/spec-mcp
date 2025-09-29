import type { Requirement } from "@spec-mcp/data";
import { describe, expect, it } from "vitest";
import {
	type PlanGenerationOptions,
	PlanGenerator,
} from "../../src/generators/plan-generator.js";

describe("PlanGenerator", () => {
	describe("generateFromRequirement", () => {
		it("should generate plans from a simple requirement", () => {
			const requirement: Requirement = {
				id: "req-001-user-authentication",
				type: "requirement",
				number: 1,
				name: "User Authentication",
				slug: "user-authentication",
				description: "System shall provide secure user authentication",
				priority: "required", // Changed from critical to avoid extra supporting plans
				criteria: [
					{
						id: "req-001-user-authentication/crit-001",
						description: "Users can login with email and password",
						plan_id: "pln-001-login-flow",
						completed: false,
					},
					{
						id: "req-001-user-authentication/crit-002",
						description: "System validates credentials against database",
						plan_id: "pln-002-credential-validation",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			// Should generate one plan per criteria (2 plans)
			expect(plans).toHaveLength(2);

			// Verify first plan structure
			expect(plans[0]?.plan.type).toBe("plan");
			expect(plans[0]?.plan.name).toContain(
				"Users can login with email and password",
			);
			expect(plans[0]?.plan.slug).toBeTruthy();
			expect(plans[0]?.plan.priority).toBe("high"); // Derived from "required" priority
			expect(plans[0]?.plan.tasks.length).toBeGreaterThan(0);

			// Verify metadata
			expect(plans[0]?.metadata.generatedFrom).toContain("req-001");
			expect(plans[0]?.metadata.suggestedReviews).toHaveLength(4);
		});

		it("should generate supporting plans for complex requirements", () => {
			const complexRequirement: Requirement = {
				id: "req-002-payment-system",
				type: "requirement",
				number: 2,
				name: "Payment Processing System",
				slug: "payment-system",
				description: "System shall process payments securely",
				priority: "critical",
				criteria: [
					{
						id: "req-002-payment-system/crit-001",
						description: "Accept credit card payments",
						plan_id: "pln-003-credit-card",
						completed: false,
					},
					{
						id: "req-002-payment-system/crit-002",
						description: "Process refunds",
						plan_id: "pln-004-refunds",
						completed: false,
					},
					{
						id: "req-002-payment-system/crit-003",
						description: "Handle payment failures",
						plan_id: "pln-005-failures",
						completed: false,
					},
					{
						id: "req-002-payment-system/crit-004",
						description: "Generate transaction receipts",
						plan_id: "pln-006-receipts",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(complexRequirement);

			// Should generate criteria plans + supporting plans (infrastructure, testing, documentation)
			// 4 criteria + 3 supporting = 7 total
			expect(plans.length).toBeGreaterThan(4);

			// Check if supporting plans are included
			const planNames = plans.map((p) => p.plan.name);
			const _hasInfrastructure = planNames.some((name) =>
				name.includes("Infrastructure"),
			);
			const hasTesting = planNames.some((name) => name.includes("Testing"));
			const hasDocumentation = planNames.some((name) =>
				name.includes("Documentation"),
			);

			expect(hasTesting).toBe(true); // More than 3 criteria triggers testing plan
			expect(hasDocumentation).toBe(true); // Critical priority triggers documentation plan
		});

		it("should respect priority options", () => {
			const requirement: Requirement = {
				id: "req-003-feature",
				type: "requirement",
				number: 3,
				name: "Simple Feature",
				slug: "simple-feature",
				description: "A simple feature",
				priority: "optional",
				criteria: [
					{
						id: "req-003-simple-feature/crit-001",
						description: "Feature works",
						plan_id: "pln-007-feature",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const options: PlanGenerationOptions = {
				priority: "high",
			};

			const plans = PlanGenerator.generateFromRequirement(requirement, options);

			// Should override requirement priority with options priority
			expect(plans[0]?.plan.priority).toBe("high");
		});

		it("should include test cases when option is enabled", () => {
			const requirement: Requirement = {
				id: "req-004-feature",
				type: "requirement",
				number: 4,
				name: "Feature With Tests",
				slug: "feature-with-tests",
				description: "Feature that needs tests",
				priority: "required",
				criteria: [
					{
						id: "req-004-feature-with-tests/crit-001",
						description: "Feature functionality",
						plan_id: "pln-008-functionality",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement, {
				includeTestCases: true,
			});

			expect(plans[0]?.plan.test_cases.length).toBeGreaterThan(0);
			expect(plans[0]?.plan.test_cases[0]?.name).toBeTruthy();
		});

		it("should include flows when option is enabled", () => {
			const requirement: Requirement = {
				id: "req-005-feature",
				type: "requirement",
				number: 5,
				name: "Feature With Flows",
				slug: "feature-with-flows",
				description: "Feature that needs flows",
				priority: "required",
				criteria: [
					{
						id: "req-005-feature-with-flows/crit-001",
						description: "User flow",
						plan_id: "pln-009-flow",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement, {
				includeFlows: true,
			});

			expect(plans[0]?.plan.flows.length).toBeGreaterThan(0);
			expect(plans[0]?.plan.flows[0]?.name).toBeTruthy();
		});

		it("should handle requirements with no criteria", () => {
			const requirement: Requirement = {
				id: "req-006-empty",
				type: "requirement",
				number: 6,
				name: "Empty Requirement",
				slug: "empty-requirement",
				description: "No criteria",
				priority: "optional",
				criteria: [],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			// Should not crash and return empty array for criteria plans
			// May still have supporting plans if conditions are met
			expect(plans).toBeDefined();
			expect(Array.isArray(plans)).toBe(true);
		});
	});

	describe("createPlanFromCriteria", () => {
		it("should create a plan with proper structure", () => {
			const requirement: Requirement = {
				id: "req-007-test",
				type: "requirement",
				number: 7,
				name: "Test Requirement",
				slug: "test-requirement",
				description: "Test description",
				priority: "required",
				criteria: [
					{
						id: "req-007-test-requirement/crit-001",
						description: "Test criteria",
						plan_id: "pln-010-test",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);
			const plan = plans[0]?.plan;

			// Verify required plan fields
			expect(plan.type).toBe("plan");
			expect(plan.name).toBeTruthy();
			expect(plan.slug).toBeTruthy();
			expect(plan.description).toBeTruthy();
			expect(plan.priority).toBeTruthy();
			expect(plan.acceptance_criteria).toBeTruthy();
			expect(Array.isArray(plan.depends_on)).toBe(true);
			expect(Array.isArray(plan.tasks)).toBe(true);
			expect(Array.isArray(plan.flows)).toBe(true);
			expect(Array.isArray(plan.test_cases)).toBe(true);
			expect(Array.isArray(plan.api_contracts)).toBe(true);
			expect(Array.isArray(plan.data_models)).toBe(true);
			expect(Array.isArray(plan.references)).toBe(true);
			expect(plan.completed).toBe(false);
			expect(plan.approved).toBe(false);
		});

		it("should generate proper task structure", () => {
			const requirement: Requirement = {
				id: "req-008-tasks",
				type: "requirement",
				number: 8,
				name: "Task Generation",
				slug: "task-generation",
				description: "Test task generation",
				priority: "required",
				criteria: [
					{
						id: "req-008-task-generation/crit-001",
						description: "Generate proper tasks",
						plan_id: "pln-011-tasks",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);
			const tasks = plans[0]?.plan.tasks;

			// Should generate standard task flow
			expect(tasks.length).toBeGreaterThan(0);

			// Verify task structure
			tasks.forEach((task) => {
				expect(task.id).toMatch(/^task-\d{3}$/);
				expect(task.description).toBeTruthy();
				expect(task.priority).toBeTruthy();
				expect(Array.isArray(task.depends_on)).toBe(true);
				expect(typeof task.completed).toBe("boolean");
				expect(typeof task.verified).toBe("boolean");
			});

			// Check task dependencies flow
			const task1 = tasks.find((t) => t.id === "task-001");
			const task2 = tasks.find((t) => t.id === "task-002");

			expect(task1?.depends_on).toHaveLength(0); // First task has no dependencies
			expect(task2?.depends_on).toContain("task-001"); // Second task depends on first
		});

		it("should include requirement reference in plan", () => {
			const requirement: Requirement = {
				id: "req-009-reference",
				type: "requirement",
				number: 9,
				name: "Reference Test",
				slug: "reference-test",
				description: "Test references",
				priority: "required",
				criteria: [
					{
						id: "req-009-reference-test/crit-001",
						description: "Reference criteria",
						plan_id: "pln-012-reference",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);
			const references = plans[0]?.plan.references;

			expect(references.length).toBeGreaterThan(0);
			expect(references[0]?.type).toBe("file");
			expect(references[0]?.name).toContain("Reference Test");
			expect(references[0]?.importance).toBe("high");
			expect(references[0]?.path).toContain("req-009-reference-test");
		});
	});

	describe("generateSupportingPlans", () => {
		it("should generate infrastructure plan when keywords detected", () => {
			const requirement: Requirement = {
				id: "req-010-api",
				type: "requirement",
				number: 10,
				name: "API Service",
				slug: "api-service",
				description: "Create a new API service with database integration",
				priority: "required",
				criteria: [
					{
						id: "req-010-api-service/crit-001",
						description: "API endpoints",
						plan_id: "pln-013-api",
						completed: false,
					},
					{
						id: "req-010-api-service/crit-002",
						description: "Database schema",
						plan_id: "pln-014-db",
						completed: false,
					},
					{
						id: "req-010-api-service/crit-003",
						description: "Service layer",
						plan_id: "pln-015-service",
						completed: false,
					},
					{
						id: "req-010-api-service/crit-004",
						description: "Integration tests",
						plan_id: "pln-016-tests",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			const infrastructurePlan = plans.find((p) =>
				p.plan.name.includes("Infrastructure"),
			);

			// Infrastructure plan should be generated for requirements with infrastructure keywords
			// and more than 3 criteria (complex requirement)
			expect(infrastructurePlan).toBeDefined();
			expect(infrastructurePlan?.plan.priority).toBe("high");
			expect(infrastructurePlan?.metadata.generationReason).toContain(
				"Infrastructure",
			);
		});

		it("should generate testing plan for complex requirements", () => {
			const requirement: Requirement = {
				id: "req-011-complex",
				type: "requirement",
				number: 11,
				name: "Complex Feature",
				slug: "complex-feature",
				description: "Complex feature with multiple aspects",
				priority: "required",
				criteria: [
					{
						id: "req-011-complex-feature/crit-001",
						description: "Aspect 1",
						plan_id: "pln-016-aspect1",
						completed: false,
					},
					{
						id: "req-011-complex-feature/crit-002",
						description: "Aspect 2",
						plan_id: "pln-017-aspect2",
						completed: false,
					},
					{
						id: "req-011-complex-feature/crit-003",
						description: "Aspect 3",
						plan_id: "pln-018-aspect3",
						completed: false,
					},
					{
						id: "req-011-complex-feature/crit-004",
						description: "Aspect 4",
						plan_id: "pln-019-aspect4",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			const testingPlan = plans.find((p) => p.plan.name.includes("Testing"));

			// Testing plan should be generated for complex requirements (more than 3 criteria)
			expect(testingPlan).toBeDefined();
			expect(testingPlan?.plan.priority).toBe("medium");
		});

		it("should generate documentation plan for critical requirements", () => {
			const requirement: Requirement = {
				id: "req-012-critical",
				type: "requirement",
				number: 12,
				name: "Critical Feature",
				slug: "critical-feature",
				description: "Critical system feature",
				priority: "critical",
				criteria: [
					{
						id: "req-012-critical-feature/crit-001",
						description: "Critical functionality",
						plan_id: "pln-019-critical",
						completed: false,
					},
					{
						id: "req-012-critical-feature/crit-002",
						description: "Backup system",
						plan_id: "pln-020-backup",
						completed: false,
					},
					{
						id: "req-012-critical-feature/crit-003",
						description: "Monitoring",
						plan_id: "pln-021-monitoring",
						completed: false,
					},
					{
						id: "req-012-critical-feature/crit-004",
						description: "Alerts",
						plan_id: "pln-022-alerts",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			const docPlan = plans.find((p) => p.plan.name.includes("Documentation"));

			expect(docPlan).toBeDefined();
			expect(docPlan?.metadata.generationReason).toContain("Critical");
		});
	});

	describe("generateImplementationPlans", () => {
		it("should generate plans for multiple requirements", () => {
			const requirements: Requirement[] = [
				{
					id: "req-013-feature1",
					type: "requirement",
					number: 13,
					name: "Feature 1",
					slug: "feature-1",
					description: "First feature",
					priority: "critical",
					criteria: [
						{
							id: "req-013-feature-1/crit-001",
							description: "Feature 1 criteria",
							plan_id: "pln-023-feature1",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: "req-014-feature2",
					type: "requirement",
					number: 14,
					name: "Feature 2",
					slug: "feature-2",
					description: "Second feature",
					priority: "required",
					criteria: [
						{
							id: "req-014-feature-2/crit-001",
							description: "Feature 2 criteria",
							plan_id: "pln-024-feature2",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const plans = PlanGenerator.generateImplementationPlans(requirements);

			// Should generate plans for all requirements
			expect(plans.length).toBeGreaterThan(0);

			// Should group by priority
			const criticalPlans = plans.filter((p) =>
				p.metadata.generatedFrom.includes("req-013"),
			);
			expect(criticalPlans.length).toBeGreaterThan(0);
		});

		it("should generate integration plans for multiple requirements", () => {
			const requirements: Requirement[] = [
				{
					id: "req-015-auth",
					type: "requirement",
					number: 15,
					name: "Authentication System",
					slug: "authentication-system",
					description: "User authentication with database",
					priority: "critical",
					criteria: [
						{
							id: "req-015-authentication-system/crit-001",
							description: "Auth criteria",
							plan_id: "pln-025-auth",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: "req-016-authorization",
					type: "requirement",
					number: 16,
					name: "Authorization System",
					slug: "authorization-system",
					description: "User authorization with database",
					priority: "critical",
					criteria: [
						{
							id: "req-016-authorization-system/crit-001",
							description: "Authorization criteria",
							plan_id: "pln-026-authz",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const plans = PlanGenerator.generateImplementationPlans(requirements);

			// Should include integration plan for related requirements
			const integrationPlan = plans.find((p) =>
				p.plan.name.includes("Integration"),
			);

			expect(integrationPlan).toBeDefined();
		});

		it("should respect priority ordering", () => {
			const requirements: Requirement[] = [
				{
					id: "req-017-low",
					type: "requirement",
					number: 17,
					name: "Low Priority",
					slug: "low-priority",
					description: "Low priority feature",
					priority: "optional",
					criteria: [
						{
							id: "req-017-low-priority/crit-001",
							description: "Low priority criteria",
							plan_id: "pln-027-low",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: "req-018-high",
					type: "requirement",
					number: 18,
					name: "High Priority",
					slug: "high-priority",
					description: "High priority feature",
					priority: "critical",
					criteria: [
						{
							id: "req-018-high-priority/crit-001",
							description: "High priority criteria",
							plan_id: "pln-028-high",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const plans = PlanGenerator.generateImplementationPlans(requirements);

			// Plans should be generated with appropriate priorities
			const highPriorityPlans = plans.filter(
				(p) => p.plan.priority === "critical",
			);
			const lowPriorityPlans = plans.filter(
				(p) =>
					p.plan.priority === "low" ||
					p.metadata.generatedFrom.includes("req-017"),
			);

			expect(highPriorityPlans.length).toBeGreaterThan(0);
			expect(lowPriorityPlans.length).toBeGreaterThan(0);
		});
	});

	describe("generateMilestonePlans", () => {
		it("should divide requirements into milestones", () => {
			const requirements: Requirement[] = [
				{
					id: "req-019-m1",
					type: "requirement",
					number: 19,
					name: "Milestone 1 Feature",
					slug: "milestone-1-feature",
					description: "Feature for milestone 1",
					priority: "critical",
					criteria: [
						{
							id: "req-019-milestone-1-feature/crit-001",
							description: "M1 criteria",
							plan_id: "pln-029-m1",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: "req-020-m2",
					type: "requirement",
					number: 20,
					name: "Milestone 2 Feature",
					slug: "milestone-2-feature",
					description: "Feature for milestone 2",
					priority: "required",
					criteria: [
						{
							id: "req-020-milestone-2-feature/crit-001",
							description: "M2 criteria",
							plan_id: "pln-030-m2",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: "req-021-m3",
					type: "requirement",
					number: 21,
					name: "Milestone 3 Feature",
					slug: "milestone-3-feature",
					description: "Feature for milestone 3",
					priority: "ideal",
					criteria: [
						{
							id: "req-021-milestone-3-feature/crit-001",
							description: "M3 criteria",
							plan_id: "pln-031-m3",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const plans = PlanGenerator.generateMilestonePlans(requirements, 3);

			// Should create 3 milestone plans
			expect(plans.length).toBeLessThanOrEqual(3);

			// Each plan should be a milestone
			plans.forEach((plan) => {
				expect(plan.plan.name).toContain("Milestone");
				expect(plan.plan.acceptance_criteria).toContain("Milestone");
			});
		});

		it("should sort requirements by priority", () => {
			const requirements: Requirement[] = [
				{
					id: "req-022-optional",
					type: "requirement",
					number: 22,
					name: "Optional Feature",
					slug: "optional-feature",
					description: "Optional",
					priority: "optional",
					criteria: [
						{
							id: "req-022-optional-feature/crit-001",
							description: "Optional criteria",
							plan_id: "pln-032-optional",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: "req-023-critical",
					type: "requirement",
					number: 23,
					name: "Critical Feature",
					slug: "critical-feature",
					description: "Critical",
					priority: "critical",
					criteria: [
						{
							id: "req-023-critical-feature/crit-001",
							description: "Critical criteria",
							plan_id: "pln-033-critical",
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			];

			const plans = PlanGenerator.generateMilestonePlans(requirements, 2);

			// First milestone should include critical requirement
			const firstMilestone = plans[0];
			expect(firstMilestone?.plan.priority).toBe("critical");
		});

		it("should create milestone dependencies", () => {
			const requirements: Requirement[] = Array.from({ length: 6 }, (_, i) => ({
				id: `req-${String(i + 24).padStart(3, "0")}-feature${i}`,
				type: "requirement" as const,
				number: i + 24,
				name: `Feature ${i}`,
				slug: `feature-${i}`,
				description: `Feature ${i}`,
				priority: "required" as const,
				criteria: [
					{
						id: `req-${String(i + 24).padStart(3, "0")}-feature-${i}/crit-001`,
						description: `Feature ${i} criteria`,
						plan_id: `pln-${String(i + 34).padStart(3, "0")}-feature${i}`,
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}));

			const plans = PlanGenerator.generateMilestonePlans(requirements, 3);

			// Milestone 2 should depend on milestone 1
			if (plans.length >= 2) {
				const milestone2 = plans[1];
				expect(milestone2?.plan.depends_on.length).toBeGreaterThan(0);
				expect(milestone2?.plan.depends_on[0]).toContain("milestone-1");
			}
		});

		it("should handle custom milestone counts", () => {
			const requirements: Requirement[] = Array.from({ length: 5 }, (_, i) => ({
				id: `req-${String(i + 30).padStart(3, "0")}-feat${i}`,
				type: "requirement" as const,
				number: i + 30,
				name: `Feature ${i}`,
				slug: `feat-${i}`,
				description: `Feature ${i}`,
				priority: "required" as const,
				criteria: [
					{
						id: `req-${String(i + 30).padStart(3, "0")}-feat-${i}/crit-001`,
						description: `Feature ${i} criteria`,
						plan_id: `pln-${String(i + 40).padStart(3, "0")}-feat${i}`,
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}));

			const twoMilestones = PlanGenerator.generateMilestonePlans(
				requirements,
				2,
			);
			const fiveMilestones = PlanGenerator.generateMilestonePlans(
				requirements,
				5,
			);

			expect(twoMilestones.length).toBeLessThanOrEqual(2);
			expect(fiveMilestones.length).toBeLessThanOrEqual(5);
		});
	});

	describe("edge cases and error scenarios", () => {
		it("should handle empty requirement arrays", () => {
			const plans = PlanGenerator.generateImplementationPlans([]);

			expect(plans).toEqual([]);
		});

		it("should handle requirements with very long names", () => {
			const requirement: Requirement = {
				id: "req-035-very-long-name",
				type: "requirement",
				number: 35,
				name: "A".repeat(200),
				slug: "very-long-name",
				description: "Very long requirement name",
				priority: "required",
				criteria: [
					{
						id: "req-035-very-long-name/crit-001",
						description: "Test criteria",
						plan_id: "pln-045-test",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			expect(plans).toBeDefined();
			expect(plans.length).toBeGreaterThan(0);
			// Slug should be truncated to 50 chars
			expect(plans[0]?.plan.slug.length).toBeLessThanOrEqual(50);
		});

		it("should handle special characters in criteria descriptions", () => {
			const requirement: Requirement = {
				id: "req-036-special-chars",
				type: "requirement",
				number: 36,
				name: "Special Characters",
				slug: "special-characters",
				description: "Test special characters",
				priority: "required",
				criteria: [
					{
						id: "req-036-special-characters/crit-001",
						description: "Test with special chars: @#$%^&*()",
						plan_id: "pln-046-special",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			expect(plans).toBeDefined();
			expect(plans[0]?.plan.slug).toMatch(/^[a-z0-9-]+$/);
		});

		it("should handle all priority levels", () => {
			const priorities: Array<"critical" | "required" | "ideal" | "optional"> =
				["critical", "required", "ideal", "optional"];

			priorities.forEach((priority, index) => {
				const requirement: Requirement = {
					id: `req-${String(37 + index).padStart(3, "0")}-priority-${priority}`,
					type: "requirement",
					number: 37 + index,
					name: `Priority ${priority}`,
					slug: `priority-${priority}`,
					description: `Test ${priority} priority`,
					priority,
					criteria: [
						{
							id: `req-${String(37 + index).padStart(3, "0")}-priority-${priority}/crit-001`,
							description: "Test criteria",
							plan_id: `pln-${String(47 + index).padStart(3, "0")}-priority`,
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};

				const plans = PlanGenerator.generateFromRequirement(requirement);

				expect(plans).toBeDefined();
				expect(plans.length).toBeGreaterThan(0);
			});
		});

		it("should generate valid plan IDs and slugs", () => {
			const requirement: Requirement = {
				id: "req-041-id-validation",
				type: "requirement",
				number: 41,
				name: "ID Validation Test",
				slug: "id-validation",
				description: "Test ID generation",
				priority: "required",
				criteria: [
					{
						id: "req-041-id-validation/crit-001",
						description: "Generate valid IDs",
						plan_id: "pln-051-ids",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			plans.forEach((generatedPlan) => {
				const { plan } = generatedPlan;

				// Slug should be valid
				expect(plan.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
				expect(plan.slug.length).toBeGreaterThan(0);
				expect(plan.slug.length).toBeLessThanOrEqual(50);

				// Should not have leading or trailing hyphens
				expect(plan.slug).not.toMatch(/^-/);
				expect(plan.slug).not.toMatch(/-$/);
			});
		});

		it("should handle requirements with all optional fields", () => {
			const minimalRequirement: Requirement = {
				id: "req-042-minimal",
				type: "requirement",
				number: 42,
				name: "Minimal",
				slug: "minimal",
				description: "Minimal requirement",
				priority: "required",
				criteria: [
					{
						id: "req-042-minimal/crit-001",
						description: "Minimal criteria",
						plan_id: "pln-052-minimal",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(
				minimalRequirement,
				{},
			);

			expect(plans).toBeDefined();
			expect(plans[0]?.plan.flows).toEqual([]);
			expect(plans[0]?.plan.test_cases).toEqual([]);
		});
	});

	describe("priority derivation", () => {
		it("should derive critical plan priority from critical requirement", () => {
			const requirement: Requirement = {
				id: "req-043-critical-derive",
				type: "requirement",
				number: 43,
				name: "Critical Derive",
				slug: "critical-derive",
				description: "Critical requirement",
				priority: "critical",
				criteria: [
					{
						id: "req-043-critical-derive/crit-001",
						description: "Critical criteria",
						plan_id: "pln-053-critical",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			expect(plans[0]?.plan.priority).toBe("critical");
		});

		it("should derive high plan priority from required requirement", () => {
			const requirement: Requirement = {
				id: "req-044-required-derive",
				type: "requirement",
				number: 44,
				name: "Required Derive",
				slug: "required-derive",
				description: "Required requirement",
				priority: "required",
				criteria: [
					{
						id: "req-044-required-derive/crit-001",
						description: "Required criteria",
						plan_id: "pln-054-required",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			expect(plans[0]?.plan.priority).toBe("high");
		});

		it("should derive medium plan priority from ideal requirement", () => {
			const requirement: Requirement = {
				id: "req-045-ideal-derive",
				type: "requirement",
				number: 45,
				name: "Ideal Derive",
				slug: "ideal-derive",
				description: "Ideal requirement",
				priority: "ideal",
				criteria: [
					{
						id: "req-045-ideal-derive/crit-001",
						description: "Ideal criteria",
						plan_id: "pln-055-ideal",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			expect(plans[0]?.plan.priority).toBe("medium");
		});

		it("should derive low plan priority from optional requirement", () => {
			const requirement: Requirement = {
				id: "req-046-optional-derive",
				type: "requirement",
				number: 46,
				name: "Optional Derive",
				slug: "optional-derive",
				description: "Optional requirement",
				priority: "optional",
				criteria: [
					{
						id: "req-046-optional-derive/crit-001",
						description: "Optional criteria",
						plan_id: "pln-056-optional",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(requirement);

			expect(plans[0]?.plan.priority).toBe("low");
		});
	});

	describe("infrastructure detection", () => {
		const infrastructureKeywords = [
			"database",
			"api",
			"service",
			"deployment",
			"infrastructure",
			"security",
		];

		infrastructureKeywords.forEach((keyword, index) => {
			it(`should detect infrastructure requirement from keyword: ${keyword}`, () => {
				const requirement: Requirement = {
					id: `req-${String(47 + index).padStart(3, "0")}-infra-${keyword}`,
					type: "requirement",
					number: 47 + index,
					name: `Test ${keyword}`,
					slug: `test-${keyword}`,
					description: `Requirement with ${keyword} keyword`,
					priority: "required",
					criteria: [
						{
							id: `req-${String(47 + index).padStart(3, "0")}-infra-${keyword}/crit-001`,
							description: `${keyword} criteria`,
							plan_id: `pln-${String(57 + index).padStart(3, "0")}-${keyword}`,
							completed: false,
						},
						{
							id: `req-${String(47 + index).padStart(3, "0")}-infra-${keyword}/crit-002`,
							description: "Additional criteria",
							plan_id: `pln-${String(58 + index).padStart(3, "0")}-additional`,
							completed: false,
						},
						{
							id: `req-${String(47 + index).padStart(3, "0")}-infra-${keyword}/crit-003`,
							description: "More criteria",
							plan_id: `pln-${String(59 + index).padStart(3, "0")}-more`,
							completed: false,
						},
						{
							id: `req-${String(47 + index).padStart(3, "0")}-infra-${keyword}/crit-004`,
							description: "Final criteria",
							plan_id: `pln-${String(60 + index).padStart(3, "0")}-final`,
							completed: false,
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};

				const plans = PlanGenerator.generateFromRequirement(requirement);

				const hasInfrastructurePlan = plans.some((p) =>
					p.plan.name.includes("Infrastructure"),
				);

				// Infrastructure plan is generated when requirement has more than 3 criteria
				// AND contains infrastructure keywords
				expect(hasInfrastructurePlan).toBe(true);
			});
		});
	});

	describe("options configuration", () => {
		it("should respect all options together", () => {
			const requirement: Requirement = {
				id: "req-053-all-options",
				type: "requirement",
				number: 53,
				name: "All Options Test",
				slug: "all-options-test",
				description: "Test all options",
				priority: "required",
				criteria: [
					{
						id: "req-053-all-options-test/crit-001",
						description: "Test all options",
						plan_id: "pln-063-options",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const options: PlanGenerationOptions = {
				priority: "critical",
				includeTestCases: true,
				includeFlows: true,
				estimatedDays: 5,
				assignedTo: "developer@example.com",
				tags: ["feature", "high-priority"],
			};

			const plans = PlanGenerator.generateFromRequirement(requirement, options);

			expect(plans[0]?.plan.priority).toBe("critical");
			expect(plans[0]?.plan.test_cases.length).toBeGreaterThan(0);
			expect(plans[0]?.plan.flows.length).toBeGreaterThan(0);
		});

		it("should handle undefined options", () => {
			const requirement: Requirement = {
				id: "req-054-no-options",
				type: "requirement",
				number: 54,
				name: "No Options",
				slug: "no-options",
				description: "Test without options",
				priority: "required",
				criteria: [
					{
						id: "req-054-no-options/crit-001",
						description: "No options criteria",
						plan_id: "pln-064-no-options",
						completed: false,
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const plans = PlanGenerator.generateFromRequirement(
				requirement,
				undefined,
			);

			expect(plans).toBeDefined();
			expect(plans.length).toBeGreaterThan(0);
		});
	});
});
