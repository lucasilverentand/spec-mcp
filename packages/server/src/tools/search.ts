import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import type { AnyEntity, Plan, Requirement } from "@spec-mcp/data";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// NOTE: Entity type enums are duplicated inline from @spec-mcp/data because:
// 1. @spec-mcp/data uses Zod v4
// 2. @spec-mcp/server uses Zod v3 (required by MCP SDK)
// 3. Zod v3 and v4 have incompatible types
// Source of truth: EntityTypeSchema, ComponentTypeSchema in @spec-mcp/data

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
	const m = str1.length;
	const n = str2.length;
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) {
		const row = dp[i];
		if (row) {
			row[0] = i;
		}
	}
	for (let j = 0; j <= n; j++) {
		const firstRow = dp[0];
		if (firstRow) {
			firstRow[j] = j;
		}
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
 * Tokenize text into words for matching
 */
function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[\s\-_.,;:!?()[\]{}]+/)
		.filter((token) => token.length > 0);
}

/**
 * Highlight matched text with <mark> tags
 */
function highlightMatches(
	text: string,
	query: string,
	caseSensitive: boolean,
): string {
	if (!query) return text;

	const flags = caseSensitive ? "g" : "gi";
	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(escapedQuery, flags);

	return text.replace(regex, (match) => `<mark>${match}</mark>`);
}

/**
 * Check if text matches query with fuzzy matching
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
 * Search entity fields for matches
 */
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

function searchEntity(
	entity: AnyEntity,
	query: string,
	fields: string[],
	fuzzy: boolean,
	caseSensitive: boolean,
): SearchResult | null {
	const matches: SearchMatch[] = [];
	let score = 0;

	// Prepare query
	const searchQuery = caseSensitive ? query : query.toLowerCase();
	const queryTokens = tokenize(query);

	// Search specified fields or all text fields
	const fieldsToSearch = fields.length > 0 ? fields : ["name", "description"];

	for (const field of fieldsToSearch) {
		const value = (entity as Record<string, unknown>)[field];
		if (typeof value !== "string") continue;

		const fieldText = caseSensitive ? value : value.toLowerCase();
		let hasMatch = false;
		const highlights: string[] = [];

		if (fuzzy) {
			// Fuzzy matching
			if (fuzzyMatch(fieldText, searchQuery, 2)) {
				hasMatch = true;
				highlights.push(highlightMatches(value, query, caseSensitive));
				// Lower score for fuzzy matches
				score += 0.5;
			}
		} else {
			// Exact substring matching
			if (fieldText.includes(searchQuery)) {
				hasMatch = true;
				highlights.push(highlightMatches(value, query, caseSensitive));
				// Position weight: earlier matches score higher
				const position = fieldText.indexOf(searchQuery);
				const positionWeight = 1 - position / fieldText.length;
				score += 1 + positionWeight;
			}
		}

		// Token-based matching for multi-word queries
		for (const token of queryTokens) {
			if (token === searchQuery) continue; // Already counted above
			if (fieldText.includes(token)) {
				score += 0.3;
			}
		}

		if (hasMatch) {
			matches.push({
				field,
				highlights,
			});
		}
	}

	if (matches.length === 0) {
		return null;
	}

	// Boost score for name matches
	const nameMatch = matches.find((m) => m.field === "name");
	if (nameMatch) {
		score *= 1.5;
	}

	// Build result
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

	// Add type-specific metadata
	if ("priority" in entity) {
		result.priority = (entity as Requirement).priority;
	}
	if ("completed" in entity) {
		result.status = (entity as Plan).completed ? "completed" : "in-progress";
	}

	return result;
}

/**
 * Register all search-related tools
 */
export function registerSearchTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Search Specs Tool
	server.registerTool(
		"search-specs",
		{
			title: "Search Specs",
			description:
				"Full-text search across all entities (requirements, plans, components). Supports fuzzy matching, filtering, and relevance scoring.",
			inputSchema: {
				query: z.string().min(1).describe("Search query text"),
				types: z
					.array(
						z.enum([
							"requirement",
							"plan",
							"app",
							"service",
							"library",
							"tool",
							"constitution",
						]),
					)
					.optional()
					.describe("Filter by entity types"),
				fields: z
					.array(z.string())
					.optional()
					.describe(
						"Fields to search in (default: name, description). Examples: name, description, status, priority",
					),
				fuzzy: z
					.boolean()
					.optional()
					.default(false)
					.describe(
						"Enable fuzzy matching for typos (uses Levenshtein distance)",
					),
				case_sensitive: z
					.boolean()
					.optional()
					.default(false)
					.describe("Enable case-sensitive search"),
				limit: z
					.number()
					.int()
					.min(1)
					.max(100)
					.optional()
					.default(20)
					.describe("Maximum number of results to return"),
				offset: z
					.number()
					.int()
					.min(0)
					.optional()
					.default(0)
					.describe("Number of results to skip (for pagination)"),
				sort_by: z
					.enum(["relevance", "created", "updated", "priority"])
					.optional()
					.default("relevance")
					.describe("Sort results by field"),
			},
		},
		wrapToolHandler(
			"search-specs",
			async ({
				query,
				types,
				fields = [],
				fuzzy = false,
				case_sensitive = false,
				limit = 20,
				offset = 0,
				sort_by = "relevance",
			}) => {
				// Get all entities
				const entitiesResult = await operations.getAllEntities();

				if (!entitiesResult.success || !entitiesResult.data) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error: entitiesResult.error || "Failed to get entities",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				const { requirements, plans, components } = entitiesResult.data;

				// Combine all entities
				let allEntities: AnyEntity[] = [
					...requirements,
					...plans,
					...components,
				];

				// Filter by type if specified
				if (types && types.length > 0) {
					allEntities = allEntities.filter((entity) =>
						types.includes(entity.type),
					);
				}

				// Search entities
				const results: SearchResult[] = [];
				for (const entity of allEntities) {
					const result = searchEntity(
						entity,
						query,
						fields,
						fuzzy,
						case_sensitive,
					);
					if (result) {
						results.push(result);
					}
				}

				// Sort results
				results.sort((a, b) => {
					switch (sort_by) {
						case "relevance":
							return b.score - a.score;
						case "created":
							return (
								new Date(b.created_at).getTime() -
								new Date(a.created_at).getTime()
							);
						case "updated":
							return (
								new Date(b.updated_at).getTime() -
								new Date(a.updated_at).getTime()
							);
						case "priority": {
							const priorityOrder = {
								critical: 0,
								required: 1,
								ideal: 2,
								optional: 3,
							};
							const aPriority =
								priorityOrder[a.priority as keyof typeof priorityOrder] ?? 99;
							const bPriority =
								priorityOrder[b.priority as keyof typeof priorityOrder] ?? 99;
							return aPriority - bPriority;
						}
						default:
							return b.score - a.score;
					}
				});

				// Apply pagination
				const totalResults = results.length;
				const paginatedResults = results.slice(offset, offset + limit);

				// Build metadata
				const metadata = {
					total_entities_searched: allEntities.length,
					search_params: {
						query,
						types: types || "all",
						fields: fields.length > 0 ? fields : ["name", "description"],
						fuzzy,
						case_sensitive,
						sort_by,
					},
					pagination: {
						limit,
						offset,
						has_more: offset + limit < totalResults,
						next_offset: offset + limit < totalResults ? offset + limit : null,
					},
				};

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(
								{
									success: true,
									data: {
										query,
										total_results: totalResults,
										results: paginatedResults,
										metadata,
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
