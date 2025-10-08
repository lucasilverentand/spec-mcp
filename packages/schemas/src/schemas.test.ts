import { describe, it, expect } from "vitest";
import {
	EntityTypeSchema,
	EntitySlugSchema,
	ItemPrioritySchema,
	BaseSchema,
	CompletionStatusSchema,
	ItemStatusSchema,
} from "./shared/base";
import { DraftSchema, DraftQuestionSchema } from "./shared/draft";
import { ReferenceSchema, ReferenceTypeSchema } from "./shared/reference";

describe("Base Schemas", () => {
	describe("EntityTypeSchema", () => {
		it("should accept valid entity types", () => {
			const validTypes = [
				"requirement",
				"plan",
				"app",
				"component",
				"constitution",
				"decision",
			];
			for (const type of validTypes) {
				expect(() => EntityTypeSchema.parse(type)).not.toThrow();
			}
		});

		it("should reject invalid entity types", () => {
			expect(() => EntityTypeSchema.parse("invalid")).toThrow();
		});
	});

	describe("EntitySlugSchema", () => {
		it("should accept valid slugs", () => {
			const validSlugs = ["user-auth", "api-v2", "123-test"];
			for (const slug of validSlugs) {
				expect(() => EntitySlugSchema.parse(slug)).not.toThrow();
			}
		});

		it("should transform and clean slugs", () => {
			expect(EntitySlugSchema.parse("--test-slug--")).toBe("test-slug");
			expect(EntitySlugSchema.parse("multiple----dashes")).toBe(
				"multiple-dashes",
			);
		});

		it("should reject invalid slugs", () => {
			expect(() => EntitySlugSchema.parse("Invalid Slug")).toThrow();
			expect(() => EntitySlugSchema.parse("slug_with_underscore")).toThrow();
		});
	});

	describe("ItemPrioritySchema", () => {
		it("should accept valid priorities", () => {
			const validPriorities = [
				"critical",
				"high",
				"medium",
				"low",
				"nice-to-have",
			];
			for (const priority of validPriorities) {
				expect(() => ItemPrioritySchema.parse(priority)).not.toThrow();
			}
		});

		it("should reject invalid priorities", () => {
			expect(() => ItemPrioritySchema.parse("invalid")).toThrow();
		});
	});

	describe("BaseSchema", () => {
		it("should validate a complete base entity", () => {
			const validBase = {
				type: "requirement",
				number: 1,
				slug: "test-requirement",
				name: "Test Requirement",
				description: "A test requirement",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				priority: "medium",
			};
			expect(() => BaseSchema.parse(validBase)).not.toThrow();
		});

		it("should reject invalid datetime strings", () => {
			const invalidBase = {
				type: "requirement",
				number: 1,
				slug: "test",
				name: "Test",
				description: "Test",
				created_at: "invalid-date",
				updated_at: new Date().toISOString(),
			};
			expect(() => BaseSchema.parse(invalidBase)).toThrow();
		});
	});
});

describe("Draft Schemas", () => {
	describe("DraftQuestionSchema", () => {
		it("should accept valid draft questions", () => {
			const validQuestion = {
				question: "What is the requirement name?",
				answer: "User Authentication",
			};
			expect(() => DraftQuestionSchema.parse(validQuestion)).not.toThrow();
		});

		it("should accept null answers with default", () => {
			const questionWithoutAnswer = {
				question: "What is the requirement name?",
			};
			const result = DraftQuestionSchema.parse(questionWithoutAnswer);
			expect(result.answer).toBeNull();
		});
	});

	describe("DraftSchema", () => {
		it("should validate a complete draft", () => {
			const validDraft = {
				id: "draft-001",
				type: "requirement",
				name: "Test Draft",
				slug: "test-draft",
				questions: [
					{
						question: "What is the name?",
						answer: "Test",
					},
				],
				currentQuestionIndex: 0,
				created_at: new Date().toISOString(),
			};
			expect(() => DraftSchema.parse(validDraft)).not.toThrow();
		});

		it("should reject invalid draft IDs", () => {
			const invalidDraft = {
				id: "invalid-id",
				type: "requirement",
				name: "Test",
				slug: "test",
				questions: [{ question: "Test?", answer: "Yes" }],
				created_at: new Date().toISOString(),
			};
			expect(() => DraftSchema.parse(invalidDraft)).toThrow();
		});
	});
});

describe("Reference Schemas", () => {
	describe("ReferenceTypeSchema", () => {
		it("should accept valid reference types", () => {
			const validTypes = ["url", "documentation", "file", "code", "other"];
			for (const type of validTypes) {
				expect(() => ReferenceTypeSchema.parse(type)).not.toThrow();
			}
		});
	});

	describe("ReferenceSchema", () => {
		it("should validate URL references", () => {
			const urlRef = {
				type: "url",
				name: "Documentation",
				description: "API docs",
				importance: "high",
				url: "https://example.com/docs",
			};
			expect(() => ReferenceSchema.parse(urlRef)).not.toThrow();
		});

		it("should validate documentation references", () => {
			const docRef = {
				type: "documentation",
				name: "React Docs",
				description: "React hooks guide",
				importance: "medium",
				library: "react",
				search_term: "hooks",
			};
			expect(() => ReferenceSchema.parse(docRef)).not.toThrow();
		});

		it("should validate file references", () => {
			const fileRef = {
				type: "file",
				name: "Config",
				description: "App configuration",
				importance: "low",
				path: "/config/app.yml",
			};
			expect(() => ReferenceSchema.parse(fileRef)).not.toThrow();
		});

		it("should validate code references", () => {
			const codeRef = {
				type: "code",
				name: "Example",
				description: "Code example",
				importance: "medium",
				code: "const x = 1;",
				language: "javascript",
			};
			expect(() => ReferenceSchema.parse(codeRef)).not.toThrow();
		});

		it("should reject invalid URL format", () => {
			const invalidUrlRef = {
				type: "url",
				name: "Bad URL",
				description: "Invalid",
				importance: "low",
				url: "not-a-url",
			};
			expect(() => ReferenceSchema.parse(invalidUrlRef)).toThrow();
		});
	});
});

describe("Status Schemas", () => {
	describe("CompletionStatusSchema", () => {
		it("should set defaults correctly", () => {
			const result = CompletionStatusSchema.parse({});
			expect(result.completed).toBe(false);
			expect(result.completed_at).toBeNull();
		});

		it("should accept valid completion status", () => {
			const status = {
				completed: true,
				completed_at: new Date().toISOString(),
			};
			expect(() => CompletionStatusSchema.parse(status)).not.toThrow();
		});
	});

	describe("ItemStatusSchema", () => {
		it("should set defaults correctly", () => {
			const result = ItemStatusSchema.parse({});
			expect(result.verified).toBe(false);
			expect(result.verified_at).toBeNull();
			expect(result.notes).toEqual([]);
		});

		it("should accept valid item status", () => {
			const status = {
				verified: true,
				verified_at: new Date().toISOString(),
				notes: ["Reviewed and approved", "Tested successfully"],
			};
			expect(() => ItemStatusSchema.parse(status)).not.toThrow();
		});
	});
});
