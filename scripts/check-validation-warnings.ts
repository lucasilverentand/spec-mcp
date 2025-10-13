#!/usr/bin/env tsx

/**
 * Check for validation warnings in spec files
 * This script loads all spec files and reports any that fail schema validation
 */

import { join } from "node:path";
import { SpecManager } from "@spec-mcp/core";

const SPECS_DIR = join(process.cwd(), "specs");

async function main() {
	console.log("🔍 Checking for validation warnings in spec files...\n");

	const specManager = new SpecManager(SPECS_DIR);

	// Trigger loading of all entities to collect warnings
	console.log("Loading business requirements...");
	await specManager.business_requirements.list();

	console.log("Loading technical requirements...");
	await specManager.tech_requirements.list();

	console.log("Loading plans...");
	await specManager.plans.list();

	console.log("Loading components...");
	await specManager.components.list();

	console.log("Loading constitutions...");
	await specManager.constitutions.list();

	console.log("Loading decisions...");
	await specManager.decisions.list();

	console.log("Loading milestones...");
	await specManager.milestones.list();

	console.log("\n");

	// Collect all warnings
	const warnings = await specManager.getAllValidationWarnings();

	if (warnings.length === 0) {
		console.log("✅ No validation warnings found. All spec files are valid!");
		process.exit(0);
	}

	console.log(`⚠️  Found ${warnings.length} file(s) with validation errors:\n`);

	for (const warning of warnings) {
		console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
		console.log(`📄 File: ${warning.fileName}`);
		console.log(`📂 Path: ${warning.filePath}`);
		console.log(`🔴 Type: ${warning.entityType}`);
		console.log(`❌ Error: ${warning.error}`);

		// If details are available and it's a Zod error with issues array
		if (warning.details && typeof warning.details === "object") {
			const details = warning.details as Record<string, unknown>;
			if (details.issues && Array.isArray(details.issues)) {
				console.log(`\n📋 Validation Details:`);
				for (const issue of details.issues) {
					const path = (issue as { path?: string[] }).path?.join(".") || "root";
					const message =
						(issue as { message?: string }).message || "Unknown error";
					console.log(`   • ${path}: ${message}`);
				}
			}
		}
	}

	console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
	console.log(`\n💡 Recommendations:\n`);
	console.log(
		`These files exist but don't match the current schema. Common issues:\n`,
	);
	console.log(
		`1. Outdated schema format: The file may use an old version of the schema`,
	);
	console.log(
		`2. Missing required fields: Check that all required fields are present`,
	);
	console.log(
		`3. Invalid field types: Ensure field values match expected types`,
	);
	console.log(
		`4. Draft files: Draft files (.draft.yml) have a different structure\n`,
	);
	console.log(`To fix these issues:`);
	console.log(`- Review the validation details above`);
	console.log(`- Check the schema documentation for the correct format`);
	console.log(`- Update the files to match the current schema`);
	console.log(`- Or delete invalid files if they're no longer needed\n`);

	process.exit(1);
}

main().catch((error) => {
	console.error("❌ Script failed:", error);
	process.exit(2);
});
