import { existsSync } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { FileManager } from "@spec-mcp/data";
import { ErrorCode, McpError } from "../utils/error-codes.js";
import { logger } from "../utils/logger.js";

/**
 * Configuration schema for MCP server
 */
export const ConfigSchema = z.object({
	specsPath: z.string().min(1, "Specs path cannot be empty"),
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
	// Get specs folder name relative to git root (e.g., "specs", ".specs", "docs/specs")
	// Default: "specs"
	const specsFolderName = process.env.SPECS_PATH || "specs";

	// Use FileManager to resolve the full path - single source of truth
	const fileManager = new FileManager({
		path: specsFolderName,
		autoDetect: true
	});
	const specsPath = await fileManager.getSpecsPath();

	const rawConfig = {
		specsPath,
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
