import type { SpecManager } from "@spec-mcp/core";

/**
 * Get all validation warnings from loaded spec files
 * Shows files that exist but failed schema validation
 */
export async function getValidationWarnings(specManager: SpecManager): Promise<{
	content: Array<{ type: string; text: string }>;
}> {
	// First, trigger loading of all entities to collect warnings
	await specManager.business_requirements.list();
	await specManager.tech_requirements.list();
	await specManager.plans.list();
	await specManager.components.list();
	await specManager.constitutions.list();
	await specManager.decisions.list();
	await specManager.milestones.list();

	// Now collect all warnings
	const warnings = await specManager.getAllValidationWarnings();

	if (warnings.length === 0) {
		return {
			content: [
				{
					type: "text",
					text: "✓ No validation warnings found. All spec files are valid.",
				},
			],
		};
	}

	// Format warnings as a readable report
	let report = `# Validation Warnings\n\n`;
	report += `Found ${warnings.length} file(s) with validation errors:\n\n`;

	for (const warning of warnings) {
		report += `## ${warning.fileName}\n`;
		report += `- **Type:** ${warning.entityType}\n`;
		report += `- **Path:** ${warning.filePath}\n`;
		report += `- **Error:** ${warning.error}\n\n`;

		// If details are available and it's a Zod error with issues array
		if (warning.details && typeof warning.details === "object") {
			const details = warning.details as Record<string, unknown>;
			if (details.issues && Array.isArray(details.issues)) {
				report += `**Validation Details:**\n`;
				for (const issue of details.issues) {
					const path = (issue as { path?: string[] }).path?.join(".") || "root";
					const message =
						(issue as { message?: string }).message || "Unknown error";
					report += `  - \`${path}\`: ${message}\n`;
				}
				report += "\n";
			}
		}
	}

	report += `\n## Recommendations\n\n`;
	report += `These files exist but don't match the current schema. Common issues:\n\n`;
	report += `1. **Outdated schema format:** The file may use an old version of the schema\n`;
	report += `2. **Missing required fields:** Check that all required fields are present\n`;
	report += `3. **Invalid field types:** Ensure field values match expected types\n`;
	report += `4. **Draft files:** Draft files (.draft.yml) have a different structure\n\n`;
	report += `To fix these issues:\n`;
	report += `- Review the validation details above\n`;
	report += `- Check the schema documentation for the correct format\n`;
	report += `- Update the files to match the current schema\n`;
	report += `- Or delete invalid files if they're no longer needed\n`;

	return {
		content: [
			{
				type: "text",
				text: report,
			},
		],
	};
}

export const getValidationWarningsTool = {
	name: "get_validation_warnings",
	description:
		"Get validation warnings for all spec files. Returns files that exist but failed schema validation, helping identify specs that need to be fixed or updated.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
};
