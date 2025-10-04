import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { AnyEntity, Plan, Requirement } from "@spec-mcp/data";
import { z } from "zod";
import { formatResult } from "../utils/result-formatter.js";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

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
});

const ComponentFiltersSchema = z.object({
	component_type: z
		.array(z.enum(["app", "service", "library"]))
		.optional()
		.describe("Filter by component type"),
	folder: z.string().optional().describe("Filter by folder path"),
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

const FiltersSchema = RequirementFiltersSchema.merge(PlanFiltersSchema)
	.merge(ComponentFiltersSchema)
	.merge(ConstitutionFiltersSchema)
	.merge(DateFiltersSchema);

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
 * Detect sub-entity type from ID
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
	if (/^task-\d{3}$/.test(subEntityId)) return "task";
	if (/^tc-\d{3}$/.test(subEntityId)) return "test_case";
	if (/^flow-\d{3}$/.test(subEntityId)) return "flow";
	if (/^api-\d{3}$/.test(subEntityId)) return "api_contract";
	if (/^dm-\d{3}$/.test(subEntityId)) return "data_model";
	if (/^req-\d{3}-.+\/crit-\d{3}$/.test(subEntityId)) return "criteria";
	return null;
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
				entity.folder !== filters.folder
			)
				return false;
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
		let hasMatch = false;
		const highlights: string[] = [];

		// Exact substring matching
		if (fieldText.includes(searchQuery)) {
			hasMatch = true;
			highlights.push(highlightMatches(value, query));
			const position = fieldText.indexOf(searchQuery);
			const positionWeight = 1 - position / fieldText.length;
			score += 1 + positionWeight;
		} else if (fuzzy && fuzzyMatch(fieldText, searchQuery, 2)) {
			hasMatch = true;
			highlights.push(highlightMatches(value, query));
			score += 0.5;
		}

		// Token matching
		for (const token of queryTokens) {
			if (token === searchQuery) continue;
			if (fieldText.includes(token)) {
				score += 0.3;
			}
		}

		if (hasMatch) {
			matches.push({ field, highlights });
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
): Promise<ReturnType<typeof formatResult>> {
	const type = detectEntityType(entityId);

	if (!type) {
		return formatResult({
			success: false,
			error: `Invalid entity ID format: ${entityId}`,
		});
	}

	switch (type) {
		case "requirement": {
			const result = await operations.getRequirement(entityId);
			return formatResult(result);
		}
		case "plan": {
			const result = await operations.getPlan(entityId);
			return formatResult(result);
		}
		case "component": {
			const result = await operations.getComponent(entityId);
			return formatResult(result);
		}
		case "constitution": {
			const result = await operations.getConstitution(entityId);
			return formatResult(result);
		}
	}
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
	const subEntityType = detectSubEntityType(subEntityId);

	if (!subEntityType) {
		return formatResult({
			success: false,
			error: `Invalid sub-entity ID format: ${subEntityId}`,
		});
	}

	// Handle criteria lookup
	if (subEntityType === "criteria") {
		const parts = subEntityId.split("/");
		const reqId = parts[0];
		if (!reqId) {
			return formatResult({
				success: false,
				error: `Invalid criteria ID format: ${subEntityId}`,
			});
		}
		const reqResult = await operations.getRequirement(reqId);

		if (!reqResult.success || !reqResult.data) {
			return formatResult(reqResult);
		}

		const criteria = reqResult.data.criteria.find(
			(c) => c.id === subEntityId,
		);

		if (!criteria) {
			return formatResult({
				success: false,
				error: `Criteria '${subEntityId}' not found`,
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
	}

	// Handle plan sub-entities
	let plans: Plan[];

	if (parentPlanId) {
		const planResult = await operations.getPlan(parentPlanId);
		plans = planResult.success && planResult.data ? [planResult.data] : [];
	} else {
		const plansResult = await operations.listPlans();
		plans = plansResult.success && plansResult.data ? plansResult.data : [];
	}

	for (const plan of plans) {
		let subEntity: unknown;

		switch (subEntityType) {
			case "task":
				subEntity = plan.tasks?.find((t) => t.id === subEntityId);
				break;
			case "test_case":
				subEntity = plan.test_cases?.find((tc) => tc.id === subEntityId);
				break;
			case "flow":
				subEntity = plan.flows?.find((f) => f.id === subEntityId);
				break;
			case "api_contract":
				subEntity = plan.api_contracts?.find((ac) => ac.id === subEntityId);
				break;
			case "data_model":
				subEntity = plan.data_models?.find((dm) => dm.id === subEntityId);
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
		error: `Sub-entity '${subEntityId}' not found`,
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
	operations: SpecOperations,
): Promise<ReturnType<typeof formatResult>> {
	const entitiesResult = await operations.getAllEntities();
	if (!entitiesResult.success || !entitiesResult.data) {
		return formatResult(entitiesResult);
	}

	const { requirements, plans, components } = entitiesResult.data;
	let allEntities: AnyEntity[] = [...requirements, ...plans, ...components];

	// Apply type filter
	if (types && types.length > 0) {
		allEntities = allEntities.filter((e) => types.includes(e.type));
	}

	// Apply filters
	if (filters) {
		allEntities = applyFilters(allEntities, filters);
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
	const projected =
		mode === "summary"
			? paginated.map((r) => projectToSummary(r as unknown as AnyEntity))
			: paginated;

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
	mode: "summary" | "full" | "custom" | undefined,
	operations: SpecOperations,
): Promise<ReturnType<typeof formatResult>> {
	const entitiesResult = await operations.getAllEntities();
	if (!entitiesResult.success || !entitiesResult.data) {
		return formatResult(entitiesResult);
	}

	const { requirements, plans, components } = entitiesResult.data;
	let allEntities: AnyEntity[] = [...requirements, ...plans, ...components];

	// Apply type filter
	if (types && types.length > 0) {
		allEntities = allEntities.filter((e) => types.includes(e.type));
	}

	// Apply filters
	if (filters) {
		allEntities = applyFilters(allEntities, filters);
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

	// Paginate (or return all)
	const total = sorted.length;
	const paginated = returnAll ? sorted : sorted.slice(offset, offset + limit);

	// Apply mode
	const projected =
		mode === "summary"
			? paginated.map((r) => projectToSummary(r as unknown as AnyEntity))
			: paginated;

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
		},
	});
}

// ============================================================================
// TOOL REGISTRATION
// ============================================================================

export function registerQueryTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"query",
		{
			title: "Query Specs",
			description:
				"Comprehensive query tool with explicit schema-based parameters for entity lookups, searches, and filtering. " +
				"Supports entity IDs, sub-entity IDs, batch lookups, text search, filtering, sorting, pagination, and facets.",
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
				expand,
				include_facets = false,
				facet_fields,
			}) => {
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

				if (primaryMethods.length === 0 && !types && !filters) {
					return formatResult({
						success: false,
						error:
							"Must specify at least one of: entity_id, entity_ids, sub_entity_id, search_terms, types, or filters",
					});
				}

				// Route to appropriate handler
				if (entity_id) {
					return await handleEntityIdLookup(entity_id, operations);
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
					mode,
					operations,
				);
			},
			context,
		),
	);
}
