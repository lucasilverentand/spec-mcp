# Best Practices

**Goal**: Learn patterns, anti-patterns, and tips for effective spec-driven development.

## Core Principles

### 1. Documentation as Code

Treat specs like code:
- Version control everything
- Review changes
- Keep them up-to-date
- Refactor when needed

```bash
# Commit specs with code
git add specs/plans/pln-001-auth.yml src/auth/
git commit -m "feat: implement authentication (pln-001)"
```

### 2. Just Enough Documentation

❌ **Over-Documentation**
```yaml
# Don't: Excessive detail for simple tasks
task: Create user model
considerations:
  - Use TypeScript for type safety
  - Follow naming conventions from style guide section 3.2
  - Ensure compatibility with ORM version 2.1.5+
  - Consider future extensibility for profile fields
  - ... (10 more considerations)
```

✅ **Right Amount**
```yaml
# Do: Essential information only
task: Create user model with email, password, timestamps
considerations:
  - Hash passwords with bcrypt
  - Add unique index on email
```

### 3. Living Documentation

Specs evolve with your project:

```
# During planning
Create plan for authentication

# During implementation
Add task: Implement password reset
Mark task-001 as completed

# After shipping
Add reference to pln-001: Production metrics dashboard
```

## Spec Type Best Practices

### Business Requirements (BRD)

**Focus on outcomes, not solutions**

❌ **Bad**: "Use JWT tokens for authentication"
✅ **Good**: "Users need secure account access"

**Quantify business value**

❌ **Bad**: "Improves user experience"
✅ **Good**: "Reduces support tickets by 40%, saving $20k annually"

**Write for stakeholders**
```yaml
business_value:
  - type: revenue
    value: "15% increase in conversions = $50k annual revenue"
  # Not: "Better database performance"
```

### Technical Requirements (PRD)

**Be specific about constraints**

❌ **Bad**: "System should be fast"
✅ **Good**: "API response time < 200ms for 95th percentile"

**Document the "why"**
```yaml
technical_context: |
  Current authentication is session-based, causing scalability
  issues with horizontal scaling. Need stateless auth for
  multi-region deployment.
```

**List real dependencies**
```yaml
technical_dependencies:
  - type: url
    name: Auth0 API
    url: https://auth0.com/docs/api
    description: Used for social login integration
```

### Plans

**Keep tasks atomic**

❌ **Too Large**: "Build entire authentication system"
✅ **Good Size**: "Implement JWT token generation"
✅ **Good Size**: "Create login API endpoint"
✅ **Good Size**: "Add password hashing with bcrypt"

**Clear dependencies**
```yaml
tasks:
  - id: task-001
    task: Create database schema

  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]  # ← Explicit
```

**Meaningful scope**
```yaml
scope:
  - type: in-scope
    description: Email/password authentication
    rationale: Core MVP feature

  - type: out-of-scope
    description: OAuth providers
    rationale: Phase 2 after MVP validation
```

### Decisions

**Document alternatives**

❌ **Incomplete**:
```yaml
decision: Use PostgreSQL
```

✅ **Complete**:
```yaml
decision: Use PostgreSQL for primary database

alternatives:
  - MongoDB: Flexible schema but weak transactions
  - MySQL: Mature but limited JSON support

consequences:
  - type: positive
    description: Strong ACID guarantees for financial data
  - type: negative
    description: Schema migrations require more planning
    mitigation: Use migration tool (e.g., Prisma)
```

## Naming Conventions

### Spec IDs

**Use descriptive slugs**

❌ **Bad**: `pln-001-stuff`, `brd-002-thing`
✅ **Good**: `pln-001-user-authentication`, `brd-002-password-reset`

### Task Descriptions

**Action-oriented, specific**

❌ **Bad**: "Database stuff", "Fix the API"
✅ **Good**: "Add unique index on users.email", "Fix 500 error in /api/login"

### Criteria Descriptions

**Testable and measurable**

❌ **Bad**: "System works well"
✅ **Good**: "Page loads in < 2 seconds on 3G connection"

## Linking and References

### Always Link Forward

```yaml
# BRD
title: User Authentication

# PRD references BRD
title: JWT-Based Authentication
description: Technical implementation of brd-001-user-authentication

# Plan references both
criteria:
  requirement: brd-001-user-authentication
  criteria: crit-001
```

### Use References for Context

```yaml
references:
  # Link to designs
  - type: url
    name: Auth UI Mockups
    url: https://figma.com/file/abc123

  # Link to existing code
  - type: file
    name: Current Auth Implementation
    path: src/legacy-auth/README.md

  # Link to decisions
  - type: other
    name: Technology Choice
    description: See dec-001-use-jwt for authentication approach
```

## Task Management

### Priority Guidelines

**Critical**: Blocks all other work
```yaml
- task: Setup database connection
  priority: critical  # Nothing works without this
```

**High**: Important for core functionality
```yaml
- task: Implement login endpoint
  priority: high  # Core feature
```

**Medium**: Standard work (default)
```yaml
- task: Add password strength indicator
  priority: medium
```

**Low**: Nice to have
```yaml
- task: Add remember-me checkbox
  priority: low
```

### Dependency Patterns

**Linear dependencies:**
```yaml
tasks:
  - id: task-001
    task: Create schema
  - id: task-002
    task: Create API
    depends_on: [task-001]
  - id: task-003
    task: Create UI
    depends_on: [task-002]
```

**Parallel work:**
```yaml
tasks:
  - id: task-001
    task: Backend API
  - id: task-002
    task: Frontend UI
    # Independent - work in parallel
```

**Converging dependencies:**
```yaml
tasks:
  - id: task-001
    task: Email service
  - id: task-002
    task: Push notification service
  - id: task-003
    task: Notification UI
    depends_on: [task-001, task-002]  # Needs both
```

## Testing Best Practices

### Write Test Cases Early

**During planning, not after:**

```yaml
test_cases:
  - name: Valid login
    description: User logs in with correct credentials
    steps:
      - Create test user
      - POST /auth/login with valid credentials
      - Verify 200 response with JWT token
    expected_result: JWT token and user data returned
```

### Cover Happy and Error Paths

```yaml
test_cases:
  - name: Valid login (happy path)
    # ...

  - name: Invalid password (error path)
    expected_result: 401 error with message "Invalid credentials"

  - name: Account locked (edge case)
    expected_result: 403 error with message "Account locked"
```

### Update Test Status

```yaml
test_cases:
  - id: test-001
    implemented: true   # ✓ Test code written
    passing: true       # ✓ Test passes
```

## Scope Management

### Define Clear Boundaries

**In-Scope**: What you're building
```yaml
scope:
  - type: in-scope
    description: User login with email/password
  - type: in-scope
    description: Password reset via email
```

**Out-of-Scope**: What you're NOT building
```yaml
scope:
  - type: out-of-scope
    description: Social login (OAuth)
    rationale: Phase 2 after MVP validation
  - type: out-of-scope
    description: Two-factor authentication
    rationale: Security enhancement for future release
```

### Update Scope as Needed

```
# Requirements changed
Update pln-001 scope: Add social login (stakeholder request)

# Add corresponding tasks
Add task to pln-001: Implement OAuth with Google
```

## Traceability

### Maintain Links

**BRD → PRD → Plan flow:**
```
brd-001-notifications (business need)
  ↓
prd-001-notification-system (technical approach)
  ↓
pln-001-implement-notifications (implementation)
  criteria:
    requirement: brd-001-notifications
    criteria: crit-001
```

### Reference in Commits

```bash
git commit -m "feat(auth): implement login endpoint

Implements task-002 from pln-001-user-authentication
Fulfills crit-001 from brd-001-user-authentication

- Added POST /auth/login
- JWT token generation
- Password verification with bcrypt"
```

## Anti-Patterns to Avoid

### 1. Stale Documentation

❌ **Don't**: Create specs and never update them
✅ **Do**: Update as implementation progresses

```
# During implementation
Add note to task-002: Using Redis for session storage instead of JWT
Update prd-001 technical approach: Changed to Redis sessions
```

### 2. Over-Planning

❌ **Don't**: Spec every detail for 6 months
✅ **Do**: Plan 1-2 weeks ahead, adjust as you learn

### 3. Under-Planning

❌ **Don't**: Start coding with no plan
✅ **Do**: At minimum, create a plan with tasks and scope

### 4. Ignoring Dependencies

❌ **Bad**:
```yaml
tasks:
  - task: Build UI
  - task: Build API
  # No dependencies - UI will break!
```

✅ **Good**:
```yaml
tasks:
  - id: task-001
    task: Build API
  - id: task-002
    task: Build UI
    depends_on: [task-001]
```

### 5. Vague Acceptance Criteria

❌ **Bad**: "System works well"
✅ **Good**: "Login responds in < 500ms for 95% of requests"

### 6. Missing Business Context

❌ **Bad**: Jump straight to PRD
✅ **Good**: Start with BRD to capture "why"

## Team Collaboration

### Code Reviews

**Reference specs in PRs:**
```markdown
## Implements
- pln-001-user-authentication
- Tasks: task-001, task-002, task-003

## Acceptance Criteria
- [x] crit-001: Users can log in with email/password
- [x] crit-002: Invalid credentials show clear error
- [ ] crit-003: Account lockout after 5 failed attempts (follow-up)
```

### Standups

**Use specs for status updates:**
```
Yesterday: Completed task-002 (login endpoint)
Today: Working on task-003 (password reset)
Blocked: task-004 waiting on API access (see blocker note)
```

### Sprint Planning

**Query for available work:**
```
Show high-priority pending tasks
What's ready to start in pln-001?
Which tasks have no dependencies?
```

## Maintenance

### Regular Reviews

**Weekly:**
- Update task status
- Resolve completed plans
- Add new tasks discovered

**Monthly:**
- Review decision status
- Update outdated references
- Archive superseded specs

### Cleanup

**Archive completed work:**
```yaml
# Plan completed
status: completed
completed_at: 2025-01-15T16:00:00Z

# Keep for history, not active work
```

**Supersede outdated specs:**
```
Create decision to replace MongoDB with PostgreSQL
  supersedes: dec-001-use-mongodb
```

## Tooling Integration

### Git Hooks

```bash
# Pre-commit: Validate spec format
#!/bin/bash
for file in specs/**/*.yml; do
  npx @spec-mcp/cli validate $file
done
```

### CI/CD

```yaml
# .github/workflows/specs.yml
name: Validate Specs
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npx @spec-mcp/cli validate-all
```

### Editor Integration

Many editors support YAML schema validation. Configure for spec-mcp schemas.

## Metrics and Reporting

### Track Progress

```
# Plan completion
Show completion status for all plans

# Task velocity
How many tasks completed this week?

# Blockers
Show all blocked tasks
```

### Visualize Work

```
# Milestone progress
Show plans in milestone mls-001-v2-launch

# Dependency graph
Show task dependencies for pln-001
```

## Related Guides

- See [Planning Workflow](spec-mcp://guide/planning-workflow) for planning process
- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for execution
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use each type
- See individual spec guides for detailed usage
