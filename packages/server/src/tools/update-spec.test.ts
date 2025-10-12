import { SpecManager } from "@spec-mcp/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestComponent,
	createTestDecision,
	createTestPlan,
	createTestTechnicalRequirement,
} from "../../../core/tests/helpers.js";
import {
	updateBusinessRequirement,
	updateComponent,
	updateDecision,
	updatePlan,
	updateTechnicalRequirement,
} from "./index.js";

describe("Update Spec Tools", () => {
	let tempDir: string;
	let specManager: SpecManager;

	beforeEach(async () => {
		tempDir = await createTempDir("update-tools");
		specManager = new SpecManager(tempDir);
		await specManager.ensureFolders();
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("updatePlan", () => {
		let brdId: string;

		beforeEach(async () => {
			// Create a business requirement for plans to reference
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "test-req" }),
			);
			brdId = `brd-${String(brd.number).padStart(3, "0")}-test-req`;
		});

		it("should update plan title", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					name: "Original Title",
					criteria: {
						requirement: brdId,
						criteria: "crit-001",
					},
				}),
			);

			const result = await updatePlan(specManager, `pln-${plan.number}`, {
				title: "Updated Title",
			});

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.plans.get(1);
			expect(updated?.name).toBe("Updated Title");
		});

		it("should update plan description", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					description: "Original description",
					criteria: {
						requirement: brdId,
						criteria: "crit-001",
					},
				}),
			);

			const result = await updatePlan(specManager, `pln-${plan.number}`, {
				description: "Updated description",
			});

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.plans.get(1);
			expect(updated?.description).toBe("Updated description");
		});

		it("should not modify arrays when updating", async () => {
			const plan = await specManager.plans.create(
				createTestPlan({
					slug: "test-plan",
					criteria: {
						requirement: brdId,
						criteria: "crit-001",
					},
					flows: [
						{
							id: "flow-001",
							name: "Test Flow",
							description: "Test",
							type: "user",
							steps: [
								{
									id: "step-001",
									name: "Step 1",
									description: "First step",
									next_steps: [],
								},
							],
							supersedes: null,
							superseded_by: null,
							superseded_at: null,
						},
					],
				}),
			);

			await updatePlan(specManager, `pln-${plan.number}`, {
				title: "New Title",
			});

			const updated = await specManager.plans.get(1);
			expect(updated?.flows).toHaveLength(1);
			expect(updated?.flows[0].name).toBe("Test Flow");
		});
	});

	describe("updateBusinessRequirement", () => {
		it("should update BRD title and description", async () => {
			const brd = await specManager.business_requirements.create(
				createTestBusinessRequirement({
					slug: "test-brd",
					name: "Original Name",
					description: "Original description",
				}),
			);

			const result = await updateBusinessRequirement(
				specManager,
				`brd-${brd.number}`,
				{
					title: "Updated Name",
					description: "Updated description",
				},
			);

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.business_requirements.get(1);
			expect(updated?.name).toBe("Updated Name");
			expect(updated?.description).toBe("Updated description");
		});
	});

	describe("updateTechnicalRequirement", () => {
		it("should update PRD title and priority", async () => {
			const prd = await specManager.tech_requirements.create(
				createTestTechnicalRequirement({
					slug: "test-prd",
					name: "Original Name",
					priority: "medium",
				}),
			);

			const result = await updateTechnicalRequirement(
				specManager,
				`prd-${prd.number}`,
				{
					title: "Updated Name",
					priority: "high",
				},
			);

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.tech_requirements.get(1);
			expect(updated?.name).toBe("Updated Name");
			expect(updated?.priority).toBe("high");
		});
	});

	describe("updateDecision", () => {
		it("should update decision title", async () => {
			const decision = await specManager.decisions.create(
				createTestDecision({ slug: "test-decision", name: "Original Title" }),
			);

			const result = await updateDecision(
				specManager,
				`dcs-${decision.number}`,
				{ title: "Updated Title" },
			);

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.decisions.get(1);
			expect(updated?.name).toBe("Updated Title");
		});

		it("should update decision context and decision", async () => {
			const decision = await specManager.decisions.create(
				createTestDecision({
					slug: "test-decision",
					context: "Original context that has enough characters",
					decision: "Original decision that has enough characters",
				}),
			);

			const result = await updateDecision(
				specManager,
				`dcs-${decision.number}`,
				{
					context: "Updated context with sufficient length for validation",
					decision: "Updated decision with sufficient length for validation",
				},
			);

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.decisions.get(1);
			expect(updated?.context).toBe(
				"Updated context with sufficient length for validation",
			);
			expect(updated?.decision).toBe(
				"Updated decision with sufficient length for validation",
			);
		});
	});

	describe("updateComponent", () => {
		it("should update component title", async () => {
			const component = await specManager.components.create(
				createTestComponent({ slug: "test-component", name: "Original Title" }),
			);

			const result = await updateComponent(
				specManager,
				`cmp-${component.number}`,
				{ title: "Updated Title" },
			);

			expect(result.content[0].text).toContain("Success");

			const updated = await specManager.components.get(1);
			expect(updated?.name).toBe("Updated Title");
		});

		// TODO: Update this test - tech_stack schema was changed to use strings not objects
		it("should preserve arrays when updating", async () => {
			const component = await specManager.components.create(
				createTestComponent({
					slug: "test-component",
					tech_stack: ["React 18.0.0 - Frontend framework"],
				}),
			);

			await updateComponent(specManager, `cmp-${component.number}`, {
				description: "Updated description",
			});

			const updated = await specManager.components.get(1);
			expect(updated?.tech_stack).toHaveLength(1);
			expect(updated?.tech_stack[0]).toBe("React 18.0.0 - Frontend framework");
		});
	});

	describe("Error Handling", () => {
		it("should handle non-existent plan", async () => {
			const result = await updatePlan(specManager, "pln-999", {
				title: "New Title",
			});
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("not found");
		});

		it("should handle non-existent BRD", async () => {
			const result = await updateBusinessRequirement(specManager, "brd-999", {
				title: "New Title",
			});
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("not found");
		});

		it("should handle invalid spec ID format", async () => {
			const result = await updatePlan(specManager, "invalid-id", {
				title: "New Title",
			});
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Invalid entity ID");
		});
	});
});
