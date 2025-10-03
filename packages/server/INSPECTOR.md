# MCP Inspector Guide

The MCP Inspector provides a web-based interface for testing and debugging your MCP server.

## Quick Start

```bash
# From project root
pnpm inspector

# Or from packages/server
cd packages/server
pnpm inspector
```

The inspector will:
1. Build the server automatically
2. Launch the MCP server
3. Open a browser window at http://localhost:5173
4. Connect to the server via stdio

## Features

### 1. Tool Browser
- View all available tools
- See tool descriptions and input schemas
- Browse tool capabilities

### 2. Interactive Testing
- Call any tool with custom parameters
- See real-time request/response
- Test different input combinations
- Validate tool behavior

### 3. Request/Response Inspector
- View full JSON-RPC messages
- Inspect request payloads
- Examine response data
- Debug error messages

### 4. Server Logs
- Real-time server logs in the browser
- Filter by log level
- Search through logs
- Export logs for debugging

### 5. Connection Management
- Monitor connection status
- Reconnect on failures
- View connection errors

## Example Workflow

### Testing a Tool

1. **Start the inspector:**
   ```bash
   pnpm inspector
   ```

2. **Browse tools:**
   - Click on "Tools" tab
   - Find "analyze" tool
   - View the input schema

3. **Test the tool:**
   - Click "Call Tool"
   - Fill in parameters:
     ```json
     {
       "analysis_type": "full-report"
     }
     ```
   - Click "Execute"
   - View the comprehensive system report

   Or test entity management:
   ```json
   {
     "name": "requirement",
     "arguments": {
       "operation": "create",
       "slug": "test-feature",
       "name": "Test Feature",
       "description": "A test feature",
       "priority": "required",
       "criteria": [{
         "id": "req-001-test-feature/crit-001",
         "description": "Must work"
       }]
     }
   }
   ```

4. **Inspect the result:**
   - Check the response data
   - Verify the created ID
   - Review any errors

### Debugging Errors

1. **Enable debug logging:**
   ```bash
   LOG_LEVEL=debug pnpm inspector
   ```

2. **Reproduce the error:**
   - Call the problematic tool
   - Enter the failing parameters

3. **Check the logs:**
   - Switch to "Logs" tab
   - Find error messages
   - Check correlation IDs
   - Review the full stack trace

4. **Inspect the request:**
   - View the exact JSON-RPC message
   - Check parameter values
   - Verify the tool name

### Testing Security

1. **Test path traversal:**
   ```json
   {
     "operation": "get",
     "id": "../../../etc/passwd"
   }
   ```
   - Should return error with code ERR_3001

2. **Test rate limiting:**
   - Call the same tool 100+ times rapidly
   - Should return rate limit error after limit

3. **Test input sanitization:**
   ```json
   {
     "operation": "create",
     "slug": "test",
     "name": "Test\x00With\x01Control",
     "description": "Test",
     "priority": "optional",
     "criteria": [{"id": "crit-001", "description": "Test"}]
   }
   ```
   - Should sanitize control characters

## Environment Variables

Set environment variables before starting the inspector:

```bash
# Custom specs directory
SPECS_ROOT=./my-specs pnpm inspector

# Debug logging
LOG_LEVEL=debug pnpm inspector

# Disable rate limiting for testing
RATE_LIMIT_ENABLED=false pnpm inspector

# Disable validation for testing
SCHEMA_VALIDATION=false pnpm inspector
```

## Keyboard Shortcuts

- `Ctrl+K` - Quick tool search
- `Ctrl+Enter` - Execute current tool
- `Ctrl+L` - Clear logs
- `Esc` - Close modals

## Tips

### Performance Testing
- Use the inspector to test response times
- Check operation duration in logs
- Monitor memory usage

### Debugging Tool Issues
- Always check server logs first
- Look for correlation IDs to track requests
- Use debug log level for detailed info

### Testing Edge Cases
- Try empty strings
- Use very long strings
- Test special characters
- Try null/undefined values

### Validating Responses
- Check response structure matches schema
- Verify error codes are correct
- Confirm success/error flags

## Common Issues

### Inspector won't connect
- Ensure server built successfully
- Check no other process on port 5173
- Verify node_modules installed

### Tools not showing
- Wait for server to fully start
- Check server logs for errors
- Rebuild with `pnpm build`

### Logs not appearing
- Ensure LOG_LEVEL is set
- Check logs go to stderr not stdout
- Try debug level for more output

## Advanced Usage

### Custom Configuration
Create a test config for the inspector:

```bash
# .env.test
SPECS_ROOT=./test-data
LOG_LEVEL=trace
RATE_LIMIT_ENABLED=false
SCHEMA_VALIDATION=true
REFERENCE_VALIDATION=false
```

Then run:
```bash
source .env.test && pnpm inspector
```

### Testing with Fixtures
1. Create test specs in `./test-specs`
2. Point inspector to test directory
3. Run tests against known data

### Integration with CI
The inspector can run in headless mode:
```bash
# Run tests via inspector (future feature)
npx @modelcontextprotocol/inspector test
```

## Resources

- [MCP Inspector Docs](https://modelcontextprotocol.io/docs/tools/inspector)
- [MCP Protocol Spec](https://spec.modelcontextprotocol.io)
- [Server Source Code](./src/index.ts)

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9

# Or use different port
PORT=5174 pnpm inspector
```

### Build Errors
```bash
# Clean and rebuild
pnpm clean
pnpm build
pnpm inspector
```

### Connection Issues
- Check firewall settings
- Verify localhost accessible
- Try incognito/private browsing

---

**Happy Debugging! 🔍**