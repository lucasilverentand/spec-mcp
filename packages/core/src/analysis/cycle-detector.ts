import type { AnyComponent } from "@spec-mcp/data";
import type { CycleAnalysis, ICycleDetector } from "../interfaces/analyzer.js";
import type { AnalysisResult } from "../interfaces/results.js";
import { BaseAnalyzer } from "./base-analyzer.js";

export class CycleDetector
	extends BaseAnalyzer<CycleAnalysis>
	implements ICycleDetector
{
	readonly name = "CycleDetector";
	readonly version = "2.0.0";

	async analyze(): Promise<AnalysisResult<CycleAnalysis>> {
		return this.detectAllCycles();
	}

	async detectAllCycles(): Promise<AnalysisResult<CycleAnalysis>> {
		return this.safeAnalyze(async () => {
			const { plans, components } = await this.getEntities();

			// Build combined dependency graph
			const nodes: string[] = [];
			const edges: Array<{ from: string; to: string }> = [];

			// Add plan nodes and edges
			for (const plan of plans) {
				const planId = `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;
				nodes.push(planId);

				for (const depId of plan.depends_on) {
					edges.push({ from: depId, to: planId });
				}
			}

			// Add component nodes and edges
			for (const component of components) {
				const componentId = this.getComponentId(component);
				nodes.push(componentId);

				for (const depId of component.depends_on) {
					edges.push({ from: depId, to: componentId });
				}
			}

			// Add plan-component relationships
			for (const plan of plans) {
				const planId = `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;
				for (const testCase of plan.test_cases) {
					for (const componentId of testCase.components) {
						edges.push({ from: componentId, to: planId });
					}
				}
			}

			const cycles = this.findCycles(nodes, edges);
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

	findCycleInPath(path: string[]): boolean {
		if (path.length < 2) {
			return false;
		}

		const seen = new Set<string>();
		for (const node of path) {
			if (seen.has(node)) {
				return true;
			}
			seen.add(node);
		}
		return false;
	}

	private findCycles(
		nodes: string[],
		edges: Array<{ from: string; to: string }>,
	): string[][] {
		const adjacencyList = this.buildAdjacencyList(nodes, edges);
		const visited = new Set<string>();
		const recursionStack = new Set<string>();
		const cycles: string[][] = [];

		for (const node of nodes) {
			if (!visited.has(node)) {
				this.dfsForCycles(
					node,
					adjacencyList,
					visited,
					recursionStack,
					[],
					cycles,
				);
			}
		}

		return cycles;
	}

	private buildAdjacencyList(
		nodes: string[],
		edges: Array<{ from: string; to: string }>,
	): Map<string, string[]> {
		const adjacencyList = new Map<string, string[]>();

		// Initialize all nodes
		for (const node of nodes) {
			adjacencyList.set(node, []);
		}

		// Add edges
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
		cycles: string[][],
	): void {
		visited.add(node);
		recursionStack.add(node);
		path.push(node);

		const neighbors = adjacencyList.get(node) || [];
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				this.dfsForCycles(
					neighbor,
					adjacencyList,
					visited,
					recursionStack,
					[...path],
					cycles,
				);
			} else if (recursionStack.has(neighbor)) {
				// Found a cycle - extract it from the path
				const cycleStart = path.indexOf(neighbor);
				if (cycleStart !== -1) {
					const cycle = [...path.slice(cycleStart), neighbor];
					cycles.push(cycle);
				}
			}
		}

		recursionStack.delete(node);
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
