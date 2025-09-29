/**
 * Standardized error codes for MCP server operations
 */
export enum ErrorCode {
	// Configuration errors (1xxx)
	INVALID_CONFIG = "ERR_1001",
	INVALID_SPECS_PATH = "ERR_1002",
	PATH_NOT_WRITABLE = "ERR_1003",

	// Validation errors (2xxx)
	VALIDATION_FAILED = "ERR_2001",
	INVALID_INPUT = "ERR_2002",
	SCHEMA_VALIDATION_FAILED = "ERR_2003",
	REFERENCE_VALIDATION_FAILED = "ERR_2004",

	// Security errors (3xxx)
	PATH_TRAVERSAL = "ERR_3001",
	UNAUTHORIZED_ACCESS = "ERR_3002",
	FILE_SIZE_EXCEEDED = "ERR_3003",
	RATE_LIMIT_EXCEEDED = "ERR_3004",

	// File operation errors (4xxx)
	FILE_NOT_FOUND = "ERR_4001",
	FILE_READ_ERROR = "ERR_4002",
	FILE_WRITE_ERROR = "ERR_4003",
	FILE_DELETE_ERROR = "ERR_4004",
	FILE_LOCKED = "ERR_4005",

	// MCP protocol errors (5xxx)
	TOOL_NOT_FOUND = "ERR_5001",
	TOOL_EXECUTION_FAILED = "ERR_5002",
	CONNECTION_LOST = "ERR_5003",
	TRANSPORT_ERROR = "ERR_5004",

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
