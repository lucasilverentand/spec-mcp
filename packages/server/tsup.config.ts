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
	// Bundle workspace dependencies (@spec-mcp/core, @spec-mcp/data)
	noExternal: [/@spec-mcp\/.*/],
	// Keep external dependencies that have CommonJS issues
	external: [
		"@modelcontextprotocol/sdk",
		"yaml",
		"glob",
		"pino",
		"pino-pretty",
		"zod",
	],
	treeshake: true,
	splitting: false,
	minify: false, // Keep readable for debugging
	outDir: "dist",
	shims: true, // Add Node.js shims for better compatibility
});
