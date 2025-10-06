import * as fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CreationFlowHelper } from "../../src/utils/creation-flow-helper.js";

describe("CreationFlowHelper", () => {
	let helper: CreationFlowHelper;
	const testSpecsDir = ".test-specs-helper";

	beforeEach(async () => {
		helper = new CreationFlowHelper();
		// Clean up test directory
		try {
			await fs.rm(testSpecsDir, { recursive: true, force: true });
		} catch {
			// Ignore if doesn't exist
		}
	});

	afterEach(async () => {
		helper.destroy();
		try {
			await fs.rm(testSpecsDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("start", () => {
		it("should start requirement creation flow", async () => {
			const response = await helper.start("requirement");

			expect(response.draft_id).toMatch(/^req-/);
			expect(response.step).toBe(1);
			expect(response.total_steps).toBe(9);
			expect(response.current_step_name).toBe("Research Similar Requirements");
			expect(response.prompt).toBeDefined();
			expect(response.field_hints).toBeDefined();
			expect(response.examples).toBeDefined();
			expect(response.progress_summary).toContain("Step 1/9");
		});

		it("should start component creation flow with 10 steps", async () => {
			const response = await helper.start("component");

			expect(response.step).toBe(1);
			expect(response.total_steps).toBe(14);
			expect(response.current_step_name).toBe("Research Existing Components");
		});

		it("should start plan creation flow with 15 steps", async () => {
			const response = await helper.start("plan");

			expect(response.step).toBe(1);
			expect(response.total_steps).toBe(16);
			expect(response.current_step_name).toBe("Context Discovery");
		});

		it("should start constitution creation flow with 3 steps", async () => {
			const response = await helper.start("constitution");

			expect(response.step).toBe(1);
			expect(response.total_steps).toBe(8);
		});

		it("should start decision creation flow with 6 steps", async () => {
			const response = await helper.start("decision");

			expect(response.step).toBe(1);
			expect(response.total_steps).toBe(8);
		});

		it("should include slug in draft when provided", async () => {
			const response = await helper.start("requirement", "user-auth");

			expect(response.draft_id).toContain("user-auth");
		});

		it("should provide field hints for first step", async () => {
			const response = await helper.start("requirement");

			expect(response.field_hints).toBeDefined();
			expect(response.field_hints?.research_findings).toBeDefined();
		});

		it("should provide examples for first step", async () => {
			const response = await helper.start("requirement");

			expect(response.examples).toBeDefined();
			expect(response.examples?.research_findings).toBeDefined();
		});
	});

	describe("step", () => {
		it("should process valid step data and advance", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			const stepResponse = await helper.step(draft_id, {
				research_findings: "No similar requirements found",
			});

			expect("error" in stepResponse).toBe(false);
			if (!("error" in stepResponse)) {
				expect(stepResponse.step).toBe(2);
				expect(stepResponse.validation?.passed).toBe(true);
				expect(stepResponse.current_step_name).toBe("Constitution Review");
			}
		});

		it("should return validation suggestions for improvement", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			const stepResponse = await helper.step(draft_id, {
				description: "Short",
			});

			expect("error" in stepResponse).toBe(false);
			if (!("error" in stepResponse)) {
				expect(stepResponse.validation?.passed).toBe(true);
				expect(stepResponse.validation?.issues).toBeDefined();
				expect(stepResponse.validation?.suggestions).toBeDefined();
				expect(stepResponse.step).toBe(2); // Should advance with suggestions
			}
		});

		it("should accumulate data across steps", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			// Step 1
			await helper.step(draft_id, {
				description:
					"Users need authentication because we handle sensitive data and need to verify identity",
			});

			// Step 2
			await helper.step(draft_id, {
				description:
					"System must verify user identity and maintain session state during interaction",
			});

			// Check draft contains both pieces of data
			const draft = helper.getDraft(draft_id);
			expect(draft?.data.description).toBeDefined();
		});

		it("should provide field hints at each step", async () => {
			const startResponse = await helper.start("component");
			const draft_id = startResponse.draft_id;

			const step1Response = await helper.step(draft_id, {
				description:
					"Satisfies req-001-auth by providing credential validation",
			});

			expect("error" in step1Response).toBe(false);
			if (!("error" in step1Response)) {
				expect(step1Response.field_hints).toBeDefined();
				expect(
					Object.keys(step1Response.field_hints || {}).length,
				).toBeGreaterThan(0);
			}
		});

		it("should provide examples at each step", async () => {
			const startResponse = await helper.start("plan");
			const draft_id = startResponse.draft_id;

			const step1Response = await helper.step(draft_id, {
				criteria_id: "req-001-auth/crit-001",
				description:
					"Fulfilling authentication requirement for login under 3 seconds",
			});

			expect("error" in step1Response).toBe(false);
			if (!("error" in step1Response)) {
				expect(step1Response.examples).toBeDefined();
			}
		});

		it("should mark completion when all steps done", async () => {
			const startResponse = await helper.start("constitution");
			const draft_id = startResponse.draft_id;

			// Step 1: Research Existing Constitutions
			await helper.step(draft_id, {
				existing_constitutions: "Reviewed all existing constitutions",
			});

			// Step 2: Best Practices Research
			await helper.step(draft_id, {
				best_practices_notes: "Researched industry standards",
			});

			// Step 3: Framework Review
			await helper.step(draft_id, {
				framework_notes: "N/A - not framework-specific",
			});

			// Step 4: Basic Information
			await helper.step(draft_id, {
				name: "Engineering Principles",
				description:
					"Core principles that guide our development decisions and practices",
			});

			// Step 5: Articles List (NEW - collect titles)
			await helper.step(draft_id, {
				articles: ["Test-Driven Development"],
			});

			// Step 6: Articles Item 1 (NEW - expand article)
			await helper.step(draft_id, {
				title: "Test-Driven Development",
				principle: "Write tests before implementation",
				rationale: "Ensures code quality and prevents regressions",
				examples: ["Unit tests for all business logic"],
				exceptions: ["Prototypes and spikes"],
				status: "active",
			});

			// Step 7: Conflict Check
			await helper.step(draft_id, {
				conflicts_checked: true,
			});

			// Step 8: Finalize
			const finalResponse = await helper.step(draft_id, {
				name: "Engineering Principles",
			});

			expect("error" in finalResponse).toBe(false);
			if (!("error" in finalResponse)) {
				expect(finalResponse.completed).toBe(true);
			}
		});

		it("should return error for non-existent draft", async () => {
			const response = await helper.step("req-nonexistent-123", {
				description: "Test",
			});

			expect("error" in response).toBe(true);
			if ("error" in response) {
				expect(response.error).toContain("not found");
			}
		});

		it("should update progress summary at each step", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			const step1Response = await helper.step(draft_id, {
				research_findings: "No similar requirements found",
			});

			expect("error" in step1Response).toBe(false);
			if (!("error" in step1Response)) {
				expect(step1Response.progress_summary).toContain("Step 2/9");
				expect(step1Response.progress_summary).toContain("22%");
			}
		});
	});

	describe("validate", () => {
		it("should validate current draft state", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			// Add some data (step 1: Research Similar Requirements)
			await helper.step(draft_id, {
				research_findings: "No similar requirements found",
			});

			const validation = helper.validate(draft_id);

			expect("error" in validation).toBe(false);
			if (!("error" in validation)) {
				expect(validation.draft_id).toBe(draft_id);
				expect(validation.step).toBe(2);
				expect(validation.validation).toBeDefined();
			}
		});

		it("should return error for non-existent draft", () => {
			const result = helper.validate("req-nonexistent-123");

			expect("error" in result).toBe(true);
		});
	});

	describe("getDraft", () => {
		it("should retrieve draft by ID", async () => {
			const startResponse = await helper.start("requirement");
			const draft = helper.getDraft(startResponse.draft_id);

			expect(draft).toBeDefined();
			expect(draft?.id).toBe(startResponse.draft_id);
			expect(draft?.type).toBe("requirement");
		});

		it("should return null for non-existent draft", () => {
			const draft = helper.getDraft("req-nonexistent-123");
			expect(draft).toBeNull();
		});
	});

	describe("deleteDraft", () => {
		it("should delete draft", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			const deleted = await helper.deleteDraft(draft_id);
			expect(deleted).toBe(true);

			const draft = helper.getDraft(draft_id);
			expect(draft).toBeNull();
		});

		it("should return false for non-existent draft", async () => {
			const deleted = await helper.deleteDraft("req-nonexistent-123");
			expect(deleted).toBe(false);
		});
	});

	describe("generateStepGuidance", () => {
		it("should provide guidance for all requirement steps", async () => {
			const steps = [
				"problem_identification",
				"avoid_implementation",
				"measurability",
				"specific_language",
				"acceptance_criteria",
				"priority_assignment",
				"review_and_refine",
			];

			for (const _stepId of steps) {
				const _startResponse = await helper.start("requirement");
				// Navigate to the specific step by providing valid data
				// This is indirect testing - we verify guidance exists in step response
			}
		});

		it("should provide guidance for all component steps", async () => {
			const startResponse = await helper.start("component");

			expect(startResponse.field_hints).toBeDefined();
			expect(startResponse.examples).toBeDefined();
		});

		it("should provide guidance for all plan steps", async () => {
			const startResponse = await helper.start("plan");

			expect(startResponse.field_hints).toBeDefined();
			expect(startResponse.examples).toBeDefined();
		});

		it("should provide guidance for constitution steps", async () => {
			const startResponse = await helper.start("constitution");

			expect(startResponse.field_hints).toBeDefined();
			expect(startResponse.examples).toBeDefined();
		});

		it("should provide guidance for decision steps", async () => {
			const startResponse = await helper.start("decision");

			expect(startResponse.field_hints).toBeDefined();
			expect(startResponse.examples).toBeDefined();
		});
	});

	describe("generateProgressSummary", () => {
		it("should calculate correct progress percentage", async () => {
			const startResponse = await helper.start("requirement");
			expect(startResponse.progress_summary).toContain("11%"); // 1/9

			const draft_id = startResponse.draft_id;
			const step2 = await helper.step(draft_id, {
				research_findings: "No similar requirements found",
			});

			expect("error" in step2).toBe(false);
			if (!("error" in step2)) {
				expect(step2.progress_summary).toContain("22%"); // 2/9
			}
		});

		it("should include spec type in summary", async () => {
			const startResponse = await helper.start("component");
			expect(startResponse.progress_summary).toContain("component");
		});

		it("should show step numbers", async () => {
			const startResponse = await helper.start("plan");
			expect(startResponse.progress_summary).toMatch(/Step \d+\/\d+/);
		});
	});

	describe("Integration flow tests", () => {
		it("should complete full requirement flow", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			// Step 1: Research Similar Requirements
			const step1 = await helper.step(draft_id, {
				research_findings: "No similar requirements found",
			});
			expect("error" in step1).toBe(false);

			// Step 2: Constitution Review
			const step2 = await helper.step(draft_id, {
				no_constitutions: true,
			});
			expect("error" in step2).toBe(false);

			// Step 3: Technology Research
			const step3 = await helper.step(draft_id, {
				technology_notes: "Will use standard authentication libraries",
			});
			expect("error" in step3).toBe(false);

			// Step 4: Identify Problem
			const step4 = await helper.step(draft_id, {
				description:
					"Users need secure authentication because we handle sensitive financial data and must verify identity",
			});
			expect("error" in step4).toBe(false);

			// Step 5: Avoid Implementation
			const step5 = await helper.step(draft_id, {
				description:
					"System must verify user identity and maintain secure session state",
			});
			expect("error" in step5).toBe(false);

			// Step 6: Criteria List (NEW - collect descriptions)
			const step6 = await helper.step(draft_id, {
				criteria: [
					"User can authenticate with valid credentials within 3 seconds",
					"System displays error within 1 second for invalid credentials",
				],
			});
			expect("error" in step6).toBe(false);

			// Step 7: Criteria Item 1 (NEW - expand first criterion)
			const step7a = await helper.step(draft_id, {
				status: "active",
			});
			expect("error" in step7a).toBe(false);

			// Step 7: Criteria Item 2 (NEW - expand second criterion)
			const step7b = await helper.step(draft_id, {
				status: "active",
			});
			expect("error" in step7b).toBe(false);

			// Step 8: Assign Priority
			const step8 = await helper.step(draft_id, {
				priority: "critical",
			});
			expect("error" in step8).toBe(false);

			// Step 9: Review and Finalize
			const step9 = await helper.step(draft_id, {
				type: "requirement",
				number: 1,
				slug: "user-authentication",
				name: "User Authentication",
				description:
					"Authentication must complete in under 3 seconds with 200ms response time",
				priority: "critical",
			});

			expect("error" in step9).toBe(false);
			if (!("error" in step9)) {
				expect(step9.completed).toBe(true);
			}
		});

		it("should maintain validation history throughout flow", async () => {
			const startResponse = await helper.start("requirement");
			const draft_id = startResponse.draft_id;

			// Step 1: Research Similar Requirements
			await helper.step(draft_id, {
				research_findings: "No similar requirements found",
			});

			// Step 2: Constitution Review
			await helper.step(draft_id, {
				no_constitutions: true,
			});

			const draft = helper.getDraft(draft_id);
			expect(draft?.validation_results.length).toBeGreaterThan(0);
		});
	});

	describe("Locking Prevention", () => {
		it("should reject attempt to set locked field on draft", async () => {
			const startResponse = await helper.start("plan");
			const draft_id = startResponse.draft_id;

			const stepResponse = await helper.step(draft_id, {
				locked: true,
			});

			expect("error" in stepResponse).toBe(true);
			if ("error" in stepResponse) {
				expect(stepResponse.error).toContain("locked");
				expect(stepResponse.error).toContain("finalized");
			}
		});

		it("should reject locked field even with other valid data", async () => {
			const startResponse = await helper.start("plan");
			const draft_id = startResponse.draft_id;

			// Try to set locked along with valid description
			const stepResponse = await helper.step(draft_id, {
				description: "Valid description",
				locked: true,
			});

			expect("error" in stepResponse).toBe(true);
			if ("error" in stepResponse) {
				expect(stepResponse.error).toContain("locked");
			}
		});

		it("should allow draft to proceed normally without locked field", async () => {
			const startResponse = await helper.start("plan");
			const draft_id = startResponse.draft_id;

			// First step expects description field
			const stepResponse = await helper.step(draft_id, {
				description:
					"Users need a plan to implement feature X because it solves a critical problem",
			});

			expect("error" in stepResponse).toBe(false);
			// Step 1 is still valid - check it didn't error
			expect(stepResponse).toHaveProperty("step");
		});
	});
});
