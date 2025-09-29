import { existsSync } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { ErrorCode, McpError } from "../utils/error-codes.js";
import { logger } from "../utils/logger.js";

/**
 * Configuration schema for MCP server
 */
export const ConfigSchema = z.object({
	specsPath: z.string().min(1, "Specs path cannot be empty"),
	autoDetect: z.boolean().default(true),
	schemaValidation: z.boolean().default(true),
	referenceValidation: z.boolean().default(true),
	maxFileSize: z
		.number()
		.positive()
		.default(10 * 1024 * 1024), // 10MB default
	rateLimit: z
		.object({
			enabled: z.boolean().default(true),
			maxRequests: z.number().positive().default(100),
			windowMs: z.number().positive().default(60000), // 1 minute
		})
		.default({}),
	logLevel: z
		.enum(["trace", "debug", "info", "warn", "error", "fatal"])
		.default("info"),
});

export type ServerConfig = z.infer<typeof ConfigSchema>;

/**
 * Validate that a path is safe (no path traversal)
 */
export function validateSafePath(basePath: string, targetPath: string): string {
	const resolvedBase = resolve(basePath);
	const resolvedTarget = resolve(basePath, targetPath);

	if (!resolvedTarget.startsWith(resolvedBase)) {
		throw new McpError(ErrorCode.PATH_TRAVERSAL, "Path traversal detected", {
			basePath,
			targetPath,
		});
	}

	return resolvedTarget;
}

/**
 * Validate that specs path exists and is writable
 */
async function validateSpecsPath(specsPath: string): Promise<void> {
	const resolvedPath = resolve(specsPath);

	// Check if path exists
	if (!existsSync(resolvedPath)) {
		logger.warn(
			{ specsPath: resolvedPath },
			"Specs path does not exist, creating...",
		);
		try {
			await mkdir(resolvedPath, { recursive: true });
		} catch (error) {
			throw new McpError(
				ErrorCode.INVALID_SPECS_PATH,
				`Failed to create specs path: ${resolvedPath}`,
				{ specsPath: resolvedPath },
				error instanceof Error ? error : undefined,
			);
		}
	}

	// Check if path is writable
	try {
		await access(resolvedPath, 2); // W_OK constant = 2
	} catch (error) {
		throw new McpError(
			ErrorCode.PATH_NOT_WRITABLE,
			`Specs path is not writable: ${resolvedPath}`,
			{ specsPath: resolvedPath },
			error instanceof Error ? error : undefined,
		);
	}
}

/**
 * Load and validate server configuration
 */
export async function loadConfig(): Promise<ServerConfig> {
	const rawConfig = {
		specsPath: process.env.SPECS_ROOT || process.env.SPECS_PATH || "./specs",
		autoDetect: process.env.AUTO_DETECT !== "false",
		schemaValidation: process.env.SCHEMA_VALIDATION !== "false",
		referenceValidation: process.env.REFERENCE_VALIDATION !== "false",
		maxFileSize: process.env.MAX_FILE_SIZE
			? Number.parseInt(process.env.MAX_FILE_SIZE, 10)
			: undefined,
		rateLimit: {
			enabled: process.env.RATE_LIMIT_ENABLED !== "false",
			maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS
				? Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
				: undefined,
			windowMs: process.env.RATE_LIMIT_WINDOW_MS
				? Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
				: undefined,
		},
		logLevel: (process.env.LOG_LEVEL || "info") as ServerConfig["logLevel"],
	};

	// Validate config schema
	let config: ServerConfig;
	try {
		config = ConfigSchema.parse(rawConfig);
	} catch (error) {
		throw new McpError(
			ErrorCode.INVALID_CONFIG,
			"Invalid configuration",
			{ rawConfig },
			error instanceof Error ? error : undefined,
		);
	}

	// Validate specs path
	await validateSpecsPath(config.specsPath);

	logger.info({ config }, "Configuration loaded");

	return config;
}
