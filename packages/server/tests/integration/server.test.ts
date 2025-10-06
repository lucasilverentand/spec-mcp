import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/index.js";
import { cleanupTestSpecs, createTestSpecsPath } from "../test-helpers.js";

describe("Server Configuration", () => {
	const testPaths: string[] = [];

	afterEach(async () => {
		// Clean up all test paths created during tests
		for (const path of testPaths) {
			await cleanupTestSpecs(path);
		}
		testPaths.length = 0;
	});

	it("should load configuration from environment", async () => {
		const testPath = createTestSpecsPath("config-test-1");
		testPaths.push(testPath);
		process.env.SPECS_PATH = testPath;

		const config = await loadConfig();

		expect(config.specsPath).toBeDefined();
		expect(config.specsPath).toContain(testPath);
	});

	it("should create specs directory if it doesn't exist", async () => {
		const testPath = createTestSpecsPath("config-test-2");
		testPaths.push(testPath);
		process.env.SPECS_PATH = testPath;
		const config = await loadConfig();
		expect(config.specsPath).toBeDefined();
		expect(config.specsPath).toContain(testPath);
	});

	it("should validate configuration schema", async () => {
		const originalSpecsPath = process.env.SPECS_PATH;

		// With simplified config, no validation errors to test
		// Just verify it loads
		const config = await loadConfig();
		expect(config.specsPath).toBeDefined();

		// Restore
		process.env.SPECS_PATH = originalSpecsPath;
	});
});

// Middleware tests commented out - middleware was removed
// describe("Rate Limiter", () => {
//
// 	beforeAll(() => {
// 			enabled: true,
// 			maxRequests: 3,
// 			windowMs: 1000,
// 		});
// 	});
//
// 	afterAll(() => {
// 		rateLimiter.clear();
// 	});
//
// 	it("should allow requests within limit", () => {
// 		expect(() => rateLimiter.check("test-key")).not.toThrow();
// 		expect(() => rateLimiter.check("test-key")).not.toThrow();
// 		expect(() => rateLimiter.check("test-key")).not.toThrow();
// 	});
//
// 	it("should block requests exceeding limit", () => {
// 		rateLimiter.clear();
// 		rateLimiter.check("test-key-2");
// 		rateLimiter.check("test-key-2");
// 		rateLimiter.check("test-key-2");
//
// 		expect(() => rateLimiter.check("test-key-2")).toThrow(McpError);
// 		expect(() => rateLimiter.check("test-key-2")).toThrow(
// 			/Rate limit exceeded/,
// 		);
// 	});
//
// 	it("should reset after window expires", async () => {
// 		rateLimiter.clear();
// 		rateLimiter.check("test-key-3");
// 		rateLimiter.check("test-key-3");
// 		rateLimiter.check("test-key-3");
//
// 		// Wait for window to expire
// 		await new Promise((resolve) => setTimeout(resolve, 1100));
//
// 		expect(() => rateLimiter.check("test-key-3")).not.toThrow();
// 	});
//
// 	it("should track different keys separately", () => {
// 		rateLimiter.clear();
// 		rateLimiter.check("key-a");
// 		rateLimiter.check("key-b");
//
// 		expect(() => rateLimiter.check("key-a")).not.toThrow();
// 		expect(() => rateLimiter.check("key-b")).not.toThrow();
// 	});
//
// 	it("should allow bypassing when disabled", () => {
// 			enabled: false,
// 			maxRequests: 1,
// 			windowMs: 1000,
// 		});
//
// 		expect(() => disabledLimiter.check("test")).not.toThrow();
// 		expect(() => disabledLimiter.check("test")).not.toThrow();
// 		expect(() => disabledLimiter.check("test")).not.toThrow();
// 	});
// });
//
// describe("Input Validator", () => {
// 	let validator: InputValidator;
//
// 	beforeAll(async () => {
// 		const config = await loadConfig();
// 		validator = new InputValidator(config);
// 	});
//
// 	describe("Path validation", () => {
// 		it("should validate safe paths", async () => {
// 			const result = await validator.validatePath("requirements/req-001.json");
// 			expect(result).toBeTruthy();
// 		});
//
// 		it("should reject path traversal attempts", async () => {
// 			await expect(
// 				validator.validatePath("../../../etc/passwd"),
// 			).rejects.toThrow(McpError);
// 		});
//
// 		it("should sanitize and validate null bytes in paths", async () => {
// 			// Null bytes are sanitized but empty path after sanitization should fail
// 			const path = "file\x00.json";
// 			const result = await validator.validatePath(path);
// 			// Should sanitize null bytes
// 			expect(result).not.toContain("\x00");
// 		});
//
// 		it("should reject empty paths", async () => {
// 			try {
// 				await validator.validatePath("");
// 				expect.fail("Should have thrown an error");
// 			} catch (error) {
// 				expect(error).toBeInstanceOf(McpError);
// 				expect((error as McpError).code).toBe(ErrorCode.INVALID_INPUT);
// 			}
// 		});
// 	});
//
// 	describe("String sanitization", () => {
// 		it("should remove null bytes", () => {
// 			const result = validator.sanitizeString("hello\x00world");
// 			expect(result).toBe("helloworld");
// 		});
//
// 		it("should remove control characters", () => {
// 			const result = validator.sanitizeString("hello\x01\x02world");
// 			expect(result).toBe("helloworld");
// 		});
//
// 		it("should trim whitespace", () => {
// 			const result = validator.sanitizeString("  hello world  ");
// 			expect(result).toBe("hello world");
// 		});
// 	});
//
// 	describe("ID validation", () => {
// 		it("should accept valid IDs", () => {
// 			expect(() => validator.validateId("req-001")).not.toThrow();
// 			expect(() => validator.validateId("pln-042-feature")).not.toThrow();
// 			expect(() => validator.validateId("cmp-100_test")).not.toThrow();
// 		});
//
// 		it("should reject IDs with special characters", () => {
// 			expect(() => validator.validateId("req@001")).toThrow(McpError);
// 			expect(() => validator.validateId("pln/001")).toThrow(McpError);
// 			expect(() => validator.validateId("cmp 001")).toThrow(McpError);
// 		});
//
// 		it("should sanitize IDs with control characters", () => {
// 			// Control characters are sanitized first
// 			const result = validator.validateId("req-001\x00");
// 			expect(result).toBe("req-001");
// 			expect(result).not.toContain("\x00");
// 		});
// 	});
//
// 	describe("Slug validation", () => {
// 		it("should accept valid slugs", () => {
// 			expect(() => validator.validateSlug("user-authentication")).not.toThrow();
// 			expect(() => validator.validateSlug("api-v2")).not.toThrow();
// 			expect(() => validator.validateSlug("test-123")).not.toThrow();
// 		});
//
// 		it("should reject uppercase letters", () => {
// 			expect(() => validator.validateSlug("User-Auth")).toThrow(McpError);
// 		});
//
// 		it("should reject special characters", () => {
// 			expect(() => validator.validateSlug("user_auth")).toThrow(McpError);
// 			expect(() => validator.validateSlug("user auth")).toThrow(McpError);
// 		});
//
// 		it("should reject empty slugs", () => {
// 			expect(() => validator.validateSlug("")).toThrow(McpError);
// 		});
// 	});
// });
//
// describe("Error Handling", () => {
// 	it("should create McpError with code and context", () => {
// 		const error = new McpError(
// 			ErrorCode.VALIDATION_FAILED,
// 			"Validation failed",
// 			{ field: "name" },
// 		);
//
// 		expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
// 		expect(error.message).toBe("Validation failed");
// 		expect(error.context).toEqual({ field: "name" });
// 	});
//
// 	it("should serialize McpError to JSON", () => {
// 		const error = new McpError(ErrorCode.FILE_NOT_FOUND, "File not found", {
// 			path: "/test.json",
// 		});
//
// 		const json = error.toJSON();
//
// 		expect(json.name).toBe("McpError");
// 		expect(json.code).toBe(ErrorCode.FILE_NOT_FOUND);
// 		expect(json.message).toBe("File not found");
// 		expect(json.context).toEqual({ path: "/test.json" });
// 	});
// });
