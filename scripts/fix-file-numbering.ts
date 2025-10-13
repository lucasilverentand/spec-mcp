#!/usr/bin/env tsx

/**
 * Script to rename all spec files to use left-padded 3-digit numbers
 * Example: con-1-foo.yml -> con-001-foo.yml
 */

import { readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

const SPECS_DIR = "./specs";
const ID_NUMBER_PADDING = 3;

// Entity type prefixes
const PREFIXES = ["brd", "prd", "pln", "cmp", "con", "dec", "mls"];

interface FileToRename {
	oldPath: string;
	newPath: string;
	oldName: string;
	newName: string;
}

function padNumber(num: number): string {
	return String(num).padStart(ID_NUMBER_PADDING, "0");
}

function findFilesToRename(dir: string): FileToRename[] {
	const results: FileToRename[] = [];

	function traverse(currentDir: string) {
		const entries = readdirSync(currentDir);

		for (const entry of entries) {
			const fullPath = join(currentDir, entry);
			const stat = statSync(fullPath);

			if (stat.isDirectory()) {
				traverse(fullPath);
			} else if (entry.endsWith(".yml") || entry.endsWith(".yaml")) {
				// Check if filename matches pattern: prefix-N-... or prefix-NN-...
				const match = entry.match(/^([a-z]{3})-(\d{1,2})(-.*)?$/);

				if (match) {
					const [, prefix, numberStr, rest] = match;

					// Check if this is a known prefix
					if (prefix && PREFIXES.includes(prefix)) {
						const num = Number.parseInt(numberStr!, 10);

						// Check if number is not already 3 digits
						if (numberStr!.length < 3) {
							const paddedNumber = padNumber(num);
							const newName = `${prefix}-${paddedNumber}${rest || ""}`;
							const newPath = join(currentDir, newName);

							results.push({
								oldPath: fullPath,
								newPath: newPath,
								oldName: entry,
								newName: newName,
							});
						}
					}
				}
			}
		}
	}

	traverse(dir);
	return results;
}

function main() {
	console.log("🔍 Scanning for files with non-padded numbers...\n");

	const filesToRename = findFilesToRename(SPECS_DIR);

	if (filesToRename.length === 0) {
		console.log("✅ All files already use 3-digit padded numbers!");
		return;
	}

	console.log(`Found ${filesToRename.length} files to rename:\n`);

	// Group by prefix for better display
	const byPrefix = new Map<string, FileToRename[]>();
	for (const file of filesToRename) {
		const prefix = file.oldName.split("-")[0]!;
		if (!byPrefix.has(prefix)) {
			byPrefix.set(prefix, []);
		}
		byPrefix.get(prefix)!.push(file);
	}

	// Display grouped files
	for (const [prefix, files] of byPrefix) {
		console.log(`\n${prefix.toUpperCase()}:`);
		for (const file of files) {
			console.log(`  ${file.oldName} → ${file.newName}`);
		}
	}

	console.log("\n🔄 Renaming files...\n");

	let successCount = 0;
	let errorCount = 0;

	for (const file of filesToRename) {
		try {
			renameSync(file.oldPath, file.newPath);
			console.log(`✓ ${file.oldName} → ${file.newName}`);
			successCount++;
		} catch (error) {
			console.error(`✗ Failed to rename ${file.oldName}:`, error);
			errorCount++;
		}
	}

	console.log(
		`\n✅ Complete! ${successCount} files renamed, ${errorCount} errors`,
	);
}

main();
