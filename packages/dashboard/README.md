# @spec-mcp/dashboard

Web-based dashboard for monitoring and managing spec-mcp specifications.

## Features

- **Real-time Updates**: WebSocket-powered live updates for drafts and specs
- **Draft Monitoring**: View active drafts with progress tracking
- **Spec Browser**: Browse and search all specifications
- **Server Status**: Monitor server health and connection status
- **Modern UI**: Built with Astro, React, Tailwind CSS, and shadcn/ui

## Installation

The dashboard is included in the spec-mcp monorepo. Install dependencies:

```bash
pnpm install
```

## Usage

The dashboard is designed to be embedded into the MCP server or accessed via the CLI tool.

### Via CLI

Start the dashboard using the CLI:

```bash
# Basic usage
spec-validate dashboard

# With options
spec-validate dashboard --port 3737 --host localhost --specs-path ./specs --open
```

### Embedded in MCP Server

Add the dashboard to your MCP server:

```typescript
import { DashboardServer } from "@spec-mcp/dashboard";
import { SpecManager, DraftStore } from "@spec-mcp/core";

// Initialize your managers
const specManager = new SpecManager("./specs");
const draftStore = new DraftStore(specManager);

// Start the dashboard
const dashboard = new DashboardServer(specManager, draftStore, {
  port: 3737,
  host: "localhost",
  autoOpen: false,
});

await dashboard.start();
console.log("Dashboard running at http://localhost:3737");
```

## Configuration

### DashboardConfig

- `port` (number): HTTP port for the dashboard (WebSocket uses port+1)
- `host` (string): Host to bind to
- `autoOpen` (boolean, optional): Automatically open browser on start
- `specsPath` (string, optional): Path to specs directory

## Architecture

### Components

- **DraftList**: Displays active drafts with progress
- **SpecBrowser**: Browse specifications by type
- **ServerStatus**: Real-time server health monitoring

### API Routes

- `GET /api/drafts`: List all drafts
- `GET /api/specs`: List all specifications
- `GET /api/status`: Server status

### WebSocket Events

- `connection:established`: Client connected
- `draft:created`: New draft created
- `draft:updated`: Draft updated
- `draft:finalized`: Draft finalized
- `spec:created`: New spec file added
- `spec:updated`: Spec file modified
- `spec:deleted`: Spec file removed

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Run tests
pnpm test
```

## Tech Stack

- **Astro**: Server-side rendering framework (automatically started by DashboardServer)
- **React**: UI components
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **WebSocket**: Real-time communication
- **Chokidar**: File system watching

## How It Works

When you start the dashboard:

1. **DashboardServer** is initialized with SpecManager and DraftStore
2. **WebSocket server** starts on `port + 1` for real-time updates
3. **File watcher** monitors spec files for changes
4. **Astro dev/preview server** is spawned automatically on the configured port
5. **Browser** opens automatically if `autoOpen` is enabled

The dashboard is fully self-contained and handles all server lifecycle automatically.
