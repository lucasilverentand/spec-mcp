import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerMode } from "../config/mode-config.js";
import { isToolEnabled } from "../config/mode-config.js";
import { logger } from "./logger.js";

/**
 * Conditional tool registration wrapper
 * Only registers tools if they are enabled in the current mode
 */
export class ConditionalToolRegistrar {
	private registeredTools: string[] = [];
	private skippedTools: string[] = [];

	constructor(
		private readonly server: McpServer,
		private readonly mode: ServerMode,
	) {}

	/**
	 * Register a tool conditionally based on the current mode
	 * @param toolName - Name of the tool
	 * @param description - Tool description
	 * @param schema - Zod schema or empty object for tools without parameters
	 * @param handler - Tool handler function
	 * @returns true if the tool was registered, false if skipped
	 */
	registerTool(
		toolName: string,
		description: string,
		// biome-ignore lint/suspicious/noExplicitAny: Schema and handler types are too complex to type precisely
		schemaOrHandler: any,
		// biome-ignore lint/suspicious/noExplicitAny: Handler needs to accept validated args from Zod schema
		handler?: any,
	): boolean {
		// Check if tool is enabled in current mode
		if (!isToolEnabled(toolName, this.mode)) {
			this.skippedTools.push(toolName);
			logger.debug(
				{ toolName, mode: this.mode },
				"Skipping tool registration (not enabled in current mode)",
			);
			return false;
		}

		// Handle tools without parameters (schema is actually the handler)
		if (typeof schemaOrHandler === "function" && !handler) {
			this.server.tool(toolName, description, schemaOrHandler);
		} else if (handler) {
			this.server.tool(toolName, description, schemaOrHandler, handler);
		} else {
			throw new Error(
				`Invalid tool registration for ${toolName}: missing handler`,
			);
		}

		this.registeredTools.push(toolName);
		logger.debug({ toolName, mode: this.mode }, "Registered tool successfully");
		return true;
	}

	/**
	 * Get summary of tool registration
	 */
	getSummary(): {
		mode: ServerMode;
		registered: number;
		skipped: number;
		registeredTools: string[];
		skippedTools: string[];
	} {
		return {
			mode: this.mode,
			registered: this.registeredTools.length,
			skipped: this.skippedTools.length,
			registeredTools: [...this.registeredTools],
			skippedTools: [...this.skippedTools],
		};
	}

	/**
	 * Log registration summary
	 */
	logSummary(): void {
		const summary = this.getSummary();
		logger.info(
			{
				mode: summary.mode,
				registered: summary.registered,
				skipped: summary.skipped,
			},
			`Tool registration complete: ${summary.registered} registered, ${summary.skipped} skipped`,
		);

		if (summary.skipped > 0) {
			logger.debug(
				{ skippedTools: summary.skippedTools },
				`Skipped tools in ${summary.mode} mode`,
			);
		}
	}
}
