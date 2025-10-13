/**
 * Prompt registration for interactive workflows
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "./utils/logger.js";

/**
 * Register all prompts with the MCP server
 */
export function registerPrompts(server: McpServer): void {
	logger.info("Registering prompts");

	// Setup Specs - Project initialization interview
	server.prompt(
		"setup-specs",
		"Interactive interview to set up foundational specs (Constitution, Components, Milestones) for a new or existing project",
		async () => {
			return {
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: `# Setup Specs - Project Initialization Interview

You are helping the user set up their project's foundational specification documents. This is typically done once at the beginning of a project or when adopting spec-mcp for an existing project.

## Your Task

Conduct a friendly, conversational interview to gather information and create the following foundational specs:

1. **Constitution (CST)** - Project principles and standards
2. **Components (CMP)** - System architecture and building blocks
3. **Initial Milestone (MLS)** - First release planning (optional)

## Interview Process

### Phase 1: Project Understanding

Start by reading the Spec Types Guide to understand the spec system:
- Use the MCP resource: \`spec-mcp://guide/spec-types\`

Then ask about their project:
1. **Project type**: Is this a new project or existing? What kind? (web app, library, microservices, etc.)
2. **Current state**: What exists already? Any code, docs, or architecture decisions made?
3. **Team context**: Solo developer or team? Any existing practices or standards?
4. **Goals**: What are they trying to build or improve?

### Phase 2: Constitution (CST)

Explain: "Let's establish your project's constitution - the principles and standards that guide all development."

Ask about:
1. **Core principles**: What values drive this project? (e.g., simplicity, performance, developer experience)
2. **Coding standards**: Any style guides, linting rules, or conventions?
3. **Architectural principles**: Any rules about dependencies, modularity, or structure?
4. **Process guidelines**: How does work get done? (Git workflow, testing requirements, review process)
5. **Quality requirements**: Performance benchmarks, accessibility standards, security requirements?

After gathering info, create the Constitution using \`mcp__spec-mcp__start_draft\` with type "constitution".

### Phase 3: Components (CMP)

Explain: "Now let's map out your system's components - the main building blocks."

For each component, ask:
1. **Component name**: What is it called?
2. **Type**: Service, library, application, database, or other?
3. **Purpose**: What does it do? (brief description)
4. **Technology stack**: What's it built with? (frameworks, languages)
5. **Location**: Where does it live? (folder path, repository)
6. **Deployment**: Where/how is it deployed? (if applicable)
7. **Dependencies**: What external services or APIs does it depend on?

Guide them based on their project type:
- **Web app**: Likely has frontend, backend/API, database components
- **Library**: Main library package, maybe docs site, examples
- **Microservices**: Multiple service components, shared libraries, infrastructure

Create each component using \`mcp__spec-mcp__start_draft\` with type "component".

### Phase 4: Initial Milestone (Optional)

Ask: "Would you like to create an initial milestone to organize your first release or sprint?"

If yes:
1. **Milestone name**: What's this release called? (e.g., "v1.0", "MVP", "Sprint 1")
2. **Target date**: When are you aiming to complete this?
3. **Goals**: What are the main objectives?
4. **Success criteria**: How will you know it's done?

Create milestone using \`mcp__spec-mcp__start_draft\` with type "milestone".

## Interview Style

- **Be conversational**: Ask questions naturally, not like a form
- **Adapt to responses**: Skip irrelevant questions, dig deeper when needed
- **Provide examples**: Help them understand what you're asking for
- **Suggest defaults**: Offer reasonable defaults based on common patterns
- **Be efficient**: Don't ask about things already obvious from context
- **Show progress**: Let them know what phase you're on

## After Interview

Once you've created the foundational specs, summarize what was created:
- List each spec with its ID and brief description
- Explain next steps: "Now you can create Business Requirements (BRDs), Technical Requirements (PRDs), and Plans (PLNs) as you develop features"
- Offer to help with the next task: "Would you like to create your first plan or requirement?"

## Important Notes

- Use the actual MCP tools to create specs (\`start_draft\`, \`answer_question\`, \`finalize_entity\`)
- Be patient - gathering good information takes time
- It's okay if they don't know everything - help them think through it
- For existing projects, focus on documenting what exists rather than designing from scratch
- Keep it focused - they can always add more specs later

Start by greeting the user and explaining what you'll do together!`,
						},
					},
				],
			};
		},
	);

	logger.info({ count: 1 }, "Prompts registered successfully");
}
