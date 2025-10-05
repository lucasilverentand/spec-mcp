import z from "zod";
import { BaseSchema, computeEntityId } from "../../core/base-entity.js";
import { ComponentScopeSchema } from "../shared/scope-schema.js";
import { DeploymentSchema } from "../shared/deployment-schema.js";

export const ComponentIdSchema = z
	.string()
	.regex(/^(app|svc|lib)-\d{3}-[a-z0-9-]+$/, {
		message: "Component ID must follow format: (app|svc|lib)-XXX-slug",
	})
	.describe("Unique identifier for the component");

export const ComponentTypeSchema = z.enum([
	"app",
	"service",
	"library",
]);

export const TestSuiteSchema = z.object({
	location: z
		.string()
		.min(1)
		.describe("Directory or pattern where tests are located"),
	pattern: z
		.string()
		.min(1)
		.optional()
		.describe("Test file pattern (e.g., '*.test.ts', '*.spec.js')"),
	coverage_target: z
		.number()
		.min(0)
		.max(100)
		.optional()
		.describe("Target coverage percentage for this test suite"),
});

export const TestingSetupSchema = z.object({
	frameworks: z
		.array(z.string())
		.min(1)
		.describe("Testing frameworks used (e.g., Jest, Vitest, Pytest)"),
	unit_tests: TestSuiteSchema.optional().describe(
		"Unit test configuration and location",
	),
	integration_tests: TestSuiteSchema.optional().describe(
		"Integration test configuration and location",
	),
	e2e_tests: TestSuiteSchema.optional().describe(
		"End-to-end test configuration and location",
	),
	coverage_target: z
		.number()
		.min(0)
		.max(100)
		.default(90)
		.describe("Overall test coverage target percentage"),
	test_commands: z
		.record(z.string())
		.default({})
		.describe(
			"Commands to run different test suites (e.g., {'unit': 'npm test', 'e2e': 'npm run test:e2e'})",
		),
	mocking_strategy: z
		.string()
		.min(1)
		.optional()
		.describe(
			"Approach to mocking external dependencies (e.g., 'jest.mock() for all external deps', 'test containers for databases')",
		),
	test_patterns: z
		.array(z.string())
		.default([])
		.describe(
			"Testing patterns followed (e.g., 'AAA', 'Given-When-Then', 'Test Pyramid')",
		),
});

const _BaseComponentStorageSchema = BaseSchema.extend({
	type: ComponentTypeSchema.describe("Type of the component"),
	folder: z
		.string()
		.min(1)
		.default(".")
		.describe("Relative path from repository root"),
	tech_stack: z
		.array(z.string())
		.default([])
		.describe("Technologies and frameworks used in this component"),
	testing_setup: TestingSetupSchema.optional().describe(
		"Testing configuration including frameworks, patterns, coverage targets, and test organization",
	),
	deployment: DeploymentSchema.describe(
		"Deployment configuration including platform, URLs, commands, and environment variables",
	),
	scope: ComponentScopeSchema.describe(
		"Explicit scope definition with in-scope and out-of-scope items with reasoning",
	),
	depends_on: z
		.array(ComponentIdSchema)
		.default([])
		.describe("Other components this component relies on"),
	external_dependencies: z
		.array(z.string())
		.default([])
		.describe("Third-party services or libraries used"),
});

// Storage schemas (no ID field)
export const AppComponentStorageSchema = _BaseComponentStorageSchema.extend({
	type: z.literal("app"),
	deployment_targets: z
		.array(z.enum(["ios", "android", "web", "desktop", "api"]))
		.default([])
		.describe("Deployment targets for the application"),
	environments: z
		.array(z.enum(["development", "staging", "production"]))
		.default(["development", "staging", "production"])
		.describe("Environment-specific configuration"),
}).strict();

export const ServiceComponentStorageSchema = _BaseComponentStorageSchema.extend(
	{
		type: z.literal("service"),
		dev_port: z
			.number()
			.min(1)
			.max(65535)
			.optional()
			.describe("Local development port"),
	},
).strict();

export const LibraryComponentStorageSchema = _BaseComponentStorageSchema.extend(
	{
		type: z.literal("library"),
		package_name: z.string().min(1).optional(),
	},
).strict();

// Runtime schemas (with computed ID)
export const AppComponentSchema = AppComponentStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
);

export const ServiceComponentSchema = ServiceComponentStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
);

export const LibraryComponentSchema = LibraryComponentStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
);

export type ComponentId = z.infer<typeof ComponentIdSchema>;
export type ComponentType = z.infer<typeof ComponentTypeSchema>;
export type TestSuite = z.infer<typeof TestSuiteSchema>;
export type TestingSetup = z.infer<typeof TestingSetupSchema>;
export type AppComponent = z.infer<typeof AppComponentSchema>;
export type ServiceComponent = z.infer<typeof ServiceComponentSchema>;
export type LibraryComponent = z.infer<typeof LibraryComponentSchema>;

export type AnyComponent =
	| AppComponent
	| ServiceComponent
	| LibraryComponent;
