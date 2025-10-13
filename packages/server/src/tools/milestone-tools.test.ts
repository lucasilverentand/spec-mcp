import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SpecManager } from "@spec-mcp/core";
import type { Milestone, Plan } from "@spec-mcp/schemas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	addReferenceToMilestone,
	calculateMilestoneStatus,
	getMilestoneStatus,
} from "./milestone-tools.js";

// TODO: Milestone entity type needs to be added to SpecManager before these tests can run
describe("Milestone Tools", () => {
	let specManager: SpecManager;
	let tempDir: string;
	let milestoneId: string;
	let _planId: string;

	beforeEach(async () => {
		// Create temp directory
		tempDir = mkdtempSync(join(tmpdir(), "milestone-test-"));
		specManager = new SpecManager(tempDir);
		await specManager.ensureFolders();

		// Create a business requirement for the plan to reference
		await specManager.business_requirements.create({
			type: "business-requirement",
			number: 1,
			slug: "user-management",
			name: "User Management",
			description: "User management features including login and registration",
			priority: "high",
			criteria: [
				{
					id: "crt-001",
					description: "System should support user authentication",
					rationale: "Security requirement",
					supersedes: null,
					superseded_by: null,
					superseded_at: null,
				},
				{
					id: "crt-002",
					description: "System should support user registration",
					rationale: "User acquisition requirement",
					supersedes: null,
					superseded_by: null,
					superseded_at: null,
				},
			],
			user_stories: [
				{
					role: "user",
					feature: "login to the system",
					benefit: "access my account",
				},
			],
			business_value: [
				{
					type: "revenue",
					value: "Enable user-based monetization",
				},
			],
			depends_on: [],
			references: [],
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		});

		// Create a test milestone
		const milestone: Milestone = {
			type: "milestone",
			number: 1,
			slug: "v1-launch",
			name: "Version 1.0 Launch",
			description: "Initial product release with core features",
			priority: "high",
			target_date: "2025-12-31T00:00:00Z",
			references: [],
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		await specManager.milestones.create(milestone);
		milestoneId = "mls-001-v1-launch";

		// Create a test plan that references the milestone
		const plan: Plan = {
			type: "plan",
			number: 1,
			slug: "auth-system",
			name: "Authentication System",
			description: "User authentication and authorization",
			priority: "high",
			criteria: {
				requirement: "brd-001-user-management",
				criteria: "crt-001",
			},
			scope: [
				{
					type: "in-scope",
					description: "User login",
					rationale: "Core functionality",
				},
				{
					type: "in-scope",
					description: "User registration",
					rationale: "Core functionality",
				},
				{
					type: "out-of-scope",
					description: "Social login",
					rationale: "Future enhancement",
				},
			],
			depends_on: [],
			milestones: [milestoneId],
			tasks: [
				{
					id: "tsk-001",
					priority: "high",
					depends_on: [],
					task: "Implement user login",
					considerations: [],
					references: [],
					files: [],
					status: {
						created_at: "2025-01-01T00:00:00Z",
						started_at: null,
						completed_at: null,
						verified_at: null,
						notes: [],
					},
					blocked: [],
					supersedes: null,
					superseded_by: null,
					superseded_at: null,
				},
			],
			flows: [],
			test_cases: [],
			api_contracts: [],
			data_models: [],
			references: [],
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		await specManager.plans.create(plan);
		_planId = "pln-001-auth-system";
	});

	afterEach(() => {
		// Clean up temp directory
		try {
			rmSync(tempDir, { recursive: true, force: true });
		} catch (_error) {
			// Ignore cleanup errors
		}
	});

	describe("calculateMilestoneStatus", () => {
		it("should return not started when no plans are linked", () => {
			const status = calculateMilestoneStatus([]);

			expect(status.started_at).toBeNull();
			expect(status.completed_at).toBeNull();
			expect(status.verified_at).toBeNull();
			expect(status.notes).toEqual([]);
		});

		it("should return not started when plans have no tasks", async () => {
			const plan = await specManager.plans.get(1);
			plan.tasks = [];
			const status = calculateMilestoneStatus([plan]);

			expect(status.started_at).toBeNull();
			expect(status.completed_at).toBeNull();
			expect(status.verified_at).toBeNull();
		});

		it("should calculate started when at least one task is started", async () => {
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";

			const status = calculateMilestoneStatus([plan]);

			expect(status.started_at).toBe("2025-01-02T00:00:00Z");
			expect(status.completed_at).toBeNull();
			expect(status.verified_at).toBeNull();
		});

		it("should calculate completed when all tasks are completed", async () => {
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";

			const status = calculateMilestoneStatus([plan]);

			expect(status.started_at).toBe("2025-01-02T00:00:00Z");
			expect(status.completed_at).toBe("2025-01-03T00:00:00Z");
			expect(status.verified_at).toBeNull();
		});

		it("should calculate verified when all tasks are verified", async () => {
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";
			plan.tasks[0].status.verified_at = "2025-01-04T00:00:00Z";

			const status = calculateMilestoneStatus([plan]);

			expect(status.started_at).toBe("2025-01-02T00:00:00Z");
			expect(status.completed_at).toBe("2025-01-03T00:00:00Z");
			expect(status.verified_at).toBe("2025-01-04T00:00:00Z");
		});

		it("should use earliest started_at across multiple plans", async () => {
			const plan1 = await specManager.plans.get(1);
			plan1.tasks[0].status.started_at = "2025-01-05T00:00:00Z";

			// Create second plan
			const plan2: Plan = {
				...plan1,
				number: 2,
				slug: "api-endpoints",
				name: "API Endpoints",
				tasks: [
					{
						...plan1.tasks[0],
						id: "tsk-002",
						task: "Implement API endpoints",
						status: {
							created_at: "2025-01-01T00:00:00Z",
							started_at: "2025-01-02T00:00:00Z",
							completed_at: null,
							verified_at: null,
							notes: [],
						},
					},
				],
			};

			const status = calculateMilestoneStatus([plan1, plan2]);

			// Should use earliest start time
			expect(status.started_at).toBe("2025-01-02T00:00:00Z");
		});

		it("should not be completed when any task is incomplete", async () => {
			const plan1 = await specManager.plans.get(1);
			plan1.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan1.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";

			// Create second plan with incomplete task
			const plan2: Plan = {
				...plan1,
				number: 2,
				slug: "api-endpoints",
				tasks: [
					{
						...plan1.tasks[0],
						id: "tsk-002",
						status: {
							created_at: "2025-01-01T00:00:00Z",
							started_at: "2025-01-02T00:00:00Z",
							completed_at: null,
							verified_at: null,
							notes: [],
						},
					},
				],
			};

			const status = calculateMilestoneStatus([plan1, plan2]);

			expect(status.completed_at).toBeNull();
			expect(status.verified_at).toBeNull();
		});

		it("should collect notes from all tasks", async () => {
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.notes = ["Note 1", "Note 2"];

			const status = calculateMilestoneStatus([plan]);

			expect(status.notes).toEqual(["Note 1", "Note 2"]);
		});
	});

	describe("getMilestoneStatus", () => {
		it("should fetch and calculate milestone status from linked plans", async () => {
			// Start task in plan
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			await specManager.plans.update(1, { tasks: plan.tasks });

			const status = await getMilestoneStatus(specManager, milestoneId);

			expect(status.started_at).toBe("2025-01-02T00:00:00Z");
			expect(status.completed_at).toBeNull();
		});

		it("should return not started for milestone with no linked plans", async () => {
			// Create milestone with no plans
			const standaloneMilestone: Milestone = {
				type: "milestone",
				number: 2,
				slug: "documentation",
				name: "Documentation Complete",
				description: "All documentation finished",
				priority: "medium",
				target_date: null,
				references: [],
				created_at: "2025-01-01T00:00:00Z",
				updated_at: "2025-01-01T00:00:00Z",
			};

			await specManager.milestones.create(standaloneMilestone);

			const status = await getMilestoneStatus(
				specManager,
				"mls-002-documentation",
			);

			expect(status.started_at).toBeNull();
			expect(status.completed_at).toBeNull();
			expect(status.verified_at).toBeNull();
		});
	});

	describe("addReferenceToMilestone", () => {
		it("should successfully add a URL reference", async () => {
			const reference = {
				type: "url" as const,
				name: "Release Notes",
				description: "Detailed release notes",
				url: "https://example.com/release-notes",
			};

			const result = await addReferenceToMilestone(
				specManager,
				milestoneId,
				reference,
			);

			expect(result.isError).toBeUndefined();
			expect(result.content[0].text).toContain("Successfully added");

			const milestone = await specManager.milestones.get(1);
			expect(milestone.references).toHaveLength(1);
			expect(milestone.references[0].type).toBe("url");
			expect(milestone.references[0].name).toBe("Release Notes");
		});

		it("should successfully add a documentation reference", async () => {
			const reference = {
				type: "documentation" as const,
				name: "Project Plan",
				description: "Detailed project plan",
				library: "project-management",
				search_term: "project planning guide",
				importance: "high" as const,
			};

			const result = await addReferenceToMilestone(
				specManager,
				milestoneId,
				reference,
			);

			expect(result.isError).toBeUndefined();

			const milestone = await specManager.milestones.get(1);
			expect(milestone.references).toHaveLength(1);
			expect(milestone.references[0].type).toBe("documentation");
			expect(milestone.references[0].importance).toBe("high");
		});

		it("should add multiple references", async () => {
			const ref1 = {
				type: "url" as const,
				name: "Release Notes",
				description: "Notes",
				url: "https://example.com/release-notes",
			};

			const ref2 = {
				type: "file" as const,
				name: "Deployment Guide",
				description: "Guide",
				path: "/docs/deployment.md",
			};

			await addReferenceToMilestone(specManager, milestoneId, ref1);
			await addReferenceToMilestone(specManager, milestoneId, ref2);

			const milestone = await specManager.milestones.get(1);
			expect(milestone.references).toHaveLength(2);
		});

		it("should reject adding reference to non-existent milestone", async () => {
			const reference = {
				type: "url" as const,
				name: "Release Notes",
				description: "Notes",
				url: "https://example.com/release-notes",
			};

			const result = await addReferenceToMilestone(
				specManager,
				"mls-999-fake",
				reference,
			);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("not found");
		});
	});

	describe("Milestone and Plan Integration", () => {
		it("should track milestone status across multiple plans", async () => {
			// Create second plan for same milestone
			const plan2: Plan = {
				type: "plan",
				number: 2,
				slug: "api-endpoints",
				name: "API Endpoints",
				description: "REST API endpoints",
				priority: "high",
				criteria: {
					requirement: "brd-001-user-management",
					criteria: "crt-002",
				},
				scope: [
					{
						type: "in-scope",
						description: "User endpoints",
						rationale: "Core functionality",
					},
					{
						type: "in-scope",
						description: "Auth endpoints",
						rationale: "Core functionality",
					},
				],
				depends_on: [],
				milestones: [milestoneId],
				tasks: [
					{
						id: "tsk-002",
						priority: "high",
						depends_on: [],
						task: "Implement API endpoints",
						considerations: [],
						references: [],
						files: [],
						status: {
							created_at: "2025-01-01T00:00:00Z",
							started_at: null,
							completed_at: null,
							verified_at: null,
							notes: [],
						},
						blocked: [],
						supersedes: null,
						superseded_by: null,
						superseded_at: null,
					},
				],
				flows: [],
				test_cases: [],
				api_contracts: [],
				data_models: [],
				references: [],
				created_at: "2025-01-01T00:00:00Z",
				updated_at: "2025-01-01T00:00:00Z",
			};

			await specManager.plans.create(plan2);

			// Complete only first plan
			const plan1 = await specManager.plans.get(1);
			plan1.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan1.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";
			await specManager.plans.update(1, { tasks: plan1.tasks });

			// Milestone should not be complete yet
			let status = await getMilestoneStatus(specManager, milestoneId);
			expect(status.started_at).toBeTruthy();
			expect(status.completed_at).toBeNull();

			// Complete second plan
			const updatedPlan2 = await specManager.plans.get(2);
			updatedPlan2.tasks[0].status.started_at = "2025-01-04T00:00:00Z";
			updatedPlan2.tasks[0].status.completed_at = "2025-01-05T00:00:00Z";
			await specManager.plans.update(2, { tasks: updatedPlan2.tasks });

			// Now milestone should be complete
			status = await getMilestoneStatus(specManager, milestoneId);
			expect(status.completed_at).toBeTruthy();
		});

		it("should handle milestone with no associated plans", async () => {
			// Create milestone with no plans referencing it
			const standaloneMilestone: Milestone = {
				type: "milestone",
				number: 2,
				slug: "documentation",
				name: "Documentation Complete",
				description: "All documentation finished",
				priority: "medium",
				target_date: null,
				references: [],
				created_at: "2025-01-01T00:00:00Z",
				updated_at: "2025-01-01T00:00:00Z",
			};

			await specManager.milestones.create(standaloneMilestone);

			const status = await getMilestoneStatus(
				specManager,
				"mls-002-documentation",
			);

			// Should be not started since there are no plans
			expect(status.started_at).toBeNull();
			expect(status.completed_at).toBeNull();
			expect(status.verified_at).toBeNull();
		});
	});
});
