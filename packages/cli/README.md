# @spec-mcp/cli

CLI tool for managing spec-mcp specifications.

## Installation

```bash
npm install -g @spec-mcp/cli
```

Or use with npx:

```bash
npx @spec-mcp/cli
```

## Commands

### `spec-mcp validate`

Validate all specifications in the specs folder.

```bash
spec-mcp validate [options]

Options:
  -p, --path <path>  Path to specs folder (default: "./specs")
```

### `spec-mcp check <id>`

Validate a specific entity by ID.

```bash
spec-mcp check <id> [options]

Arguments:
  id                 Entity ID (e.g., pln-001, pln-001-user-auth, or pln-001-user-auth.yml)

Options:
  -p, --path <path>  Path to specs folder (default: "./specs")
```

### `spec-mcp dashboard`

Start the web dashboard for visualizing and managing specifications.

```bash
spec-mcp dashboard [options]

Options:
  -p, --port <port>       Port number (default: "3737")
  -h, --host <host>       Host address (default: "localhost")
  --specs-path <path>     Path to specs folder (default: "./specs")
  --open                  Open browser automatically
```

### `spec-mcp worktree [plan-id]`

Create a git worktree for a plan (interactive if no plan-id provided).

```bash
spec-mcp worktree [plan-id] [options]

Arguments:
  plan-id            Plan ID (e.g., pln-001 or pln-001-feature)

Options:
  -p, --path <path>  Path to specs folder (default: "./specs")
  --print-path       Only print the worktree path (for shell integration)
```

Example shell integration:

```bash
# Change to worktree directory
cd "$(spec-mcp worktree pln-001 --print-path)"
```

## Usage

### Validate Your Specifications

```bash
# Validate all specs in the default location
spec-mcp validate

# Validate specs in a custom location
spec-mcp validate --path ./my-specs

# Validate a specific entity
spec-mcp check pln-001-user-auth
```

### Launch the Dashboard

```bash
# Start dashboard on default port (3737)
spec-mcp dashboard

# Start on custom port and open browser
spec-mcp dashboard --port 8080 --open

# Use custom specs path
spec-mcp dashboard --specs-path ./my-specs
```

### Create Worktrees for Plans

The worktree command helps you create isolated git worktrees for working on specific plans:

```bash
# Interactive picker
spec-mcp worktree

# Create worktree for specific plan
spec-mcp worktree pln-001-user-auth

# Shell integration
cd "$(spec-mcp worktree --print-path)"
```

## Requirements

- Node.js >= 18.0.0
- Git (for worktree command)

## License

MIT
