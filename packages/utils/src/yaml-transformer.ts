import type { ParseOptions, ToStringOptions } from "yaml";
import { parse as yamlParse } from "yaml";
import {
	formatYaml as dataFormatYaml,
	parseYaml as dataParseYaml,
} from "@spec-mcp/data";
import type { OperationResult } from "./types.js";
import type { IYamlTransformer } from "./types.js";

export interface YamlTransformOptions {
	parse?: ParseOptions;
	stringify?: ToStringOptions;
}

export class YamlTransformer implements IYamlTransformer {
	private parseOptions: ParseOptions;

	constructor(options: YamlTransformOptions = {}) {
		this.parseOptions = {
			...options.parse,
		};
		// Note: stringify options are now handled by data package's formatYaml
	}

	parseYaml<T = unknown>(yamlString: string): OperationResult<T> {
		try {
			const data = yamlParse(yamlString, this.parseOptions) as T;
			return {
				success: true,
				data,
				
			};
		} catch (error) {
			return {
				success: false,
				error: `YAML parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				
			};
		}
	}

	stringifyYaml(data: unknown): OperationResult<string> {
		try {
			// Use data package's formatYaml for consistent formatting
			const yamlString = dataFormatYaml(data);
			return {
				success: true,
				data: yamlString,
				
			};
		} catch (error) {
			return {
				success: false,
				error: `YAML stringification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				
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
				
			};
		}
	}

	convertYamlToJson<T = unknown>(yamlString: string): OperationResult<T> {
		const parseResult = this.parseYaml<T>(yamlString);
		if (!parseResult.success) {
			return {
				success: false,
				error: `YAML to JSON conversion failed: ${parseResult.error}`,
				
			};
		}

		try {
			// Ensure the result is JSON-serializable
			const jsonString = JSON.stringify(parseResult.data);
			const jsonData = JSON.parse(jsonString) as T;

			return {
				success: true,
				data: jsonData,
				
			};
		} catch (error) {
			return {
				success: false,
				error: `YAML to JSON conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				
			};
		}
	}
}

// Backward compatibility functions - now use data package functions
export function parseYaml<T = unknown>(
	content: string,
	options?: ParseOptions,
): T {
	try {
		return dataParseYaml<T>(content, options);
	} catch (error) {
		throw new Error(
			`YAML parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function stringifyYaml(
	data: unknown,
	_options?: ToStringOptions, // Options ignored, using data package formatting
): string {
	try {
		// Use data package's formatYaml for consistent formatting
		return dataFormatYaml(data);
	} catch (error) {
		throw new Error(
			`YAML stringification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function validateYamlSyntax(yamlString: string): boolean {
	try {
		yamlParse(yamlString);
		return true;
	} catch {
		return false;
	}
}

export function convertJsonToYaml(json: unknown): string {
	try {
		// First ensure it's valid JSON-serializable
		const jsonString = JSON.stringify(json);
		const parsedJson = JSON.parse(jsonString);

		// Then convert to YAML using data package
		return dataFormatYaml(parsedJson);
	} catch (error) {
		throw new Error(
			`JSON to YAML conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function convertYamlToJson<T = unknown>(yamlString: string): T {
	try {
		const data = dataParseYaml<T>(yamlString);

		// Ensure the result is JSON-serializable
		const jsonString = JSON.stringify(data);
		return JSON.parse(jsonString) as T;
	} catch (error) {
		throw new Error(
			`YAML to JSON conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
