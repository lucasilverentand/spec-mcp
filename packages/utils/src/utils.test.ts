import { describe, it, expect } from "vitest";
import { generateSlug } from "./slug-generator";

describe("generateSlug", () => {
	describe("basic functionality", () => {
		it("should convert simple strings to lowercase slugs", () => {
			expect(generateSlug("Hello World")).toBe("hello-world");
			expect(generateSlug("Test")).toBe("test");
			expect(generateSlug("User Authentication")).toBe("user-authentication");
		});

		it("should handle uppercase strings", () => {
			expect(generateSlug("HELLO WORLD")).toBe("hello-world");
			expect(generateSlug("API V2")).toBe("api-v2");
		});

		it("should handle mixed case strings", () => {
			expect(generateSlug("HelloWorld")).toBe("helloworld");
			expect(generateSlug("UserAuth")).toBe("userauth");
			expect(generateSlug("Test Case")).toBe("test-case");
		});
	});

	describe("whitespace handling", () => {
		it("should replace single spaces with hyphens", () => {
			expect(generateSlug("hello world")).toBe("hello-world");
			expect(generateSlug("one two three")).toBe("one-two-three");
		});

		it("should replace multiple consecutive spaces with single hyphen", () => {
			expect(generateSlug("hello    world")).toBe("hello-world");
			expect(generateSlug("one  two   three")).toBe("one-two-three");
		});

		it("should trim leading and trailing whitespace", () => {
			expect(generateSlug("  hello world  ")).toBe("hello-world");
			expect(generateSlug("   test   ")).toBe("test");
			expect(generateSlug("  ")).toBe("");
		});

		it("should handle tabs and newlines", () => {
			expect(generateSlug("hello\tworld")).toBe("hello-world");
			expect(generateSlug("hello\nworld")).toBe("hello-world");
			expect(generateSlug("hello\r\nworld")).toBe("hello-world");
		});
	});

	describe("special characters handling", () => {
		it("should remove common special characters", () => {
			expect(generateSlug("hello!world")).toBe("hello-world");
			expect(generateSlug("hello@world")).toBe("hello-world");
			expect(generateSlug("hello#world")).toBe("hello-world");
			expect(generateSlug("hello$world")).toBe("hello-world");
			expect(generateSlug("hello%world")).toBe("hello-world");
			expect(generateSlug("hello^world")).toBe("hello-world");
			expect(generateSlug("hello&world")).toBe("hello-world");
			expect(generateSlug("hello*world")).toBe("hello-world");
		});

		it("should handle punctuation marks", () => {
			expect(generateSlug("hello.world")).toBe("hello-world");
			expect(generateSlug("hello,world")).toBe("hello-world");
			expect(generateSlug("hello;world")).toBe("hello-world");
			expect(generateSlug("hello:world")).toBe("hello-world");
			expect(generateSlug("hello?world")).toBe("hello-world");
		});

		it("should handle brackets and parentheses", () => {
			expect(generateSlug("hello(world)")).toBe("hello-world");
			expect(generateSlug("hello[world]")).toBe("hello-world");
			expect(generateSlug("hello{world}")).toBe("hello-world");
		});

		it("should handle quotes and apostrophes", () => {
			expect(generateSlug("hello'world")).toBe("hello-world");
			expect(generateSlug('hello"world')).toBe("hello-world");
			expect(generateSlug("hello`world")).toBe("hello-world");
		});

		it("should handle underscores and dashes", () => {
			expect(generateSlug("hello_world")).toBe("hello-world");
			expect(generateSlug("hello-world")).toBe("hello-world");
			expect(generateSlug("hello__world")).toBe("hello-world");
			expect(generateSlug("hello--world")).toBe("hello-world");
		});

		it("should handle slashes and backslashes", () => {
			expect(generateSlug("hello/world")).toBe("hello-world");
			expect(generateSlug("hello\\world")).toBe("hello-world");
			expect(generateSlug("api/v2")).toBe("api-v2");
		});

		it("should handle mathematical operators", () => {
			expect(generateSlug("hello+world")).toBe("hello-world");
			expect(generateSlug("hello=world")).toBe("hello-world");
			expect(generateSlug("hello<world")).toBe("hello-world");
			expect(generateSlug("hello>world")).toBe("hello-world");
		});
	});

	describe("unicode and international characters", () => {
		it("should handle accented characters", () => {
			expect(generateSlug("café")).toBe("caf");
			expect(generateSlug("naïve")).toBe("na-ve");
			expect(generateSlug("résumé")).toBe("r-sum");
		});

		it("should handle non-Latin characters", () => {
			expect(generateSlug("你好世界")).toBe("");
			expect(generateSlug("こんにちは")).toBe("");
			expect(generateSlug("Привет мир")).toBe("");
		});

		it("should handle emoji", () => {
			expect(generateSlug("hello 👋 world")).toBe("hello-world");
			expect(generateSlug("test 🚀")).toBe("test");
			expect(generateSlug("😀😃😄")).toBe("");
		});

		it("should handle mixed Latin and non-Latin", () => {
			expect(generateSlug("hello 世界")).toBe("hello");
			expect(generateSlug("test テスト")).toBe("test");
		});
	});

	describe("numbers handling", () => {
		it("should preserve numbers", () => {
			expect(generateSlug("api v2")).toBe("api-v2");
			expect(generateSlug("test 123")).toBe("test-123");
			expect(generateSlug("version 1.0.0")).toBe("version-1-0-0");
		});

		it("should handle strings starting with numbers", () => {
			expect(generateSlug("123 test")).toBe("123-test");
			expect(generateSlug("2023 report")).toBe("2023-report");
		});

		it("should handle only numbers", () => {
			expect(generateSlug("123")).toBe("123");
			expect(generateSlug("456789")).toBe("456789");
		});

		it("should handle mixed alphanumeric", () => {
			expect(generateSlug("abc123xyz")).toBe("abc123xyz");
			expect(generateSlug("test1 test2 test3")).toBe("test1-test2-test3");
		});
	});

	describe("hyphen handling", () => {
		it("should remove leading hyphens", () => {
			expect(generateSlug("-hello")).toBe("hello");
			expect(generateSlug("--hello")).toBe("hello");
			expect(generateSlug("---hello")).toBe("hello");
		});

		it("should remove trailing hyphens", () => {
			expect(generateSlug("hello-")).toBe("hello");
			expect(generateSlug("hello--")).toBe("hello");
			expect(generateSlug("hello---")).toBe("hello");
		});

		it("should remove both leading and trailing hyphens", () => {
			expect(generateSlug("-hello-")).toBe("hello");
			expect(generateSlug("--hello--")).toBe("hello");
			expect(generateSlug("---test-slug---")).toBe("test-slug");
		});

		it("should preserve internal hyphens", () => {
			expect(generateSlug("hello-world")).toBe("hello-world");
			expect(generateSlug("one-two-three")).toBe("one-two-three");
		});

		it("should collapse multiple consecutive hyphens", () => {
			expect(generateSlug("hello--world")).toBe("hello-world");
			expect(generateSlug("test---slug")).toBe("test-slug");
			expect(generateSlug("multiple----dashes")).toBe("multiple-dashes");
		});
	});

	describe("edge cases", () => {
		it("should handle empty string", () => {
			expect(generateSlug("")).toBe("");
		});

		it("should handle strings with only whitespace", () => {
			expect(generateSlug("   ")).toBe("");
			expect(generateSlug("\t\n\r")).toBe("");
		});

		it("should handle strings with only special characters", () => {
			expect(generateSlug("!!!")).toBe("");
			expect(generateSlug("@@@###")).toBe("");
			expect(generateSlug("...")).toBe("");
		});

		it("should handle strings with only hyphens", () => {
			expect(generateSlug("-")).toBe("");
			expect(generateSlug("--")).toBe("");
			expect(generateSlug("---")).toBe("");
		});

		it("should handle very long strings", () => {
			const longString = "a".repeat(1000);
			expect(generateSlug(longString)).toBe(longString);

			const longStringWithSpaces = "hello world ".repeat(100);
			const result = generateSlug(longStringWithSpaces);
			expect(result.startsWith("hello-world")).toBe(true);
			expect(result.endsWith("hello-world")).toBe(true);
		});

		it("should handle single character strings", () => {
			expect(generateSlug("a")).toBe("a");
			expect(generateSlug("1")).toBe("1");
			expect(generateSlug("!")).toBe("");
		});

		it("should handle strings that become empty after processing", () => {
			expect(generateSlug("!!!")).toBe("");
			expect(generateSlug("@#$%^&*")).toBe("");
			expect(generateSlug("世界")).toBe("");
		});
	});

	describe("real-world examples", () => {
		it("should handle typical requirement names", () => {
			expect(generateSlug("User Authentication System")).toBe("user-authentication-system");
			expect(generateSlug("API v2.0 Implementation")).toBe("api-v2-0-implementation");
			expect(generateSlug("Payment Gateway Integration")).toBe("payment-gateway-integration");
		});

		it("should handle typical file names", () => {
			expect(generateSlug("my-component.tsx")).toBe("my-component-tsx");
			expect(generateSlug("utils_helper.js")).toBe("utils-helper-js");
			expect(generateSlug("README.md")).toBe("readme-md");
		});

		it("should handle typical URLs/domains", () => {
			expect(generateSlug("example.com")).toBe("example-com");
			expect(generateSlug("api.example.com/v2")).toBe("api-example-com-v2");
		});

		it("should handle technical terms", () => {
			expect(generateSlug("OAuth 2.0")).toBe("oauth-2-0");
			expect(generateSlug("REST API")).toBe("rest-api");
			expect(generateSlug("JSON Web Token")).toBe("json-web-token");
			expect(generateSlug("CRUD Operations")).toBe("crud-operations");
		});

		it("should handle project names", () => {
			expect(generateSlug("My Awesome Project!")).toBe("my-awesome-project");
			expect(generateSlug("@company/package-name")).toBe("company-package-name");
			expect(generateSlug("react-router-dom")).toBe("react-router-dom");
		});
	});

	describe("consistency and idempotency", () => {
		it("should return same output for same input", () => {
			const input = "Test Input String";
			const result1 = generateSlug(input);
			const result2 = generateSlug(input);
			const result3 = generateSlug(input);

			expect(result1).toBe(result2);
			expect(result2).toBe(result3);
		});

		it("should be idempotent (applying twice gives same result)", () => {
			const input = "Hello World";
			const firstPass = generateSlug(input);
			const secondPass = generateSlug(firstPass);

			expect(firstPass).toBe("hello-world");
			expect(secondPass).toBe("hello-world");
			expect(firstPass).toBe(secondPass);
		});

		it("should handle already slugified strings", () => {
			expect(generateSlug("hello-world")).toBe("hello-world");
			expect(generateSlug("api-v2")).toBe("api-v2");
			expect(generateSlug("test-slug-123")).toBe("test-slug-123");
		});
	});

	describe("boundary values", () => {
		it("should handle strings with alternating valid/invalid characters", () => {
			expect(generateSlug("a!b@c#d$e")).toBe("a-b-c-d-e");
			expect(generateSlug("1!2@3#4")).toBe("1-2-3-4");
		});

		it("should handle strings with valid characters surrounded by invalid ones", () => {
			expect(generateSlug("!!!hello!!!")).toBe("hello");
			expect(generateSlug("@@@world@@@")).toBe("world");
		});

		it("should handle complex mixed patterns", () => {
			expect(generateSlug("Hello!!! World??? Test...")).toBe("hello-world-test");
			expect(generateSlug("___test___slug___")).toBe("test-slug");
			expect(generateSlug("***multiple***stars***")).toBe("multiple-stars");
		});
	});

	describe("type safety", () => {
		it("should handle string input correctly", () => {
			const input: string = "test";
			const result: string = generateSlug(input);
			expect(typeof result).toBe("string");
		});

		it("should always return a string", () => {
			expect(typeof generateSlug("")).toBe("string");
			expect(typeof generateSlug("test")).toBe("string");
			expect(typeof generateSlug("!!!")).toBe("string");
		});
	});
});
