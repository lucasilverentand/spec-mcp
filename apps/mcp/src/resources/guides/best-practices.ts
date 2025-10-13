export const bestPracticesGuide = {
	uri: "spec-mcp://guide/best-practices",
	name: "Best Practices Guide",
	description:
		"Patterns, anti-patterns, and tips for effective spec-driven development",
	mimeType: "text/markdown",
	content: `# Best Practices

**Goal**: Learn patterns, anti-patterns, and tips for effective spec-driven development.

## Core Principles

### 1. Documentation as Code

Treat specs like code:
- Version control everything
- Review changes
- Keep up-to-date
- Refactor when needed

\`\`\`bash
git add specs/plans/pln-001-auth.yml src/auth/
git commit -m "feat: implement authentication (pln-001)"
\`\`\`

### 2. Just Enough Documentation

❌ **Over-Documentation**
\`\`\`yaml
task: Create user model
considerations:
  - Use TypeScript for type safety
  - Follow naming conventions from style guide section 3.2
  - ... (10 more considerations)
\`\`\`

✅ **Right Amount**
\`\`\`yaml
task: Create user model with email, password, timestamps
considerations:
  - Hash passwords with bcrypt
  - Add unique index on email
\`\`\`

### 3. Living Documentation

Specs evolve with your project:
\`\`\`
Create plan for authentication
Add task: Implement password reset
Mark task-001 as completed
Add reference: Production metrics dashboard
\`\`\`

## Spec Type Best Practices

### Business Requirements (BRD)

**Focus on outcomes, not solutions**

❌ Bad: "Use JWT tokens for authentication"
✅ Good: "Users need secure account access"

**Quantify business value**

❌ Bad: "Improves user experience"
✅ Good: "Reduces support tickets by 40%, saving $20k annually"

**Write for stakeholders**
\`\`\`yaml
business_value:
  - type: revenue
    value: "15% increase in conversions = $50k annual revenue"
\`\`\`

### Technical Requirements (PRD)

**Be specific about constraints**

❌ Bad: "System should be fast"
✅ Good: "API response time < 200ms for 95th percentile"

**Document the "why"**
\`\`\`yaml
technical_context: |
  Current session-based auth causes scalability issues
  with horizontal scaling. Need stateless auth for
  multi-region deployment.
\`\`\`

### Plans

**Keep tasks atomic**

❌ Too Large: "Build entire authentication system"
✅ Good Size: "Implement JWT token generation"
✅ Good Size: "Create login API endpoint"
✅ Good Size: "Add password hashing with bcrypt"

**Clear dependencies**
\`\`\`yaml
tasks:
  - id: task-001
    task: Create database schema
  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]
\`\`\`

**Meaningful scope**
\`\`\`yaml
scope:
  - type: in-scope
    description: Email/password authentication
    rationale: Core MVP feature
  - type: out-of-scope
    description: OAuth providers
    rationale: Phase 2 after MVP validation
\`\`\`

### Decisions

**Document alternatives**

❌ Incomplete:
\`\`\`yaml
decision: Use PostgreSQL
\`\`\`

✅ Complete:
\`\`\`yaml
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
\`\`\`

## Naming Conventions

### Spec IDs

❌ Bad: \`pln-001-stuff\`, \`brd-002-thing\`
✅ Good: \`pln-001-user-authentication\`, \`brd-002-password-reset\`

### Task Descriptions

❌ Bad: "Database stuff", "Fix the API"
✅ Good: "Add unique index on users.email", "Fix 500 error in /api/login"

### Criteria Descriptions

❌ Bad: "System works well"
✅ Good: "Page loads in < 2 seconds on 3G connection"

## Linking and References

### Always Link Forward

\`\`\`yaml
# BRD
title: User Authentication

# PRD references BRD
title: JWT-Based Authentication
description: Technical implementation of brd-001-user-authentication

# Plan references both
criteria:
  requirement: brd-001-user-authentication
  criteria: crit-001
\`\`\`

### Use References for Context

\`\`\`yaml
references:
  - type: url
    name: Auth UI Mockups
    url: https://figma.com/file/abc123
  - type: file
    name: Current Auth Implementation
    path: src/legacy-auth/README.md
  - type: other
    name: Technology Choice
    description: See dec-001-use-jwt
\`\`\`

## Task Management

### Priority Guidelines

- **critical**: Blocks all other work
- **high**: Important for core functionality
- **medium**: Standard work (default)
- **low**: Nice to have

### Dependency Patterns

**Linear:**
\`\`\`yaml
tasks:
  - id: task-001
    task: Create schema
  - id: task-002
    task: Create API
    depends_on: [task-001]
  - id: task-003
    task: Create UI
    depends_on: [task-002]
\`\`\`

**Parallel:**
\`\`\`yaml
tasks:
  - id: task-001
    task: Backend API
  - id: task-002
    task: Frontend UI
    # Independent - work in parallel
\`\`\`

**Converging:**
\`\`\`yaml
tasks:
  - id: task-001
    task: Email service
  - id: task-002
    task: Push notification service
  - id: task-003
    task: Notification UI
    depends_on: [task-001, task-002]
\`\`\`

## Testing Best Practices

### Write Test Cases Early

During planning, not after:
\`\`\`yaml
test_cases:
  - name: Valid login
    description: User logs in with correct credentials
    steps:
      - Create test user
      - POST /auth/login with valid credentials
      - Verify 200 response with JWT token
    expected_result: JWT token and user data returned
\`\`\`

### Cover Happy and Error Paths

\`\`\`yaml
test_cases:
  - name: Valid login (happy path)
  - name: Invalid password (error path)
  - name: Account locked (edge case)
\`\`\`

### Update Test Status

\`\`\`yaml
test_cases:
  - id: test-001
    implemented: true
    passing: true
\`\`\`

## Scope Management

### Define Clear Boundaries

**In-Scope**: What you're building
**Out-of-Scope**: What you're NOT building

\`\`\`yaml
scope:
  - type: in-scope
    description: User login with email/password
  - type: out-of-scope
    description: Social login (OAuth)
    rationale: Phase 2 after MVP validation
\`\`\`

## Traceability

### Maintain Links

\`\`\`
brd-001-notifications (business need)
  ↓
prd-001-notification-system (technical approach)
  ↓
pln-001-implement-notifications (implementation)
  criteria:
    requirement: brd-001-notifications
    criteria: crit-001
\`\`\`

### Reference in Commits

\`\`\`bash
git commit -m "feat(auth): implement login endpoint

Implements task-002 from pln-001-user-authentication
Fulfills crit-001 from brd-001-user-authentication

- Added POST /auth/login
- JWT token generation
- Password verification with bcrypt"
\`\`\`

## Anti-Patterns to Avoid

### 1. Stale Documentation

❌ Don't: Create specs and never update
✅ Do: Update as implementation progresses

### 2. Over-Planning

❌ Don't: Spec every detail for 6 months
✅ Do: Plan 1-2 weeks ahead, adjust as you learn

### 3. Under-Planning

❌ Don't: Start coding with no plan
✅ Do: At minimum, create a plan with tasks and scope

### 4. Ignoring Dependencies

❌ Bad:
\`\`\`yaml
tasks:
  - task: Build UI
  - task: Build API
  # No dependencies - UI will break!
\`\`\`

✅ Good:
\`\`\`yaml
tasks:
  - id: task-001
    task: Build API
  - id: task-002
    task: Build UI
    depends_on: [task-001]
\`\`\`

### 5. Vague Acceptance Criteria

❌ Bad: "System works well"
✅ Good: "Login responds in < 500ms for 95% of requests"

### 6. Missing Business Context

❌ Bad: Jump straight to PRD
✅ Good: Start with BRD to capture "why"

## Team Collaboration

### Code Reviews

\`\`\`markdown
## Implements
- pln-001-user-authentication
- Tasks: task-001, task-002, task-003

## Acceptance Criteria
- [x] crit-001: Users can log in with email/password
- [x] crit-002: Invalid credentials show clear error
\`\`\`

### Standups

\`\`\`
Yesterday: Completed task-002 (login endpoint)
Today: Working on task-003 (password reset)
Blocked: task-004 waiting on API access
\`\`\`

### Sprint Planning

\`\`\`
Show high-priority pending tasks
What's ready to start in pln-001?
Which tasks have no dependencies?
\`\`\`

## Maintenance

### Regular Reviews

**Weekly:**
- Update task status
- Resolve completed plans
- Add new discovered tasks

**Monthly:**
- Review decision status
- Update outdated references
- Archive superseded specs

### Cleanup

\`\`\`yaml
# Plan completed
status: completed
completed_at: 2025-01-15T16:00:00Z
\`\`\`

## Tooling Integration

### Git Hooks

\`\`\`bash
# Pre-commit: Validate spec format
#!/bin/bash
for file in specs/**/*.yml; do
  npx @spec-mcp/cli validate $file
done
\`\`\`

### CI/CD

\`\`\`yaml
# .github/workflows/specs.yml
name: Validate Specs
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npx @spec-mcp/cli validate-all
\`\`\`

## Related Guides

- See [Planning Workflow](spec-mcp://guide/planning-workflow) for planning process
- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for execution
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use each type`,
} as const;
