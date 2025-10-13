import { resolve } from "node:path";
import type {
	BusinessRequirement,
	Component,
	Constitution,
	Criteria,
	Decision,
	EntityType,
	ItemType,
	Milestone,
	Plan,
	Query,
	QueryResult,
	QueryResultItem,
	SpecResultItem,
	StatusFilter,
	SubItemResultItem,
	Task,
	TechnicalRequirement,
	TestCase,
} from "@spec-mcp/schemas";
import {
	formatEntityId,
	formatItemId,
	getEntityPrefix,
	parseEntityId,
} from "@spec-mcp/utils";
import {
	createBusinessRequirementsManager,
	createComponentsManager,
	createConstitutionsManager,
	createDecisionsManager,
	createMilestonesManager,
	createPlansManager,
	createTechRequirementsManager,
} from "./entities/index.js";
import type { EntityManager } from "./entity-manager.js";
import { FileManager } from "./file-manager.js";
import {
	getItemTypes,
	getPlanState,
	getSpecTypes,
	getTaskState,
	isActiveTask,
	isCompleted,
	isItemTypeQuery,
	isVerified,
} from "./utils/index.js";

/**
 * Centralized counter structure stored in specs.yml
 */
interface SpecsMetadata {
	counters: {
		business_requirements: number;
		tech_requirements: number;
		plans: number;
		components: number;
		constitutions: number;
		decisions: number;
		milestones: number;
		tasks: number; // Global task counter across all plans
	};
}

export class SpecManager {
	private specsPath: string;
	private fileManager: FileManager;
	private originalPath: string; // Track original path for switching back
	private currentWorktreePath: string | null = null; // Track current worktree

	public business_requirements: EntityManager<BusinessRequirement>;
	public tech_requirements: EntityManager<TechnicalRequirement>;
	public plans: EntityManager<Plan>;
	public components: EntityManager<Component>;
	public constitutions: EntityManager<Constitution>;
	public decisions: EntityManager<Decision>;
	public milestones: EntityManager<Milestone>;

	/**
	 * Create a new SpecManager
	 * @param specsPath - Path to the .specs folder (defaults to "./specs")
	 */
	constructor(specsPath: string = "./specs") {
		this.specsPath = specsPath;
		this.originalPath = specsPath;
		this.fileManager = new FileManager(specsPath);

		this.business_requirements = createBusinessRequirementsManager(
			this.specsPath,
		);
		this.tech_requirements = createTechRequirementsManager(this.specsPath);
		this.plans = createPlansManager(this.specsPath);
		this.components = createComponentsManager(this.specsPath);
		this.constitutions = createConstitutionsManager(this.specsPath);
		this.decisions = createDecisionsManager(this.specsPath);
		this.milestones = createMilestonesManager(this.specsPath);
	}

	/**
	 * Get the base path of the specs folder
	 */
	getBasePath(): string {
		return resolve(this.specsPath);
	}

	/**
	 * Get all validation warnings from all entity managers
	 * Returns files that exist but failed schema validation
	 * Call this after operations that load entities (like list() or query())
	 */
	async getAllValidationWarnings(): Promise<
		Array<
			import("./entity-manager.js").ValidationWarning & {
				entityType: EntityType;
			}
		>
	> {
		const warnings: Array<
			import("./entity-manager.js").ValidationWarning & {
				entityType: EntityType;
			}
		> = [];

		// Collect warnings from each manager
		const managers: Array<{ manager: EntityManager<any>; type: EntityType }> = [
			{ manager: this.business_requirements, type: "business-requirement" },
			{ manager: this.tech_requirements, type: "technical-requirement" },
			{ manager: this.plans, type: "plan" },
			{ manager: this.components, type: "component" },
			{ manager: this.constitutions, type: "constitution" },
			{ manager: this.decisions, type: "decision" },
			{ manager: this.milestones, type: "milestone" },
		];

		for (const { manager, type } of managers) {
			const managerWarnings = manager.getValidationWarnings();
			for (const warning of managerWarnings) {
				warnings.push({
					...warning,
					entityType: type,
				});
			}
		}

		return warnings;
	}

	/**
	 * Ensure the specs folder and all entity folders exist
	 */
	async ensureFolders(): Promise<void> {
		await this.fileManager.ensureFolder();
		await Promise.all([
			this.business_requirements.ensureFolder(),
			this.tech_requirements.ensureFolder(),
			this.plans.ensureFolder(),
			this.components.ensureFolder(),
			this.constitutions.ensureFolder(),
			this.decisions.ensureFolder(),
			this.milestones.ensureFolder(),
		]);
	}

	/**
	 * Get the entity manager for a given type
	 */
	private getManagerForType(
		type: EntityType,
	): EntityManager<
		| BusinessRequirement
		| TechnicalRequirement
		| Plan
		| Component
		| Constitution
		| Decision
		| Milestone
	> {
		switch (type) {
			case "business-requirement":
				return this.business_requirements;
			case "technical-requirement":
				return this.tech_requirements;
			case "plan":
				return this.plans;
			case "component":
				return this.components;
			case "constitution":
				return this.constitutions;
			case "decision":
				return this.decisions;
			case "milestone":
				return this.milestones;
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}
	}

	/**
	 * Get the counter field name for a given type
	 */
	private getCounterKey(type: EntityType): keyof SpecsMetadata["counters"] {
		switch (type) {
			case "business-requirement":
				return "business_requirements";
			case "technical-requirement":
				return "tech_requirements";
			case "plan":
				return "plans";
			case "component":
				return "components";
			case "constitution":
				return "constitutions";
			case "decision":
				return "decisions";
			case "milestone":
				return "milestones";
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}
	}

	/**
	 * Read specs metadata (creates with defaults if doesn't exist)
	 */
	private async readMetadata(): Promise<SpecsMetadata> {
		try {
			if (await this.fileManager.exists("specs.yml")) {
				return await this.fileManager.readYaml<SpecsMetadata>("specs.yml");
			}
		} catch {
			// Fall through to create default
		}

		// Return default metadata
		return {
			counters: {
				business_requirements: 0,
				tech_requirements: 0,
				plans: 0,
				components: 0,
				constitutions: 0,
				decisions: 0,
				milestones: 0,
				tasks: 0,
			},
		};
	}

	/**
	 * Write specs metadata
	 */
	private async writeMetadata(metadata: SpecsMetadata): Promise<void> {
		await this.fileManager.writeYaml("specs.yml", metadata);
	}

	/**
	 * Get next available number for an entity type (thread-safe via centralized counter)
	 */
	async getNextNumber(type: EntityType): Promise<number> {
		const counterKey = this.getCounterKey(type);
		const manager = this.getManagerForType(type);

		try {
			// Read current metadata
			const metadata = await this.readMetadata();
			let currentCounter = metadata.counters[counterKey];

			// If counter is 0, initialize from existing files
			if (currentCounter === 0) {
				const existingMax = await manager.getMaxNumber();
				currentCounter = existingMax;
			}

			// Increment counter
			const nextNumber = currentCounter + 1;
			metadata.counters[counterKey] = nextNumber;

			// Save updated metadata
			await this.writeMetadata(metadata);

			return nextNumber;
		} catch (_error) {
			// On any error, fall back to scanning files
			const maxNumber = await manager.getMaxNumber();
			return maxNumber + 1;
		}
	}

	/**
	 * Get next available task ID (globally unique across all plans)
	 */
	async getNextTaskId(): Promise<string> {
		try {
			// Read current metadata
			const metadata = await this.readMetadata();
			let currentCounter = metadata.counters.tasks;

			// If counter is 0, initialize by scanning all plans
			if (currentCounter === 0) {
				currentCounter = await this.getMaxTaskNumber();
			}

			// Increment counter
			const nextNumber = currentCounter + 1;
			metadata.counters.tasks = nextNumber;

			// Save updated metadata
			await this.writeMetadata(metadata);

			return formatItemId({ itemType: "task", number: nextNumber });
		} catch (_error) {
			// On any error, fall back to scanning all plans
			const maxNumber = await this.getMaxTaskNumber();
			const nextNumber = maxNumber + 1;
			return formatItemId({ itemType: "task", number: nextNumber });
		}
	}

	/**
	 * Get the maximum task number across all plans
	 */
	private async getMaxTaskNumber(): Promise<number> {
		const plans = await this.plans.list();
		let maxTaskNum = 0;

		for (const plan of plans) {
			if (!plan.tasks) continue;

			for (const task of plan.tasks) {
				const match = task.id.match(/^tsk-(\d+)$/);
				if (match?.[1]) {
					const num = Number.parseInt(match[1], 10);
					if (num > maxTaskNum) {
						maxTaskNum = num;
					}
				}
			}
		}

		return maxTaskNum;
	}

	/**
	 * Switch to a worktree specs directory
	 * @param worktreePath - Path to the worktree root (e.g., ../plan/pln-001-feature)
	 */
	async switchToWorktree(worktreePath: string): Promise<void> {
		const newSpecsPath = resolve(worktreePath, "specs");

		// Update the specs path
		this.specsPath = newSpecsPath;
		this.currentWorktreePath = worktreePath;

		// Reinitialize all managers with the new path
		this.fileManager = new FileManager(newSpecsPath);
		this.business_requirements =
			createBusinessRequirementsManager(newSpecsPath);
		this.tech_requirements = createTechRequirementsManager(newSpecsPath);
		this.plans = createPlansManager(newSpecsPath);
		this.components = createComponentsManager(newSpecsPath);
		this.constitutions = createConstitutionsManager(newSpecsPath);
		this.decisions = createDecisionsManager(newSpecsPath);
		this.milestones = createMilestonesManager(newSpecsPath);

		// Ensure folders exist in the worktree
		await this.ensureFolders();
	}

	/**
	 * Switch back to the original specs directory
	 */
	async switchToMain(): Promise<void> {
		// Reset to original path
		this.specsPath = this.originalPath;
		this.currentWorktreePath = null;

		// Reinitialize all managers with the original path
		this.fileManager = new FileManager(this.originalPath);
		this.business_requirements = createBusinessRequirementsManager(
			this.originalPath,
		);
		this.tech_requirements = createTechRequirementsManager(this.originalPath);
		this.plans = createPlansManager(this.originalPath);
		this.components = createComponentsManager(this.originalPath);
		this.constitutions = createConstitutionsManager(this.originalPath);
		this.decisions = createDecisionsManager(this.originalPath);
		this.milestones = createMilestonesManager(this.originalPath);
	}

	/**
	 * Get the current worktree path (null if on main)
	 */
	getCurrentWorktree(): string | null {
		return this.currentWorktreePath;
	}

	/**
	 * Check if currently in a worktree
	 */
	isInWorktree(): boolean {
		return this.currentWorktreePath !== null;
	}

	/**
	 * Execute a query against the spec manager
	 * This is the centralized Single Point of Control for all spec queries
	 */
	async query(query: Query): Promise<QueryResult> {
		// Determine if we're querying for specs or sub-items
		const queryingSubItems = isItemTypeQuery(query);

		let items: QueryResultItem[] = [];

		if (queryingSubItems) {
			// Query for sub-items within specs
			items = await this.querySubItems(query);
		} else {
			// Query for specs
			items = await this.querySpecs(query);
		}

		// Apply text search filter (Feature 1 & 8)
		if (query.textSearch) {
			items = this.applyTextSearch(
				items,
				query.textSearch,
				query.searchFields ?? ["all"],
			);
		}

		// Apply date range filters (Feature 2)
		items = this.applyDateRangeFilters(items, query);

		// Apply dependency filters (Feature 3)
		if (query.dependencyStatus && queryingSubItems) {
			items = await this.applyDependencyFilters(items, query.dependencyStatus);
		}

		// Apply sorting
		items = this.sortResults(items, query.orderBy, query.direction);

		// Store unpaginated total
		const totalUnpaginated = items.length;

		// Apply pagination (Feature 4)
		const offset = query.offset ?? 0;
		if (query.limit !== undefined || offset > 0) {
			const limit = query.limit ?? items.length;
			items = items.slice(offset, offset + limit);
		}

		// Build result
		const result: QueryResult = {
			items,
			total: items.length,
			totalUnpaginated,
			query,
		};

		// Add statistics (Feature 6)
		if (query.includeStats === true) {
			result.stats = this.calculateStats(items);
		}

		// Add related items (Feature 7)
		if (query.includeRelated === true && query.relatedTypes) {
			result.relatedItems = await this.expandRelatedItems(
				items,
				query.relatedTypes,
			);
		}

		return result;
	}

	/**
	 * Count results for a query without fetching full data
	 * More efficient than query() when you only need the count
	 */
	async count(query: Query): Promise<number> {
		const result = await this.query(query);
		return result.total;
	}

	/**
	 * Query for specs
	 */
	private async querySpecs(query: Query): Promise<SpecResultItem[]> {
		// Get all specs from all managers
		const allSpecs: Spec[] = [];

		// Determine which spec types to query
		const specTypes = getSpecTypes(query);
		const typesToQuery: EntityType[] = specTypes
			? (specTypes as EntityType[])
			: [
					"business-requirement",
					"technical-requirement",
					"plan",
					"component",
					"constitution",
					"decision",
					"milestone",
				];

		// Load specs from each manager
		for (const type of typesToQuery) {
			const manager = this.getManagerForType(type);
			const specs = await manager.list();
			allSpecs.push(...specs);
		}

		// Apply filters
		const filtered = allSpecs.filter((spec) =>
			this.applySpecFilters(spec, query),
		);

		// Convert to result items
		const results: SpecResultItem[] = filtered.map((spec) =>
			this.specToResultItem(spec),
		);

		return results;
	}

	/**
	 * Query for sub-items (tasks, test cases, criteria, etc.)
	 */
	private async querySubItems(query: Query): Promise<SubItemResultItem[]> {
		const itemTypes = getItemTypes(query);
		if (!itemTypes) {
			return [];
		}

		const results: SubItemResultItem[] = [];

		// Determine which specs contain the requested item types
		const specsToQuery = this.getSpecTypesForItemTypes(itemTypes);

		// Load relevant specs
		for (const specType of specsToQuery) {
			const manager = this.getManagerForType(specType);
			const specs = await manager.list();

			for (const spec of specs) {
				// Extract sub-items based on item types
				const subItems = this.extractSubItems(spec, itemTypes, query);
				results.push(...subItems);
			}
		}

		return results;
	}

	/**
	 * Apply filters to a spec
	 */
	private applySpecFilters(spec: Spec, query: Query): boolean {
		// Draft filter - filter by draft flag (set from file extension)
		if (query.draft !== undefined) {
			const isDraft = (spec as unknown as { draft?: boolean }).draft === true;
			if (query.draft !== isDraft) {
				return false;
			}
		}

		// ID filter (partial matching) - ONLY match on type+number, slug is completely ignored
		if (query.id !== undefined) {
			const ids = Array.isArray(query.id) ? query.id : [query.id];
			const specId = formatEntityId({ type: spec.type, number: spec.number });

			const matchesId = ids.some((id) => {
				// Parse the query ID and extract just type+number (ignore slug)
				const parsed = parseEntityId(id);
				if (parsed) {
					// Match only on type + number
					const queryId = formatEntityId({
						type: parsed.entityType!,
						number: parsed.number,
					});
					if (specId === queryId) {
						return true;
					}
				}

				// Also try exact match and prefix match for backwards compatibility
				if (specId === id || specId.startsWith(id)) {
					return true;
				}

				// Partial prefix matching - handle unpadded numbers like pln-1 matching pln-001
				if (id.includes("-")) {
					const parts = id.split("-");
					const queryPrefix = parts[0];
					const queryNumber = parts[1] ? Number.parseInt(parts[1], 10) : null;

					if (
						queryPrefix === getEntityPrefix(spec.type) &&
						queryNumber === spec.number
					) {
						return true;
					}
				}

				return false;
			});

			if (!matchesId) {
				return false;
			}
		}

		// Priority filter
		if (query.priority && !query.priority.includes(spec.priority)) {
			return false;
		}

		// Milestone filter (for specs that have milestones field)
		if (query.milestone) {
			// Only plans have milestones, so exclude non-plan specs
			if (spec.type !== "plan") {
				return false;
			}
			const plan = spec as Plan;
			if (!plan.milestones?.includes(query.milestone)) {
				return false;
			}
		}

		// Status filter (computed from spec state)
		if (query.status) {
			// Only plans have a status, so exclude non-plan specs
			if (spec.type !== "plan") {
				return false;
			}
			const plan = spec as Plan;
			const planState = getPlanState(plan);
			if (!query.status.includes(planState)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Extract sub-items from a spec based on item types and filters
	 */
	private extractSubItems(
		spec: Spec,
		itemTypes: ItemType[],
		query: Query,
	): SubItemResultItem[] {
		const results: SubItemResultItem[] = [];

		// Extract tasks
		if (itemTypes.includes("task") && "tasks" in spec) {
			const plan = spec as Plan;
			if (plan.tasks) {
				for (const task of plan.tasks) {
					if (this.applyTaskFilters(task, spec, query)) {
						results.push(this.taskToResultItem(task, spec));
					}
				}
			}
		}

		// Extract test cases
		if (itemTypes.includes("test-case") && "test_cases" in spec) {
			const plan = spec as Plan;
			if (plan.test_cases) {
				for (const testCase of plan.test_cases) {
					if (this.applyTestCaseFilters(testCase, spec, query)) {
						results.push(this.testCaseToResultItem(testCase, spec));
					}
				}
			}
		}

		// Extract criteria
		if (itemTypes.includes("criteria") && "criteria" in spec) {
			const specWithCriteria = spec as
				| BusinessRequirement
				| TechnicalRequirement;
			const hasArrayCriteria = Array.isArray(specWithCriteria.criteria);
			if (hasArrayCriteria) {
				const criteriaArray = specWithCriteria.criteria;
				if (criteriaArray) {
					for (const criterion of criteriaArray) {
						if (this.applyCriteriaFilters(criterion, spec, query)) {
							results.push(this.criterionToResultItem(criterion, spec));
						}
					}
				}
			}
		}

		return results;
	}

	/**
	 * Apply filters to a task
	 */
	private applyTaskFilters(task: Task, parent: Spec, query: Query): boolean {
		// Only include active (non-superseded) tasks
		if (!isActiveTask(task)) {
			return false;
		}

		// ID filter
		if (query.id !== undefined) {
			const ids = Array.isArray(query.id) ? query.id : [query.id];
			const parentId = formatEntityId({
				type: parent.type,
				number: parent.number,
			});
			const parentFullId = formatEntityId({
				type: parent.type,
				number: parent.number,
				slug: parent.slug,
			});

			const matchesId = ids.some((id) => {
				// Exact match on task ID
				if (task.id === id || task.id.startsWith(id)) {
					return true;
				}

				// Match parent ID (try both formatted and query ID as prefix)
				if (parentId === id || parentFullId === id) {
					return true;
				}

				// Partial prefix matching - formatEntityId pads numbers, so pln-1 should match pln-001
				if (id.includes("-")) {
					const parts = id.split("-");
					const queryPrefix = parts[0];
					const queryNumber = parts[1] ? Number.parseInt(parts[1], 10) : null;

					if (
						queryPrefix === getEntityPrefix(parent.type) &&
						queryNumber === parent.number
					) {
						return true;
					}
				}

				return false;
			});

			if (!matchesId) {
				return false;
			}
		}

		// Completed filter
		if (query.completed !== undefined) {
			if (isCompleted(task.status) !== query.completed) {
				return false;
			}
		}

		// Verified filter
		if (query.verified !== undefined) {
			if (isVerified(task.status) !== query.verified) {
				return false;
			}
		}

		// Priority filter
		if (query.priority && !query.priority.includes(task.priority)) {
			return false;
		}

		// Status filter
		if (query.status) {
			const taskState = getTaskState(task.status);
			if (!query.status.includes(taskState)) {
				return false;
			}
		}

		// Milestone filter (check parent plan's milestones)
		if (query.milestone && parent.type === "plan") {
			const plan = parent as Plan;
			if (!plan.milestones?.includes(query.milestone)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Apply filters to a test case
	 */
	private applyTestCaseFilters(
		testCase: TestCase,
		parent: Spec,
		query: Query,
	): boolean {
		// ID filter
		if (query.id !== undefined) {
			const ids = Array.isArray(query.id) ? query.id : [query.id];
			const parentId = formatEntityId({
				type: parent.type,
				number: parent.number,
			});
			const parentFullId = formatEntityId({
				type: parent.type,
				number: parent.number,
				slug: parent.slug,
			});

			const matchesId = ids.some((id) => {
				// Exact match on test case ID
				if (testCase.id === id || testCase.id.startsWith(id)) {
					return true;
				}

				// Match parent ID
				if (parentId === id || parentFullId === id) {
					return true;
				}

				// Partial prefix matching
				if (id.includes("-")) {
					const parts = id.split("-");
					const queryPrefix = parts[0];
					const queryNumber = parts[1] ? Number.parseInt(parts[1], 10) : null;

					if (
						queryPrefix === getEntityPrefix(parent.type) &&
						queryNumber === parent.number
					) {
						return true;
					}
				}

				return false;
			});

			if (!matchesId) {
				return false;
			}
		}

		// Completed/verified filter (test cases use implemented/passing)
		if (
			query.completed !== undefined &&
			testCase.implemented !== query.completed
		) {
			return false;
		}

		if (query.verified !== undefined && testCase.passing !== query.verified) {
			return false;
		}

		return true;
	}

	/**
	 * Apply filters to a criteria
	 */
	private applyCriteriaFilters(
		criterion: Criteria,
		parent: Spec,
		query: Query,
	): boolean {
		// ID filter
		if (query.id !== undefined) {
			const ids = Array.isArray(query.id) ? query.id : [query.id];
			const parentId = formatEntityId({
				type: parent.type,
				number: parent.number,
			});
			const parentFullId = formatEntityId({
				type: parent.type,
				number: parent.number,
				slug: parent.slug,
			});

			const matchesId = ids.some((id) => {
				// Exact match on criterion ID
				if (criterion.id === id || criterion.id.startsWith(id)) {
					return true;
				}

				// Match parent ID
				if (parentId === id || parentFullId === id) {
					return true;
				}

				// Partial prefix matching
				if (id.includes("-")) {
					const parts = id.split("-");
					const queryPrefix = parts[0];
					const queryNumber = parts[1] ? Number.parseInt(parts[1], 10) : null;

					if (
						queryPrefix === getEntityPrefix(parent.type) &&
						queryNumber === parent.number
					) {
						return true;
					}
				}

				return false;
			});

			if (!matchesId) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Convert a spec to a result item
	 */
	private specToResultItem(spec: Spec): SpecResultItem {
		const result: SpecResultItem = {
			resultType: "spec",
			id: formatEntityId({
				type: spec.type,
				number: spec.number,
				slug: spec.slug,
			}),
			type: spec.type,
			name: spec.name,
			slug: spec.slug,
			description: spec.description,
			number: spec.number,
			priority: spec.priority,
			created_at: spec.created_at,
			updated_at: spec.updated_at,
		};

		// Only add status if it's a plan
		if (spec.type === "plan") {
			result.status = getPlanState(spec as Plan);
		}

		return result;
	}

	/**
	 * Convert a task to a result item
	 */
	private taskToResultItem(task: Task, parent: Spec): SubItemResultItem {
		return {
			resultType: "sub-item",
			id: task.id,
			type: "task",
			name: task.task,
			description: task.task,
			parentId: formatEntityId({
				type: parent.type,
				number: parent.number,
				slug: parent.slug,
			}),
			parentType: parent.type,
			parentName: parent.name,
			priority: task.priority,
			status: getTaskState(task.status),
			completed: isCompleted(task.status),
			verified: isVerified(task.status),
			created_at: task.status.created_at,
			updated_at: task.status.started_at || task.status.created_at,
		};
	}

	/**
	 * Convert a test case to a result item
	 */
	private testCaseToResultItem(
		testCase: TestCase,
		parent: Spec,
	): SubItemResultItem {
		return {
			resultType: "sub-item",
			id: testCase.id,
			type: "test-case",
			name: testCase.name,
			description: testCase.description,
			parentId: formatEntityId({
				type: parent.type,
				number: parent.number,
				slug: parent.slug,
			}),
			parentType: parent.type,
			parentName: parent.name,
			completed: testCase.implemented,
			verified: testCase.passing,
			created_at: parent.created_at,
			updated_at: parent.updated_at,
		};
	}

	/**
	 * Convert a criteria to a result item
	 */
	private criterionToResultItem(
		criterion: Criteria,
		parent: Spec,
	): SubItemResultItem {
		return {
			resultType: "sub-item",
			id: criterion.id,
			type: "criteria",
			name: criterion.description,
			description: criterion.rationale,
			parentId: formatEntityId({
				type: parent.type,
				number: parent.number,
				slug: parent.slug,
			}),
			parentType: parent.type,
			parentName: parent.name,
			created_at: parent.created_at,
			updated_at: parent.updated_at,
		};
	}

	/**
	 * Sort results based on order and direction
	 */
	private sortResults(
		items: QueryResultItem[],
		orderBy: string = "created",
		direction: string = "desc",
	): QueryResultItem[] {
		const sorted = [...items];

		sorted.sort((a, b) => {
			let comparison = 0;

			switch (orderBy) {
				case "next-to-do":
					comparison = this.compareNextToDo(a, b);
					break;
				case "created":
					comparison = a.created_at.localeCompare(b.created_at);
					break;
				case "updated":
					comparison = (a.updated_at || a.created_at).localeCompare(
						b.updated_at || b.created_at,
					);
					break;
				default:
					comparison = 0;
			}

			return direction === "asc" ? comparison : -comparison;
		});

		return sorted;
	}

	/**
	 * Compare two items for "next-to-do" ordering
	 * Priority: critical > high > medium > low > nice-to-have
	 * Within same priority, earlier created items come first
	 */
	private compareNextToDo(a: QueryResultItem, b: QueryResultItem): number {
		const priorityOrder: Record<string, number> = {
			critical: 0,
			high: 1,
			medium: 2,
			low: 3,
			"nice-to-have": 4,
		};

		const aPriority = priorityOrder[a.priority || "medium"] ?? 2;
		const bPriority = priorityOrder[b.priority || "medium"] ?? 2;

		if (aPriority !== bPriority) {
			return aPriority - bPriority;
		}

		// Same priority, sort by created date (earlier first)
		return a.created_at.localeCompare(b.created_at);
	}

	/**
	 * Apply text search with fuzzy matching and operators (Feature 1 & 8)
	 * Supports: +required -excluded "exact phrase"
	 */
	private applyTextSearch(
		items: QueryResultItem[],
		searchText: string,
		searchFields: string[] = ["all"],
	): QueryResultItem[] {
		// Parse search query
		const requiredTerms: string[] = [];
		const excludedTerms: string[] = [];
		const exactPhrases: string[] = [];
		let remainingText = searchText;

		// Extract exact phrases
		const phraseRegex = /"([^"]+)"/g;
		let match: RegExpExecArray | null = phraseRegex.exec(searchText);
		while (match !== null) {
			if (match[1]) {
				exactPhrases.push(match[1].toLowerCase());
				remainingText = remainingText.replace(match[0], "");
			}
			match = phraseRegex.exec(searchText);
		}

		// Extract required/excluded terms
		const words = remainingText.split(/\s+/).filter(Boolean);
		for (const word of words) {
			if (word.startsWith("+")) {
				requiredTerms.push(word.slice(1).toLowerCase());
			} else if (word.startsWith("-")) {
				excludedTerms.push(word.slice(1).toLowerCase());
			} else if (word.length > 0) {
				requiredTerms.push(word.toLowerCase());
			}
		}

		return items.filter((item) => {
			// Build searchable text
			let searchableText = "";
			if (searchFields.includes("all") || searchFields.includes("title")) {
				searchableText += ` ${item.name}`;
			}
			if (
				searchFields.includes("all") ||
				searchFields.includes("description")
			) {
				if (item.resultType === "spec") {
					searchableText += ` ${item.description}`;
				} else if (item.description) {
					searchableText += ` ${item.description}`;
				}
			}
			searchableText = searchableText.toLowerCase();

			// Check excluded terms (must not match any)
			for (const term of excludedTerms) {
				if (this.fuzzyMatch(searchableText, term)) {
					return false;
				}
			}

			// Check exact phrases (must match all)
			for (const phrase of exactPhrases) {
				if (!searchableText.includes(phrase)) {
					return false;
				}
			}

			// Check required terms (must match all)
			for (const term of requiredTerms) {
				if (!this.fuzzyMatch(searchableText, term)) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * Fuzzy match with basic Levenshtein-inspired matching
	 * Returns true if term matches text exactly or with small edits
	 */
	private fuzzyMatch(text: string, term: string): boolean {
		// Exact match
		if (text.includes(term)) {
			return true;
		}

		// Fuzzy match - allow for minor typos (1-2 character differences)
		if (term.length < 4) {
			return false; // Don't fuzzy match very short terms
		}

		// Check if term appears with one character difference
		const words = text.split(/\s+/);
		for (const word of words) {
			if (this.levenshteinDistance(word, term) <= 1) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Calculate Levenshtein distance between two strings
	 */
	private levenshteinDistance(a: string, b: string): number {
		if (a.length === 0) return b.length;
		if (b.length === 0) return a.length;

		const matrix: number[][] = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0]![j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i]![j] = matrix[i - 1]![j - 1]!;
				} else {
					matrix[i]![j] = Math.min(
						matrix[i - 1]![j - 1]! + 1, // substitution
						matrix[i]![j - 1]! + 1, // insertion
						matrix[i - 1]![j]! + 1, // deletion
					);
				}
			}
		}

		return matrix[b.length]![a.length]!;
	}

	/**
	 * Apply date range filters (Feature 2)
	 */
	private applyDateRangeFilters(
		items: QueryResultItem[],
		query: Query,
	): QueryResultItem[] {
		return items.filter((item) => {
			// Created after
			if (query.createdAfter) {
				const createdAt = new Date(item.created_at);
				const afterDate = new Date(query.createdAfter);
				if (createdAt < afterDate) {
					return false;
				}
			}

			// Created before
			if (query.createdBefore) {
				const createdAt = new Date(item.created_at);
				const beforeDate = new Date(query.createdBefore);
				if (createdAt > beforeDate) {
					return false;
				}
			}

			// Updated after
			if (query.updatedAfter && item.updated_at) {
				const updatedAt = new Date(item.updated_at);
				const afterDate = new Date(query.updatedAfter);
				if (updatedAt < afterDate) {
					return false;
				}
			}

			// Updated before
			if (query.updatedBefore && item.updated_at) {
				const updatedAt = new Date(item.updated_at);
				const beforeDate = new Date(query.updatedBefore);
				if (updatedAt > beforeDate) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * Apply dependency filters (Feature 3)
	 * Only applicable to tasks
	 */
	private async applyDependencyFilters(
		items: QueryResultItem[],
		dependencyStatuses: string[],
	): Promise<QueryResultItem[]> {
		// Load all plans to check dependencies
		const allPlans = await this.plans.list();

		// Build a map of task ID -> task for quick lookups
		const taskMap = new Map<string, Task>();
		const taskToParentMap = new Map<string, Plan>();

		for (const plan of allPlans) {
			if (plan.tasks) {
				for (const task of plan.tasks) {
					if (isActiveTask(task)) {
						taskMap.set(task.id, task);
						taskToParentMap.set(task.id, plan);
					}
				}
			}
		}

		return items.filter((item) => {
			// Only apply to tasks
			if (item.type !== "task") {
				return true;
			}

			const task = taskMap.get(item.id);
			if (!task) {
				return true;
			}

			const hasDependencies = task.depends_on && task.depends_on.length > 0;
			const isBlocked =
				hasDependencies &&
				task.depends_on.some((depId) => {
					const depTask = taskMap.get(depId);
					return depTask && !isCompleted(depTask.status);
				});

			// Check if other tasks depend on this one
			let isBlocking = false;
			for (const [, otherTask] of taskMap) {
				if (
					otherTask.depends_on?.includes(task.id) &&
					!isCompleted(task.status)
				) {
					isBlocking = true;
					break;
				}
			}

			// Check against requested dependency statuses
			for (const status of dependencyStatuses) {
				switch (status) {
					case "blocked":
						if (isBlocked) return true;
						break;
					case "blocking":
						if (isBlocking) return true;
						break;
					case "no-dependencies":
						if (!hasDependencies) return true;
						break;
					case "has-dependencies":
						if (hasDependencies) return true;
						break;
				}
			}

			return false;
		});
	}

	/**
	 * Calculate statistics for query results (Feature 6)
	 */
	private calculateStats(
		items: QueryResultItem[],
	): import("@spec-mcp/schemas").QueryStats {
		const stats: import("@spec-mcp/schemas").QueryStats = {};

		const byStatus: Record<string, number> = {};
		const byPriority: Record<string, number> = {};
		const byType: Record<string, number> = {};

		let totalCompleted = 0;
		let totalItems = 0;
		let totalAge = 0;

		for (const item of items) {
			// Count by status
			if (item.status) {
				byStatus[item.status] = (byStatus[item.status] || 0) + 1;
			}

			// Count by priority
			if (item.priority) {
				byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
			}

			// Count by type
			byType[item.type] = (byType[item.type] || 0) + 1;

			// Completion rate
			if (item.resultType === "sub-item") {
				totalItems++;
				if (item.completed) {
					totalCompleted++;
				}
			}

			// Average age
			const createdAt = new Date(item.created_at);
			const now = new Date();
			const ageInDays =
				(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
			totalAge += ageInDays;
		}

		// Only add non-empty stats
		if (Object.keys(byStatus).length > 0) {
			stats.byStatus = byStatus as Record<StatusFilter, number>;
		}
		if (Object.keys(byPriority).length > 0) {
			stats.byPriority = byPriority;
		}
		if (Object.keys(byType).length > 0) {
			stats.byType = byType;
		}

		if (totalItems > 0) {
			stats.completionRate = totalCompleted / totalItems;
		}

		if (items.length > 0) {
			stats.averageAge = totalAge / items.length;
		}

		return stats;
	}

	/**
	 * Expand related items (Feature 7)
	 */
	private async expandRelatedItems(
		items: QueryResultItem[],
		relatedTypes: string[],
	): Promise<Record<string, import("@spec-mcp/schemas").RelatedItemRef[]>> {
		const relatedItems: Record<
			string,
			import("@spec-mcp/schemas").RelatedItemRef[]
		> = {};

		// Load all plans for dependency lookups
		const allPlans = await this.plans.list();

		// Build task maps
		const taskMap = new Map<string, Task>();
		const taskToParentMap = new Map<string, Plan>();

		for (const plan of allPlans) {
			if (plan.tasks) {
				for (const task of plan.tasks) {
					if (isActiveTask(task)) {
						taskMap.set(task.id, task);
						taskToParentMap.set(task.id, plan);
					}
				}
			}
		}

		for (const item of items) {
			const refs: import("@spec-mcp/schemas").RelatedItemRef[] = [];

			// For tasks, expand dependencies
			if (item.type === "task" && relatedTypes.includes("dependencies")) {
				const task = taskMap.get(item.id);
				if (task?.depends_on) {
					for (const depId of task.depends_on) {
						const depTask = taskMap.get(depId);
						if (depTask) {
							refs.push({
								id: depId,
								type: "task",
								name: depTask.task,
								relationshipType: "dependency",
							});
						}
					}
				}
			}

			// For tasks, find what they're blocking
			if (item.type === "task" && relatedTypes.includes("blocking")) {
				for (const [otherId, otherTask] of taskMap) {
					if (otherTask.depends_on?.includes(item.id)) {
						refs.push({
							id: otherId,
							type: "task",
							name: otherTask.task,
							relationshipType: "blocking",
						});
					}
				}
			}

			// For specs, find linked specs (milestones, references, etc.)
			if (item.resultType === "spec" && relatedTypes.includes("linked-specs")) {
				// This would require loading the full spec and checking references
				// For now, we'll leave this as a placeholder for future implementation
			}

			if (refs.length > 0) {
				relatedItems[item.id] = refs;
			}
		}

		return relatedItems;
	}

	/**
	 * Determine which spec types contain the requested item types
	 */
	private getSpecTypesForItemTypes(itemTypes: ItemType[]): EntityType[] {
		const specTypes = new Set<EntityType>();

		for (const itemType of itemTypes) {
			switch (itemType) {
				case "task":
				case "test-case":
				case "flow":
				case "api-contract":
				case "data-model":
					specTypes.add("plan");
					break;
				case "criteria":
					specTypes.add("business-requirement");
					specTypes.add("technical-requirement");
					break;
				case "user-story":
					specTypes.add("business-requirement");
					break;
			}
		}

		return Array.from(specTypes);
	}
}

type Spec =
	| BusinessRequirement
	| TechnicalRequirement
	| Plan
	| Component
	| Constitution
	| Decision
	| Milestone;
