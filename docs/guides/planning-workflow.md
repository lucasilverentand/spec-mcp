# Planning Workflow

## Overview

The planning workflow defines how to go from an idea to a structured implementation plan using spec-mcp.

## Step-by-Step Process

### Phase 1: Define Requirements

#### 1.1 Create a Requirement

Start with **what** needs to be built, not **how** to build it.

**Example**: "Create a requirement for user authentication"

The guided flow will ask:
- **Research**: Search for similar specs, review constitutions
- **Identity**: Name and slug (e.g., "user-authentication")
- **Description**: What problem does this solve?
- **Priority**: critical | required | ideal | optional
- **Criteria**: Measurable acceptance criteria

#### 1.2 Write Good Acceptance Criteria

Criteria should be:
- **Measurable**: Can be verified with a test
- **Specific**: Clear success conditions
- **Independent**: Each criterion stands alone

**Good Examples**:
- ✅ "User can register with email/password in under 30 seconds"
- ✅ "System enforces 8+ character passwords with mixed case and number"
- ✅ "Failed login attempts are rate-limited (5 attempts per 15 minutes)"

**Poor Examples**:
- ❌ "Authentication should be fast" (not measurable)
- ❌ "Secure password handling" (too vague)

### Phase 2: Model Architecture (Optional)

#### 2.1 Create Components

If your requirement needs new system components, define them:

**Example**: "Create a service component for authentication"

Components define:
- **Type**: app | service | library
- **Capabilities**: What it does
- **Dependencies**: What it relies on
- **Constraints**: Technical limitations

**When to create components**:
- New microservices or apps
- Shared libraries
- External integrations
- System boundaries need clarification

**When to skip**:
- Small features within existing components
- Minor enhancements
- Internal refactoring

### Phase 3: Create Implementation Plans

#### 3.1 Link Plans to Requirements

Each plan should ideally fulfill **one acceptance criterion** from a requirement:

**Example**: "Create a plan for requirement req-001-user-auth criterion crit-001"

The `criteria_id` field creates traceability:
```yaml
criteria_id: "req-001-user-authentication/crit-001"
```

#### 3.2 Define Plan Scope

Plans break down into:

**Required**:
- **Tasks**: Executable steps with file changes, dependencies
- **Acceptance Criteria**: Completion conditions

**Optional** (add when relevant):
- **Scope**: In/out of scope boundaries (use when complex)
- **Flows**: User/system/data flows (use for interactions)
- **Test Cases**: Test scenarios (use for detailed testing)
- **API Contracts**: Endpoints (use when creating APIs)
- **Data Models**: Schemas (use when defining data)

#### 3.3 Write Effective Tasks

**Good Task Structure**:
```yaml
id: task-001
priority: high
description: "Create User model with email/password fields - 2 hours"
depends_on: []
files:
  - path: "src/models/User.ts"
    change_type: create
    reason: "User entity with validation"
considerations:
  - "Use bcrypt for password hashing"
  - "Add unique constraint on email"
```

**Task Guidelines**:
- Include effort estimates
- Specify file changes
- List dependencies
- Note implementation considerations

#### 3.4 Establish Dependencies

**Between Plans**:
```yaml
depends_on:
  - "pln-001-database-setup"
  - "pln-002-auth-library"
```

**Between Tasks** (within a plan):
```yaml
tasks:
  - id: task-001
    description: "Create User model"
    depends_on: []

  - id: task-002
    description: "Create AuthService using User model"
    depends_on: ["task-001"]
```

### Phase 4: Validate and Review

#### 4.1 Check Coverage

Find uncovered requirements:
```
query({
  types: ["requirement"],
  filters: { uncovered: true }
})
```

#### 4.2 Validate System Health

```
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
```

This checks:
- **References**: No broken links between specs
- **Cycles**: No circular dependencies
- **Health**: Overall system score (0-100)

## Planning Anti-Patterns

### ❌ Avoid These Mistakes

1. **Creating plans without requirements**
   - Plans should trace to requirements via `criteria_id`
   - Exception: Orchestration/milestone plans

2. **Vague acceptance criteria**
   - "User authentication works" → Not measurable
   - Use specific, testable conditions

3. **Missing dependencies**
   - Leads to blocked work
   - Always specify `depends_on` for plans and tasks

4. **Overly detailed plans**
   - Skip optional fields if not needed
   - Don't add flows/APIs/data models unnecessarily

5. **One plan per requirement**
   - Create one plan per **criterion**, not per requirement
   - Enables parallel work and better traceability

## Planning Best Practices

### ✅ Follow These Guidelines

1. **Start Small**: Create requirements first, plans later
2. **Be Specific**: Write measurable criteria and detailed tasks
3. **Link Everything**: Use `criteria_id` and `depends_on`
4. **Validate Often**: Run `validate()` regularly
5. **Check Coverage**: Ensure all criteria have plans
6. **Use Constitutions**: Define project principles early

## Example: Complete Planning Flow

```
1. Create requirement
   → "Create a requirement for user registration"
   → Result: req-001-user-registration with 3 criteria

2. Create plans (one per criterion)
   → "Create plan for req-001-user-registration/crit-001"
   → "Create plan for req-001-user-registration/crit-002"
   → "Create plan for req-001-user-registration/crit-003"

3. Validate coverage
   → query({ types: ["requirement"], filters: { uncovered: true } })
   → Result: All criteria covered ✓

4. Validate system
   → validate({ check_references: true, check_cycles: true })
   → Result: No errors ✓

5. Start implementation
   → query({ next_task: true })
   → Result: task-001 from pln-001 (highest priority, unblocked)
```

## Next Steps

- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development process
- Read [Best Practices](spec-mcp://guide/best-practices) for patterns and tips
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced searching
