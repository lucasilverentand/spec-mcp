import type { AnyComponent } from "@spec-mcp/data";
import { ErrorFactory } from "../domain/errors.js";
import type {
	CycleAnalysis,
	DependencyAnalysisResult,
	DependencyGraph,
	DepthAnalysis,
	IDependencyAnalyzer,
} from "../interfaces/analyzer.js";
import type { AnalysisResult } from "../interfaces/results.js";
import { BaseAnalyzer } from "./base-analyzer.js";

export class DependencyAnalyzer
	extends BaseAnalyzer<DependencyAnalysisResult>
	implements IDependencyAnalyzer
{
	readonly name = "DependencyAnalyzer";
	readonly version = "2.0.0";

	async analyze(): Promise<AnalysisResult<DependencyAnalysisResult>> {
		return this.safeAnalyze(async () => {
			const [graphResult, cycleResult, depthResult] = await Promise.all([
				this.generateGraph(),
				this.detectCycles(),
				this.analyzeDepth(),
			]);

			if (
				!graphResult.success ||
				!cycleResult.success ||
				!depthResult.success
			) {
				const errors = [
					...(graphResult.errors || []),
					...(cycleResult.errors || []),
					...(depthResult.errors || []),
				];
				throw ErrorFactory.dependencyAnalysis(
					`Analysis failed: ${errors.join(", ")}`,
				);
			}

			const health = this.calculateHealthScore(
				graphResult.data,
				cycleResult.data,
				depthResult.data,
			);

			return {
				graph: graphResult.data,
				health,
				depth: depthResult.data,
			};
		});
	}

	async generateGraph(): Promise<AnalysisResult<DependencyGraph>> {
		return this.safeAnalyze(async () => {
			const { plans, components } = await this.getEntities();

			const planNodes = plans.map(
				(plan) => `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`,
			);
			const planEdges = plans.flatMap((plan) => {
				const planId = `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;
				return plan.depends_on.map((depId) => ({ from: depId, to: planId }));
			});

			const componentNodes = components.map((component) =>
				this.getComponentId(component),
			);
			const componentEdges = components.flatMap((component) => {
				const componentId = this.getComponentId(component);
				return component.depends_on.map((depId) => ({
					from: depId,
					to: componentId,
				}));
			});

			// Add plan-component relationships
			const planComponentEdges = plans.flatMap((plan) => {
				const planId = `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;
				return plan.test_cases.flatMap((testCase) =>
					testCase.components.map((componentId) => ({
						from: componentId,
						to: planId,
					})),
				);
			});

			const allNodes = [...planNodes, ...componentNodes];
			const allEdges = [...planEdges, ...componentEdges, ...planComponentEdges];
			const cycles = this.detectCyclesInGraph(allNodes, allEdges);

			return {
				nodes: allNodes,
				edges: allEdges,
				cycles,
				metadata: {
					nodeCount: allNodes.length,
					edgeCount: allEdges.length,
					cycleCount: cycles.length,
				},
			};
		});
	}

	async detectCycles(): Promise<AnalysisResult<CycleAnalysis>> {
		return this.safeAnalyze(async () => {
			const graphResult = await this.generateGraph();
			if (!graphResult.success) {
				throw ErrorFactory.cycleDetection(
					"Failed to generate graph for cycle detection",
				);
			}

			const cycles = graphResult.data.cycles || [];
			const affectedNodes = [...new Set(cycles.flat())];
			const maxCycleLength =
				cycles.length > 0
					? Math.max(...cycles.map((cycle) => cycle.length))
					: 0;

			return {
				hasCycles: cycles.length > 0,
				cycles,
				summary: {
					totalCycles: cycles.length,
					maxCycleLength,
					affectedNodes,
				},
			};
		});
	}

	async analyzeDepth(): Promise<AnalysisResult<DepthAnalysis>> {
		return this.safeAnalyze(async () => {
			const graphResult = await this.generateGraph();
			if (!graphResult.success) {
				throw ErrorFactory.dependencyAnalysis(
					"Failed to generate graph for depth analysis",
				);
			}

			const depths = this.calculateDepths(
				graphResult.data.nodes,
				graphResult.data.edges,
			);
			const depthValues = Object.values(depths);
			const maxDepth = depthValues.length > 0 ? Math.max(...depthValues) : 0;
			const averageDepth =
				depthValues.length > 0
					? depthValues.reduce((sum, depth) => sum + depth, 0) /
						depthValues.length
					: 0;

			// Find critical path (nodes with maximum depth)
			const criticalPath = Object.entries(depths)
				.filter(([, depth]) => depth === maxDepth)
				.map(([node]) => node);

			return {
				maxDepth,
				averageDepth,
				depths,
				criticalPath,
			};
		});
	}

	async analyzeDependencyHealth(): Promise<{
		score: number;
		issues: string[];
		recommendations: string[];
	}> {
		const analysisResult = await this.analyze();
		if (!analysisResult.success) {
			return {
				score: 0,
				issues: analysisResult.errors || ["Analysis failed"],
				recommendations: [
					"Fix analysis errors before assessing dependency health",
				],
			};
		}

		return analysisResult.data.health;
	}

	private calculateHealthScore(
		graph: DependencyGraph,
		cycles: CycleAnalysis,
		depth: DepthAnalysis,
	): { score: number; issues: string[]; recommendations: string[] } {
		const issues: string[] = [];
		const recommendations: string[] = [];
		let score = 100;

		// Penalize cycles
		if (cycles.hasCycles) {
			const cycleScore = Math.max(0, 30 - cycles.summary.totalCycles * 5);
			score -= 30 - cycleScore;
			issues.push(
				`${cycles.summary.totalCycles} circular dependencies detected`,
			);
			recommendations.push(
				"Resolve circular dependencies to improve maintainability",
			);
		}

		// Penalize excessive depth
		if (depth.maxDepth > 10) {
			const depthPenalty = Math.min(20, (depth.maxDepth - 10) * 2);
			score -= depthPenalty;
			issues.push(
				`Maximum dependency depth is ${depth.maxDepth} (recommended: ≤10)`,
			);
			recommendations.push("Consider flattening deep dependency chains");
		}

		// Penalize too many nodes (complexity)
		const nodeCount = graph.metadata?.nodeCount || 0;
		if (nodeCount > 100) {
			const complexityPenalty = Math.min(
				15,
				Math.floor((nodeCount - 100) / 20),
			);
			score -= complexityPenalty;
			issues.push(`High complexity: ${nodeCount} nodes in dependency graph`);
			recommendations.push("Consider breaking down large specifications");
		}

		// Bonus for good structure
		if (!cycles.hasCycles && depth.maxDepth <= 5) {
			issues.push("Well-structured dependency graph");
		}

		return {
			score: Math.max(0, Math.round(score)),
			issues,
			recommendations,
		};
	}

	private detectCyclesInGraph(
		nodes: string[],
		edges: Array<{ from: string; to: string }>,
	): string[][] {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();
		const cycles: string[][] = [];

		const adjacencyList = this.buildAdjacencyList(nodes, edges);

		for (const node of nodes) {
			if (!visited.has(node)) {
				const currentCycle = this.dfsForCycles(
					node,
					adjacencyList,
					visited,
					recursionStack,
					[],
				);
				if (currentCycle.length > 0) {
					cycles.push(currentCycle);
				}
			}
		}

		return cycles;
	}

	private buildAdjacencyList(
		nodes: string[],
		edges: Array<{ from: string; to: string }>,
	): Map<string, string[]> {
		const adjacencyList = new Map<string, string[]>();

		for (const node of nodes) {
			adjacencyList.set(node, []);
		}

		for (const edge of edges) {
			const neighbors = adjacencyList.get(edge.from) || [];
			neighbors.push(edge.to);
			adjacencyList.set(edge.from, neighbors);
		}

		return adjacencyList;
	}

	private dfsForCycles(
		node: string,
		adjacencyList: Map<string, string[]>,
		visited: Set<string>,
		recursionStack: Set<string>,
		path: string[],
	): string[] {
		visited.add(node);
		recursionStack.add(node);
		path.push(node);

		const neighbors = adjacencyList.get(node) || [];
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				const cycle = this.dfsForCycles(
					neighbor,
					adjacencyList,
					visited,
					recursionStack,
					[...path],
				);
				if (cycle.length > 0) {
					return cycle;
				}
			} else if (recursionStack.has(neighbor)) {
				// Found a cycle
				const cycleStart = path.indexOf(neighbor);
				return path.slice(cycleStart);
			}
		}

		recursionStack.delete(node);
		return [];
	}

	private calculateDepths(
		nodes: string[],
		edges: Array<{ from: string; to: string }>,
	): Record<string, number> {
		const depths: Record<string, number> = {};
		const adjacencyList = this.buildAdjacencyList(nodes, edges);
		const visited = new Set<string>();

		// Initialize all nodes with depth 0
		for (const node of nodes) {
			depths[node] = 0;
		}

		// Find nodes with no incoming edges (roots)
		const incomingEdges = new Map<string, number>();
		for (const node of nodes) {
			incomingEdges.set(node, 0);
		}
		for (const edge of edges) {
			incomingEdges.set(edge.to, (incomingEdges.get(edge.to) || 0) + 1);
		}

		const roots = nodes.filter((node) => (incomingEdges.get(node) || 0) === 0);

		// DFS to calculate depths
		for (const root of roots) {
			this.calculateDepthDFS(root, adjacencyList, depths, visited);
		}

		return depths;
	}

	private calculateDepthDFS(
		node: string,
		adjacencyList: Map<string, string[]>,
		depths: Record<string, number>,
		visited: Set<string>,
	): number {
		if (visited.has(node)) {
			return depths[node] ?? 0;
		}

		visited.add(node);
		const neighbors = adjacencyList.get(node) || [];

		let maxChildDepth = 0;
		for (const neighbor of neighbors) {
			const childDepth = this.calculateDepthDFS(
				neighbor,
				adjacencyList,
				depths,
				visited,
			);
			maxChildDepth = Math.max(maxChildDepth, childDepth);
		}

		depths[node] = maxChildDepth + 1;
		return depths[node];
	}

	private getComponentId(component: AnyComponent): string {
		switch (component.type) {
			case "app":
				return `app-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			case "service":
				return `svc-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			case "library":
				return `lib-${component.number.toString().padStart(3, "0")}-${component.slug}`;
		}
	}
}
