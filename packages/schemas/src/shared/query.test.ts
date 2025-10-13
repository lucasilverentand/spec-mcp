import { describe, expect, it } from "vitest";
import type { Query } from "./query.js";
import { QuerySchema } from "./query.js";

describe("Query Schema Validation", () => {
	describe("Valid Queries", () => {
		it("should accept empty query (all defaults)", () => {
			const query: Query = {};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.orderBy).toBe("created");
				expect(result.data.direction).toBe("desc");
			}
		});

		it("should accept query with draft filter", () => {
			const query: Query = { draft: true };
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with single ID", () => {
			const query: Query = { id: "pln-001" };
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with array of IDs", () => {
			const query: Query = { id: ["pln-001", "breq-002"] };
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with spec types", () => {
			const query: Query = {
				objects: {
					specTypes: ["plan", "business-requirement"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with item types", () => {
			const query: Query = {
				objects: {
					itemTypes: ["task", "test-case"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with completed filter", () => {
			const query: Query = { completed: true };
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with verified filter", () => {
			const query: Query = { verified: false };
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with priority filter", () => {
			const query: Query = {
				priority: ["critical", "high"],
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with milestone filter", () => {
			const query: Query = {
				milestone: "mls-001-q1-release",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with status filter", () => {
			const query: Query = {
				status: ["in-progress", "completed"],
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with orderBy", () => {
			const query: Query = {
				orderBy: "next-to-do",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query with direction", () => {
			const query: Query = {
				direction: "asc",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept complex query with multiple filters", () => {
			const query: Query = {
				draft: false,
				objects: {
					itemTypes: ["task"],
				},
				completed: false,
				priority: ["critical", "high"],
				status: ["not-started", "in-progress"],
				orderBy: "next-to-do",
				direction: "asc",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});
	});

	describe("Invalid Queries", () => {
		it("should reject query with invalid draft type", () => {
			const query = { draft: "true" }; // string instead of boolean
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid ID type", () => {
			const query = { id: 123 }; // number instead of string
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty ID array", () => {
			const query = { id: [] }; // empty array not allowed
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid spec type", () => {
			const query = {
				objects: {
					specTypes: ["invalid-type"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty spec types array", () => {
			const query = {
				objects: {
					specTypes: [],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid item type", () => {
			const query = {
				objects: {
					itemTypes: ["invalid-item"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty item types array", () => {
			const query = {
				objects: {
					itemTypes: [],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with both spec types and item types", () => {
			const query = {
				objects: {
					specTypes: ["plan"],
					itemTypes: ["task"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid completed type", () => {
			const query = { completed: "yes" }; // string instead of boolean
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid verified type", () => {
			const query = { verified: 1 }; // number instead of boolean
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid priority", () => {
			const query = {
				priority: ["super-critical"], // invalid priority value
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid status", () => {
			const query = {
				status: ["pending"], // invalid status value
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid orderBy", () => {
			const query = {
				orderBy: "random", // invalid order value
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid direction", () => {
			const query = {
				direction: "up", // invalid direction value
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with extra fields", () => {
			const query = {
				draft: true,
				extraField: "not allowed",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid milestone type", () => {
			const query = {
				milestone: 123, // number instead of string
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty milestone string", () => {
			const query = {
				milestone: "", // empty string not allowed
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty priority array", () => {
			const query = {
				priority: [], // empty array not allowed
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty status array", () => {
			const query = {
				status: [], // empty array not allowed
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty string in ID array", () => {
			const query = {
				id: ["pln-001", ""], // empty string in array not allowed
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with empty ID string", () => {
			const query = {
				id: "", // empty string not allowed
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid priority in array", () => {
			const query = {
				priority: ["critical", "invalid-priority"], // mixed valid and invalid
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with invalid status in array", () => {
			const query = {
				status: ["in-progress", "invalid-status"], // mixed valid and invalid
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with null values", () => {
			const query = {
				draft: null, // null not allowed
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should reject query with undefined in arrays", () => {
			const query = {
				priority: [undefined], // undefined not allowed in arrays
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});
	});

	describe("Edge Cases", () => {
		it("should accept all valid spec types", () => {
			const validSpecTypes = [
				"business-requirement",
				"technical-requirement",
				"plan",
				"component",
				"constitution",
				"decision",
				"milestone",
			];

			for (const specType of validSpecTypes) {
				const query = {
					objects: {
						specTypes: [specType],
					},
				};
				const result = QuerySchema.safeParse(query);
				expect(result.success).toBe(true, `Failed for spec type: ${specType}`);
			}
		});

		it("should accept all valid item types", () => {
			const validItemTypes = [
				"task",
				"test-case",
				"criteria",
				"flow",
				"api-contract",
				"data-model",
				"user-story",
			];

			for (const itemType of validItemTypes) {
				const query = {
					objects: {
						itemTypes: [itemType],
					},
				};
				const result = QuerySchema.safeParse(query);
				expect(result.success).toBe(true, `Failed for item type: ${itemType}`);
			}
		});

		it("should accept all valid priorities", () => {
			const validPriorities = [
				"critical",
				"high",
				"medium",
				"low",
				"nice-to-have",
			];

			for (const priority of validPriorities) {
				const query = {
					priority: [priority],
				};
				const result = QuerySchema.safeParse(query);
				expect(result.success).toBe(true, `Failed for priority: ${priority}`);
			}
		});

		it("should accept all valid statuses", () => {
			const validStatuses = [
				"not-started",
				"in-progress",
				"completed",
				"verified",
			];

			for (const status of validStatuses) {
				const query = {
					status: [status],
				};
				const result = QuerySchema.safeParse(query);
				expect(result.success).toBe(true, `Failed for status: ${status}`);
			}
		});

		it("should accept all valid orderBy values", () => {
			const validOrderBy = ["next-to-do", "created", "updated"];

			for (const order of validOrderBy) {
				const query = {
					orderBy: order,
				};
				const result = QuerySchema.safeParse(query);
				expect(result.success).toBe(true, `Failed for orderBy: ${order}`);
			}
		});

		it("should accept all valid direction values", () => {
			const validDirections = ["asc", "desc"];

			for (const direction of validDirections) {
				const query = {
					direction: direction,
				};
				const result = QuerySchema.safeParse(query);
				expect(result.success).toBe(true, `Failed for direction: ${direction}`);
			}
		});

		it("should apply defaults for optional fields", () => {
			const query = {};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.orderBy).toBe("created");
				expect(result.data.direction).toBe("desc");
			}
		});
	});

	describe("Type Constraints", () => {
		it("should enforce mutual exclusivity of spec types and item types", () => {
			// This should fail because you can't have both
			const query = {
				objects: {
					specTypes: ["plan"],
					itemTypes: ["task"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should require at least one spec type when using specTypes", () => {
			const query = {
				objects: {
					specTypes: [],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should require at least one item type when using itemTypes", () => {
			const query = {
				objects: {
					itemTypes: [],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(false);
		});

		it("should allow multiple spec types", () => {
			const query = {
				objects: {
					specTypes: ["plan", "business-requirement", "component"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow multiple item types", () => {
			const query = {
				objects: {
					itemTypes: ["task", "test-case", "criteria"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow multiple priorities", () => {
			const query = {
				priority: ["critical", "high", "medium"],
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow multiple statuses", () => {
			const query = {
				status: ["not-started", "in-progress", "completed", "verified"],
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});
	});

	describe("Semantic Validation", () => {
		it("should allow completed filter without objects (applies to all)", () => {
			const query = {
				completed: true,
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow completed filter with spec types (will be ignored by engine)", () => {
			const query = {
				objects: {
					specTypes: ["plan"],
				},
				completed: true,
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow completed filter with item types (will be applied)", () => {
			const query = {
				objects: {
					itemTypes: ["task"],
				},
				completed: true,
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow verified filter with any object types", () => {
			const query = {
				objects: {
					itemTypes: ["task", "test-case"],
				},
				verified: true,
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow status filter with spec types (for plans)", () => {
			const query = {
				objects: {
					specTypes: ["plan"],
				},
				status: ["in-progress"],
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow milestone filter with plans", () => {
			const query = {
				objects: {
					specTypes: ["plan"],
				},
				milestone: "mls-001-q1",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should allow milestone filter with tasks", () => {
			const query = {
				objects: {
					itemTypes: ["task"],
				},
				milestone: "mls-001-q1",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});
	});

	describe("Real-world Query Examples", () => {
		it("should accept query for all critical incomplete tasks", () => {
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				priority: ["critical"],
				completed: false,
				orderBy: "next-to-do",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query for all draft plans", () => {
			const query: Query = {
				draft: true,
				objects: {
					specTypes: ["plan"],
				},
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query for tasks in specific plan", () => {
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				id: "pln-001",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query for in-progress plans by milestone", () => {
			const query: Query = {
				objects: {
					specTypes: ["plan"],
				},
				milestone: "mls-001-q1-release",
				status: ["in-progress"],
				orderBy: "next-to-do",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query for all failing test cases", () => {
			const query: Query = {
				objects: {
					itemTypes: ["test-case"],
				},
				completed: true,
				verified: false,
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query for all verified tasks sorted by creation", () => {
			const query: Query = {
				objects: {
					itemTypes: ["task"],
				},
				verified: true,
				orderBy: "created",
				direction: "desc",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});

		it("should accept query for high priority requirements", () => {
			const query: Query = {
				objects: {
					specTypes: ["business-requirement", "technical-requirement"],
				},
				priority: ["critical", "high"],
				orderBy: "next-to-do",
			};
			const result = QuerySchema.safeParse(query);
			expect(result.success).toBe(true);
		});
	});
});
