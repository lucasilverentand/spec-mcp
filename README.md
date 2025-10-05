# Spec MCP

A Model Context Protocol (MCP) server for managing software project specifications with intelligent tooling and AI-powered guidance.

## Overview

Spec MCP provides a structured approach to managing software requirements, plans, components, decisions, and project constitutions through the Model Context Protocol. It enables AI assistants to help you create, query, and analyze project specifications in a standardized, traceable way using guided Q&A workflows and comprehensive validation.

## Features

- **🤖 Guided Creation Flow** - AI-powered Q&A workflow for creating specs with research and validation
- **📚 Built-in LLM Guidance** - MCP resources with comprehensive workflow documentation and best practices
- **📋 Requirements Management** - Define what needs to be built with measurable acceptance criteria
- **📐 Component Modeling** - Structure your architecture (apps, services, libraries)
- **🗺️ Implementation Planning** - Create detailed plans with tasks, test cases, flows, and API contracts
- **⚖️ Decision Tracking** - Document architectural decisions and their rationale
- **📜 Project Constitutions** - Define guiding principles and standards for your project
- **🔍 Intelligent Querying** - Search, filter, sort with facets, dependency expansion, and next-task detection
- **📊 Dependency Analysis** - Understand relationships with metrics (fan-in/fan-out, coupling, stability)
- **✅ Validation** - Automated validation with reference checking, cycle detection, and health scoring

## Installation

### From npm (Recommended)

```bash
npm install -g @spec-mcp/server
```

### Using pnpm

```bash
pnpm add -g @spec-mcp/server
```

### Using npx (No Installation)

```bash
npx -y @spec-mcp/server
```

## Quick Start

### 1. Configure Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "npx",
      "args": ["-y", "@spec-mcp/server"]
    }
  }
}
```

**Optional Environment Variables:**
- `SPECS_PATH` - Specs folder relative to git root (default: auto-detects `specs` or `.specs`)

### 2. Create Your Specs Directory

```bash
mkdir -p specs/{requirements,plans,components,constitutions,decisions}
```

**Expected Directory Structure:**
```
specs/
├── requirements/     # What needs to be built
│   └── req-001-user-auth.yml
├── plans/           # How to build it
│   └── pln-001-auth-impl.yml
├── components/      # System architecture
│   ├── app-001-web-client.yml
│   └── svc-001-api-server.yml
├── constitutions/   # Project principles
│   └── con-001-code-standards.yml
└── decisions/       # Architectural decisions
    └── dec-001-jwt-tokens.yml
```

### 3. Create Your First Requirement

Ask Claude: "Create a requirement for user authentication"

Claude will guide you through a Q&A flow:
1. **Research** - Search for similar specs and review constitutions
2. **Define** - Name, description, priority
3. **Criteria** - Measurable acceptance criteria
4. **Finalize** - Review and create

### 4. Query and Analyze

```typescript
// Find next task to work on
query({ next_task: true })

// Search requirements
query({
  types: ["requirement"],
  search_terms: "authentication",
  mode: "summary"
})

// Validate system health
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
```

## Specification Types

| Type | Purpose | Example |
|------|---------|---------|
| **Requirement** | Define what needs to be built with acceptance criteria | User authentication system with OAuth support |
| **Component** | Model system architecture (apps, services, libraries) | Authentication service with database schema |
| **Plan** | Implementation details with tasks and test cases | Plan for implementing OAuth provider |
| **Decision** | Document architectural decisions | Decision to use JWT for session management |
| **Constitution** | Project principles and guidelines | Code quality standards, security requirements |

## How It Works: Guided Creation Flow

Spec MCP uses an intelligent Q&A workflow to help you create high-quality specifications:

### 1️⃣ Research Phase
- **Prevent Duplicates**: Searches existing specs for similar work
- **Constitution Alignment**: Reviews project principles and standards
- **Library Research**: Looks up third-party documentation via Context7
- **Best Practices**: Fetches architectural patterns and standards

### 2️⃣ Definition Phase
- **Structured Questions**: Guides you through naming, description, priority
- **Schema Validation**: Validates input at each step
- **Context-Aware**: Adapts questions based on spec type

### 3️⃣ Detailed Planning
- **Requirements**: Define measurable acceptance criteria
- **Components**: Specify capabilities, constraints, dependencies
- **Plans**: Break down into tasks, flows, test cases, APIs
- **Decisions**: Document options, rationale, and impact

### 4️⃣ Finalization
- **Auto-Mapping**: Converts Q&A data to proper schema
- **File Creation**: Generates well-formatted YAML
- **Validation**: Ensures all references and structure are valid

## Available Tools

### Creation Flow (Guided Q&A)
- **`start_draft`** - Begin creating a spec with guided Q&A workflow
  - Supports: requirement, component, plan, constitution, decision
  - Auto-research similar specs and constitutions
- **`update_draft`** - Answer questions step-by-step to build the spec
  - Collects data through structured questions
  - Validates input at each step
- **`finalize_draft`** - Complete the draft and create the specification
  - Maps collected data to schema
  - Creates final YAML file

### Management
- **`update_spec`** - Modify finalized specifications with validation
  - Update any field (name, description, priority, tasks, etc.)
  - Validates changes against schema
  - Locked specs only allow progress tracking updates
- **`delete_spec`** - Remove specifications or drafts
  - Auto-detects type from ID
  - Supports all spec types

### Querying
- **`query`** - Comprehensive unified query tool
  - **Modes**: summary, full, custom (with field selection)
  - **Lookup**: By ID, multiple IDs, or list/search
  - **Search**: Full-text with fuzzy matching support
  - **Filters**: Type-specific (priority, status, completion, dates, orphans, coverage)
  - **Sorting**: Multi-field sorting (relevance, date, priority, name)
  - **Pagination**: Offset/limit with metadata
  - **Facets**: Count aggregations by type, priority, status, folder
  - **Expansion**: Include dependencies, references, parent entities with metrics
  - **Next Task**: Auto-detect highest priority unblocked task
  - **Sub-entities**: Access tasks, test cases, flows, APIs, data models directly

### Validation
- **`validate`** - System-wide validation and health scoring
  - Reference checking (broken links)
  - Circular dependency detection
  - Health score (0-100) with breakdown
  - Entity-specific or system-wide validation

## MCP Resources & Prompts

### Resources

Spec MCP exposes comprehensive guidance documentation as MCP resources that AI assistants can discover and read automatically:

- **`spec-mcp://guide/getting-started`** - Quick start guide for spec-driven development
- **`spec-mcp://guide/planning-workflow`** - Complete workflow for planning features with specs
- **`spec-mcp://guide/implementation-workflow`** - Development workflow for implementing from specs
- **`spec-mcp://guide/best-practices`** - Patterns, anti-patterns, and tips
- **`spec-mcp://guide/query-guide`** - Complete guide for querying and analyzing specs

These resources help LLMs understand:
- When to use each spec type
- How to link specs together (requirements → plans via `criteria_id`)
- Best practices for creating effective specs
- Common workflows for planning and implementation
- Advanced querying patterns

### Prompts

Spec MCP provides interactive prompts for guided setup and workflows:

#### `setup-project` - Interview-Style Setup Guide

An interactive setup assistant that asks about your project and provides tailored guidance.

**How it works:**
1. Asks about your project type (web-app, API, library, fullstack, etc.)
2. Asks if you have existing code or starting fresh
3. Asks about your team size (solo or team)
4. Generates personalized setup instructions based on your answers

**What you get:**
1. **Directory Structure** - Commands to create `specs/` folders
2. **Project Constitution** - Example constitutions tailored to your project type
   - API projects: API-first design, versioning, error handling
   - Web apps: Accessibility, performance, component architecture
   - Libraries: Public API design, semantic versioning
3. **First Requirement** - Example requirement creation walkthrough
4. **Claude Code Agents** - Ready-to-use agent configurations:
   - **Planning Agent** (`.claude/agents/planning-agent.md`) - Plans features using spec-mcp workflows
   - **Implementation Agent** (`.claude/agents/implementation-agent.md`) - Implements tasks from specs
5. **Slash Commands** - Optional command shortcuts (`/plan`, `/next`, `/validate`)

**Usage in Claude Code:**
```
Help me set up spec-mcp for my project
```

The assistant will ask questions conversationally and adapt recommendations based on your specific context.

AI assistants can read these resources to provide better guidance without manual instruction.

## Architecture

This is a monorepo powered by **Turborepo** and **pnpm** workspaces:

### Packages

- **`@spec-mcp/server`** (v0.3.0) - MCP server implementation with tool registration
- **`@spec-mcp/core`** (v0.1.0) - Core business logic, operations, and validation engines
- **`@spec-mcp/data`** (v0.0.1) - Data schemas, YAML operations, and Zod validation
- **`@spec-mcp/cli`** (v0.1.0) - CLI tool for validating specs (`spec-validate`)
- **`@spec-mcp/utils`** (v0.1.0) - Shared utilities for file operations
- **`@spec-mcp/tsconfig`** - Shared TypeScript configuration

### Tech Stack

- **Runtime**: Node.js ≥18.0.0
- **Package Manager**: pnpm ≥8.0.0
- **Build System**: Turborepo + TypeScript
- **Testing**: Vitest with coverage
- **Linting/Formatting**: Biome
- **Protocol**: Model Context Protocol SDK v1.18.2
- **Validation**: Zod v3.23.8
- **Data Format**: YAML

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev

# Run MCP inspector for debugging
pnpm inspector
```

### Project Scripts

```bash
# Building
pnpm build          # Build all packages (turbo)
pnpm dev            # Watch mode for all packages (turbo)
pnpm clean          # Clean all build artifacts (turbo)

# Quality Checks
pnpm typecheck      # Type check all packages (turbo)
pnpm lint           # Lint with Biome
pnpm lint:fix       # Lint and auto-fix
pnpm format         # Format with Biome
pnpm format:check   # Check formatting
pnpm check          # Lint + format check
pnpm check:fix      # Lint + format and auto-fix

# Testing
pnpm test           # Run all tests (turbo)
pnpm test:watch     # Run tests in watch mode (turbo)
pnpm test:coverage  # Run tests with coverage (turbo)

# Utilities
pnpm pre-commit     # Pre-commit hook (lint + typecheck + test)
pnpm inspector      # Launch MCP Inspector for debugging
pnpm knip           # Find unused dependencies
```

## Documentation

Detailed documentation for each specification type:

- [Requirements](./docs/spec-types/requirement.md)
- [Components](./docs/spec-types/component.md)
- [Plans](./docs/spec-types/plan.md)
- [Decisions](./docs/spec-types/decision.md)
- [Constitutions](./docs/spec-types/constitution.md)

## Common Workflows

### Developer Flow: Finding What to Work On

```typescript
// 1. Get next recommended task (highest priority, unblocked)
query({ next_task: true })

// 2. Get full plan details with dependencies
query({
  entity_id: "pln-001-auth-impl",
  mode: "full",
  expand: {
    dependencies: true,
    dependency_metrics: true
  }
})

// 3. Mark task as completed
update_spec({
  id: "pln-001-auth-impl",
  updates: {
    tasks: [
      { id: "task-001", completed: true, verified: true }
    ]
  }
})

// 4. Validate system health
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
```

### Advanced Querying

```typescript
// Multi-filter search with facets
query({
  types: ["plan", "requirement"],
  search_terms: "authentication security",
  filters: {
    plan_priority: ["critical", "high"],
    plan_completed: false
  },
  include_facets: true,
  facet_fields: ["type", "priority", "status"],
  sort_by: [
    { field: "priority", order: "desc" },
    { field: "created_at", order: "desc" }
  ],
  limit: 20
})

// Find orphaned or uncovered specs
query({
  types: ["requirement"],
  filters: {
    uncovered: true  // Requirements without plans
  }
})

// Dependency analysis with metrics
query({
  entity_id: "req-001-user-auth",
  expand: {
    dependencies: true,
    dependency_metrics: true,
    depth: 2
  }
})
```

### Sub-Entity Access

```typescript
// Access specific task from plan
query({
  entity_id: "pln-001-auth-impl",
  sub_entity_id: "task-002"
})

// Access test case
query({
  entity_id: "pln-001-auth-impl",
  sub_entity_id: "tc-001"
})
```

## License

MIT License - see [LICENSE](./LICENSE) for details

## Repository

https://github.com/lucasilverentand/spec-mcp

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
