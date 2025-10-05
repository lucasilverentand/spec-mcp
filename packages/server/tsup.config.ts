import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	bundle: true,
	platform: "node",
	target: "node18",
	// Bundle workspace dependencies and zod (to avoid version conflicts)
	noExternal: [/@spec-mcp\/.*/, "zod"],
	// Keep external dependencies that have CommonJS issues
	external: [
		"@modelcontextprotocol/sdk",
		"yaml",
		"glob",
		"pino",
		"pino-pretty",
	],
	treeshake: true,
	splitting: false,
	minify: false, // Keep readable for debugging
	outDir: "dist",
	shims: true, // Add Node.js shims for better compatibility
	async onSuccess() {
		// Copy guides to dist directory
		const guidesSourceDir = join(process.cwd(), "../../docs/guides");
		const guidesDestDir = join(process.cwd(), "dist/guides");

		mkdirSync(guidesDestDir, { recursive: true });

		const guideFiles = [
			"getting-started.md",
			"planning-workflow.md",
			"implementation-workflow.md",
			"best-practices.md",
			"query-guide.md",
		];

		for (const file of guideFiles) {
			const src = join(guidesSourceDir, file);
			const dest = join(guidesDestDir, file);
			copyFileSync(src, dest);
		}

		console.log("✓ Copied guide files to dist/guides");
	},
});
