import { describe, expect, it } from "vitest";
import {
	AppComponentSchema,
	ComponentIdSchema,
	type ComponentType,
	ComponentTypeSchema,
	LibraryComponentSchema,
	ServiceComponentSchema,
} from "../../../src/entities/components/component.js";

const minimalTestingSetup = {
	frameworks: ["Vitest"],
	coverage_target: 90,
	test_commands: {},
	test_patterns: [],
};

const minimalDeployment = {
	platform: "Test Platform",
};

const minimalScope = {
	in_scope: [
		{
			item: "Test functionality",
			reasoning: "Core responsibility of this component",
		},
	],
	out_of_scope: [
		{
			item: "External integrations",
			reasoning: "Handled by other components",
		},
	],
};

describe("ComponentIdSchema", () => {
	it("should accept valid component IDs", () => {
		const validIds = [
			"app-001-frontend-app",
			"svc-042-auth-service",
			"lib-999-utility-library",
		];

		for (const id of validIds) {
			expect(() => ComponentIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid component IDs", () => {
		const invalidIds = [
			"component-001-test", // wrong prefix
			"app-1-test", // number not padded
			"svc-001", // missing slug
			"lib-001-", // empty slug
			"tool-001-Test", // uppercase in slug
			"app-001-test space", // space in slug
			"svc-abc-test", // non-numeric number
			"invalid-001-test", // invalid type prefix
			"", // empty
		];

		for (const id of invalidIds) {
			expect(() => ComponentIdSchema.parse(id)).toThrow();
		}
	});
});

describe("ComponentTypeSchema", () => {
	it("should accept valid component types", () => {
		const validTypes: ComponentType[] = ["app", "service", "library"];

		for (const type of validTypes) {
			expect(() => ComponentTypeSchema.parse(type)).not.toThrow();
		}
	});

	it("should reject invalid component types", () => {
		const invalidTypes = [
			"application",
			"svc",
			"lib",
			"component",
			"",
			null,
			undefined,
		];

		for (const type of invalidTypes) {
			expect(() => ComponentTypeSchema.parse(type)).toThrow();
		}
	});
});

describe("AppComponentSchema", () => {
	it("should accept minimal valid app component", () => {
		const validApp = {
			type: "app" as const,
			number: 1,
			slug: "frontend-app",
			name: "Frontend Application",
			description: "Main frontend application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		const parsed = AppComponentSchema.parse(validApp);
		expect(parsed.id).toBe("app-001-frontend-app");
	});

	it("should set default values correctly", () => {
		const app = {
			type: "app" as const,
			number: 1,
			slug: "test-app",
			name: "Test App",
			description: "A test application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		const parsed = AppComponentSchema.parse(app);

		expect(parsed.folder).toBe(".");
		expect(parsed.depends_on).toEqual([]);
		expect(parsed.external_dependencies).toEqual([]);
		expect(parsed.tech_stack).toEqual([]);
		expect(parsed.deployment_targets).toEqual([]);
		expect(parsed.environments).toEqual([
			"development",
			"staging",
			"production",
		]);
	});

	it("should accept valid deployment targets", () => {
		const app = {
			type: "app" as const,
			number: 1,
			slug: "mobile-app",
			name: "Mobile App",
			description: "Cross-platform mobile application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deployment_targets: ["ios", "android", "web"],
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		expect(() => AppComponentSchema.parse(app)).not.toThrow();
	});

	it("should reject invalid deployment targets", () => {
		const app = {
			type: "app" as const,
			number: 1,
			slug: "test-app",
			name: "Test App",
			description: "A test application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deployment_targets: ["ios", "windows", "android"], // "windows" is invalid
			testing_setup: minimalTestingSetup,
		};

		expect(() => AppComponentSchema.parse(app)).toThrow();
	});

	it("should accept valid environments", () => {
		const app = {
			type: "app" as const,
			number: 1,
			slug: "test-app",
			name: "Test App",
			description: "A test application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			environments: ["development", "production"],
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		expect(() => AppComponentSchema.parse(app)).not.toThrow();
	});

	it("should reject invalid environments", () => {
		const app = {
			type: "app" as const,
			number: 1,
			slug: "test-app",
			name: "Test App",
			description: "A test application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			environments: ["development", "testing", "production"], // "testing" is invalid
			testing_setup: minimalTestingSetup,
		};

		expect(() => AppComponentSchema.parse(app)).toThrow();
	});
});

describe("ServiceComponentSchema", () => {
	it("should accept minimal valid service component", () => {
		const validService = {
			type: "service" as const,
			number: 1,
			slug: "auth-service",
			name: "Authentication Service",
			description: "Handles user authentication",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		const parsed = ServiceComponentSchema.parse(validService);
		expect(parsed.id).toBe("svc-001-auth-service");
	});

	it("should accept valid development port", () => {
		const service = {
			type: "service" as const,
			number: 1,
			slug: "api-service",
			name: "API Service",
			description: "Main API service",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			dev_port: 3000,
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		expect(() => ServiceComponentSchema.parse(service)).not.toThrow();
	});

	it("should reject invalid development ports", () => {
		const invalidPorts = [0, -1, 65536, 100000];

		for (const port of invalidPorts) {
			const service = {
				type: "service" as const,
				number: 1,
				slug: "test-service",
				name: "Test Service",
				description: "A test service",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				dev_port: port,
				testing_setup: minimalTestingSetup,
			};

			expect(() => ServiceComponentSchema.parse(service)).toThrow();
		}
	});

	it("should accept valid port range", () => {
		const validPorts = [1, 80, 443, 3000, 8080, 65535];

		for (const port of validPorts) {
			const service = {
				type: "service" as const,
				number: 1,
				slug: "test-service",
				name: "Test Service",
				description: "A test service",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				dev_port: port,
				testing_setup: minimalTestingSetup,
				deployment: minimalDeployment,
				scope: minimalScope,
			};

			expect(() => ServiceComponentSchema.parse(service)).not.toThrow();
		}
	});
});

describe("LibraryComponentSchema", () => {
	it("should accept minimal valid library component", () => {
		const validLibrary = {
			type: "library" as const,
			number: 1,
			slug: "utils-lib",
			name: "Utilities Library",
			description: "Common utility functions",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		const parsed = LibraryComponentSchema.parse(validLibrary);
		expect(parsed.id).toBe("lib-001-utils-lib");
	});

	it("should accept library with package name", () => {
		const library = {
			type: "library" as const,
			number: 1,
			slug: "ui-components",
			name: "UI Components Library",
			description: "Reusable UI components",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			package_name: "@company/ui-components",
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		expect(() => LibraryComponentSchema.parse(library)).not.toThrow();
	});

	it("should reject empty package name", () => {
		const library = {
			type: "library",
			number: 1,
			slug: "test-lib",
			name: "Test Library",
			description: "A test library",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			package_name: "",
			testing_setup: minimalTestingSetup,
		};

		expect(() => LibraryComponentSchema.parse(library)).toThrow();
	});
});

describe("Component Dependencies", () => {
	it("should accept valid component dependencies", () => {
		const component = {
			type: "app" as const,
			number: 1,
			slug: "frontend-app",
			name: "Frontend App",
			description: "Main frontend application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			depends_on: ["svc-001-auth-service", "lib-002-ui-components"],
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		expect(() => AppComponentSchema.parse(component)).not.toThrow();
	});

	it("should reject invalid component dependency IDs", () => {
		const component = {
			type: "app",
			number: 1,
			slug: "frontend-app",
			name: "Frontend App",
			description: "Main frontend application",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			depends_on: ["invalid-dependency", "svc-001-auth-service"],
			testing_setup: minimalTestingSetup,
		};

		expect(() => AppComponentSchema.parse(component)).toThrow();
	});

	it("should accept external dependencies", () => {
		const component = {
			type: "service" as const,
			number: 1,
			slug: "api-service",
			name: "API Service",
			description: "Main API service",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			external_dependencies: ["PostgreSQL", "Redis", "AWS S3"],
			testing_setup: minimalTestingSetup,
			deployment: minimalDeployment,
			scope: minimalScope,
		};

		expect(() => ServiceComponentSchema.parse(component)).not.toThrow();
	});
});
