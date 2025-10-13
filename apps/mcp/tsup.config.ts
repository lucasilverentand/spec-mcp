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
	// Bundle workspace dependencies
	noExternal: [/@spec-mcp\/.*/],
	// Keep external dependencies that have issues with bundling
	external: ["@modelcontextprotocol/sdk", "yaml", "pino", "ws", "chokidar"],
	treeshake: true,
	splitting: false,
	minify: false, // Keep readable for debugging
	outDir: "dist",
	shims: true, // Add Node.js shims for better compatibility
});
