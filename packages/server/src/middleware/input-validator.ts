import { stat } from "node:fs/promises";
import type { z } from "zod";
import type { ServerConfig } from "../config/index.js";
import { validateSafePath } from "../config/index.js";
import { ErrorCode, McpError } from "../utils/error-codes.js";

/**
 * Sanitize and validate input parameters
 */
export class InputValidator {
	constructor(private readonly config: ServerConfig) {}

	/**
	 * Validate and sanitize a file path
	 * Ensures path is within specs root and doesn't contain traversal
	 */
	async validatePath(path: string): Promise<string> {
		// Sanitize input
		const sanitized = path.trim().replace(/\0/g, "");

		if (!sanitized) {
			throw new McpError(ErrorCode.INVALID_INPUT, "Path cannot be empty");
		}

		// Check for path traversal
		try {
			return validateSafePath(this.config.specsPath, sanitized);
		} catch (error) {
			if (error instanceof McpError) {
				throw error;
			}
			throw new McpError(
				ErrorCode.INVALID_INPUT,
				"Invalid path",
				{ path },
				error instanceof Error ? error : undefined,
			);
		}
	}

	/**
	 * Validate file size is within limits
	 */
	async validateFileSize(filePath: string): Promise<void> {
		try {
			const stats = await stat(filePath);

			if (stats.size > this.config.maxFileSize) {
				throw new McpError(
					ErrorCode.FILE_SIZE_EXCEEDED,
					`File size ${stats.size} bytes exceeds maximum ${this.config.maxFileSize} bytes`,
					{ filePath, size: stats.size, maxSize: this.config.maxFileSize },
				);
			}
		} catch (error) {
			if (error instanceof McpError) {
				throw error;
			}
			// File doesn't exist yet or other error - allow it
		}
	}

	/**
	 * Validate and parse JSON input with schema
	 */
	validateJson<T>(input: unknown, schema: z.ZodSchema<T>): T {
		try {
			return schema.parse(input);
		} catch (error) {
			throw new McpError(
				ErrorCode.INVALID_INPUT,
				"Invalid input data",
				{ error: error instanceof Error ? error.message : String(error) },
				error instanceof Error ? error : undefined,
			);
		}
	}

	/**
	 * Sanitize string input
	 * Remove null bytes and control characters
	 */
	sanitizeString(input: string): string {
		return input
			.trim()
			.replace(/\0/g, "")
			.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
	}

	/**
	 * Validate ID format (alphanumeric with dashes/underscores)
	 */
	validateId(id: string): string {
		const sanitized = this.sanitizeString(id);

		if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
			throw new McpError(
				ErrorCode.INVALID_INPUT,
				"Invalid ID format. Must contain only letters, numbers, dashes, and underscores",
				{ id },
			);
		}

		return sanitized;
	}

	/**
	 * Validate slug format
	 */
	validateSlug(slug: string): string {
		const sanitized = this.sanitizeString(slug);

		if (!/^[a-z0-9-]+$/.test(sanitized)) {
			throw new McpError(
				ErrorCode.INVALID_INPUT,
				"Invalid slug format. Must contain only lowercase letters, numbers, and dashes",
				{ slug },
			);
		}

		return sanitized;
	}
}
