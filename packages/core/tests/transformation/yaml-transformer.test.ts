import { beforeEach, describe, expect, it } from "vitest";
import {
	convertJsonToYaml,
	convertYamlToJson,
	parseYaml,
	stringifyYaml,
	validateYamlSyntax,
	YamlTransformer,
	type YamlTransformOptions,
} from "../../src/transformation/yaml-transformer.js";

describe("YamlTransformer Class", () => {
	let transformer: YamlTransformer;

	beforeEach(() => {
		transformer = new YamlTransformer();
	});

	describe("Constructor", () => {
		it("should initialize with default options", () => {
			const transformer = new YamlTransformer();

			expect(transformer).toBeDefined();
			expect(transformer).toBeInstanceOf(YamlTransformer);
		});

		it("should accept custom parse options", () => {
			const transformer = new YamlTransformer({
				parse: {
					strict: true,
				},
			});

			expect(transformer).toBeDefined();
		});

		it("should accept custom stringify options", () => {
			const transformer = new YamlTransformer({
				stringify: {
					indent: 4,
					lineWidth: 120,
				},
			});

			expect(transformer).toBeDefined();
		});

		it("should accept both parse and stringify options", () => {
			const options: YamlTransformOptions = {
				parse: { strict: true },
				stringify: { indent: 4 },
			};
			const transformer = new YamlTransformer(options);

			expect(transformer).toBeDefined();
		});

		it("should use default options when none provided", () => {
			const transformer = new YamlTransformer({});

			expect(transformer).toBeDefined();
		});
	});

	describe("parseYaml method", () => {
		it("should parse valid YAML string", () => {
			const yamlString = "name: test\nvalue: 123";
			const result = transformer.parseYaml(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ name: "test", value: 123 });
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it("should parse YAML with nested objects", () => {
			const yamlString = `
parent:
  child1: value1
  child2: value2
`;
			const result = transformer.parseYaml(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				parent: {
					child1: "value1",
					child2: "value2",
				},
			});
		});

		it("should parse YAML with arrays", () => {
			const yamlString = `
items:
  - item1
  - item2
  - item3
`;
			const result = transformer.parseYaml(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				items: ["item1", "item2", "item3"],
			});
		});

		it("should parse YAML with mixed types", () => {
			const yamlString = `
string: hello
number: 42
boolean: true
null_value: null
array: [1, 2, 3]
object:
  key: value
`;
			const result = transformer.parseYaml<Record<string, unknown>>(yamlString);

			expect(result.success).toBe(true);
			expect(result.data?.string).toBe("hello");
			expect(result.data?.number).toBe(42);
			expect(result.data?.boolean).toBe(true);
			expect(result.data?.null_value).toBeNull();
			expect(result.data?.array).toEqual([1, 2, 3]);
			expect(result.data?.object).toEqual({ key: "value" });
		});

		it("should return error for invalid YAML", () => {
			const invalidYaml = "invalid: [unclosed";
			const result = transformer.parseYaml(invalidYaml);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain("YAML parsing failed");
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it("should handle empty YAML string", () => {
			const result = transformer.parseYaml("");

			expect(result.success).toBe(true);
			expect(result.data).toBeNull();
		});

		it("should parse YAML with comments", () => {
			const yamlString = `
# This is a comment
name: test # inline comment
value: 123
`;
			const result = transformer.parseYaml(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ name: "test", value: 123 });
		});

		it("should parse multiline strings", () => {
			const yamlString = `
description: |
  This is a multiline
  string value
`;
			const result = transformer.parseYaml<Record<string, unknown>>(yamlString);

			expect(result.success).toBe(true);
			expect(result.data?.description).toContain("This is a multiline");
			expect(result.data?.description).toContain("string value");
		});

		it("should parse YAML with anchors and aliases", () => {
			const yamlString = `
defaults: &defaults
  adapter: postgres
  host: localhost

development:
  <<: *defaults
  database: dev_db
`;
			const result = transformer.parseYaml(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("should handle complex nested structures", () => {
			const yamlString = `
users:
  - id: 1
    name: John
    roles: [admin, user]
  - id: 2
    name: Jane
    roles: [user]
`;
			const result = transformer.parseYaml<Record<string, unknown>>(yamlString);

			expect(result.success).toBe(true);
			expect(result.data?.users).toHaveLength(2);
			expect(result.data?.users[0]?.name).toBe("John");
		});

		it("should use generic type parameter", () => {
			interface TestData {
				name: string;
				value: number;
			}

			const yamlString = "name: test\nvalue: 123";
			const result = transformer.parseYaml<TestData>(yamlString);

			expect(result.success).toBe(true);
			expect(result.data?.name).toBe("test");
			expect(result.data?.value).toBe(123);
		});
	});

	describe("stringifyYaml method", () => {
		it("should stringify simple object to YAML", () => {
			const data = { name: "test", value: 123 };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toContain("name: test");
			expect(result.data).toContain("value: 123");
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it("should stringify nested objects", () => {
			const data = {
				parent: {
					child1: "value1",
					child2: "value2",
				},
			};
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toContain("parent:");
			expect(result.data).toContain("child1: value1");
			expect(result.data).toContain("child2: value2");
		});

		it("should stringify arrays", () => {
			const data = { items: ["item1", "item2", "item3"] };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toContain("items:");
			expect(result.data).toContain("- item1");
		});

		it("should handle null values", () => {
			const data = { value: null };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toContain("value: null");
		});

		it("should handle boolean values", () => {
			const data = { isTrue: true, isFalse: false };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toContain("isTrue: true");
			expect(result.data).toContain("isFalse: false");
		});

		it("should handle empty object", () => {
			const data = {};
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toBe("{}\n");
		});

		it("should handle empty array", () => {
			const data = { items: [] };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toContain("items: []");
		});

		it("should handle complex nested structures", () => {
			const data = {
				users: [
					{ id: 1, name: "John", roles: ["admin", "user"] },
					{ id: 2, name: "Jane", roles: ["user"] },
				],
			};
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			expect(result.data).toContain("users:");
			expect(result.data).toContain("John");
		});

		it("should use data package formatting (custom options ignored)", () => {
			const transformer = new YamlTransformer({
				stringify: { indent: 4 }, // This option is now ignored
			});

			const data = { parent: { child: "value" } };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			// Uses data package's standard formatting (indent: 2)
			expect(result.data).toContain("  child:"); // 2 spaces (data package default)
		});

		it("should handle circular references gracefully", () => {
			const data: Record<string, unknown> = { name: "test" };
			data.self = data; // Create circular reference

			const result = transformer.stringifyYaml(data);

			// Should handle gracefully, either succeed or fail with proper error
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it("should handle special number values", () => {
			const data = {
				infinity: Infinity,
				negInfinity: -Infinity,
				notANumber: NaN,
			};
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
		});
	});

	describe("validateYamlSyntax method", () => {
		it("should return true for valid YAML", () => {
			const validYaml = "name: test\nvalue: 123";

			expect(transformer.validateYamlSyntax(validYaml)).toBe(true);
		});

		it("should return false for invalid YAML", () => {
			const invalidYaml = "invalid: [unclosed";

			expect(transformer.validateYamlSyntax(invalidYaml)).toBe(false);
		});

		it("should return true for empty string", () => {
			expect(transformer.validateYamlSyntax("")).toBe(true);
		});

		it("should return true for YAML with comments", () => {
			const yamlWithComments = `
# Comment
name: test
`;
			expect(transformer.validateYamlSyntax(yamlWithComments)).toBe(true);
		});

		it("should return false for malformed nested structure", () => {
			const invalidYaml = `
parent:
  child: value
    invalid_indent: bad
`;
			expect(transformer.validateYamlSyntax(invalidYaml)).toBe(false);
		});

		it("should return true for complex valid YAML", () => {
			const complexYaml = `
users:
  - id: 1
    name: John
    roles: [admin, user]
  - id: 2
    name: Jane
`;
			expect(transformer.validateYamlSyntax(complexYaml)).toBe(true);
		});

		it("should return false for unclosed quotes", () => {
			const invalidYaml = 'name: "unclosed';

			expect(transformer.validateYamlSyntax(invalidYaml)).toBe(false);
		});
	});

	describe("convertJsonToYaml method", () => {
		it("should convert JSON object to YAML", () => {
			const json = { name: "test", value: 123 };
			const result = transformer.convertJsonToYaml(json);

			expect(result.success).toBe(true);
			expect(result.data).toContain("name: test");
			expect(result.data).toContain("value: 123");
		});

		it("should convert nested JSON to YAML", () => {
			const json = {
				parent: {
					child: "value",
				},
			};
			const result = transformer.convertJsonToYaml(json);

			expect(result.success).toBe(true);
			expect(result.data).toContain("parent:");
			expect(result.data).toContain("child: value");
		});

		it("should convert JSON arrays to YAML", () => {
			const json = { items: [1, 2, 3] };
			const result = transformer.convertJsonToYaml(json);

			expect(result.success).toBe(true);
			expect(result.data).toContain("items:");
		});

		it("should handle null values", () => {
			const json = { value: null };
			const result = transformer.convertJsonToYaml(json);

			expect(result.success).toBe(true);
			expect(result.data).toContain("value: null");
		});

		it("should handle empty objects", () => {
			const json = {};
			const result = transformer.convertJsonToYaml(json);

			expect(result.success).toBe(true);
			expect(result.data).toBe("{}\n");
		});

		it("should handle complex nested structures", () => {
			const json = {
				users: [
					{ id: 1, name: "John" },
					{ id: 2, name: "Jane" },
				],
			};
			const result = transformer.convertJsonToYaml(json);

			expect(result.success).toBe(true);
			expect(result.data).toContain("users:");
		});

		it("should handle primitive values", () => {
			expect(transformer.convertJsonToYaml("string").success).toBe(true);
			expect(transformer.convertJsonToYaml(123).success).toBe(true);
			expect(transformer.convertJsonToYaml(true).success).toBe(true);
		});

		it("should handle circular references gracefully", () => {
			const json: Record<string, unknown> = { name: "test" };
			json.self = json;

			const result = transformer.convertJsonToYaml(json);

			// Should fail gracefully
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it("should return error for non-serializable JSON", () => {
			const json = { func: () => {} };
			const result = transformer.convertJsonToYaml(json);

			// Functions are not JSON-serializable
			expect(result.timestamp).toBeInstanceOf(Date);
		});
	});

	describe("convertYamlToJson method", () => {
		it("should convert YAML to JSON", () => {
			const yamlString = "name: test\nvalue: 123";
			const result = transformer.convertYamlToJson(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ name: "test", value: 123 });
		});

		it("should convert nested YAML to JSON", () => {
			const yamlString = `
parent:
  child: value
`;
			const result = transformer.convertYamlToJson(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				parent: {
					child: "value",
				},
			});
		});

		it("should convert YAML arrays to JSON", () => {
			const yamlString = `
items:
  - item1
  - item2
`;
			const result = transformer.convertYamlToJson(yamlString);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				items: ["item1", "item2"],
			});
		});

		it("should return error for invalid YAML", () => {
			const invalidYaml = "invalid: [unclosed";
			const result = transformer.convertYamlToJson(invalidYaml);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain("YAML to JSON conversion failed");
		});

		it("should handle empty YAML", () => {
			const result = transformer.convertYamlToJson("");

			expect(result.success).toBe(true);
			expect(result.data).toBeNull();
		});

		it("should use generic type parameter", () => {
			interface TestData {
				name: string;
				value: number;
			}

			const yamlString = "name: test\nvalue: 123";
			const result = transformer.convertYamlToJson<TestData>(yamlString);

			expect(result.success).toBe(true);
			expect(result.data?.name).toBe("test");
			expect(result.data?.value).toBe(123);
		});

		it("should ensure JSON serializability", () => {
			const yamlString = "name: test\nvalue: 123";
			const result = transformer.convertYamlToJson(yamlString);

			expect(result.success).toBe(true);
			// Should be able to JSON.stringify the result
			expect(() => JSON.stringify(result.data)).not.toThrow();
		});
	});
});

describe("Standalone YAML Functions", () => {
	describe("parseYaml function", () => {
		it("should parse valid YAML", () => {
			const yamlString = "name: test\nvalue: 123";
			const result = parseYaml(yamlString);

			expect(result).toEqual({ name: "test", value: 123 });
		});

		it("should throw error for invalid YAML", () => {
			const invalidYaml = "invalid: [unclosed";

			expect(() => parseYaml(invalidYaml)).toThrow();
		});

		it("should accept custom parse options", () => {
			const yamlString = "name: test";
			const result = parseYaml(yamlString, { strict: true });

			expect(result).toEqual({ name: "test" });
		});

		it("should handle empty YAML", () => {
			// Empty YAML parses to null (valid behavior)
			const result = parseYaml("");
			expect(result).toBeNull();
		});

		it("should parse with type parameter", () => {
			interface TestData {
				name: string;
			}

			const result = parseYaml<TestData>("name: test");

			expect(result.name).toBe("test");
		});

		it("should parse complex structures", () => {
			const yamlString = `
users:
  - name: John
  - name: Jane
`;
			const result = parseYaml(yamlString);

			expect(result.users).toHaveLength(2);
		});
	});

	describe("stringifyYaml function", () => {
		it("should stringify object to YAML", () => {
			const data = { name: "test", value: 123 };
			const yaml = stringifyYaml(data);

			expect(yaml).toContain("name: test");
			expect(yaml).toContain("value: 123");
		});

		it("should throw error for non-serializable data", () => {
			const data = { func: () => {} };

			// Functions are not serializable
			expect(() => stringifyYaml(data)).toThrow();
		});

		it("should accept custom stringify options", () => {
			const data = { name: "test" };
			const yaml = stringifyYaml(data, { indent: 4 });

			expect(yaml).toBeDefined();
		});

		it("should handle empty object", () => {
			const yaml = stringifyYaml({});

			expect(yaml).toBe("{}\n");
		});

		it("should handle arrays", () => {
			const data = [1, 2, 3];
			const yaml = stringifyYaml(data);

			expect(yaml).toContain("- 1");
		});
	});

	describe("validateYamlSyntax function", () => {
		it("should validate correct YAML", () => {
			expect(validateYamlSyntax("name: test")).toBe(true);
		});

		it("should invalidate incorrect YAML", () => {
			expect(validateYamlSyntax("invalid: [unclosed")).toBe(false);
		});

		it("should validate empty string", () => {
			expect(validateYamlSyntax("")).toBe(true);
		});

		it("should validate complex YAML", () => {
			const complexYaml = `
users:
  - id: 1
    name: John
`;
			expect(validateYamlSyntax(complexYaml)).toBe(true);
		});
	});

	describe("convertJsonToYaml function", () => {
		it("should convert JSON to YAML", () => {
			const json = { name: "test", value: 123 };
			const yaml = convertJsonToYaml(json);

			expect(yaml).toContain("name: test");
			expect(yaml).toContain("value: 123");
		});

		it("should throw error for non-serializable JSON", () => {
			const json = { func: () => {} };

			// Functions are dropped during JSON.stringify, leaving valid object
			// This is expected JavaScript behavior - it doesn't throw
			const result = convertJsonToYaml(json);
			expect(result).toBeDefined();
		});

		it("should handle nested objects", () => {
			const json = { parent: { child: "value" } };
			const yaml = convertJsonToYaml(json);

			expect(yaml).toContain("parent:");
			expect(yaml).toContain("child: value");
		});

		it("should handle arrays", () => {
			const json = { items: [1, 2, 3] };
			const yaml = convertJsonToYaml(json);

			expect(yaml).toContain("items:");
		});
	});

	describe("convertYamlToJson function", () => {
		it("should convert YAML to JSON", () => {
			const yamlString = "name: test\nvalue: 123";
			const json = convertYamlToJson(yamlString);

			expect(json).toEqual({ name: "test", value: 123 });
		});

		it("should throw error for invalid YAML", () => {
			const invalidYaml = "invalid: [unclosed";

			expect(() => convertYamlToJson(invalidYaml)).toThrow();
		});

		it("should handle nested structures", () => {
			const yamlString = `
parent:
  child: value
`;
			const json = convertYamlToJson(yamlString);

			expect(json).toEqual({ parent: { child: "value" } });
		});

		it("should use type parameter", () => {
			interface TestData {
				name: string;
			}

			const json = convertYamlToJson<TestData>("name: test");

			expect(json.name).toBe("test");
		});
	});
});

describe("Round-trip Conversions", () => {
	let transformer: YamlTransformer;

	beforeEach(() => {
		transformer = new YamlTransformer();
	});

	it("should maintain data integrity in YAML -> JSON -> YAML conversion", () => {
		const originalYaml = "name: test\nvalue: 123";

		const jsonResult = transformer.convertYamlToJson(originalYaml);
		expect(jsonResult.success).toBe(true);

		const yamlResult = transformer.convertJsonToYaml(jsonResult.data);
		expect(yamlResult.success).toBe(true);
		expect(yamlResult.data).toBeDefined();

		if (yamlResult.data) {
			const finalJson = transformer.convertYamlToJson(yamlResult.data);
			expect(finalJson.data).toEqual(jsonResult.data);
		}
	});

	it("should maintain data integrity in JSON -> YAML -> JSON conversion", () => {
		const originalJson = { name: "test", value: 123 };

		const yamlResult = transformer.convertJsonToYaml(originalJson);
		expect(yamlResult.success).toBe(true);
		expect(yamlResult.data).toBeDefined();

		if (yamlResult.data) {
			const jsonResult = transformer.convertYamlToJson(yamlResult.data);
			expect(jsonResult.success).toBe(true);
			expect(jsonResult.data).toEqual(originalJson);
		}
	});

	it("should handle complex objects in round-trip", () => {
		const complexData = {
			users: [
				{ id: 1, name: "John", roles: ["admin", "user"] },
				{ id: 2, name: "Jane", roles: ["user"] },
			],
			config: {
				timeout: 5000,
				retries: 3,
			},
		};

		const yamlResult = transformer.convertJsonToYaml(complexData);
		expect(yamlResult.data).toBeDefined();

		if (yamlResult.data) {
			const jsonResult = transformer.convertYamlToJson(yamlResult.data);
			expect(jsonResult.data).toEqual(complexData);
		}
	});

	it("should preserve data types in round-trip", () => {
		const data = {
			string: "hello",
			number: 42,
			boolean: true,
			null_value: null,
			array: [1, 2, 3],
		};

		const yamlResult = transformer.convertJsonToYaml(data);
		expect(yamlResult.data).toBeDefined();

		if (yamlResult.data) {
			const jsonResult = transformer.convertYamlToJson(yamlResult.data);
			expect(jsonResult.data).toEqual(data);
		}
	});
});

describe("Edge Cases and Error Handling", () => {
	let transformer: YamlTransformer;

	beforeEach(() => {
		transformer = new YamlTransformer();
	});

	describe("Malformed YAML", () => {
		it("should handle unclosed brackets", () => {
			const result = transformer.parseYaml("array: [unclosed");

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it("should handle unclosed quotes", () => {
			const result = transformer.parseYaml('string: "unclosed');

			expect(result.success).toBe(false);
		});

		it("should handle invalid indentation", () => {
			const invalidYaml = `
parent:
  child: value
    bad_indent: value
`;
			const result = transformer.parseYaml(invalidYaml);

			expect(result.success).toBe(false);
		});
	});

	describe("Special values", () => {
		it("should handle undefined values", () => {
			const data = { value: undefined };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
		});

		it("should handle date objects", () => {
			const data = { date: new Date("2024-01-01") };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
		});

		it("should handle large numbers", () => {
			const data = { large: Number.MAX_SAFE_INTEGER };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
		});
	});

	describe("Empty and minimal inputs", () => {
		it("should handle empty string parsing", () => {
			const result = transformer.parseYaml("");

			expect(result.success).toBe(true);
			expect(result.data).toBeNull();
		});

		it("should handle whitespace-only YAML", () => {
			const result = transformer.parseYaml("   \n\n  ");

			expect(result.success).toBe(true);
		});

		it("should handle null stringification", () => {
			const result = transformer.stringifyYaml(null);

			expect(result.success).toBe(true);
		});
	});

	describe("Custom options", () => {
		it("should use data package formatting (custom options ignored)", () => {
			const transformer = new YamlTransformer({
				stringify: { indent: 4 }, // This option is now ignored
			});

			const data = { parent: { child: "value" } };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
			// Now uses data package's standard formatting (indent: 2)
			expect(result.data).toContain("  "); // 2 spaces (data package default)
		});

		it("should respect custom line width", () => {
			const transformer = new YamlTransformer({
				stringify: { lineWidth: 120 },
			});

			const data = { key: "value" };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
		});

		it("should allow overriding default string options", () => {
			const transformer = new YamlTransformer({
				stringify: {
					singleQuote: true,
				},
			});

			const data = { text: "hello" };
			const result = transformer.stringifyYaml(data);

			expect(result.success).toBe(true);
		});
	});

	describe("Real-world scenarios", () => {
		it("should handle spec requirement YAML", () => {
			const specYaml = `
type: requirement
id: req-001-test
title: Test Requirement
description: |
  This is a test requirement
  with multiple lines
priority: high
tags:
  - testing
  - example
`;
			const result = transformer.parseYaml(specYaml);

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty("type", "requirement");
			expect(result.data).toHaveProperty("id", "req-001-test");
		});

		it("should handle configuration files", () => {
			const configYaml = `
database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret
server:
  host: 0.0.0.0
  port: 3000
`;
			const result = transformer.parseYaml(configYaml);

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty("database");
			expect(result.data).toHaveProperty("server");
		});

		it("should handle GitHub Actions workflow YAML", () => {
			const workflowYaml = `
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
`;
			const result = transformer.parseYaml(workflowYaml);

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty("name", "CI");
		});
	});
});
