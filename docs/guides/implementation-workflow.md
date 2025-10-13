# Implementation Workflow

**Goal**: Learn the workflow for implementing features from plans, tracking progress, and keeping specs synchronized with code.

## Overview

The implementation workflow takes you from a ready plan to shipped code:

```
Ready Plan
  ↓
Select Task
  ↓
Start Task
  ↓
Implement Code
  ↓
Update Progress
  ↓
Complete Task
  ↓
Verify & Test
  ↓
Ship
```

## Step-by-Step Implementation

### Step 1: Review the Plan

**Get familiar with what you're building**

```
Show me pln-001
```

Review:
- **Scope**: What's included and excluded
- **Tasks**: All work items and their dependencies
- **Test Cases**: How to verify it works
- **API Contracts**: Interfaces to implement
- **Data Models**: Schemas to create
- **References**: Supporting documentation

**Check acceptance criteria:**

```
Show me the criteria for pln-001
```

This tells you what "done" looks like.

### Step 2: Find Next Task

**Query for available work**

```
Show me next tasks I can work on in pln-001
```

The system returns tasks that:
- Are not started or in-progress
- Have no unsatisfied dependencies
- Are not blocked
- Ordered by priority

**Example response:**
```
Available tasks:
- task-001: Setup database schema (priority: critical)
- task-005: Build user preferences API (priority: high)
```

### Step 3: Start a Task

**Mark task as started**

```
Start task-001 in pln-001
```

This:
- Sets `status.started_at` timestamp
- Validates dependencies are met
- Adds a timestamped note
- Marks task as `in-progress`

**Dependency validation:**

```yaml
# This will fail if task-001 isn't completed
Start task-002 in pln-001
# Error: Cannot start task-002. Depends on task-001 (pending)
```

### Step 4: Implement

**Write the code**

Refer to the plan's specifications:

**API Contracts:**
```yaml
api_contracts:
  - name: POST /api/auth/login
    specification: |
      POST /api/auth/login
      Request: { "email": "string", "password": "string" }
      Response: { "token": "string", "user": {...} }
```

**Data Models:**
```yaml
data_models:
  - name: User
    format: typescript
    schema: |
      interface User {
        id: string;
        email: string;
        password_hash: string;
      }
```

**Test Cases:**
```yaml
test_cases:
  - name: Valid login
    steps:
      - Create test user
      - POST to /auth/login
      - Verify 200 response
    expected_result: JWT token returned
```

### Step 5: Track Progress

**Add notes to tasks**

```
Add note to task-001: Completed database schema, added indexes
```

This helps:
- Document progress
- Remember decisions
- Communicate with team
- Debug issues later

**Handle blockers:**

```
Block task-003 in pln-001: Waiting for API access credentials
```

Documents what's preventing progress.

### Step 6: Complete Task

**Mark task as done**

```
Finish task-001 in pln-001: Implemented and tested database schema
```

This:
- Sets `status.completed_at` timestamp
- Validates dependencies were met
- Adds completion summary
- Marks task as `completed`

**Unblocks dependent tasks:**

```yaml
# After completing task-001
tasks:
  - id: task-001
    status: completed  # ✓

  - id: task-002
    depends_on: [task-001]
    status: pending  # ← Now available to start
```

### Step 7: Verify with Tests

**Run test cases**

```
Show me test cases for pln-001
```

Execute each test case and update status:

```
Mark test case test-001 as passing in pln-001
Mark test case test-002 as implemented in pln-001
```

**Track test coverage:**
```yaml
test_cases:
  - id: test-001
    implemented: true  # ✓ Code written
    passing: true      # ✓ Test passes
```

### Step 8: Complete the Plan

Once all tasks are done:

```
Show plan pln-001 completion status
```

**Ready to ship when:**
- All tasks completed
- All test cases passing
- No active blockers
- Acceptance criteria met

## Working with Task Dependencies

### Dependency Chains

```yaml
tasks:
  - id: task-001
    task: Create database schema
    status: completed  # ✓

  - id: task-002
    task: Build API layer
    depends_on: [task-001]
    status: in-progress  # ← Working on this

  - id: task-003
    task: Add caching layer
    depends_on: [task-002]
    status: pending  # ← Blocked until task-002 done
```

**Query dependencies:**

```
What tasks does task-003 depend on?
Which tasks are blocked by task-002?
```

### Parallel Work

Tasks without dependencies can run in parallel:

```yaml
tasks:
  - id: task-001
    task: Backend API

  - id: task-005
    task: Frontend UI
    # No depends_on - can work simultaneously
```

### Changing Dependencies

If you discover new dependencies:

```
Make task-004 depend on task-003 in pln-001
```

This updates the plan to reflect reality.

## Handling Blockers

### Types of Blockers

**Task Dependencies:**
```
Block task-005: Depends on task-003 which is blocked
```

**External Dependencies:**
```
Block task-006: Waiting for third-party API access
```

**Technical Issues:**
```
Block task-007: Performance issue needs architecture review
```

### Resolving Blockers

Document the blocker:
```yaml
blocked:
  - reason: Waiting for API credentials from vendor
    blocked_at: 2025-01-15T10:00:00Z
    external_dependency: SendGrid API access
```

When resolved:
```
Unblock task-006 in pln-001: Received API credentials
```

## Task Lifecycle

### Status Flow

```
pending
  ↓ (start_task)
in-progress
  ↓ (finish_task)
completed
  ↓ (verify)
verified
```

### Status Meanings

- **pending**: Not started, waiting for dependencies or assignment
- **in-progress**: Actively being worked on
- **completed**: Implementation done
- **verified**: Tested and confirmed working
- **blocked**: Can't proceed (temporary state)

### Timestamps

Every task tracks:
```yaml
status:
  created_at: 2025-01-10T09:00:00Z
  started_at: 2025-01-12T10:00:00Z
  completed_at: 2025-01-15T16:00:00Z
  verified_at: 2025-01-15T17:00:00Z
  notes:
    - "[2025-01-12T10:00:00Z] Started implementation"
    - "[2025-01-13T14:00:00Z] Completed database layer"
    - "[2025-01-15T16:00:00Z] Finished: All tests passing"
```

## Updating Plans During Implementation

### Add Missing Tasks

```
Add task to pln-001: Add rate limiting middleware
  priority: high
  depends_on: [task-002]
```

Plans evolve as you discover work.

### Update Scope

When scope changes:

```
Update pln-001 scope: Remove mobile push notifications (moved to pln-002)
```

### Supersede Tasks

When approach changes:

```
Supersede task-003 with new implementation approach
```

Creates new task version, preserving history.

### Add Files to Tasks

Track code changes per task:

```yaml
tasks:
  - id: task-001
    task: Implement user authentication
    files:
      - path: src/auth/service.ts
        action: create
        applied: true
      - path: src/auth/routes.ts
        action: create
        applied: true
```

## Progress Tracking Patterns

### Daily Standup

```
What tasks am I working on?
What did I complete yesterday?
What's blocked?
```

### Sprint Planning

```
Show available tasks for pln-001
Show high-priority pending tasks
What's the next task after task-003?
```

### Status Reports

```
Show completion status for pln-001
How many tasks are completed vs pending?
What's blocking progress on pln-001?
```

## Testing Integration

### Test-Driven Development

1. **Read test cases from plan**
   ```
   Show test cases for pln-001
   ```

2. **Write tests first**
   ```yaml
   test_cases:
     - name: User login with valid credentials
       implemented: false  # ← Not written yet
       passing: false
   ```

3. **Implement until passing**
   ```yaml
   test_cases:
     - name: User login with valid credentials
       implemented: true  # ✓ Test written
       passing: true      # ✓ Test passes
   ```

### Updating Test Cases

Add tests discovered during implementation:

```
Add test case to pln-001:
  name: Login with expired credentials
  description: Verify expired credentials are rejected
  expected_result: 401 error with clear message
```

## Common Implementation Patterns

### Feature Branch Per Plan

```bash
# Create branch from plan ID
git checkout -b feat/pln-001-notifications

# Work on tasks
# ...

# Reference plan in commits
git commit -m "feat: implement email notifications

Completes task-003 from pln-001-notification-system

- Integrated SendGrid API
- Added email templates
- Implemented retry logic"
```

### Task-Based Commits

```bash
# One commit per task
git commit -m "feat(auth): add JWT middleware (task-001)"
git commit -m "feat(auth): implement login endpoint (task-002)"
git commit -m "test(auth): add login test cases (task-003)"
```

### Continuous Updates

Update specs as you implement:

```
1. Start task-001
2. Implement code
3. Add notes: "Used bcrypt for password hashing"
4. Complete task-001
5. Update test case status
6. Move to next task
```

## Team Collaboration

### Task Assignment

Track who's working on what:

```yaml
tasks:
  - id: task-001
    task: Backend API
    assigned_to: alice
    status: in-progress

  - id: task-002
    task: Frontend UI
    assigned_to: bob
    status: pending
```

### Code Reviews

Reference specs in PR descriptions:

```markdown
## Implements

- pln-001-notification-system
- Completes tasks: task-001, task-002, task-003

## Test Coverage

- test-001: Email delivery ✓
- test-002: Preference respect ✓
- test-003: Retry logic ✓

## Acceptance Criteria

- [x] Users receive emails within 5 minutes (crit-001)
- [x] Users can disable per category (crit-002)
```

### Pair Programming

Update specs together:

```
# Navigator: Check what's next
Show next available tasks in pln-001

# Driver: Start the task
Start task-005 in pln-001

# Implement together
# ...

# Driver: Mark complete
Finish task-005: Implemented with pair programming
```

## Handling Issues

### Bugs Found During Implementation

Create PRD for context:

```
Create PRD for API performance issue discovered in pln-001
```

Then plan the fix:

```
Create plan to fix API performance (references prd-005)
```

### Scope Changes

When requirements change mid-implementation:

```
1. Update BRD with new criteria
2. Update PRD with technical changes
3. Update Plan with new tasks
4. Continue implementation
```

### Technical Debt

Document shortcuts:

```
Add note to task-003: Used quick solution, needs refactoring
  Reference: TODO in src/auth/service.ts line 45
```

Create follow-up plan:

```
Create plan: Refactor authentication service (tech debt from pln-001)
```

## Completion Checklist

Before marking a plan complete:

- [ ] All tasks completed
- [ ] All test cases passing
- [ ] No active blockers
- [ ] Acceptance criteria verified
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Stakeholders notified

## Tips for Smooth Implementation

### Update Frequently

Don't wait until tasks are done:

```
# Throughout implementation
Add note to task-002: Completed email service integration
Add note to task-002: Added error handling
Add note to task-002: Performance testing looks good
Complete task-002: Email service ready for production
```

### Use Notes Liberally

Document decisions and discoveries:

```
Add note to task-003: Chose Redis over in-memory cache for scalability
Add note to task-004: API rate limit set to 100/min per user
```

### Keep Plans Current

If reality diverges from plan:

```
Update pln-001 scope: Added SMS notifications (requested by stakeholders)
Add task to pln-001: Implement SMS via Twilio
```

### Communicate Progress

Share updates:

```
Show completion percentage for pln-001
Show tasks completed this week in pln-001
Show remaining high-priority tasks
```

## Related Guides

- See [Planning Workflow](spec-mcp://guide/planning-workflow) for creating plans
- See [Best Practices](spec-mcp://guide/best-practices) for implementation tips
- See [Query Guide](spec-mcp://guide/query-guide) for tracking progress
- See [Plan Guide](spec-mcp://guide/plan) for plan structure details
