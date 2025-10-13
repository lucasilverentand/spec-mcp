# Spec MCP Server - Mode Quick Reference

## 🚀 Quick Start

```bash
# Set mode before starting server
export MODE=plan   # or: work, full
npx @spec-mcp/server
```

---

## 📋 Mode Comparison

| Aspect | PLAN | WORK | FULL |
|--------|------|------|------|
| **Tools** | 15 | 16 | 41 |
| **Focus** | Specification Creation | Implementation | Everything |
| **Speed** | Fastest | Fast | Baseline |
| **When to Use** | Before coding | During coding | Anytime |

---

## 🛠️ Tool Availability by Mode

### ✅ Draft Workflow (6 tools)
**Modes:** PLAN, FULL

- `start_draft` - Create new spec
- `answer_question` - Answer draft questions
- `finalize_entity` - Complete draft
- `continue_draft` - Get next step
- `skip_answer` - Skip optional question
- `list_drafts` - View active drafts

---

### ✅ Git Workflow (7 tools)
**Modes:** WORK, FULL

- `start_plan` - Create worktree & branch
- `start_task` - Begin task
- `finish_task` - Commit & complete task
- `finish_plan` - Push & create PR
- `get_worktree_context` - Show current context
- `switch_worktree` - Switch to plan worktree
- `switch_to_main` - Return to main

---

### ✅ Spec Management (3 tools)
**Modes:** ALL (PLAN, WORK, FULL)

- `get_spec` - Retrieve specification
- `validate_entity` - Validate spec
- `delete` - Delete spec/draft/item

---

### ✅ Update Tools (5 tools)
**Modes:** PLAN → All 5 | WORK → 1 only | FULL → All 5

- `update_plan` ← **Available in all modes**
- `update_business_requirement`
- `update_technical_requirement`
- `update_decision`
- `update_component`

---

### ✅ Task & Reference Management (2 tools)

| Tool | PLAN | WORK | FULL |
|------|:----:|:----:|:----:|
| `add_task` | ❌ | ✅ | ✅ |
| `add_reference` | ✅ | ❌ | ✅ |

---

### ✅ Implementation Array Tools (5 tools)
**Modes:** WORK, FULL

- `add_test_case` - Add test case to plan
- `add_criteria` - Add acceptance criteria
- `add_flow` - Document flows
- `add_api_contract` - Define API contract
- `add_data_model` - Define data model

---

### ✅ Planning Array Tools (10 tools)
**Modes:** FULL only

**Business Requirements:**
- `add_user_story`
- `add_business_value`
- `add_stakeholder`

**Technical Requirements:**
- `add_constraint`

**Decisions:**
- `add_alternative`
- `add_consequence`

**Components:**
- `add_tech`
- `add_deployment`
- `add_external_dependency`

---

## 💡 Common Workflows

### Workflow: Create Specification
```bash
export MODE=plan
# Use: start_draft → answer_question → finalize_entity
```

### Workflow: Implement Plan
```bash
export MODE=work
# Use: start_plan → start_task → [code] → finish_task → finish_plan
```

### Workflow: Add Details to Existing Spec
```bash
export MODE=full
# Use: get_spec → add_* tools → update_* tools
```

---

## 🎯 Choosing the Right Mode

```
┌─────────────────────────────────────────────────┐
│  Are you creating/editing specifications?      │
│  ✓ Yes → PLAN MODE                             │
│  ✗ No → Continue                               │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Are you implementing with git workflow?        │
│  ✓ Yes → WORK MODE                             │
│  ✗ No → Continue                               │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Need mix of planning and implementation?       │
│  ✓ Yes → FULL MODE                             │
│  ✗ No → Reassess needs                         │
└─────────────────────────────────────────────────┘
```

---

## ⚡ Performance Tips

1. **Use the most restrictive mode** that meets your needs
2. **PLAN mode** is fastest for spec creation
3. **WORK mode** is optimized for implementation
4. **FULL mode** is for exploration and mixed workflows

---

## 🐛 Troubleshooting

### Tool Not Available
```bash
# Check current mode
echo $MODE

# Switch to FULL mode temporarily
export MODE=full

# Restart server
```

### Can't Switch Modes
```bash
# Mode must be set BEFORE starting server
export MODE=work
# Then start server
npx @spec-mcp/server
```

---

## 📖 Full Documentation

See [MODE_GUIDE.md](./MODE_GUIDE.md) for complete documentation.
