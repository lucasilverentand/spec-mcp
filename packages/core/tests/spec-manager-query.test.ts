import type { Query } from "@spec-mcp/schemas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SpecManager } from "../src/spec-manager";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestComponent,
	createTestPlan,
	createTestTechnicalRequirement,
} from "./helpers";

describe("SpecManager Query Operations", () => {
	let tempDir: string;
	let specManager: SpecManager;

	beforeEach(async () => {
		tempDir = await createTempDir("spec-manager-query");
		specManager = new SpecManager(tempDir);
		await specManager.ensureFolders();
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("Finding next task to work on", () => {
		it("should find the next task by priority using next-to-do ordering", async () => {
			// Create a plan with multiple tasks of different priorities
			const _plan = await specManager.plans.create(
				createTestPlan({
					slug: "feature-impl",
					name: "Feature Implementation",
					tasks: [
						{
							id: "tsk-001",
							task: "Low priority task for testing",
							priority: "low",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-002",
							task: "Critical task",
							priority: "critical",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-003",
							task: "High priority task",
							priority: "high",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Query for not-started tasks with next-to-do ordering
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				status: ["not-started"],
				orderBy: "next-to-do",
				direction: "asc",
			};

			const result = await specManager.query(query);

			// Should return critical task first, then high, then low
			expect(result.items).toHaveLength(3);
			expect(result.items[0].id).toBe("tsk-002");
			expect(result.items[0].priority).toBe("critical");
			expect(result.items[1].id).toBe("tsk-003");
			expect(result.items[1].priority).toBe("high");
			expect(result.items[2].id).toBe("tsk-001");
			expect(result.items[2].priority).toBe("low");
		});

		it("should find next incomplete task excluding completed ones", async () => {
			const _plan = await specManager.plans.create(
				createTestPlan({
					slug: "mixed-status",
					name: "Mixed Status Tasks",
					tasks: [
						{
							id: "tsk-001",
							task: "Completed task",
							priority: "critical",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: "2024-01-02T00:00:00Z",
								completed_at: "2024-01-03T00:00:00Z",
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-002",
							task: "Next task to do",
							priority: "high",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				completed: false,
				orderBy: "next-to-do",
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].id).toBe("tsk-002");
		});

		it("should filter tasks by specific priorities for next task", async () => {
			const _plan = await specManager.plans.create(
				createTestPlan({
					slug: "priority-filter",
					name: "Priority Filter",
					tasks: [
						{
							id: "tsk-001",
							task: "Low priority task for testing",
							priority: "low",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-002",
							task: "Critical task",
							priority: "critical",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-003",
							task: "High priority task",
							priority: "high",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Only get critical and high priority tasks
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				priority: ["critical", "high"],
				orderBy: "next-to-do",
				direction: "asc", // Ensure ascending order for next-to-do
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			expect(result.items[0].priority).toBe("critical");
			expect(result.items[1].priority).toBe("high");
		});
	});

	describe("Listing all sub-items of a type for a spec type", () => {
		it("should list all tasks from all plans", async () => {
			// Create multiple plans with tasks
			await specManager.plans.create(
				createTestPlan({
					slug: "plan-1",
					name: "Plan 1",
					tasks: [
						{
							id: "tsk-001",
							task: "Task 1 in Plan 1",
							priority: "high",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			await specManager.plans.create(
				createTestPlan({
					slug: "plan-2",
					name: "Plan 2",
					tasks: [
						{
							id: "tsk-002",
							task: "Task 1 in Plan 2",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-003",
							task: "Task 2 in Plan 2",
							priority: "low",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Query all tasks across all plans
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(3);
			expect(result.items.map((i) => i.id).sort()).toEqual([
				"tsk-001",
				"tsk-002",
				"tsk-003",
			]);
		});

		it("should list all test cases from all plans", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "plan-with-tests",
					name: "Plan with Tests",
					test_cases: [
						{
							id: "tst-001",
							name: "Test Case 1",
							description: "First test case",
							steps: ["Step 1", "Step 2"],
							expected_result: "Success",
							implemented: false,
							passing: false,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tst-002",
							name: "Test Case 2",
							description: "Second test case",
							steps: ["Step A", "Step B"],
							expected_result: "Pass",
							implemented: true,
							passing: true,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["test-case"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			expect(result.items[0].type).toBe("test-case");
			expect(result.items[1].type).toBe("test-case");
		});

		it("should list all criteria from business requirements", async () => {
			await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "br-with-criteria",
					name: "BR with Criteria",
					criteria: [
						{
							id: "crt-001",
							description: "First criterion",
							rationale: "Important for success",
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "crt-002",
							description: "Second criterion",
							rationale: "Also important",
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["criteria"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			expect(result.items.map((i) => i.id)).toContain("crt-001");
			expect(result.items.map((i) => i.id)).toContain("crt-002");
		});

		it("should list criteria from both business and technical requirements", async () => {
			await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "br-criteria",
					name: "BR Criteria",
					criteria: [
						{
							id: "crt-001",
							description: "BR criterion",
							rationale: "Business rationale",
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			await specManager.tech_requirements.create(
				createTestTechnicalRequirement({
					slug: "tr-criteria",
					name: "TR Criteria",
					criteria: [
						{
							id: "crt-002",
							description: "TR criterion",
							rationale: "Technical rationale",
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["criteria"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			const parentTypes = result.items.map((i) =>
				"parentType" in i ? i.parentType : null,
			);
			expect(parentTypes).toContain("business-requirement");
			expect(parentTypes).toContain("technical-requirement");
		});
	});

	describe("Listing all sub-items inside a specific ID", () => {
		it("should list all tasks within a specific plan by ID", async () => {
			const plan1 = await specManager.plans.create(
				createTestPlan({
					slug: "plan-1",
					name: "Plan 1",
					tasks: [
						{
							id: "tsk-001",
							task: "Task in Plan 1",
							priority: "high",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			await specManager.plans.create(
				createTestPlan({
					slug: "plan-2",
					name: "Plan 2",
					tasks: [
						{
							id: "tsk-002",
							task: "Task in Plan 2",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Query tasks only from plan 1 (must specify itemTypes for sub-items)
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				id: `pln-${plan1.number}`,
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].id).toBe("tsk-001");
		});

		it("should list all test cases within a specific plan", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					name: "Test Plan",
					test_cases: [
						{
							id: "tst-001",
							name: "Test 1",
							description: "First test",
							steps: ["Do this"],
							expected_result: "Success",
							implemented: false,
							passing: false,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tst-002",
							name: "Test 2",
							description: "Second test",
							steps: ["Do that"],
							expected_result: "Pass",
							implemented: true,
							passing: false,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["test-case"],
				},
				id: `pln-${plan.number}`,
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			// parentId is formatted with padding and slug, e.g. pln-001-test-plan
			expect(result.items.every((i) => i.parentId.startsWith(`pln-`))).toBe(
				true,
			);
		});

		it("should list all criteria within a specific requirement", async () => {
			const br = await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "specific-br",
					name: "Specific BR",
					criteria: [
						{
							id: "crt-001",
							description: "Criterion 1",
							rationale: "Reason 1",
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "crt-002",
							description: "Criterion 2",
							rationale: "Reason 2",
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["criteria"],
				},
				id: `brd-${br.number}`,
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			// parentId is formatted with padding and slug, e.g. brd-001-specific-br
			expect(result.items[0].parentId).toContain("brd-");
		});

		it("should support partial ID matching for parent specs", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "partial-match",
					name: "Partial Match Plan",
					tasks: [
						{
							id: "tsk-001",
							task: "Test task for query",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Use just the prefix
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				id: `pln-${plan.number}`,
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
		});
	});

	describe("Getting a specific spec by ID with full details", () => {
		it("should get a specific plan by full ID", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "detailed-plan",
					name: "Detailed Plan",
					description: "A plan with details",
				}),
			);

			const query: Query = {
				id: `pln-${plan.number}-detailed-plan`,
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].resultType).toBe("spec");
			if (result.items[0].resultType === "spec") {
				expect(result.items[0].name).toBe("Detailed Plan");
				expect(result.items[0].description).toBe("A plan with details");
				expect(result.items[0].slug).toBe("detailed-plan");
			}
		});

		it("should get a specific business requirement by partial ID", async () => {
			const br = await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "auth-req",
					name: "Authentication Requirement",
					description: "User authentication system",
				}),
			);

			const query: Query = {
				id: `brd-${br.number}`,
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].resultType).toBe("spec");
			if (result.items[0].resultType === "spec") {
				expect(result.items[0].name).toBe("Authentication Requirement");
			}
		});

		it("should get multiple specs by array of IDs", async () => {
			const plan1 = await specManager.plans.create(
				createTestPlan({ slug: "plan-1", name: "Plan 1" }),
			);
			const plan2 = await specManager.plans.create(
				createTestPlan({ slug: "plan-2", name: "Plan 2" }),
			);

			const query: Query = {
				id: [`pln-${plan1.number}`, `pln-${plan2.number}`],
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			expect(result.items.map((i) => i.name).sort()).toEqual([
				"Plan 1",
				"Plan 2",
			]);
		});

		it("should get spec with computed status for plans", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "status-plan",
					name: "Status Plan",
					tasks: [
						{
							id: "tsk-001",
							task: "Incomplete task",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				id: `pln-${plan.number}`,
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].status).toBeDefined();
		});
	});

	describe("Field-specific queries and filtering", () => {
		it("should filter specs by priority", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "low-priority",
					name: "Low Priority Plan",
					priority: "low",
				}),
			);
			await specManager.plans.create(
				createTestPlan({
					slug: "critical-priority",
					name: "Critical Priority Plan",
					priority: "critical",
				}),
			);

			const query: Query = {
				objects: {
					specTypes: ["plan"],
				},
				priority: ["critical"],
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].name).toBe("Critical Priority Plan");
		});

		it("should filter specs by milestone", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "q1-plan",
					name: "Q1 Plan",
					milestones: ["mls-001-q1-release"],
				}),
			);
			await specManager.plans.create(
				createTestPlan({
					slug: "q2-plan",
					name: "Q2 Plan",
					milestones: ["mls-002-q2-release"],
				}),
			);

			const query: Query = {
				objects: {
					specTypes: ["plan"],
				},
				milestone: "mls-001-q1-release",
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].name).toBe("Q1 Plan");
		});

		it("should filter by spec type to get only specific types", async () => {
			await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "br-1",
					name: "Business Requirement 1",
				}),
			);
			await specManager.plans.create(
				createTestPlan({ slug: "plan-1", name: "Plan 1" }),
			);
			await specManager.components.create(
				createTestComponent({
					slug: "component-1",
					name: "Component 1",
				}),
			);

			// Get only business requirements
			const query: Query = {
				objects: {
					specTypes: ["business-requirement"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].type).toBe("business-requirement");
		});

		it("should filter by multiple spec types", async () => {
			await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "br-1",
					name: "Business Requirement 1",
				}),
			);
			await specManager.tech_requirements.create(
				createTestTechnicalRequirement({
					slug: "tr-1",
					name: "Technical Requirement 1",
				}),
			);
			await specManager.plans.create(
				createTestPlan({ slug: "plan-1", name: "Plan 1" }),
			);

			const query: Query = {
				objects: {
					specTypes: ["business-requirement", "technical-requirement"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			const types = result.items.map((i) => i.type);
			expect(types).toContain("business-requirement");
			expect(types).toContain("technical-requirement");
		});

		it("should filter test cases by implementation and passing status", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "test-filtering",
					name: "Test Filtering",
					test_cases: [
						{
							id: "tst-001",
							name: "Implemented and passing",
							description: "Test 1",
							steps: ["Step"],
							expected_result: "Success",
							implemented: true,
							passing: true,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tst-002",
							name: "Implemented but failing",
							description: "Test 2",
							steps: ["Step"],
							expected_result: "Success",
							implemented: true,
							passing: false,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tst-003",
							name: "Not implemented",
							description: "Test 3",
							steps: ["Step"],
							expected_result: "Success",
							implemented: false,
							passing: false,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Get only implemented tests
			const implementedQuery: Query = {
				objects: {
					itemTypes: ["test-case"],
				},
				completed: true, // implemented = completed for test cases
			};

			const implementedResult = await specManager.query(implementedQuery);
			expect(implementedResult.items).toHaveLength(2);

			// Get only passing tests
			const passingQuery: Query = {
				objects: {
					itemTypes: ["test-case"],
				},
				verified: true, // passing = verified for test cases
			};

			const passingResult = await specManager.query(passingQuery);
			expect(passingResult.items).toHaveLength(1);
			expect(passingResult.items[0].name).toBe("Implemented and passing");
		});
	});

	describe("Sorting and ordering", () => {
		it("should sort specs by creation date", async () => {
			// Create specs with different creation dates by adding small delays
			const _plan1 = await specManager.plans.create(
				createTestPlan({ slug: "first", name: "First Plan" }),
			);

			// Wait a tiny bit to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 10));

			const _plan2 = await specManager.plans.create(
				createTestPlan({ slug: "second", name: "Second Plan" }),
			);

			// Ascending order (oldest first)
			const ascQuery: Query = {
				objects: {
					specTypes: ["plan"],
				},
				orderBy: "created",
				direction: "asc",
			};

			const ascResult = await specManager.query(ascQuery);
			expect(ascResult.items[0].name).toBe("First Plan");
			expect(ascResult.items[1].name).toBe("Second Plan");

			// Descending order (newest first)
			const descQuery: Query = {
				objects: {
					specTypes: ["plan"],
				},
				orderBy: "created",
				direction: "desc",
			};

			const descResult = await specManager.query(descQuery);
			expect(descResult.items[0].name).toBe("Second Plan");
			expect(descResult.items[1].name).toBe("First Plan");
		});

		it("should sort by priority with next-to-do logic", async () => {
			const _plan = await specManager.plans.create(
				createTestPlan({
					slug: "priority-sort",
					name: "Priority Sort",
					tasks: [
						{
							id: "tsk-001",
							task: "Nice to have",
							priority: "nice-to-have",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-002",
							task: "Medium priority",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-003",
							task: "Critical task",
							priority: "critical",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				orderBy: "next-to-do",
				direction: "asc",
			};

			const result = await specManager.query(query);

			expect(result.items[0].priority).toBe("critical");
			expect(result.items[1].priority).toBe("medium");
			expect(result.items[2].priority).toBe("nice-to-have");
		});
	});

	describe("Complex and combined queries", () => {
		it("should combine multiple filters for complex queries", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "complex-1",
					name: "Complex Plan 1",
					priority: "high",
					milestones: ["mls-001-q1"],
					tasks: [
						{
							id: "tsk-001",
							task: "High priority incomplete task",
							priority: "high",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			await specManager.plans.create(
				createTestPlan({
					slug: "complex-2",
					name: "Complex Plan 2",
					priority: "low",
					milestones: ["mls-001-q1"],
					tasks: [
						{
							id: "tsk-002",
							task: "Low priority task for testing",
							priority: "low",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Complex query: high priority, incomplete tasks in Q1 milestone
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				priority: ["high", "critical"],
				completed: false,
				milestone: "mls-001-q1",
				orderBy: "next-to-do",
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(1);
			expect(result.items[0].id).toBe("tsk-001");
		});

		it("should filter by status across multiple criteria", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "status-filtering",
					name: "Status Filtering",
					tasks: [
						{
							id: "tsk-001",
							task: "Not started task for testing",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-002",
							task: "In progress task for testing",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: "2024-01-02T00:00:00Z",
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
						{
							id: "tsk-003",
							task: "Completed task for testing",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: "2024-01-02T00:00:00Z",
								completed_at: "2024-01-03T00:00:00Z",
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			// Get tasks that are either not started or in progress
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				status: ["not-started", "in-progress"],
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			expect(result.items.map((i) => i.id).sort()).toEqual([
				"tsk-001",
				"tsk-002",
			]);
		});

		it("should return empty results when filters match nothing", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "no-match",
					name: "No Match Plan",
					priority: "low",
				}),
			);

			const query: Query = {
				objects: {
					specTypes: ["plan"],
				},
				priority: ["critical"],
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(0);
			expect(result.total).toBe(0);
		});
	});

	describe("Edge cases and special scenarios", () => {
		it("should handle empty database gracefully", async () => {
			const query: Query = {
				objects: {
					specTypes: ["plan"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(0);
			expect(result.total).toBe(0);
		});

		it("should exclude superseded tasks from results", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "superseded-tasks",
					name: "Superseded Tasks",
					tasks: [
						{
							id: "tsk-001",
							task: "Superseded task",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: "tsk-002",
							superseded_at: "2024-01-02T00:00:00Z",
						},
						{
							id: "tsk-002",
							task: "Current task",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: "tsk-001",
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
			};

			const result = await specManager.query(query);

			// Should only return the active task, not the superseded one
			expect(result.items).toHaveLength(1);
			expect(result.items[0].id).toBe("tsk-002");
		});

		it("should handle queries with no filters (return everything)", async () => {
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "br-1", name: "BR 1" }),
			);
			await specManager.plans.create(
				createTestPlan({ slug: "plan-1", name: "Plan 1" }),
			);

			const query: Query = {};

			const result = await specManager.query(query);

			// Should return all specs when no filters are specified
			expect(result.items.length).toBeGreaterThan(0);
		});

		it("should handle query with multiple item types", async () => {
			await specManager.plans.create(
				createTestPlan({
					slug: "multi-items",
					name: "Multi Items",
					tasks: [
						{
							id: "tsk-001",
							task: "A task for testing",
							priority: "medium",
							depends_on: [],
							considerations: [],
							status: {
								created_at: "2024-01-01T00:00:00Z",
								started_at: null,
								completed_at: null,
								verified_at: null,
							},
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
					test_cases: [
						{
							id: "tst-001",
							name: "A test",
							description: "Test description",
							steps: ["Step"],
							expected_result: "Success",
							implemented: false,
							passing: false,
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			const query: Query = {
				objects: {
					itemTypes: ["task", "test-case"],
				},
			};

			const result = await specManager.query(query);

			expect(result.items).toHaveLength(2);
			const types = result.items.map((i) => i.type);
			expect(types).toContain("task");
			expect(types).toContain("test-case");
		});
	});
});
