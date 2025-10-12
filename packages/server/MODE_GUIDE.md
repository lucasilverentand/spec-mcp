# Spec MCP Server Mode Guide

The Spec MCP Server supports three operational modes to optimize performance and user experience based on your workflow stage. Modes control which tools are available to the MCP client (like Claude Code).

## Table of Contents
- [Quick Start](#quick-start)
- [Available Modes](#available-modes)
- [Tool Matrix](#tool-matrix)
- [Configuration](#configuration)
- [Use Cases](#use-cases)
- [Mode Transition Examples](#mode-transition-examples)

## Quick Start

Set the mode using the `MODE` environment variable:

```bash
# Plan mode - for specification creation
MODE=plan npx @spec-mcp/server

# Work mode - for implementation
MODE=work npx @spec-mcp/server

# Full mode (default) - all tools available
MODE=full npx @spec-mcp/server
```

## Available Modes

### 🎯 PLAN Mode (15 tools)
**Purpose:** Creating and designing specifications without implementation

**Best for:**
- Drafting new specifications
- Refining requirements and designs
- Updating existing specs
- Documentation-first workflows

**Enabled Tools:**
- **Draft Workflow** (6): `start_draft`, `answer_question`, `finalize_entity`, `continue_draft`, `skip_answer`, `list_drafts`
- **Spec Management** (3): `get_spec`, `validate_entity`, `delete`
- **Reference Management** (1): `add_reference`
- **Update Tools** (5): `update_plan`, `update_business_requirement`, `update_technical_requirement`, `update_decision`, `update_component`

**Performance:** Lightweight and fast - only essential planning tools loaded

---

### ⚙️ WORK Mode (16 tools)
**Purpose:** Executing plans with git workflow integration

**Best for:**
- Implementing specifications
- Test-driven development
- Git-based task workflow
- Focused implementation without distraction

**Enabled Tools:**
- **Git Workflow** (7): `start_plan`, `start_task`, `finish_task`, `finish_plan`, `get_worktree_context`, `switch_worktree`, `switch_to_main`
- **Task Management** (1): `add_task`
- **Spec Access** (3): `get_spec`, `validate_entity`, `delete`
- **Limited Updates** (1): `update_plan` (scope only)
- **Implementation Array Tools** (4):
  - `add_test_case` - for test-driven development
  - `add_criteria` - for acceptance criteria
  - `add_flow` - for documenting flows
  - `add_api_contract`, `add_data_model` - for technical specs

**Performance:** Optimized for implementation - excludes specification creation overhead

---

### 🚀 FULL Mode (41 tools - Default)
**Purpose:** Complete access to all functionality

**Best for:**
- Exploring the system
- Complex workflows mixing planning and implementation
- Advanced users who need all tools
- Development and debugging

**Enabled Tools:** All 41 tools including:
- All PLAN mode tools (15)
- All WORK mode tools (16)
- Additional array manipulation tools (18):
  - Business Requirements: `add_user_story`, `add_business_value`, `add_stakeholder`
  - Technical Requirements: `add_constraint`
  - Decisions: `add_alternative`, `add_consequence`
  - Components: `add_tech`, `add_deployment`, `add_external_dependency`
  - Plus all test cases, flows, API contracts, and data models

**Performance:** Full feature set - may be slower due to larger tool set

---

## Tool Matrix

| Tool Category | Plan Mode | Work Mode | Full Mode |
|--------------|:---------:|:---------:|:---------:|
| **Draft Workflow Tools** (6) | ✅ | ❌ | ✅ |
| `start_draft`, `answer_question`, `finalize_entity` | ✓ | ✗ | ✓ |
| `continue_draft`, `skip_answer`, `list_drafts` | ✓ | ✗ | ✓ |
| **Spec Management** (3) | ✅ | ✅ | ✅ |
| `get_spec`, `validate_entity`, `delete` | ✓ | ✓ | ✓ |
| **Git Workflow Tools** (7) | ❌ | ✅ | ✅ |
| `start_plan`, `start_task`, `finish_task`, `finish_plan` | ✗ | ✓ | ✓ |
| `get_worktree_context`, `switch_worktree`, `switch_to_main` | ✗ | ✓ | ✓ |
| **Task Management** (1) | ❌ | ✅ | ✅ |
| `add_task` | ✗ | ✓ | ✓ |
| **Reference Management** (1) | ✅ | ❌ | ✅ |
| `add_reference` | ✓ | ✗ | ✓ |
| **Update Tools** (5) | ✅ | ⚠️ | ✅ |
| `update_plan` (scope) | ✓ | ✓ | ✓ |
| `update_business_requirement`, `update_technical_requirement` | ✓ | ✗ | ✓ |
| `update_decision`, `update_component` | ✓ | ✗ | ✓ |
| **Implementation Array Tools** (4) | ❌ | ✅ | ✅ |
| `add_test_case`, `add_criteria` | ✗ | ✓ | ✓ |
| `add_flow`, `add_api_contract`, `add_data_model` | ✗ | ✓ | ✓ |
| **Planning Array Tools** (10) | ❌ | ❌ | ✅ |
| `add_user_story`, `add_business_value`, `add_stakeholder` | ✗ | ✗ | ✓ |
| `add_constraint`, `add_alternative`, `add_consequence` | ✗ | ✗ | ✓ |
| `add_tech`, `add_deployment`, `add_external_dependency` | ✗ | ✗ | ✓ |

**Legend:**
- ✅ All tools available
- ⚠️ Partially available
- ❌ Not available
- ✓ Available
- ✗ Not available

---

## Configuration

### Environment Variable

```bash
# Set mode in your MCP client configuration
export MODE=plan  # or work, or full
```

### Claude Desktop Configuration

Update your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spec-mcp-plan": {
      "command": "npx",
      "args": ["@spec-mcp/server"],
      "env": {
        "MODE": "plan"
      }
    },
    "spec-mcp-work": {
      "command": "npx",
      "args": ["@spec-mcp/server"],
      "env": {
        "MODE": "work"
      }
    }
  }
}
```

### Default Behavior

If `MODE` is not set, the server defaults to **FULL** mode for maximum compatibility.

---

## Use Cases

### Use Case 1: Documentation-First Team
**Scenario:** Your team creates detailed specifications before any code is written.

**Recommended Mode:** **PLAN**

**Workflow:**
1. Use PLAN mode to draft all specifications
2. Get stakeholder approval
3. Switch to WORK mode for implementation
4. Return to PLAN mode for post-implementation documentation updates

**Benefits:**
- Faster tool loading during planning phase
- Clearer separation of concerns
- Prevents premature implementation tool usage

---

### Use Case 2: Test-Driven Development
**Scenario:** You write tests as you implement features, referencing specs as needed.

**Recommended Mode:** **WORK**

**Workflow:**
1. Start with a plan created in PLAN mode
2. Switch to WORK mode
3. Use `start_plan` to create git worktree
4. For each task:
   - Use `start_task` to begin
   - Use `add_test_case` to document tests
   - Use `add_criteria` for acceptance criteria
   - Implement and test
   - Use `finish_task` to commit
5. Use `finish_plan` to create PR

**Benefits:**
- Only implementation-focused tools available
- Git workflow integrated seamlessly
- No distraction from planning tools

---

### Use Case 3: Exploratory Development
**Scenario:** You're prototyping and aren't sure if you'll need planning or implementation tools.

**Recommended Mode:** **FULL**

**Workflow:**
- Use all tools as needed
- Transition to focused modes once workflow stabilizes

**Benefits:**
- Maximum flexibility
- All tools available
- Good for learning the system

---

### Use Case 4: Microservice Architecture
**Scenario:** Multiple developers working on different services, each needs specifications.

**Recommended Setup:**
- **Planning Team:** PLAN mode for creating/updating component specs
- **Implementation Teams:** WORK mode for executing plans
- **Tech Leads:** FULL mode for oversight and complex scenarios

---

## Mode Transition Examples

### Example 1: Plan → Work Transition

```bash
# Phase 1: Planning (PLAN mode)
MODE=plan npx @spec-mcp/server

# Create specs using draft workflow
# Tools: start_draft, answer_question, finalize_entity

# Phase 2: Implementation (WORK mode)
MODE=work npx @spec-mcp/server

# Execute the plan
# Tools: start_plan, start_task, finish_task, finish_plan
```

### Example 2: Work → Plan Transition

```bash
# During implementation, discover need for spec updates
# Currently in WORK mode - only has update_plan

# Need to update business requirements
# Switch to PLAN or FULL mode
MODE=plan npx @spec-mcp/server

# Update specs
# Tools: update_business_requirement, add_reference, etc.

# Return to implementation
MODE=work npx @spec-mcp/server
```

### Example 3: Multiple Concurrent Sessions

```bash
# Terminal 1: Planning session
MODE=plan npx @spec-mcp/server

# Terminal 2: Implementation session (different project)
cd ../other-project
MODE=work npx @spec-mcp/server
```

---

## Performance Considerations

### Tool Loading Time

| Mode | Tools | Estimated Load Time |
|------|-------|-------------------|
| PLAN | 15 | ~Fast (~50ms faster) |
| WORK | 16 | ~Fast (~50ms faster) |
| FULL | 41 | ~Baseline |

### Memory Usage

- **PLAN**: Lowest memory footprint
- **WORK**: Low memory footprint
- **FULL**: Standard memory footprint

### Recommendation

Choose the most restrictive mode that meets your needs for optimal performance.

---

## Troubleshooting

### "Tool not found" Error

**Symptom:** Claude Code reports a tool is unavailable.

**Solution:**
1. Check your mode: Run `echo $MODE`
2. Verify the tool is available in that mode using the [Tool Matrix](#tool-matrix)
3. Switch to FULL mode if needed: `export MODE=full`
4. Or switch to the appropriate mode for your task

### Unexpected Tool Availability

**Symptom:** Tools you expect are missing or extra tools appear.

**Solution:**
1. Verify environment variable is set correctly
2. Restart the MCP server after changing modes
3. Check server logs for mode confirmation

### Mode Not Respected

**Symptom:** All tools available regardless of mode setting.

**Solution:**
1. Ensure environment variable is set **before** starting the server
2. Check for typos: must be `plan`, `work`, or `full` (lowercase)
3. Restart the MCP client entirely

---

## Best Practices

1. **Start Restrictive:** Begin with PLAN or WORK mode and escalate to FULL only when needed
2. **Document Your Choice:** Note in project README which mode team members should use
3. **Separate Concerns:** Use PLAN mode for design, WORK mode for implementation
4. **Team Alignment:** Ensure team members use consistent modes for similar tasks
5. **CI/CD Integration:** Use FULL mode in automated environments to avoid tool availability issues

---

## Version History

- **v1.0.0**: Initial mode system implementation
  - PLAN mode: 15 tools
  - WORK mode: 16 tools
  - FULL mode: 41 tools

---

For more information, see the [main README](../../README.md) or visit the [GitHub repository](https://github.com/your-repo/spec-mcp).
