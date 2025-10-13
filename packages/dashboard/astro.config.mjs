import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: node({ mode: "middleware" }),
	integrations: [
		react(),
		tailwind({
			applyBaseStyles: false,
		}),
	],
	server: {
		port: 3737,
		host: "localhost",
	},
	vite: {
		optimizeDeps: {
			exclude: ["@spec-mcp/core", "@spec-mcp/schemas"],
		},
	},
});
