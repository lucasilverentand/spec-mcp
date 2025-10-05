# Implementation Workflow

## Overview

The implementation workflow describes how to execute work defined in specs and track progress.

## Step-by-Step Process

### Phase 1: Find What to Work On

#### 1.1 Get Next Recommended Task

```
query({ next_task: true })
```

This returns the highest priority unblocked task across all plans, considering:
- Task priority (critical > high > medium > low)
- Plan priority
- Dependencies (only returns unblocked tasks)
- Completion status

**Response**:
```json
{
  "task": {
    "id": "task-001",
    "priority": "high",
    "description": "Create User model with email/password fields - 2 hours",
    "files": [...]
  },
  "plan": {
    "id": "pln-001-auth-impl",
    "name": "Authentication Implementation",
    "criteria_id": "req-001-user-auth/crit-001"
  }
}
```

#### 1.2 Get Full Plan Context

```
query({
  entity_id: "pln-001-auth-impl",
  mode: "full",
  expand: {
    dependencies: true,
    dependency_metrics: true
  }
})
```

This shows:
- All tasks with dependencies
- Flows, test cases, APIs, data models
- Dependency graph and metrics
- Linked requirement criteria

### Phase 2: Implement the Task

#### 2.1 Review Task Details

Check the task structure:
- **description**: What to do and effort estimate
- **files**: Files to create/modify and reasons
- **depends_on**: Prerequisite tasks
- **considerations**: Implementation notes
- **references**: External docs or links

#### 2.2 Follow File Changes

Each task specifies file changes:
```yaml
files:
  - path: "src/models/User.ts"
    change_type: create
    reason: "User entity with validation"

  - path: "src/config/database.ts"
    change_type: modify
    reason: "Add User model to exports"
```

**Change Types**:
- `create`: New file
- `modify`: Update existing file
- `delete`: Remove file

#### 2.3 Apply Implementation Considerations

Tasks often include important notes:
```yaml
considerations:
  - "Use bcrypt for password hashing (min 10 rounds)"
  - "Add unique constraint on email field"
  - "Validate email format before saving"
```

### Phase 3: Test Your Changes

#### 3.1 Run Test Cases

If the plan defines test cases, verify them:
```yaml
test_cases:
  - id: tc-001
    type: unit
    description: "User model validates email format"

  - id: tc-002
    type: integration
    description: "User can be created and retrieved from database"
```

#### 3.2 Verify Acceptance Criteria

Check the plan's acceptance criteria:
```yaml
acceptance_criteria: "User model is created with email/password validation, passwords are hashed, and all tests pass"
```

### Phase 4: Track Progress

#### 4.1 Mark Task Complete

When task is done and tested:
```
update_spec({
  id: "pln-001-auth-impl",
  updates: {
    tasks: [
      { id: "task-001", completed: true, verified: true }
    ]
  }
})
```

**Fields**:
- `completed`: Work is done
- `verified`: Testing/review completed

#### 4.2 Update Test Case Status

```
update_spec({
  id: "pln-001-auth-impl",
  updates: {
    test_cases: [
      { id: "tc-001", status: "passed", notes: "All validations working" }
    ]
  }
})
```

#### 4.3 Mark Plan Complete

When all tasks are done:
```
update_spec({
  id: "pln-001-auth-impl",
  updates: {
    completed: true,
    approved: true
  }
})
```

### Phase 5: Validate and Continue

#### 5.1 Check System Health

```
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
```

Fix any broken references or circular dependencies.

#### 5.2 Get Next Task

```
query({ next_task: true })
```

Continue the cycle!

## Working with Dependencies

### Task Dependencies

Tasks can depend on other tasks within the same plan:
```yaml
tasks:
  - id: task-001
    description: "Setup database schema"
    depends_on: []

  - id: task-002
    description: "Create User model"
    depends_on: ["task-001"]  # Blocked until task-001 is complete
```

**Rule**: You cannot mark a task complete if it depends on incomplete tasks.

### Plan Dependencies

Plans can depend on other plans:
```yaml
depends_on:
  - "pln-001-database-setup"
  - "pln-002-auth-library"
```

**Best Practice**: Complete dependency plans before starting dependent work.

## Tracking Progress

### View Plan Progress

```
query({
  entity_id: "pln-001-auth-impl",
  mode: "summary"
})
```

Shows completion percentage and status.

### Find Blocked Work

```
query({
  types: ["plan"],
  filters: {
    plan_completed: false
  },
  sort_by: [
    { field: "priority", order: "desc" }
  ]
})
```

### Find Incomplete Requirements

```
query({
  types: ["requirement"],
  filters: {
    requirement_completed: false
  }
})
```

A requirement is complete when all its criteria have completed, approved plans.

## Implementation Anti-Patterns

### ❌ Avoid These Mistakes

1. **Skipping task verification**
   - Mark tasks as `verified: true` only after testing
   - Unverified tasks may have bugs

2. **Completing tasks out of order**
   - Respect `depends_on` relationships
   - Dependencies exist for a reason

3. **Not updating progress**
   - Stale task status causes confusion
   - Update as you work, not at the end

4. **Ignoring validation errors**
   - Broken references indicate spec drift
   - Fix immediately to maintain consistency

5. **Marking plans complete prematurely**
   - Verify all tasks and test cases first
   - Get approval if needed

## Implementation Best Practices

### ✅ Follow These Guidelines

1. **Use `next_task`**: Let the system guide you
2. **Update frequently**: Mark tasks complete as you finish
3. **Test thoroughly**: Verify before marking tasks verified
4. **Check dependencies**: Review dependency graph before starting
5. **Validate often**: Run validation to catch issues early
6. **Document as you go**: Add notes to tasks for future reference

## Example: Complete Implementation Flow

```
1. Find next task
   → query({ next_task: true })
   → Result: task-001 from pln-001-auth-impl

2. Get plan context
   → query({ entity_id: "pln-001-auth-impl", mode: "full" })
   → Review tasks, flows, test cases

3. Implement task
   → Create src/models/User.ts
   → Follow considerations (bcrypt, validation, etc.)

4. Test changes
   → Run unit tests for User model
   → Run integration tests

5. Mark task complete
   → update_spec({ id: "pln-001-auth-impl", updates: { tasks: [{ id: "task-001", completed: true, verified: true }] } })

6. Validate system
   → validate({ check_references: true })

7. Get next task
   → query({ next_task: true })
   → Result: task-002 from pln-001-auth-impl
```

## Working with Flows

Plans may define flows to guide implementation:

### User Flows
Step-by-step user interactions:
```yaml
flows:
  - id: flow-001
    type: user
    name: "User Registration"
    steps:
      - "User navigates to /register"
      - "User fills email and password"
      - "User submits form"
      - "System validates input"
      - "System creates user account"
      - "System redirects to dashboard"
```

### System Flows
Technical process flows:
```yaml
flows:
  - id: flow-002
    type: system
    name: "Password Hashing"
    steps:
      - "Receive plain password from input"
      - "Generate salt (bcrypt, 10 rounds)"
      - "Hash password with salt"
      - "Store hashed password in database"
```

Use flows to understand the complete picture before implementing tasks.

## Next Steps

- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for creating better specs
- Read [Best Practices](spec-mcp://guide/best-practices) for patterns and tips
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced querying
