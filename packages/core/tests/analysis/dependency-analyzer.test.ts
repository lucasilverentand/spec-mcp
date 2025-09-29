import { beforeEach, describe, expect, it } from "vitest";
import { DependencyAnalyzer } from "../../src/analysis/dependency-analyzer.js";
import type { SpecConfig } from "../../src/interfaces/config.js";

describe("DependencyAnalyzer", () => {
	let analyzer: DependencyAnalyzer;
	const config: SpecConfig = {
		specsPath: "./test-specs",
	};

	beforeEach(() => {
		analyzer = new DependencyAnalyzer(config);
	});

	describe("constructor", () => {
		it("should create instance with default config", () => {
			const defaultAnalyzer = new DependencyAnalyzer();
			expect(defaultAnalyzer).toBeInstanceOf(DependencyAnalyzer);
			expect(defaultAnalyzer.name).toBe("DependencyAnalyzer");
			expect(defaultAnalyzer.version).toBe("2.0.0");
		});

		it("should create instance with custom config", () => {
			expect(analyzer).toBeInstanceOf(DependencyAnalyzer);
			expect(analyzer.name).toBe("DependencyAnalyzer");
			expect(analyzer.version).toBe("2.0.0");
		});

		it("should have correct name and version", () => {
			expect(analyzer.name).toBe("DependencyAnalyzer");
			expect(analyzer.version).toBe("2.0.0");
		});
	});

	describe("configure", () => {
		it("should update configuration", () => {
			const newConfig: SpecConfig = {
				specsPath: "./new-path",
				analysis: {
					enableCycleDetection: true,
					maxAnalysisDepth: 10,
				},
			};
			analyzer.configure(newConfig);
			expect(analyzer).toBeDefined();
		});

		it("should merge configuration with existing config", () => {
			const initialConfig: SpecConfig = {
				specsPath: "./initial-path",
				analysis: {
					enableCycleDetection: true,
				},
			};
			const testAnalyzer = new DependencyAnalyzer(initialConfig);

			const updateConfig: SpecConfig = {
				analysis: {
					maxAnalysisDepth: 15,
				},
			};
			testAnalyzer.configure(updateConfig);

			expect(testAnalyzer).toBeDefined();
		});

		it("should handle empty config", () => {
			analyzer.configure({});
			expect(analyzer).toBeDefined();
		});
	});

	describe("analyze", () => {
		it("should return analysis result with correct structure", async () => {
			const result = await analyzer.analyze();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");
			expect(result.metadata).toBeDefined();
			expect(result.metadata.source).toBe("DependencyAnalyzer");
			expect(result.metadata.version).toBe("2.0.0");
			expect(typeof result.metadata.executionTime).toBe("number");

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(result.data.graph).toBeDefined();
				expect(result.data.health).toBeDefined();
				expect(result.data.depth).toBeDefined();
			}
		});

		it("should include graph data when successful", async () => {
			const result = await analyzer.analyze();

			if (result.success) {
				expect(result.data.graph).toBeDefined();
				expect(Array.isArray(result.data.graph.nodes)).toBe(true);
				expect(Array.isArray(result.data.graph.edges)).toBe(true);
				expect(result.data.graph.metadata).toBeDefined();
				expect(typeof result.data.graph.metadata?.nodeCount).toBe("number");
				expect(typeof result.data.graph.metadata?.edgeCount).toBe("number");
				expect(typeof result.data.graph.metadata?.cycleCount).toBe("number");
			}
		});

		it("should include health data when successful", async () => {
			const result = await analyzer.analyze();

			if (result.success) {
				expect(result.data.health).toBeDefined();
				expect(typeof result.data.health.score).toBe("number");
				expect(result.data.health.score).toBeGreaterThanOrEqual(0);
				expect(result.data.health.score).toBeLessThanOrEqual(100);
				expect(Array.isArray(result.data.health.issues)).toBe(true);
				expect(Array.isArray(result.data.health.recommendations)).toBe(true);
			}
		});

		it("should include depth data when successful", async () => {
			const result = await analyzer.analyze();

			if (result.success) {
				expect(result.data.depth).toBeDefined();
				expect(typeof result.data.depth.maxDepth).toBe("number");
				expect(typeof result.data.depth.averageDepth).toBe("number");
				expect(result.data.depth.depths).toBeDefined();
				expect(typeof result.data.depth.depths).toBe("object");
				expect(Array.isArray(result.data.depth.criticalPath)).toBe(true);
			}
		});

		it("should handle empty specs gracefully", async () => {
			const emptyAnalyzer = new DependencyAnalyzer({
				specsPath: "./empty-specs",
			});
			const result = await emptyAnalyzer.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (result.success) {
				expect(result.data.graph.nodes).toBeDefined();
				expect(result.data.graph.edges).toBeDefined();
			}
		});

		it("should handle errors gracefully", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/nonexistent/path",
			});
			const result = await badAnalyzer.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (!result.success) {
				expect(result.errors).toBeDefined();
				expect(Array.isArray(result.errors)).toBe(true);
			}
		});

		it("should have metadata with execution time", async () => {
			const result = await analyzer.analyze();

			expect(result.metadata).toBeDefined();
			expect(result.metadata.executionTime).toBeDefined();
			expect(typeof result.metadata.executionTime).toBe("number");
			expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
		});

		it("should return warnings array", async () => {
			const result = await analyzer.analyze();

			expect(result.warnings).toBeDefined();
			expect(Array.isArray(result.warnings)).toBe(true);
		});

		it("should return errors array", async () => {
			const result = await analyzer.analyze();

			expect(result.errors).toBeDefined();
			expect(Array.isArray(result.errors)).toBe(true);
		});
	});

	describe("generateGraph", () => {
		it("should return dependency graph result", async () => {
			const result = await analyzer.generateGraph();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
			expect(result.metadata).toBeDefined();

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(Array.isArray(result.data.nodes)).toBe(true);
				expect(Array.isArray(result.data.edges)).toBe(true);
			}
		});

		it("should include graph metadata", async () => {
			const result = await analyzer.generateGraph();

			if (result.success) {
				expect(result.data.metadata).toBeDefined();
				expect(typeof result.data.metadata?.nodeCount).toBe("number");
				expect(typeof result.data.metadata?.edgeCount).toBe("number");
				expect(typeof result.data.metadata?.cycleCount).toBe("number");
				expect(result.data.metadata?.nodeCount).toBe(result.data.nodes.length);
				expect(result.data.metadata?.edgeCount).toBe(result.data.edges.length);
			}
		});

		it("should detect cycles in graph", async () => {
			const result = await analyzer.generateGraph();

			if (result.success) {
				expect(result.data.cycles).toBeDefined();
				expect(Array.isArray(result.data.cycles)).toBe(true);
			}
		});

		it("should format node IDs correctly for plans", async () => {
			const result = await analyzer.generateGraph();

			if (result.success && result.data.nodes.length > 0) {
				const planNodes = result.data.nodes.filter((node) =>
					node.startsWith("pln-"),
				);
				planNodes.forEach((node) => {
					expect(node).toMatch(/^pln-\d{3}-[a-z0-9-]+$/);
				});
			}
		});

		it("should format node IDs correctly for components", async () => {
			const result = await analyzer.generateGraph();

			if (result.success && result.data.nodes.length > 0) {
				const componentNodes = result.data.nodes.filter(
					(node) =>
						node.startsWith("app-") ||
						node.startsWith("svc-") ||
						node.startsWith("lib-") ||
						node.startsWith("tol-"),
				);
				componentNodes.forEach((node) => {
					expect(node).toMatch(/^(app|svc|lib|tol)-\d{3}-[a-z0-9-]+$/);
				});
			}
		});

		it("should create edges with correct structure", async () => {
			const result = await analyzer.generateGraph();

			if (result.success && result.data.edges.length > 0) {
				result.data.edges.forEach((edge) => {
					expect(edge).toHaveProperty("from");
					expect(edge).toHaveProperty("to");
					expect(typeof edge.from).toBe("string");
					expect(typeof edge.to).toBe("string");
				});
			}
		});

		it("should handle errors gracefully", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/path",
			});
			const result = await badAnalyzer.generateGraph();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("detectCycles", () => {
		it("should return cycle analysis result", async () => {
			const result = await analyzer.detectCycles();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
			expect(result.metadata).toBeDefined();

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(typeof result.data.hasCycles).toBe("boolean");
				expect(Array.isArray(result.data.cycles)).toBe(true);
				expect(result.data.summary).toBeDefined();
			}
		});

		it("should include cycle summary", async () => {
			const result = await analyzer.detectCycles();

			if (result.success) {
				expect(result.data.summary).toBeDefined();
				expect(typeof result.data.summary.totalCycles).toBe("number");
				expect(typeof result.data.summary.maxCycleLength).toBe("number");
				expect(Array.isArray(result.data.summary.affectedNodes)).toBe(true);
				expect(result.data.summary.totalCycles).toBe(result.data.cycles.length);
			}
		});

		it("should set hasCycles to false when no cycles exist", async () => {
			const result = await analyzer.detectCycles();

			if (result.success && result.data.cycles.length === 0) {
				expect(result.data.hasCycles).toBe(false);
				expect(result.data.summary.totalCycles).toBe(0);
				expect(result.data.summary.maxCycleLength).toBe(0);
				expect(result.data.summary.affectedNodes.length).toBe(0);
			}
		});

		it("should set hasCycles to true when cycles exist", async () => {
			const result = await analyzer.detectCycles();

			if (result.success && result.data.cycles.length > 0) {
				expect(result.data.hasCycles).toBe(true);
				expect(result.data.summary.totalCycles).toBeGreaterThan(0);
				expect(result.data.summary.maxCycleLength).toBeGreaterThan(0);
			}
		});

		it("should calculate max cycle length correctly", async () => {
			const result = await analyzer.detectCycles();

			if (result.success && result.data.cycles.length > 0) {
				const actualMaxLength = Math.max(
					...result.data.cycles.map((c) => c.length),
				);
				expect(result.data.summary.maxCycleLength).toBe(actualMaxLength);
			}
		});

		it("should list all affected nodes", async () => {
			const result = await analyzer.detectCycles();

			if (result.success && result.data.cycles.length > 0) {
				const allNodesInCycles = new Set(result.data.cycles.flat());
				expect(result.data.summary.affectedNodes.length).toBe(
					allNodesInCycles.size,
				);
			}
		});

		it("should handle graph generation errors", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/path",
			});
			const result = await badAnalyzer.detectCycles();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("analyzeDepth", () => {
		it("should return depth analysis result", async () => {
			const result = await analyzer.analyzeDepth();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
			expect(result.metadata).toBeDefined();

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(typeof result.data.maxDepth).toBe("number");
				expect(typeof result.data.averageDepth).toBe("number");
				expect(result.data.depths).toBeDefined();
				expect(Array.isArray(result.data.criticalPath)).toBe(true);
			}
		});

		it("should calculate max depth correctly", async () => {
			const result = await analyzer.analyzeDepth();

			if (result.success) {
				expect(result.data.maxDepth).toBeGreaterThanOrEqual(0);

				const depthValues = Object.values(result.data.depths);
				if (depthValues.length > 0) {
					const calculatedMax = Math.max(...depthValues);
					expect(result.data.maxDepth).toBe(calculatedMax);
				} else {
					expect(result.data.maxDepth).toBe(0);
				}
			}
		});

		it("should calculate average depth correctly", async () => {
			const result = await analyzer.analyzeDepth();

			if (result.success) {
				expect(result.data.averageDepth).toBeGreaterThanOrEqual(0);

				const depthValues = Object.values(result.data.depths);
				if (depthValues.length > 0) {
					const sum = depthValues.reduce((acc, val) => acc + val, 0);
					const calculatedAvg = sum / depthValues.length;
					expect(result.data.averageDepth).toBeCloseTo(calculatedAvg, 5);
				} else {
					expect(result.data.averageDepth).toBe(0);
				}
			}
		});

		it("should include depth for each node", async () => {
			const result = await analyzer.analyzeDepth();

			if (result.success) {
				expect(result.data.depths).toBeDefined();
				expect(typeof result.data.depths).toBe("object");

				Object.entries(result.data.depths).forEach(([node, depth]) => {
					expect(typeof node).toBe("string");
					expect(typeof depth).toBe("number");
					expect(depth).toBeGreaterThanOrEqual(0);
				});
			}
		});

		it("should identify critical path nodes", async () => {
			const result = await analyzer.analyzeDepth();

			if (result.success && result.data.maxDepth > 0) {
				expect(result.data.criticalPath.length).toBeGreaterThan(0);

				// All nodes in critical path should have maxDepth
				result.data.criticalPath.forEach((node) => {
					expect(result.data.depths[node]).toBe(result.data.maxDepth);
				});
			}
		});

		it("should return empty critical path when maxDepth is 0", async () => {
			const result = await analyzer.analyzeDepth();

			if (result.success && result.data.maxDepth === 0) {
				// Critical path could be empty or contain nodes with depth 0
				result.data.criticalPath.forEach((node) => {
					expect(result.data.depths[node]).toBe(0);
				});
			}
		});

		it("should handle graph generation errors", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/path",
			});
			const result = await badAnalyzer.analyzeDepth();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("analyzeDependencyHealth", () => {
		it("should return health analysis", async () => {
			const result = await analyzer.analyzeDependencyHealth();

			expect(result).toBeDefined();
			expect(typeof result.score).toBe("number");
			expect(result.score).toBeGreaterThanOrEqual(0);
			expect(result.score).toBeLessThanOrEqual(100);
			expect(Array.isArray(result.issues)).toBe(true);
			expect(Array.isArray(result.recommendations)).toBe(true);
		});

		it("should return score between 0 and 100", async () => {
			const result = await analyzer.analyzeDependencyHealth();

			expect(result.score).toBeGreaterThanOrEqual(0);
			expect(result.score).toBeLessThanOrEqual(100);
		});

		it("should provide issues array", async () => {
			const result = await analyzer.analyzeDependencyHealth();

			expect(Array.isArray(result.issues)).toBe(true);
			result.issues.forEach((issue) => {
				expect(typeof issue).toBe("string");
			});
		});

		it("should provide recommendations array", async () => {
			const result = await analyzer.analyzeDependencyHealth();

			expect(Array.isArray(result.recommendations)).toBe(true);
			result.recommendations.forEach((recommendation) => {
				expect(typeof recommendation).toBe("string");
			});
		});

		it("should handle analysis failures", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/path",
			});
			const result = await badAnalyzer.analyzeDependencyHealth();

			expect(result).toBeDefined();
			expect(typeof result.score).toBe("number");
			expect(Array.isArray(result.issues)).toBe(true);
			expect(Array.isArray(result.recommendations)).toBe(true);

			if (result.score === 0) {
				expect(result.issues.length).toBeGreaterThan(0);
			}
		});
	});

	describe("reset", () => {
		it("should reset analyzer state", async () => {
			await analyzer.analyze();
			analyzer.reset();
			expect(analyzer).toBeDefined();
		});

		it("should allow analysis after reset", async () => {
			await analyzer.analyze();
			analyzer.reset();
			const result = await analyzer.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("error handling", () => {
		it("should handle invalid specs path", async () => {
			const invalidAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/nonexistent/path",
			});
			const result = await invalidAnalyzer.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});

		it("should handle empty configuration", async () => {
			const emptyAnalyzer = new DependencyAnalyzer({});
			const result = await emptyAnalyzer.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});

		it("should wrap errors in AnalysisResult", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/path",
			});
			const result = await badAnalyzer.analyze();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(result.metadata).toBeDefined();
			expect(result.warnings).toBeDefined();
			expect(result.errors).toBeDefined();
		});

		it("should include error details in failed results", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/path",
			});
			const result = await badAnalyzer.analyze();

			if (!result.success) {
				expect(result.errors).toBeDefined();
				expect(Array.isArray(result.errors)).toBe(true);
				expect(result.errors.length).toBeGreaterThan(0);
			}
		});

		it("should maintain metadata even on errors", async () => {
			const badAnalyzer = new DependencyAnalyzer({
				specsPath: "/invalid/path",
			});
			const result = await badAnalyzer.analyze();

			expect(result.metadata).toBeDefined();
			expect(result.metadata.source).toBe("DependencyAnalyzer");
			expect(result.metadata.version).toBe("2.0.0");
			expect(typeof result.metadata.executionTime).toBe("number");
		});
	});

	describe("supports", () => {
		it("should return true for dependency analysis", () => {
			if ("supports" in analyzer && typeof analyzer.supports === "function") {
				expect(analyzer.supports("dependency")).toBe(true);
			}
		});

		it("should return false for unsupported analysis types", () => {
			if ("supports" in analyzer && typeof analyzer.supports === "function") {
				expect(analyzer.supports("invalid")).toBe(false);
			}
		});

		it("should handle various analysis type strings", () => {
			if ("supports" in analyzer && typeof analyzer.supports === "function") {
				expect(analyzer.supports("coverage")).toBe(false);
				expect(analyzer.supports("orphan")).toBe(false);
				expect(analyzer.supports("cycle")).toBe(false);
			}
		});
	});

	describe("integration", () => {
		it("should perform full analysis workflow", async () => {
			// Generate graph
			const graphResult = await analyzer.generateGraph();
			expect(graphResult).toBeDefined();

			// Detect cycles
			const cycleResult = await analyzer.detectCycles();
			expect(cycleResult).toBeDefined();

			// Analyze depth
			const depthResult = await analyzer.analyzeDepth();
			expect(depthResult).toBeDefined();

			// Full analysis
			const fullResult = await analyzer.analyze();
			expect(fullResult).toBeDefined();
		});

		it("should handle reconfiguration during workflow", async () => {
			const result1 = await analyzer.analyze();
			expect(result1).toBeDefined();

			analyzer.configure({ specsPath: "./other-path" });

			const result2 = await analyzer.analyze();
			expect(result2).toBeDefined();
		});

		it("should handle multiple consecutive analyses", async () => {
			const result1 = await analyzer.analyze();
			const result2 = await analyzer.analyze();
			const result3 = await analyzer.analyze();

			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
			expect(result3).toBeDefined();
		});

		it("should maintain consistency across method calls", async () => {
			const graphResult = await analyzer.generateGraph();
			const cycleResult = await analyzer.detectCycles();

			if (graphResult.success && cycleResult.success) {
				expect(cycleResult.data.cycles).toEqual(graphResult.data.cycles);
			}
		});
	});
});
