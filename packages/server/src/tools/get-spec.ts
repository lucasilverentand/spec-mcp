import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import type {
	BusinessRequirement,
	Component,
	Constitution,
	Decision,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { isCompleted, isVerified } from "@spec-mcp/schemas";
import yaml from "yaml";

type Entity =
	| Plan
	| BusinessRequirement
	| TechnicalRequirement
	| Decision
	| Component
	| Constitution;

/**
 * Format entity as markdown
 */
function formatAsMarkdown(entity: Entity): string {
	const lines: string[] = [];

	// Header
	lines.push(`# ${entity.name}`);
	lines.push("");
	lines.push(`**Type:** ${entity.type}`);
	lines.push(`**Number:** ${entity.number}`);
	lines.push(`**Slug:** ${entity.slug}`);
	lines.push(`**Priority:** ${entity.priority}`);
	lines.push("");

	// Description
	lines.push("## Description");
	lines.push("");
	lines.push(entity.description);
	lines.push("");

	// Metadata
	lines.push("## Metadata");
	lines.push("");
	lines.push(`- **Created:** ${entity.created_at}`);
	lines.push(`- **Updated:** ${entity.updated_at}`);
	lines.push("");

	// Type-specific fields
	if (entity.type === "plan") {
		// Criteria
		if (entity.criteria) {
			lines.push("## Acceptance Criteria");
			lines.push("");
			lines.push(`- **Requirement:** ${entity.criteria.requirement}`);
			lines.push(`- **Criteria:** ${entity.criteria.criteria}`);
			lines.push("");
		}

		// Scope
		if (entity.scope && entity.scope.length > 0) {
			lines.push("## Scope");
			lines.push("");
			const inScope = entity.scope.filter((s) => s.type === "in-scope");
			const outOfScope = entity.scope.filter((s) => s.type === "out-of-scope");

			if (inScope.length > 0) {
				lines.push("### In Scope:");
				for (const item of inScope) {
					lines.push(`- ${item.description}`);
					if (item.rationale) {
						lines.push(`  *${item.rationale}*`);
					}
				}
				lines.push("");
			}
			if (outOfScope.length > 0) {
				lines.push("### Out of Scope:");
				for (const item of outOfScope) {
					lines.push(`- ${item.description}`);
					if (item.rationale) {
						lines.push(`  *${item.rationale}*`);
					}
				}
				lines.push("");
			}
		}

		// Dependencies
		if (entity.depends_on && entity.depends_on.length > 0) {
			lines.push("## Dependencies");
			lines.push("");
			for (const dep of entity.depends_on) {
				lines.push(`- ${dep}`);
			}
			lines.push("");
		}

		// Tasks
		if (entity.tasks && entity.tasks.length > 0) {
			lines.push("## Tasks");
			lines.push("");
			for (const task of entity.tasks) {
				const statusIcon = isVerified(task.status)
					? "✓✓"
					: isCompleted(task.status)
						? "✓"
						: "○";
				lines.push(`### ${statusIcon} ${task.id}: ${task.task}`);
				lines.push("");
				lines.push(`**Priority:** ${task.priority}`);
				if (task.depends_on && task.depends_on.length > 0) {
					lines.push(`**Depends on:** ${task.depends_on.join(", ")}`);
				}
				if (task.considerations && task.considerations.length > 0) {
					lines.push("");
					lines.push("**Considerations:**");
					for (const consideration of task.considerations) {
						lines.push(`- ${consideration}`);
					}
				}
				if (task.files && task.files.length > 0) {
					lines.push("");
					lines.push("**Files:**");
					for (const file of task.files) {
						const applied = file.applied ? "✓" : "○";
						lines.push(`- ${applied} ${file.action} \`${file.path}\``);
						if (file.action_description) {
							lines.push(`  ${file.action_description}`);
						}
					}
				}
				lines.push("");
			}
		}

		// Flows
		if (entity.flows && entity.flows.length > 0) {
			lines.push("## Flows");
			lines.push("");
			for (const flow of entity.flows) {
				lines.push(`### ${flow.id}: ${flow.name}`);
				lines.push("");
				if (flow.description) {
					lines.push(flow.description);
					lines.push("");
				}
				if (flow.steps && flow.steps.length > 0) {
					lines.push("**Steps:**");
					for (let i = 0; i < flow.steps.length; i++) {
						const step = flow.steps[i];
						if (step) {
							lines.push(`${i + 1}. ${step.name}`);
							if (step.description) {
								lines.push(`   ${step.description}`);
							}
						}
					}
					lines.push("");
				}
			}
		}

		// Test Cases
		if (entity.test_cases && entity.test_cases.length > 0) {
			lines.push("## Test Cases");
			lines.push("");
			for (const testCase of entity.test_cases) {
				const statusIcon = testCase.passing
					? "✓"
					: testCase.implemented
						? "○"
						: "✗";
				lines.push(`### ${statusIcon} ${testCase.id}: ${testCase.name}`);
				lines.push("");
				lines.push(testCase.description);
				lines.push("");
			}
		}

		// API Contracts
		if (entity.api_contracts && entity.api_contracts.length > 0) {
			lines.push("## API Contracts");
			lines.push("");
			for (const contract of entity.api_contracts) {
				lines.push(`### ${contract.id}: ${contract.name}`);
				lines.push("");
				lines.push(`**Description:** ${contract.description}`);
				lines.push("");
			}
		}

		// Data Models
		if (entity.data_models && entity.data_models.length > 0) {
			lines.push("## Data Models");
			lines.push("");
			for (const model of entity.data_models) {
				lines.push(`### ${model.id}: ${model.name}`);
				lines.push("");
				lines.push(model.description);
				lines.push("");
			}
		}

		// References
		if (entity.references && entity.references.length > 0) {
			lines.push("## References");
			lines.push("");
			for (const ref of entity.references) {
				if (ref.type === "url") {
					lines.push(`- [${ref.name}](${ref.url})`);
				} else if (ref.type === "file") {
					lines.push(`- [${ref.name}](${ref.path})`);
				} else {
					lines.push(`- ${ref.name}`);
				}
				if (ref.description) {
					lines.push(`  ${ref.description}`);
				}
			}
			lines.push("");
		}
	}

	// For other entity types, add type-specific fields as needed
	// This can be extended based on the specific requirements

	return lines.join("\n");
}

/**
 * Get a spec entity by ID and return it in the requested format
 */
export async function getSpec(
	specManager: SpecManager,
	id: string,
	format: "yaml" | "markdown" = "markdown",
): Promise<CallToolResult> {
	try {
		// Validate and find the entity
		const result = await validateEntity(specManager, id);

		if (!result.valid || !result.entity) {
			return {
				content: [
					{
						type: "text",
						text: `Failed to retrieve entity: ${result.errors?.join(", ") || "Entity not found"}`,
					},
				],
				isError: true,
			};
		}

		const entity = result.entity as Entity;

		let output: string;
		if (format === "yaml") {
			output = yaml.stringify(entity);
		} else {
			output = formatAsMarkdown(entity);
		}

		return {
			content: [
				{
					type: "text",
					text: output,
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error retrieving entity: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}

export const getSpecTool = {
	name: "get_spec",
	description:
		"Retrieve a spec entity by its ID and display it in markdown or YAML format. Accepts formats: typ-123, typ-123-slug-here, or typ-123-slug-here.yml",
	inputSchema: {
		type: "object",
		properties: {
			id: {
				type: "string",
				description:
					"Entity identifier. Accepts: typ-123, typ-123-slug-here, or typ-123-slug-here.yml",
			},
			format: {
				type: "string",
				enum: ["yaml", "markdown"],
				description:
					"Output format. 'markdown' for human-readable format, 'yaml' for raw data. Default: markdown",
				default: "markdown",
			},
		},
		required: ["id"],
	} as const,
};
