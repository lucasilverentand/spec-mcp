import pino from "pino";

/**
 * Logger instance for the MCP server
 * Uses structured logging with correlation IDs and context
 */
const pinoOptions: Record<string, unknown> = {
	level: process.env.LOG_LEVEL || "info",
	base: {
		service: "spec-mcp",
		version: "0.1.0",
	},
};

// Disable pretty printing when running via MCP Inspector or in production
// MCP protocol requires stdout to be reserved for JSON messages only
const isMcpMode =
	process.env.MCP_MODE === "true" || process.stdin.isTTY === false;
if (process.env.NODE_ENV !== "production" && !isMcpMode) {
	pinoOptions.transport = {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "HH:MM:ss Z",
			ignore: "pid,hostname",
		},
	};
}

export const logger = pino(
	pinoOptions,
	// Ensure logs go to stderr to not interfere with stdio MCP communication
	pino.destination({ dest: 2, sync: false }),
);

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>) {
	return logger.child(context);
}

/**
 * Create a logger with correlation ID for request tracking
 */
export function createRequestLogger(correlationId: string) {
	return logger.child({ correlationId });
}

/**
 * Log operation with timing
 */
export async function logOperation<T>(
	operation: string,
	fn: () => Promise<T>,
	context?: Record<string, unknown>,
): Promise<T> {
	const start = Date.now();
	const log = context ? logger.child(context) : logger;

	log.info({ operation }, "Operation started");

	try {
		const result = await fn();
		const duration = Date.now() - start;
		log.info({ operation, duration }, "Operation completed");
		return result;
	} catch (error) {
		const duration = Date.now() - start;
		log.error({ operation, duration, error }, "Operation failed");
		throw error;
	}
}
