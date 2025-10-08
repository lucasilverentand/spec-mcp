import { describe, expect, it } from "vitest";
import { SpecManager } from "../src/core/spec-manager";
import { useTempDir } from "./helpers";

describe("SpecManager", () => {
	const { createTempDir } = useTempDir();

	it("should initialize with all entity managers", async () => {
		const tempDir = await createTempDir();
		const sm = new SpecManager(tempDir);

		expect(sm.requirements).toBeDefined();
		expect(sm.plans).toBeDefined();
		expect(sm.components).toBeDefined();
		expect(sm.constitutions).toBeDefined();
		expect(sm.decisions).toBeDefined();
	});

	it("should get base path", async () => {
		const tempDir = await createTempDir();
		const sm = new SpecManager(tempDir);
		expect(sm.getBasePath()).toBe(tempDir);
	});

	it("should ensure all folders", async () => {
		const tempDir = await createTempDir();
		const sm = new SpecManager(tempDir);

		await sm.ensureFolders();

		expect(await sm.requirements.exists("test")).toBe(false);
		expect(await sm.plans.exists("test")).toBe(false);
		expect(await sm.components.exists("test")).toBe(false);
		expect(await sm.constitutions.exists("test")).toBe(false);
		expect(await sm.decisions.exists("test")).toBe(false);
	});

	it("should work with requirements manager", async () => {
		const tempDir = await createTempDir();
		const sm = new SpecManager(tempDir);

		const req = await sm.requirements.create({
			type: "requirement",
			slug: "integration-test",
			name: "Integration Test",
			description: "Test integration",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "high",
			criteria: [
				{
					id: "crit-001",
					description: "Should work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		expect(req.number).toBe(1);
		const retrieved = await sm.requirements.get("integration-test");
		expect(retrieved).toEqual(req);
	});

	it("should work with multiple entity types", async () => {
		const tempDir = await createTempDir();
		const sm = new SpecManager(tempDir);

		await sm.requirements.create({
			type: "requirement",
			slug: "req-1",
			name: "Requirement 1",
			description: "Test",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: [
				{
					id: "crit-001",
					description: "Must work",
					status: "needs-review",
				},
			],
			status: { verified: false, verified_at: null, notes: [] },
		});

		await sm.plans.create({
			type: "plan",
			slug: "plan-1",
			name: "Plan 1",
			description: "Test plan",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			priority: "medium",
			criteria: {
				requirement: "req-001-test",
				criteria: "crit-001",
			},
			scope: [],
			depends_on: [],
			tasks: [],
			flows: [],
			test_cases: [],
			api_contracts: [],
			data_models: [],
			references: [],
		});

		const requirements = await sm.requirements.list();
		const plans = await sm.plans.list();

		expect(requirements).toHaveLength(1);
		expect(plans).toHaveLength(1);
	});
});
