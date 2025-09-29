import {
	type ParseOptions,
	type ToStringOptions,
	parse as yamlParse,
	stringify as yamlStringify,
} from "yaml";
import { ErrorFactory } from "../domain/errors.js";
import type { OperationResult } from "../interfaces/results.js";
import type { IYamlTransformer } from "../interfaces/transformer.js";

export interface YamlTransformOptions {
	parse?: ParseOptions;
	stringify?: ToStringOptions;
}

export class YamlTransformer implements IYamlTransformer {
	private parseOptions: ParseOptions;
	private stringifyOptions: ToStringOptions;

	constructor(options: YamlTransformOptions = {}) {
		this.parseOptions = {
			...options.parse,
		};

		this.stringifyOptions = {
			indent: 2,
			lineWidth: 100,
			minContentWidth: 20,
			doubleQuotedAsJSON: false,
			singleQuote: false,
			nullStr: "null",
			trueStr: "true",
			falseStr: "false",
			...options.stringify,
		};
	}

	parseYaml<T = unknown>(yamlString: string): OperationResult<T> {
		try {
			const data = yamlParse(yamlString, this.parseOptions) as T;
			return {
				success: true,
				data,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				success: false,
				error: `YAML parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				timestamp: new Date(),
			};
		}
	}

	stringifyYaml(data: unknown): OperationResult<string> {
		try {
			const yamlString = yamlStringify(data, this.stringifyOptions);
			return {
				success: true,
				data: yamlString,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				success: false,
				error: `YAML stringification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				timestamp: new Date(),
			};
		}
	}

	validateYamlSyntax(yamlString: string): boolean {
		try {
			yamlParse(yamlString, this.parseOptions);
			return true;
		} catch {
			return false;
		}
	}

	convertJsonToYaml(json: unknown): OperationResult<string> {
		try {
			// First ensure it's valid JSON-serializable
			const jsonString = JSON.stringify(json);
			const parsedJson = JSON.parse(jsonString);

			// Then convert to YAML
			return this.stringifyYaml(parsedJson);
		} catch (error) {
			return {
				success: false,
				error: `JSON to YAML conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				timestamp: new Date(),
			};
		}
	}

	convertYamlToJson<T = unknown>(yamlString: string): OperationResult<T> {
		const parseResult = this.parseYaml<T>(yamlString);
		if (!parseResult.success) {
			return {
				success: false,
				error: `YAML to JSON conversion failed: ${parseResult.error}`,
				timestamp: new Date(),
			};
		}

		try {
			// Ensure the result is JSON-serializable
			const jsonString = JSON.stringify(parseResult.data);
			const jsonData = JSON.parse(jsonString) as T;

			return {
				success: true,
				data: jsonData,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				success: false,
				error: `YAML to JSON conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				timestamp: new Date(),
			};
		}
	}
}

// Backward compatibility functions
const defaultTransformer = new YamlTransformer();

export function parseYaml<T = unknown>(
	content: string,
	options?: ParseOptions,
): T {
	const transformer = options
		? new YamlTransformer({ parse: options })
		: defaultTransformer;
	const result = transformer.parseYaml<T>(content);

	if (!result.success || !result.data) {
		throw ErrorFactory.io(result.error || "YAML parsing failed");
	}

	return result.data;
}

export function stringifyYaml(
	data: unknown,
	options?: ToStringOptions,
): string {
	const transformer = options
		? new YamlTransformer({ stringify: options })
		: defaultTransformer;
	const result = transformer.stringifyYaml(data);

	if (!result.success || !result.data) {
		throw ErrorFactory.io(result.error || "YAML stringification failed");
	}

	return result.data;
}

export function validateYamlSyntax(yamlString: string): boolean {
	return defaultTransformer.validateYamlSyntax(yamlString);
}

export function convertJsonToYaml(json: unknown): string {
	const result = defaultTransformer.convertJsonToYaml(json);

	if (!result.success || !result.data) {
		throw ErrorFactory.io(result.error || "JSON to YAML conversion failed");
	}

	return result.data;
}

export function convertYamlToJson<T = unknown>(yamlString: string): T {
	const result = defaultTransformer.convertYamlToJson<T>(yamlString);

	if (!result.success || !result.data) {
		throw ErrorFactory.io(result.error || "YAML to JSON conversion failed");
	}

	return result.data;
}
