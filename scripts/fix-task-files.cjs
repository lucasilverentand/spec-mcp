#!/usr/bin/env node

/**
 * Fix task files that are strings instead of file objects
 * Converts: files: ["path/to/file"]
 * To: files: [{ id: "file-001", path: "path/to/file", action: "modify", applied: false }]
 */

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const SPECS_DIR = path.join(process.cwd(), "specs/plans");

const FILES_TO_FIX = [
	"pln-5-environment-file-security-configuration.yml",
	"pln-17-create-env-example-template-files-for-all-applications.yml",
];

function fixTaskFiles(filePath) {
	console.log("\n📝 Fixing:", filePath);

	const content = fs.readFileSync(filePath, "utf-8");
	const data = yaml.load(content);

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

		const hasStringFiles = task.files.some((f) => typeof f === "string");

		if (hasStringFiles) {
			console.log("  🔧 Fixing task", task.id, "files...");
			task.files = task.files.map((file) => {
				if (typeof file === "string") {
					const fileObj = {
						id: `file-${String(fileCounter).padStart(3, "0")}`,
						path: file,
						action: "modify",
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
		const newContent = yaml.dump(data, { lineWidth: -1, noRefs: true });
		fs.writeFileSync(filePath, newContent, "utf-8");
		console.log("  ✅ Fixed successfully");
	} else {
		console.log("  ℹ️  No changes needed");
	}
}

console.log("🔨 Fixing task files in plan files...\n");

for (const filename of FILES_TO_FIX) {
	const filePath = path.join(SPECS_DIR, filename);
	try {
		fixTaskFiles(filePath);
	} catch (error) {
		console.error("  ❌ Error fixing", `${filename}:`, error.message);
	}
}

console.log("\n✨ Done!\n");
