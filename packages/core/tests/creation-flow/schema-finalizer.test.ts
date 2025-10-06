import { describe, expect, it } from "vitest";
import { finalizeDraft } from "../../src/creation-flow/schema-finalizer.js";

describe("finalizeDraft", () => {
	describe("Constitution finalization", () => {
		it("should auto-generate number if not provided", () => {
			const draftData = {
				type: "constitution",
				// number is intentionally omitted
				slug: "auto-number-test",
				name: "Auto Number Test",
				description: "Test auto-number generation",
				articles: [
					{
						id: "art-001",
						title: "Test Article",
						principle: "Test principle",
						rationale: "Test rationale",
					},
				],
			};

			const result = finalizeDraft("constitution", draftData);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should remove Q&A flow metadata fields from constitution draft", () => {
			const draftData = {
				// Q&A flow metadata (should be removed)
				existing_constitutions: "No existing constitutions found",
				best_practices_notes: "Researched SOLID principles",
				framework_notes: "Not applicable",
				conflicts_checked: true,
				conflict_notes: "No conflicts found",
				articles_descriptions: ["Test-Driven Development"],

				// Actual constitution data (should be kept)
				type: "constitution",
				number: 1,
				slug: "engineering-principles",
				name: "Engineering Principles",
				description:
					"Core engineering principles guiding all development decisions",
				articles: [
					{
						id: "art-001",
						title: "Test-Driven Development",
						principle: "Write tests before implementation",
						rationale: "Ensures code quality and prevents regressions",
						examples: ["Unit tests for business logic"],
						exceptions: ["Prototypes"],
						status: "active" as const,
					},
				],
				locked: false,
			};

			const result = finalizeDraft("constitution", draftData);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();

			if (result.data) {
				const finalData = result.data as Record<string, unknown>;

				// Verify Q&A metadata was removed
				expect(finalData).not.toHaveProperty("existing_constitutions");
				expect(finalData).not.toHaveProperty("best_practices_notes");
				expect(finalData).not.toHaveProperty("framework_notes");
				expect(finalData).not.toHaveProperty("conflicts_checked");
				expect(finalData).not.toHaveProperty("conflict_notes");
				expect(finalData).not.toHaveProperty("articles_descriptions");

				// Verify actual data was preserved
				expect(finalData.type).toBe("constitution");
				expect(finalData.name).toBe("Engineering Principles");
				expect(finalData.articles).toHaveLength(1);
			}
		});

		it("should fail validation if required fields are missing", () => {
			const draftData = {
				type: "constitution",
				number: 1,
				slug: "test",
				// Missing: name, description, articles
			};

			const result = finalizeDraft("constitution", draftData);

			expect(result.success).toBe(false);
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
		});

		it("should drop arbitrary extra fields not in schema", () => {
			const draftData = {
				// Arbitrary extra fields that aren't in flowSpecificFields list
				random_field: "should be removed",
				another_field: 123,
				nested_object: { foo: "bar" },

				// Required constitution data
				type: "constitution",
				number: 1,
				slug: "test-principles",
				name: "Test Principles",
				description: "Test description",
				articles: [
					{
						id: "art-001",
						title: "Test Article",
						principle: "Test principle",
						rationale: "Test rationale",
					},
				],
			};

			const result = finalizeDraft("constitution", draftData);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();

			if (result.data) {
				const finalData = result.data as Record<string, unknown>;

				// Verify arbitrary fields were removed
				expect(finalData).not.toHaveProperty("random_field");
				expect(finalData).not.toHaveProperty("another_field");
				expect(finalData).not.toHaveProperty("nested_object");

				// Verify actual data was preserved
				expect(finalData.type).toBe("constitution");
				expect(finalData.name).toBe("Test Principles");
			}
		});
	});

	describe("Decision finalization", () => {
		it("should remove Q&A flow metadata fields from decision draft", () => {
			const draftData = {
				// Q&A flow metadata (should be removed)
				related_decisions: "No related decisions found",
				technology_options_notes: "Researched PostgreSQL and MongoDB",
				alternatives_research: "Detailed comparison of database options",

				// Actual decision data (should be kept)
				type: "decision",
				number: 1,
				slug: "database-selection",
				name: "Database Selection",
				description: "Choosing database technology for application",
				decision: "Use PostgreSQL as primary database",
				context:
					"Need relational database with ACID compliance for financial data",
				alternatives: ["MongoDB", "MySQL", "SQLite"],
				consequences: {
					positive: ["Strong ACID compliance", "Excellent performance"],
					negative: ["Higher resource usage"],
					risks: ["Vendor lock-in"],
					mitigation: ["Use connection abstraction layer"],
				},
				locked: false,
			};

			const result = finalizeDraft("decision", draftData);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();

			if (result.data) {
				const finalData = result.data as Record<string, unknown>;

				// Verify Q&A metadata was removed
				expect(finalData).not.toHaveProperty("related_decisions");
				expect(finalData).not.toHaveProperty("technology_options_notes");
				expect(finalData).not.toHaveProperty("alternatives_research");

				// Verify actual data was preserved
				expect(finalData.type).toBe("decision");
				expect(finalData.name).toBe("Database Selection");
				expect(finalData.decision).toBe("Use PostgreSQL as primary database");
			}
		});
	});

	describe("Requirement finalization", () => {
		it("should work without number field", () => {
			const draftData = {
				type: "requirement",
				// number is intentionally omitted
				slug: "user-auth",
				name: "User Authentication",
				description: "Users can authenticate to access the system",
				priority: "critical" as const,
				criteria: ["User can log in"],
				locked: false,
			};

			const result = finalizeDraft("requirement", draftData);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should convert criteria strings to objects with IDs", () => {
			const draftData = {
				type: "requirement",
				number: 1,
				slug: "user-auth",
				name: "User Authentication",
				description: "Users can authenticate to access the system",
				priority: "critical" as const,
				criteria: [
					"User can log in with email and password",
					"Password reset via email",
				],
				locked: false,
			};

			const result = finalizeDraft("requirement", draftData);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();

			if (result.data) {
				const finalData = result.data as Record<string, unknown>;
				const criteria = finalData.criteria as Array<{
					id: string;
					description: string;
				}>;

				expect(criteria).toHaveLength(2);
				expect(criteria[0]).toHaveProperty("id", "crit-001");
				expect(criteria[0]).toHaveProperty(
					"description",
					"User can log in with email and password",
				);
				expect(criteria[1]).toHaveProperty("id", "crit-002");
				expect(criteria[1]).toHaveProperty(
					"description",
					"Password reset via email",
				);
			}
		});
	});
});
