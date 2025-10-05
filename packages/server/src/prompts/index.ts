import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { generateSetupGuidance, setupArgsSchema } from "./setup.js";

/**
 * Register all MCP prompts for the spec server
 */
export function registerPrompts(
	server: McpServer,
	_config: ServerConfig,
): void {
	// Register setup prompt
	server.registerPrompt(
		"setup",
		{
			title: "Setup",
			description:
				"Interview-style setup guide that asks about your project context and provides tailored instructions for directory structure, constitutions, and Claude Code agents",
			argsSchema: setupArgsSchema,
		},
		async () => {
			logger.debug("Generating setup interview prompt");

			const guidance = generateSetupGuidance();

			return {
				description:
					"Interview-style setup assistant for spec-mcp. Ask the user about their project type, team size, and whether they have existing code. Then provide tailored setup instructions including:\n" +
					"1. Directory structure commands\n" +
					"2. Example project constitution with principles for their project type (API, web-app, library, etc.)\n" +
					"3. Example requirement creation\n" +
					"4. Claude Code agent configurations (.claude/agents/planning-agent.md and implementation-agent.md)\n" +
					"5. Optional slash commands\n\n" +
					"Adapt recommendations based on:\n" +
					"- Project type (API: focus on API-first design, web-app: accessibility/performance, library: public API design)\n" +
					"- Team size (teams need code review principles, solo developers can skip)\n" +
					"- Existing code (add to existing vs new setup)\n\n" +
					"Be conversational and helpful. Ask clarifying questions if needed.",
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: "Help me set up spec-mcp for my project",
						},
					},
					{
						role: "assistant",
						content: {
							type: "text",
							text: guidance,
						},
					},
				],
			};
		},
	);

	logger.info({ promptCount: 1 }, "Prompts registered successfully");
}
