import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach } from "vitest";

/**
 * Helper to create a temporary test directory and clean it up after tests
 */
export function useTempDir() {
	const tempDirs: string[] = [];

	const createTempDir = async (prefix = "test-specs") => {
		const tempDir = path.join(
			process.cwd(),
			"tests",
			".tmp",
			`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
		);
		await fs.mkdir(tempDir, { recursive: true });
		tempDirs.push(tempDir);
		return tempDir;
	};

	const cleanup = async () => {
		await Promise.all(
			tempDirs.map(async (dir) => {
				try {
					await fs.rm(dir, { recursive: true, force: true });
				} catch (error) {
					// Ignore cleanup errors
					console.warn(`Failed to cleanup ${dir}:`, error);
				}
			}),
		);
		tempDirs.length = 0;
	};

	// Auto-cleanup after each test
	afterEach(async () => {
		await cleanup();
	});

	return { createTempDir, cleanup };
}
