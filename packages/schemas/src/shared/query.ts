import z from "zod";
import { EntityTypeSchema, ItemPrioritySchema } from "./base.js";

/**
 * Item types that can exist within specs
 * These are sub-items like tasks, test cases, criteria, etc.
 */
export const ItemTypeSchema = z.enum([
	"task",
	"test-case",
	"criteria",
	"flow",
	"api-contract",
	"data-model",
	"user-story",
]);

export type ItemType = z.infer<typeof ItemTypeSchema>;

/**
 * Status states for specs and items
 */
export const StatusFilterSchema = z.enum([
	"not-started",
	"in-progress",
	"completed",
	"verified",
]);

export type StatusFilter = z.infer<typeof StatusFilterSchema>;

/**
 * Sort order options
 */
export const SortOrderSchema = z.enum(["next-to-do", "created", "updated"]);

export type SortOrder = z.infer<typeof SortOrderSchema>;

/**
 * Sort direction
 */
export const SortDirectionSchema = z.enum(["asc", "desc"]);

export type SortDirection = z.infer<typeof SortDirectionSchema>;

/**
 * Search fields for text search
 */
export const SearchFieldSchema = z.enum(["title", "description", "all"]);

export type SearchField = z.infer<typeof SearchFieldSchema>;

/**
 * Dependency status filter
 */
export const DependencyStatusSchema = z.enum([
	"blocked",
	"blocking",
	"no-dependencies",
	"has-dependencies",
]);

export type DependencyStatus = z.infer<typeof DependencyStatusSchema>;

/**
 * Related item types that can be expanded
 */
export const RelatedTypeSchema = z.enum([
	"dependencies",
	"blocking",
	"linked-specs",
]);

export type RelatedType = z.infer<typeof RelatedTypeSchema>;

/**
 * Object types filter - for querying specific spec types or item types
 * Cannot combine spec types with item types
 */
export const ObjectsFilterSchema = z
	.object({
		specTypes: z
			.array(EntityTypeSchema)
			.min(1)
			.optional()
			.describe("Filter by spec types (OR logic)"),
		itemTypes: z
			.array(ItemTypeSchema)
			.min(1)
			.optional()
			.describe("Filter by item types within specs (OR logic)"),
	})
	.refine(
		(data) => {
			// Must have exactly one of specTypes or itemTypes, not both, not neither
			const hasSpecTypes = data.specTypes !== undefined;
			const hasItemTypes = data.itemTypes !== undefined;
			return (hasSpecTypes && !hasItemTypes) || (!hasSpecTypes && hasItemTypes);
		},
		{
			message:
				"Must specify either specTypes or itemTypes, but not both or neither",
		},
	);

export type ObjectsFilter = z.infer<typeof ObjectsFilterSchema>;

/**
 * Main query schema for searching and filtering specs and their sub-items
 */
export const QuerySchema = z
	.object({
		// Draft filter
		draft: z
			.boolean()
			.optional()
			.describe(
				"Filter by draft status. If not provided, returns both drafts and finalized specs",
			),

		// ID filter - supports single ID, array of IDs, or partial matching
		id: z
			.union([z.string().min(1), z.array(z.string().min(1)).min(1)])
			.optional()
			.describe(
				"Find by full ID (breq-001-auth), partial ID (breq-001), or parent ID to get sub-items (pln-001 returns all tasks). Can be a single ID or array of IDs.",
			),

		// Objects filter - either spec types OR item types, not both
		objects: ObjectsFilterSchema.optional().describe(
			"Filter by object types. Specify either specTypes (for spec entities) or itemTypes (for sub-items like tasks). Cannot combine both.",
		),

		// Status filters
		completed: z
			.boolean()
			.optional()
			.describe("Filter items by completion status"),

		verified: z
			.boolean()
			.optional()
			.describe("Filter items by verification status"),

		// Priority filter
		priority: z
			.array(ItemPrioritySchema)
			.min(1)
			.optional()
			.describe("Filter by priority levels (OR logic)"),

		// Milestone filter
		milestone: z
			.string()
			.min(1)
			.optional()
			.describe(
				"Filter by linked milestone ID (e.g., mls-001-q1-release). For specs, matches specs linked to this milestone. For tasks, matches tasks in plans linked to this milestone.",
			),

		// Status filter (computed from completion states)
		status: z
			.array(StatusFilterSchema)
			.min(1)
			.optional()
			.describe("Filter by computed status (OR logic)"),

		// Text search (Feature 1)
		textSearch: z
			.string()
			.min(1)
			.optional()
			.describe(
				'Search text within spec/item content. Supports fuzzy matching and operators: +required -excluded "exact phrase"',
			),

		searchFields: z
			.array(SearchFieldSchema)
			.min(1)
			.optional()
			.describe(
				"Which fields to search in: 'title', 'description', or 'all'. Defaults to all fields.",
			),

		// Date range filters (Feature 2)
		createdAfter: z
			.string()
			.datetime()
			.optional()
			.describe("Filter items created after this ISO date"),

		createdBefore: z
			.string()
			.datetime()
			.optional()
			.describe("Filter items created before this ISO date"),

		updatedAfter: z
			.string()
			.datetime()
			.optional()
			.describe("Filter items updated after this ISO date"),

		updatedBefore: z
			.string()
			.datetime()
			.optional()
			.describe("Filter items updated before this ISO date"),

		// Dependency filters (Feature 3)
		dependencyStatus: z
			.array(DependencyStatusSchema)
			.min(1)
			.optional()
			.describe(
				"Filter by dependency status: 'blocked' (has incomplete dependencies), 'blocking' (other items depend on this), 'no-dependencies', 'has-dependencies'",
			),

		// Pagination (Feature 4)
		limit: z
			.number()
			.int()
			.positive()
			.max(1000)
			.optional()
			.describe("Maximum number of results to return (max 1000)"),

		offset: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe("Number of results to skip (for pagination)"),

		// Related items expansion (Feature 7)
		includeRelated: z
			.boolean()
			.optional()
			.describe("Include related items in results"),

		relatedTypes: z
			.array(RelatedTypeSchema)
			.min(1)
			.optional()
			.describe(
				"Types of related items to include: 'dependencies', 'blocking', 'linked-specs'",
			),

		// Statistics (Feature 6)
		includeStats: z
			.boolean()
			.optional()
			.describe("Include aggregated statistics in results"),

		// Sorting
		orderBy: SortOrderSchema.optional()
			.default("created")
			.describe(
				"Sort order: 'next-to-do' (priority + dependencies), 'created' (creation date), 'updated' (last update)",
			),

		direction: SortDirectionSchema.optional()
			.default("desc")
			.describe("Sort direction: 'asc' or 'desc'"),
	})
	.strict();

export type Query = z.infer<typeof QuerySchema>;

/**
 * Query result types
 */

// Base result item with common fields
export interface BaseResultItem {
	id: string;
	type: string;
	name: string;
	priority?: string;
	status?: StatusFilter;
	created_at: string;
	updated_at?: string;
	draft?: boolean;
}

// Spec result item
export interface SpecResultItem extends BaseResultItem {
	resultType: "spec";
	slug: string;
	description: string;
	number: number;
}

// Sub-item result item (task, test case, etc.)
export interface SubItemResultItem extends BaseResultItem {
	resultType: "sub-item";
	parentId: string;
	parentType: string;
	parentName: string;
	description?: string;
	completed?: boolean;
	verified?: boolean;
}

export type QueryResultItem = SpecResultItem | SubItemResultItem;

/**
 * Related item reference
 */
export interface RelatedItemRef {
	id: string;
	type: string;
	name: string;
	relationshipType: "dependency" | "blocking" | "linked-spec";
}

/**
 * Query statistics
 */
export interface QueryStats {
	byStatus?: Record<StatusFilter, number>;
	byPriority?: Record<string, number>;
	byType?: Record<string, number>;
	completionRate?: number;
	averageAge?: number; // Days since creation
}

/**
 * Query result
 */
export interface QueryResult {
	items: QueryResultItem[];
	total: number;
	totalUnpaginated?: number; // Total count before pagination
	query: Query;
	stats?: QueryStats;
	relatedItems?: Record<string, RelatedItemRef[]>; // Keyed by item ID
}

// Note: All query utility functions have been moved to @spec-mcp/core/utils/query-utils
// Import them from there instead:
//   import { isItemTypeQuery, isSpecTypeQuery, getSpecTypes, getItemTypes } from "@spec-mcp/core";

/**
 * Preset query builders (Feature 5 - Saved Queries/Presets)
 */
export const QueryPresets = {
	/**
	 * Find tasks that are ready to work on (not started, no incomplete dependencies, sorted by priority)
	 */
	myNextTasks: (): Query => ({
		objects: { itemTypes: ["task"] },
		status: ["not-started"],
		dependencyStatus: ["no-dependencies"],
		orderBy: "next-to-do",
		direction: "desc",
	}),

	/**
	 * Find items completed but not verified
	 */
	needsReview: (): Query => ({
		completed: true,
		verified: false,
		orderBy: "updated",
		direction: "desc",
	}),

	/**
	 * Find items not updated in the last 30 days
	 */
	staleItems: (days = 30): Query => {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);
		return {
			updatedBefore: cutoffDate.toISOString(),
			orderBy: "updated",
			direction: "asc",
		};
	},

	/**
	 * Find critical tasks that are blocking other work
	 */
	criticalBlockers: (): Query => ({
		objects: { itemTypes: ["task"] },
		priority: ["critical", "high"],
		dependencyStatus: ["blocking"],
		completed: false,
		orderBy: "next-to-do",
		direction: "desc",
	}),

	/**
	 * Find all in-progress work
	 */
	inProgress: (): Query => ({
		status: ["in-progress"],
		orderBy: "updated",
		direction: "desc",
	}),

	/**
	 * Find items created recently (default 7 days)
	 */
	recentlyCreated: (days = 7): Query => {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);
		return {
			createdAfter: cutoffDate.toISOString(),
			orderBy: "created",
			direction: "desc",
		};
	},

	/**
	 * Find blocked tasks
	 */
	blockedTasks: (): Query => ({
		objects: { itemTypes: ["task"] },
		dependencyStatus: ["blocked"],
		completed: false,
		orderBy: "next-to-do",
		direction: "desc",
	}),

	/**
	 * Find all drafts
	 */
	allDrafts: (): Query => ({
		draft: true,
		orderBy: "updated",
		direction: "desc",
	}),

	/**
	 * Find items by milestone with stats
	 */
	milestoneProgress: (milestoneId: string): Query => ({
		milestone: milestoneId,
		includeStats: true,
		orderBy: "next-to-do",
		direction: "desc",
	}),
};
