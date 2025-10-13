# Server Modes

> This section should be added to the main README.md

The Spec MCP Server supports three operational modes to optimize performance and user experience:

## Quick Start

```bash
# Plan Mode - for specification creation (15 tools)
MODE=plan npx @spec-mcp/server

# Work Mode - for implementation (16 tools)
MODE=work npx @spec-mcp/server

# Full Mode - all tools available (41 tools, default)
MODE=full npx @spec-mcp/server
```

## Mode Overview

### 🎯 **PLAN Mode** - Specification Creation
- **Tools:** 15
- **Focus:** Draft workflows, spec updates, references
- **Best for:** Creating and refining specifications before implementation
- **Performance:** Fastest - minimal tool set

### ⚙️ **WORK Mode** - Implementation
- **Tools:** 16
- **Focus:** Git workflow, task management, essential implementation tools
- **Best for:** Executing plans with integrated git workflow
- **Performance:** Fast - implementation-optimized

### 🚀 **FULL Mode** - Complete Access (Default)
- **Tools:** 41
- **Focus:** Everything
- **Best for:** Exploration, mixed workflows, advanced usage
- **Performance:** Baseline - full feature set

## Configuration

### Environment Variable
```bash
export MODE=plan  # or: work, full
```

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "npx",
      "args": ["@spec-mcp/server"],
      "env": {
        "MODE": "plan"
      }
    }
  }
}
```

## Documentation

- **[Full Mode Guide](./MODE_GUIDE.md)** - Comprehensive documentation with tool matrices, use cases, and workflows
- **[Quick Reference](./MODE_QUICK_REF.md)** - Quick lookup for mode capabilities and tool availability

## Tool Availability Summary

| Category | PLAN | WORK | FULL |
|----------|:----:|:----:|:----:|
| Draft Workflow | ✅ | ❌ | ✅ |
| Git Workflow | ❌ | ✅ | ✅ |
| Spec Management | ✅ | ✅ | ✅ |
| Update Tools | ✅ (all) | ⚠️ (limited) | ✅ (all) |
| Task Management | ❌ | ✅ | ✅ |
| References | ✅ | ❌ | ✅ |
| Implementation Arrays | ❌ | ✅ | ✅ |
| Planning Arrays | ❌ | ❌ | ✅ |

**Legend:** ✅ Available | ⚠️ Partially Available | ❌ Not Available

## Choosing a Mode

```
┌──────────────────────────────────┐
│  Creating specifications?        │
│  → PLAN MODE                    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  Implementing with git?          │
│  → WORK MODE                    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  Mixed or exploratory work?      │
│  → FULL MODE                    │
└──────────────────────────────────┘
```

## Benefits

- **Faster Loading:** Reduced tool sets load faster
- **Better UX:** Only relevant tools shown to AI
- **Clear Separation:** Distinct workflows for planning vs implementation
- **Optimized Performance:** Each mode optimized for its use case
