# Spec MCP Server

An open-source Model Context Protocol (MCP) server for managing software project specifications with intelligent tooling and AI-powered assistance.

## Features

- 🆔 **Auto-generated IDs**: Sequential, validated IDs for all specification types
- 📝 **CRUD Operations**: Create, read, update, delete specs with comprehensive validation
- 🔄 **Flow Management**: Create and track user journeys, system flows, and data flows
- 🧪 **Test Management**: Track test implementation and pass/fail status
- ⚠️ **Error Handling**: Define and track error scenarios and recovery strategies
- 🔗 **Cross-References**: Link flows to tasks, tests to flows, with validation
- 📊 **Analysis Tools**: Dependency graphs, coverage reports, orphan detection
- ✅ **Validation & Guidance**: Built-in tools that analyze specs against best practices
- 🤖 **AI Prompts**: Interactive prompts for guided spec creation using proven methodologies

## Quick Start

### Installation

```bash
npm install -g @spec-mcp/server
# or
pnpm add -g @spec-mcp/server
```

### Usage

1. **As MCP Server** - Configure in Claude Desktop:

```json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "spec-mcp",
      "env": {
        "SPECS_ROOT": "/path/to/your/project/specs"
      }
    }
  }
}
```

2. **Debug with MCP Inspector**:

```bash
# From project root
pnpm inspector

# Or from packages/server
cd packages/server
pnpm inspector
```

This will:
- Build the server
- Launch the MCP Inspector in your browser
- Allow you to test tools interactively
- Inspect requests/responses
- Debug tool behavior

3. **Direct Usage**:

```bash
# Start the server
spec-mcp serve

# Validate specifications
spec-mcp validate

# Generate spec templates
spec-mcp init
```

## Use Cases

Perfect for:
- **Software Development Teams**: Manage requirements, components, and implementation plans
- **Project Managers**: Track progress, dependencies, and test coverage
- **QA Engineers**: Define test scenarios and track coverage
- **Technical Writers**: Maintain comprehensive project documentation
- **Open Source Projects**: Collaborative specification management

## Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Configuration](./docs/configuration.md)
- [Version Management](./docs/VERSION-MANAGEMENT.md)
- [Examples](./docs/examples.md)

## Development

This project uses a pnpm workspace with the following packages:

- `@spec-mcp/server` - Main MCP server package
- `@spec-mcp/data` - Data management, schemas, and validation
- `@spec-mcp/core` - Core business logic

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/spec-mcp.git
cd spec-mcp

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev
```

### Code Quality

```bash
# Check code quality
pnpm check

# Auto-fix issues
pnpm check:fix

# Type checking
pnpm typecheck
```

### Debugging

```bash
# Launch MCP Inspector for interactive debugging
pnpm inspector

# Set environment variables for inspector
SPECS_ROOT=./test-specs LOG_LEVEL=debug pnpm inspector
```

The MCP Inspector provides:
- Visual tool browser
- Interactive tool testing
- Request/response inspection
- Real-time server logs
- Error debugging

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/spec-mcp/issues)
- 💬 [Discussions](https://github.com/your-org/spec-mcp/discussions)
- 📧 Email: support@spec-mcp.org

## Roadmap

- [ ] Web-based specification editor
- [ ] Integration with popular project management tools
- [ ] Advanced visualization and reporting
- [ ] Plugin system for custom workflows
- [ ] Multi-language specification support

---

Built with ❤️ by the open source community