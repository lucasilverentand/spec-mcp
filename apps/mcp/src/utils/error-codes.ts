/**
 * Standardized error codes for MCP server operations
 */
export enum ErrorCode {
	// Configuration errors (1xxx)
	INVALID_CONFIG = "ERR_1001",
	INVALID_SPECS_PATH = "ERR_1002",
	PATH_NOT_WRITABLE = "ERR_1003",

	// MCP protocol errors (5xxx)
	CONNECTION_LOST = "ERR_5003",

	// Internal errors (9xxx)
	INTERNAL_ERROR = "ERR_9001",
	UNKNOWN_ERROR = "ERR_9999",
}

/**
 * Error class with code and additional context
 */
export class McpError extends Error {
	public override readonly cause?: Error | undefined;

	constructor(
		public readonly code: ErrorCode,
		message: string,
		public readonly context?: Record<string, unknown>,
		cause?: Error | undefined,
	) {
		super(message);
		this.name = "McpError";
		if (cause !== undefined) {
			this.cause = cause;
		}
	}

	toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			context: this.context,
			cause: this.cause?.message,
		};
	}
}

/**
 * Create a formatted error response for MCP clients
 */
export function formatErrorResponse(error: unknown) {
	if (error instanceof McpError) {
		return {
			code: error.code,
			message: error.message,
			context: error.context,
		};
	}

	if (error instanceof Error) {
		return {
			code: ErrorCode.INTERNAL_ERROR,
			message: error.message,
		};
	}

	return {
		code: ErrorCode.UNKNOWN_ERROR,
		message: String(error),
	};
}
