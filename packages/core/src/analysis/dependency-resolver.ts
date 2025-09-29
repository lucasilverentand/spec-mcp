import type { AnyComponent } from "@spec-mcp/data";
import { SpecsManager } from "@spec-mcp/data";
import type { DependencyGraph, SpecConfig } from "../schemas/index.js";

export class DependencyResolver {
	private manager: SpecsManager;

	constructor(config?: SpecConfig) {
		// Map SpecConfig to SpecsManager config format
		const managerConfig = config
			? {
					...(config.specsPath ? { path: config.specsPath } : {}),
					autoDetect: config.autoDetect ?? true,
					schemaValidation: config.schemaValidation ?? true,
					referenceValidation: config.referenceValidation ?? true,
				}
			: undefined;
		this.manager = new SpecsManager(managerConfig);
	}

	async resolvePlanDependencies(planId: string): Promise<string[]> {
		const plan = await this.manager.getPlan(planId);
		if (!plan) {
			throw new Error(`Plan with ID '${planId}' not found`);
		}

		const resolved: string[] = [];
		const visited = new Set<string>();

		const resolve = async (currentPlanId: string): Promise<void> => {
			if (visited.has(currentPlanId)) {
				return;
			}

			visited.add(currentPlanId);
			const currentPlan = await this.manager.getPlan(currentPlanId);
			if (!currentPlan) {
				return;
			}

			// Recursively resolve dependencies
			for (const depId of currentPlan.depends_on) {
				await resolve(depId);
			}

			// Add current plan to resolved list
			if (!resolved.includes(currentPlanId)) {
				resolved.push(currentPlanId);
			}
		};

		await resolve(planId);
		return resolved;
	}

	async resolveComponentDependencies(componentId: string): Promise<string[]> {
		const component = await this.manager.getComponent(componentId);
		if (!component) {
			throw new Error(`Component with ID '${componentId}' not found`);
		}

		const resolved: string[] = [];
		const visited = new Set<string>();

		const resolve = async (currentComponentId: string): Promise<void> => {
			if (visited.has(currentComponentId)) {
				return;
			}

			visited.add(currentComponentId);
			const currentComponent =
				await this.manager.getComponent(currentComponentId);
			if (!currentComponent) {
				return;
			}

			// Recursively resolve dependencies
			for (const depId of currentComponent.depends_on) {
				await resolve(depId);
			}

			// Add current component to resolved list
			if (!resolved.includes(currentComponentId)) {
				resolved.push(currentComponentId);
			}
		};

		await resolve(componentId);
		return resolved;
	}

	async generatePlanDependencyGraph(): Promise<DependencyGraph> {
		const plans = await this.manager.listPlans();
		const nodes: string[] = [];
		const edges: Array<{ from: string; to: string }> = [];

		for (const plan of plans) {
			const planId = `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;
			nodes.push(planId);

			for (const depId of plan.depends_on) {
				edges.push({ from: depId, to: planId });
			}
		}

		const cycles = this.detectCycles(nodes, edges);

		return { nodes, edges, cycles };
	}

	async generateComponentDependencyGraph(): Promise<DependencyGraph> {
		const components = await this.manager.listComponents();
		const nodes: string[] = [];
		const edges: Array<{ from: string; to: string }> = [];

		for (const component of components) {
			const componentId = this.getComponentId(component);
			nodes.push(componentId);

			for (const depId of component.depends_on) {
				edges.push({ from: depId, to: componentId });
			}
		}

		const cycles = this.detectCycles(nodes, edges);

		return { nodes, edges, cycles };
	}

	async getOptimalExecutionOrder(
		type: "plans" | "components",
	): Promise<string[]> {
		const graph =
			type === "plans"
				? await this.generatePlanDependencyGraph()
				: await this.generateComponentDependencyGraph();

		if (graph.cycles && graph.cycles.length > 0) {
			throw new Error(
				`Cannot determine execution order due to circular dependencies: ${graph.cycles.map((cycle) => cycle.join(" -> ")).join(", ")}`,
			);
		}

		return this.topologicalSort(graph.nodes, graph.edges);
	}

	async getPlanExecutionBatches(): Promise<string[][]> {
		const graph = await this.generatePlanDependencyGraph();

		if (graph.cycles && graph.cycles.length > 0) {
			throw new Error(
				`Cannot create execution batches due to circular dependencies: ${graph.cycles.map((cycle) => cycle.join(" -> ")).join(", ")}`,
			);
		}

		const batches: string[][] = [];
		const remaining = new Set(graph.nodes);
		const dependencyMap = new Map<string, Set<string>>();

		// Build dependency map
		for (const node of graph.nodes) {
			dependencyMap.set(node, new Set());
		}

		for (const edge of graph.edges) {
			dependencyMap.get(edge.to)?.add(edge.from);
		}

		while (remaining.size > 0) {
			const currentBatch: string[] = [];

			// Find nodes with no remaining dependencies
			for (const node of remaining) {
				const deps = dependencyMap.get(node) || new Set();
				if (deps.size === 0) {
					currentBatch.push(node);
				}
			}

			if (currentBatch.length === 0) {
				throw new Error(
					"Cannot resolve dependencies - possible circular dependency detected",
				);
			}

			// Remove nodes from current batch
			for (const node of currentBatch) {
				remaining.delete(node);
			}

			// Remove completed nodes from other nodes' dependencies
			for (const [_node, deps] of dependencyMap) {
				for (const completed of currentBatch) {
					deps.delete(completed);
				}
			}

			batches.push(currentBatch);
		}

		return batches;
	}

	private detectCycles(
		nodes: string[],
		edges: Array<{ from: string; to: string }>,
	): string[][] {
		const graph = new Map<string, string[]>();
		const cycles: string[][] = [];

		// Build adjacency list
		for (const node of nodes) {
			graph.set(node, []);
		}

		for (const edge of edges) {
			graph.get(edge.from)?.push(edge.to);
		}

		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const dfs = (node: string, path: string[]): void => {
			if (recursionStack.has(node)) {
				// Found a cycle
				const cycleStart = path.indexOf(node);
				if (cycleStart !== -1) {
					cycles.push([...path.slice(cycleStart), node]);
				}
				return;
			}

			if (visited.has(node)) {
				return;
			}

			visited.add(node);
			recursionStack.add(node);
			path.push(node);

			const neighbors = graph.get(node) || [];
			for (const neighbor of neighbors) {
				dfs(neighbor, path);
			}

			recursionStack.delete(node);
			path.pop();
		};

		for (const node of nodes) {
			if (!visited.has(node)) {
				dfs(node, []);
			}
		}

		return cycles;
	}

	private topologicalSort(
		nodes: string[],
		edges: Array<{ from: string; to: string }>,
	): string[] {
		const graph = new Map<string, string[]>();
		const inDegree = new Map<string, number>();

		// Initialize
		for (const node of nodes) {
			graph.set(node, []);
			inDegree.set(node, 0);
		}

		// Build graph and calculate in-degrees
		for (const edge of edges) {
			graph.get(edge.from)?.push(edge.to);
			inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
		}

		const queue: string[] = [];
		const result: string[] = [];

		// Find nodes with no incoming edges
		for (const [node, degree] of inDegree) {
			if (degree === 0) {
				queue.push(node);
			}
		}

		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) continue;
			result.push(current);

			const neighbors = graph.get(current) || [];
			for (const neighbor of neighbors) {
				const newDegree = (inDegree.get(neighbor) || 0) - 1;
				inDegree.set(neighbor, newDegree);

				if (newDegree === 0) {
					queue.push(neighbor);
				}
			}
		}

		if (result.length !== nodes.length) {
			throw new Error(
				"Circular dependency detected - cannot perform topological sort",
			);
		}

		return result;
	}

	private getComponentId(component: AnyComponent): string {
		const typeMap = {
			app: "app",
			service: "svc",
			library: "lib",
			tool: "tol",
		};

		const prefix =
			typeMap[component.type as keyof typeof typeMap] ?? component.type;
		return `${prefix}-${component.number.toString().padStart(3, "0")}-${component.slug}`;
	}
}
