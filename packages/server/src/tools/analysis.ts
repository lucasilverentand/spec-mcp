import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// NOTE: Entity type enums are duplicated inline from @spec-mcp/data because:
// 1. @spec-mcp/data uses Zod v4
// 2. @spec-mcp/server uses Zod v3 (required by MCP SDK)
// 3. Zod v3 and v4 have incompatible types
// Source of truth: EntityTypeSchema in @spec-mcp/data/core/base-entity.ts
// Requirement priority source: RequirementStorageSchema in @spec-mcp/data/entities/requirements/requirement.ts

/**
 * Register all analysis-related tools
 */
export function registerAnalysisTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Analyze Dependencies Tool
	server.registerTool(
		"analyze-dependencies",
		{
			title: "Analyze Dependencies",
			description:
				"Analyze dependencies for an entity or entire system. Shows upstream/downstream dependencies, metrics, and issues.",
			inputSchema: {
				entity_id: z
					.string()
					.optional()
					.describe(
						"Entity ID to analyze (e.g., 'req-001-auth'). Omit for system-wide analysis.",
					),
				type: z
					.enum(["requirement", "plan", "component", "all"])
					.optional()
					.describe("Filter by entity type"),
				depth: z
					.number()
					.min(1)
					.max(10)
					.optional()
					.describe("Max depth to traverse (default: unlimited)"),
				direction: z
					.enum(["upstream", "downstream", "both"])
					.optional()
					.default("both")
					.describe("Dependency direction to analyze"),
				include_metrics: z
					.boolean()
					.optional()
					.default(true)
					.describe("Include dependency metrics (fan-in, fan-out, coupling)"),
			},
		},
		wrapToolHandler(
			"analyze-dependencies",
			async ({ entity_id, include_metrics = true }) => {
				// Get dependency analysis from core
				const dependencyResult = await operations.analyzeDependencies();

				if (!dependencyResult.success || !dependencyResult.data) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error:
											dependencyResult.error ||
											"Failed to analyze dependencies",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				const { graph, depth: depthAnalysis } = dependencyResult.data;

				// If analyzing specific entity
				if (entity_id) {
					const validatedId = context.inputValidator.validateId(entity_id);

					// Find entity in graph
					if (!graph.nodes.includes(validatedId)) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: false,
											error: `Entity '${validatedId}' not found in dependency graph`,
										},
										null,
										2,
									),
								},
							],
							isError: true,
						};
					}

					// Calculate entity-specific metrics
					const upstream = graph.edges.filter(
						(e: { to: string; from: string }) => e.to === validatedId,
					);
					const downstream = graph.edges.filter(
						(e: { to: string; from: string }) => e.from === validatedId,
					);

					const fanIn = upstream.length;
					const fanOut = downstream.length;
					const stability =
						fanIn + fanOut > 0 ? fanOut / (fanIn + fanOut) : 0.5;
					const coupling = (fanIn + fanOut) / graph.nodes.length;

					// Build dependency tree
					const upstreamDeps = upstream.map((e: { from: string }) => ({
						id: e.from,
						type: "unknown", // Would need entity metadata
						relationship: "depends_on",
					}));

					const downstreamDeps = downstream.map((e: { to: string }) => ({
						id: e.to,
						type: "unknown",
						relationship: "used_by",
					}));

					// Detect issues
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
								text: JSON.stringify(
									{
										success: true,
										data: {
											entity: {
												id: validatedId,
												type: "unknown",
											},
											upstream: {
												direct: upstreamDeps,
												total_count: fanIn,
											},
											downstream: {
												direct: downstreamDeps,
												total_count: fanOut,
											},
											metrics: include_metrics
												? {
														fan_in: fanIn,
														fan_out: fanOut,
														stability: Math.round(stability * 100) / 100,
														coupling: Math.round(coupling * 100) / 100,
														criticality:
															fanIn > 5 ? "high" : fanIn > 2 ? "medium" : "low",
													}
												: undefined,
											issues,
										},
									},
									null,
									2,
								),
							},
						],
					};
				}

				// System-wide analysis
				const nodeCount = graph.nodes.length;
				const edgeCount = graph.edges.length;
				const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

				// Calculate metrics for all nodes
				const nodeMetrics = graph.nodes.map((nodeId: string) => {
					const fanIn = graph.edges.filter(
						(e: { to: string }) => e.to === nodeId,
					).length;
					const fanOut = graph.edges.filter(
						(e: { from: string }) => e.from === nodeId,
					).length;
					return { id: nodeId, fanIn, fanOut, total: fanIn + fanOut };
				});

				// Sort by total connections
				nodeMetrics.sort(
					(a: { total: number }, b: { total: number }) => b.total - a.total,
				);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: true,
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
								},
								null,
								2,
							),
						},
					],
				};
			},
			context,
		),
	);

	// Analyze Coverage Tool
	server.registerTool(
		"analyze-coverage",
		{
			title: "Analyze Coverage",
			description:
				"Analyze test coverage and implementation status. Shows coverage metrics, gaps, and recommendations.",
			inputSchema: {
				entity_type: z
					.enum(["requirement", "plan", "all"])
					.optional()
					.default("all")
					.describe("Entity type to analyze"),
				entity_id: z
					.string()
					.optional()
					.describe("Specific entity ID to analyze"),
				priority: z
					.enum(["critical", "required", "ideal", "optional"])
					.optional()
					.describe("Filter by priority"),
				include_details: z
					.boolean()
					.optional()
					.default(false)
					.describe("Include detailed breakdown of gaps"),
				group_by: z
					.enum(["priority", "type", "status"])
					.optional()
					.default("priority")
					.describe("How to group results"),
			},
		},
		wrapToolHandler(
			"analyze-coverage",
			async ({ include_details = false }) => {
				// Get coverage analysis from core
				const coverageResult = await operations.analyzeCoverage();

				if (!coverageResult.success || !coverageResult.data) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: coverageResult.error || "Failed to analyze coverage",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				const { report } = coverageResult.data;

				// Build summary
				const summary = {
					total_specs: report.totalSpecs,
					covered_specs: report.coveredSpecs,
					uncovered_specs: report.totalSpecs - report.coveredSpecs,
					coverage_percentage:
						Math.round(report.coveragePercentage * 100) / 100,
					by_category: report.byCategory || {},
				};

				// Build response
				const responseData: Record<string, unknown> = {
					summary,
				};

				// Add details if requested
				if (include_details) {
					responseData.details = {
						uncovered_entities: report.uncoveredSpecs.slice(0, 20), // Limit to first 20
						orphaned_entities: report.orphanedSpecs.slice(0, 20),
					};
				}

				// Generate recommendations
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
							text: JSON.stringify(
								{
									success: true,
									data: responseData,
								},
								null,
								2,
							),
						},
					],
				};
			},
			context,
		),
	);

	// Detect Orphans Tool
	server.registerTool(
		"detect-orphans",
		{
			title: "Detect Orphans",
			description:
				"Find unreferenced entities (orphans) in the spec system. Helps identify unused or forgotten specifications.",
			inputSchema: {
				type: z
					.enum(["requirement", "plan", "component", "all"])
					.optional()
					.default("all")
					.describe("Filter by entity type"),
			},
		},
		wrapToolHandler(
			"detect-orphans",
			async () => {
				// Get orphan analysis from core
				const orphanResult = await operations.detectOrphans();

				if (!orphanResult.success || !orphanResult.data) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: orphanResult.error || "Failed to detect orphans",
									},
									null,
									2,
								),
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
							text: JSON.stringify(
								{
									success: true,
									data: {
										summary: {
											total_orphans: summary.totalOrphans,
											by_type: summary.byType,
										},
										orphans: orphans.map((id: string) => ({
											id,
											type: "unknown", // Would need entity metadata
											suggestion:
												"Link to related entities or mark as deprecated",
										})),
										recommendations:
											summary.totalOrphans > 0
												? [
														`Review ${summary.totalOrphans} orphaned entities`,
														"Link orphans to related entities or remove if obsolete",
													]
												: ["No orphaned entities detected - system is clean!"],
									},
								},
								null,
								2,
							),
						},
					],
				};
			},
			context,
		),
	);

	// Detect Cycles Tool
	server.registerTool(
		"detect-cycles",
		{
			title: "Detect Cycles",
			description:
				"Detect circular dependencies in plans and components. Circular dependencies can cause implementation and maintenance issues.",
			inputSchema: {
				type: z
					.enum(["plan", "component", "all"])
					.optional()
					.default("all")
					.describe("Filter by entity type"),
			},
		},
		wrapToolHandler(
			"detect-cycles",
			async () => {
				// Get cycle detection from core
				const cycleResult = await operations.detectCycles();

				if (!cycleResult.success || !cycleResult.data) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: cycleResult.error || "Failed to detect cycles",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				const { hasCycles, cycles, summary } = cycleResult.data;

				// Build detailed cycle information
				const detailedCycles = cycles.map((cycle: string[], index: number) => ({
					cycle_number: index + 1,
					length: cycle.length,
					path: cycle,
					severity: cycle.length <= 3 ? "high" : "medium",
					suggestion:
						cycle.length <= 3
							? `Break cycle by removing dependency from ${cycle[cycle.length - 1]} to ${cycle[0]}`
							: "Consider restructuring to extract shared components",
				}));

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
							text: JSON.stringify(
								{
									success: true,
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
								},
								null,
								2,
							),
						},
					],
				};
			},
			context,
		),
	);

	// Get Health Score Tool
	server.registerTool(
		"get-health-score",
		{
			title: "Get Health Score",
			description:
				"Calculate overall system health score based on coverage, validation, dependencies, and other factors.",
			inputSchema: {
				include_breakdown: z
					.boolean()
					.optional()
					.default(true)
					.describe("Include detailed breakdown of health metrics"),
			},
		},
		wrapToolHandler(
			"get-health-score",
			async ({ include_breakdown = true }) => {
				// Get health score from core
				const healthResult = await operations.getHealthScore();

				if (!healthResult.success || !healthResult.data) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: healthResult.error || "Failed to get health score",
									},
									null,
									2,
								),
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
							text: JSON.stringify(
								{
									success: true,
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
											list: issues.slice(0, 10), // Top 10 issues
										},
										recommendations: recommendations.slice(0, 5), // Top 5 recommendations
									},
								},
								null,
								2,
							),
						},
					],
				};
			},
			context,
		),
	);
}
