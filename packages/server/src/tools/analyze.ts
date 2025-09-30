import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

const AnalysisTypeSchema = z.enum([
	"dependencies",
	"coverage",
	"orphans",
	"cycles",
	"health",
	"references",
	"full-report",
]);

/**
 * Register consolidated analysis tool
 */
export function registerAnalyzeTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"analyze",
		{
			title: "Analyze",
			description:
				"Comprehensive analysis tool: dependencies, coverage, orphans, cycles, health, references, or full system report",
			inputSchema: {
				analysis_type: AnalysisTypeSchema.describe(
					"Type of analysis: dependencies, coverage, orphans, cycles, health, references, or full-report",
				),
				// Common filters
				entity_id: z
					.string()
					.optional()
					.describe("Specific entity ID to analyze (for dependencies)"),
				entity_type: z
					.enum(["requirement", "plan", "component", "all"])
					.optional()
					.describe("Filter by entity type"),
				// Analysis-specific options
				include_details: z
					.boolean()
					.optional()
					.describe("Include detailed breakdown"),
				include_metrics: z
					.boolean()
					.optional()
					.describe("Include dependency metrics"),
				include_breakdown: z
					.boolean()
					.optional()
					.describe("Include health score breakdown"),
				fix_suggestions: z
					.boolean()
					.optional()
					.describe("Include fix suggestions for broken references"),
				priority: z
					.enum(["critical", "required", "ideal", "optional"])
					.optional()
					.describe("Filter by priority (for coverage)"),
				format: z
					.enum(["json", "markdown", "html"])
					.optional()
					.describe("Output format (for full-report)"),
			},
		},
		wrapToolHandler(
			"analyze",
			async ({
				analysis_type,
				entity_id,
				include_details = false,
				include_metrics = true,
				include_breakdown = true,
				fix_suggestions = true,
			}) => {
				switch (analysis_type) {
					case "dependencies": {
						const dependencyResult = await operations.analyzeDependencies();

						if (!dependencyResult.success || !dependencyResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												dependencyResult.error ||
												"Failed to analyze dependencies",
										}),
									},
								],
								isError: true,
							};
						}

						const { graph, depth: depthAnalysis } = dependencyResult.data;

						// Entity-specific analysis
						if (entity_id) {
							const validatedId = context.inputValidator.validateId(entity_id);

							if (!graph.nodes.includes(validatedId)) {
								return {
									content: [
										{
											type: "text",
											text: JSON.stringify({
												success: false,
												error: `Entity '${validatedId}' not found in dependency graph`,
											}),
										},
									],
									isError: true,
								};
							}

							const upstream = graph.edges.filter(
								(e: { to: string }) => e.to === validatedId,
							);
							const downstream = graph.edges.filter(
								(e: { from: string }) => e.from === validatedId,
							);

							const fanIn = upstream.length;
							const fanOut = downstream.length;
							const stability =
								fanIn + fanOut > 0 ? fanOut / (fanIn + fanOut) : 0.5;
							const coupling = (fanIn + fanOut) / graph.nodes.length;

							const issues = [];
							if (coupling > 0.5) {
								issues.push({
									type: "high_coupling",
									severity: "warning",
									message: `Entity has high coupling (${Math.round(coupling * 100)}%)`,
									suggestion: "Consider breaking down into smaller components",
								});
							}
							if (fanOut > 10) {
								issues.push({
									type: "high_fan_out",
									severity: "warning",
									message: `Entity depends on ${fanOut} other entities`,
									suggestion: "Consider facade pattern to reduce dependencies",
								});
							}

							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: true,
											analysis_type: "dependencies",
											data: {
												entity: { id: validatedId, type: "unknown" },
												upstream: {
													direct: upstream.map((e: { from: string }) => ({
														id: e.from,
														relationship: "depends_on",
													})),
													total_count: fanIn,
												},
												downstream: {
													direct: downstream.map((e: { to: string }) => ({
														id: e.to,
														relationship: "used_by",
													})),
													total_count: fanOut,
												},
												metrics: include_metrics
													? {
															fan_in: fanIn,
															fan_out: fanOut,
															stability: Math.round(stability * 100) / 100,
															coupling: Math.round(coupling * 100) / 100,
															criticality:
																fanIn > 5
																	? "high"
																	: fanIn > 2
																		? "medium"
																		: "low",
														}
													: undefined,
												issues,
											},
										}),
									},
								],
							};
						}

						// System-wide analysis
						const nodeCount = graph.nodes.length;
						const edgeCount = graph.edges.length;
						const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

						const nodeMetrics = graph.nodes.map((nodeId: string) => {
							const fanIn = graph.edges.filter(
								(e: { to: string }) => e.to === nodeId,
							).length;
							const fanOut = graph.edges.filter(
								(e: { from: string }) => e.from === nodeId,
							).length;
							return { id: nodeId, fanIn, fanOut, total: fanIn + fanOut };
						});

						nodeMetrics.sort(
							(a: { total: number }, b: { total: number }) => b.total - a.total,
						);

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										analysis_type: "dependencies",
										data: {
											summary: {
												total_entities: nodeCount,
												total_dependencies: edgeCount,
												average_degree: Math.round(avgDegree * 100) / 100,
												max_depth: depthAnalysis.maxDepth,
												average_depth:
													Math.round(depthAnalysis.averageDepth * 100) / 100,
											},
											most_connected: nodeMetrics
												.slice(0, 10)
												.map(
													(m: {
														id: string;
														fanIn: number;
														fanOut: number;
														total: number;
													}) => ({
														id: m.id,
														fan_in: m.fanIn,
														fan_out: m.fanOut,
														total_connections: m.total,
													}),
												),
											graph: {
												nodes: graph.nodes,
												edges: graph.edges,
												cycles: graph.cycles || [],
											},
											critical_path: depthAnalysis.criticalPath,
										},
									}),
								},
							],
						};
					}

					case "coverage": {
						const coverageResult = await operations.analyzeCoverage();

						if (!coverageResult.success || !coverageResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												coverageResult.error || "Failed to analyze coverage",
										}),
									},
								],
								isError: true,
							};
						}

						const { report } = coverageResult.data;

						const summary = {
							total_specs: report.totalSpecs,
							covered_specs: report.coveredSpecs,
							uncovered_specs: report.totalSpecs - report.coveredSpecs,
							coverage_percentage:
								Math.round(report.coveragePercentage * 100) / 100,
							by_category: report.byCategory || {},
						};

						const responseData: Record<string, unknown> = {
							summary,
						};

						if (include_details) {
							responseData.details = {
								uncovered_entities: report.uncoveredSpecs.slice(0, 20),
								orphaned_entities: report.orphanedSpecs.slice(0, 20),
							};
						}

						const recommendations = [];
						if (report.uncoveredSpecs.length > 0) {
							recommendations.push(
								`Cover ${report.uncoveredSpecs.length} uncovered entities`,
							);
						}
						if (report.orphanedSpecs.length > 0) {
							recommendations.push(
								`Address ${report.orphanedSpecs.length} orphaned entities`,
							);
						}
						if (report.coveragePercentage < 0.8) {
							recommendations.push(
								"Increase coverage to 80% target for production readiness",
							);
						}

						responseData.recommendations = recommendations;

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										analysis_type: "coverage",
										data: responseData,
									}),
								},
							],
						};
					}

					case "orphans": {
						const orphanResult = await operations.detectOrphans();

						if (!orphanResult.success || !orphanResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: orphanResult.error || "Failed to detect orphans",
										}),
									},
								],
								isError: true,
							};
						}

						const { orphans, summary } = orphanResult.data;

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										analysis_type: "orphans",
										data: {
											summary: {
												total_orphans: summary.totalOrphans,
												by_type: summary.byType,
											},
											orphans: orphans.map((id: string) => ({
												id,
												type: "unknown",
												suggestion:
													"Link to related entities or mark as deprecated",
											})),
											recommendations:
												summary.totalOrphans > 0
													? [
															`Review ${summary.totalOrphans} orphaned entities`,
															"Link orphans to related entities or remove if obsolete",
														]
													: [
															"No orphaned entities detected - system is clean!",
														],
										},
									}),
								},
							],
						};
					}

					case "cycles": {
						const cycleResult = await operations.detectCycles();

						if (!cycleResult.success || !cycleResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: cycleResult.error || "Failed to detect cycles",
										}),
									},
								],
								isError: true,
							};
						}

						const { hasCycles, cycles, summary } = cycleResult.data;

						const detailedCycles = cycles.map(
							(cycle: string[], index: number) => ({
								cycle_number: index + 1,
								length: cycle.length,
								path: cycle,
								severity: cycle.length <= 3 ? "high" : "medium",
								suggestion:
									cycle.length <= 3
										? `Break cycle by removing dependency from ${cycle[cycle.length - 1]} to ${cycle[0]}`
										: "Consider restructuring to extract shared components",
							}),
						);

						const recommendations = [];
						if (hasCycles) {
							recommendations.push(
								`Fix ${summary.totalCycles} circular ${summary.totalCycles === 1 ? "dependency" : "dependencies"}`,
							);
							recommendations.push(
								"Circular dependencies can cause implementation deadlocks and maintenance issues",
							);
							if (summary.maxCycleLength <= 3) {
								recommendations.push(
									"Short cycles detected - consider breaking the cycle at the weakest dependency",
								);
							}
						} else {
							recommendations.push(
								"No circular dependencies detected - dependency structure is healthy!",
							);
						}

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										analysis_type: "cycles",
										data: {
											summary: {
												has_cycles: hasCycles,
												total_cycles: summary.totalCycles,
												max_cycle_length: summary.maxCycleLength,
												affected_entities: summary.affectedNodes.length,
											},
											cycles: detailedCycles,
											affected_entities: summary.affectedNodes,
											recommendations,
										},
									}),
								},
							],
						};
					}

					case "health": {
						const healthResult = await operations.getHealthScore();

						if (!healthResult.success || !healthResult.data) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error: healthResult.error || "Failed to get health score",
										}),
									},
								],
								isError: true,
							};
						}

						const { overall, breakdown, issues, recommendations } =
							healthResult.data;

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										analysis_type: "health",
										data: {
											overall_health: overall,
											status:
												overall >= 80
													? "healthy"
													: overall >= 60
														? "needs_attention"
														: "critical",
											breakdown: include_breakdown ? breakdown : undefined,
											issues: {
												total: issues.length,
												list: issues.slice(0, 10),
											},
											recommendations: recommendations.slice(0, 5),
										},
									}),
								},
							],
						};
					}

					case "references": {
						try {
							const { SpecService } = await import("@spec-mcp/core");
							const service = new SpecService({
								specsPath: operations.getManager().config.path ?? "./specs",
							});
							const validationResult = await service.validateReferences();

							const brokenReferences: string[] = [];
							const suggestions: Array<{
								reference: string;
								suggestion: string;
							}> = [];

							if (!validationResult.valid) {
								// Extract broken references from errors
								for (const error of validationResult.errors) {
									if (error.includes("reference")) {
										brokenReferences.push(error);
										if (fix_suggestions) {
											suggestions.push({
												reference: error,
												suggestion: "Verify the referenced entity exists",
											});
										}
									}
								}
							}

							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: true,
											analysis_type: "references",
											data: {
												valid: validationResult.valid,
												total_references: brokenReferences.length,
												broken_references: brokenReferences,
												suggestions: fix_suggestions ? suggestions : undefined,
												errors: validationResult.errors,
												warnings: validationResult.warnings,
											},
										}),
									},
								],
							};
						} catch (error) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											success: false,
											error:
												error instanceof Error
													? error.message
													: "Failed to validate references",
										}),
									},
								],
								isError: true,
							};
						}
					}

					case "full-report": {
						// Run all analyses in parallel
						const [
							coverageResult,
							dependencyResult,
							healthResult,
							cycleResult,
							orphanResult,
						] = await Promise.all([
							operations.analyzeCoverage(),
							operations.analyzeDependencies(),
							operations.getHealthScore(),
							operations.detectCycles(),
							operations.detectOrphans(),
						]);

						// Build comprehensive report
						const report: Record<string, unknown> = {
							timestamp: new Date().toISOString(),
							summary: {} as Record<string, unknown>,
						};

						if (healthResult.success && healthResult.data) {
							report.health = {
								overall: healthResult.data.overall,
								status:
									healthResult.data.overall >= 80
										? "healthy"
										: healthResult.data.overall >= 60
											? "needs_attention"
											: "critical",
								breakdown: healthResult.data.breakdown,
							};
							report.summary = {
								...(report.summary as Record<string, unknown>),
								health_score: healthResult.data.overall,
							};
						}

						if (coverageResult.success && coverageResult.data) {
							report.coverage = {
								total_specs: coverageResult.data.report.totalSpecs,
								covered_specs: coverageResult.data.report.coveredSpecs,
								coverage_percentage:
									coverageResult.data.report.coveragePercentage,
								uncovered_count:
									coverageResult.data.report.uncoveredSpecs.length,
								orphaned_count: coverageResult.data.report.orphanedSpecs.length,
							};
						}

						if (dependencyResult.success && dependencyResult.data) {
							report.dependencies = {
								total_entities: dependencyResult.data.graph.nodes.length,
								total_dependencies: dependencyResult.data.graph.edges.length,
								max_depth: dependencyResult.data.depth.maxDepth,
								has_cycles:
									(dependencyResult.data.graph.cycles?.length ?? 0) > 0,
							};
						}

						if (cycleResult.success && cycleResult.data) {
							report.cycles = {
								has_cycles: cycleResult.data.hasCycles,
								total_cycles: cycleResult.data.summary.totalCycles,
								affected_entities:
									cycleResult.data.summary.affectedNodes.length,
							};
						}

						if (orphanResult.success && orphanResult.data) {
							report.orphans = {
								total_orphans: orphanResult.data.summary.totalOrphans,
								by_type: orphanResult.data.summary.byType,
							};
						}

						// Aggregate recommendations
						const allRecommendations = [];
						if (healthResult.success && healthResult.data) {
							allRecommendations.push(...healthResult.data.recommendations);
						}
						if (
							coverageResult.success &&
							coverageResult.data &&
							coverageResult.data.report.coveragePercentage < 0.8
						) {
							allRecommendations.push("Improve test coverage to 80% minimum");
						}
						if (cycleResult.success && cycleResult.data?.hasCycles) {
							allRecommendations.push(
								`Resolve ${cycleResult.data.summary.totalCycles} circular dependencies`,
							);
						}
						if (
							orphanResult.success &&
							orphanResult.data &&
							orphanResult.data.summary.totalOrphans > 0
						) {
							allRecommendations.push(
								`Address ${orphanResult.data.summary.totalOrphans} orphaned entities`,
							);
						}

						report.recommendations = allRecommendations.slice(0, 10);

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										success: true,
										analysis_type: "full-report",
										data: report,
									}),
								},
							],
						};
					}
				}
			},
			context,
		),
	);
}
