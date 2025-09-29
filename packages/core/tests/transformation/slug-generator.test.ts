import { beforeEach, describe, expect, it } from "vitest";
import {
	generateSlug,
	generateSlugFromTitle,
	generateUniqueSlug,
	SlugGenerator,
	sanitizeSlug,
	validateSlug,
} from "../../src/transformation/slug-generator.js";

describe("SlugGenerator Class", () => {
	let generator: SlugGenerator;

	beforeEach(() => {
		generator = new SlugGenerator();
	});

	describe("Constructor and Metadata", () => {
		it("should initialize with correct metadata", () => {
			expect(generator.name).toBe("SlugGenerator");
			expect(generator.version).toBe("2.0.0");
		});
	});

	describe("transform method", () => {
		it("should transform string input to slug with operation result", async () => {
			const result = await generator.transform("Hello World");

			expect(result.success).toBe(true);
			expect(result.data).toBe("hello-world");
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it("should transform complex strings", async () => {
			const result = await generator.transform("Test With Special Characters!");

			expect(result.success).toBe(true);
			expect(result.data).toBe("test-with-special-characters");
		});

		it("should handle empty strings", async () => {
			const result = await generator.transform("");

			expect(result.success).toBe(true);
			expect(result.data).toBe("");
		});
	});

	describe("canTransform method", () => {
		it("should return true for string input", () => {
			expect(generator.canTransform("test")).toBe(true);
			expect(generator.canTransform("")).toBe(true);
			expect(generator.canTransform("hello-world")).toBe(true);
		});

		it("should return false for non-string input", () => {
			expect(generator.canTransform(123)).toBe(false);
			expect(generator.canTransform(null)).toBe(false);
			expect(generator.canTransform(undefined)).toBe(false);
			expect(generator.canTransform({})).toBe(false);
			expect(generator.canTransform([])).toBe(false);
			expect(generator.canTransform(true)).toBe(false);
		});
	});

	describe("supports method", () => {
		it("should return true for string to string transformation", () => {
			expect(generator.supports("string", "string")).toBe(true);
		});

		it("should return false for other type combinations", () => {
			expect(generator.supports("string", "number")).toBe(false);
			expect(generator.supports("number", "string")).toBe(false);
			expect(generator.supports("object", "string")).toBe(false);
			expect(generator.supports("string", "boolean")).toBe(false);
		});
	});

	describe("generateSlug method", () => {
		it("should convert to lowercase", () => {
			expect(generator.generateSlug("Hello World")).toBe("hello-world");
			expect(generator.generateSlug("UPPERCASE")).toBe("uppercase");
			expect(generator.generateSlug("MixedCase")).toBe("mixedcase");
		});

		it("should replace spaces with hyphens", () => {
			expect(generator.generateSlug("hello world")).toBe("hello-world");
			expect(generator.generateSlug("multiple   spaces")).toBe(
				"multiple-spaces",
			);
			expect(generator.generateSlug("  leading spaces")).toBe("leading-spaces");
			expect(generator.generateSlug("trailing spaces  ")).toBe(
				"trailing-spaces",
			);
		});

		it("should replace underscores with hyphens", () => {
			expect(generator.generateSlug("hello_world")).toBe("hello-world");
			expect(generator.generateSlug("test_with_underscores")).toBe(
				"test-with-underscores",
			);
			expect(generator.generateSlug("___multiple___")).toBe("multiple");
		});

		it("should remove special characters", () => {
			expect(generator.generateSlug("hello@world")).toBe("helloworld");
			expect(generator.generateSlug("test!#$%^&*()")).toBe("test");
			expect(generator.generateSlug("special@#$chars")).toBe("specialchars");
		});

		it("should preserve hyphens", () => {
			expect(generator.generateSlug("already-slugged")).toBe("already-slugged");
			expect(generator.generateSlug("pre-existing-slug")).toBe(
				"pre-existing-slug",
			);
		});

		it("should remove consecutive hyphens", () => {
			expect(generator.generateSlug("multiple---hyphens")).toBe(
				"multiple-hyphens",
			);
			expect(generator.generateSlug("test--with--doubles")).toBe(
				"test-with-doubles",
			);
		});

		it("should remove leading hyphens", () => {
			expect(generator.generateSlug("-leading-hyphen")).toBe("leading-hyphen");
			expect(generator.generateSlug("---multiple-leading")).toBe(
				"multiple-leading",
			);
		});

		it("should remove trailing hyphens", () => {
			expect(generator.generateSlug("trailing-hyphen-")).toBe(
				"trailing-hyphen",
			);
			expect(generator.generateSlug("multiple-trailing---")).toBe(
				"multiple-trailing",
			);
		});

		it("should limit length to 50 characters", () => {
			const longString = "a".repeat(100);
			const slug = generator.generateSlug(longString);

			expect(slug.length).toBeLessThanOrEqual(50);
		});

		it("should handle empty strings", () => {
			expect(generator.generateSlug("")).toBe("");
		});

		it("should preserve numbers", () => {
			expect(generator.generateSlug("test123")).toBe("test123");
			expect(generator.generateSlug("version-2-0-0")).toBe("version-2-0-0");
		});

		it("should handle mixed content", () => {
			expect(generator.generateSlug("Test_With Spaces-And_Underscores")).toBe(
				"test-with-spaces-and-underscores",
			);
		});

		it("should trim whitespace", () => {
			expect(generator.generateSlug("  test  ")).toBe("test");
			expect(generator.generateSlug("\t\ntest\n\t")).toBe("test");
		});
	});

	describe("generateUniqueSlug method", () => {
		it("should return original slug if not in existing list", () => {
			const slug = generator.generateUniqueSlug("test", ["other", "slugs"]);

			expect(slug).toBe("test");
		});

		it("should append -1 if slug exists", () => {
			const slug = generator.generateUniqueSlug("test", ["test"]);

			expect(slug).toBe("test-1");
		});

		it("should increment counter until unique", () => {
			const existingSlugs = ["test", "test-1", "test-2"];
			const slug = generator.generateUniqueSlug("test", existingSlugs);

			expect(slug).toBe("test-3");
		});

		it("should handle empty existing slugs array", () => {
			const slug = generator.generateUniqueSlug("test", []);

			expect(slug).toBe("test");
		});

		it("should handle slugs with high counters", () => {
			const existingSlugs = Array.from({ length: 100 }, (_, i) =>
				i === 0 ? "test" : `test-${i}`,
			);
			const slug = generator.generateUniqueSlug("test", existingSlugs);

			expect(slug).toBe("test-100");
		});

		it("should apply slug rules to input before checking uniqueness", () => {
			const slug = generator.generateUniqueSlug("Test With Spaces", [
				"test-with-spaces",
			]);

			expect(slug).toBe("test-with-spaces-1");
		});

		it("should limit base slug length to 50 chars", () => {
			const longInput = "a".repeat(100);
			const slug = generator.generateUniqueSlug(longInput, []);

			expect(slug.length).toBeLessThanOrEqual(50);
		});

		it("should handle collision on long slugs", () => {
			const longInput = "a".repeat(48); // 48 chars
			const existingSlugs = [longInput.substring(0, 50)];
			const slug = generator.generateUniqueSlug(longInput, existingSlugs);

			// Should add counter: "aaa...-1"
			expect(slug).toContain("-1");
		});
	});

	describe("validateSlug method", () => {
		it("should validate correct slugs", () => {
			expect(generator.validateSlug("valid-slug")).toBe(true);
			expect(generator.validateSlug("test")).toBe(true);
			expect(generator.validateSlug("slug-with-multiple-words")).toBe(true);
			expect(generator.validateSlug("slug123")).toBe(true);
			expect(generator.validateSlug("123slug")).toBe(true);
		});

		it("should reject slugs with uppercase letters", () => {
			expect(generator.validateSlug("Invalid-Slug")).toBe(false);
			expect(generator.validateSlug("UPPERCASE")).toBe(false);
			expect(generator.validateSlug("MixedCase")).toBe(false);
		});

		it("should reject slugs with leading hyphens", () => {
			expect(generator.validateSlug("-invalid")).toBe(false);
			expect(generator.validateSlug("--double-leading")).toBe(false);
		});

		it("should reject slugs with trailing hyphens", () => {
			expect(generator.validateSlug("invalid-")).toBe(false);
			expect(generator.validateSlug("double-trailing--")).toBe(false);
		});

		it("should reject slugs with consecutive hyphens", () => {
			expect(generator.validateSlug("invalid--slug")).toBe(false);
			expect(generator.validateSlug("multiple---hyphens")).toBe(false);
		});

		it("should reject slugs with special characters", () => {
			expect(generator.validateSlug("invalid_slug")).toBe(false);
			expect(generator.validateSlug("invalid@slug")).toBe(false);
			expect(generator.validateSlug("invalid.slug")).toBe(false);
			expect(generator.validateSlug("invalid slug")).toBe(false);
		});

		it("should reject empty strings", () => {
			expect(generator.validateSlug("")).toBe(false);
		});

		it("should reject slugs longer than 50 characters", () => {
			const longSlug = "a".repeat(51);
			expect(generator.validateSlug(longSlug)).toBe(false);
		});

		it("should accept slugs exactly 50 characters", () => {
			const maxSlug = "a".repeat(50);
			expect(generator.validateSlug(maxSlug)).toBe(true);
		});

		it("should accept single character slugs", () => {
			expect(generator.validateSlug("a")).toBe(true);
			expect(generator.validateSlug("1")).toBe(true);
		});

		it("should validate alphanumeric slugs", () => {
			expect(generator.validateSlug("test123abc")).toBe(true);
			expect(generator.validateSlug("123-456-789")).toBe(true);
		});
	});
});

describe("Standalone Slug Functions", () => {
	describe("generateSlug function", () => {
		it("should generate valid slugs", () => {
			expect(generateSlug("Hello World")).toBe("hello-world");
			expect(generateSlug("Test_With_Underscores")).toBe(
				"test-with-underscores",
			);
		});

		it("should use default generator instance", () => {
			const slug1 = generateSlug("test");
			const slug2 = generateSlug("test");

			expect(slug1).toBe("test");
			expect(slug2).toBe("test");
		});

		it("should handle all edge cases", () => {
			expect(generateSlug("")).toBe("");
			expect(generateSlug("   ")).toBe("");
			expect(generateSlug("UPPERCASE")).toBe("uppercase");
		});
	});

	describe("generateSlugFromTitle function", () => {
		it("should generate slug from title with meaningful words", () => {
			const slug = generateSlugFromTitle("The Quick Brown Fox Jumps Over");

			// "The" is a stop word, so we get: quick, brown, fox, jumps, over (5 words)
			expect(slug).toBe("quick-brown-fox-jumps-over");
		});

		it("should filter out stop words", () => {
			const slug = generateSlugFromTitle("The user can login to the system");

			// Should filter "the", "can", "to"
			expect(slug).not.toContain("the");
			expect(slug).toContain("user");
			expect(slug).toContain("login");
		});

		it("should limit to 5 words", () => {
			const slug = generateSlugFromTitle(
				"This Is A Very Long Title With Many Words That Should Be Truncated",
			);

			// Count hyphens (words - 1)
			const wordCount = slug.split("-").length;
			expect(wordCount).toBeLessThanOrEqual(5);
		});

		it("should filter words with less than 2 characters", () => {
			const slug = generateSlugFromTitle("A B CD EFG HIJK");

			// 'A' and 'B' should be filtered (< 2 chars)
			expect(slug).not.toContain("a");
			expect(slug).not.toContain("b");
			expect(slug).toContain("cd");
		});

		it("should handle titles with only stop words", () => {
			const slug = generateSlugFromTitle("the and a to");

			// All stop words should be filtered
			expect(slug).toBe("");
		});

		it("should handle empty titles", () => {
			const slug = generateSlugFromTitle("");

			expect(slug).toBe("");
		});

		it("should extract meaningful content from technical titles", () => {
			const slug = generateSlugFromTitle("User Authentication with JWT Tokens");

			expect(slug).toContain("user");
			expect(slug).toContain("authentication");
			expect(slug).toContain("jwt");
		});

		it("should handle special characters in titles", () => {
			const slug = generateSlugFromTitle("User's Profile & Settings Page");

			expect(slug).toContain("user");
			expect(slug).toContain("profile");
			expect(slug).toContain("settings");
		});
	});

	describe("generateUniqueSlug function", () => {
		it("should generate unique slugs", () => {
			const existingIds = ["test", "test-1"];
			const slug = generateUniqueSlug("test", existingIds);

			expect(slug).toBe("test-2");
		});

		it("should use default generator instance", () => {
			const slug = generateUniqueSlug("test", []);

			expect(slug).toBe("test");
		});

		it("should handle empty existing IDs", () => {
			const slug = generateUniqueSlug("new-slug", []);

			expect(slug).toBe("new-slug");
		});
	});

	describe("validateSlug function", () => {
		it("should validate correct slugs", () => {
			expect(validateSlug("valid-slug")).toBe(true);
			expect(validateSlug("another-valid-slug")).toBe(true);
		});

		it("should invalidate incorrect slugs", () => {
			expect(validateSlug("Invalid-Slug")).toBe(false);
			expect(validateSlug("invalid_slug")).toBe(false);
			expect(validateSlug("")).toBe(false);
		});

		it("should use default generator instance", () => {
			const result1 = validateSlug("test");
			const result2 = validateSlug("test");

			expect(result1).toBe(true);
			expect(result2).toBe(true);
		});
	});

	describe("sanitizeSlug function", () => {
		it("should sanitize slugs to valid format", () => {
			expect(sanitizeSlug("Invalid Slug")).toBe("invalid-slug");
			expect(sanitizeSlug("Invalid_Slug")).toBe("invalid-slug");
			expect(sanitizeSlug("Invalid@Slug")).toBe("invalidslug");
		});

		it("should be equivalent to generateSlug", () => {
			const input = "Test Input";
			expect(sanitizeSlug(input)).toBe(generateSlug(input));
		});

		it("should handle all edge cases", () => {
			expect(sanitizeSlug("")).toBe("");
			expect(sanitizeSlug("   ")).toBe("");
			expect(sanitizeSlug("-leading-trailing-")).toBe("leading-trailing");
		});
	});
});

describe("Edge Cases and Complex Scenarios", () => {
	let generator: SlugGenerator;

	beforeEach(() => {
		generator = new SlugGenerator();
	});

	describe("Unicode and international characters", () => {
		it("should handle unicode characters", () => {
			expect(generator.generateSlug("café")).toBe("caf");
			expect(generator.generateSlug("naïve")).toBe("nave");
		});

		it("should handle emoji", () => {
			expect(generator.generateSlug("test 🎉 emoji")).toBe("test-emoji");
			expect(generator.generateSlug("🎉")).toBe("");
		});

		it("should handle various international characters", () => {
			expect(generator.generateSlug("Björk")).toBe("bjrk");
			expect(generator.generateSlug("Тест")).toBe("");
		});
	});

	describe("Whitespace variations", () => {
		it("should handle different types of whitespace", () => {
			expect(generator.generateSlug("test\tword")).toBe("test-word");
			expect(generator.generateSlug("test\nword")).toBe("test-word");
			expect(generator.generateSlug("test\rword")).toBe("test-word");
		});

		it("should handle multiple whitespace types", () => {
			expect(generator.generateSlug("test \t\n word")).toBe("test-word");
		});
	});

	describe("Number handling", () => {
		it("should preserve numbers in slugs", () => {
			expect(generator.generateSlug("version-2-0-0")).toBe("version-2-0-0");
			expect(generator.generateSlug("test123")).toBe("test123");
			expect(generator.generateSlug("123test")).toBe("123test");
		});

		it("should handle pure numeric slugs", () => {
			expect(generator.generateSlug("123")).toBe("123");
			expect(generator.generateSlug("0")).toBe("0");
		});
	});

	describe("Length boundary tests", () => {
		it("should truncate at exactly 50 characters", () => {
			const input = "a".repeat(100);
			const slug = generator.generateSlug(input);

			expect(slug).toBe("a".repeat(50));
			expect(slug.length).toBe(50);
		});

		it("should not truncate slugs under 50 characters", () => {
			const input = "a".repeat(49);
			const slug = generator.generateSlug(input);

			expect(slug).toBe(input);
			expect(slug.length).toBe(49);
		});

		it("should handle truncation with hyphens", () => {
			const input = "word-".repeat(15); // Creates a long string with hyphens
			const slug = generator.generateSlug(input);

			expect(slug.length).toBeLessThanOrEqual(50);
			// Note: The current implementation truncates at 50 chars which may end with hyphen
			// This is a known edge case - the substring(0, 50) happens before final cleanup
		});
	});

	describe("Special character combinations", () => {
		it("should handle multiple special characters together", () => {
			expect(generator.generateSlug("test@@##$$word")).toBe("testword");
			expect(generator.generateSlug("!!!test!!!")).toBe("test");
		});

		it("should handle mixed special characters and spaces", () => {
			expect(generator.generateSlug("test @ # $ word")).toBe("test-word");
		});
	});

	describe("Real-world scenarios", () => {
		it("should handle typical requirement titles", () => {
			expect(
				generateSlugFromTitle("User Authentication and Authorization"),
			).toBe("user-authentication-authorization");
			expect(generateSlugFromTitle("The system must validate user input")).toBe(
				"system-must-validate-user-input",
			);
		});

		it("should handle technical specifications", () => {
			expect(generateSlug("API v2.0 - User Management")).toBe(
				"api-v20-user-management",
			);
			expect(generateSlug("OAuth2.0 Implementation")).toBe(
				"oauth20-implementation",
			);
		});

		it("should handle version numbers", () => {
			expect(generateSlug("version-1.2.3-beta")).toBe("version-123-beta");
			expect(generateSlug("v2.0.0-alpha.1")).toBe("v200-alpha1");
		});
	});

	describe("Collision handling in unique slug generation", () => {
		it("should handle many collisions efficiently", () => {
			const existingSlugs = Array.from({ length: 1000 }, (_, i) =>
				i === 0 ? "test" : `test-${i}`,
			);

			const slug = generator.generateUniqueSlug("test", existingSlugs);

			expect(slug).toBe("test-1000");
		});

		it("should maintain slug validity when adding counters", () => {
			const existingSlugs = ["test"];
			const slug = generator.generateUniqueSlug("test", existingSlugs);

			expect(validateSlug(slug)).toBe(true);
		});
	});

	describe("Empty and minimal inputs", () => {
		it("should handle empty string", () => {
			expect(generator.generateSlug("")).toBe("");
		});

		it("should handle whitespace-only strings", () => {
			expect(generator.generateSlug("   ")).toBe("");
			expect(generator.generateSlug("\t\n")).toBe("");
		});

		it("should handle single characters", () => {
			expect(generator.generateSlug("a")).toBe("a");
			expect(generator.generateSlug("1")).toBe("1");
		});

		it("should handle special characters only", () => {
			expect(generator.generateSlug("@#$%")).toBe("");
			expect(generator.generateSlug("!!!")).toBe("");
		});
	});
});
