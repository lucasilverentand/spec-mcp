import { describe, expect, it } from "vitest";
import {
	ReferenceSchema,
	ReferenceTypeSchema,
} from "../../../src/entities/shared/reference-schema.js";

describe("ReferenceTypeSchema", () => {
	it("should accept valid reference types", () => {
		const validTypes = ["url", "documentation", "file", "code", "other"];

		for (const type of validTypes) {
			expect(() => ReferenceTypeSchema.parse(type)).not.toThrow();
		}
	});

	it("should reject invalid reference types", () => {
		const invalidTypes = [
			"api",
			"library",
			"tool",
			"example",
			"tutorial",
			"",
			null,
			undefined,
		];

		for (const type of invalidTypes) {
			expect(() => ReferenceTypeSchema.parse(type)).toThrow();
		}
	});
});

describe("ReferenceSchema", () => {
	it("should accept valid URL reference", () => {
		const validReference = {
			type: "url",
			name: "API Documentation",
			description: "REST API documentation",
			url: "https://api.example.com/docs",
		};

		expect(() => ReferenceSchema.parse(validReference)).not.toThrow();
	});

	it("should accept valid documentation reference", () => {
		const validReference = {
			type: "documentation",
			name: "React Hooks",
			description: "React hooks documentation",
			library: "react",
			search_term: "hooks",
		};

		expect(() => ReferenceSchema.parse(validReference)).not.toThrow();
	});

	it("should accept valid file reference", () => {
		const validReference = {
			type: "file",
			name: "Config File",
			description: "Application configuration",
			path: "./config/app.json",
		};

		expect(() => ReferenceSchema.parse(validReference)).not.toThrow();
	});

	it("should accept valid code reference", () => {
		const validReference = {
			type: "code",
			name: "Helper Function",
			description: "Utility function for formatting",
			code: "function format(str) { return str.trim(); }",
			language: "javascript",
		};

		expect(() => ReferenceSchema.parse(validReference)).not.toThrow();
	});

	it("should accept valid other reference", () => {
		const validReference = {
			type: "other",
			name: "General Reference",
			description: "Miscellaneous reference material",
		};

		expect(() => ReferenceSchema.parse(validReference)).not.toThrow();
	});

	it("should set default importance to medium", () => {
		const reference = {
			type: "other",
			name: "Test Reference",
			description: "Test description",
		};

		const parsed = ReferenceSchema.parse(reference);
		expect(parsed.importance).toBe("medium");
	});

	it("should require mandatory fields for each type", () => {
		const urlReferenceWithoutUrl = {
			type: "url",
			name: "Test Reference",
			description: "Test description",
		};
		expect(() => ReferenceSchema.parse(urlReferenceWithoutUrl)).toThrow();

		const docReferenceWithoutLibrary = {
			type: "documentation",
			name: "Test Reference",
			description: "Test description",
			search_term: "test",
		};
		expect(() => ReferenceSchema.parse(docReferenceWithoutLibrary)).toThrow();

		const fileReferenceWithoutPath = {
			type: "file",
			name: "Test Reference",
			description: "Test description",
		};
		expect(() => ReferenceSchema.parse(fileReferenceWithoutPath)).toThrow();

		const codeReferenceWithoutCode = {
			type: "code",
			name: "Test Reference",
			description: "Test description",
		};
		expect(() => ReferenceSchema.parse(codeReferenceWithoutCode)).toThrow();
	});

	it("should reject empty strings for required fields", () => {
		const referenceWithEmptyName = {
			type: "other",
			name: "",
			description: "Test description",
		};
		expect(() => ReferenceSchema.parse(referenceWithEmptyName)).toThrow();

		const referenceWithEmptyDescription = {
			type: "other",
			name: "Test Reference",
			description: "",
		};
		expect(() =>
			ReferenceSchema.parse(referenceWithEmptyDescription),
		).toThrow();
	});

	it("should validate URL format for URL references", () => {
		const referenceWithInvalidUrl = {
			type: "url",
			name: "Test Reference",
			description: "Test description",
			url: "not-a-valid-url",
		};
		expect(() => ReferenceSchema.parse(referenceWithInvalidUrl)).toThrow();
	});

	it("should accept valid URL formats for URL references", () => {
		const validUrls = [
			"https://example.com",
			"http://localhost:3000",
			"https://api.example.com/v1/docs",
			"https://github.com/user/repo",
		];

		for (const url of validUrls) {
			const reference = {
				type: "url",
				name: "Test Reference",
				description: "Test description",
				url,
			};
			expect(() => ReferenceSchema.parse(reference)).not.toThrow();
		}
	});

	it("should accept valid importance levels", () => {
		const importanceLevels = ["low", "medium", "high", "critical"];

		for (const importance of importanceLevels) {
			const reference = {
				type: "other",
				name: "Test Reference",
				description: "Test description",
				importance,
			};
			expect(() => ReferenceSchema.parse(reference)).not.toThrow();
		}
	});

	it("should accept optional mime_type for URL references", () => {
		const reference = {
			type: "url",
			name: "Test Reference",
			description: "Test description",
			url: "https://example.com/file.pdf",
			mime_type: "application/pdf",
		};
		expect(() => ReferenceSchema.parse(reference)).not.toThrow();
	});

	it("should accept optional language for code references", () => {
		const reference = {
			type: "code",
			name: "Test Code",
			description: "Test code snippet",
			code: "console.log('hello');",
		};
		expect(() => ReferenceSchema.parse(reference)).not.toThrow();
	});
});
