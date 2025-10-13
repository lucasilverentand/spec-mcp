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
		"ws",
		"chokidar",
	],
	treeshake: true,
	splitting: false,
	minify: false, // Keep readable for debugging
	outDir: "dist",
	shims: true, // Add Node.js shims for better compatibility
});
