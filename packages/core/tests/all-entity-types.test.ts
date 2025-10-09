import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SpecManager } from "../src/spec-manager";
import {
	cleanupTempDir,
	createTempDir,
	createTestBusinessRequirement,
	createTestTechnicalRequirement,
	createTestPlan,
	createTestComponent,
	createTestConstitution,
	createTestDecision,
} from "./helpers";
import type {
	Plan,
	Component,
	Constitution,
	Decision,
	TechnicalRequirement,
} from "@spec-mcp/schemas";

describe("All Entity Types - CRUD Operations", () => {
	let tempDir: string;
	let specManager: SpecManager;

	beforeEach(async () => {
		tempDir = await createTempDir("all-entities");
		specManager = new SpecManager(tempDir);
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe("Plans", () => {
		it("should create a plan", async () => {
			const data = createTestPlan({
				slug: "implement-auth",
				name: "Implement Authentication",
			});

			const created = await specManager.plans.create(data);

			expect(created.number).toBe(1);
			expect(created.slug).toBe("implement-auth");
			expect(created.type).toBe("plan");
		});

		it("should read a plan", async () => {
			const data = createTestPlan({ slug: "test-plan", name: "Test Plan" });
			const created = await specManager.plans.create(data);

			const retrieved = await specManager.plans.get(created.number);

			expect(retrieved).not.toBeNull();
			expect(retrieved?.slug).toBe("test-plan");
		});

		it("should update a plan", async () => {
			const data = createTestPlan({ slug: "plan-1", name: "Plan 1" });
			const created = await specManager.plans.create(data);

			const updated = await specManager.plans.update(created.number, {
				name: "Updated Plan",
			});

			expect(updated.name).toBe("Updated Plan");
		});

		it("should delete a plan", async () => {
			const data = createTestPlan({ slug: "delete-plan", name: "Delete" });
			const created = await specManager.plans.create(data);

			await specManager.plans.deleteEntity(created.number);

			const deleted = await specManager.plans.get(created.number);
			expect(deleted).toBeNull();
		});

		it("should list plans", async () => {
			await specManager.plans.create(createTestPlan({ slug: "plan-1", name: "Plan 1" }));
			await specManager.plans.create(createTestPlan({ slug: "plan-2", name: "Plan 2" }));

			const all = await specManager.plans.list();

			expect(all).toHaveLength(2);
		});

		it("should create draft plans", async () => {
			const data = createTestPlan({
				slug: "draft-plan",
				name: "Draft Plan",
				draft: true,
			});

			const created = await specManager.plans.create(data);

			expect(created.draft).toBe(true);
		});
	});

	describe("Components", () => {
		it("should create a component", async () => {
			const data = createTestComponent({
				slug: "auth-service",
				name: "Auth Service",
			});

			const created = await specManager.components.create(data);

			expect(created.number).toBe(1);
			expect(created.slug).toBe("auth-service");
			expect(created.type).toBe("component");
		});

		it("should read a component", async () => {
			const data = createTestComponent({ slug: "test-component", name: "Test" });
			const created = await specManager.components.create(data);

			const retrieved = await specManager.components.get(created.number);

			expect(retrieved).not.toBeNull();
			expect(retrieved?.slug).toBe("test-component");
		});

		it("should update a component", async () => {
			const data = createTestComponent({ slug: "comp-1", name: "Component 1" });
			const created = await specManager.components.create(data);

			const updated = await specManager.components.update(created.number, {
				name: "Updated Component",
			});

			expect(updated.name).toBe("Updated Component");
		});

		it("should delete a component", async () => {
			const data = createTestComponent({ slug: "delete-comp", name: "Delete" });
			const created = await specManager.components.create(data);

			await specManager.components.deleteEntity(created.number);

			const deleted = await specManager.components.get(created.number);
			expect(deleted).toBeNull();
		});

		it("should list components", async () => {
			await specManager.components.create(createTestComponent({ slug: "comp-1", name: "Comp 1" }));
			await specManager.components.create(createTestComponent({ slug: "comp-2", name: "Comp 2" }));

			const all = await specManager.components.list();

			expect(all).toHaveLength(2);
		});

		it("should create draft components", async () => {
			const data = createTestComponent({
				slug: "draft-component",
				name: "Draft Component",
				draft: true,
			});

			const created = await specManager.components.create(data);

			expect(created.draft).toBe(true);
		});
	});

	describe("Constitutions", () => {
		it("should create a constitution", async () => {
			const data = createTestConstitution({
				slug: "team-values",
				name: "Team Values",
			});

			const created = await specManager.constitutions.create(data);

			expect(created.number).toBe(1);
			expect(created.slug).toBe("team-values");
			expect(created.type).toBe("constitution");
		});

		it("should read a constitution", async () => {
			const data = createTestConstitution({ slug: "test-const", name: "Test" });
			const created = await specManager.constitutions.create(data);

			const retrieved = await specManager.constitutions.get(created.number);

			expect(retrieved).not.toBeNull();
			expect(retrieved?.slug).toBe("test-const");
		});

		it("should update a constitution", async () => {
			const data = createTestConstitution({ slug: "const-1", name: "Constitution 1" });
			const created = await specManager.constitutions.create(data);

			const updated = await specManager.constitutions.update(created.number, {
				name: "Updated Constitution",
			});

			expect(updated.name).toBe("Updated Constitution");
		});

		it("should delete a constitution", async () => {
			const data = createTestConstitution({ slug: "delete-const", name: "Delete" });
			const created = await specManager.constitutions.create(data);

			await specManager.constitutions.deleteEntity(created.number);

			const deleted = await specManager.constitutions.get(created.number);
			expect(deleted).toBeNull();
		});

		it("should list constitutions", async () => {
			await specManager.constitutions.create(createTestConstitution({ slug: "const-1", name: "Const 1" }));
			await specManager.constitutions.create(createTestConstitution({ slug: "const-2", name: "Const 2" }));

			const all = await specManager.constitutions.list();

			expect(all).toHaveLength(2);
		});

		it("should create draft constitutions", async () => {
			const data = createTestConstitution({
				slug: "draft-constitution",
				name: "Draft Constitution",
				draft: true,
			});

			const created = await specManager.constitutions.create(data);

			expect(created.draft).toBe(true);
		});
	});

	describe("Decisions", () => {
		it("should create a decision", async () => {
			const data = createTestDecision({
				slug: "use-typescript",
				name: "Use TypeScript",
			});

			const created = await specManager.decisions.create(data);

			expect(created.number).toBe(1);
			expect(created.slug).toBe("use-typescript");
			expect(created.type).toBe("decision");
		});

		it("should read a decision", async () => {
			const data = createTestDecision({ slug: "test-decision", name: "Test" });
			const created = await specManager.decisions.create(data);

			const retrieved = await specManager.decisions.get(created.number);

			expect(retrieved).not.toBeNull();
			expect(retrieved?.slug).toBe("test-decision");
		});

		it("should update a decision", async () => {
			const data = createTestDecision({ slug: "dec-1", name: "Decision 1" });
			const created = await specManager.decisions.create(data);

			const updated = await specManager.decisions.update(created.number, {
				name: "Updated Decision",
			});

			expect(updated.name).toBe("Updated Decision");
		});

		it("should delete a decision", async () => {
			const data = createTestDecision({ slug: "delete-dec", name: "Delete" });
			const created = await specManager.decisions.create(data);

			await specManager.decisions.deleteEntity(created.number);

			const deleted = await specManager.decisions.get(created.number);
			expect(deleted).toBeNull();
		});

		it("should list decisions", async () => {
			await specManager.decisions.create(createTestDecision({ slug: "dec-1", name: "Dec 1" }));
			await specManager.decisions.create(createTestDecision({ slug: "dec-2", name: "Dec 2" }));

			const all = await specManager.decisions.list();

			expect(all).toHaveLength(2);
		});

		it("should create draft decisions", async () => {
			const data = createTestDecision({
				slug: "draft-decision",
				name: "Draft Decision",
				draft: true,
			});

			const created = await specManager.decisions.create(data);

			expect(created.draft).toBe(true);
		});
	});

	describe("All Entity Types Together", () => {
		it("should handle all entity types with independent numbering", async () => {
			// Create one of each type
			const br = await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "br-1", name: "BR 1" })
		);
		const tr = await specManager.tech_requirements.create(
			createTestTechnicalRequirement({ slug: "tr-1", name: "TR 1" })
		);
			const plan = await specManager.plans.create(
				createTestPlan({ slug: "plan-1", name: "Plan 1" })
			);
			const component = await specManager.components.create(
				createTestComponent({ slug: "comp-1", name: "Comp 1" })
			);
			const constitution = await specManager.constitutions.create(
				createTestConstitution({ slug: "const-1", name: "Const 1" })
			);
			const decision = await specManager.decisions.create(
				createTestDecision({ slug: "dec-1", name: "Dec 1" })
			);

			// All should have number 1 (independent numbering)
			expect(br.number).toBe(1);
			expect(tr.number).toBe(1);
			expect(plan.number).toBe(1);
			expect(component.number).toBe(1);
			expect(constitution.number).toBe(1);
			expect(decision.number).toBe(1);

			// All should have correct types
			expect(br.type).toBe("business-requirement");
			expect(tr.type).toBe("technical-requirement");
			expect(plan.type).toBe("plan");
			expect(component.type).toBe("component");
			expect(constitution.type).toBe("constitution");
			expect(decision.type).toBe("decision");
		});

		it("should list each entity type separately", async () => {
			// Create multiple of each type
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "br-1", name: "BR 1" })
			);
			await specManager.business_requirements.create(
				createTestBusinessRequirement({ slug: "br-2", name: "BR 2" })
			);
			await specManager.plans.create(createTestPlan({ slug: "plan-1", name: "Plan 1" }));
			await specManager.components.create(createTestComponent({ slug: "comp-1", name: "Comp 1" }));

			const brList = await specManager.business_requirements.list();
			const planList = await specManager.plans.list();
			const compList = await specManager.components.list();

			expect(brList).toHaveLength(2);
			expect(planList).toHaveLength(1);
			expect(compList).toHaveLength(1);
		});
	});
});
