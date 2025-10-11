import { describe, expect, it } from "vitest";
import { MilestoneIdSchema, MilestoneSchema } from "./milestone.js";

describe("MilestoneIdSchema", () => {
	it("should validate correct milestone IDs", () => {
		expect(MilestoneIdSchema.parse("mls-001-v1-launch")).toBe(
			"mls-001-v1-launch",
		);
		expect(MilestoneIdSchema.parse("mls-999-q1-release")).toBe(
			"mls-999-q1-release",
		);
		expect(MilestoneIdSchema.parse("mls-042-beta-1")).toBe("mls-042-beta-1");
	});

	it("should reject invalid milestone IDs", () => {
		expect(() => MilestoneIdSchema.parse("mls-1-test")).toThrow();
		expect(() => MilestoneIdSchema.parse("mls-0001-test")).toThrow();
		expect(() => MilestoneIdSchema.parse("ms-001-test")).toThrow();
		expect(() => MilestoneIdSchema.parse("mls-001")).toThrow();
		expect(() => MilestoneIdSchema.parse("MLS-001-test")).toThrow();
		expect(() => MilestoneIdSchema.parse("mls-001-Test")).toThrow();
		expect(() => MilestoneIdSchema.parse("mls-001-test_name")).toThrow();
	});
});

describe("MilestoneSchema", () => {
	it("should validate a complete milestone", () => {
		const milestone = {
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

		const result = MilestoneSchema.parse(milestone);
		expect(result).toEqual(milestone);
	});

	it("should validate milestone with minimal fields", () => {
		const milestone = {
			type: "milestone",
			number: 1,
			slug: "beta-release",
			name: "Beta Release",
			description: "Beta version for testing",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				verified_at: null,
				notes: [],
			},
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		const result = MilestoneSchema.parse(milestone);
		expect(result.priority).toBe("medium"); // default
		expect(result.target_date).toBe(null); // default
		expect(result.references).toEqual([]); // default
	});

	it("should validate milestone with progress tracking", () => {
		const milestone = {
			type: "milestone",
			number: 1,
			slug: "mvp",
			name: "MVP Release",
			description: "Minimum viable product",
			priority: "critical",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: "2025-01-15T00:00:00Z",
				completed_at: "2025-02-01T00:00:00Z",
				verified_at: "2025-02-05T00:00:00Z",
				notes: [
					{ text: "Started development", timestamp: "2025-01-15T00:00:00Z" },
					{ text: "All features complete", timestamp: "2025-02-01T00:00:00Z" },
					{ text: "Verified by QA team", timestamp: "2025-02-05T00:00:00Z" },
				],
			},
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-02-05T00:00:00Z",
		};

		const result = MilestoneSchema.parse(milestone);
		expect(result.status.started_at).toBe("2025-01-15T00:00:00Z");
		expect(result.status.completed_at).toBe("2025-02-01T00:00:00Z");
		expect(result.status.verified_at).toBe("2025-02-05T00:00:00Z");
		expect(result.status.notes).toHaveLength(3);
	});

	it("should validate milestone with references", () => {
		const milestone = {
			type: "milestone",
			number: 1,
			slug: "q1-release",
			name: "Q1 Release",
			description: "First quarter deliverables",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				verified_at: null,
				notes: [],
			},
			references: [
				{
					type: "url",
					name: "Release Notes",
					description: "Detailed release notes",
					url: "https://example.com/release-notes",
				},
				{
					type: "documentation",
					name: "Project Plan",
					description: "Detailed project plan",
					library: "internal-docs",
					search_term: "q1-release-plan",
					importance: "high",
				},
			],
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		const result = MilestoneSchema.parse(milestone);
		expect(result.references).toHaveLength(2);
		expect(result.references[0].type).toBe("url");
		expect(result.references[1].importance).toBe("high");
	});

	it("should reject milestone with invalid type", () => {
		const milestone = {
			type: "plan", // wrong type
			number: 1,
			slug: "v1-launch",
			name: "Version 1.0 Launch",
			description: "Initial product release",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				verified_at: null,
				notes: [],
			},
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		expect(() => MilestoneSchema.parse(milestone)).toThrow();
	});

	it("should reject milestone with invalid priority", () => {
		const milestone = {
			type: "milestone",
			number: 1,
			slug: "v1-launch",
			name: "Version 1.0 Launch",
			description: "Initial product release",
			priority: "super-urgent", // invalid
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				verified_at: null,
				notes: [],
			},
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		expect(() => MilestoneSchema.parse(milestone)).toThrow();
	});

	it("should reject milestone with invalid status timestamps", () => {
		const milestone = {
			type: "milestone",
			number: 1,
			slug: "v1-launch",
			name: "Version 1.0 Launch",
			description: "Initial product release",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: "2025-02-01T00:00:00Z",
				completed_at: "2025-01-15T00:00:00Z", // before started_at
				verified_at: null,
				notes: [],
			},
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		expect(() => MilestoneSchema.parse(milestone)).toThrow();
	});

	it("should reject milestone with invalid target_date", () => {
		const milestone = {
			type: "milestone",
			number: 1,
			slug: "v1-launch",
			name: "Version 1.0 Launch",
			description: "Initial product release",
			target_date: "not-a-date",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				verified_at: null,
				notes: [],
			},
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
		};

		expect(() => MilestoneSchema.parse(milestone)).toThrow();
	});

	it("should reject milestone with missing required fields", () => {
		expect(() =>
			MilestoneSchema.parse({
				type: "milestone",
				// missing fields
			}),
		).toThrow();
	});

	it("should reject milestone with extra fields (strict mode)", () => {
		const milestone = {
			type: "milestone",
			number: 1,
			slug: "v1-launch",
			name: "Version 1.0 Launch",
			description: "Initial product release",
			status: {
				created_at: "2025-01-01T00:00:00Z",
				started_at: null,
				completed_at: null,
				verified_at: null,
				notes: [],
			},
			created_at: "2025-01-01T00:00:00Z",
			updated_at: "2025-01-01T00:00:00Z",
			extra_field: "should not be here",
		};

		expect(() => MilestoneSchema.parse(milestone)).toThrow();
	});
});
