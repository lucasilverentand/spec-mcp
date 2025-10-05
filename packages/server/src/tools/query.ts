import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config/index.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { AnyEntity, Plan, Requirement } from "@spec-mcp/data";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";

// ============================================================================
// SCHEMAS
// ============================================================================

const RequirementFiltersSchema = z.object({
	requirement_priority: z
		.array(z.enum(["critical", "required", "ideal", "optional"]))
		.optional()
		.describe("Filter by requirement priority levels"),
	requirement_completed: z
		.boolean()
		.optional()
		.describe("Filter by completion status (all criteria completed)"),
});

const PlanFiltersSchema = z.object({
	plan_priority: z
		.array(z.enum(["critical", "high", "medium", "low"]))
		.optional()
		.describe("Filter by plan priority levels"),
	plan_completed: z
		.boolean()
		.optional()
		.describe("Filter by plan completion status"),
	plan_approved: z
		.boolean()
		.optional()
		.describe("Filter by plan approval status"),
	has_criteria_id: z
		.boolean()
		.optional()
		.describe("Filter plans that are linked to requirement criteria"),
	criteria_id: z
		.string()
		.optional()
		.describe("Filter plans by specific criteria ID (e.g., 'req-001-user-auth/crit-001')"),
});

const ComponentFiltersSchema = z.object({
	component_type: z
		.array(z.enum(["app", "service", "library"]))
		.optional()
		.describe("Filter by component type"),
	folder: z.string().optional().describe("Filter by folder path (supports hierarchy - matches folder and all subfolders)"),
});

const ConstitutionFiltersSchema = z.object({
	constitution_status: z
		.array(z.enum(["draft", "active", "archived"]))
		.optional()
		.describe("Filter by constitution status"),
	applies_to: z
		.array(
			z.enum([
				"all",
				"requirements",
				"components",
				"plans",
				"architecture",
				"testing",
			]),
		)
		.optional()
		.describe("Filter by applies_to scope"),
});

const DateFiltersSchema = z.object({
	created_after: z
		.string()
		.datetime()
		.optional()
		.describe("Filter entities created after this date (ISO datetime)"),
	created_before: z
		.string()
		.datetime()
		.optional()
		.describe("Filter entities created before this date (ISO datetime)"),
	updated_after: z
		.string()
		.datetime()
		.optional()
		.describe("Filter entities updated after this date (ISO datetime)"),
	updated_before: z
		.string()
		.datetime()
		.optional()
		.describe("Filter entities updated before this date (ISO datetime)"),
});

const AnalysisFiltersSchema = z.object({
	orphaned: z
		.boolean()
		.optional()
		.describe("Filter to only orphaned entities (no references)"),
	uncovered: z
		.boolean()
		.optional()
		.describe("Filter to only uncovered entities (requirements without plans, etc)"),
});

const FiltersSchema = RequirementFiltersSchema.merge(PlanFiltersSchema)
	.merge(ComponentFiltersSchema)
	.merge(ConstitutionFiltersSchema)
	.merge(DateFiltersSchema)
	.merge(AnalysisFiltersSchema);

const SortCriteriaSchema = z.object({
	field: z.enum([
		"relevance",
		"created_at",
		"updated_at",
		"priority",
		"name",
		"type",
	]),
	order: z.enum(["asc", "desc"]),
});

const ExpansionSchema = z.object({
	dependencies: z
		.boolean()
		.optional()
		.describe("Include full dependency entities"),
	references: z
		.boolean()
		.optional()
		.describe("Include referenced entities"),
	parent: z
		.boolean()
		.optional()
		.describe("For sub-entities, include full parent entity"),
	depth: z
		.number()
		.int()
		.min(1)
		.max(3)
		.optional()
		.describe("Max dependency traversal depth (1-3)"),
	dependency_metrics: z
		.boolean()
		.optional()
		.describe("Include dependency metrics (fan-in, fan-out, coupling, stability)"),
});

type Filters = z.infer<typeof FiltersSchema>;
type SortCriteria = z.infer<typeof SortCriteriaSchema>;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
	const m = str1.length;
	const n = str2.length;
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) {
		const row = dp[i];
		if (row) row[0] = i;
	}
	for (let j = 0; j <= n; j++) {
		const firstRow = dp[0];
		if (firstRow) firstRow[j] = j;
	}

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const currentRow = dp[i];
			const prevRow = dp[i - 1];
			if (currentRow && prevRow) {
				if (str1[i - 1] === str2[j - 1]) {
					currentRow[j] = prevRow[j - 1] ?? 0;
				} else {
					currentRow[j] =
						Math.min(
							prevRow[j] ?? Number.MAX_SAFE_INTEGER,
							currentRow[j - 1] ?? Number.MAX_SAFE_INTEGER,
							prevRow[j - 1] ?? Number.MAX_SAFE_INTEGER,
						) + 1;
				}
			}
		}
	}

	const lastRow = dp[m];
	return lastRow?.[n] ?? 0;
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[\s\-_.,;:!?()[\]{}]+/)
		.filter((token) => token.length > 0);
}

/**
 * Check fuzzy match
 */
function fuzzyMatch(
	text: string,
	query: string,
	maxDistance: number = 2,
): boolean {
	const textTokens = tokenize(text);
	const queryTokens = tokenize(query);

	for (const queryToken of queryTokens) {
		let found = false;
		for (const textToken of textTokens) {
			const distance = levenshteinDistance(queryToken, textToken);
			if (distance <= maxDistance) {
				found = true;
				break;
			}
		}
		if (!found) return false;
	}
	return true;
}

/**
 * Highlight matched text
 */
function highlightMatches(text: string, query: string): string {
	if (!query) return text;
	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(escapedQuery, "gi");
	return text.replace(regex, (match) => `<mark>${match}</mark>`);
}

/**
 * Detect entity type from ID
 */
function detectEntityType(
	entityId: string,
): "requirement" | "plan" | "component" | "constitution" | null {
	if (/^req-\d{3}-.+$/.test(entityId)) return "requirement";
	if (/^pln-\d{3}-.+$/.test(entityId)) return "plan";
	if (/^(app|svc|lib)-\d{3}-.+$/.test(entityId)) return "component";
	if (/^con-\d{3}-.+$/.test(entityId)) return "constitution";
	return null;
}

/**
 * Detect sub-entity type from ID (supports both short and full path formats)
 */
function detectSubEntityType(
	subEntityId: string,
):
	| "task"
	| "test_case"
	| "flow"
	| "api_contract"
	| "data_model"
	| "criteria"
	| null {
	// Extract just the sub-entity part if full path is provided
	const parts = subEntityId.split("/");
	const actualSubId = parts.length > 1 ? parts[parts.length - 1] : subEntityId;

	if (!actualSubId) return null;

	// Check patterns
	if (/^task-\d{3}$/.test(actualSubId)) return "task";
	if (/^tc-\d{3}$/.test(actualSubId)) return "test_case";
	if (/^flow-\d{3}$/.test(actualSubId)) return "flow";
	if (/^api-\d{3}$/.test(actualSubId)) return "api_contract";
	if (/^dm-\d{3}$/.test(actualSubId)) return "data_model";
	if (/^crit-\d{3}$/.test(actualSubId)) return "criteria";

	// Also support full criteria format
	if (/^req-\d{3}-.+\/crit-\d{3}$/.test(subEntityId)) return "criteria";

	return null;
}

/**
 * Get orphaned entities
 */
async function getOrphanedEntities(operations: SpecOperations): Promise<Set<string>> {
	const orphanResult = await operations.detectOrphans();
	if (!orphanResult.success || !orphanResult.data) {
		return new Set();
	}
	return new Set(orphanResult.data.orphans);
}

/**
 * Get uncovered entities
 */
async function getUncoveredEntities(operations: SpecOperations): Promise<Set<string>> {
	const coverageResult = await operations.analyzeCoverage();
	if (!coverageResult.success || !coverageResult.data) {
		return new Set();
	}
	return new Set(coverageResult.data.report.uncoveredSpecs);
}

/**
 * Expand dependencies recursively
 */
async function expandDependencies(
	entity: AnyEntity,
	operations: SpecOperations,
	depth: number = 1,
	visited: Set<string> = new Set(),
): Promise<AnyEntity[]> {
	if (depth <= 0 || visited.has(entity.id)) return [];
	visited.add(entity.id);

	const dependencies: AnyEntity[] = [];
	let depIds: string[] = [];

	// Get dependency IDs based on entity type
	if (entity.type === "plan") {
		const plan = entity as Plan;
		depIds = plan.depends_on || [];
	}

	// Fetch dependency entities
	for (const depId of depIds) {
		const type = detectEntityType(depId);
		if (!type) continue;

		let depEntity: AnyEntity | null = null;

		switch (type) {
			case "requirement": {
				const result = await operations.getRequirement(depId);
				if (result.success && result.data) depEntity = result.data;
				break;
			}
			case "plan": {
				const result = await operations.getPlan(depId);
				if (result.success && result.data) depEntity = result.data;
				break;
			}
			case "component": {
				const result = await operations.getComponent(depId);
				if (result.success && result.data) depEntity = result.data;
				break;
			}
		}

		if (depEntity) {
			dependencies.push(depEntity);

			// Recursively expand
			if (depth > 1) {
				const subDeps = await expandDependencies(
					depEntity,
					operations,
					depth - 1,
					visited,
				);
				dependencies.push(...subDeps);
			}
		}
	}

	return dependencies;
}

/**
 * Calculate dependency metrics
 */
async function calculateDependencyMetrics(
	entity: AnyEntity,
	allEntities: AnyEntity[],
): Promise<{
	fan_in: number;
	fan_out: number;
	coupling: number;
	stability: number;
}> {
	// Fan-out: number of entities this entity depends on
	let fanOut = 0;
	if (entity.type === "plan") {
		const plan = entity as Plan;
		fanOut = (plan.depends_on || []).length;
	}

	// Fan-in: number of entities that depend on this entity
	let fanIn = 0;
	for (const other of allEntities) {
		if (other.type === "plan") {
			const plan = other as Plan;
			if (plan.depends_on && plan.depends_on.includes(entity.id)) {
				fanIn++;
			}
		}
	}

	// Coupling: total dependencies
	const coupling = fanIn + fanOut;

	// Stability: fan-out / (fan-in + fan-out)
	// 0 = maximally stable (no dependencies, many dependents)
	// 1 = maximally unstable (many dependencies, no dependents)
	const stability = coupling === 0 ? 0 : fanOut / coupling;

	return {
		fan_in: fanIn,
		fan_out: fanOut,
		coupling,
		stability: Math.round(stability * 100) / 100,
	};
}

/**
 * Find references to entity
 */
async function findReferences(
	entity: AnyEntity,
	operations: SpecOperations,
): Promise<AnyEntity[]> {
	const references: AnyEntity[] = [];
	const entitiesResult = await operations.getAllEntities();

	if (!entitiesResult.success || !entitiesResult.data) {
		return references;
	}

	const { requirements, plans, components } = entitiesResult.data;
	const allEntities: AnyEntity[] = [...requirements, ...plans, ...components];

	for (const other of allEntities) {
		if (other.id === entity.id) continue;

		// Check if this entity references our entity
		let hasReference = false;

		// Check plan dependencies
		if (other.type === "plan") {
			const plan = other as Plan;
			if (plan.depends_on && plan.depends_on.includes(entity.id)) {
				hasReference = true;
			}

			// Check criteria_id for requirements
			if (entity.type === "requirement" && plan.criteria_id?.startsWith(entity.id)) {
				hasReference = true;
			}
		}

		if (hasReference) {
			references.push(other);
		}
	}

	return references;
}

/**
 * Apply filters to entities
 */
function applyFilters(entities: AnyEntity[], filters: Filters): AnyEntity[] {
	return entities.filter((entity) => {
		// Date filters
		if (filters.created_after && entity.created_at < filters.created_after)
			return false;
		if (filters.created_before && entity.created_at > filters.created_before)
			return false;
		if (filters.updated_after && entity.updated_at < filters.updated_after)
			return false;
		if (filters.updated_before && entity.updated_at > filters.updated_before)
			return false;

		// Requirement filters
		if (entity.type === "requirement") {
			const req = entity as Requirement;
			if (
				filters.requirement_priority &&
				!filters.requirement_priority.includes(req.priority)
			)
				return false;
			if (
				filters.requirement_completed !== undefined &&
				req.criteria.every((c) => "completed" in c && c.completed) !==
					filters.requirement_completed
			)
				return false;
		}

		// Plan filters
		if (entity.type === "plan") {
			const plan = entity as Plan;
			if (
				filters.plan_priority &&
				!filters.plan_priority.includes(plan.priority)
			)
				return false;
			if (
				filters.plan_completed !== undefined &&
				plan.completed !== filters.plan_completed
			)
				return false;
			if (
				filters.plan_approved !== undefined &&
				plan.approved !== filters.plan_approved
			)
				return false;
			if (
				filters.has_criteria_id !== undefined &&
				(!!plan.criteria_id) !== filters.has_criteria_id
			)
				return false;
			if (
				filters.criteria_id !== undefined &&
				plan.criteria_id !== filters.criteria_id
			)
				return false;
		}

		// Component filters
		if (["app", "service", "library"].includes(entity.type)) {
			if (
				filters.component_type &&
				!filters.component_type.includes(
					entity.type as "app" | "service" | "library",
				)
			)
				return false;
			if (
				filters.folder &&
				"folder" in entity &&
				typeof entity.folder === "string"
			) {
				// Support folder hierarchy filtering
				const entityFolder = entity.folder;
				const filterFolder = filters.folder;

				// Exact match or parent folder match
				if (entityFolder !== filterFolder && !entityFolder.startsWith(filterFolder + "/")) {
					return false;
				}
			}
		}

		// Constitution filters - constitutions don't have status or applies_to at entity level
		// These filters would need to be applied to articles within constitutions
		if (entity.type === "constitution") {
			// Constitution-specific filtering could be added here if needed
			// Currently constitutions are filtered by base fields (name, description, etc.)
		}

		return true;
	});
}

interface SearchMatch {
	field: string;
	highlights: string[];
}

interface SearchResult {
	id: string;
	type: string;
	name: string;
	description: string;
	score: number;
	matches: SearchMatch[];
	priority?: string;
	status?: string;
	created_at: string;
	updated_at: string;
}

/**
 * Get searchable text from sub-entities
 */
function getSubEntitySearchText(entity: AnyEntity): string {
	const texts: string[] = [];

	// Extract text from plans
	if (entity.type === "plan") {
		const plan = entity as Plan;

		// Tasks
		if (plan.tasks) {
			for (const task of plan.tasks) {
				texts.push(task.description);
				if (task.considerations) {
					texts.push(...task.considerations);
				}
			}
		}

		// Test cases
		if (plan.test_cases) {
			for (const tc of plan.test_cases) {
				texts.push(tc.name, tc.description);
				if (tc.steps) {
					texts.push(...tc.steps);
				}
				if (tc.expected_result) {
					texts.push(tc.expected_result);
				}
			}
		}

		// Flows
		if (plan.flows) {
			for (const flow of plan.flows) {
				texts.push(flow.name);
				if (flow.description) texts.push(flow.description);
				if (flow.steps) {
					for (const step of flow.steps) {
						if (step.description) texts.push(step.description);
					}
				}
			}
		}

		// API Contracts
		if (plan.api_contracts) {
			for (const api of plan.api_contracts) {
				texts.push(api.name, api.description);
			}
		}

		// Data Models
		if (plan.data_models) {
			for (const dm of plan.data_models) {
				texts.push(dm.name, dm.description);
			}
		}
	}

	// Extract text from requirements
	if (entity.type === "requirement") {
		const req = entity as Requirement;
		if (req.criteria) {
			for (const crit of req.criteria) {
				texts.push(crit.description);
			}
		}
	}

	// Extract text from constitutions
	if (entity.type === "constitution") {
		const con = entity as { articles?: Array<{ title: string; principle: string; rationale: string }> };
		if (con.articles) {
			for (const article of con.articles) {
				texts.push(article.title, article.principle, article.rationale);
			}
		}
	}

	return texts.join(" ");
}

/**
 * Search entity
 */
function searchEntity(
	entity: AnyEntity,
	query: string,
	fields: string[],
	fuzzy: boolean,
): SearchResult | null {
	const matches: SearchMatch[] = [];
	let score = 0;
	const searchQuery = query.toLowerCase();
	const queryTokens = tokenize(query);

	for (const field of fields) {
		const value = (entity as Record<string, unknown>)[field];
		if (typeof value !== "string") continue;

		const fieldText = value.toLowerCase();
		const fieldTokens = tokenize(fieldText);
		let hasMatch = false;
		const highlights: string[] = [];

		// Exact substring matching (highest score)
		if (fieldText.includes(searchQuery)) {
			hasMatch = true;
			highlights.push(highlightMatches(value, query));
			const position = fieldText.indexOf(searchQuery);
			const positionWeight = 1 - position / fieldText.length;
			score += 2 + positionWeight; // Higher score for exact phrase match
		}
		// Fuzzy matching (medium-high score)
		else if (fuzzy && fuzzyMatch(fieldText, searchQuery, 2)) {
			hasMatch = true;
			highlights.push(highlightMatches(value, query));
			score += 1;
		}
		// Token matching - all tokens must be present (medium score)
		else {
			let allTokensFound = true;
			const matchedTokens: string[] = [];

			for (const queryToken of queryTokens) {
				let tokenFound = false;

				// Check if any field token contains the query token
				for (const fieldToken of fieldTokens) {
					if (fieldToken.includes(queryToken)) {
						tokenFound = true;
						matchedTokens.push(queryToken);
						break;
					}
				}

				// Also check fuzzy match for tokens if enabled
				if (!tokenFound && fuzzy) {
					for (const fieldToken of fieldTokens) {
						if (levenshteinDistance(queryToken, fieldToken) <= 2) {
							tokenFound = true;
							matchedTokens.push(queryToken);
							break;
						}
					}
				}

				if (!tokenFound) {
					allTokensFound = false;
					break;
				}
			}

			if (allTokensFound && queryTokens.length > 0) {
				hasMatch = true;
				highlights.push(`Matched tokens: ${matchedTokens.join(", ")}`);
				// Score based on number of tokens matched
				score += 0.5 * queryTokens.length;
			}
		}

		if (hasMatch) {
			matches.push({ field, highlights });
		}
	}

	// Search sub-entity content (lower weight)
	const subEntityText = getSubEntitySearchText(entity);
	if (subEntityText) {
		const subEntityTextLower = subEntityText.toLowerCase();
		const subEntityTokens = tokenize(subEntityTextLower);

		// Exact substring matching in sub-entities
		if (subEntityTextLower.includes(searchQuery)) {
			score += 0.6; // Lower weight than direct fields
			matches.push({
				field: "sub_entities",
				highlights: ["Matched exact phrase in tasks, test cases, or other sub-entities"],
			});
		}
		// Fuzzy matching in sub-entities
		else if (fuzzy && fuzzyMatch(subEntityTextLower, searchQuery, 2)) {
			score += 0.3;
			matches.push({
				field: "sub_entities",
				highlights: ["Fuzzy matched phrase in tasks, test cases, or other sub-entities"],
			});
		}
		// Token matching in sub-entities
		else {
			let allTokensFound = true;

			for (const queryToken of queryTokens) {
				let tokenFound = false;

				for (const subToken of subEntityTokens) {
					if (subToken.includes(queryToken)) {
						tokenFound = true;
						break;
					}
				}

				if (!tokenFound && fuzzy) {
					for (const subToken of subEntityTokens) {
						if (levenshteinDistance(queryToken, subToken) <= 2) {
							tokenFound = true;
							break;
						}
					}
				}

				if (!tokenFound) {
					allTokensFound = false;
					break;
				}
			}

			if (allTokensFound && queryTokens.length > 0) {
				score += 0.2 * queryTokens.length;
				matches.push({
					field: "sub_entities",
					highlights: ["Matched tokens in tasks, test cases, or other sub-entities"],
				});
			}
		}
	}

	if (matches.length === 0) return null;

	// Boost name matches
	if (matches.find((m) => m.field === "name")) score *= 1.5;

	const result: SearchResult = {
		id: entity.id,
		type: entity.type,
		name: entity.name,
		description: entity.description,
		score: Math.round(score * 100) / 100,
		matches,
		created_at: entity.created_at,
		updated_at: entity.updated_at,
	};

	if ("priority" in entity) result.priority = (entity as Requirement).priority;
	if ("completed" in entity)
		result.status = (entity as Plan).completed ? "completed" : "in-progress";

	return result;
}

/**
 * Apply sorting
 */
function applySorting(
	results: SearchResult[],
	sortBy: SortCriteria[],
): SearchResult[] {
	return [...results].sort((a, b) => {
		for (const sort of sortBy) {
			let comparison = 0;

			switch (sort.field) {
				case "relevance":
					comparison = b.score - a.score;
					break;
				case "created_at":
					comparison =
						new Date(a.created_at).getTime() -
						new Date(b.created_at).getTime();
					break;
				case "updated_at":
					comparison =
						new Date(a.updated_at).getTime() -
						new Date(b.updated_at).getTime();
					break;
				case "priority": {
					const priorityOrder: Record<string, number> = {
						critical: 0,
						required: 1,
						high: 1,
						ideal: 2,
						medium: 2,
						optional: 3,
						low: 3,
					};
					const aPriority = priorityOrder[a.priority || ""] ?? 99;
					const bPriority = priorityOrder[b.priority || ""] ?? 99;
					comparison = aPriority - bPriority;
					break;
				}
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "type":
					comparison = a.type.localeCompare(b.type);
					break;
			}

			if (comparison !== 0) {
				return sort.order === "asc" ? comparison : -comparison;
			}
		}
		return 0;
	});
}

/**
 * Project to summary mode
 */
function projectToSummary(entity: AnyEntity): Partial<AnyEntity> {
	const summary: Partial<AnyEntity> = {
		id: entity.id,
		type: entity.type,
		name: entity.name,
		description: entity.description,
		created_at: entity.created_at,
		updated_at: entity.updated_at,
	};

	if ("priority" in entity) (summary as { priority: string }).priority = (entity as { priority: string }).priority;
	if ("completed" in entity)
		(summary as { status: string }).status = (entity as Plan).completed
			? "completed"
			: "in-progress";

	return summary;
}

/**
 * Project to custom mode with include/exclude fields
 */
function projectToCustom(
	entity: AnyEntity,
	includeFields?: string[],
	excludeFields?: string[],
): Partial<AnyEntity> {
	const entityObj = entity as Record<string, unknown>;
	const result: Record<string, unknown> = {};

	if (includeFields && includeFields.length > 0) {
		// Include only specified fields
		for (const field of includeFields) {
			if (field in entityObj) {
				result[field] = entityObj[field];
			}
		}
	} else if (excludeFields && excludeFields.length > 0) {
		// Include all except excluded fields
		for (const [key, value] of Object.entries(entityObj)) {
			if (!excludeFields.includes(key)) {
				result[key] = value;
			}
		}
	} else {
		// No filtering, return all fields
		return entity;
	}

	return result as Partial<AnyEntity>;
}

/**
 * Calculate facets
 */
function calculateFacets(
	results: SearchResult[],
	facetFields?: ("type" | "priority" | "status" | "folder")[],
): Record<string, Record<string, number>> {
	if (!facetFields || facetFields.length === 0) return {};

	const facets: Record<string, Record<string, number>> = {};

	for (const field of facetFields) {
		facets[field] = {};
		for (const result of results) {
			const value = String(
				(result as unknown as Record<string, unknown>)[field] || "unknown",
			);
			facets[field][value] = (facets[field][value] || 0) + 1;
		}
	}

	return facets;
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Handle entity ID lookup
 */
async function handleEntityIdLookup(
	entityId: string,
	operations: SpecOperations,
	expand?: {
		dependencies?: boolean;
		references?: boolean;
		depth?: number;
		dependency_metrics?: boolean;
	},
): Promise<ReturnType<typeof formatResult>> {
	const type = detectEntityType(entityId);

	if (!type) {
		return formatResult({
			success: false,
			error: `Invalid entity ID format: ${entityId}`,
		});
	}

	let entity: AnyEntity | null = null;

	switch (type) {
		case "requirement": {
			const result = await operations.getRequirement(entityId);
			if (result.success && result.data) entity = result.data;
			else return formatResult(result);
			break;
		}
		case "plan": {
			const result = await operations.getPlan(entityId);
			if (result.success && result.data) entity = result.data;
			else return formatResult(result);
			break;
		}
		case "component": {
			const result = await operations.getComponent(entityId);
			if (result.success && result.data) entity = result.data;
			else return formatResult(result);
			break;
		}
		case "constitution": {
			const result = await operations.getConstitution(entityId);
			if (result.success && result.data) entity = result.data;
			else return formatResult(result);
			break;
		}
	}

	if (!entity) {
		return formatResult({
			success: false,
			error: `Entity '${entityId}' not found`,
		});
	}

	// Build response with expansions
	const response: Record<string, unknown> = { ...entity };

	if (expand) {
		if (expand.dependencies) {
			const depth = expand.depth || 1;
			const deps = await expandDependencies(entity, operations, depth);
			response._expanded_dependencies = deps;
		}

		if (expand.references) {
			const refs = await findReferences(entity, operations);
			response._expanded_references = refs;
		}

		if (expand.dependency_metrics) {
			const entitiesResult = await operations.getAllEntities();
			if (entitiesResult.success && entitiesResult.data) {
				const allEntities = [
					...entitiesResult.data.requirements,
					...entitiesResult.data.plans,
					...entitiesResult.data.components,
				];
				const metrics = await calculateDependencyMetrics(entity, allEntities);
				response._dependency_metrics = metrics;
			}
		}
	}

	return formatResult({
		success: true,
		data: response,
	});
}

/**
 * Handle batch entity lookup
 */
async function handleBatchLookup(
	entityIds: string[],
	operations: SpecOperations,
): Promise<ReturnType<typeof formatResult>> {
	const results = await Promise.all(
		entityIds.map((id) => handleEntityIdLookup(id, operations)),
	);

	return formatResult({
		success: true,
		data: {
			total: entityIds.length,
			results: results.map((r, i) => {
				const content = r.content[0];
				const data =
					content && "text" in content
						? JSON.parse(content.text as string)
						: null;
				return {
					requested_id: entityIds[i],
					found: !r.isError,
					entity: data?.data || null,
					error: r.isError ? data?.error : null,
				};
			}),
		},
	});
}

/**
 * Handle sub-entity lookup
 */
async function handleSubEntityLookup(
	subEntityId: string,
	parentPlanId: string | undefined,
	expandParent: boolean,
	operations: SpecOperations,
): Promise<ReturnType<typeof formatResult>> {
	// Parse full path format (e.g., "pln-001-auth-impl/task-001")
	let actualSubEntityId = subEntityId;
	let actualParentId = parentPlanId;

	const pathParts = subEntityId.split("/");
	if (pathParts.length === 2) {
		// Full path format provided
		actualParentId = pathParts[0];
		actualSubEntityId = pathParts[1] || "";
	}

	const subEntityType = detectSubEntityType(subEntityId);

	if (!subEntityType) {
		return formatResult({
			success: false,
			error: `Invalid sub-entity ID format: ${subEntityId}`,
		});
	}

	// Handle criteria lookup
	if (subEntityType === "criteria") {
		let reqId: string | undefined;
		let critId: string;

		// Parse criteria ID format
		if (subEntityId.includes("/")) {
			const parts = subEntityId.split("/");
			if (parts.length >= 2) {
				// Could be "req-001-auth/crit-001" or "pln-001-auth/req-001-auth/crit-001"
				// Find the requirement ID (starts with "req-")
				const reqPart = parts.find((p) => p.startsWith("req-"));
				if (reqPart) {
					reqId = reqPart;
					critId = parts[parts.length - 1] || "";
				} else {
					return formatResult({
						success: false,
						error: `Invalid criteria ID format: ${subEntityId}`,
					});
				}
			} else {
				return formatResult({
					success: false,
					error: `Invalid criteria ID format: ${subEntityId}`,
				});
			}
		} else {
			// Just "crit-001" format - need to search all requirements
			critId = subEntityId;
		}

		// If we have a requirement ID, look it up directly
		if (reqId) {
			const reqResult = await operations.getRequirement(reqId);

			if (!reqResult.success || !reqResult.data) {
				return formatResult(reqResult);
			}

			const criteria = reqResult.data.criteria.find((c) => c.id === critId);

			if (!criteria) {
				return formatResult({
					success: false,
					error: `Criteria '${critId}' not found in requirement '${reqId}'`,
				});
			}

			return formatResult({
				success: true,
				data: {
					type: "acceptance_criteria",
					parent_requirement: expandParent
						? reqResult.data
						: {
								id: reqResult.data.id,
								name: reqResult.data.name,
								slug: reqResult.data.slug,
							},
					...criteria,
				},
			});
		} else {
			// Search all requirements for the criteria
			const reqsResult = await operations.listRequirements();
			if (!reqsResult.success || !reqsResult.data) {
				return formatResult(reqsResult);
			}

			for (const req of reqsResult.data) {
				const criteria = req.criteria.find((c) => c.id === critId);
				if (criteria) {
					return formatResult({
						success: true,
						data: {
							type: "acceptance_criteria",
							parent_requirement: expandParent
								? req
								: {
										id: req.id,
										name: req.name,
										slug: req.slug,
									},
							...criteria,
						},
					});
				}
			}

			return formatResult({
				success: false,
				error: `Criteria '${critId}' not found`,
			});
		}
	}

	// Handle plan sub-entities
	let plans: Plan[];

	if (actualParentId) {
		const planResult = await operations.getPlan(actualParentId);
		plans = planResult.success && planResult.data ? [planResult.data] : [];
	} else {
		const plansResult = await operations.listPlans();
		plans = plansResult.success && plansResult.data ? plansResult.data : [];
	}

	for (const plan of plans) {
		let subEntity: unknown;

		switch (subEntityType) {
			case "task":
				subEntity = plan.tasks?.find((t) => t.id === actualSubEntityId);
				break;
			case "test_case":
				subEntity = plan.test_cases?.find((tc) => tc.id === actualSubEntityId);
				break;
			case "flow":
				subEntity = plan.flows?.find((f) => f.id === actualSubEntityId);
				break;
			case "api_contract":
				subEntity = plan.api_contracts?.find((ac) => ac.id === actualSubEntityId);
				break;
			case "data_model":
				subEntity = plan.data_models?.find((dm) => dm.id === actualSubEntityId);
				break;
		}

		if (subEntity) {
			return formatResult({
				success: true,
				data: {
					type: subEntityType,
					parent_plan: expandParent
						? plan
						: {
								id: plan.id,
								name: plan.name,
								slug: plan.slug,
							},
					...subEntity,
				},
			});
		}
	}

	return formatResult({
		success: false,
		error: `Sub-entity '${actualSubEntityId}' not found`,
	});
}

/**
 * Handle text search
 */
async function handleSearch(
	searchTerms: string,
	searchFields: string[],
	fuzzy: boolean,
	types: string[] | undefined,
	filters: Filters | undefined,
	sortBy: SortCriteria[],
	limit: number,
	offset: number,
	returnAll: boolean,
	includeFacets: boolean,
	facetFields: ("type" | "priority" | "status" | "folder")[] | undefined,
	mode: "summary" | "full" | "custom" | undefined,
	includeFields: string[] | undefined,
	excludeFields: string[] | undefined,
	operations: SpecOperations,
): Promise<ReturnType<typeof formatResult>> {
	const entitiesResult = await operations.getAllEntities();
	if (!entitiesResult.success || !entitiesResult.data) {
		return formatResult(entitiesResult);
	}

	const { requirements, plans, components, constitutions } = entitiesResult.data;
	let allEntities: AnyEntity[] = [...requirements, ...plans, ...components, ...constitutions];

	// Apply type filter
	if (types && types.length > 0) {
		allEntities = allEntities.filter((e) => types.includes(e.type));
	}

	// Apply filters
	if (filters) {
		allEntities = applyFilters(allEntities, filters);

		// Apply orphaned filter
		if (filters.orphaned) {
			const orphanedIds = await getOrphanedEntities(operations);
			allEntities = allEntities.filter((e) => orphanedIds.has(e.id));
		}

		// Apply uncovered filter
		if (filters.uncovered) {
			const uncoveredIds = await getUncoveredEntities(operations);
			allEntities = allEntities.filter((e) => uncoveredIds.has(e.id));
		}
	}

	// Search
	const results: SearchResult[] = [];
	for (const entity of allEntities) {
		const result = searchEntity(entity, searchTerms, searchFields, fuzzy);
		if (result) results.push(result);
	}

	// Sort
	const sorted = applySorting(results, sortBy);

	// Calculate facets before pagination
	let facets = null;
	if (includeFacets) {
		facets = calculateFacets(sorted, facetFields);
	}

	// Paginate (or return all)
	const total = sorted.length;
	const paginated = returnAll ? sorted : sorted.slice(offset, offset + limit);

	// Apply mode
	let projected: (Partial<AnyEntity> | SearchResult)[];
	if (mode === "summary") {
		projected = paginated.map((r) => projectToSummary(r as unknown as AnyEntity));
	} else if (mode === "custom") {
		projected = paginated.map((r) => projectToCustom(r as unknown as AnyEntity, includeFields, excludeFields));
	} else {
		projected = paginated;
	}

	return formatResult({
		success: true,
		data: {
			query: searchTerms,
			query_type: "search",
			total_results: total,
			returned_count: projected.length,
			results: projected,
			pagination: returnAll
				? {
						return_all: true,
						total: total,
					}
				: {
						limit,
						offset,
						total: total,
						has_more: offset + limit < total,
						next_offset: offset + limit < total ? offset + limit : null,
						prev_offset: offset > 0 ? Math.max(0, offset - limit) : null,
					},
			...(facets && { facets }),
		},
	});
}

/**
 * Handle filtered list (no search terms)
 */
async function handleFilteredList(
	types: string[] | undefined,
	filters: Filters | undefined,
	sortBy: SortCriteria[],
	limit: number,
	offset: number,
	returnAll: boolean,
	includeFacets: boolean,
	facetFields: ("type" | "priority" | "status" | "folder")[] | undefined,
	mode: "summary" | "full" | "custom" | undefined,
	includeFields: string[] | undefined,
	excludeFields: string[] | undefined,
	operations: SpecOperations,
): Promise<ReturnType<typeof formatResult>> {
	const entitiesResult = await operations.getAllEntities();
	if (!entitiesResult.success || !entitiesResult.data) {
		return formatResult(entitiesResult);
	}

	const { requirements, plans, components, constitutions } = entitiesResult.data;
	let allEntities: AnyEntity[] = [...requirements, ...plans, ...components, ...constitutions];

	// Apply type filter
	if (types && types.length > 0) {
		allEntities = allEntities.filter((e) => types.includes(e.type));
	}

	// Apply filters
	if (filters) {
		allEntities = applyFilters(allEntities, filters);

		// Apply orphaned filter
		if (filters.orphaned) {
			const orphanedIds = await getOrphanedEntities(operations);
			allEntities = allEntities.filter((e) => orphanedIds.has(e.id));
		}

		// Apply uncovered filter
		if (filters.uncovered) {
			const uncoveredIds = await getUncoveredEntities(operations);
			allEntities = allEntities.filter((e) => uncoveredIds.has(e.id));
		}
	}

	// Convert to SearchResult format for sorting
	const asResults: SearchResult[] = allEntities.map((e) => {
		const result: SearchResult = {
			id: e.id,
			type: e.type,
			name: e.name,
			description: e.description,
			score: 0,
			matches: [],
			created_at: e.created_at,
			updated_at: e.updated_at,
		};
		if ("priority" in e) {
			result.priority = (e as { priority: string }).priority;
		}
		if ("completed" in e) {
			result.status = (e as Plan).completed ? "completed" : "in-progress";
		}
		return result;
	});

	// Sort
	const sorted = applySorting(asResults, sortBy);

	// Calculate facets before pagination
	let facets = null;
	if (includeFacets) {
		facets = calculateFacets(sorted, facetFields);
	}

	// Paginate (or return all)
	const total = sorted.length;
	const paginated = returnAll ? sorted : sorted.slice(offset, offset + limit);

	// Apply mode
	let projected: (Partial<AnyEntity> | SearchResult)[];
	if (mode === "summary") {
		projected = paginated.map((r) => projectToSummary(r as unknown as AnyEntity));
	} else if (mode === "custom") {
		projected = paginated.map((r) => projectToCustom(r as unknown as AnyEntity, includeFields, excludeFields));
	} else {
		projected = paginated;
	}

	return formatResult({
		success: true,
		data: {
			query_type: "filtered_list",
			total_results: total,
			returned_count: projected.length,
			results: projected,
			pagination: returnAll
				? {
						return_all: true,
						total: total,
					}
				: {
						limit,
						offset,
						total: total,
						has_more: offset + limit < total,
						next_offset: offset + limit < total ? offset + limit : null,
						prev_offset: offset > 0 ? Math.max(0, offset - limit) : null,
					},
			...(facets && { facets }),
		},
	});
}

/**
 * Handle next task recommendation
 */
async function handleNextTask(
	operations: SpecOperations,
): Promise<ReturnType<typeof formatResult>> {
	const entitiesResult = await operations.getAllEntities();
	if (!entitiesResult.success || !entitiesResult.data) {
		return formatResult(entitiesResult);
	}

	const { plans } = entitiesResult.data;

	// Collect all incomplete tasks with their plan context
	interface TaskCandidate {
		taskId: string;
		planId: string;
		planName: string;
		description: string;
		priority: "critical" | "high" | "medium" | "low";
		dependsOn: string[];
		blockedBy: string[];
	}

	const candidates: TaskCandidate[] = [];

	for (const plan of plans) {
		if (plan.completed) continue;

		for (const task of plan.tasks || []) {
			if (task.completed) continue;

			const blockedBy: string[] = [];

			// Check task dependencies
			if (task.depends_on && task.depends_on.length > 0) {
				for (const depTaskId of task.depends_on) {
					const depTask = plan.tasks?.find((t) => t.id === depTaskId);
					if (depTask && !depTask.completed) {
						blockedBy.push(depTaskId);
					}
				}
			}

			// Check plan dependencies
			if (plan.depends_on && plan.depends_on.length > 0) {
				for (const depPlanId of plan.depends_on) {
					const depPlan = plans.find((p) => p.id === depPlanId);
					if (depPlan && !depPlan.completed) {
						blockedBy.push(depPlanId);
					}
				}
			}

			candidates.push({
				taskId: task.id,
				planId: plan.id,
				planName: plan.name,
				description: task.description,
				priority: task.priority || "medium",
				dependsOn: task.depends_on || [],
				blockedBy,
			});
		}
	}

	if (candidates.length === 0) {
		return formatResult({
			success: true,
			data: {
				next_task: null,
				message: "No incomplete tasks found. All work is complete!",
			},
		});
	}

	// Filter to unblocked tasks
	const unblocked = candidates.filter((c) => c.blockedBy.length === 0);

	if (unblocked.length === 0) {
		return formatResult({
			success: true,
			data: {
				next_task: null,
				message: "All tasks are blocked by dependencies",
				blocked_tasks: candidates.map((c) => ({
					task_id: c.taskId,
					plan_id: c.planId,
					plan_name: c.planName,
					description: c.description,
					blocked_by: c.blockedBy,
				})),
			},
		});
	}

	// Sort by priority
	const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
	unblocked.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

	const nextTask = unblocked[0];

	return formatResult({
		success: true,
		data: {
			next_task: {
				task_id: nextTask?.taskId,
				plan_id: nextTask?.planId,
				plan_name: nextTask?.planName,
				description: nextTask?.description,
				priority: nextTask?.priority,
				depends_on: nextTask?.dependsOn,
			},
			reasoning: `Selected highest priority (${nextTask?.priority}) unblocked task from ${nextTask?.planName}`,
			alternatives: unblocked.slice(1, 4).map((t) => ({
				task_id: t.taskId,
				plan_id: t.planId,
				plan_name: t.planName,
				description: t.description,
				priority: t.priority,
			})),
			total_unblocked: unblocked.length,
			total_tasks: candidates.length,
		},
	});
}

// ============================================================================
// TOOL REGISTRATION
// ============================================================================

export function registerQueryTool(
	server: McpServer,
	operations: SpecOperations,
	_config: ServerConfig,
) {
	server.registerTool(
		"query",
		{
			title: "Query Specs",
			description:
				"Search and retrieve specifications with flexible filtering, sorting, and pagination.\n\n" +
				"Common use cases:\n" +
				"• Get by ID: { entity_id: 'req-001-auth' }\n" +
				"• Search: { search_terms: 'authentication', types: ['requirement'] }\n" +
				"• List all: { types: ['plan'], limit: 50 }\n" +
				"• Filter: { filters: { plan_priority: ['critical', 'high'] } }\n" +
				"• Next task: { next_task: true }",
			inputSchema: {
				// Direct lookups (mutually exclusive)
				entity_id: z
					.string()
					.optional()
					.describe(
						"Single entity ID lookup (e.g., 'req-001-auth', 'pln-002-api')",
					),
				entity_ids: z
					.array(z.string())
					.optional()
					.describe("Batch entity lookup with multiple IDs"),
				sub_entity_id: z
					.string()
					.optional()
					.describe(
						"Sub-entity ID (e.g., 'task-001', 'tc-002', 'flow-003', 'api-001', 'dm-001', 'crit-002')",
					),
				parent_plan_id: z
					.string()
					.optional()
					.describe(
						"Parent plan ID for faster sub-entity lookup (optional optimization)",
					),

				// Next task recommendation
				next_task: z
					.boolean()
					.optional()
					.describe(
						"Get next recommended task to work on (highest priority unblocked task)",
					),

				// Search & filter
				search_terms: z
					.string()
					.optional()
					.describe("Text to search for across entities"),
				search_fields: z
					.array(z.string())
					.optional()
					.describe(
						"Fields to search in (default: ['name', 'description']). Options: name, description",
					),
				fuzzy: z
					.boolean()
					.optional()
					.default(false)
					.describe("Enable fuzzy matching using Levenshtein distance"),
				types: z
					.array(
						z.enum([
							"requirement",
							"plan",
							"app",
							"service",
							"library",
							"constitution",
						]),
					)
					.optional()
					.describe("Filter by entity types"),

				// Filters
				filters: FiltersSchema.optional().describe(
					"Type-specific filters (priority, status, dates, etc.)",
				),

				// Sorting
				sort_by: z
					.array(SortCriteriaSchema)
					.optional()
					.describe(
						"Multi-field sorting. Default for search: relevance desc. Default for list: created_at desc",
					),

				// Pagination
				limit: z
					.number()
					.int()
					.min(1)
					.max(1000)
					.optional()
					.default(10)
					.describe("Maximum number of results (default: 10, max: 1000)"),
				offset: z
					.number()
					.int()
					.min(0)
					.optional()
					.default(0)
					.describe("Number of results to skip (default: 0)"),
				return_all: z
					.boolean()
					.optional()
					.default(false)
					.describe(
						"Return all results without pagination limits. Overrides limit parameter. Use with caution for large datasets.",
					),

				// Field selection
				mode: z
					.enum(["summary", "full", "custom"])
					.optional()
					.describe(
						"Output mode: summary (id, type, name, description, priority, status, dates), full (all fields), custom (use include_fields/exclude_fields)",
					),
				include_fields: z
					.array(z.string())
					.optional()
					.describe("Specific fields to include (mode: 'custom')"),
				exclude_fields: z
					.array(z.string())
					.optional()
					.describe("Fields to exclude (mode: 'custom')"),

				// Expansion
				expand: ExpansionSchema.optional().describe(
					"Include related entities (dependencies, references, parent)",
				),

				// Aggregations
				include_facets: z
					.boolean()
					.optional()
					.describe("Include facet counts in response"),
				facet_fields: z
					.array(z.enum(["type", "priority", "status", "folder"]))
					.optional()
					.describe("Fields to calculate facets for"),
			},
		},
		wrapToolHandler(
			"query",
			async ({
				entity_id,
				entity_ids,
				sub_entity_id,
				parent_plan_id,
				next_task,
				search_terms,
				search_fields = ["name", "description"],
				fuzzy = false,
				types,
				filters,
				sort_by,
				limit = 10,
				offset = 0,
				return_all = false,
				mode,
				include_fields,
				exclude_fields,
				expand,
				include_facets = false,
				facet_fields,
			}) => {
				// Handle next_task first
				if (next_task) {
					return await handleNextTask(operations);
				}

				// Validate mutually exclusive fields
				const primaryMethods = [
					entity_id,
					entity_ids,
					sub_entity_id,
					search_terms,
				].filter(Boolean);

				if (primaryMethods.length > 1) {
					return formatResult({
						success: false,
						error:
							"Cannot specify multiple query methods (entity_id, entity_ids, sub_entity_id, search_terms are mutually exclusive)",
					});
				}

				if (primaryMethods.length === 0 && !types && !filters && !include_facets) {
					return formatResult({
						success: false,
						error:
							"Must specify at least one of: entity_id, entity_ids, sub_entity_id, search_terms, types, filters, or include_facets",
					});
				}

				// Route to appropriate handler
				if (entity_id) {
					const expandWithoutParent = expand
						? (Object.fromEntries(
								Object.entries({
									dependencies: expand.dependencies,
									references: expand.references,
									depth: expand.depth,
									dependency_metrics: expand.dependency_metrics,
								}).filter(([, value]) => value !== undefined),
							) as {
								dependencies?: boolean;
								references?: boolean;
								depth?: number;
								dependency_metrics?: boolean;
							})
						: undefined;
					return await handleEntityIdLookup(
						entity_id,
						operations,
						expandWithoutParent,
					);
				}

				if (entity_ids) {
					return await handleBatchLookup(entity_ids, operations);
				}

				if (sub_entity_id) {
					return await handleSubEntityLookup(
						sub_entity_id,
						parent_plan_id,
						expand?.parent || false,
						operations,
					);
				}

				if (search_terms) {
					const defaultSortBy = sort_by || [
						{ field: "relevance" as const, order: "desc" as const },
					];
					return await handleSearch(
						search_terms,
						search_fields,
						fuzzy,
						types,
						filters,
						defaultSortBy,
						limit,
						offset,
						return_all,
						include_facets,
						facet_fields,
						mode,
						include_fields,
						exclude_fields,
						operations,
					);
				}

				// Filtered list (no search terms)
				const defaultSortBy = sort_by || [
					{ field: "created_at" as const, order: "desc" as const },
				];
				return await handleFilteredList(
					types,
					filters,
					defaultSortBy,
					limit,
					offset,
					return_all,
					include_facets,
					facet_fields,
					mode,
					include_fields,
					exclude_fields,
					operations,
				);
			},
		),
	);
}
