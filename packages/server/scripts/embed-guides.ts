#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const guides = [
	{
		uri: "spec-mcp://guide/getting-started",
		name: "Getting Started",
		description: "Quick start guide for spec-driven development",
		file: "getting-started.md",
	},
	{
		uri: "spec-mcp://guide/planning-workflow",
		name: "Planning Workflow",
		description: "Complete workflow for planning features with specs",
		file: "planning-workflow.md",
	},
	{
		uri: "spec-mcp://guide/implementation-workflow",
		name: "Implementation Workflow",
		description: "Development workflow for implementing from specs",
		file: "implementation-workflow.md",
	},
	{
		uri: "spec-mcp://guide/best-practices",
		name: "Best Practices",
		description:
			"Patterns, anti-patterns, and tips for spec-driven development",
		file: "best-practices.md",
	},
	{
		uri: "spec-mcp://guide/query-guide",
		name: "Query Guide",
		description: "Complete guide for querying and analyzing specs",
		file: "query-guide.md",
	},
];

const guidesDir = join(__dirname, "../../../docs/guides");

// Read all guide files
const guideResources = guides.map((guide) => {
	const content = readFileSync(join(guidesDir, guide.file), "utf-8");
	// Escape backticks and backslashes for template literal
	const escapedContent = content.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
	return {
		uri: guide.uri,
		name: guide.name,
		description: guide.description,
		content: escapedContent,
	};
});

// Generate TypeScript source
const output = `/**
 * Generated file - DO NOT EDIT
 * Run 'pnpm embed-guides' to regenerate
 */

/**
 * Guide resource definitions with embedded content
 */
export const GUIDE_RESOURCES = [
${guideResources
	.map(
		(guide) => `	{
		uri: "${guide.uri}",
		name: "${guide.name}",
		description: "${guide.description}",
		mimeType: "text/markdown",
		content: \`${guide.content}\`,
	}`,
	)
	.join(",\n")}
] as const;
`;

// Write to src/resources/guides.ts
const outputPath = join(__dirname, "../src/resources/guides.ts");
writeFileSync(outputPath, output, "utf-8");

console.log("✓ Embedded guide content into src/resources/guides.ts");
