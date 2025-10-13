#!/usr/bin/env ts-node

/**
 * Fix task files that are strings instead of file objects
 * Converts: files: ["path/to/file"]
 * To: files: [{ id: "file-001", path: "path/to/file", action: "modify", applied: false }]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

const SPECS_DIR = join(process.cwd(), "specs/plans");

// Files to fix based on validation output
const FILES_TO_FIX = [
	"pln-5-environment-file-security-configuration.yml",
	"pln-17-create-env-example-template-files-for-all-applications.yml",
];

function fixTaskFiles(filePath: string): void {
	console.log(`\n📝 Fixing: ${filePath}`);

	const content = readFileSync(filePath, "utf-8");
	const data = YAML.parse(content);

	if (!data.tasks || !Array.isArray(data.tasks)) {
		console.log("  ⚠️  No tasks found, skipping");
		return;
	}

	let fileCounter = 1;
	let modified = false;

	for (const task of data.tasks) {
		if (!task.files || !Array.isArray(task.files)) {
			continue;
		}

		// Check if files are strings
		const hasStringFiles = task.files.some(
			(f: unknown) => typeof f === "string",
		);

		if (hasStringFiles) {
			console.log(`  🔧 Fixing task ${task.id} files...`);
			task.files = task.files.map((file: unknown) => {
				if (typeof file === "string") {
					// Convert string to file object
					const fileObj = {
						id: `file-${String(fileCounter).padStart(3, "0")}`,
						path: file,
						action: "modify" as const,
						action_description: undefined,
						applied: false,
					};
					fileCounter++;
					return fileObj;
				}
				return file;
			});
			modified = true;
		}
	}

	if (modified) {
		// Write back to file
		const newContent = YAML.stringify(data, {
			lineWidth: 0, // Disable line wrapping
			defaultStringType: "PLAIN",
		});
		writeFileSync(filePath, newContent, "utf-8");
		console.log(`  ✅ Fixed successfully`);
	} else {
		console.log(`  ℹ️  No changes needed`);
	}
}

// Main
console.log("🔨 Fixing task files in plan files...\n");

for (const filename of FILES_TO_FIX) {
	const filePath = join(SPECS_DIR, filename);
	try {
		fixTaskFiles(filePath);
	} catch (error) {
		console.error(`  ❌ Error fixing ${filename}:`, error);
	}
}

console.log("\n✨ Done!\n");
