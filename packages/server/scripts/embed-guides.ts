#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const guides = [
	// Spec Type Guides (Focused, goal-oriented)
	{
		uri: "spec-mcp://guide/plan",
		name: "Plan Guide",
		description: "When and how to use Plans to organize implementation work",
		file: "plan.md",
	},
	{
		uri: "spec-mcp://guide/business-requirement",
		name: "Business Requirement Guide",
		description:
			"When and how to use Business Requirements (BRDs) to capture business needs",
		file: "business-requirement.md",
	},
	{
		uri: "spec-mcp://guide/technical-requirement",
		name: "Technical Requirement Guide",
		description:
			"When and how to use Technical Requirements (PRDs) to specify technical approaches",
		file: "technical-requirement.md",
	},
	{
		uri: "spec-mcp://guide/decision",
		name: "Decision Guide",
		description: "When and how to use Decisions to document important choices",
		file: "decision.md",
	},
	{
		uri: "spec-mcp://guide/component",
		name: "Component Guide",
		description: "When and how to use Components to define system architecture",
		file: "component.md",
	},
	{
		uri: "spec-mcp://guide/constitution",
		name: "Constitution Guide",
		description:
			"When and how to use Constitutions to establish project principles",
		file: "constitution.md",
	},
	{
		uri: "spec-mcp://guide/milestone",
		name: "Milestone Guide",
		description: "When and how to use Milestones to organize releases",
		file: "milestone.md",
	},

	// Workflow Guides (Scenario-based)
	{
		uri: "spec-mcp://guide/choosing-spec-types",
		name: "Choosing Spec Types",
		description: "Which spec types to use for different situations",
		file: "choosing-spec-types.md",
	},
	{
		uri: "spec-mcp://guide/spec-relationships",
		name: "Spec Relationships",
		description: "How different spec types connect and reference each other",
		file: "spec-relationships.md",
	},

	// Workflow Guides
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
