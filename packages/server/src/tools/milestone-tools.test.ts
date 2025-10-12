import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SpecManager } from "@spec-mcp/core";
import type { Milestone, Plan } from "@spec-mcp/schemas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	addReferenceToMilestone,
	completeMilestone,
	startMilestone,
	verifyMilestone,
} from "./milestone-tools.js";

// TODO: Milestone entity type needs to be added to SpecManager before these tests can run
describe("Milestone Tools", () => {
	let specManager: SpecManager;
	let tempDir: string;
	let milestoneId: string;
	let planId: string;

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
					id: "crit-001",
					description: "System should support user authentication",
					rationale: "Security requirement",
					supersedes: null,
					superseded_by: null,
					superseded_at: null,
				},
				{
					id: "crit-002",
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
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				verified_at: null,
				notes: [],
			},
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
				criteria: "crit-001",
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
					id: "task-001",
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
		planId = "pln-001-auth-system";
	});

	afterEach(() => {
		// Clean up temp directory
		try {
			rmSync(tempDir, { recursive: true, force: true });
		} catch (_error) {
			// Ignore cleanup errors
		}
	});

	describe("startMilestone", () => {
		it("should successfully start a milestone", async () => {
			const result = await startMilestone(specManager, milestoneId);

			expect(result.isError).toBeUndefined();
			expect(result.content[0].text).toContain(
				"Successfully started milestone",
			);

			const milestone = await specManager.milestones.get(1);
			expect(milestone.status.started_at).toBeTruthy();
			expect(milestone.status.completed_at).toBeNull();
		});

		it("should reject starting an already started milestone", async () => {
			await startMilestone(specManager, milestoneId);
			const result = await startMilestone(specManager, milestoneId);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been started");
		});

		it("should reject starting a non-existent milestone", async () => {
			const result = await startMilestone(specManager, "mls-999-fake");

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Failed to find milestone");
		});

		it("should reject starting a non-milestone entity", async () => {
			const result = await startMilestone(specManager, planId);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("is not a milestone");
		});
	});

	describe("completeMilestone", () => {
		it("should successfully complete a milestone when all tasks are done", async () => {
			// Start the milestone
			await startMilestone(specManager, milestoneId);

			// Complete all tasks in the plan
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";
			await specManager.plans.update(1, { tasks: plan.tasks });

			const result = await completeMilestone(specManager, milestoneId);

			expect(result.isError).toBeUndefined();
			expect(result.content[0].text).toContain("Successfully completed");

			const milestone = await specManager.milestones.get(1);
			expect(milestone.status.completed_at).toBeTruthy();
			expect(milestone.status.verified_at).toBeNull();
		});

		it("should reject completing when tasks are incomplete", async () => {
			await startMilestone(specManager, milestoneId);

			const result = await completeMilestone(specManager, milestoneId);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("not yet complete");
		});

		it("should reject completing an already completed milestone", async () => {
			await startMilestone(specManager, milestoneId);

			// Complete all tasks
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";
			await specManager.plans.update(1, { tasks: plan.tasks });

			await completeMilestone(specManager, milestoneId);
			const result = await completeMilestone(specManager, milestoneId);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been completed");
		});

		it("should auto-start milestone if not started", async () => {
			// Complete all tasks without starting milestone
			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";
			await specManager.plans.update(1, { tasks: plan.tasks });

			const result = await completeMilestone(specManager, milestoneId);

			expect(result.isError).toBeUndefined();

			const milestone = await specManager.milestones.get(1);
			expect(milestone.status.started_at).toBeTruthy();
			expect(milestone.status.completed_at).toBeTruthy();
		});

		it("should reject completing a non-existent milestone", async () => {
			const result = await completeMilestone(specManager, "mls-999-fake");

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Failed to find milestone");
		});
	});

	describe("verifyMilestone", () => {
		beforeEach(async () => {
			// Start and complete milestone
			await startMilestone(specManager, milestoneId);

			const plan = await specManager.plans.get(1);
			plan.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";
			await specManager.plans.update(1, { tasks: plan.tasks });

			await completeMilestone(specManager, milestoneId);
		});

		it("should successfully verify a completed milestone", async () => {
			const result = await verifyMilestone(specManager, milestoneId);

			expect(result.isError).toBeUndefined();
			expect(result.content[0].text).toContain("Successfully verified");

			const milestone = await specManager.milestones.get(1);
			expect(milestone.status.verified_at).toBeTruthy();
		});

		it("should successfully verify with a note", async () => {
			const result = await verifyMilestone(
				specManager,
				milestoneId,
				"Verified by QA team",
			);

			expect(result.isError).toBeUndefined();

			const milestone = await specManager.milestones.get(1);
			expect(milestone.status.verified_at).toBeTruthy();
			expect(milestone.status.notes).toHaveLength(1);
			expect(milestone.status.notes[0]).toContain("Verified by QA team");
		});

		it("should reject verifying an incomplete milestone", async () => {
			// Create a new unfinished milestone
			const newMilestone: Milestone = {
				type: "milestone",
				number: 2,
				slug: "beta-release",
				name: "Beta Release",
				description: "Beta version",
				priority: "medium",
				target_date: null,
				status: {
					created_at: "2025-01-01T00:00:00Z",
					started_at: "2025-01-02T00:00:00Z",
					completed_at: null,
					verified_at: null,
					notes: [],
				},
				references: [],
				created_at: "2025-01-01T00:00:00Z",
				updated_at: "2025-01-01T00:00:00Z",
			};

			await specManager.milestones.create(newMilestone);

			const result = await verifyMilestone(specManager, "mls-002-beta-release");

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("must be completed");
		});

		it("should reject verifying an already verified milestone", async () => {
			await verifyMilestone(specManager, milestoneId);
			const result = await verifyMilestone(specManager, milestoneId);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("already been verified");
		});

		it("should reject verifying a non-existent milestone", async () => {
			const result = await verifyMilestone(specManager, "mls-999-fake");

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Failed to find milestone");
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
					criteria: "crit-002",
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
						id: "task-002",
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

			// Start milestone
			await startMilestone(specManager, milestoneId);

			// Complete only first plan
			const plan1 = await specManager.plans.get(1);
			plan1.tasks[0].status.started_at = "2025-01-02T00:00:00Z";
			plan1.tasks[0].status.completed_at = "2025-01-03T00:00:00Z";
			await specManager.plans.update(1, { tasks: plan1.tasks });

			// Should not be able to complete milestone yet
			let result = await completeMilestone(specManager, milestoneId);
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("not yet complete");

			// Complete second plan
			const updatedPlan2 = await specManager.plans.get(2);
			updatedPlan2.tasks[0].status.started_at = "2025-01-04T00:00:00Z";
			updatedPlan2.tasks[0].status.completed_at = "2025-01-05T00:00:00Z";
			await specManager.plans.update(2, { tasks: updatedPlan2.tasks });

			// Now should be able to complete milestone
			result = await completeMilestone(specManager, milestoneId);
			expect(result.isError).toBeUndefined();
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
				status: {
					created_at: "2025-01-01T00:00:00Z",
					started_at: null,
					completed_at: null,
					verified_at: null,
					notes: [],
				},
				references: [],
				created_at: "2025-01-01T00:00:00Z",
				updated_at: "2025-01-01T00:00:00Z",
			};

			await specManager.milestones.create(standaloneMilestone);

			await startMilestone(specManager, "mls-002-documentation");
			const result = await completeMilestone(
				specManager,
				"mls-002-documentation",
			);

			// Should complete successfully since there are no plans to block it
			expect(result.isError).toBeUndefined();
		});
	});
});
