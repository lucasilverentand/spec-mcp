import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ServiceConfig } from "../../src/interfaces/config.js";
import {
	defaultContainer,
	registerCoreServices,
	SERVICE_TOKENS,
	ServiceContainer,
	type ServiceFactory,
} from "../../src/services/container.js";
import { cleanupTestSpecs, createTestSpecsPath } from "../test-helpers.js";

describe("ServiceContainer", () => {
	let container: ServiceContainer;
	let config: Partial<ServiceConfig>;
	let testSpecsPath: string;

	beforeEach(() => {
		testSpecsPath = createTestSpecsPath("container-test");
		config = {
			specsPath: testSpecsPath,
			schemaValidation: true,
		};
		container = new ServiceContainer(config);
	});

	afterEach(async () => {
		await cleanupTestSpecs(testSpecsPath);
	});

	describe("Constructor", () => {
		it("should create a container with default config", () => {
			const defaultContainer = new ServiceContainer();
			expect(defaultContainer).toBeDefined();
		});

		it("should create a container with custom config", () => {
			expect(container).toBeDefined();
		});
	});

	describe("Service Registration", () => {
		it("should register a service factory", () => {
			const factory: ServiceFactory = () => ({ name: "TestService" });
			container.register("TestService", factory);

			expect(container.has("TestService")).toBe(true);
		});

		it("should register a singleton service by default", () => {
			const factory: ServiceFactory = () => ({ id: Math.random() });
			container.register("SingletonService", factory);

			const instance1 = container.resolve("SingletonService");
			const instance2 = container.resolve("SingletonService");

			expect(instance1.id).toBe(instance2.id);
		});

		it("should register a non-singleton service", () => {
			const factory: ServiceFactory = () => ({ id: Math.random() });
			container.register("NonSingletonService", factory, { singleton: false });

			const instance1 = container.resolve("NonSingletonService");
			const instance2 = container.resolve("NonSingletonService");

			expect(instance1.id).not.toBe(instance2.id);
		});

		it("should register service instance directly", () => {
			const instance = { name: "DirectInstance", value: 42 };
			container.registerInstance("DirectService", instance);

			const resolved = container.resolve("DirectService");
			expect(resolved).toBe(instance);
			expect(resolved.value).toBe(42);
		});

		it("should override existing registration", () => {
			container.register("TestService", () => ({ version: 1 }));
			container.register("TestService", () => ({ version: 2 }));

			const instance = container.resolve("TestService");
			expect(instance.version).toBe(2);
		});
	});

	describe("Service Resolution", () => {
		it("should resolve a registered service", () => {
			const factory: ServiceFactory = () => ({ name: "TestService" });
			container.register("TestService", factory);

			const instance = container.resolve("TestService");
			expect(instance).toBeDefined();
			expect(instance.name).toBe("TestService");
		});

		it("should throw error for unregistered service", () => {
			expect(() => container.resolve("UnregisteredService")).toThrow(
				"Service 'UnregisteredService' is not registered",
			);
		});

		it("should pass config to factory function", () => {
			const factory: ServiceFactory = (cfg) => ({
				config: cfg,
			});
			container.register("ConfigService", factory);

			const instance = container.resolve("ConfigService");
			expect(instance.config).toBeDefined();
			expect(instance.config?.specsPath).toBe(testSpecsPath);
		});

		it("should cache singleton instances", () => {
			let callCount = 0;
			const factory: ServiceFactory = () => {
				callCount++;
				return { callCount };
			};
			container.register("CachedService", factory, { singleton: true });

			container.resolve("CachedService");
			container.resolve("CachedService");
			container.resolve("CachedService");

			expect(callCount).toBe(1);
		});

		it("should not cache non-singleton instances", () => {
			let callCount = 0;
			const factory: ServiceFactory = () => {
				callCount++;
				return { callCount };
			};
			container.register("NonCachedService", factory, { singleton: false });

			container.resolve("NonCachedService");
			container.resolve("NonCachedService");
			container.resolve("NonCachedService");

			expect(callCount).toBe(3);
		});

		it("should handle factory errors gracefully", () => {
			const factory: ServiceFactory = () => {
				throw new Error("Factory failed");
			};
			container.register("FailingService", factory);

			expect(() => container.resolve("FailingService")).toThrow(
				"Failed to create service 'FailingService'",
			);
		});

		it("should include error context in failure message", () => {
			const factory: ServiceFactory = () => {
				throw new Error("Database connection failed");
			};
			container.register("DatabaseService", factory);

			try {
				container.resolve("DatabaseService");
				expect.fail("Should have thrown an error");
			} catch (error: unknown) {
				expect((error as Error).message).toContain(
					"Failed to create service 'DatabaseService'",
				);
				expect((error as Error).message).toContain(
					"Database connection failed",
				);
			}
		});
	});

	describe("Service Checking", () => {
		it("should check if service is registered", () => {
			expect(container.has("TestService")).toBe(false);

			container.register("TestService", () => ({}));
			expect(container.has("TestService")).toBe(true);
		});

		it("should return false for unregistered services", () => {
			expect(container.has("NonExistent")).toBe(false);
		});
	});

	describe("Service Unregistration", () => {
		it("should unregister a service", () => {
			container.register("TestService", () => ({}));
			expect(container.has("TestService")).toBe(true);

			const result = container.unregister("TestService");
			expect(result).toBe(true);
			expect(container.has("TestService")).toBe(false);
		});

		it("should return false when unregistering non-existent service", () => {
			const result = container.unregister("NonExistent");
			expect(result).toBe(false);
		});

		it("should allow re-registration after unregistration", () => {
			container.register("TestService", () => ({ version: 1 }));
			container.unregister("TestService");
			container.register("TestService", () => ({ version: 2 }));

			const instance = container.resolve("TestService");
			expect(instance.version).toBe(2);
		});
	});

	describe("Container Clearing", () => {
		it("should clear all registrations", () => {
			container.register("Service1", () => ({}));
			container.register("Service2", () => ({}));
			container.register("Service3", () => ({}));

			expect(container.getRegisteredTokens().length).toBe(3);

			container.clear();
			expect(container.getRegisteredTokens().length).toBe(0);
			expect(container.has("Service1")).toBe(false);
			expect(container.has("Service2")).toBe(false);
			expect(container.has("Service3")).toBe(false);
		});

		it("should allow new registrations after clearing", () => {
			container.register("Service1", () => ({}));
			container.clear();

			container.register("Service2", () => ({}));
			expect(container.has("Service2")).toBe(true);
		});
	});

	describe("Get Registered Tokens", () => {
		it("should return all registered service tokens", () => {
			container.register("Service1", () => ({}));
			container.register("Service2", () => ({}));
			container.register("Service3", () => ({}));

			const tokens = container.getRegisteredTokens();
			expect(tokens).toHaveLength(3);
			expect(tokens).toContain("Service1");
			expect(tokens).toContain("Service2");
			expect(tokens).toContain("Service3");
		});

		it("should return empty array when no services registered", () => {
			const tokens = container.getRegisteredTokens();
			expect(tokens).toHaveLength(0);
		});
	});

	describe("Config Management", () => {
		it("should update container configuration", () => {
			container.register("ConfigService", (cfg) => ({ config: cfg }));
			const instance1 = container.resolve("ConfigService");

			const updatedPath = "./updated-path";
			container.updateConfig({ specsPath: updatedPath });
			const instance2 = container.resolve("ConfigService");

			expect(instance1.config?.specsPath).toBe(testSpecsPath);
			expect(instance2.config?.specsPath).toBe(updatedPath);
		});

		it("should clear singleton instances on config update", () => {
			let callCount = 0;
			container.register("SingletonService", () => {
				callCount++;
				return { callCount };
			});

			container.resolve("SingletonService");
			expect(callCount).toBe(1);

			container.updateConfig({ specsPath: "./new-path" });
			container.resolve("SingletonService");
			expect(callCount).toBe(2);
		});

		it("should merge config on update", () => {
			const initialConfig: Partial<ServiceConfig> = {
				specsPath: "./specs",
				schemaValidation: true,
			};
			const container = new ServiceContainer(initialConfig);

			container.register("ConfigService", (cfg) => ({ config: cfg }));

			container.updateConfig({ schemaValidation: false });
			const instance = container.resolve("ConfigService");

			expect(instance.config?.specsPath).toBe("./specs");
			expect(instance.config?.schemaValidation).toBe(false);
		});
	});

	describe("Child Containers", () => {
		it("should create child container with inherited registrations", () => {
			container.register("ParentService", () => ({ name: "parent" }));
			container.register("SharedService", () => ({ name: "shared" }));

			const childContainer = container.createChildContainer();

			expect(childContainer.has("ParentService")).toBe(true);
			expect(childContainer.has("SharedService")).toBe(true);
		});

		it("should create child container with custom config", () => {
			container.register("ConfigService", (cfg) => ({ config: cfg }));

			const childSpecsPath = "./child-specs";
			const childContainer = container.createChildContainer({
				specsPath: childSpecsPath,
			});

			const parentInstance = container.resolve("ConfigService");
			const childInstance = childContainer.resolve("ConfigService");

			expect(parentInstance.config?.specsPath).toBe(testSpecsPath);
			expect(childInstance.config?.specsPath).toBe(childSpecsPath);
		});

		it("should not share singleton instances with parent", () => {
			container.register("SingletonService", () => ({ id: Math.random() }));

			const parentInstance = container.resolve("SingletonService");
			const childContainer = container.createChildContainer();
			const childInstance = childContainer.resolve("SingletonService");

			expect(parentInstance.id).not.toBe(childInstance.id);
		});

		it("should allow child to override parent registrations", () => {
			container.register("Service", () => ({ version: 1 }));

			const childContainer = container.createChildContainer();
			childContainer.register("Service", () => ({ version: 2 }));

			const parentInstance = container.resolve("Service");
			const childInstance = childContainer.resolve("Service");

			expect(parentInstance.version).toBe(1);
			expect(childInstance.version).toBe(2);
		});

		it("should not affect parent when child is modified", () => {
			container.register("Service1", () => ({}));

			const childContainer = container.createChildContainer();
			childContainer.register("Service2", () => ({}));

			expect(container.has("Service1")).toBe(true);
			expect(container.has("Service2")).toBe(false);
			expect(childContainer.has("Service1")).toBe(true);
			expect(childContainer.has("Service2")).toBe(true);
		});
	});

	describe("Service Tokens", () => {
		it("should provide predefined service tokens", () => {
			expect(SERVICE_TOKENS.SPEC_SERVICE).toBe("SpecService");
			expect(SERVICE_TOKENS.DEPENDENCY_ANALYZER).toBe("DependencyAnalyzer");
			expect(SERVICE_TOKENS.COVERAGE_ANALYZER).toBe("CoverageAnalyzer");
			expect(SERVICE_TOKENS.CYCLE_DETECTOR).toBe("CycleDetector");
			expect(SERVICE_TOKENS.ORPHAN_DETECTOR).toBe("OrphanDetector");
			expect(SERVICE_TOKENS.VALIDATION_ENGINE).toBe("ValidationEngine");
			expect(SERVICE_TOKENS.ID_GENERATOR).toBe("IdGenerator");
			expect(SERVICE_TOKENS.SLUG_GENERATOR).toBe("SlugGenerator");
		});

		it("should use tokens for registration", () => {
			container.register(SERVICE_TOKENS.SPEC_SERVICE, () => ({
				name: "SpecService",
			}));

			expect(container.has(SERVICE_TOKENS.SPEC_SERVICE)).toBe(true);
			const instance = container.resolve(SERVICE_TOKENS.SPEC_SERVICE);
			expect(instance.name).toBe("SpecService");
		});
	});

	describe("Default Container", () => {
		it("should provide a default container instance", () => {
			expect(defaultContainer).toBeDefined();
			expect(defaultContainer).toBeInstanceOf(ServiceContainer);
		});
	});

	describe("Core Services Registration", () => {
		it("should register core services", async () => {
			const testContainer = new ServiceContainer();
			await registerCoreServices(testContainer);

			expect(testContainer.has(SERVICE_TOKENS.SPEC_SERVICE)).toBe(true);
			expect(testContainer.has(SERVICE_TOKENS.DEPENDENCY_ANALYZER)).toBe(true);
			expect(testContainer.has(SERVICE_TOKENS.COVERAGE_ANALYZER)).toBe(true);
			expect(testContainer.has(SERVICE_TOKENS.CYCLE_DETECTOR)).toBe(true);
			expect(testContainer.has(SERVICE_TOKENS.ORPHAN_DETECTOR)).toBe(true);
			expect(testContainer.has(SERVICE_TOKENS.VALIDATION_ENGINE)).toBe(true);
		});
	});

	describe("Integration Scenarios", () => {
		it("should support dependency injection pattern", () => {
			// Register dependencies
			container.register("Database", () => ({
				query: (sql: string) => `Result of: ${sql}`,
			}));

			container.register("UserService", (_cfg) => {
				const db = container.resolve("Database");
				return {
					getUser: (id: string) =>
						db.query(`SELECT * FROM users WHERE id = ${id}`),
				};
			});

			const userService = container.resolve("UserService");
			const result = userService.getUser("123");

			expect(result).toBe("Result of: SELECT * FROM users WHERE id = 123");
		});

		it("should handle complex service dependency chains", () => {
			container.register("Logger", () => ({
				log: (msg: string) => `[LOG] ${msg}`,
			}));

			container.register("Cache", () => {
				const logger = container.resolve("Logger");
				return {
					get: (key: string) => {
						logger.log(`Cache get: ${key}`);
						return null;
					},
				};
			});

			container.register("ApiService", () => {
				const cache = container.resolve("Cache");
				const logger = container.resolve("Logger");
				return {
					fetch: (url: string) => {
						cache.get(url);
						return logger.log(`Fetching: ${url}`);
					},
				};
			});

			const api = container.resolve("ApiService");
			const result = api.fetch("https://api.example.com");

			expect(result).toBe("[LOG] Fetching: https://api.example.com");
		});

		it("should support service lifecycle management", () => {
			let initCount = 0;
			let shutdownCount = 0;

			container.register("ManagedService", () => {
				initCount++;
				return {
					shutdown: () => {
						shutdownCount++;
					},
				};
			});

			// Resolve service (initialization)
			const service1 = container.resolve("ManagedService");
			expect(initCount).toBe(1);

			// Resolve again (should use cached instance)
			const service2 = container.resolve("ManagedService");
			expect(initCount).toBe(1);
			expect(service1).toBe(service2);

			// Shutdown
			service1.shutdown();
			expect(shutdownCount).toBe(1);

			// Clear and re-initialize
			container.clear();
			container.register("ManagedService", () => {
				initCount++;
				return {
					shutdown: () => {
						shutdownCount++;
					},
				};
			});

			const service3 = container.resolve("ManagedService");
			expect(initCount).toBe(2);
			expect(service3).not.toBe(service1);
		});

		it("should support multiple containers in isolation", () => {
			const container1 = new ServiceContainer({ specsPath: "./container1" });
			const container2 = new ServiceContainer({ specsPath: "./container2" });

			container1.register("Service", (cfg) => ({ path: cfg?.specsPath }));
			container2.register("Service", (cfg) => ({ path: cfg?.specsPath }));

			const instance1 = container1.resolve("Service");
			const instance2 = container2.resolve("Service");

			expect(instance1.path).toBe("./container1");
			expect(instance2.path).toBe("./container2");
		});

		it("should handle circular service registration gracefully", () => {
			container.register("ServiceA", () => {
				// This will cause a circular dependency if ServiceB tries to resolve ServiceA
				return { name: "A", getB: () => container.resolve("ServiceB") };
			});

			container.register("ServiceB", () => {
				return { name: "B" };
			});

			const serviceA = container.resolve("ServiceA");
			expect(serviceA.name).toBe("A");

			const serviceB = serviceA.getB();
			expect(serviceB.name).toBe("B");
		});
	});

	describe("Type Safety", () => {
		it("should maintain type information through generics", () => {
			interface TestService {
				name: string;
				value: number;
			}

			container.register<TestService>("TypedService", () => ({
				name: "Test",
				value: 42,
			}));

			const service = container.resolve<TestService>("TypedService");
			expect(service.name).toBe("Test");
			expect(service.value).toBe(42);
		});
	});

	describe("Error Scenarios", () => {
		it("should provide meaningful error for resolution failures", () => {
			container.register("FailingService", () => {
				throw new Error("Cannot connect to database");
			});

			try {
				container.resolve("FailingService");
				expect.fail("Should have thrown an error");
			} catch (error: unknown) {
				expect((error as Error).message).toContain(
					"Failed to create service 'FailingService'",
				);
				expect((error as Error).message).toContain(
					"Cannot connect to database",
				);
			}
		});

		it("should handle null/undefined factory gracefully", () => {
			// This is a type-safety check - in practice TypeScript should prevent this
			// But we test runtime behavior
			container.register("NullService", null as unknown as () => IService);
			expect(() => container.resolve("NullService")).toThrow();
		});
	});
});
