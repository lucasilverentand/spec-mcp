import {
	type ParseOptions,
	type ToStringOptions,
	parse as yamlParse,
	stringify as yamlStringify,
} from "yaml";

/**
 * Standard YAML formatting options used across all spec files
 */
export const YAML_FORMAT_OPTIONS: ToStringOptions = {
	indent: 2,
	lineWidth: 100,
	minContentWidth: 20,
	doubleQuotedAsJSON: false,
	singleQuote: false,
	nullStr: "null",
	trueStr: "true",
	falseStr: "false",
};

/**
 * Format data as YAML string with consistent formatting
 */
export function formatYaml(data: unknown): string {
	return yamlStringify(data, YAML_FORMAT_OPTIONS);
}

/**
 * Parse YAML string to data
 */
export function parseYaml<T = unknown>(yamlString: string, options?: ParseOptions): T {
	return yamlParse(yamlString, options) as T;
}
