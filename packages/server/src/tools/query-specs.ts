import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type { Query, QueryResultItem } from "@spec-mcp/schemas";
import { QuerySchema } from "@spec-mcp/schemas";

/**
 * Format query results as markdown
 */
function formatResultsAsMarkdown(
	items: QueryResultItem[],
	query: Query,
	totalUnpaginated?: number,
	stats?: import("@spec-mcp/schemas").QueryStats,
	relatedItems?: Record<string, import("@spec-mcp/schemas").RelatedItemRef[]>,
): string {
	const lines: string[] = [];

	// Header
	lines.push("# Query Results");
	lines.push("");
	lines.push(`**Total Results:** ${items.length}`);
	if (totalUnpaginated !== undefined && totalUnpaginated !== items.length) {
		lines.push(`**Total (Unpaginated):** ${totalUnpaginated}`);
	}
	lines.push("");

	// Query details
	lines.push("## Query");
	lines.push("");
	if (query.draft !== undefined) {
		lines.push(
			`- **Draft Filter:** ${query.draft ? "drafts only" : "finalized only"}`,
		);
	}
	if (query.id) {
		const ids = Array.isArray(query.id) ? query.id.join(", ") : query.id;
		lines.push(`- **ID Filter:** ${ids}`);
	}
	if (query.objects) {
		if ("specTypes" in query.objects && query.objects.specTypes) {
			lines.push(`- **Spec Types:** ${query.objects.specTypes.join(", ")}`);
		} else if ("itemTypes" in query.objects && query.objects.itemTypes) {
			lines.push(`- **Item Types:** ${query.objects.itemTypes.join(", ")}`);
		}
	}
	if (query.completed !== undefined) {
		lines.push(
			`- **Completed:** ${query.completed ? "completed only" : "not completed"}`,
		);
	}
	if (query.verified !== undefined) {
		lines.push(
			`- **Verified:** ${query.verified ? "verified only" : "not verified"}`,
		);
	}
	if (query.priority) {
		lines.push(`- **Priority:** ${query.priority.join(", ")}`);
	}
	if (query.milestone) {
		lines.push(`- **Milestone:** ${query.milestone}`);
	}
	if (query.status) {
		lines.push(`- **Status:** ${query.status.join(", ")}`);
	}
	if (query.textSearch) {
		lines.push(`- **Text Search:** "${query.textSearch}"`);
		if (query.searchFields && !query.searchFields.includes("all")) {
			lines.push(`  - **Search Fields:** ${query.searchFields.join(", ")}`);
		}
	}
	if (query.createdAfter || query.createdBefore) {
		lines.push(
			`- **Created:** ${query.createdAfter ? `after ${query.createdAfter}` : ""} ${query.createdBefore ? `before ${query.createdBefore}` : ""}`.trim(),
		);
	}
	if (query.updatedAfter || query.updatedBefore) {
		lines.push(
			`- **Updated:** ${query.updatedAfter ? `after ${query.updatedAfter}` : ""} ${query.updatedBefore ? `before ${query.updatedBefore}` : ""}`.trim(),
		);
	}
	if (query.dependencyStatus) {
		lines.push(`- **Dependency:** ${query.dependencyStatus.join(", ")}`);
	}
	if (query.limit || query.offset) {
		lines.push(
			`- **Pagination:** limit=${query.limit ?? "none"}, offset=${query.offset ?? 0}`,
		);
	}
	lines.push(`- **Sort:** ${query.orderBy} (${query.direction})`);
	lines.push("");

	// Statistics
	if (stats) {
		lines.push("## Statistics");
		lines.push("");

		if (stats.byStatus && Object.keys(stats.byStatus).length > 0) {
			lines.push("**By Status:**");
			for (const [status, count] of Object.entries(stats.byStatus)) {
				lines.push(`- ${status}: ${count}`);
			}
			lines.push("");
		}

		if (stats.byPriority && Object.keys(stats.byPriority).length > 0) {
			lines.push("**By Priority:**");
			for (const [priority, count] of Object.entries(stats.byPriority)) {
				lines.push(`- ${priority}: ${count}`);
			}
			lines.push("");
		}

		if (stats.byType && Object.keys(stats.byType).length > 0) {
			lines.push("**By Type:**");
			for (const [type, count] of Object.entries(stats.byType)) {
				lines.push(`- ${type}: ${count}`);
			}
			lines.push("");
		}

		if (stats.completionRate !== undefined) {
			lines.push(
				`**Completion Rate:** ${(stats.completionRate * 100).toFixed(1)}%`,
			);
			lines.push("");
		}

		if (stats.averageAge !== undefined) {
			lines.push(`**Average Age:** ${stats.averageAge.toFixed(1)} days`);
			lines.push("");
		}
	}

	// Results
	if (items.length === 0) {
		lines.push("## No Results Found");
		return lines.join("\n");
	}

	lines.push("## Results");
	lines.push("");

	for (const item of items) {
		if (item.resultType === "spec") {
			// Format spec result
			lines.push(`### ${item.id}`);
			lines.push("");
			lines.push(`**Name:** ${item.name}`);
			lines.push(`**Type:** ${item.type}`);
			lines.push(`**Priority:** ${item.priority}`);
			if (item.status) {
				lines.push(`**Status:** ${item.status}`);
			}
			if (item.draft) {
				lines.push("**Draft:** ✓");
			}
			lines.push(`**Created:** ${item.created_at}`);
			if (item.updated_at) {
				lines.push(`**Updated:** ${item.updated_at}`);
			}
			lines.push("");
			lines.push(item.description);
			lines.push("");
		} else {
			// Format sub-item result
			const statusIcon =
				item.verified === true ? "✓✓" : item.completed === true ? "✓" : "○";
			lines.push(`### ${statusIcon} ${item.id}: ${item.name}`);
			lines.push("");
			lines.push(`**Type:** ${item.type}`);
			lines.push(`**Parent:** ${item.parentId} (${item.parentName})`);
			if (item.priority) {
				lines.push(`**Priority:** ${item.priority}`);
			}
			if (item.status) {
				lines.push(`**Status:** ${item.status}`);
			}
			if (item.description) {
				lines.push("");
				lines.push(item.description);
			}

			// Related items
			const itemRelated = relatedItems?.[item.id];
			if (itemRelated) {
				lines.push("");
				lines.push("**Related Items:**");
				for (const related of itemRelated) {
					lines.push(
						`- [${related.relationshipType}] ${related.id}: ${related.name}`,
					);
				}
			}

			lines.push("");
		}
	}

	return lines.join("\n");
}

/**
 * Query specs and sub-items based on flexible filters
 */
export async function querySpecs(
	specManager: SpecManager,
	queryInput: unknown,
): Promise<CallToolResult> {
	try {
		// Validate query
		const query = QuerySchema.parse(queryInput);

		// Execute query via SpecManager
		const result = await specManager.query(query);

		// Format results
		const markdown = formatResultsAsMarkdown(
			result.items,
			query,
			result.totalUnpaginated,
			result.stats,
			result.relatedItems,
		);

		return {
			content: [
				{
					type: "text",
					text: markdown,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error executing query: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const querySpecsTool = {
	name: "query_specs",
	description:
		"Query and filter specs and their sub-items (tasks, test cases, criteria, etc.) with flexible filters and sorting. Supports filtering by draft status, ID, object types, completion, verification, priority, milestone, status, text search, date ranges, and dependency status. Includes pagination, statistics, and related items expansion. Results can be sorted by 'next-to-do' (priority-based), 'created', or 'updated' date.",
	inputSchema: {
		type: "object",
		properties: {
			draft: {
				type: "boolean",
				description:
					"Filter by draft status. If not provided, returns both drafts and finalized specs",
			},
			id: {
				oneOf: [
					{ type: "string" },
					{ type: "array", items: { type: "string" } },
				],
				description:
					"Find by full ID (breq-001-auth), partial ID (breq-001), or parent ID to get sub-items (pln-001 returns all tasks). Can be a single ID or array of IDs.",
			},
			objects: {
				type: "object",
				oneOf: [
					{
						properties: {
							specTypes: {
								type: "array",
								items: {
									type: "string",
									enum: [
										"business-requirement",
										"technical-requirement",
										"plan",
										"component",
										"constitution",
										"decision",
										"milestone",
									],
								},
								description: "Filter by spec types (OR logic)",
							},
						},
						required: ["specTypes"],
					},
					{
						properties: {
							itemTypes: {
								type: "array",
								items: {
									type: "string",
									enum: [
										"task",
										"test-case",
										"criteria",
										"flow",
										"api-contract",
										"data-model",
										"user-story",
									],
								},
								description:
									"Filter by item types within specs (OR logic). Cannot combine with specTypes.",
							},
						},
						required: ["itemTypes"],
					},
				],
				description:
					"Filter by object types. Specify either specTypes (for spec entities) or itemTypes (for sub-items like tasks). Cannot combine both.",
			},
			completed: {
				type: "boolean",
				description: "Filter items by completion status",
			},
			verified: {
				type: "boolean",
				description: "Filter items by verification status",
			},
			priority: {
				type: "array",
				items: {
					type: "string",
					enum: ["critical", "high", "medium", "low", "nice-to-have"],
				},
				description: "Filter by priority levels (OR logic)",
			},
			milestone: {
				type: "string",
				description:
					"Filter by linked milestone ID (e.g., mls-001-q1-release). For specs, matches specs linked to this milestone. For tasks, matches tasks in plans linked to this milestone.",
			},
			status: {
				type: "array",
				items: {
					type: "string",
					enum: ["not-started", "in-progress", "completed", "verified"],
				},
				description: "Filter by computed status (OR logic)",
			},
			textSearch: {
				type: "string",
				description:
					'Search text within spec/item content. Supports fuzzy matching and operators: +required -excluded "exact phrase"',
			},
			searchFields: {
				type: "array",
				items: {
					type: "string",
					enum: ["title", "description", "all"],
				},
				default: ["all"],
				description:
					"Which fields to search in: 'title', 'description', or 'all'. Defaults to all fields.",
			},
			createdAfter: {
				type: "string",
				format: "date-time",
				description: "Filter items created after this ISO date",
			},
			createdBefore: {
				type: "string",
				format: "date-time",
				description: "Filter items created before this ISO date",
			},
			updatedAfter: {
				type: "string",
				format: "date-time",
				description: "Filter items updated after this ISO date",
			},
			updatedBefore: {
				type: "string",
				format: "date-time",
				description: "Filter items updated before this ISO date",
			},
			dependencyStatus: {
				type: "array",
				items: {
					type: "string",
					enum: ["blocked", "blocking", "no-dependencies", "has-dependencies"],
				},
				description:
					"Filter by dependency status: 'blocked' (has incomplete dependencies), 'blocking' (other items depend on this), 'no-dependencies', 'has-dependencies'",
			},
			limit: {
				type: "number",
				description: "Maximum number of results to return (max 1000)",
			},
			offset: {
				type: "number",
				default: 0,
				description: "Number of results to skip (for pagination)",
			},
			includeRelated: {
				type: "boolean",
				default: false,
				description: "Include related items in results",
			},
			relatedTypes: {
				type: "array",
				items: {
					type: "string",
					enum: ["dependencies", "blocking", "linked-specs"],
				},
				description:
					"Types of related items to include: 'dependencies', 'blocking', 'linked-specs'",
			},
			includeStats: {
				type: "boolean",
				default: false,
				description: "Include aggregated statistics in results",
			},
			orderBy: {
				type: "string",
				enum: ["next-to-do", "created", "updated"],
				default: "created",
				description:
					"Sort order: 'next-to-do' (priority + dependencies), 'created' (creation date), 'updated' (last update)",
			},
			direction: {
				type: "string",
				enum: ["asc", "desc"],
				default: "desc",
				description: "Sort direction: 'asc' or 'desc'",
			},
		},
	} as const,
};
