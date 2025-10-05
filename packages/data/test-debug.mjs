import { mkdirSync, rmSync } from "node:fs";
import { ValidationManager } from "./dist/managers/validation-manager.js";

const tempDir = "/tmp/test-validation-debug";
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const validationManager = new ValidationManager({
	path: tempDir,
	autoDetect: true,
	schemaValidation: true,
	referenceValidation: false,
});

const app = {
	type: "app",
	number: 1,
	slug: "test-component",
	name: "Test Component",
	description: "Test description",
	folder: ".",
	capabilities: [],
	depends_on: [],
	external_dependencies: [],
	constraints: [],
	tech_stack: [],
	testing_setup: {
		frameworks: ["Vitest"],
		coverage_target: 90,
		test_commands: {},
		test_patterns: [],
	},
	deployment: {
		platform: "Test Platform",
		environment_vars: [],
		secrets: [],
	},
	scope: {
		in_scope: [
			{
				item: "Test functionality",
				reasoning: "Core responsibility",
			},
		],
		out_of_scope: [
			{
				item: "External integrations",
				reasoning: "Handled by other components",
			},
		],
	},
	deployment_targets: [],
	environments: ["development", "staging", "production"],
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
};

const result = await validationManager.validateEntity("app", app);
console.log("Result:", JSON.stringify(result, null, 2));
