# Spec-MCP Slash Commands

Quick access commands that directly invoke specialized agents for common specification workflows.

## Requirements Commands

### `/create-requirement`
Create a new requirement specification using the 7-step reasoning process.

**Usage:**
```
/create-requirement user authentication with OAuth support
/create-requirement real-time data synchronization
```

**What it does:**
- Invokes requirement-planner agent
- Guides through 7-step process
- Researches best practices
- Validates against schema
- Creates requirement in system

---

### `/refine-requirement`
Analyze and improve an existing requirement specification.

**Usage:**
```
/refine-requirement req-001-authentication
/refine-requirement req-003-data-sync
```

**What it does:**
- Gets existing requirement
- Analyzes quality
- Researches improvements
- Provides specific recommendations
- Updates if approved

---

## Component Commands

### `/design-component`
Design a new component specification using the 10-step reasoning process.

**Usage:**
```
/design-component authentication service
/design-component dashboard UI component
```

**What it does:**
- Invokes component-planner agent
- Guides through 10-step process
- Researches architectural patterns
- Validates boundaries and dependencies
- Creates component in system

---

### `/refine-component`
Analyze and improve an existing component specification.

**Usage:**
```
/refine-component svc-003-auth-service
/refine-component app-001-dashboard
```

**What it does:**
- Gets existing component
- Analyzes architecture
- Checks for circular dependencies
- Provides recommendations
- Updates if approved

---

## Planning Commands

### `/create-plan`
Create a detailed implementation plan using the 12-step reasoning process.

**Usage:**
```
/create-plan implement authentication service for req-001-auth/crit-001
/create-plan build dashboard UI
```

**What it does:**
- Invokes implementation-planner agent
- Links to criteria_id
- Breaks down into 0.5-3 day tasks
- Includes 20% buffer
- Defines testing strategy
- Creates plan in system

---

### `/refine-plan`
Analyze and improve an existing implementation plan.

**Usage:**
```
/refine-plan pln-001-auth-implementation
/refine-plan pln-005-dashboard-build
```

**What it does:**
- Gets existing plan
- Validates task sizing
- Checks dependencies
- Detects circular dependencies
- Provides recommendations
- Updates if approved

---

## Development Commands

### `/implement-task`
Implement a specific task from a plan with proper tracking.

**Usage:**
```
/implement-task task-003 from pln-001-auth-implementation
/implement-task task-007 from pln-005-dashboard-build
```

**What it does:**
- Invokes developer agent
- Researches implementation patterns
- Gets latest library documentation
- Executes file actions
- Updates task tracking fields
- Marks files as applied

---

## Testing Commands

### `/implement-tests`
Implement comprehensive test suite for a plan.

**Usage:**
```
/implement-tests pln-001-auth-implementation
/implement-tests pln-005-dashboard-build
```

**What it does:**
- Invokes quality-assurance agent
- Implements all test_cases from plan
- Achieves 90%+ coverage
- Validates acceptance criteria
- Updates test_case tracking

---

## Management Commands

### `/health-check`
Run a comprehensive specification system health audit.

**Usage:**
```
/health-check
```

**What it does:**
- Invokes spec-manager agent
- Calculates overall health score
- Validates all references
- Detects circular dependencies
- Finds orphaned specs
- Analyzes coverage gaps
- Generates executive summary

---

### `/validate-spec`
Validate a specific specification against best practices.

**Usage:**
```
/validate-spec req-001-authentication
/validate-spec svc-003-auth-service
/validate-spec pln-001-auth-implementation
```

**What it does:**
- Routes to appropriate analyzer (7/10/12-step)
- Provides quality score
- Lists issues and suggestions
- Highlights strengths
- Gives actionable recommendations

---

### `/generate-report`
Generate a comprehensive specification system report.

**Usage:**
```
/generate-report executive
/generate-report detailed
/generate-report technical
```

**Report Styles:**
- **executive**: High-level summary for stakeholders (metrics, progress, top issues)
- **detailed**: Comprehensive analysis (all issues, gaps, traceability)
- **technical**: Deep dive with graphs and metrics (dependency graphs, coverage details)

**What it does:**
- Comprehensive system analysis
- Coverage metrics
- Progress tracking
- Issue identification
- Recommendations

---

## Workflow Examples

### Creating a New Feature

```bash
# 1. Define what's needed
/create-requirement user profile management

# 2. Design the architecture
/design-component user-profile-service

# 3. Plan the implementation
/create-plan implement user profile service for req-002-profile/crit-001

# 4. Implement tasks
/implement-task task-001 from pln-002-profile-service

# 5. Add tests
/implement-tests pln-002-profile-service

# 6. Validate everything
/health-check
```

### Improving Existing Specs

```bash
# Analyze current state
/health-check

# Refine problematic specs
/refine-requirement req-001-authentication
/refine-component svc-003-auth-service
/refine-plan pln-001-auth-implementation

# Generate report for stakeholders
/generate-report executive
```

---

## Tips

1. **Use Tab Completion**: Commands support Claude Code's tab completion
2. **Context Matters**: Provide clear, specific context in your command input
3. **Follow Workflow**: Requirements → Components → Plans → Implementation → Testing
4. **Regular Health Checks**: Run `/health-check` periodically to catch issues early
5. **Validate Often**: Use `/validate-spec` before considering a spec complete

---

## Agent Documentation

For detailed information about each agent's capabilities and reasoning process, see:
- `.claude/agents/requirement-planner.md`
- `.claude/agents/component-planner.md`
- `.claude/agents/implementation-planner.md`
- `.claude/agents/developer.md`
- `.claude/agents/quality-assurance.md`
- `.claude/agents/spec-manager.md`