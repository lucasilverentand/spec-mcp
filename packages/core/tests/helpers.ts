import { promises as fs } from "node:fs";
import path from "node:path";
import type {
	Base,
	BusinessRequirement,
	Component,
	Constitution,
	Decision,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(prefix = "spec-mcp-test"): Promise<string> {
	const tmpDir = path.join(
		process.cwd(),
		"tests",
		"temp",
		`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
	);
	await fs.mkdir(tmpDir, { recursive: true });
	return tmpDir;
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
	try {
		await fs.rm(dirPath, { recursive: true, force: true });
	} catch (error) {
		// Ignore cleanup errors
		console.warn(`Failed to cleanup ${dirPath}:`, error);
	}
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Create a test entity with default values
 */
export function createTestEntity<T extends Base>(
	partial: Partial<T> & Pick<T, "type" | "slug" | "name" | "description">,
): Omit<T, "number"> {
	const now = new Date().toISOString();
	return {
		draft: false,
		priority: "medium",
		status: {
			created_at: now,
			updated_at: now,
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
		...partial,
	} as Omit<T, "number">;
}

/**
 * Create a minimal test business requirement
 */
export function createTestBusinessRequirement(
	overrides?: Partial<BusinessRequirement>,
): Omit<BusinessRequirement, "number"> {
	return createTestEntity({
		type: "business-requirement",
		slug: "test-br",
		name: "Test Business Requirement",
		description: "A test business requirement",
		business_value: [
			{
				type: "customer-satisfaction" as const,
				value: "Improves user experience",
			},
		],
		user_stories: [
			{
				role: "user",
				feature: "use the test feature",
				benefit: "complete their task efficiently",
			},
		],
		criteria: [
			{
				id: "crit-001",
				description: "Test criterion",
				rationale: "This criterion is essential for validating the requirement",
				status: "needs-review" as const,
			},
		],
		...overrides,
	});
}

/**
 * Create a minimal test technical requirement
 */
export function createTestTechnicalRequirement(
	overrides?: Partial<TechnicalRequirement>,
): Omit<TechnicalRequirement, "number"> {
	return createTestEntity({
		type: "technical-requirement",
		slug: "test-tr",
		name: "Test Technical Requirement",
		description: "A test technical requirement",
		technical_context: "Technical context for the requirement",
		criteria: [
			{
				id: "crit-001",
				description: "Test criterion",
				rationale: "This criterion is essential for validating the requirement",
				status: "needs-review" as const,
			},
		],
		...overrides,
	});
}

/**
 * Create a minimal test plan
 */
export function createTestPlan(
	overrides?: Partial<Plan>,
): Omit<Plan, "number"> {
	return createTestEntity({
		type: "plan",
		slug: "test-plan",
		name: "Test Plan",
		description: "A test plan",
		criteria: {
			requirement: "brd-001-test-req",
			criteria: "crit-001",
		},
		scope: [
			{ type: "in-scope", description: "Feature implementation" },
			{ type: "out-of-scope", description: "Performance optimization" },
		],
		tasks: [],
		flows: [],
		test_cases: [],
		api_contracts: [],
		data_models: [],
		references: [],
		...overrides,
	});
}

/**
 * Create a minimal test component
 */
export function createTestComponent(
	overrides?: Partial<Component>,
): Omit<Component, "number"> {
	return createTestEntity({
		type: "component",
		slug: "test-component",
		name: "Test Component",
		description: "A test component",
		component_type: "service",
		scope: [
			{ type: "in-scope", description: "Core functionality" },
			{ type: "out-of-scope", description: "Advanced features" },
		],
		...overrides,
	});
}

/**
 * Create a minimal test constitution
 */
export function createTestConstitution(
	overrides?: Partial<Constitution>,
): Omit<Constitution, "number"> {
	return createTestEntity({
		type: "constitution",
		slug: "test-constitution",
		name: "Test Constitution",
		description: "A test constitution",
		articles: [
			{
				id: "art-001",
				title: "Test Principle",
				principle: "Always test your code",
				rationale: "Testing ensures quality",
				examples: ["Unit tests", "Integration tests"],
				exceptions: [],
				status: "active",
			},
		],
		...overrides,
	});
}

/**
 * Create a minimal test decision
 */
export function createTestDecision(
	overrides?: Partial<Decision>,
): Omit<Decision, "number"> {
	return createTestEntity({
		type: "decision",
		slug: "test-decision",
		name: "Test Decision",
		description: "A test decision",
		decision:
			"We decided to use TypeScript for type safety and better developer experience",
		context:
			"The team needed better tooling and wanted to catch errors at compile time rather than runtime",
		consequences: [
			{
				type: "positive",
				description: "Better IDE support and autocomplete",
			},
			{
				type: "negative",
				description: "Steeper learning curve for new developers",
			},
		],
		...overrides,
	});
}

/**
 * Wait for a short period (useful for ensuring file system operations complete)
 */
export async function wait(ms = 10): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
