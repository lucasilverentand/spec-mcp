import { describe, expect, it } from "vitest";
import {
	BaseSchema,
	EntitySlugSchema,
	type EntityType,
	EntityTypeSchema,
	shortenEntityType,
} from "../../src/core/base-entity.js";

describe("EntityTypeSchema", () => {
	it("should accept valid entity types", () => {
		const validTypes = ["requirement", "plan", "app", "service", "library"];

		for (const type of validTypes) {
			expect(() => EntityTypeSchema.parse(type)).not.toThrow();
		}
	});

	it("should reject invalid entity types", () => {
		const invalidTypes = ["invalid", "req", "pln", "", null, undefined];

		for (const type of invalidTypes) {
			expect(() => EntityTypeSchema.parse(type)).toThrow();
		}
	});
});

describe("EntitySlugSchema", () => {
	it("should accept valid slugs", () => {
		const validSlugs = [
			"hello-world",
			"test123",
			"single",
			"kebab-case-slug",
			"with-numbers-123",
		];

		for (const slug of validSlugs) {
			expect(() => EntitySlugSchema.parse(slug)).not.toThrow();
		}
	});

	it("should clean up slugs by removing leading/trailing dashes", () => {
		expect(EntitySlugSchema.parse("-hello-world-")).toBe("hello-world");
		expect(EntitySlugSchema.parse("--test--")).toBe("test");
		expect(EntitySlugSchema.parse("---leading")).toBe("leading");
		expect(EntitySlugSchema.parse("trailing---")).toBe("trailing");
	});

	it("should normalize multiple consecutive dashes", () => {
		expect(EntitySlugSchema.parse("hello--world")).toBe("hello-world");
		expect(EntitySlugSchema.parse("test---slug")).toBe("test-slug");
		expect(EntitySlugSchema.parse("multiple----dashes")).toBe(
			"multiple-dashes",
		);
	});

	it("should reject invalid slugs", () => {
		const invalidSlugs = [
			"",
			"hello world", // spaces
			"hello_world", // underscores not allowed
			"Hello-World", // uppercase not allowed
			"hello@world", // special characters
			"hello.world", // dots
		];

		for (const slug of invalidSlugs) {
			expect(() => EntitySlugSchema.parse(slug)).toThrow();
		}
	});

	it("should trim whitespace", () => {
		expect(EntitySlugSchema.parse("  hello-world  ")).toBe("hello-world");
		expect(EntitySlugSchema.parse("\t test \n")).toBe("test");
	});
});

describe("BaseSchema", () => {
	it("should accept valid base entity data", () => {
		const validData = {
			type: "requirement" as EntityType,
			number: 1,
			slug: "test-requirement",
			name: "Test Requirement",
			description: "A test requirement for validation",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		expect(() => BaseSchema.parse(validData)).not.toThrow();
	});

	it("should require all fields", () => {
		const requiredFields = [
			"type",
			"number",
			"slug",
			"name",
			"description",
			"created_at",
			"updated_at",
		];

		for (const field of requiredFields) {
			const invalidData = {
				type: "requirement" as EntityType,
				number: 1,
				slug: "test",
				name: "Test",
				description: "Test description",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			delete (invalidData as Record<string, unknown>)[field];

			expect(() => BaseSchema.parse(invalidData)).toThrow();
		}
	});

	it("should reject negative numbers", () => {
		const invalidData = {
			type: "requirement" as EntityType,
			number: -1,
			slug: "test",
			name: "Test",
			description: "Test description",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		expect(() => BaseSchema.parse(invalidData)).toThrow();
	});

	it("should reject empty strings", () => {
		const fieldsToTest = ["slug", "name", "description"];

		for (const field of fieldsToTest) {
			const invalidData = {
				type: "requirement" as EntityType,
				number: 1,
				slug: "test",
				name: "Test",
				description: "Test description",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				[field]: "",
			};

			expect(() => BaseSchema.parse(invalidData)).toThrow();
		}
	});
});

describe("shortenEntityType", () => {
	it("should return correct short forms for known entity types", () => {
		expect(shortenEntityType("requirement")).toBe("req");
		expect(shortenEntityType("plan")).toBe("pln");
		expect(shortenEntityType("app")).toBe("app");
		expect(shortenEntityType("service")).toBe("svc");
		expect(shortenEntityType("library")).toBe("lib");
	});

	it("should fallback to first 3 characters for unknown types", () => {
		// This tests the fallback behavior, though in practice this shouldn't happen
		// with proper TypeScript typing
		expect(shortenEntityType("unknown" as EntityType)).toBe("unk");
		expect(shortenEntityType("test" as EntityType)).toBe("tes");
	});
});
