import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
		passWithNoTests: true, // Allow passing when no tests are found
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "dist/", ".astro/"],
		},
	},
});
