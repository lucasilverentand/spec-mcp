import { describe, expect, it } from "vitest";
import {
	ApiContractDeprecationSchema,
	ApiContractExampleSchema,
	ApiContractIdSchema,
	ApiContractSchema,
	ApiContractStabilitySchema,
} from "../../../src/entities/shared/api-contract-schema.js";

describe("ApiContractIdSchema", () => {
	it("should accept valid API contract IDs", () => {
		const validIds = ["api-001", "api-999", "api-042", "api-123"];

		for (const id of validIds) {
			expect(() => ApiContractIdSchema.parse(id)).not.toThrow();
		}
	});

	it("should reject invalid API contract IDs", () => {
		const invalidIds = [
			"api-1", // not padded
			"api-abc", // non-numeric
			"api-001-extra", // extra suffix
			"apx-001", // wrong prefix
			"API-001", // wrong case
			"api-0001", // too many digits
			"", // empty
			"api-", // missing number
			"001", // missing prefix
		];

		for (const id of invalidIds) {
			expect(() => ApiContractIdSchema.parse(id)).toThrow();
		}
	});

	it("should provide descriptive error message for invalid format", () => {
		try {
			ApiContractIdSchema.parse("invalid-id");
		} catch (error) {
			expect((error as Error).message).toContain(
				"API Contract ID must follow format: api-XXX",
			);
		}
	});
});

describe("ApiContractStabilitySchema", () => {
	it("should accept valid stability levels", () => {
		const validStabilities = [
			"stable",
			"beta",
			"experimental",
			"deprecated",
			"legacy",
		];

		for (const stability of validStabilities) {
			expect(() => ApiContractStabilitySchema.parse(stability)).not.toThrow();
		}
	});

	it("should reject invalid stability levels", () => {
		const invalidStabilities = [
			"alpha",
			"preview",
			"rc",
			"development",
			"",
			null,
			undefined,
		];

		for (const stability of invalidStabilities) {
			expect(() => ApiContractStabilitySchema.parse(stability)).toThrow();
		}
	});
});

describe("ApiContractExampleSchema", () => {
	it("should accept minimal valid example", () => {
		const validExample = {
			name: "Basic Usage",
			description: "How to use the API",
			code: "fetch('/api/endpoint')",
		};

		expect(() => ApiContractExampleSchema.parse(validExample)).not.toThrow();
	});

	it("should accept example with language", () => {
		const validExample = {
			name: "TypeScript Example",
			description: "Using the API with TypeScript",
			code: "const result = await api.call();",
			language: "typescript",
		};

		const parsed = ApiContractExampleSchema.parse(validExample);
		expect(parsed.language).toBe("typescript");
	});

	it("should accept example without language", () => {
		const validExample = {
			name: "Simple Example",
			description: "Basic API usage",
			code: "api.call()",
		};

		const parsed = ApiContractExampleSchema.parse(validExample);
		expect(parsed.language).toBeUndefined();
	});

	it("should reject empty name", () => {
		const invalidExample = {
			name: "",
			description: "Test description",
			code: "test code",
		};

		expect(() => ApiContractExampleSchema.parse(invalidExample)).toThrow();
	});

	it("should reject empty description", () => {
		const invalidExample = {
			name: "Test",
			description: "",
			code: "test code",
		};

		expect(() => ApiContractExampleSchema.parse(invalidExample)).toThrow();
	});

	it("should reject empty code", () => {
		const invalidExample = {
			name: "Test",
			description: "Test description",
			code: "",
		};

		expect(() => ApiContractExampleSchema.parse(invalidExample)).toThrow();
	});

	it("should require all mandatory fields", () => {
		const requiredFields = ["name", "description", "code"];

		for (const field of requiredFields) {
			const invalidExample = {
				name: "Test",
				description: "Test description",
				code: "test code",
			};
			delete (invalidExample as Record<string, unknown>)[field];

			expect(() => ApiContractExampleSchema.parse(invalidExample)).toThrow();
		}
	});

	it("should accept valid programming languages", () => {
		const languages = [
			"typescript",
			"javascript",
			"python",
			"rust",
			"go",
			"java",
			"json",
			"yaml",
		];

		for (const language of languages) {
			const example = {
				name: "Test",
				description: "Test description",
				code: "test code",
				language,
			};
			expect(() => ApiContractExampleSchema.parse(example)).not.toThrow();
		}
	});
});

describe("ApiContractDeprecationSchema", () => {
	it("should accept minimal valid deprecation", () => {
		const validDeprecation = {
			deprecated_since: "1.0.0",
			reason: "Replaced by newer API",
		};

		expect(() =>
			ApiContractDeprecationSchema.parse(validDeprecation),
		).not.toThrow();
	});

	it("should accept complete deprecation with all fields", () => {
		const completeDeprecation = {
			deprecated_since: "1.5.0",
			removal_planned: "2.0.0",
			alternative: "api-002",
			reason: "Security vulnerability fixed in newer version",
		};

		const parsed = ApiContractDeprecationSchema.parse(completeDeprecation);
		expect(parsed.deprecated_since).toBe("1.5.0");
		expect(parsed.removal_planned).toBe("2.0.0");
		expect(parsed.alternative).toBe("api-002");
		expect(parsed.reason).toBe("Security vulnerability fixed in newer version");
	});

	it("should accept deprecation without removal_planned", () => {
		const deprecation = {
			deprecated_since: "1.0.0",
			alternative: "api-003",
			reason: "Better alternative available",
		};

		const parsed = ApiContractDeprecationSchema.parse(deprecation);
		expect(parsed.removal_planned).toBeUndefined();
	});

	it("should accept deprecation without alternative", () => {
		const deprecation = {
			deprecated_since: "1.0.0",
			removal_planned: "2.0.0",
			reason: "No longer needed",
		};

		const parsed = ApiContractDeprecationSchema.parse(deprecation);
		expect(parsed.alternative).toBeUndefined();
	});

	it("should reject empty deprecated_since", () => {
		const invalidDeprecation = {
			deprecated_since: "",
			reason: "Test reason",
		};

		expect(() =>
			ApiContractDeprecationSchema.parse(invalidDeprecation),
		).toThrow();
	});

	it("should reject empty reason", () => {
		const invalidDeprecation = {
			deprecated_since: "1.0.0",
			reason: "",
		};

		expect(() =>
			ApiContractDeprecationSchema.parse(invalidDeprecation),
		).toThrow();
	});

	it("should require mandatory fields", () => {
		const requiredFields = ["deprecated_since", "reason"];

		for (const field of requiredFields) {
			const invalidDeprecation = {
				deprecated_since: "1.0.0",
				reason: "Test reason",
			};
			delete (invalidDeprecation as Record<string, unknown>)[field];

			expect(() =>
				ApiContractDeprecationSchema.parse(invalidDeprecation),
			).toThrow();
		}
	});

	it("should accept various version formats", () => {
		const versionFormats = [
			"1.0.0",
			"v1.0.0",
			"2.5.3",
			"1.0.0-beta",
			"2024-01-01",
		];

		for (const version of versionFormats) {
			const deprecation = {
				deprecated_since: version,
				reason: "Test reason",
			};
			expect(() =>
				ApiContractDeprecationSchema.parse(deprecation),
			).not.toThrow();
		}
	});
});

describe("ApiContractSchema", () => {
	it("should accept minimal valid API contract", () => {
		const validContract = {
			id: "api-001",
			name: "User API",
			description: "API for managing users",
			contract_type: "rest",
			specification: '{"openapi": "3.0.0"}',
		};

		expect(() => ApiContractSchema.parse(validContract)).not.toThrow();
	});

	it("should set default values correctly", () => {
		const contract = {
			id: "api-001",
			name: "User API",
			description: "API for managing users",
			contract_type: "rest",
			specification: '{"openapi": "3.0.0"}',
		};

		const parsed = ApiContractSchema.parse(contract);
		expect(parsed.dependencies).toEqual([]);
		expect(parsed.examples).toEqual([]);
		expect(parsed.deprecation).toBeUndefined();
	});

	it("should accept complete API contract with all fields", () => {
		const completeContract = {
			id: "api-001",
			name: "User API",
			description: "Comprehensive user management API",
			contract_type: "rest",
			specification: '{"openapi": "3.0.0", "paths": {}}',
			dependencies: ["api-002", "api-003"],
			deprecation: {
				deprecated_since: "1.0.0",
				removal_planned: "2.0.0",
				alternative: "api-010",
				reason: "Migrating to new architecture",
			},
			examples: [
				{
					name: "Get User",
					description: "Retrieve user by ID",
					code: "GET /users/123",
					language: "http",
				},
				{
					name: "Create User",
					description: "Create new user",
					code: "POST /users",
					language: "http",
				},
			],
		};

		const parsed = ApiContractSchema.parse(completeContract);
		expect(parsed.id).toBe("api-001");
		expect(parsed.name).toBe("User API");
		expect(parsed.dependencies).toHaveLength(2);
		expect(parsed.examples).toHaveLength(2);
		expect(parsed.deprecation).toBeDefined();
		expect(parsed.deprecation?.alternative).toBe("api-010");
	});

	it("should require all mandatory fields", () => {
		const requiredFields = [
			"id",
			"name",
			"description",
			"contract_type",
			"specification",
		];

		for (const field of requiredFields) {
			const invalidContract = {
				id: "api-001",
				name: "Test API",
				description: "Test description",
				contract_type: "rest",
				specification: "{}",
			};
			delete (invalidContract as Record<string, unknown>)[field];

			expect(() => ApiContractSchema.parse(invalidContract)).toThrow();
		}
	});

	it("should reject empty name", () => {
		const contract = {
			id: "api-001",
			name: "",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
		};

		expect(() => ApiContractSchema.parse(contract)).toThrow();
	});

	it("should reject empty description", () => {
		const contract = {
			id: "api-001",
			name: "Test API",
			description: "",
			contract_type: "rest",
			specification: "{}",
		};

		expect(() => ApiContractSchema.parse(contract)).toThrow();
	});

	it("should reject empty contract_type", () => {
		const contract = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "",
			specification: "{}",
		};

		expect(() => ApiContractSchema.parse(contract)).toThrow();
	});

	it("should accept various contract types", () => {
		const contractTypes = [
			"rest",
			"graphql",
			"grpc",
			"library",
			"cli",
			"websocket",
			"rpc",
			"soap",
		];

		for (const contract_type of contractTypes) {
			const contract = {
				id: "api-001",
				name: "Test API",
				description: "Test description",
				contract_type,
				specification: "{}",
			};
			expect(() => ApiContractSchema.parse(contract)).not.toThrow();
		}
	});

	it("should accept various specification formats", () => {
		const specifications = [
			'{"openapi": "3.0.0"}', // JSON string
			"type User = { id: string }", // TypeScript definitions
			"scalar DateTime", // GraphQL schema
			"", // Empty specification is allowed
		];

		for (const specification of specifications) {
			const contract = {
				id: "api-001",
				name: "Test API",
				description: "Test description",
				contract_type: "rest",
				specification,
			};
			expect(() => ApiContractSchema.parse(contract)).not.toThrow();
		}
	});

	it("should validate dependency IDs format", () => {
		const contractWithInvalidDependency = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
			dependencies: ["invalid-id"],
		};

		expect(() =>
			ApiContractSchema.parse(contractWithInvalidDependency),
		).toThrow();
	});

	it("should accept valid dependency IDs", () => {
		const contractWithValidDependencies = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
			dependencies: ["api-002", "api-003", "api-999"],
		};

		const parsed = ApiContractSchema.parse(contractWithValidDependencies);
		expect(parsed.dependencies).toEqual(["api-002", "api-003", "api-999"]);
	});

	it("should accept empty dependencies array", () => {
		const contract = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
			dependencies: [],
		};

		const parsed = ApiContractSchema.parse(contract);
		expect(parsed.dependencies).toEqual([]);
	});

	it("should accept empty examples array", () => {
		const contract = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
			examples: [],
		};

		const parsed = ApiContractSchema.parse(contract);
		expect(parsed.examples).toEqual([]);
	});

	it("should validate all examples in array", () => {
		const contractWithInvalidExample = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
			examples: [
				{
					name: "Valid Example",
					description: "A valid example",
					code: "test code",
				},
				{
					name: "", // Invalid: empty name
					description: "Invalid example",
					code: "test code",
				},
			],
		};

		expect(() => ApiContractSchema.parse(contractWithInvalidExample)).toThrow();
	});

	it("should accept contract with optional deprecation", () => {
		const contract = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
			deprecation: {
				deprecated_since: "1.0.0",
				reason: "Replaced by newer API",
			},
		};

		const parsed = ApiContractSchema.parse(contract);
		expect(parsed.deprecation).toBeDefined();
		expect(parsed.deprecation?.deprecated_since).toBe("1.0.0");
	});

	it("should accept contract without deprecation", () => {
		const contract = {
			id: "api-001",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
		};

		const parsed = ApiContractSchema.parse(contract);
		expect(parsed.deprecation).toBeUndefined();
	});

	it("should validate invalid ID format", () => {
		const contractWithInvalidId = {
			id: "invalid-id",
			name: "Test API",
			description: "Test description",
			contract_type: "rest",
			specification: "{}",
		};

		expect(() => ApiContractSchema.parse(contractWithInvalidId)).toThrow();
	});

	it("should handle complex real-world API contracts", () => {
		const complexContract = {
			id: "api-123",
			name: "Payment Gateway API",
			description:
				"Secure payment processing API with support for multiple providers",
			contract_type: "rest",
			specification: JSON.stringify({
				openapi: "3.0.0",
				info: { title: "Payment API", version: "1.0.0" },
				paths: {
					"/payments": {
						post: {
							summary: "Create payment",
							requestBody: {
								content: {
									"application/json": {
										schema: { type: "object" },
									},
								},
							},
						},
					},
				},
			}),
			dependencies: ["api-001", "api-002"],
			examples: [
				{
					name: "Create Payment",
					description: "Create a new payment transaction",
					code: "curl -X POST /payments -d '{\"amount\": 100}'",
					language: "bash",
				},
				{
					name: "Get Payment Status",
					description: "Check payment status",
					code: "GET /payments/123",
					language: "http",
				},
			],
		};

		const parsed = ApiContractSchema.parse(complexContract);
		expect(parsed.id).toBe("api-123");
		expect(parsed.dependencies).toHaveLength(2);
		expect(parsed.examples).toHaveLength(2);
		expect(JSON.parse(parsed.specification)).toHaveProperty("openapi");
	});

	it("should handle deprecated API contract", () => {
		const deprecatedContract = {
			id: "api-456",
			name: "Legacy Auth API",
			description: "Legacy authentication system",
			contract_type: "rest",
			specification: '{"version": "0.1.0"}',
			deprecation: {
				deprecated_since: "2.0.0",
				removal_planned: "3.0.0",
				alternative: "api-789",
				reason: "Security improvements in newer version",
			},
			examples: [
				{
					name: "Login",
					description: "User login (deprecated)",
					code: "POST /auth/login",
					language: "http",
				},
			],
		};

		const parsed = ApiContractSchema.parse(deprecatedContract);
		expect(parsed.deprecation).toBeDefined();
		expect(parsed.deprecation?.alternative).toBe("api-789");
		expect(parsed.deprecation?.removal_planned).toBe("3.0.0");
	});
});
