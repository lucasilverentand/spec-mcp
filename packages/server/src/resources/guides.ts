import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Guide resource definitions
 */
export const GUIDE_RESOURCES = [
	{
		uri: "spec-mcp://guide/getting-started",
		name: "Getting Started",
		description: "Quick start guide for spec-driven development",
		mimeType: "text/markdown",
		filePath: "getting-started.md",
	},
	{
		uri: "spec-mcp://guide/planning-workflow",
		name: "Planning Workflow",
		description: "Complete workflow for planning features with specs",
		mimeType: "text/markdown",
		filePath: "planning-workflow.md",
	},
	{
		uri: "spec-mcp://guide/implementation-workflow",
		name: "Implementation Workflow",
		description: "Development workflow for implementing from specs",
		mimeType: "text/markdown",
		filePath: "implementation-workflow.md",
	},
	{
		uri: "spec-mcp://guide/best-practices",
		name: "Best Practices",
		description:
			"Patterns, anti-patterns, and tips for spec-driven development",
		mimeType: "text/markdown",
		filePath: "best-practices.md",
	},
	{
		uri: "spec-mcp://guide/query-guide",
		name: "Query Guide",
		description: "Complete guide for querying and analyzing specs",
		mimeType: "text/markdown",
		filePath: "query-guide.md",
	},
] as const;

/**
 * Load guide content from file system
 */
export async function loadGuideContent(filePath: string): Promise<string> {
	// In production (dist), guides are at dist/guides/
	// In development, guides are at ../../docs/guides relative to src/resources/
	const guidesDir = join(__dirname, "../guides");
	const fullPath = join(guidesDir, filePath);

	try {
		return await readFile(fullPath, "utf-8");
	} catch (error) {
		// Fallback to dev location if not found in dist
		const devGuidesDir = join(__dirname, "../../../../docs/guides");
		const devFullPath = join(devGuidesDir, filePath);
		try {
			return await readFile(devFullPath, "utf-8");
		} catch {
			throw new Error(
				`Failed to load guide from ${fullPath}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
