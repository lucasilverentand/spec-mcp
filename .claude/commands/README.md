# Spec-MCP Slash Commands

Quick access commands for common specification workflows. Commands use smart routing to automatically invoke the right agent based on context.

## 📋 Specification Commands

### `/create {type} {context}`
Create a new specification of any type.

**Types:** `requirement` | `component` | `plan`

**Examples:**
```
/create requirement user authentication with OAuth support
/create component authentication-service for handling OAuth
/create plan auth-implementation for req-001-auth/crit-001
```

**What it does:**
- `requirement` → Invokes requirement-planner (7-step process)
- `component` → Invokes component-planner (10-step process)
- `plan` → Invokes implementation-planner (12-step process)
- Researches best practices
- Validates against schema
- Creates specification in system

---

### `/refine {id}`
Analyze and improve an existing specification. **Auto-detects type from ID prefix.**

**Examples:**
```
/refine req-001-authentication
/refine app-002-dashboard
/refine pln-003-implementation
```

**What it does:**
- Auto-detects type from ID:
  - `req-*` → requirement-planner
  - `app-*`, `svc-*`, `lib-*`, `tol-*` → component-planner
  - `pln-*` → implementation-planner
- Analyzes current quality
- Researches improvements
- Provides specific recommendations
- Updates if approved

---

### `/validate {id}`
Validate a specification against best practices. **Auto-detects type from ID prefix.**

**Examples:**
```
/validate req-001-auth
/validate app-002-dashboard
/validate pln-003-implementation
```

**What it does:**
- Uses spec-manager agent
- Auto-detects type from ID prefix
- Runs appropriate validation (7/10/12-step process)
- Provides quality score, issues, suggestions, strengths
- Includes confidence-scored recommendations

---

## 💻 Implementation Commands

### `/implement task {task-id}`
Implement a specific task from a plan.

**Examples:**
```
/implement task task-003 from pln-001-calculator
/implement task task-005
```

**What it does:**
- Invokes developer agent
- Researches implementation patterns and library docs
- Follows task specifications exactly
- Executes all file actions (create/modify/delete)
- Updates task tracking (completed, applied flags)

---

### `/implement tests {plan-id}`
Implement comprehensive test suite for a plan.

**Examples:**
```
/implement tests pln-001-calculator
/implement tests pln-003-auth
```

**What it does:**
- Invokes quality-assurance agent
- Researches testing frameworks and patterns
- Implements all test cases from plan
- Targets 90%+ code coverage
- Validates all acceptance criteria
- Updates test_case tracking (implemented, passing flags)

---

## 🔍 System Commands

### `/health-check`
Run comprehensive system health audit and generate executive summary.

**Example:**
```
/health-check
```

**What it does:**
- Invokes spec-manager agent
- Analyzes:
  - Overall health score (0-100)
  - Broken references with suggested fixes
  - Circular dependencies
  - Orphaned specifications
  - Coverage gaps (Requirements → Components → Plans)
  - Actionable recommendations with confidence scores
- Generates executive summary report

---

## 🆕 What's New

**This is a consolidated command set** that replaces 12 individual commands with 6 smarter commands:

### Migration Guide

| Old Command | New Command |
|-------------|-------------|
| `/create-requirement X` | `/create requirement X` |
| `/design-component X` | `/create component X` |
| `/create-plan X` | `/create plan X` |
| `/refine-requirement req-001` | `/refine req-001` |
| `/refine-component app-001` | `/refine app-001` |
| `/refine-plan pln-001` | `/refine pln-001` |
| `/validate-spec req-001` | `/validate req-001` |
| `/generate-report` | `/health-check` |
| `/implement-task X` | `/implement task X` |
| `/implement-tests X` | `/implement tests X` |
| `/health-check` | `/health-check` *(unchanged)* |

---

## 💡 Command Tips

### Auto-Detection Magic
The `/refine` and `/validate` commands automatically detect specification type from ID prefix:
- `req-XXX-*` = Requirement
- `app-XXX-*` = Application Component
- `svc-XXX-*` = Service Component
- `lib-XXX-*` = Library Component
- `tol-XXX-*` = Tool Component
- `pln-XXX-*` = Plan

No need to specify the type - just use the ID!

### Multi-Word Context
For `/create` commands, everything after the type becomes context:
```
/create requirement user authentication with OAuth2 and MFA support
```
Context: "user authentication with OAuth2 and MFA support"

### Agents Behind the Scenes
Each command invokes a specialized agent:
- **requirement-planner**: 7-step reasoning process for requirements
- **component-planner**: 10-step reasoning process for components
- **implementation-planner**: 12-step reasoning process for plans
- **developer**: Code implementation specialist
- **quality-assurance**: Test implementation specialist
- **spec-manager**: System health and validation specialist

All agents follow rigorous research and validation processes to ensure high-quality specifications.

---

## 📚 Related Documentation

- **Schemas**: See `.claude/shared/schemas/` for entity schema specifications
- **Best Practices**: See `.claude/shared/best-practices/` for specification guidelines
- **Agents**: See `.claude/agents/` for detailed agent capabilities

---

## 🚀 Quick Start

**Creating your first spec:**
```
/create requirement real-time chat messaging
```

**Refining it after review:**
```
/refine req-001-real-time-chat
```

**Validating quality:**
```
/validate req-001-real-time-chat
```

**Checking system health:**
```
/health-check
```

That's it! The commands handle all the complexity of routing to the right agents and following best practices.