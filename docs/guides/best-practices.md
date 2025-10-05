# Best Practices

## Overview

Proven patterns and anti-patterns for effective spec-driven development.

## Requirements

### ✅ Do This

**Write Implementation-Agnostic Requirements**
```yaml
# Good
description: "Users need to securely authenticate to access their data"

# Bad
description: "Implement JWT-based authentication using OAuth2"
```
Requirements focus on **what** and **why**, not **how**.

**Use Measurable Acceptance Criteria**
```yaml
# Good
criteria:
  - id: crit-001
    description: "User can complete registration in under 30 seconds with valid email/password"

# Bad
criteria:
  - id: crit-001
    description: "Registration should be fast and easy"
```

**One Requirement Per Feature**
```yaml
# Good: Focused requirement
name: "User Authentication"
description: "Users need secure authentication to access the system"

# Bad: Multiple unrelated features
name: "User Management"
description: "Authentication, profiles, settings, preferences"
```

**Choose Appropriate Priority**
- **critical**: Launch blocker, system broken without it
- **required**: Needed soon, important for success
- **ideal**: Nice to have, enhances experience
- **optional**: Future consideration, low priority

### ❌ Avoid This

- Mixing multiple features in one requirement
- Implementation details in requirements
- Vague or unmeasurable criteria
- Skipping research phase (creates duplicates)

## Plans

### ✅ Do This

**Link Plans to Requirement Criteria**
```yaml
criteria_id: "req-001-user-auth/crit-001"
```
One plan per criterion enables parallel work and clear traceability.

**Break Down Tasks Granularly**
```yaml
# Good: Specific, single-responsibility
tasks:
  - id: task-001
    description: "Create User model with email/password fields - 2 hours"

  - id: task-002
    description: "Add password hashing with bcrypt - 1 hour"

# Bad: Too broad
tasks:
  - id: task-001
    description: "Build authentication system"
```

**Include Effort Estimates**
```yaml
description: "Create User model with validation - 2 hours"
```
Helps with planning and tracking velocity.

**Specify File Changes**
```yaml
files:
  - path: "src/models/User.ts"
    change_type: create
    reason: "User entity with email/password validation"
```

**Document Implementation Considerations**
```yaml
considerations:
  - "Use bcrypt with minimum 10 rounds"
  - "Add unique constraint on email field"
  - "Validate email format with regex"
```

**Use Optional Fields Wisely**
- **Add flows**: When user interactions or system processes need documentation
- **Add test cases**: When specific test scenarios need detailed documentation
- **Add API contracts**: When creating or consuming APIs
- **Add data models**: When defining database schemas
- **Skip when**: Simple backend tasks, internal refactoring, or well-defined small plans

### ❌ Avoid This

- Plans without `criteria_id` (except orchestration/milestone plans)
- Vague tasks without file changes or estimates
- Missing `depends_on` relationships
- Adding unnecessary optional fields (flows, APIs, etc.)
- Overly detailed plans that constrain implementation

## Components

### ✅ Do This

**Use Component Types Appropriately**
- **app**: User-facing applications (web, mobile)
- **service**: Backend services, microservices, APIs
- **library**: Shared code, packages, utilities

**Define Clear Capabilities**
```yaml
capabilities:
  - "User authentication (JWT tokens)"
  - "Password hashing and validation"
  - "Session management"
```

**Document Technical Constraints**
```yaml
constraints:
  - "Must support 10,000 concurrent users"
  - "Session tokens expire after 24 hours"
  - "Rate limiting: 100 requests/minute per user"
```

**Specify Dependencies**
```yaml
depends_on:
  - "lib-001-database"
  - "lib-002-validation"
```

### ❌ Avoid This

- Components without clear boundaries
- Missing dependencies
- Overly granular components (creates noise)

## Constitutions

### ✅ Do This

**Create Early or As Needed**
- Define principles at project start, or
- Evolve principles as patterns emerge

**Write Specific, Actionable Principles**
```yaml
# Good
principle: "Prefer libraries over services when functionality can be shared as code"

# Bad
principle: "Write good code and use best practices"
```

**Include Concrete Examples**
```yaml
examples:
  - "Use @company/auth-lib for shared authentication logic"
  - "Use @company/validation-lib for common validation rules"
```

**Document Exceptions**
```yaml
exceptions:
  - "When service needs independent deployment lifecycle"
  - "When functionality requires separate scaling"
```

**Use Article Status**
- `needs-review`: Draft, not yet approved
- `active`: Approved and in effect
- `archived`: No longer applicable

### ❌ Avoid This

- Too many articles initially (start with 3-7 core principles)
- Vague or obvious principles
- No examples (makes principles hard to apply)
- Never updating articles as project evolves

## Querying

### ✅ Do This

**Use `next_task` for Discovery**
```
query({ next_task: true })
```
Gets highest priority unblocked task automatically.

**Expand Dependencies When Needed**
```
query({
  entity_id: "pln-001-auth",
  expand: {
    dependencies: true,
    dependency_metrics: true,
    depth: 2
  }
})
```

**Filter for Uncovered Work**
```
query({
  types: ["requirement"],
  filters: { uncovered: true }
})
```

**Use Facets for Overview**
```
query({
  types: ["plan"],
  include_facets: true,
  facet_fields: ["priority", "status"]
})
```

**Sort Meaningfully**
```
query({
  types: ["plan"],
  filters: { plan_completed: false },
  sort_by: [
    { field: "priority", order: "desc" },
    { field: "created_at", order: "asc" }
  ]
})
```

### ❌ Avoid This

- Manually tracking next tasks (use `next_task`)
- Not using filters to find gaps (uncovered, orphaned)
- Ignoring dependency metrics (fan-in, fan-out, coupling)

## Validation

### ✅ Do This

**Validate Regularly**
```
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
```

**Fix Issues Immediately**
- Broken references → Spec drift
- Circular dependencies → Blocked work
- Low health score → Systemic problems

**Validate After Major Changes**
- Creating multiple specs
- Refactoring dependencies
- Deleting specs

### ❌ Avoid This

- Ignoring validation errors
- Waiting until system is broken
- Not running validation after bulk changes

## Progress Tracking

### ✅ Do This

**Update As You Work**
```
update_spec({
  id: "pln-001-auth",
  updates: {
    tasks: [
      { id: "task-001", completed: true, verified: true }
    ]
  }
})
```

**Mark Verified After Testing**
- `completed: true` → Work done
- `verified: true` → Tested and reviewed

**Complete Plans When Done**
```
update_spec({
  id: "pln-001-auth",
  updates: {
    completed: true,
    approved: true
  }
})
```

### ❌ Avoid This

- Batch updates at end of day (lose progress visibility)
- Marking tasks verified without testing
- Completing plans with unfinished tasks

## Common Patterns

### Pattern: Feature Development

```
1. Create requirement with criteria
   → req-001-user-auth (3 criteria)

2. Create plan per criterion
   → pln-001-auth-impl (crit-001)
   → pln-002-session-impl (crit-002)
   → pln-003-oauth-impl (crit-003)

3. Implement tasks sequentially
   → query({ next_task: true })
   → Implement → Test → Complete
   → Repeat

4. Validate and verify
   → All tasks complete and verified
   → All test cases pass
   → Mark plan complete/approved

5. Check requirement coverage
   → All criteria have completed plans
   → Requirement is complete
```

### Pattern: Multi-Team Work

```
1. Create requirement with clear criteria
2. Create plans for each criterion
3. Assign plans to teams via priority/dependencies
4. Teams work independently on their plans
5. Use `depends_on` to coordinate between plans
6. Validate regularly to catch integration issues
```

### Pattern: Technical Debt

```
1. Create requirement for improvement
   → priority: "ideal" or "optional"

2. Create plan with refactoring tasks
   → Link to affected components

3. Track in backlog
   → query({ types: ["plan"], filters: { plan_completed: false, plan_priority: ["low"] } })
```

## Common Anti-Patterns

### ❌ Big Bang Planning

Creating all specs upfront leads to:
- Stale specs (requirements change)
- Over-specification (too much detail)
- Analysis paralysis

**Instead**: Create just-in-time, iteratively.

### ❌ Implementation Details in Requirements

```yaml
# Bad
requirement:
  description: "Implement JWT authentication with bcrypt password hashing"

# Good
requirement:
  description: "Users need secure authentication to access their data"
  criteria:
    - "Passwords are securely stored and cannot be recovered in plain text"
```

**Instead**: Keep requirements implementation-agnostic.

### ❌ Orphaned Specs

Specs with no references or dependencies become stale.

**Instead**:
- Link plans to requirements via `criteria_id`
- Use `depends_on` for relationships
- Run `query({ filters: { orphaned: true } })` regularly

### ❌ Circular Dependencies

```yaml
# pln-001
depends_on: ["pln-002"]

# pln-002
depends_on: ["pln-001"]  # Circular!
```

**Instead**: Run `validate({ check_cycles: true })` regularly.

### ❌ Skipping Validation

Not validating leads to:
- Broken references
- Circular dependencies
- Spec drift

**Instead**: Validate frequently, fix issues immediately.

## Tips and Tricks

### Quick Reference

**Find Next Work**: `query({ next_task: true })`
**Find Gaps**: `query({ types: ["requirement"], filters: { uncovered: true } })`
**Health Check**: `validate({ check_references: true, check_cycles: true, include_health: true })`
**Progress Summary**: `query({ types: ["plan"], include_facets: true, facet_fields: ["status", "priority"] })`

### Keyboard Shortcuts (Conceptual)

Think of these as mental shortcuts:
- "What's next?" → `next_task`
- "What's broken?" → `validate`
- "What's missing?" → `uncovered` filter
- "What's blocked?" → Check `depends_on` + completion status

### Integration with Development

1. **Before coding**: `query({ next_task: true })`
2. **During coding**: Reference task file changes and considerations
3. **After coding**: Update task completion status
4. **Before commit**: Run validation
5. **Daily standup**: Review plan progress

## Next Steps

- Read [Getting Started](spec-mcp://guide/getting-started) for quick setup
- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for detailed planning
- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced queries
