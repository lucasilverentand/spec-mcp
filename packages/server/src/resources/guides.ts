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
		description: "Patterns, anti-patterns, and tips for spec-driven development",
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
	// Navigate from packages/server/src/resources/ to docs/guides/
	const guidesDir = join(__dirname, "../../../../docs/guides");
	const fullPath = join(guidesDir, filePath);

	try {
		return await readFile(fullPath, "utf-8");
	} catch (error) {
		throw new Error(
			`Failed to load guide from ${fullPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

