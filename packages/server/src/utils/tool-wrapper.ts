import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { formatErrorResponse, McpError } from "./error-codes.js";
import { createRequestLogger, logOperation } from "./logger.js";

/**
 * Wrap a tool handler with error handling and logging
 */
export function wrapToolHandler<TInput>(
	toolName: string,
	handler: (input: TInput) => Promise<CallToolResult>,
): (input: TInput) => Promise<CallToolResult> {
	return async (input: TInput): Promise<CallToolResult> => {
		// Generate correlation ID for request tracking
		const correlationId = `${toolName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		const log = createRequestLogger(correlationId);

		try {
			// Log and execute with timing
			return await logOperation(
				toolName,
				async () => {
					try {
						log.debug({ input }, "Tool invoked");
						const result = await handler(input);
						log.debug({ result }, "Tool completed");
						return result;
					} catch (error) {
						log.error({ error, input }, "Tool failed");
						// Return error as proper CallToolResult
						const errorResponse = formatErrorResponse(error);
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(errorResponse, null, 2),
								},
							],
							isError: true,
						};
					}
				},
				{ tool: toolName, correlationId },
			);
		} catch (error) {
			// Handle any pre-execution errors
			log.error({ error, input }, "Tool execution blocked");
			if (error instanceof McpError) {
				const errorResponse = formatErrorResponse(error);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(errorResponse, null, 2),
						},
					],
					isError: true,
				};
			}
			throw error;
		}
	};
}
