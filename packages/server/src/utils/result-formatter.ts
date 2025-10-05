import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { OperationResult } from "@spec-mcp/core";

/**
 * Formats an OperationResult into MCP CallToolResult format
 */
export function formatResult<T>(result: OperationResult<T>): CallToolResult {
	if (result.success) {
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							success: true,
							data: result.data,
						},
						null,
						2,
					),
				},
			],
		};
	}

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(
					{
						success: false,
						error: result.error,
					},
					null,
					2,
				),
			},
		],
		isError: true,
	};
}

/**
 * Formats a delete result
 */
export function formatDeleteResult(
	result: OperationResult<boolean>,
	entityType: string,
	id: string,
): CallToolResult {
	if (result.success && result.data) {
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							success: true,
							message: `Successfully deleted ${entityType} with ID: ${id}`,
							id,
							entityType,
						},
						null,
						2,
					),
				},
			],
		};
	}

	if (result.success && !result.data) {
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							success: false,
							error: `${entityType} with ID ${id} not found`,
						},
						null,
						2,
					),
				},
			],
			isError: true,
		};
	}

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(
					{
						success: false,
						error: result.error,
					},
					null,
					2,
				),
			},
		],
		isError: true,
	};
}
