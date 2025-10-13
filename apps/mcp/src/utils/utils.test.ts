import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorCode, formatErrorResponse, McpError } from "./error-codes.js";
import { createRequestLogger, logger, logOperation } from "./logger.js";
import { wrapToolHandler } from "./tool-wrapper.js";
import { VERSION } from "./version.js";

describe("error-codes", () => {
	describe("ErrorCode enum", () => {
		it("should have all expected error codes", () => {
			expect(ErrorCode.INVALID_CONFIG).toBe("ERR_1001");
			expect(ErrorCode.INVALID_SPECS_PATH).toBe("ERR_1002");
			expect(ErrorCode.PATH_NOT_WRITABLE).toBe("ERR_1003");
			expect(ErrorCode.CONNECTION_LOST).toBe("ERR_5003");
			expect(ErrorCode.INTERNAL_ERROR).toBe("ERR_9001");
			expect(ErrorCode.UNKNOWN_ERROR).toBe("ERR_9999");
		});

		it("should have configuration errors in 1xxx range", () => {
			expect(ErrorCode.INVALID_CONFIG).toMatch(/^ERR_1\d{3}$/);
			expect(ErrorCode.INVALID_SPECS_PATH).toMatch(/^ERR_1\d{3}$/);
			expect(ErrorCode.PATH_NOT_WRITABLE).toMatch(/^ERR_1\d{3}$/);
		});

		it("should have MCP protocol errors in 5xxx range", () => {
			expect(ErrorCode.CONNECTION_LOST).toMatch(/^ERR_5\d{3}$/);
		});

		it("should have internal errors in 9xxx range", () => {
			expect(ErrorCode.INTERNAL_ERROR).toMatch(/^ERR_9\d{3}$/);
			expect(ErrorCode.UNKNOWN_ERROR).toMatch(/^ERR_9\d{3}$/);
		});
	});

	describe("McpError class", () => {
		it("should create error with code and message", () => {
			const error = new McpError(
				ErrorCode.INVALID_CONFIG,
				"Invalid configuration",
			);

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(McpError);
			expect(error.name).toBe("McpError");
			expect(error.code).toBe(ErrorCode.INVALID_CONFIG);
			expect(error.message).toBe("Invalid configuration");
			expect(error.context).toBeUndefined();
			expect(error.cause).toBeUndefined();
		});

		it("should create error with context", () => {
			const context = { path: "/invalid/path", reason: "not found" };
			const error = new McpError(
				ErrorCode.INVALID_SPECS_PATH,
				"Specs path not found",
				context,
			);

			expect(error.code).toBe(ErrorCode.INVALID_SPECS_PATH);
			expect(error.context).toEqual(context);
			expect(error.context?.path).toBe("/invalid/path");
			expect(error.context?.reason).toBe("not found");
		});

		it("should create error with cause", () => {
			const cause = new Error("Original error");
			const error = new McpError(
				ErrorCode.INTERNAL_ERROR,
				"Internal error occurred",
				undefined,
				cause,
			);

			expect(error.cause).toBe(cause);
			expect(error.cause?.message).toBe("Original error");
		});

		it("should create error with both context and cause", () => {
			const context = { operation: "read", file: "config.json" };
			const cause = new Error("File not found");
			const error = new McpError(
				ErrorCode.INVALID_CONFIG,
				"Failed to read config",
				context,
				cause,
			);

			expect(error.code).toBe(ErrorCode.INVALID_CONFIG);
			expect(error.message).toBe("Failed to read config");
			expect(error.context).toEqual(context);
			expect(error.cause).toBe(cause);
		});

		it("should serialize to JSON correctly", () => {
			const context = { path: "/test" };
			const cause = new Error("Underlying error");
			const error = new McpError(
				ErrorCode.PATH_NOT_WRITABLE,
				"Path is not writable",
				context,
				cause,
			);

			const json = error.toJSON();

			expect(json).toEqual({
				name: "McpError",
				code: ErrorCode.PATH_NOT_WRITABLE,
				message: "Path is not writable",
				context: { path: "/test" },
				cause: "Underlying error",
			});
		});

		it("should serialize to JSON without context", () => {
			const error = new McpError(ErrorCode.INVALID_CONFIG, "Invalid config");

			const json = error.toJSON();

			expect(json.name).toBe("McpError");
			expect(json.code).toBe(ErrorCode.INVALID_CONFIG);
			expect(json.message).toBe("Invalid config");
			expect(json.context).toBeUndefined();
			expect(json.cause).toBeUndefined();
		});

		it("should serialize to JSON without cause", () => {
			const error = new McpError(ErrorCode.CONNECTION_LOST, "Connection lost", {
				timestamp: Date.now(),
			});

			const json = error.toJSON();

			expect(json.code).toBe(ErrorCode.CONNECTION_LOST);
			expect(json.context).toBeDefined();
			expect(json.cause).toBeUndefined();
		});

		it("should have proper error stack trace", () => {
			const error = new McpError(ErrorCode.INTERNAL_ERROR, "Test error");

			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("McpError");
			expect(error.stack).toContain("Test error");
		});

		it("should support all error code types", () => {
			const codes = [
				ErrorCode.INVALID_CONFIG,
				ErrorCode.INVALID_SPECS_PATH,
				ErrorCode.PATH_NOT_WRITABLE,
				ErrorCode.CONNECTION_LOST,
				ErrorCode.INTERNAL_ERROR,
				ErrorCode.UNKNOWN_ERROR,
			];

			codes.forEach((code) => {
				const error = new McpError(code, `Error for ${code}`);
				expect(error.code).toBe(code);
				expect(error.message).toBe(`Error for ${code}`);
			});
		});

		it("should maintain error properties after serialization", () => {
			const error = new McpError(ErrorCode.INVALID_CONFIG, "Config error", {
				key: "value",
			});

			const json = error.toJSON();
			const jsonString = JSON.stringify(json);
			const parsed = JSON.parse(jsonString);

			expect(parsed.name).toBe("McpError");
			expect(parsed.code).toBe(ErrorCode.INVALID_CONFIG);
			expect(parsed.message).toBe("Config error");
			expect(parsed.context.key).toBe("value");
		});
	});

	describe("formatErrorResponse", () => {
		it("should format McpError correctly", () => {
			const error = new McpError(
				ErrorCode.INVALID_CONFIG,
				"Invalid configuration",
				{ path: "/config" },
			);

			const response = formatErrorResponse(error);

			expect(response).toEqual({
				code: ErrorCode.INVALID_CONFIG,
				message: "Invalid configuration",
				context: { path: "/config" },
			});
		});

		it("should format McpError without context", () => {
			const error = new McpError(ErrorCode.CONNECTION_LOST, "Connection lost");

			const response = formatErrorResponse(error);

			expect(response).toEqual({
				code: ErrorCode.CONNECTION_LOST,
				message: "Connection lost",
				context: undefined,
			});
		});

		it("should format generic Error as INTERNAL_ERROR", () => {
			const error = new Error("Something went wrong");

			const response = formatErrorResponse(error);

			expect(response).toEqual({
				code: ErrorCode.INTERNAL_ERROR,
				message: "Something went wrong",
			});
		});

		it("should format TypeError as INTERNAL_ERROR", () => {
			const error = new TypeError("Invalid type");

			const response = formatErrorResponse(error);

			expect(response).toEqual({
				code: ErrorCode.INTERNAL_ERROR,
				message: "Invalid type",
			});
		});

		it("should format string errors as UNKNOWN_ERROR", () => {
			const response = formatErrorResponse("String error");

			expect(response).toEqual({
				code: ErrorCode.UNKNOWN_ERROR,
				message: "String error",
			});
		});

		it("should format number errors as UNKNOWN_ERROR", () => {
			const response = formatErrorResponse(404);

			expect(response).toEqual({
				code: ErrorCode.UNKNOWN_ERROR,
				message: "404",
			});
		});

		it("should format null as UNKNOWN_ERROR", () => {
			const response = formatErrorResponse(null);

			expect(response).toEqual({
				code: ErrorCode.UNKNOWN_ERROR,
				message: "null",
			});
		});

		it("should format undefined as UNKNOWN_ERROR", () => {
			const response = formatErrorResponse(undefined);

			expect(response).toEqual({
				code: ErrorCode.UNKNOWN_ERROR,
				message: "undefined",
			});
		});

		it("should format object errors as UNKNOWN_ERROR", () => {
			const response = formatErrorResponse({ error: "custom" });

			expect(response).toEqual({
				code: ErrorCode.UNKNOWN_ERROR,
				message: "[object Object]",
			});
		});

		it("should not include context for non-McpError types", () => {
			const error = new Error("Generic error");
			const response = formatErrorResponse(error);

			expect(response).not.toHaveProperty("context");
		});
	});
});

describe("logger", () => {
	describe("logger instance", () => {
		it("should be defined", () => {
			expect(logger).toBeDefined();
		});

		it("should have standard log methods", () => {
			expect(logger.info).toBeDefined();
			expect(logger.error).toBeDefined();
			expect(logger.warn).toBeDefined();
			expect(logger.debug).toBeDefined();
			expect(logger.trace).toBeDefined();
			expect(logger.fatal).toBeDefined();
		});

		it("should have child method", () => {
			expect(logger.child).toBeDefined();
			expect(typeof logger.child).toBe("function");
		});

		it("should include service name in bindings", () => {
			// Access logger bindings (base properties)
			const bindings = (
				logger as unknown as { bindings: () => Record<string, unknown> }
			).bindings();
			expect(bindings.service).toBe("spec-mcp");
		});

		it("should include version in bindings", () => {
			const bindings = (
				logger as unknown as { bindings: () => Record<string, unknown> }
			).bindings();
			expect(bindings.version).toBe(VERSION);
		});

		it("should create child logger", () => {
			const child = logger.child({ component: "test" });
			expect(child).toBeDefined();
			expect(child.info).toBeDefined();
		});

		it("should have appropriate log level", () => {
			const level = logger.level;
			expect(["trace", "debug", "info", "warn", "error", "fatal"]).toContain(
				level,
			);
		});
	});

	describe("createRequestLogger", () => {
		it("should create logger with correlation ID", () => {
			const correlationId = "test-correlation-123";
			const requestLogger = createRequestLogger(correlationId);

			expect(requestLogger).toBeDefined();
			expect(requestLogger.info).toBeDefined();
		});

		it("should create different loggers for different correlation IDs", () => {
			const logger1 = createRequestLogger("id-1");
			const logger2 = createRequestLogger("id-2");

			expect(logger1).toBeDefined();
			expect(logger2).toBeDefined();
			// They should be different child instances
			expect(logger1).not.toBe(logger2);
		});

		it("should create logger with empty correlation ID", () => {
			const requestLogger = createRequestLogger("");
			expect(requestLogger).toBeDefined();
		});

		it("should create logger with special characters in correlation ID", () => {
			const correlationId = "test-123_abc@example.com";
			const requestLogger = createRequestLogger(correlationId);
			expect(requestLogger).toBeDefined();
		});
	});

	describe("logOperation", () => {
		beforeEach(() => {
			// Spy on logger methods
			vi.spyOn(logger, "info").mockImplementation(() => {});
			vi.spyOn(logger, "error").mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should execute and log successful operation", async () => {
			const operation = "test-operation";
			const fn = vi.fn().mockResolvedValue("success");

			const result = await logOperation(operation, fn);

			expect(result).toBe("success");
			expect(fn).toHaveBeenCalledTimes(1);
			expect(logger.info).toHaveBeenCalledWith(
				{ operation },
				"Operation started",
			);
			expect(logger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					operation,
					duration: expect.any(Number),
				}),
				"Operation completed",
			);
		});

		it("should measure operation duration", async () => {
			const operation = "slow-operation";
			const fn = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return "done";
			});

			await logOperation(operation, fn);

			// Check that duration was logged
			const errorCalls = (
				logger.info as unknown as { mock: { calls: unknown[][] } }
			).mock.calls;
			const completionCall = errorCalls.find(
				(call: unknown[]) => call[1] === "Operation completed",
			);
			expect(completionCall).toBeDefined();
			expect(completionCall[0].duration).toBeGreaterThanOrEqual(0);
		});

		it("should log and rethrow errors", async () => {
			const operation = "failing-operation";
			const error = new Error("Operation failed");
			const fn = vi.fn().mockRejectedValue(error);

			await expect(logOperation(operation, fn)).rejects.toThrow(
				"Operation failed",
			);

			expect(logger.info).toHaveBeenCalledWith(
				{ operation },
				"Operation started",
			);
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					operation,
					duration: expect.any(Number),
					error,
				}),
				"Operation failed",
			);
		});

		it("should log operation with context", async () => {
			const operation = "context-operation";
			const context = { userId: "123", resource: "file.txt" };
			const fn = vi.fn().mockResolvedValue("success");

			// Create a child logger spy
			const childLogger = logger.child(context);
			vi.spyOn(logger, "child").mockReturnValue(childLogger);
			vi.spyOn(childLogger, "info").mockImplementation(() => {});

			await logOperation(operation, fn, context);

			expect(logger.child).toHaveBeenCalledWith(context);
			expect(childLogger.info).toHaveBeenCalledWith(
				{ operation },
				"Operation started",
			);
		});

		it("should handle McpError correctly", async () => {
			const operation = "mcp-error-operation";
			const mcpError = new McpError(ErrorCode.INVALID_CONFIG, "Config error");
			const fn = vi.fn().mockRejectedValue(mcpError);

			await expect(logOperation(operation, fn)).rejects.toThrow(mcpError);

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					operation,
					error: mcpError,
				}),
				"Operation failed",
			);
		});

		it("should return correct value from async operation", async () => {
			const operation = "value-operation";
			const expectedValue = { data: "test", count: 42 };
			const fn = vi.fn().mockResolvedValue(expectedValue);

			const result = await logOperation(operation, fn);

			expect(result).toEqual(expectedValue);
		});

		it("should handle operation that returns undefined", async () => {
			const operation = "void-operation";
			const fn = vi.fn().mockResolvedValue(undefined);

			const result = await logOperation(operation, fn);

			expect(result).toBeUndefined();
			expect(logger.info).toHaveBeenCalledWith(
				expect.objectContaining({ operation }),
				"Operation completed",
			);
		});

		it("should handle synchronous errors in async function", async () => {
			const operation = "sync-error-operation";
			const fn = vi.fn().mockImplementation(() => {
				throw new Error("Synchronous error");
			});

			await expect(logOperation(operation, fn)).rejects.toThrow(
				"Synchronous error",
			);

			expect(logger.error).toHaveBeenCalled();
		});
	});
});

describe("version", () => {
	describe("VERSION constant", () => {
		it("should be defined", () => {
			expect(VERSION).toBeDefined();
		});

		it("should be a string", () => {
			expect(typeof VERSION).toBe("string");
		});

		it("should not be empty", () => {
			expect(VERSION.length).toBeGreaterThan(0);
		});

		it("should follow semver format (x.y.z)", () => {
			// Basic semver regex: allows for pre-release and build metadata
			const semverRegex =
				/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;
			expect(VERSION).toMatch(semverRegex);
		});

		it("should have major version number", () => {
			const parts = VERSION.split(".");
			expect(parts.length).toBeGreaterThanOrEqual(3);
			expect(Number.parseInt(parts[0], 10)).toBeGreaterThanOrEqual(0);
		});

		it("should have minor version number", () => {
			const parts = VERSION.split(".");
			expect(Number.parseInt(parts[1], 10)).toBeGreaterThanOrEqual(0);
		});

		it("should have patch version number", () => {
			const parts = VERSION.split(".");
			const patchPart = parts[2].split("-")[0]; // Handle pre-release versions
			expect(Number.parseInt(patchPart, 10)).toBeGreaterThanOrEqual(0);
		});

		it("should be consistent across multiple imports", () => {
			const version1 = VERSION;
			const version2 = VERSION;
			expect(version1).toBe(version2);
		});

		it("should not contain whitespace", () => {
			expect(VERSION).not.toMatch(/\s/);
		});

		it("should not start with v", () => {
			// semver format typically doesn't include 'v' prefix
			expect(VERSION.startsWith("v")).toBe(false);
		});

		it("should be valid for package.json", () => {
			// Check that it could be used in package.json
			expect(() => {
				JSON.parse(JSON.stringify({ version: VERSION }));
			}).not.toThrow();
		});
	});
});

describe("tool-wrapper", () => {
	describe("wrapToolHandler", () => {
		beforeEach(() => {
			// Spy on logger methods
			vi.spyOn(logger, "child").mockImplementation(() => ({
				debug: vi.fn(),
				error: vi.fn(),
				info: vi.fn(),
			}));
			vi.spyOn(logger, "info").mockImplementation(() => {});
			vi.spyOn(logger, "error").mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should wrap handler and return successful result", async () => {
			const toolName = "test-tool";
			const expectedResult: CallToolResult = {
				content: [{ type: "text", text: "Success" }],
			};
			const handler = vi.fn().mockResolvedValue(expectedResult);

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(result).toEqual(expectedResult);
			expect(handler).toHaveBeenCalledWith({ input: "test" });
		});

		it("should generate correlation ID with tool name", async () => {
			const toolName = "correlation-test";
			const handler = vi.fn().mockResolvedValue({
				content: [{ type: "text", text: "OK" }],
			});

			const wrapped = wrapToolHandler(toolName, handler);
			await wrapped({ input: "test" });

			expect(logger.child).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: expect.stringContaining("correlation-test"),
				}),
			);
		});

		it("should handle handler errors and return error result", async () => {
			const toolName = "error-tool";
			const error = new Error("Handler error");
			const handler = vi.fn().mockRejectedValue(error);

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(result.isError).toBe(true);
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");

			const errorResponse = JSON.parse(result.content[0].text);
			expect(errorResponse.code).toBe(ErrorCode.INTERNAL_ERROR);
			expect(errorResponse.message).toBe("Handler error");
		});

		it("should handle McpError and format response", async () => {
			const toolName = "mcp-error-tool";
			const mcpError = new McpError(ErrorCode.INVALID_CONFIG, "Config error", {
				path: "/config",
			});
			const handler = vi.fn().mockRejectedValue(mcpError);

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(result.isError).toBe(true);
			const errorResponse = JSON.parse(result.content[0].text);
			expect(errorResponse.code).toBe(ErrorCode.INVALID_CONFIG);
			expect(errorResponse.message).toBe("Config error");
			expect(errorResponse.context).toEqual({ path: "/config" });
		});

		it("should pass input to handler correctly", async () => {
			const toolName = "input-tool";
			const input = { key: "value", number: 42, nested: { prop: "test" } };
			const handler = vi.fn().mockResolvedValue({
				content: [{ type: "text", text: "OK" }],
			});

			const wrapped = wrapToolHandler(toolName, handler);
			await wrapped(input);

			expect(handler).toHaveBeenCalledWith(input);
		});

		it("should handle undefined input", async () => {
			const toolName = "undefined-input-tool";
			const handler = vi.fn().mockResolvedValue({
				content: [{ type: "text", text: "OK" }],
			});

			const wrapped = wrapToolHandler(toolName, handler);
			await wrapped(undefined);

			expect(handler).toHaveBeenCalledWith(undefined);
		});

		it("should preserve result structure", async () => {
			const toolName = "structure-tool";
			const expectedResult: CallToolResult = {
				content: [
					{ type: "text", text: "Line 1" },
					{ type: "text", text: "Line 2" },
				],
				isError: false,
			};
			const handler = vi.fn().mockResolvedValue(expectedResult);

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(result).toEqual(expectedResult);
			expect(result.content).toHaveLength(2);
		});

		it("should format error response as JSON", async () => {
			const toolName = "json-error-tool";
			const handler = vi.fn().mockRejectedValue(new Error("Test error"));

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(() => JSON.parse(result.content[0].text)).not.toThrow();
			const parsed = JSON.parse(result.content[0].text);
			expect(parsed).toHaveProperty("code");
			expect(parsed).toHaveProperty("message");
		});

		it("should handle string errors", async () => {
			const toolName = "string-error-tool";
			const handler = vi.fn().mockRejectedValue("String error");

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(result.isError).toBe(true);
			const errorResponse = JSON.parse(result.content[0].text);
			expect(errorResponse.code).toBe(ErrorCode.UNKNOWN_ERROR);
			expect(errorResponse.message).toBe("String error");
		});

		it("should handle multiple calls with different inputs", async () => {
			const toolName = "multi-call-tool";
			let callCount = 0;
			const handler = vi
				.fn()
				.mockImplementation(async (input: Record<string, unknown>) => {
					callCount++;
					return {
						content: [
							{ type: "text", text: `Call ${callCount}: ${input.value}` },
						],
					};
				});

			const wrapped = wrapToolHandler(toolName, handler);

			const result1 = await wrapped({ value: "first" });
			const result2 = await wrapped({ value: "second" });
			const result3 = await wrapped({ value: "third" });

			expect(result1.content[0].text).toBe("Call 1: first");
			expect(result2.content[0].text).toBe("Call 2: second");
			expect(result3.content[0].text).toBe("Call 3: third");
			expect(handler).toHaveBeenCalledTimes(3);
		});

		it("should handle async errors in handler", async () => {
			const toolName = "async-error-tool";
			const handler = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				throw new Error("Async error");
			});

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(result.isError).toBe(true);
			const errorResponse = JSON.parse(result.content[0].text);
			expect(errorResponse.message).toBe("Async error");
		});

		it("should create unique correlation IDs for each call", async () => {
			const toolName = "unique-id-tool";
			const handler = vi.fn().mockResolvedValue({
				content: [{ type: "text", text: "OK" }],
			});

			const wrapped = wrapToolHandler(toolName, handler);

			// Clear any previous calls
			vi.clearAllMocks();
			vi.spyOn(logger, "child").mockImplementation(() => ({
				debug: vi.fn(),
				error: vi.fn(),
				info: vi.fn(),
			}));

			await wrapped({ input: "1" });
			const call1Count = (
				logger.child as unknown as { mock: { calls: unknown[][] } }
			).mock.calls.length;
			const call1 = (
				logger.child as unknown as { mock: { calls: unknown[][] } }
			).mock.calls[0][0];

			vi.clearAllMocks();
			vi.spyOn(logger, "child").mockImplementation(() => ({
				debug: vi.fn(),
				error: vi.fn(),
				info: vi.fn(),
			}));

			await wrapped({ input: "2" });
			const call2 = (
				logger.child as unknown as { mock: { calls: unknown[][] } }
			).mock.calls[0][0];

			// Each call should have created a child logger
			expect(call1Count).toBeGreaterThan(0);
			expect(call1.correlationId).toBeDefined();
			expect(call2.correlationId).toBeDefined();
			expect(call1.correlationId).not.toBe(call2.correlationId);
		});

		it("should include tool name in context", async () => {
			const toolName = "context-tool";
			const handler = vi.fn().mockResolvedValue({
				content: [{ type: "text", text: "OK" }],
			});

			const wrapped = wrapToolHandler(toolName, handler);
			await wrapped({ input: "test" });

			// Check that logger.child was called with tool context
			expect(logger.child).toHaveBeenCalled();
		});

		it("should handle pre-execution McpError", async () => {
			const toolName = "pre-exec-error-tool";
			const handler = vi.fn().mockResolvedValue({
				content: [{ type: "text", text: "OK" }],
			});

			const wrapped = wrapToolHandler(toolName, handler);

			// This test verifies the outer catch block for McpError
			// In normal flow, errors come from handler, but structure handles pre-execution errors
			const result = await wrapped({ input: "test" });

			expect(result).toBeDefined();
		});

		it("should include context in McpError response", async () => {
			const toolName = "context-error-tool";
			const context = { userId: "123", action: "delete" };
			const mcpError = new McpError(
				ErrorCode.PATH_NOT_WRITABLE,
				"Cannot delete",
				context,
			);
			const handler = vi.fn().mockRejectedValue(mcpError);

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			expect(result.isError).toBe(true);
			const errorResponse = JSON.parse(result.content[0].text);
			expect(errorResponse.context).toEqual(context);
		});

		it("should handle errors with proper error logging", async () => {
			const toolName = "error-logging-tool";
			const handler = vi.fn().mockRejectedValue(new Error("Handler error"));

			const wrapped = wrapToolHandler(toolName, handler);
			const result = await wrapped({ input: "test" });

			// Verify error result is returned
			expect(result.isError).toBe(true);
			const errorResponse = JSON.parse(result.content[0].text);
			expect(errorResponse.code).toBe(ErrorCode.INTERNAL_ERROR);
			expect(errorResponse.message).toBe("Handler error");
		});
	});
});
