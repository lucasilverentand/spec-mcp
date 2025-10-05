import { ErrorFactory } from "../shared/errors/index.js";
import type { ServiceConfig } from "../shared/types/config.js";

export type ServiceFactory<T = unknown> = (
	config?: Partial<ServiceConfig>,
) => T;
export type ServiceInstance<T = unknown> = T;

export interface ServiceRegistration<T = unknown> {
	factory: ServiceFactory<T>;
	singleton: boolean;
	instance?: ServiceInstance<T>;
}

export class ServiceContainer {
	private services = new Map<string, ServiceRegistration>();
	private config: Partial<ServiceConfig>;

	constructor(config: Partial<ServiceConfig> = {}) {
		this.config = config;
	}

	/**
	 * Register a service factory
	 */
	register<T>(
		token: string,
		factory: ServiceFactory<T>,
		options: { singleton?: boolean } = {},
	): void {
		const { singleton = true } = options;

		this.services.set(token, {
			factory,
			singleton,
			instance: undefined,
		});
	}

	/**
	 * Register a singleton service instance
	 */
	registerInstance<T>(token: string, instance: T): void {
		this.services.set(token, {
			factory: () => instance,
			singleton: true,
			instance,
		});
	}

	/**
	 * Resolve a service by token
	 */
	resolve<T>(token: string): T {
		const registration = this.services.get(token);
		if (!registration) {
			throw ErrorFactory.configuration(`Service '${token}' is not registered`);
		}

		// Return existing singleton instance if available
		if (registration.singleton && registration.instance) {
			return registration.instance as T;
		}

		try {
			// Create new instance
			const instance = registration.factory(this.config);

			// Store singleton instance
			if (registration.singleton) {
				registration.instance = instance;
			}

			return instance as T;
		} catch (error) {
			throw ErrorFactory.system(
				`Failed to create service '${token}': ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				{ token, error },
			);
		}
	}

	/**
	 * Check if a service is registered
	 */
	has(token: string): boolean {
		return this.services.has(token);
	}

	/**
	 * Remove a service registration
	 */
	unregister(token: string): boolean {
		return this.services.delete(token);
	}

	/**
	 * Clear all registrations
	 */
	clear(): void {
		this.services.clear();
	}

	/**
	 * Get all registered service tokens
	 */
	getRegisteredTokens(): string[] {
		return Array.from(this.services.keys());
	}

	/**
	 * Update container configuration
	 */
	updateConfig(config: Partial<ServiceConfig>): void {
		this.config = { ...this.config, ...config };

		// Clear singleton instances to force recreation with new config
		for (const registration of this.services.values()) {
			if (registration.singleton) {
				registration.instance = undefined;
			}
		}
	}

	/**
	 * Create a child container with inherited registrations
	 */
	createChildContainer(config?: Partial<ServiceConfig>): ServiceContainer {
		const childContainer = new ServiceContainer({ ...this.config, ...config });

		// Copy parent registrations (but not instances)
		for (const [token, registration] of this.services) {
			childContainer.register(token, registration.factory, {
				singleton: registration.singleton,
			});
		}

		return childContainer;
	}
}

// Default container instance
export const defaultContainer = new ServiceContainer();

// Service tokens (constants to avoid magic strings)
export const SERVICE_TOKENS = {
	SPEC_SERVICE: "SpecService",
	DEPENDENCY_ANALYZER: "DependencyAnalyzer",
	COVERAGE_ANALYZER: "CoverageAnalyzer",
	CYCLE_DETECTOR: "CycleDetector",
	ORPHAN_DETECTOR: "OrphanDetector",
	VALIDATION_ENGINE: "ValidationEngine",
	ID_GENERATOR: "IdGenerator",
	SLUG_GENERATOR: "SlugGenerator",
	YAML_TRANSFORMER: "YamlTransformer",
} as const;

export type ServiceToken = (typeof SERVICE_TOKENS)[keyof typeof SERVICE_TOKENS];

// Helper function to register all core services
export async function registerCoreServices(
	container: ServiceContainer,
): Promise<void> {
	// Import services dynamically to avoid circular dependencies
	container.register(SERVICE_TOKENS.SPEC_SERVICE, async (config) => {
		const { SpecService } = await import("./spec-service.js");
		return new SpecService(config);
	});

	container.register(SERVICE_TOKENS.DEPENDENCY_ANALYZER, async (config) => {
		const { DependencyAnalyzer } = await import(
			"../analysis/dependency-analyzer.js"
		);
		return new DependencyAnalyzer(config);
	});

	container.register(SERVICE_TOKENS.COVERAGE_ANALYZER, async (config) => {
		const { CoverageAnalyzer } = await import(
			"../analysis/coverage-analyzer.js"
		);
		return new CoverageAnalyzer(config);
	});

	container.register(SERVICE_TOKENS.CYCLE_DETECTOR, async (config) => {
		const { CycleDetector } = await import("../analysis/cycle-detector.js");
		return new CycleDetector(config);
	});

	container.register(SERVICE_TOKENS.ORPHAN_DETECTOR, async (config) => {
		const { OrphanDetector } = await import("../analysis/orphan-detector.js");
		return new OrphanDetector(config);
	});

	container.register(SERVICE_TOKENS.VALIDATION_ENGINE, async (config) => {
		const { ValidationEngine } = await import(
			"../validation/validation-engine.js"
		);
		return new ValidationEngine(config);
	});
}

// Register services in default container
registerCoreServices(defaultContainer);
