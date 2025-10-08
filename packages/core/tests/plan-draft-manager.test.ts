import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PlanDraftManager } from "../src/managers/plan-manager";
import { FileManager } from "../src/storage/file-manager";
import * as fs from "node:fs/promises";
import * as path from "node:path";

describe("PlanDraftManager - Two-Phase Workflow", () => {
	let draftManager: PlanDraftManager;
	let fileManager: FileManager;
	const testDir = ".test-specs-plan-draft";
	const draftsDir = path.join(testDir, ".drafts");

	beforeEach(async () => {
		// Clean up test directory
		try {
			await fs.rm(testDir, { recursive: true, force: true });
		} catch {
			// Ignore if doesn't exist
		}

		await fs.mkdir(testDir, { recursive: true });

		fileManager = new FileManager(testDir);
		draftManager = new PlanDraftManager(fileManager);
	});

	afterEach(async () => {
		// Clean up test directory
		try {
			await fs.rm(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("Phase 1: Main Q&A", () => {
		it("should create a draft with main questions", async () => {
			const result = await draftManager.createDraft("Sprint 1 Authentication");

			expect(result).toMatchObject({
				draftId: "draft-001",
				firstQuestion: "What is the main goal of this plan?",
				totalQuestions: 5,
			});

			// Verify draft file was created
			const draftPath = path.join(draftsDir, "draft-001.yaml");
			const exists = await fs
				.access(draftPath)
				.then(() => true)
				.catch(() => false);
			expect(exists).toBe(true);
		});

		it("should pre-fill first question if description provided", async () => {
			const result = await draftManager.createDraft(
				"Sprint 1 Authentication",
				"Implement user login and registration",
			);

			expect(result.firstQuestion).toBe(
				"Which requirement and criteria does this plan fulfill? (format: req-XXX-slug/crit-XXX)",
			);

			const draft = await draftManager.getDraft("draft-001");
			expect(draft).toBeTruthy();
			expect(draft?.questions[0]?.answer).toBe(
				"Implement user login and registration",
			);
		});

		it("should progress through main questions", async () => {
			await draftManager.createDraft("Sprint 1 Authentication");

			// Answer Q1: main goal
			const r1 = await draftManager.submitAnswer(
				"draft-001",
				"Implement user authentication",
			);
			expect(r1).toMatchObject({
				completed: false,
				nextQuestion:
					"Which requirement and criteria does this plan fulfill? (format: req-XXX-slug/crit-XXX)",
			});

			// Answer Q2: requirement/criteria
			const r2 = await draftManager.submitAnswer(
				"draft-001",
				"req-001-user-auth/crit-001",
			);
			expect(r2).toMatchObject({
				completed: false,
				nextQuestion: "What is in scope for this plan?",
			});

			// Answer Q3: in scope
			const r3 = await draftManager.submitAnswer(
				"draft-001",
				"Login, registration, password reset",
			);
			expect(r3).toMatchObject({
				completed: false,
				nextQuestion: "What is explicitly out of scope?",
			});

			// Answer Q4: out of scope
			const r4 = await draftManager.submitAnswer(
				"draft-001",
				"OAuth, social login",
			);
			expect(r4).toMatchObject({
				completed: false,
				nextQuestion:
					"List the tasks you want to add (one per line, short descriptions)",
			});
		});

		it("should transition to Phase 2 after task list provided", async () => {
			await draftManager.createDraft("Sprint 1 Authentication");

			// Answer all Phase 1 questions
			await draftManager.submitAnswer(
				"draft-001",
				"Implement user authentication",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"req-001-user-auth/crit-001",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"Login, registration, password reset",
			);
			await draftManager.submitAnswer("draft-001", "OAuth, social login");

			// Provide task list
			const result = await draftManager.submitAnswer(
				"draft-001",
				"Create login form\nHash passwords\nSession management",
			);

			expect(result).toMatchObject({
				completed: false,
				nextQuestion:
					'Task 1/3: "Create login form" - Provide a detailed description',
				totalQuestions: 11, // 5 main questions + 3 tasks * 2 questions each
			});

			const draft = await draftManager.getDraft("draft-001");
			expect(draft?.type).toBe("plan");
			if (draft?.type === "plan") {
				expect(draft.taskTitles).toEqual([
					"Create login form",
					"Hash passwords",
					"Session management",
				]);
				expect(draft.currentTaskIndex).toBe(0);
			}
		});

		it("should require at least one task", async () => {
			await draftManager.createDraft("Sprint 1 Authentication");

			// Answer all Phase 1 questions
			await draftManager.submitAnswer(
				"draft-001",
				"Implement user authentication",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"req-001-user-auth/crit-001",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"Login, registration, password reset",
			);
			await draftManager.submitAnswer("draft-001", "OAuth, social login");

			// Empty task list should throw
			await expect(
				draftManager.submitAnswer("draft-001", ""),
			).rejects.toThrow("At least one task is required");
		});
	});

	describe("Phase 2: Task Q&A", () => {
		beforeEach(async () => {
			// Set up a draft ready for Phase 2
			await draftManager.createDraft("Sprint 1 Authentication");
			await draftManager.submitAnswer(
				"draft-001",
				"Implement user authentication",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"req-001-user-auth/crit-001",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"Login, registration, password reset",
			);
			await draftManager.submitAnswer("draft-001", "OAuth, social login");
			await draftManager.submitAnswer(
				"draft-001",
				"Create login form\nHash passwords",
			);
		});

		it("should ask for description and acceptance criteria for each task", async () => {
			// Task 1: description
			const r1 = await draftManager.submitAnswer(
				"draft-001",
				"Build a React login form with email and password fields",
			);
			expect(r1).toMatchObject({
				completed: false,
				nextQuestion:
					'Task 1/2: "Create login form" - What are the acceptance criteria?',
			});

			// Task 1: acceptance criteria
			const r2 = await draftManager.submitAnswer(
				"draft-001",
				"Form validates email format, shows error messages",
			);
			expect(r2).toMatchObject({
				completed: false,
				nextQuestion: 'Task 2/2: "Hash passwords" - Provide a detailed description',
			});

			// Task 2: description
			const r3 = await draftManager.submitAnswer(
				"draft-001",
				"Use bcrypt to hash passwords before storage",
			);
			expect(r3).toMatchObject({
				completed: false,
				nextQuestion:
					'Task 2/2: "Hash passwords" - What are the acceptance criteria?',
			});

			// Task 2: acceptance criteria (final)
			const r4 = await draftManager.submitAnswer(
				"draft-001",
				"Uses bcrypt with 10 salt rounds",
			);
			expect(r4).toMatchObject({
				completed: true,
				totalQuestions: 9, // 5 main + 2 tasks * 2
			});
		});

		it("should store tasks with temp IDs during draft phase", async () => {
			await draftManager.submitAnswer(
				"draft-001",
				"Build a React login form with email and password fields",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"Form validates email format",
			);

			const draft = await draftManager.getDraft("draft-001");
			expect(draft?.type).toBe("plan");
			if (draft?.type === "plan") {
				expect(draft.tasks).toHaveLength(1);
				expect(draft.tasks[0]).toMatchObject({
					id: "temp-task-001",
					title: "Create login form",
					description: "Build a React login form with email and password fields",
					acceptance_criteria: "Form validates email format",
				});
			}
		});
	});

	describe("Completion & Entity Creation", () => {
		it("should mark draft as incomplete until all tasks are answered", async () => {
			await draftManager.createDraft("Sprint 1 Authentication");

			// Phase 1 incomplete
			let complete = await draftManager.isComplete("draft-001");
			expect(complete).toBe(false);

			// Complete Phase 1
			await draftManager.submitAnswer(
				"draft-001",
				"Implement user authentication",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"req-001-user-auth/crit-001",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"Login, registration, password reset",
			);
			await draftManager.submitAnswer("draft-001", "OAuth, social login");
			await draftManager.submitAnswer("draft-001", "Login form\nHash passwords");

			// Phase 2 incomplete
			complete = await draftManager.isComplete("draft-001");
			expect(complete).toBe(false);

			// Complete first task
			await draftManager.submitAnswer("draft-001", "Build login form");
			complete = await draftManager.isComplete("draft-001");
			expect(complete).toBe(false);

			await draftManager.submitAnswer("draft-001", "Form validates input");
			complete = await draftManager.isComplete("draft-001");
			expect(complete).toBe(false);

			// Complete second task
			await draftManager.submitAnswer("draft-001", "Hash passwords with bcrypt");
			complete = await draftManager.isComplete("draft-001");
			expect(complete).toBe(false);

			await draftManager.submitAnswer("draft-001", "Uses 10 salt rounds");

			// Now complete
			complete = await draftManager.isComplete("draft-001");
			expect(complete).toBe(true);
		});

		it("should create a plan entity from completed draft", async () => {
			await draftManager.createDraft("Sprint 1 Authentication");

			// Complete all questions
			await draftManager.submitAnswer(
				"draft-001",
				"Implement user authentication",
			);
			await draftManager.submitAnswer(
				"draft-001",
				"req-001-user-auth/crit-001",
			);
			await draftManager.submitAnswer("draft-001", "Login, registration");
			await draftManager.submitAnswer("draft-001", "OAuth");
			await draftManager.submitAnswer("draft-001", "Login form");
			await draftManager.submitAnswer("draft-001", "Build login form");
			await draftManager.submitAnswer("draft-001", "Form validates input");

			const plan = await draftManager.createFromDraft("draft-001");

			expect(plan).toMatchObject({
				type: "plan",
				name: "Sprint 1 Authentication",
				slug: "sprint-1-authentication",
				description: "Implement user authentication",
				priority: "medium",
				criteria: {
					requirement: "req-001-user-auth",
					criteria: "crit-001",
				},
			});

			expect(plan.scope).toHaveLength(2);
			expect(plan.scope).toEqual(
				expect.arrayContaining([
					{ type: "in-scope", description: "Login, registration" },
					{ type: "out-of-scope", description: "OAuth" },
				]),
			);

			expect(plan.tasks).toHaveLength(1);
			expect(plan.tasks[0]).toMatchObject({
				id: "task-001",
				priority: "medium",
				task: expect.stringContaining("Login form"),
			});
		});

		it("should throw if trying to create entity from incomplete draft", async () => {
			await draftManager.createDraft("Sprint 1 Authentication");
			await draftManager.submitAnswer(
				"draft-001",
				"Implement user authentication",
			);

			await expect(draftManager.createFromDraft("draft-001")).rejects.toThrow(
				"Draft is not complete",
			);
		});
	});

	describe("Error Handling", () => {
		it("should throw if draft not found", async () => {
			await expect(
				draftManager.submitAnswer("draft-999", "answer"),
			).rejects.toThrow("Plan draft not found");
		});

		it("should throw if trying to answer past last task", async () => {
			await draftManager.createDraft("Test Plan");
			await draftManager.submitAnswer("draft-001", "Goal");
			await draftManager.submitAnswer("draft-001", "req-001/crit-001");
			await draftManager.submitAnswer("draft-001", "In scope");
			await draftManager.submitAnswer("draft-001", "Out scope");
			await draftManager.submitAnswer("draft-001", "Task 1");
			await draftManager.submitAnswer("draft-001", "Description");
			await draftManager.submitAnswer("draft-001", "Criteria");

			await expect(
				draftManager.submitAnswer("draft-001", "Extra answer"),
			).rejects.toThrow("All tasks have been completed");
		});
	});

	describe("Multiple Drafts", () => {
		it("should generate sequential draft IDs", async () => {
			const r1 = await draftManager.createDraft("Plan A");
			const r2 = await draftManager.createDraft("Plan B");
			const r3 = await draftManager.createDraft("Plan C");

			expect(r1.draftId).toBe("draft-001");
			expect(r2.draftId).toBe("draft-002");
			expect(r3.draftId).toBe("draft-003");
		});

		it("should list all plan drafts", async () => {
			await draftManager.createDraft("Plan A");
			await draftManager.createDraft("Plan B");

			const drafts = await draftManager.listDrafts();
			expect(drafts).toHaveLength(2);
			expect(drafts).toEqual(
				expect.arrayContaining(["draft-001", "draft-002"]),
			);
		});
	});
});
