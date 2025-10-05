/**
 * Generate interview-style setup guidance
 */
export function generateSetupGuidance(): string {
	const sections: string[] = [];

	// Interview-style introduction
	sections.push("# 🚀 Welcome to Spec MCP Setup");
	sections.push("");
	sections.push(
		"I'll help you set up spec-driven development for your project. Let me ask a few questions to provide the best guidance for your needs.",
	);
	sections.push("");
	sections.push("## Let's get started!");
	sections.push("");
	sections.push(
		"First, I'd like to understand your project context. Please tell me about:",
	);
	sections.push("");
	sections.push("1. **What kind of project are you building?**");
	sections.push("   - Web application");
	sections.push("   - API/Backend service");
	sections.push("   - Library/Package");
	sections.push("   - Full-stack application");
	sections.push("   - Something else");
	sections.push("");
	sections.push("2. **Do you already have code, or is this a new project?**");
	sections.push("");
	sections.push("3. **Are you working solo or with a team?** (If team, how many people?)");
	sections.push("");
	sections.push(
		"Once you share this information, I'll provide tailored setup instructions including:",
	);
	sections.push("- Directory structure for your specs");
	sections.push("- Example project constitution with principles for your project type");
	sections.push("- Claude Code agent configurations for planning and implementation");
	sections.push("- Optional slash commands for quick workflows");
	sections.push("");
	sections.push("---");
	sections.push("");
	sections.push(
		"**Please answer the questions above, and I'll generate your personalized setup guide!**",
	);
	sections.push("");

	sections.push("## 📚 Helpful Resources");
	sections.push("");
	sections.push(
		"While you think about your answers, you can explore these guides:",
	);
	sections.push("- `spec-mcp://guide/getting-started` - Quick start overview");
	sections.push("- `spec-mcp://guide/planning-workflow` - Feature planning process");
	sections.push(
		"- `spec-mcp://guide/implementation-workflow` - Development workflow",
	);
	sections.push("- `spec-mcp://guide/best-practices` - Patterns and tips");

	return sections.join("\n");
}


/**
 * Prompt arguments schema (empty - interview style)
 */
export const setupArgsSchema = {};
