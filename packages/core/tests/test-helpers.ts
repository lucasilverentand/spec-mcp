import { tmpdir } from "node:os";
import { join } from "node:path";
import { rm } from "node:fs/promises";

/**
 * Creates a unique temporary directory path for test specs
 * This ensures tests don't create artifacts in the repo or system directories
 */
export function createTestSpecsPath(testName: string): string {
	const timestamp = Date.now();
	const randomId = Math.random().toString(36).substring(7);
	const sanitizedName = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
	return join(tmpdir(), `spec-mcp-test-${sanitizedName}-${timestamp}-${randomId}`);
}

/**
 * Cleanup helper to remove test directories
 */
export async function cleanupTestSpecs(testSpecsPath: string): Promise<void> {
	try {
		await rm(testSpecsPath, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}
}
