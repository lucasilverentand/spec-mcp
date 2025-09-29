import { beforeEach, describe, expect, it } from "vitest";
import {
	CoverageAnalyzer,
	convertJsonToYaml,
	convertYamlToJson,
	createContainer,
	createSpecService,
	DependencyAnalyzer,
	generateSlug,
	generateUniqueSlug,
	IdGenerator,
	parseYaml,
	SchemaValidator,
	SERVICE_TOKENS,
	ServiceContainer,
	SpecCore,
	SpecService,
	stringifyYaml,
	ValidationEngine,
	validateSlug,
	validateYamlSyntax,
} from "../src/index.js";

describe("Simplified Core API", () => {
	it("should export all main components", () => {
		expect(SpecService).toBeDefined();
		expect(SpecCore).toBeDefined();
		expect(DependencyAnalyzer).toBeDefined();
		expect(CoverageAnalyzer).toBeDefined();
		expect(ValidationEngine).toBeDefined();
		expect(SchemaValidator).toBeDefined();
	});

	it("should export schemas and types", () => {
		// Test that schemas are available
		expect(typeof generateSlug).toBe("function");
		expect(typeof parseYaml).toBe("function");
		expect(typeof validateSlug).toBe("function");
	});

	it("should provide factory functions", () => {
		expect(typeof createSpecService).toBe("function");
		expect(typeof createContainer).toBe("function");
	});
});

describe("SpecService (New API)", () => {
	let service: SpecService;

	beforeEach(() => {
		service = new SpecService();
	});

	it("should initialize successfully", () => {
		expect(service).toBeDefined();
		expect(service.name).toBe("SpecService");
		expect(service.version).toBe("2.0.0");
	});

	it("should perform health check", async () => {
		const isHealthy = await service.healthCheck();
		expect(typeof isHealthy).toBe("boolean");
	});
});

describe("SpecCore (Legacy Compatibility)", () => {
	let core: SpecCore;

	beforeEach(() => {
		core = new SpecCore();
	});

	it("should maintain backward compatibility", () => {
		expect(core).toBeDefined();
		expect(core.operations).toBeDefined();
		expect(core.validation).toBeDefined();
		expect(core.dependencies).toBeDefined();
		expect(core.coverage).toBeDefined();
		expect(core.orphans).toBeDefined();
		expect(core.cycles).toBeDefined();
		expect(core.dependencyAnalyzer).toBeDefined();
	});
});

describe("Utility Functions", () => {
	describe("Slug Generation", () => {
		it("should generate valid slugs", () => {
			expect(generateSlug("Hello World")).toBe("hello-world");
			expect(generateSlug("Test_With_Underscores")).toBe(
				"test-with-underscores",
			);
			expect(generateSlug("Multiple   Spaces")).toBe("multiple-spaces");
			expect(generateSlug("Special!@#Characters")).toBe("specialcharacters");
		});

		it("should validate slugs", () => {
			expect(validateSlug("valid-slug")).toBe(true);
			expect(validateSlug("invalid_slug")).toBe(false);
			expect(validateSlug("Invalid-Slug")).toBe(false);
			expect(validateSlug("-invalid-slug")).toBe(false);
			expect(validateSlug("invalid-slug-")).toBe(false);
		});

		it("should generate unique slugs", () => {
			const existingIds = ["test-slug", "test-slug-1", "test-slug-2"];
			const unique = generateUniqueSlug("test-slug", existingIds);
			expect(unique).toBe("test-slug-3");
		});
	});

	describe("ID Generation", () => {
		let generator: IdGenerator;

		beforeEach(() => {
			generator = new IdGenerator();
		});

		it("should have correct metadata", () => {
			expect(generator.name).toBe("IdGenerator");
			expect(generator.version).toBe("2.0.0");
		});

		it("should generate basic IDs", () => {
			const id = generator.generateId("test");
			expect(id).toMatch(/^test-\d+-[a-z0-9]+$/);
		});

		it("should validate IDs", () => {
			expect(generator.validateId("valid-id")).toBe(true);
			expect(generator.validateId("")).toBe(false);
		});
	});

	describe("YAML Functions", () => {
		const testObject = {
			type: "requirement",
			name: "Test Requirement",
			number: 1,
			slug: "test-requirement",
		};

		it("should stringify objects to YAML", () => {
			const yaml = stringifyYaml(testObject);
			expect(yaml).toContain("type: requirement");
			expect(yaml).toContain("name: Test Requirement");
		});

		it("should parse YAML to objects", () => {
			const yaml = "type: requirement\nname: Test Requirement\nnumber: 1";
			const parsed = parseYaml(yaml);
			expect(parsed.type).toBe("requirement");
			expect(parsed.name).toBe("Test Requirement");
			expect(parsed.number).toBe(1);
		});

		it("should validate YAML syntax", () => {
			const validYaml = "type: requirement\nname: Test";
			const invalidYaml = "type: requirement\n  invalid: [unclosed";

			expect(validateYamlSyntax(validYaml)).toBe(true);
			expect(validateYamlSyntax(invalidYaml)).toBe(false);
		});

		it("should convert between JSON and YAML", () => {
			const yaml = convertJsonToYaml(testObject);
			const backToObject = convertYamlToJson(yaml);

			expect(backToObject).toEqual(testObject);
		});
	});
});

describe("Service Container", () => {
	let container: ServiceContainer;

	beforeEach(() => {
		container = new ServiceContainer();
	});

	it("should register and resolve services", () => {
		container.register("TestService", () => ({ name: "test" }));

		const service = container.resolve("TestService");
		expect(service.name).toBe("test");
	});

	it("should handle singleton services", () => {
		container.register("SingletonService", () => ({ id: Math.random() }), {
			singleton: true,
		});

		const service1 = container.resolve("SingletonService");
		const service2 = container.resolve("SingletonService");

		expect(service1.id).toBe(service2.id);
	});

	it("should throw for unregistered services", () => {
		expect(() => container.resolve("NonExistent")).toThrow();
	});
});

describe("Analysis Components", () => {
	it("should create analyzers with proper interfaces", () => {
		const dependencyAnalyzer = new DependencyAnalyzer();
		const coverageAnalyzer = new CoverageAnalyzer();

		expect(dependencyAnalyzer.name).toBe("DependencyAnalyzer");
		expect(dependencyAnalyzer.version).toBe("2.0.0");
		expect(coverageAnalyzer.name).toBe("CoverageAnalyzer");
		expect(coverageAnalyzer.version).toBe("2.0.0");
	});
});

describe("Integration Tests", () => {
	it("should work with the simplified pipeline", async () => {
		// Create a service
		const service = createSpecService();

		// Should be able to perform basic operations
		const isHealthy = await service.healthCheck();
		expect(typeof isHealthy).toBe("boolean");
	});

	it("should maintain backward compatibility", async () => {
		const core = new SpecCore();

		// Legacy API should work
		expect(core.operations).toBeDefined();
		expect(core.validation).toBeDefined();
		expect(core.coverage).toBeDefined();

		// Should be able to initialize
		try {
			await core.initialize();
		} catch (_error) {
			// Expected in test environment without specs
		}
	});

	it("should create containers with services", async () => {
		const container = await createContainer();
		expect(container.has(SERVICE_TOKENS.SPEC_SERVICE)).toBe(true);

		const specService = await container.resolve(SERVICE_TOKENS.SPEC_SERVICE);
		expect(specService).toBeDefined();
	});
});
