import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// NOTE: Entity type and priority enums are duplicated inline from @spec-mcp/data because:
// 1. @spec-mcp/data uses Zod v4
// 2. @spec-mcp/server uses Zod v3 (required by MCP SDK)
// 3. Zod v3 and v4 have incompatible types
// Source of truth: EntityTypeSchema in @spec-mcp/data/core/base-entity.ts
// Requirement priority source: RequirementStorageSchema in @spec-mcp/data/entities/requirements/requirement.ts

interface ReportData {
	coverage?: {
		report: {
			totalSpecs: number;
			coveredSpecs: number;
			coveragePercentage: number;
			uncoveredSpecs: string[];
			orphanedSpecs: string[];
			byCategory?: Record<string, unknown>;
		};
	};
	dependencies?: {
		graph: {
			nodes: string[];
			edges: Array<{ from: string; to: string }>;
			cycles?: string[][];
		};
		depth: {
			maxDepth: number;
			averageDepth: number;
			criticalPath?: string[];
		};
	};
	health?: {
		overall: number;
		breakdown?: Record<string, number>;
		issues: string[];
		recommendations: string[];
	};
	cycles?: {
		hasCycles: boolean;
		cycles: string[][];
		summary: {
			totalCycles: number;
			maxCycleLength: number;
			affectedNodes: string[];
		};
	};
	orphans?: {
		orphans: string[];
		summary: {
			totalOrphans: number;
			byType: Record<string, number>;
		};
	};
	entities?: {
		requirements: Array<{
			id: string;
			priority?: string | undefined;
			status?: string | undefined;
		}>;
		plans: Array<{ id: string; status?: string | undefined }>;
		components: Array<{ id: string; type?: string | undefined }>;
	};
}

/**
 * Format report as Markdown
 */
function formatMarkdownReport(
	data: ReportData,
	style: string,
	includeSections?: string[],
): string {
	const sections: string[] = [];

	// Title and timestamp
	sections.push("# Specification System Report");
	sections.push(`\n**Generated:** ${new Date().toISOString()}`);
	sections.push(`\n**Style:** ${style}\n`);

	// Executive Summary
	if (!includeSections || includeSections.includes("summary")) {
		sections.push("## Executive Summary\n");

		if (data.health) {
			const status =
				data.health.overall >= 80
					? "✓ Healthy"
					: data.health.overall >= 60
						? "⚠ Needs Attention"
						: "✗ Critical";
			sections.push(
				`**System Health:** ${data.health.overall}/100 (${status})\n`,
			);
		}

		if (data.coverage) {
			const { totalSpecs, coveredSpecs, coveragePercentage } =
				data.coverage.report;
			sections.push(`**Total Specifications:** ${totalSpecs}`);
			sections.push(
				`**Coverage:** ${coveredSpecs}/${totalSpecs} (${coveragePercentage.toFixed(1)}%)`,
			);

			// ASCII progress bar
			const barLength = 30;
			const filled = Math.round((coveragePercentage / 100) * barLength);
			const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
			sections.push(`\`${bar}\` ${coveragePercentage.toFixed(1)}%\n`);
		}

		if (data.dependencies) {
			sections.push(
				`**Dependencies:** ${data.dependencies.graph.edges.length} connections between ${data.dependencies.graph.nodes.length} entities`,
			);
			sections.push(
				`**Dependency Depth:** Max ${data.dependencies.depth.maxDepth}, Avg ${data.dependencies.depth.averageDepth.toFixed(1)}\n`,
			);
		}

		if (data.cycles?.hasCycles) {
			sections.push(
				`**⚠ Circular Dependencies:** ${data.cycles.summary.totalCycles} cycles detected\n`,
			);
		}

		if (data.orphans && data.orphans.summary.totalOrphans > 0) {
			sections.push(
				`**⚠ Orphaned Entities:** ${data.orphans.summary.totalOrphans} unreferenced entities\n`,
			);
		}
	}

	// Coverage Analysis
	if (
		data.coverage &&
		(!includeSections || includeSections.includes("coverage"))
	) {
		sections.push("## Coverage Analysis\n");

		const { coveredSpecs, uncoveredSpecs, orphanedSpecs, byCategory } =
			data.coverage.report;

		sections.push(`- **Covered:** ${coveredSpecs} specifications`);
		sections.push(`- **Uncovered:** ${uncoveredSpecs.length} specifications`);
		sections.push(`- **Orphaned:** ${orphanedSpecs.length} specifications\n`);

		if (byCategory && Object.keys(byCategory).length > 0) {
			sections.push("### Coverage by Category\n");
			sections.push("| Category | Coverage |");
			sections.push("|----------|----------|");
			for (const [category, stats] of Object.entries(byCategory)) {
				if (
					typeof stats === "object" &&
					stats !== null &&
					"percentage" in stats
				) {
					const percentage = stats.percentage as number;
					sections.push(`| ${category} | ${percentage.toFixed(1)}% |`);
				}
			}
			sections.push("");
		}

		if (style === "detailed" && uncoveredSpecs.length > 0) {
			sections.push("### Uncovered Specifications\n");
			for (const spec of uncoveredSpecs.slice(0, 20)) {
				sections.push(`- ${spec}`);
			}
			if (uncoveredSpecs.length > 20) {
				sections.push(`\n*...and ${uncoveredSpecs.length - 20} more*`);
			}
			sections.push("");
		}
	}

	// Dependency Analysis
	if (
		data.dependencies &&
		(!includeSections || includeSections.includes("dependencies"))
	) {
		sections.push("## Dependency Analysis\n");

		const { graph, depth } = data.dependencies;

		sections.push(`- **Total Entities:** ${graph.nodes.length}`);
		sections.push(`- **Dependencies:** ${graph.edges.length}`);
		sections.push(`- **Max Depth:** ${depth.maxDepth}`);
		sections.push(`- **Average Depth:** ${depth.averageDepth.toFixed(1)}`);

		if (depth.criticalPath) {
			sections.push(
				`- **Critical Path Length:** ${depth.criticalPath.length}\n`,
			);
		} else {
			sections.push("");
		}

		// Calculate most connected entities
		const nodeDegrees = new Map<string, number>();
		for (const edge of graph.edges) {
			nodeDegrees.set(edge.from, (nodeDegrees.get(edge.from) || 0) + 1);
			nodeDegrees.set(edge.to, (nodeDegrees.get(edge.to) || 0) + 1);
		}

		const mostConnected = Array.from(nodeDegrees.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);

		if (mostConnected.length > 0) {
			sections.push("### Most Connected Entities\n");
			sections.push("| Entity | Connections |");
			sections.push("|--------|-------------|");
			for (const [entity, connections] of mostConnected) {
				sections.push(`| ${entity} | ${connections} |`);
			}
			sections.push("");
		}

		if (style === "detailed" || style === "technical") {
			sections.push("### Dependency Graph (Mermaid)\n");
			sections.push("```mermaid");
			sections.push("graph TD");
			// Limit edges for readability
			for (const edge of graph.edges.slice(0, 50)) {
				sections.push(`  ${edge.from} --> ${edge.to}`);
			}
			if (graph.edges.length > 50) {
				sections.push(
					`  note[... ${graph.edges.length - 50} more dependencies]`,
				);
			}
			sections.push("```\n");
		}
	}

	// Issues and Warnings
	if (
		(data.cycles?.hasCycles ||
			(data.orphans && data.orphans.summary.totalOrphans > 0) ||
			(data.health && data.health.issues.length > 0)) &&
		(!includeSections || includeSections.includes("issues"))
	) {
		sections.push("## Issues and Warnings\n");

		// Cycles
		if (data.cycles?.hasCycles) {
			sections.push("### Circular Dependencies\n");
			for (const [index, cycle] of data.cycles.cycles.entries()) {
				const severity = cycle.length <= 3 ? "🔴 High" : "🟡 Medium";
				sections.push(
					`${index + 1}. **${severity}** - Length ${cycle.length}: ${cycle.join(" → ")} → ${cycle[0]}`,
				);
			}
			sections.push("");
		}

		// Orphans
		if (data.orphans && data.orphans.summary.totalOrphans > 0) {
			sections.push("### Orphaned Entities\n");
			sections.push(
				`Found ${data.orphans.summary.totalOrphans} unreferenced entities:\n`,
			);
			for (const orphan of data.orphans.orphans.slice(0, 15)) {
				sections.push(`- ${orphan}`);
			}
			if (data.orphans.orphans.length > 15) {
				sections.push(`\n*...and ${data.orphans.orphans.length - 15} more*\n`);
			}
			sections.push("");
		}

		// Health issues
		if (data.health && data.health.issues.length > 0) {
			sections.push("### System Health Issues\n");
			for (const issue of data.health.issues) {
				sections.push(`- 🔴 ${issue}`);
			}
			sections.push("");
		}
	}

	// Recommendations
	if (
		data.health &&
		(!includeSections || includeSections.includes("recommendations"))
	) {
		sections.push("## Recommendations\n");

		for (const [
			index,
			recommendation,
		] of data.health.recommendations.entries()) {
			sections.push(`${index + 1}. ${recommendation}`);
		}
		sections.push("");
	}

	// Detailed Entity Lists
	if (
		style === "detailed" &&
		data.entities &&
		(!includeSections || includeSections.includes("entities"))
	) {
		sections.push("## Entity Inventory\n");

		sections.push(`### Requirements (${data.entities.requirements.length})\n`);
		if (data.entities.requirements.length > 0) {
			sections.push("| ID | Priority | Status |");
			sections.push("|----|----------|--------|");
			for (const req of data.entities.requirements.slice(0, 50)) {
				sections.push(
					`| ${req.id} | ${req.priority || "N/A"} | ${req.status || "N/A"} |`,
				);
			}
			if (data.entities.requirements.length > 50) {
				sections.push(
					`\n*...and ${data.entities.requirements.length - 50} more requirements*`,
				);
			}
			sections.push("");
		}

		sections.push(`### Plans (${data.entities.plans.length})\n`);
		if (data.entities.plans.length > 0) {
			sections.push("| ID | Status |");
			sections.push("|----|--------|");
			for (const plan of data.entities.plans.slice(0, 50)) {
				sections.push(`| ${plan.id} | ${plan.status || "N/A"} |`);
			}
			if (data.entities.plans.length > 50) {
				sections.push(
					`\n*...and ${data.entities.plans.length - 50} more plans*`,
				);
			}
			sections.push("");
		}

		sections.push(`### Components (${data.entities.components.length})\n`);
		if (data.entities.components.length > 0) {
			sections.push("| ID | Type |");
			sections.push("|----|------|");
			for (const comp of data.entities.components.slice(0, 50)) {
				sections.push(`| ${comp.id} | ${comp.type || "N/A"} |`);
			}
			if (data.entities.components.length > 50) {
				sections.push(
					`\n*...and ${data.entities.components.length - 50} more components*`,
				);
			}
			sections.push("");
		}
	}

	// Health Breakdown
	if (
		style === "technical" &&
		data.health?.breakdown &&
		(!includeSections || includeSections.includes("health"))
	) {
		sections.push("## Health Score Breakdown\n");
		sections.push("| Metric | Score |");
		sections.push("|--------|-------|");
		for (const [metric, score] of Object.entries(data.health.breakdown)) {
			sections.push(`| ${metric} | ${score}/100 |`);
		}
		sections.push("");
	}

	return sections.join("\n");
}

/**
 * Format report as JSON
 */
function formatJsonReport(
	data: ReportData,
	style: string,
	includeSections?: string[],
): string {
	const report: Record<string, unknown> = {
		metadata: {
			generated: new Date().toISOString(),
			style,
			version: "1.0.0",
		},
	};

	// Filter sections based on includeSections
	if (!includeSections || includeSections.includes("summary")) {
		report.summary = {
			health_score: data.health?.overall,
			coverage: data.coverage
				? {
						total: data.coverage.report.totalSpecs,
						covered: data.coverage.report.coveredSpecs,
						percentage: data.coverage.report.coveragePercentage,
					}
				: undefined,
			dependencies: data.dependencies
				? {
						total_entities: data.dependencies.graph.nodes.length,
						total_connections: data.dependencies.graph.edges.length,
						max_depth: data.dependencies.depth.maxDepth,
						avg_depth: data.dependencies.depth.averageDepth,
					}
				: undefined,
			issues: {
				cycles: data.cycles?.summary.totalCycles || 0,
				orphans: data.orphans?.summary.totalOrphans || 0,
				health_issues: data.health?.issues.length || 0,
			},
		};
	}

	if (
		data.coverage &&
		(!includeSections || includeSections.includes("coverage"))
	) {
		report.coverage = {
			overall: {
				total_specs: data.coverage.report.totalSpecs,
				covered_specs: data.coverage.report.coveredSpecs,
				coverage_percentage: data.coverage.report.coveragePercentage,
			},
			uncovered: data.coverage.report.uncoveredSpecs,
			orphaned: data.coverage.report.orphanedSpecs,
			by_category: data.coverage.report.byCategory,
		};
	}

	if (
		data.dependencies &&
		(!includeSections || includeSections.includes("dependencies"))
	) {
		report.dependencies = {
			summary: {
				nodes: data.dependencies.graph.nodes.length,
				edges: data.dependencies.graph.edges.length,
				max_depth: data.dependencies.depth.maxDepth,
				average_depth: data.dependencies.depth.averageDepth,
			},
			graph:
				style === "detailed" || style === "technical"
					? data.dependencies.graph
					: {
							node_count: data.dependencies.graph.nodes.length,
							edge_count: data.dependencies.graph.edges.length,
						},
			critical_path: data.dependencies.depth.criticalPath,
		};
	}

	if (!includeSections || includeSections.includes("issues")) {
		const issues: Record<string, unknown> = {};

		if (data.cycles?.hasCycles) {
			issues.cycles = {
				total: data.cycles.summary.totalCycles,
				max_length: data.cycles.summary.maxCycleLength,
				affected_entities: data.cycles.summary.affectedNodes,
				details: data.cycles.cycles.map((cycle, index) => ({
					id: index + 1,
					length: cycle.length,
					path: cycle,
					severity: cycle.length <= 3 ? "high" : "medium",
				})),
			};
		}

		if (data.orphans && data.orphans.summary.totalOrphans > 0) {
			issues.orphans = {
				total: data.orphans.summary.totalOrphans,
				by_type: data.orphans.summary.byType,
				list: data.orphans.orphans,
			};
		}

		if (data.health && data.health.issues.length > 0) {
			issues.health = {
				total: data.health.issues.length,
				list: data.health.issues,
			};
		}

		if (Object.keys(issues).length > 0) {
			report.issues = issues;
		}
	}

	if (
		data.health &&
		(!includeSections || includeSections.includes("recommendations"))
	) {
		report.recommendations = data.health.recommendations;
	}

	if (
		style === "detailed" &&
		data.entities &&
		(!includeSections || includeSections.includes("entities"))
	) {
		report.entities = {
			requirements: {
				count: data.entities.requirements.length,
				list: data.entities.requirements,
			},
			plans: {
				count: data.entities.plans.length,
				list: data.entities.plans,
			},
			components: {
				count: data.entities.components.length,
				list: data.entities.components,
			},
		};
	}

	if (
		style === "technical" &&
		data.health?.breakdown &&
		(!includeSections || includeSections.includes("health"))
	) {
		report.health_breakdown = data.health.breakdown;
	}

	return JSON.stringify(report, null, 2);
}

/**
 * Register all reporting-related tools
 */
export function registerReportingTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Generate Report Tool
	server.registerTool(
		"generate-report",
		{
			title: "Generate Report",
			description:
				"Generate comprehensive system reports in multiple formats. Combines coverage, dependencies, health metrics, and issues into a unified report.",
			inputSchema: {
				format: z
					.enum(["json", "markdown", "html"])
					.default("markdown")
					.describe("Output format for the report"),
				include_sections: z
					.array(
						z.enum([
							"summary",
							"coverage",
							"dependencies",
							"issues",
							"recommendations",
							"entities",
							"health",
						]),
					)
					.optional()
					.describe(
						"Specific sections to include. If omitted, all sections are included.",
					),
				entity_types: z
					.array(z.enum(["requirement", "plan", "component"]))
					.optional()
					.describe("Filter entities by type (for detailed reports)"),
				priority_filter: z
					.enum(["critical", "required", "ideal", "optional"])
					.optional()
					.describe("Filter by priority level"),
				style: z
					.enum(["executive", "detailed", "technical"])
					.default("executive")
					.describe(
						"Report style: executive (high-level), detailed (comprehensive), or technical (includes graphs and metrics)",
					),
			},
		},
		wrapToolHandler(
			"generate-report",
			async ({
				format = "markdown",
				include_sections,
				entity_types,
				priority_filter,
				style = "executive",
			}) => {
				// HTML format is not yet implemented
				if (format === "html") {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error:
											"HTML format is not yet implemented. Use 'json' or 'markdown'.",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				// Gather all data
				const reportData: ReportData = {};

				// Get coverage analysis
				if (!include_sections || include_sections.includes("coverage")) {
					const coverageResult = await operations.analyzeCoverage();
					if (coverageResult.success && coverageResult.data) {
						reportData.coverage = coverageResult.data;
					}
				}

				// Get dependency analysis
				if (!include_sections || include_sections.includes("dependencies")) {
					const dependencyResult = await operations.analyzeDependencies();
					if (dependencyResult.success && dependencyResult.data) {
						reportData.dependencies = dependencyResult.data;
					}
				}

				// Get health score
				if (
					!include_sections ||
					include_sections.includes("summary") ||
					include_sections.includes("health") ||
					include_sections.includes("recommendations")
				) {
					const healthResult = await operations.getHealthScore();
					if (healthResult.success && healthResult.data) {
						reportData.health = healthResult.data;
					}
				}

				// Get cycles
				if (!include_sections || include_sections.includes("issues")) {
					const cycleResult = await operations.detectCycles();
					if (cycleResult.success && cycleResult.data) {
						reportData.cycles = cycleResult.data;
					}
				}

				// Get orphans
				if (!include_sections || include_sections.includes("issues")) {
					const orphanResult = await operations.detectOrphans();
					if (orphanResult.success && orphanResult.data) {
						reportData.orphans = orphanResult.data;
					}
				}

				// Get all entities (for detailed reports)
				if (style === "detailed" || include_sections?.includes("entities")) {
					const entitiesResult = await operations.getAllEntities();
					if (entitiesResult.success && entitiesResult.data) {
						// Map to simpler format
						const entities = {
							requirements: entitiesResult.data.requirements.map((r) => {
								const req = r as {
									priority?: string | undefined;
									status?: string | undefined;
								};
								return {
									id: r.id,
									priority: req.priority ?? undefined,
									status: req.status ?? undefined,
								};
							}),
							plans: entitiesResult.data.plans.map((p) => {
								const plan = p as { status?: string | undefined };
								return {
									id: p.id,
									status: plan.status ?? undefined,
								};
							}),
							components: entitiesResult.data.components.map((c) => {
								const comp = c as { componentType?: string | undefined };
								return {
									id: c.id,
									type: comp.componentType ?? undefined,
								};
							}),
						};

						// Apply entity type filters
						if (entity_types) {
							if (!entity_types.includes("requirement")) {
								entities.requirements = [];
							}
							if (!entity_types.includes("plan")) {
								entities.plans = [];
							}
							if (!entity_types.includes("component")) {
								entities.components = [];
							}
						}

						// Apply priority filter to requirements
						if (priority_filter) {
							entities.requirements = entities.requirements.filter(
								(r) => r.priority === priority_filter,
							);
						}

						reportData.entities = entities;
					}
				}

				// Generate report based on format
				let reportContent: string;
				if (format === "json") {
					reportContent = formatJsonReport(reportData, style, include_sections);
				} else {
					// markdown
					reportContent = formatMarkdownReport(
						reportData,
						style,
						include_sections,
					);
				}

				return {
					content: [
						{
							type: "text",
							text: reportContent,
						},
					],
				};
			},
			context,
		),
	);
}
