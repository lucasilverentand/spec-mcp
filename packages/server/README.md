# @spec-mcp/server

A Model Context Protocol (MCP) server for managing software project specifications with intelligent tooling and AI-powered guidance.

[![npm version](https://badge.fury.io/js/@spec-mcp%2Fserver.svg)](https://www.npmjs.com/package/@spec-mcp/server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Spec MCP Server provides a structured approach to managing software specifications through the Model Context Protocol. It enables AI assistants like Claude to help you create, manage, and validate requirements, components, and implementation plans with built-in best practices and validation.

## Features

### 📋 Specification Management
- **Requirements**: Define what needs to be built with measurable acceptance criteria
- **Components**: Design system architecture with clear responsibilities and dependencies
- **Plans**: Create detailed implementation roadmaps with tasks, tests, and flows

### 🔍 Intelligent Analysis
- **Validation Tools**: Analyze specs against industry best practices
- **Dependency Analysis**: Visualize and validate cross-references between specs
- **Coverage Reports**: Track implementation and test coverage
- **Orphan Detection**: Find unreferenced or isolated specifications
- **Health Scoring**: Get overall system health metrics

### 🤖 AI-Powered Features
- **Interactive Prompts**: Guided spec creation with proven methodologies

### 🔗 Advanced Features
- **Cross-Reference Validation**: Ensure all links between specs are valid
- **Circular Dependency Detection**: Identify and prevent circular dependencies
- **Full-Text Search**: Find specs across your entire project
- **Sub-Entity Management**: Access individual tasks, test cases, flows, and more

## Installation

### From npm

```bash
npm install -g @spec-mcp/server
```

### Using pnpm

```bash
pnpm add -g @spec-mcp/server
```

### Using yarn

```bash
yarn global add @spec-mcp/server
```

## Quick Start

### 1. Configure with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "npx",
      "args": ["-y", "@spec-mcp/server"],
      "env": {
        "SPECS_ROOT": "/path/to/your/project/specs"
      }
    }
  }
}
```

### 2. Create Your Specs Directory

```bash
mkdir -p my-project/specs/{requirements,components,plans}
cd my-project
```

### 3. Start Using with Claude

Ask Claude to help you:
- "Create a new requirement for user authentication"
- "Design a component for the API gateway"
- "Create an implementation plan for the login feature"
- "Analyze the health of my specifications"

## Directory Structure

The server expects your specs to be organized as:

```
specs/
├── requirements/
│   ├── req-001-user-auth.yml
│   └── req-002-data-storage.yml
├── components/
│   ├── app-001-web-client.yml
│   └── svc-001-api-server.yml
└── plans/
    ├── pln-001-auth-implementation.yml
    └── pln-002-database-setup.yml
```

## Available Tools

### Entity Management (3 tools)
- `requirement` - Manage requirements (operation: create, get, update, delete, list)
- `component` - Manage components (operation: create, get, update, delete, list)
- `plan` - Manage plans (operation: create, get, update, delete, list)

**Example Usage:**
```javascript
// Create a requirement
{ name: "requirement", arguments: { operation: "create", slug: "user-auth", name: "User Authentication", ... } }

// Get a requirement
{ name: "requirement", arguments: { operation: "get", id: "req-001-user-auth" } }

// List requirements
{ name: "requirement", arguments: { operation: "list", priority: "critical" } }
```

### Comprehensive Analysis (1 tool)
- `analyze` - Run any analysis: dependencies, coverage, orphans, cycles, health, references, or full-report

**Example Usage:**
```javascript
// Analyze dependencies
{ name: "analyze", arguments: { analysis_type: "dependencies", include_metrics: true } }

// Get full system report
{ name: "analyze", arguments: { analysis_type: "full-report" } }
```

### Sub-Entity Access (5 tools)
- `get-plan-task` - Retrieve individual tasks from plans
- `get-plan-test-case` - Retrieve test cases
- `get-plan-flow` - Retrieve flows
- `get-plan-api-contract` - Retrieve API contracts
- `get-plan-data-model` - Retrieve data models

### Search (1 tool)
- `search-specs` - Full-text search across all specifications

## Configuration

### Environment Variables

- `SPECS_ROOT` - Root directory for specifications (required)
- `LOG_LEVEL` - Logging level: `trace`, `debug`, `info`, `warn`, `error` (default: `info`)
- `NODE_ENV` - Environment: `development`, `production` (default: `development`)

### Example Configuration

```bash
export SPECS_ROOT=/Users/yourname/projects/my-app/specs
export LOG_LEVEL=debug
```

## Development & Debugging

### Using MCP Inspector

The MCP Inspector allows you to test and debug the server interactively:

```bash
# Install dependencies
pnpm install

# Build the server
pnpm build

# Launch inspector
pnpm inspector
```

This opens a web interface where you can:
- Browse all available tools
- Test tools with custom inputs
- Inspect request/response payloads
- View server logs in real-time
- Debug validation errors

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Type Checking

```bash
# Check types
pnpm typecheck

# Build
pnpm build
```

## Architecture

The server is built on a modular architecture:

- **@spec-mcp/server** - MCP protocol implementation and tool registration
- **@spec-mcp/core** - Business logic, validation, and analysis engines
- **@spec-mcp/data** - Data models, schemas, and file operations

## Best Practices

### Requirements
- Focus on **WHAT** needs to be built, not **HOW**
- Include measurable acceptance criteria
- Avoid implementation details
- Link to plans for traceability

### Components
- Follow single responsibility principle
- Define clear capabilities and constraints
- Document dependencies and tech stack
- Include setup tasks for initialization

### Plans
- Define clear scope and boundaries
- Break down into manageable tasks
- Include acceptance criteria
- Add test cases and flows
- Track dependencies between tasks

## Examples

### Creating a Requirement

```typescript
{
  "slug": "user-authentication",
  "name": "User Authentication System",
  "description": "Users need secure authentication because...",
  "priority": "critical",
  "criteria": [
    {
      "id": "req-001-user-authentication/crit-001",
      "description": "Users can register with email and password"
    },
    {
      "id": "req-001-user-authentication/crit-002",
      "description": "System enforces password complexity requirements"
    }
  ]
}
```

### Creating a Component

```typescript
{
  "type": "service",
  "slug": "auth-service",
  "name": "Authentication Service",
  "description": "Responsible for user authentication and authorization",
  "tech_stack": ["Node.js", "Express", "JWT"],
  "capabilities": [
    "User registration and login",
    "JWT token generation and validation",
    "Password hashing and verification"
  ],
  "constraints": [
    "Must handle 1000 req/sec",
    "Token expiry: 1 hour"
  ]
}
```

## Contributing

We welcome contributions! See the main repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.

## Links

- [GitHub Repository](https://github.com/lucasilverentand/spec-mcp)
- [Issue Tracker](https://github.com/lucasilverentand/spec-mcp/issues)
- [npm Package](https://www.npmjs.com/package/@spec-mcp/server)
- [Model Context Protocol](https://modelcontextprotocol.io)

## Support

For questions and support:
- Open an issue on GitHub
- Check the documentation
- Join discussions in the repository

---

Made with ❤️ for better software specification management