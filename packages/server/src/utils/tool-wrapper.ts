import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type { ToolContext } from "../tools/index.js";
import { ErrorCode, formatErrorResponse, McpError } from "./error-codes.js";
import { createRequestLogger, logOperation } from "./logger.js";

/**
 * Wrap a tool handler with middleware (logging, rate limiting, error handling, validation)
 */
export function wrapToolHandler<TInput>(
	toolName: string,
	handler: (input: TInput) => Promise<CallToolResult>,
	context: ToolContext,
	schema?: z.ZodSchema<TInput>,
): (input: TInput) => Promise<CallToolResult> {
	return async (input: TInput): Promise<CallToolResult> => {
		// Generate correlation ID for request tracking
		const correlationId = `${toolName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		const log = createRequestLogger(correlationId);

		try {
			// Check rate limit
			context.rateLimiter.check(toolName);

			// Validate input with Zod schema if provided
			let validatedInput = input;
			if (schema) {
				try {
					validatedInput = schema.parse(input);
					log.debug({ input: validatedInput }, "Input validated");
				} catch (error) {
					log.error({ error, input }, "Input validation failed");
					throw new McpError(
						ErrorCode.INVALID_INPUT,
						`Invalid input for tool ${toolName}`,
						{ validationError: error },
					);
				}
			}

			// Log and execute with timing
			return await logOperation(
				toolName,
				async () => {
					try {
						log.debug({ input: validatedInput }, "Tool invoked");
						const result = await handler(validatedInput);
						log.debug({ result }, "Tool completed");
						return result;
					} catch (error) {
						log.error({ error, input: validatedInput }, "Tool failed");
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
			// Handle rate limit errors and other pre-execution errors
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
