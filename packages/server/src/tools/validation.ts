import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecOperations } from "@spec-mcp/core";
import { ReferenceValidator } from "@spec-mcp/core";
import { z } from "zod";
import { wrapToolHandler } from "../utils/tool-wrapper.js";
import type { ToolContext } from "./index.js";

// NOTE: Entity type enums are duplicated inline from @spec-mcp/data because:
// 1. @spec-mcp/data uses Zod v4
// 2. @spec-mcp/server uses Zod v3 (required by MCP SDK)
// 3. Zod v3 and v4 have incompatible types
// Source of truth: EntityTypeSchema in @spec-mcp/data/core/base-entity.ts

interface ReferenceIssue {
	entity_id: string;
	type: string;
	severity: "error" | "warning";
	message: string;
	broken_references?: string[];
	suggestions?: Array<{
		reference: string;
		alternatives: string[];
		confidence: number;
	}>;
}

interface ValidationSummary {
	total_entities_checked: number;
	entities_with_errors: number;
	entities_with_warnings: number;
	total_errors: number;
	total_warnings: number;
	has_cycles: boolean;
	has_orphans: boolean;
	has_missing_references: boolean;
}

interface IssuesByType {
	missing_references: ReferenceIssue[];
	circular_dependencies: ReferenceIssue[];
	orphans: ReferenceIssue[];
	format_errors: ReferenceIssue[];
}

/**
 * Register all validation-related tools
 */
export function registerValidationTools(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	// Validate References Tool
	server.registerTool(
		"validate-references",
		{
			title: "Validate References",
			description:
				"Validate entity references across the system. Checks for missing references, circular dependencies, and orphaned entities. Can provide fix suggestions with confidence scores.",
			inputSchema: {
				entity_id: z
					.string()
					.optional()
					.describe(
						"Specific entity ID to validate (e.g., 'req-001-auth'). Omit for system-wide validation.",
					),
				type: z
					.enum(["requirement", "plan", "component", "all"])
					.optional()
					.default("all")
					.describe("Filter validation by entity type"),
				fix_suggestions: z
					.boolean()
					.optional()
					.default(true)
					.describe(
						"Include fix suggestions with confidence scores for broken references",
					),
				check_orphans: z
					.boolean()
					.optional()
					.default(true)
					.describe("Check for orphaned entities (not referenced by anything)"),
				check_cycles: z
					.boolean()
					.optional()
					.default(true)
					.describe("Check for circular dependencies"),
			},
		},
		wrapToolHandler(
			"validate-references",
			async ({
				entity_id,
				type = "all",
				fix_suggestions = true,
				check_orphans = true,
				check_cycles = true,
			}) => {
				try {
					// Get all entities for validation
					const entitiesResult = await operations.getAllEntities();

					if (!entitiesResult.success || !entitiesResult.data) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(
										{
											success: false,
											error:
												entitiesResult.error ||
												"Failed to retrieve entities for validation",
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

					// Create validator instance
					const validator = new ReferenceValidator({
						specsPath: context.config.specsPath,
					});

					// Initialize result containers
					const issues: ReferenceIssue[] = [];
					const issuesByType: IssuesByType = {
						missing_references: [],
						circular_dependencies: [],
						orphans: [],
						format_errors: [],
					};

					// Validate specific entity or all entities
					if (entity_id) {
						const validatedId = context.inputValidator.validateId(entity_id);

						// Find the entity
						const entity =
							requirements.find(
								(r) =>
									`req-${r.number.toString().padStart(3, "0")}-${r.slug}` ===
									validatedId,
							) ||
							plans.find(
								(p) =>
									`pln-${p.number.toString().padStart(3, "0")}-${p.slug}` ===
									validatedId,
							) ||
							components.find((c) => {
								const prefix =
									c.type === "app"
										? "app"
										: c.type === "service"
											? "svc"
											: c.type === "library"
												? "lib"
												: "tol";
								return (
									`${prefix}-${c.number.toString().padStart(3, "0")}-${c.slug}` ===
									validatedId
								);
							});

						if (!entity) {
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify(
											{
												success: false,
												error: `Entity '${validatedId}' not found`,
											},
											null,
											2,
										),
									},
								],
								isError: true,
							};
						}

						// Validate single entity
						const validationResult = await validator.validateEntityReferences(
							entity,
							{
								checkExistence: true,
								checkCycles: check_cycles,
								checkOrphans: check_orphans,
								allowSelfReferences: false,
							},
						);

						// Process validation errors and warnings
						for (const error of validationResult.errors) {
							const issue: ReferenceIssue = {
								entity_id: validatedId,
								type: entity.type,
								severity: "error",
								message: error,
							};

							issues.push(issue);

							// Categorize issue
							if (
								error.includes("non-existent") ||
								error.includes("not found")
							) {
								issuesByType.missing_references.push(issue);
							} else if (
								error.includes("circular") ||
								error.includes("cyclical")
							) {
								issuesByType.circular_dependencies.push(issue);
							} else if (error.includes("format")) {
								issuesByType.format_errors.push(issue);
							}
						}

						for (const warning of validationResult.warnings) {
							const issue: ReferenceIssue = {
								entity_id: validatedId,
								type: entity.type,
								severity: "warning",
								message: warning,
							};

							issues.push(issue);

							if (warning.includes("not referenced")) {
								issuesByType.orphans.push(issue);
							}
						}

						// Get fix suggestions if requested
						if (fix_suggestions && !validationResult.valid) {
							const fixSuggestions =
								await validator.suggestReferenceFixes(entity);

							// Add suggestions to issues with confidence scores
							for (const missing of fixSuggestions.missingReferences) {
								const relatedIssue = issuesByType.missing_references.find(
									(i) =>
										i.message.includes(missing.reference) &&
										i.entity_id === validatedId,
								);

								if (relatedIssue) {
									relatedIssue.suggestions = missing.suggestions.map((alt) => ({
										reference: alt,
										alternatives: [alt],
										confidence: calculateConfidence(missing.reference, alt),
									}));
								}
							}
						}
					} else {
						// System-wide validation
						const allEntities = [...requirements, ...plans, ...components];

						// Filter by type if specified
						const entitiesToValidate =
							type === "all"
								? allEntities
								: allEntities.filter((e) => {
										if (type === "component") {
											return ["app", "service", "library", "tool"].includes(
												e.type,
											);
										}
										return e.type === type;
									});

						// Validate all references using the validator
						const brokenRefs = await validator.findBrokenReferences();

						// Process broken requirements references
						for (const reqIssue of brokenRefs.requirements) {
							const issue: ReferenceIssue = {
								entity_id: reqIssue.id,
								type: "requirement",
								severity: "error",
								message: `Requirement has ${reqIssue.brokenRefs.length} broken reference(s)`,
								broken_references: reqIssue.brokenRefs,
							};
							issues.push(issue);
							issuesByType.missing_references.push(issue);
						}

						// Process broken plan references
						for (const planIssue of brokenRefs.plans) {
							const issue: ReferenceIssue = {
								entity_id: planIssue.id,
								type: "plan",
								severity: "error",
								message: `Plan has ${planIssue.brokenRefs.length} broken reference(s)`,
								broken_references: planIssue.brokenRefs,
							};
							issues.push(issue);
							issuesByType.missing_references.push(issue);
						}

						// Process broken component references
						for (const compIssue of brokenRefs.components) {
							const issue: ReferenceIssue = {
								entity_id: compIssue.id,
								type: "component",
								severity: "error",
								message: `Component has ${compIssue.brokenRefs.length} broken reference(s)`,
								broken_references: compIssue.brokenRefs,
							};
							issues.push(issue);
							issuesByType.missing_references.push(issue);
						}

						// Check for cycles if requested
						if (check_cycles) {
							const cycleResult = await operations.detectCycles();
							if (cycleResult.success && cycleResult.data?.hasCycles) {
								for (const cycle of cycleResult.data.cycles || []) {
									const issue: ReferenceIssue = {
										entity_id: cycle[0] || "unknown",
										type: "unknown",
										severity: "error",
										message: `Circular dependency: ${cycle.join(" -> ")}`,
									};
									issues.push(issue);
									issuesByType.circular_dependencies.push(issue);
								}
							}
						}

						// Check for orphans if requested
						if (check_orphans) {
							const orphanResult = await operations.detectOrphans();
							if (orphanResult.success && orphanResult.data) {
								for (const orphanId of orphanResult.data.orphans || []) {
									const issue: ReferenceIssue = {
										entity_id: orphanId,
										type: "unknown",
										severity: "warning",
										message: "Entity is not referenced by any other entity",
									};
									issues.push(issue);
									issuesByType.orphans.push(issue);
								}
							}
						}

						// Add fix suggestions if requested
						if (fix_suggestions) {
							for (const issue of issuesByType.missing_references) {
								if (!issue.broken_references) continue;

								const entity = entitiesToValidate.find((e) => {
									const entityId = getEntityId(e);
									return entityId === issue.entity_id;
								});

								if (!entity) continue;

								const fixSuggestions =
									await validator.suggestReferenceFixes(entity);

								issue.suggestions = [];
								for (const missing of fixSuggestions.missingReferences) {
									if (issue.broken_references.includes(missing.reference)) {
										for (const alt of missing.suggestions) {
											issue.suggestions.push({
												reference: missing.reference,
												alternatives: [alt],
												confidence: calculateConfidence(missing.reference, alt),
											});
										}
									}
								}
							}
						}
					}

					// Build summary
					const summary: ValidationSummary = {
						total_entities_checked: entity_id
							? 1
							: type === "all"
								? requirements.length + plans.length + components.length
								: type === "requirement"
									? requirements.length
									: type === "plan"
										? plans.length
										: components.length,
						entities_with_errors: new Set(
							issues
								.filter((i) => i.severity === "error")
								.map((i) => i.entity_id),
						).size,
						entities_with_warnings: new Set(
							issues
								.filter((i) => i.severity === "warning")
								.map((i) => i.entity_id),
						).size,
						total_errors: issues.filter((i) => i.severity === "error").length,
						total_warnings: issues.filter((i) => i.severity === "warning")
							.length,
						has_cycles: issuesByType.circular_dependencies.length > 0,
						has_orphans: issuesByType.orphans.length > 0,
						has_missing_references: issuesByType.missing_references.length > 0,
					};

					// Build response
					const responseData = {
						summary,
						valid: summary.total_errors === 0,
						issues: issues,
						issues_by_type: {
							missing_references: issuesByType.missing_references.length,
							circular_dependencies: issuesByType.circular_dependencies.length,
							orphans: issuesByType.orphans.length,
							format_errors: issuesByType.format_errors.length,
						},
						details: {
							missing_references: issuesByType.missing_references.slice(0, 20),
							circular_dependencies: issuesByType.circular_dependencies.slice(
								0,
								10,
							),
							orphans: issuesByType.orphans.slice(0, 20),
							format_errors: issuesByType.format_errors.slice(0, 10),
						},
					};

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: true,
										data: responseData,
									},
									null,
									2,
								),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error:
											error instanceof Error
												? error.message
												: "Reference validation failed",
									},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}
			},
			context,
		),
	);
}

/**
 * Calculate confidence score for a fix suggestion using string similarity
 */
function calculateConfidence(original: string, suggestion: string): number {
	const maxLength = Math.max(original.length, suggestion.length);
	if (maxLength === 0) return 1;

	const distance = levenshteinDistance(original, suggestion);
	const similarity = 1 - distance / maxLength;

	// Scale to 0-100 and round
	return Math.round(similarity * 100);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
		Array.from({ length: a.length + 1 }, () => 0),
	);

	// Initialize first column
	for (let i = 0; i <= b.length; i++) {
		matrix[i]![0] = i;
	}

	// Initialize first row
	for (let j = 0; j <= a.length; j++) {
		matrix[0]![j] = j;
	}

	// Fill the matrix
	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i]![j] = matrix[i - 1]![j - 1]!;
			} else {
				matrix[i]![j] = Math.min(
					matrix[i - 1]![j - 1]! + 1,
					matrix[i]![j - 1]! + 1,
					matrix[i - 1]![j]! + 1,
				);
			}
		}
	}

	return matrix[b.length]![a.length]!;
}

/**
 * Get entity ID from any entity
 */
function getEntityId(entity: {
	type: string;
	number: number;
	slug: string;
}): string {
	switch (entity.type) {
		case "requirement":
			return `req-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
		case "plan":
			return `pln-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
		case "app":
			return `app-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
		case "service":
			return `svc-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
		case "library":
			return `lib-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
		case "tool":
			return `tol-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
		default:
			return `unknown-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
	}
}
