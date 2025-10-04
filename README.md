# Spec MCP

A Model Context Protocol (MCP) server for managing software project specifications with intelligent tooling.

## Overview

Spec MCP provides a structured approach to managing software requirements, plans, components, decisions, and project constitutions through the Model Context Protocol. It enables AI assistants to help you create, query, and analyze project specifications in a standardized, traceable way.

## Features

- **📋 Requirements Management** - Define what needs to be built with measurable acceptance criteria
- **📐 Component Modeling** - Structure your architecture (apps, services, libraries)
- **🗺️ Implementation Planning** - Create detailed plans with tasks, test cases, and API specs
- **⚖️ Decision Tracking** - Document architectural decisions and their rationale
- **📜 Project Constitutions** - Define guiding principles for your project
- **🔍 Intelligent Querying** - Search, filter, and analyze specifications with powerful query tools
- **📊 Dependency Analysis** - Understand relationships between specs, find orphans, detect cycles
- **✅ Validation** - Automated validation with reference checking and health scoring

## Installation

```bash
npm install -g @spec-mcp/server
```

Or using pnpm:

```bash
pnpm add -g @spec-mcp/server
```

## Quick Start

### 1. Configure MCP Client

Add to your Claude Desktop or other MCP client configuration:

```json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "node",
      "args": ["/path/to/spec-mcp/packages/server/dist/index.js"],
      "env": {
        "SPECS_ROOT": ".specs"
      }
    }
  }
}
```

### 2. Create Your First Requirement

Use the MCP tools through your AI assistant:

```typescript
// Start creating a requirement
start_draft({
  type: "requirement",
  slug: "user-authentication"
})

// Follow the guided 4-step flow
update_draft({
  draft_id: "req-user-authentication-...",
  field: "slug_and_name",
  value: {
    slug: "user-authentication",
    name: "User Authentication System"
  }
})
```

### 3. Query and Analyze

```typescript
// Query all requirements
query({
  types: ["requirement"],
  mode: "summary"
})

// Analyze project health
analyze({
  analysis_type: "health",
  include_breakdown: true
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

## Available Tools

### Creation & Management
- `start_draft` - Begin creating a new specification with guided flow
- `update_draft` - Update a draft specification field by field
- `update_spec` - Update a finalized specification with validation
- `delete_spec` - Delete a specification or draft

### Querying
- `query` - Comprehensive query with filtering, search, sorting, and pagination

### Analysis
- `analyze` - Dependency analysis, coverage reports, orphan detection, cycle detection, health scoring

## Architecture

This is a monorepo containing:

- **`packages/server`** - MCP server implementation
- **`packages/core`** - Core business logic and operations
- **`packages/data`** - Data schemas and validation
- **`packages/tsconfig`** - Shared TypeScript configuration

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
pnpm build          # Build all packages
pnpm dev            # Watch mode for all packages
pnpm test           # Run tests
pnpm typecheck      # Type checking
pnpm lint           # Lint code
pnpm format         # Format code
pnpm check          # Run all checks (lint + format)
pnpm pre-commit     # Pre-commit checks (lint + typecheck + test)
```

## Documentation

Detailed documentation for each specification type:

- [Requirements](./docs/spec-types/requirement.md)
- [Components](./docs/spec-types/component.md)
- [Plans](./docs/spec-types/plan.md)
- [Decisions](./docs/spec-types/decision.md)
- [Constitutions](./docs/spec-types/constitution.md)

## License

MIT License - see [LICENSE](./LICENSE) for details

## Repository

https://github.com/lucasilverentand/spec-mcp

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
