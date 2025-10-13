# Dashboard Auto-Start Feature

The spec-mcp server now automatically starts a web dashboard when the MCP server starts, providing real-time visibility into draft workflows and spec management.

## Features

- **Auto-Start**: Dashboard automatically starts when the MCP server initializes
- **Real-Time Updates**: WebSocket-powered live updates for all draft and spec operations
- **Draft Monitoring**: Track draft creation, updates, and finalization in real-time
- **Spec Watching**: Monitor file changes to specification files
- **Server Status**: View server health and connection information

## Configuration

The dashboard can be configured using environment variables:

### Environment Variables

- `ENABLE_DASHBOARD`: Enable/disable dashboard (default: `true`)
  - Set to `"false"` to disable the dashboard
  - Example: `ENABLE_DASHBOARD=false`

- `DASHBOARD_PORT`: HTTP port for the dashboard (default: `3737`)
  - WebSocket uses `DASHBOARD_PORT + 1` (default: `3738`)
  - Example: `DASHBOARD_PORT=4000`

- `DASHBOARD_HOST`: Host to bind the dashboard to (default: `"localhost"`)
  - Example: `DASHBOARD_HOST=0.0.0.0` for external access

- `NODE_ENV`: Environment mode (default: `"development"`)
  - `"development"`: Runs Astro dev server with hot reload
  - `"production"`: Runs Astro preview server

### Example Configuration

```bash
# Claude Desktop config.json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "node",
      "args": ["/path/to/spec-mcp/packages/server/dist/index.js"],
      "env": {
        "ENABLE_DASHBOARD": "true",
        "DASHBOARD_PORT": "3737",
        "DASHBOARD_HOST": "localhost",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Accessing the Dashboard

Once the MCP server starts, the dashboard is available at:

- **HTTP**: `http://localhost:3737` (or your configured port)
- **WebSocket**: `ws://localhost:3738` (or your configured port + 1)

## Real-Time Events

The dashboard receives the following real-time events via WebSocket:

### Draft Events
- `draft:created` - New draft workflow started
- `draft:updated` - Question answered or entity updated
- `draft:finalized` - Draft completed and saved as spec

### Spec Events  
- `spec:created` - New spec file added
- `spec:updated` - Spec file modified
- `spec:deleted` - Spec file removed

## Dashboard Server Architecture

The dashboard consists of:

1. **DashboardServer** - Main server class that manages:
   - WebSocket server for real-time communication
   - File watcher for spec directory monitoring
   - Astro dev/preview server for the web UI

2. **WebSocket Integration** - Real-time event broadcasting:
   - All connected clients receive updates instantly
   - Events triggered by MCP tool execution
   - File system changes propagated immediately

3. **Astro Web UI** - Modern dashboard interface:
   - Draft list with progress tracking
   - Spec browser and search
   - Server status monitoring
   - Built with React, Tailwind CSS, and shadcn/ui

## Development

### Building the Dashboard

The dashboard is automatically built when you build the server package:

```bash
cd packages/server
pnpm build
```

### Running the Dashboard Standalone

You can also run the dashboard independently for development:

```bash
cd packages/dashboard
pnpm dev  # Starts on http://localhost:3737
```

### Testing Dashboard Integration

When running the MCP server via inspector, the dashboard will start automatically:

```bash
cd packages/server
pnpm inspector
```

Then open:
- Inspector: `http://localhost:6274`
- Dashboard: `http://localhost:3737`

## Troubleshooting

### Dashboard Not Starting

1. **Check if ports are available**: 
   ```bash
   lsof -i :3737 -i :3738
   ```
   
2. **Check environment variables**:
   - Ensure `ENABLE_DASHBOARD` is not set to `"false"`
   
3. **Check logs**: 
   - The server logs dashboard startup status
   - Look for "Starting dashboard" and "Dashboard started" messages

### Dashboard Not Updating

1. **Check WebSocket connection**:
   - Open browser dev tools
   - Check Network tab for WebSocket connection to port 3738
   
2. **Verify server is sending events**:
   - Events are only sent when MCP tools are executed
   - Try creating a draft or updating a spec to trigger events

### Port Already in Use

If you get "EADDRINUSE" errors:

1. Change the dashboard port:
   ```bash
   export DASHBOARD_PORT=4000
   ```

2. Or disable the dashboard:
   ```bash
   export ENABLE_DASHBOARD=false
   ```

## Implementation Details

### Event Notification Flow

1. User executes MCP tool (e.g., `start_draft`)
2. Tool handler executes the operation
3. Tool handler calls `dashboardServer.notifyDraftEvent()`
4. DashboardServer broadcasts event to all WebSocket clients
5. Dashboard UI receives event and updates in real-time

### File Watching

The dashboard uses `chokidar` to watch the specs directory:
- Watches `specs/**/*.{yaml,yml}` files
- Ignores initial files (only watches for changes)
- Broadcasts file events to connected clients

### Graceful Shutdown

The dashboard is properly cleaned up on server shutdown:
- Astro process terminated
- WebSocket connections closed
- File watcher stopped

## Future Enhancements

Potential improvements for the dashboard:

- [ ] Authentication/authorization
- [ ] Multi-user support
- [ ] Draft collaboration features  
- [ ] Spec diff viewer
- [ ] Task workflow visualization
- [ ] Performance metrics
- [ ] Export/import functionality
