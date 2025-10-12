import { SpecManager } from "@spec-mcp/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestComponent,
	createTestDecision,
	createTestPlan,
} from "../../../core/tests/helpers.js";
import {
	// Decision tools
	addAlternative,
	addApiContract,
	addBusinessValue,
	addConsequence,
	// Criteria tools
	addCriteria,
	addDataModel,
	addDeployment,
	addExternalDependency,
	// Plan Array tools
	addFlow,
	// Reference tools
	addReferenceToPlan,
	// Component tools
	addTech,
	// Test Case tools
	addTestCase,
	// Business Requirement tools
	addUserStory,
	removeCriteria,
	removeUserStory,
	supersedeCriteria,
	supersedeFlow,
	supersedeTestCase,
} from "./index.js";

describe("Array Manipulation Tools", () => {
	let tempDir: string;
	let specManager: SpecManager;

	beforeEach(async () => {
		tempDir = await createTempDir("array-tools");
		specManager = new SpecManager(tempDir);
		await specManager.ensureFolders();
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("Criteria Tools", () => {
		let brdId: string;

		beforeEach(async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-brd" }),
			);
			brdId = `brd-${brd.number}`;
		});

		it("should add a criteria", async () => {
			const result = await addCriteria(
				specManager,
				brdId,
				"System should handle 1000 concurrent users",
				"Performance requirement for scalability",
			);

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("crit-002");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.criteria).toHaveLength(2);
			expect(brd?.criteria[1].description).toBe(
				"System should handle 1000 concurrent users",
			);
		});

		it("should remove a criteria", async () => {
			await addCriteria(specManager, brdId, "Test criteria", "Test rationale");
			const result = await removeCriteria(specManager, brdId, "crit-001");

			expect(result.content[0].text).toContain("Success");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.criteria).toHaveLength(1);
		});

		it("should supersede a criteria", async () => {
			await addCriteria(
				specManager,
				brdId,
				"Original description",
				"Original rationale",
			);

			const result = await supersedeCriteria(specManager, brdId, "crit-001", {
				description: "Updated description",
			});

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("crit-003");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.criteria).toHaveLength(3);

			const oldCriteria = brd?.criteria.find((c) => c.id === "crit-001");
			expect(oldCriteria?.superseded_by).toBe("crit-003");

			const newCriteria = brd?.criteria.find((c) => c.id === "crit-003");
			expect(newCriteria?.supersedes).toBe("crit-001");
			expect(newCriteria?.description).toBe("Updated description");
		});
	});

	describe("Business Requirement Tools", () => {
		let brdId: string;

		beforeEach(async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "test-brd",
				}),
			);
			brdId = `brd-${brd.number}`;
		});

		it("should add a user story", async () => {
			const result = await addUserStory(
				specManager,
				brdId,
				"user",
				"login to the system",
				"access my account",
			);

			expect(result.content[0].text).toContain("Success");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.user_stories).toHaveLength(2);
			expect(brd?.user_stories[1].role).toBe("user");
		});

		it("should remove a user story", async () => {
			// BRD already has one user story from createTestBusinessRequirement
			await addUserStory(
				specManager,
				brdId,
				"user",
				"test feature",
				"test benefit",
			);
			// Now there are 2 user stories, remove the second one (index 1)
			const result = await removeUserStory(specManager, brdId, 1);

			expect(result.content[0].text).toContain("Success");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.user_stories).toHaveLength(1);
		});

		it("should add business value", async () => {
			const result = await addBusinessValue(
				specManager,
				brdId,
				"revenue",
				"Expected to generate $100k annually",
			);

			expect(result.content[0].text).toContain("Success");

			const brd = await specManager.business_requirements.get(1);
			expect(brd?.business_value).toHaveLength(2);
			expect(brd?.business_value[1].type).toBe("revenue");
		});
	});

	describe("Test Case Tools", () => {
		let planId: string;

		beforeEach(async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan" }),
			);
			planId = `pln-${plan.number}`;
		});

		it("should add a test case", async () => {
			const result = await addTestCase(
				specManager,
				planId,
				"Login Flow Test",
				"Test the login functionality",
				["Navigate to login page", "Enter credentials", "Click submit"],
				"User should be logged in",
			);

			expect(result.content[0].text).toContain("Success");
			expect(result.content[0].text).toContain("tc-001");

			const plan = await specManager.plans.get(1);
			expect(plan?.test_cases).toHaveLength(1);
			expect(plan?.test_cases[0].name).toBe("Login Flow Test");
		});

		it("should supersede a test case", async () => {
			await addTestCase(
				specManager,
				planId,
				"Original Name",
				"Original desc",
				["Step 1"],
				"Result 1",
			);

			const result = await supersedeTestCase(specManager, planId, "tc-001", {
				name: "Updated Name",
				implemented: true,
			});

			expect(result.content[0].text).toContain("Success");

			const plan = await specManager.plans.get(1);
			const newCase = plan?.test_cases.find((t) => t.id === "tc-002");
			expect(newCase?.name).toBe("Updated Name");
			expect(newCase?.implemented).toBe(true);
		});
	});

	describe("Plan Array Tools", () => {
		let planId: string;

		beforeEach(async () => {
			// Create business requirement first for plan to reference
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
				}),
			);
			planId = `pln-${plan.number}`;
		});

		it("should add a flow", async () => {
			const result = await addFlow(
				specManager,
				planId,
				"User Registration Flow",
				"Flow for new user registration",
				["Visit signup page", "Fill form", "Verify email"],
			);

			expect(result.content[0].text).toContain("Success");

			const plan = await specManager.plans.get(1);
			expect(plan?.flows).toHaveLength(1);
			expect(plan?.flows[0].name).toBe("User Registration Flow");
		});

		it("should add an API contract", async () => {
			const result = await addApiContract(
				specManager,
				planId,
				"/api/users",
				"POST",
				"Create a new user",
				'{"name": "string", "email": "string"}',
				'{"id": "string", "created_at": "datetime"}',
			);

			expect(result.content[0].text).toContain("Success");

			const plan = await specManager.plans.get(1);
			expect(plan?.api_contracts).toHaveLength(1);
			expect(plan?.api_contracts[0].name).toBe("POST /api/users");
		});

		it("should add a data model", async () => {
			const result = await addDataModel(
				specManager,
				planId,
				"User",
				"User entity",
				["id: string", "name: string", "email: string"],
			);

			expect(result.content[0].text).toContain("Success");

			const plan = await specManager.plans.get(1);
			expect(plan?.data_models).toHaveLength(1);
			expect(plan?.data_models[0].name).toBe("User");
		});

		it("should supersede a flow", async () => {
			await addFlow(specManager, planId, "Original", "Original desc", [
				"Step 1",
			]);

			const result = await supersedeFlow(specManager, planId, "flow-001", {
				name: "Updated Flow Name",
			});

			expect(result.content[0].text).toContain("Success");

			const plan = await specManager.plans.get(1);
			const newFlow = plan?.flows.find((f) => f.id === "flow-002");
			expect(newFlow?.name).toBe("Updated Flow Name");
			expect(newFlow?.supersedes).toBe("flow-001");
		});
	});

	describe("Decision Tools", () => {
		let decisionId: string;

		beforeEach(async () => {
			const decision = await specManager.decisions.create(
				createTestDecision({ slug: "test-decision" }),
			);
			decisionId = `dcs-${decision.number}`;
		});

		it("should add an alternative", async () => {
			const result = await addAlternative(
				specManager,
				decisionId,
				"Alternative 1: First alternative with pros and cons",
			);

			expect(result.content[0].text).toContain("Success");

			const decision = await specManager.decisions.get(1);
			expect(decision?.alternatives).toHaveLength(1);
			expect(decision?.alternatives[0]).toBe(
				"Alternative 1: First alternative with pros and cons",
			);
		});

		it("should add a consequence", async () => {
			const result = await addConsequence(
				specManager,
				decisionId,
				"positive",
				"This will improve performance",
			);

			expect(result.content[0].text).toContain("Success");

			const decision = await specManager.decisions.get(1);
			expect(decision?.consequences).toHaveLength(3);
			expect(decision?.consequences[2].type).toBe("positive");
		});
	});

	describe("Component Tools", () => {
		let componentId: string;

		beforeEach(async () => {
			const component = await specManager.components.create(
				createTestComponent({ slug: "test-component" }),
			);
			componentId = `cmp-${component.number}`;
		});

		it("should add tech to stack", async () => {
			const result = await addTech(
				specManager,
				componentId,
				"React 18.0.0 - Frontend framework",
			);

			expect(result.content[0].text).toContain("Success");

			const component = await specManager.components.get(1);
			expect(component?.tech_stack).toHaveLength(1);
			expect(component?.tech_stack[0]).toBe(
				"React 18.0.0 - Frontend framework",
			);
		});

		it("should add deployment", async () => {
			const result = await addDeployment(
				specManager,
				componentId,
				"AWS ECS",
				"https://myapp.example.com",
				undefined,
				undefined,
				undefined,
				undefined,
				"Auto-scaling enabled",
			);

			expect(result.content[0].text).toContain("Success");

			const component = await specManager.components.get(1);
			expect(component?.deployments).toHaveLength(1);
			expect(component?.deployments[0].platform).toBe("AWS ECS");
		});

		it("should add external dependency", async () => {
			const result = await addExternalDependency(
				specManager,
				componentId,
				"Stripe API - Payment processing",
			);

			expect(result.content[0].text).toContain("Success");

			const component = await specManager.components.get(1);
			expect(component?.external_dependencies).toHaveLength(1);
			expect(component?.external_dependencies[0]).toBe(
				"Stripe API - Payment processing",
			);
		});
	});

	describe("Reference Tools", () => {
		it("should add reference to plan", async () => {
			// Create the referenced business requirement first (with slug matching plan's criteria)
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "placeholder" }),
			);

			const plan = await specManager.plans.create(
				createTestPlan({ slug: "test-plan" }),
			);

			const result = await addReferenceToPlan(
				specManager,
				`pln-${plan.number}`,
				{
					type: "url",
					name: "Reference documentation",
					description: "Link to external documentation",
					url: "https://example.com/doc",
				},
			);

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.plans.get(1);
			expect(updated?.references).toHaveLength(1);
			expect(updated?.references[0].url).toBe("https://example.com/doc");
		});
	});
});
