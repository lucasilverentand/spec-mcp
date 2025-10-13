export const implementationWorkflowGuide = {
	uri: "spec-mcp://guide/implementation-workflow",
	name: "Implementation Workflow Guide",
	description:
		"Execute plans, track progress, and keep specs synchronized with code",
	mimeType: "text/markdown",
	content: `# Implementation Workflow

**Goal**: Execute plans, track progress, and keep specs synchronized with code.

## Overview

\`\`\`
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
\`\`\`

## Step-by-Step Implementation

### Step 1: Review the Plan

\`\`\`
Show me pln-001
\`\`\`

Review:
- **Scope**: What's included/excluded
- **Tasks**: All work items and dependencies
- **Test Cases**: How to verify it works
- **API Contracts**: Interfaces to implement
- **Data Models**: Schemas to create

### Step 2: Find Next Task

\`\`\`
Show me next tasks I can work on in pln-001
\`\`\`

Returns tasks that:
- Are not started or in-progress
- Have no unsatisfied dependencies
- Are not blocked
- Ordered by priority

### Step 3: Start a Task

\`\`\`
Start task-001 in pln-001
\`\`\`

This:
- Sets \`started_at\` timestamp
- Validates dependencies are met
- Adds timestamped note
- Marks task as \`in-progress\`

### Step 4: Implement

Write code using the plan's specifications:

**API Contracts:**
\`\`\`yaml
api_contracts:
  - name: POST /api/auth/login
    specification: |
      POST /api/auth/login
      Request: { "email": "string", "password": "string" }
      Response: { "token": "string", "user": {...} }
\`\`\`

**Data Models:**
\`\`\`yaml
data_models:
  - name: User
    schema: |
      interface User {
        id: string;
        email: string;
        password_hash: string;
      }
\`\`\`

### Step 5: Track Progress

\`\`\`
Add note to task-001: Completed database schema, added indexes
\`\`\`

**Handle blockers:**
\`\`\`
Block task-003: Waiting for API access credentials
\`\`\`

### Step 6: Complete Task

\`\`\`
Finish task-001 in pln-001: Implemented and tested database schema
\`\`\`

This:
- Sets \`completed_at\` timestamp
- Adds completion summary
- Marks task as \`completed\`
- Unblocks dependent tasks

### Step 7: Verify with Tests

\`\`\`
Show me test cases for pln-001
Mark test case test-001 as passing in pln-001
\`\`\`

### Step 8: Complete the Plan

Once all tasks are done, ready to ship when:
- All tasks completed
- All test cases passing
- No active blockers
- Acceptance criteria met

## Working with Task Dependencies

### Dependency Chains

\`\`\`yaml
tasks:
  - id: task-001
    task: Create database schema
    status: completed

  - id: task-002
    task: Build API layer
    depends_on: [task-001]
    status: in-progress

  - id: task-003
    task: Add caching
    depends_on: [task-002]
    status: pending
\`\`\`

### Parallel Work

Tasks without dependencies can run simultaneously:
\`\`\`yaml
tasks:
  - id: task-001
    task: Backend API

  - id: task-005
    task: Frontend UI
    # No depends_on - can work in parallel
\`\`\`

## Handling Blockers

### Types of Blockers

\`\`\`
Block task-005: Depends on task-003 which is blocked
Block task-006: Waiting for third-party API access
Block task-007: Performance issue needs architecture review
\`\`\`

### Resolving Blockers

\`\`\`yaml
blocked:
  - reason: Waiting for API credentials from vendor
    blocked_at: 2025-01-15T10:00:00Z
    external_dependency: SendGrid API access
\`\`\`

\`\`\`
Unblock task-006: Received API credentials
\`\`\`

## Task Lifecycle

### Status Flow

\`\`\`
pending → in-progress → completed → verified
\`\`\`

### Status Meanings

- **pending**: Not started, waiting for dependencies
- **in-progress**: Actively being worked on
- **completed**: Implementation done
- **verified**: Tested and confirmed working
- **blocked**: Can't proceed (temporary state)

### Timestamps

\`\`\`yaml
status:
  created_at: 2025-01-10T09:00:00Z
  started_at: 2025-01-12T10:00:00Z
  completed_at: 2025-01-15T16:00:00Z
  verified_at: 2025-01-15T17:00:00Z
  notes:
    - "[2025-01-12] Started implementation"
    - "[2025-01-15] Finished: All tests passing"
\`\`\`

## Updating Plans During Implementation

### Add Missing Tasks

\`\`\`
Add task to pln-001: Add rate limiting middleware
  priority: high
  depends_on: [task-002]
\`\`\`

### Update Scope

\`\`\`
Update pln-001 scope: Remove mobile push (moved to pln-002)
\`\`\`

### Supersede Tasks

\`\`\`
Supersede task-003 with new implementation approach
\`\`\`

## Progress Tracking Patterns

### Daily Standup
\`\`\`
What tasks am I working on?
What did I complete yesterday?
What's blocked?
\`\`\`

### Sprint Planning
\`\`\`
Show available tasks for pln-001
Show high-priority pending tasks
What's the next task after task-003?
\`\`\`

### Status Reports
\`\`\`
Show completion status for pln-001
How many tasks completed vs pending?
What's blocking progress?
\`\`\`

## Testing Integration

### Test-Driven Development

1. **Read test cases**: \`Show test cases for pln-001\`
2. **Write tests first**: Mark as \`implemented: false\`
3. **Implement until passing**: Mark as \`passing: true\`

### Updating Test Cases

\`\`\`
Add test case to pln-001:
  name: Login with expired credentials
  expected_result: 401 error with clear message
\`\`\`

## Common Implementation Patterns

### Feature Branch Per Plan

\`\`\`bash
git checkout -b feat/pln-001-notifications

# Reference plan in commits
git commit -m "feat: implement email notifications

Completes task-003 from pln-001-notification-system

- Integrated SendGrid API
- Added email templates
- Implemented retry logic"
\`\`\`

### Task-Based Commits

\`\`\`bash
git commit -m "feat(auth): add JWT middleware (task-001)"
git commit -m "feat(auth): implement login endpoint (task-002)"
\`\`\`

### Continuous Updates

\`\`\`
1. Start task-001
2. Implement code
3. Add notes: "Used bcrypt for password hashing"
4. Complete task-001
5. Update test case status
6. Move to next task
\`\`\`

## Team Collaboration

### Task Assignment

\`\`\`yaml
tasks:
  - id: task-001
    task: Backend API
    assigned_to: alice
    status: in-progress

  - id: task-002
    task: Frontend UI
    assigned_to: bob
    status: pending
\`\`\`

### Code Reviews

Reference specs in PR descriptions:
\`\`\`markdown
## Implements
- pln-001-notification-system
- Tasks: task-001, task-002, task-003

## Test Coverage
- test-001: Email delivery ✓
- test-002: Preference respect ✓

## Acceptance Criteria
- [x] Users receive emails within 5 minutes (crit-001)
- [x] Users can disable per category (crit-002)
\`\`\`

## Handling Issues

### Bugs Found During Implementation

\`\`\`
Create PRD for API performance issue discovered in pln-001
Create plan to fix API performance (references prd-005)
\`\`\`

### Scope Changes

When requirements change mid-implementation:
1. Update BRD with new criteria
2. Update PRD with technical changes
3. Update Plan with new tasks
4. Continue implementation

### Technical Debt

\`\`\`
Add note to task-003: Used quick solution, needs refactoring
  Reference: TODO in src/auth/service.ts line 45

Create plan: Refactor authentication service (tech debt from pln-001)
\`\`\`

## Completion Checklist

Before marking complete:
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
\`\`\`
Add note to task-002: Completed email service integration
Add note to task-002: Added error handling
Complete task-002: Email service ready for production
\`\`\`

### Use Notes Liberally
\`\`\`
Add note to task-003: Chose Redis over in-memory cache for scalability
Add note to task-004: API rate limit set to 100/min per user
\`\`\`

### Keep Plans Current
\`\`\`
Update pln-001 scope: Added SMS notifications (stakeholder request)
Add task to pln-001: Implement SMS via Twilio
\`\`\`

### Communicate Progress
\`\`\`
Show completion percentage for pln-001
Show tasks completed this week
Show remaining high-priority tasks
\`\`\`

## Related Guides

- See [Planning Workflow](spec-mcp://guide/planning-workflow) for creating plans
- See [Best Practices](spec-mcp://guide/best-practices) for implementation tips
- See [Query Guide](spec-mcp://guide/query-guide) for tracking progress`,
} as const;
