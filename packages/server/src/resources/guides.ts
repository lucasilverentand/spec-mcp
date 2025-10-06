/**
 * Generated file - DO NOT EDIT
 * Run 'pnpm embed-guides' to regenerate
 */

/**
 * Guide resource definitions with embedded content
 */
export const GUIDE_RESOURCES = [
	{
		uri: "spec-mcp://guide/getting-started",
		name: "Getting Started",
		description: "Quick start guide for spec-driven development",
		mimeType: "text/markdown",
		content: `# Getting Started with Spec-Driven Development

## Overview

Spec MCP enables a structured approach to software development where you define **what** to build (requirements), **how** it's structured (components), and **how** to implement it (plans) before writing code.

## Quick Start

### 1. Initialize Your Specs Directory

\`\`\`bash
mkdir -p specs/{requirements,plans,components,constitutions,decisions}
\`\`\`

### 2. Create Your First Requirement

Ask your AI assistant: "Create a requirement for [feature name]"

The guided Q&A flow will:
1. Search for similar specs (avoid duplicates)
2. Review project constitutions (align with principles)
3. Define the requirement (name, description, priority)
4. Establish acceptance criteria (measurable success conditions)

### 3. Create a Plan

Once you have a requirement with criteria, create an implementation plan:

"Create a plan for requirement req-001-[slug] criterion crit-001"

Plans break down work into:
- **Tasks**: Executable steps with file changes
- **Test Cases**: Validation scenarios
- **Flows**: User/system interactions
- **API Contracts**: Endpoint specifications
- **Data Models**: Schema definitions

### 4. Find What to Work On

\`\`\`
query({ next_task: true })
\`\`\`

This returns the highest priority unblocked task across all plans.

### 5. Implement and Track Progress

As you complete tasks, update the plan:

\`\`\`
update_spec({
  id: "pln-001-implementation",
  updates: {
    tasks: [{ id: "task-001", completed: true, verified: true }]
  }
})
\`\`\`

## Workflow Summary

1. **Plan**: Create requirements with acceptance criteria
2. **Design**: Create components to model your architecture
3. **Implement**: Create plans linked to requirement criteria
4. **Execute**: Work on tasks, mark them complete
5. **Validate**: Run validation to check system health

## Key Concepts

### Spec Types

- **Requirement**: What needs to be built (problem-focused, implementation-agnostic)
- **Component**: System architecture (apps, services, libraries)
- **Plan**: Implementation roadmap (tasks, test cases, flows, APIs, data models)
- **Constitution**: Project principles and guidelines
- **Decision**: Architectural decisions with rationale

### Linking Specs

- Plans link to requirements via \`criteria_id\` (format: \`req-XXX-slug/crit-XXX\`)
- Plans depend on other plans via \`depends_on\` (format: \`["pln-XXX-slug"]\`)
- Components reference each other via \`depends_on\`

### Priority Levels

**Requirements**: \`critical\` | \`required\` | \`ideal\` | \`optional\`
**Plans**: \`critical\` | \`high\` | \`medium\` | \`low\`

## Next Steps

- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for detailed feature planning
- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development process
- Read [Best Practices](spec-mcp://guide/best-practices) for common patterns
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced querying
`,
	},
	{
		uri: "spec-mcp://guide/planning-workflow",
		name: "Planning Workflow",
		description: "Complete workflow for planning features with specs",
		mimeType: "text/markdown",
		content: `# Planning Workflow

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

The \`criteria_id\` field creates traceability:
\`\`\`yaml
criteria_id: "req-001-user-authentication/crit-001"
\`\`\`

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
\`\`\`yaml
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
\`\`\`

**Task Guidelines**:
- Include effort estimates
- Specify file changes
- List dependencies
- Note implementation considerations

#### 3.4 Establish Dependencies

**Between Plans**:
\`\`\`yaml
depends_on:
  - "pln-001-database-setup"
  - "pln-002-auth-library"
\`\`\`

**Between Tasks** (within a plan):
\`\`\`yaml
tasks:
  - id: task-001
    description: "Create User model"
    depends_on: []

  - id: task-002
    description: "Create AuthService using User model"
    depends_on: ["task-001"]
\`\`\`

### Phase 4: Validate and Review

#### 4.1 Check Coverage

Find uncovered requirements:
\`\`\`
query({
  types: ["requirement"],
  filters: { uncovered: true }
})
\`\`\`

#### 4.2 Validate System Health

\`\`\`
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
\`\`\`

This checks:
- **References**: No broken links between specs
- **Cycles**: No circular dependencies
- **Health**: Overall system score (0-100)

## Planning Anti-Patterns

### ❌ Avoid These Mistakes

1. **Creating plans without requirements**
   - Plans should trace to requirements via \`criteria_id\`
   - Exception: Orchestration/milestone plans

2. **Vague acceptance criteria**
   - "User authentication works" → Not measurable
   - Use specific, testable conditions

3. **Missing dependencies**
   - Leads to blocked work
   - Always specify \`depends_on\` for plans and tasks

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
3. **Link Everything**: Use \`criteria_id\` and \`depends_on\`
4. **Validate Often**: Run \`validate()\` regularly
5. **Check Coverage**: Ensure all criteria have plans
6. **Use Constitutions**: Define project principles early

## Example: Complete Planning Flow

\`\`\`
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
\`\`\`

## Next Steps

- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development process
- Read [Best Practices](spec-mcp://guide/best-practices) for patterns and tips
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced searching
`,
	},
	{
		uri: "spec-mcp://guide/implementation-workflow",
		name: "Implementation Workflow",
		description: "Development workflow for implementing from specs",
		mimeType: "text/markdown",
		content: `# Implementation Workflow

## Overview

The implementation workflow describes how to execute work defined in specs and track progress.

## Step-by-Step Process

### Phase 1: Find What to Work On

#### 1.1 Get Next Recommended Task

\`\`\`
query({ next_task: true })
\`\`\`

This returns the highest priority unblocked task across all plans, considering:
- Task priority (critical > high > medium > low)
- Plan priority
- Dependencies (only returns unblocked tasks)
- Completion status

**Response**:
\`\`\`json
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
\`\`\`

#### 1.2 Get Full Plan Context

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  mode: "full",
  expand: {
    dependencies: true,
    dependency_metrics: true
  }
})
\`\`\`

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
\`\`\`yaml
files:
  - path: "src/models/User.ts"
    change_type: create
    reason: "User entity with validation"

  - path: "src/config/database.ts"
    change_type: modify
    reason: "Add User model to exports"
\`\`\`

**Change Types**:
- \`create\`: New file
- \`modify\`: Update existing file
- \`delete\`: Remove file

#### 2.3 Apply Implementation Considerations

Tasks often include important notes:
\`\`\`yaml
considerations:
  - "Use bcrypt for password hashing (min 10 rounds)"
  - "Add unique constraint on email field"
  - "Validate email format before saving"
\`\`\`

### Phase 3: Test Your Changes

#### 3.1 Run Test Cases

If the plan defines test cases, verify them:
\`\`\`yaml
test_cases:
  - id: tc-001
    type: unit
    description: "User model validates email format"

  - id: tc-002
    type: integration
    description: "User can be created and retrieved from database"
\`\`\`

#### 3.2 Verify Acceptance Criteria

Check the plan's acceptance criteria:
\`\`\`yaml
acceptance_criteria: "User model is created with email/password validation, passwords are hashed, and all tests pass"
\`\`\`

### Phase 4: Track Progress

#### 4.1 Mark Task Complete

When task is done and tested:
\`\`\`
update_spec({
  id: "pln-001-auth-impl",
  updates: {
    tasks: [
      { id: "task-001", completed: true, verified: true }
    ]
  }
})
\`\`\`

**Fields**:
- \`completed\`: Work is done
- \`verified\`: Testing/review completed

#### 4.2 Update Test Case Status

\`\`\`
update_spec({
  id: "pln-001-auth-impl",
  updates: {
    test_cases: [
      { id: "tc-001", status: "passed", notes: "All validations working" }
    ]
  }
})
\`\`\`

#### 4.3 Mark Plan Complete

When all tasks are done:
\`\`\`
update_spec({
  id: "pln-001-auth-impl",
  updates: {
    completed: true,
    approved: true
  }
})
\`\`\`

### Phase 5: Validate and Continue

#### 5.1 Check System Health

\`\`\`
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
\`\`\`

Fix any broken references or circular dependencies.

#### 5.2 Get Next Task

\`\`\`
query({ next_task: true })
\`\`\`

Continue the cycle!

## Working with Dependencies

### Task Dependencies

Tasks can depend on other tasks within the same plan:
\`\`\`yaml
tasks:
  - id: task-001
    description: "Setup database schema"
    depends_on: []

  - id: task-002
    description: "Create User model"
    depends_on: ["task-001"]  # Blocked until task-001 is complete
\`\`\`

**Rule**: You cannot mark a task complete if it depends on incomplete tasks.

### Plan Dependencies

Plans can depend on other plans:
\`\`\`yaml
depends_on:
  - "pln-001-database-setup"
  - "pln-002-auth-library"
\`\`\`

**Best Practice**: Complete dependency plans before starting dependent work.

## Tracking Progress

### View Plan Progress

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  mode: "summary"
})
\`\`\`

Shows completion percentage and status.

### Find Blocked Work

\`\`\`
query({
  types: ["plan"],
  filters: {
    plan_completed: false
  },
  sort_by: [
    { field: "priority", order: "desc" }
  ]
})
\`\`\`

### Find Incomplete Requirements

\`\`\`
query({
  types: ["requirement"],
  filters: {
    requirement_completed: false
  }
})
\`\`\`

A requirement is complete when all its criteria have completed, approved plans.

## Implementation Anti-Patterns

### ❌ Avoid These Mistakes

1. **Skipping task verification**
   - Mark tasks as \`verified: true\` only after testing
   - Unverified tasks may have bugs

2. **Completing tasks out of order**
   - Respect \`depends_on\` relationships
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

1. **Use \`next_task\`**: Let the system guide you
2. **Update frequently**: Mark tasks complete as you finish
3. **Test thoroughly**: Verify before marking tasks verified
4. **Check dependencies**: Review dependency graph before starting
5. **Validate often**: Run validation to catch issues early
6. **Document as you go**: Add notes to tasks for future reference

## Example: Complete Implementation Flow

\`\`\`
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
\`\`\`

## Working with Flows

Plans may define flows to guide implementation:

### User Flows
Step-by-step user interactions:
\`\`\`yaml
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
\`\`\`

### System Flows
Technical process flows:
\`\`\`yaml
flows:
  - id: flow-002
    type: system
    name: "Password Hashing"
    steps:
      - "Receive plain password from input"
      - "Generate salt (bcrypt, 10 rounds)"
      - "Hash password with salt"
      - "Store hashed password in database"
\`\`\`

Use flows to understand the complete picture before implementing tasks.

## Next Steps

- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for creating better specs
- Read [Best Practices](spec-mcp://guide/best-practices) for patterns and tips
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced querying
`,
	},
	{
		uri: "spec-mcp://guide/best-practices",
		name: "Best Practices",
		description: "Patterns, anti-patterns, and tips for spec-driven development",
		mimeType: "text/markdown",
		content: `# Best Practices

## Overview

Proven patterns and anti-patterns for effective spec-driven development.

## Requirements

### ✅ Do This

**Write Implementation-Agnostic Requirements**
\`\`\`yaml
# Good
description: "Users need to securely authenticate to access their data"

# Bad
description: "Implement JWT-based authentication using OAuth2"
\`\`\`
Requirements focus on **what** and **why**, not **how**.

**Use Measurable Acceptance Criteria**
\`\`\`yaml
# Good
criteria:
  - id: crit-001
    description: "User can complete registration in under 30 seconds with valid email/password"

# Bad
criteria:
  - id: crit-001
    description: "Registration should be fast and easy"
\`\`\`

**One Requirement Per Feature**
\`\`\`yaml
# Good: Focused requirement
name: "User Authentication"
description: "Users need secure authentication to access the system"

# Bad: Multiple unrelated features
name: "User Management"
description: "Authentication, profiles, settings, preferences"
\`\`\`

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
\`\`\`yaml
criteria_id: "req-001-user-auth/crit-001"
\`\`\`
One plan per criterion enables parallel work and clear traceability.

**Break Down Tasks Granularly**
\`\`\`yaml
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
\`\`\`

**Include Effort Estimates**
\`\`\`yaml
description: "Create User model with validation - 2 hours"
\`\`\`
Helps with planning and tracking velocity.

**Specify File Changes**
\`\`\`yaml
files:
  - path: "src/models/User.ts"
    change_type: create
    reason: "User entity with email/password validation"
\`\`\`

**Document Implementation Considerations**
\`\`\`yaml
considerations:
  - "Use bcrypt with minimum 10 rounds"
  - "Add unique constraint on email field"
  - "Validate email format with regex"
\`\`\`

**Use Optional Fields Wisely**
- **Add flows**: When user interactions or system processes need documentation
- **Add test cases**: When specific test scenarios need detailed documentation
- **Add API contracts**: When creating or consuming APIs
- **Add data models**: When defining database schemas
- **Skip when**: Simple backend tasks, internal refactoring, or well-defined small plans

### ❌ Avoid This

- Plans without \`criteria_id\` (except orchestration/milestone plans)
- Vague tasks without file changes or estimates
- Missing \`depends_on\` relationships
- Adding unnecessary optional fields (flows, APIs, etc.)
- Overly detailed plans that constrain implementation

## Components

### ✅ Do This

**Use Component Types Appropriately**
- **app**: User-facing applications (web, mobile)
- **service**: Backend services, microservices, APIs
- **library**: Shared code, packages, utilities

**Define Clear Capabilities**
\`\`\`yaml
capabilities:
  - "User authentication (JWT tokens)"
  - "Password hashing and validation"
  - "Session management"
\`\`\`

**Document Technical Constraints**
\`\`\`yaml
constraints:
  - "Must support 10,000 concurrent users"
  - "Session tokens expire after 24 hours"
  - "Rate limiting: 100 requests/minute per user"
\`\`\`

**Specify Dependencies**
\`\`\`yaml
depends_on:
  - "lib-001-database"
  - "lib-002-validation"
\`\`\`

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
\`\`\`yaml
# Good
principle: "Prefer libraries over services when functionality can be shared as code"

# Bad
principle: "Write good code and use best practices"
\`\`\`

**Include Concrete Examples**
\`\`\`yaml
examples:
  - "Use @company/auth-lib for shared authentication logic"
  - "Use @company/validation-lib for common validation rules"
\`\`\`

**Document Exceptions**
\`\`\`yaml
exceptions:
  - "When service needs independent deployment lifecycle"
  - "When functionality requires separate scaling"
\`\`\`

**Use Article Status**
- \`needs-review\`: Draft, not yet approved
- \`active\`: Approved and in effect
- \`archived\`: No longer applicable

### ❌ Avoid This

- Too many articles initially (start with 3-7 core principles)
- Vague or obvious principles
- No examples (makes principles hard to apply)
- Never updating articles as project evolves

## Querying

### ✅ Do This

**Use \`next_task\` for Discovery**
\`\`\`
query({ next_task: true })
\`\`\`
Gets highest priority unblocked task automatically.

**Expand Dependencies When Needed**
\`\`\`
query({
  entity_id: "pln-001-auth",
  expand: {
    dependencies: true,
    dependency_metrics: true,
    depth: 2
  }
})
\`\`\`

**Filter for Uncovered Work**
\`\`\`
query({
  types: ["requirement"],
  filters: { uncovered: true }
})
\`\`\`

**Use Facets for Overview**
\`\`\`
query({
  types: ["plan"],
  include_facets: true,
  facet_fields: ["priority", "status"]
})
\`\`\`

**Sort Meaningfully**
\`\`\`
query({
  types: ["plan"],
  filters: { plan_completed: false },
  sort_by: [
    { field: "priority", order: "desc" },
    { field: "created_at", order: "asc" }
  ]
})
\`\`\`

### ❌ Avoid This

- Manually tracking next tasks (use \`next_task\`)
- Not using filters to find gaps (uncovered, orphaned)
- Ignoring dependency metrics (fan-in, fan-out, coupling)

## Validation

### ✅ Do This

**Validate Regularly**
\`\`\`
validate({
  check_references: true,
  check_cycles: true,
  include_health: true
})
\`\`\`

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
\`\`\`
update_spec({
  id: "pln-001-auth",
  updates: {
    tasks: [
      { id: "task-001", completed: true, verified: true }
    ]
  }
})
\`\`\`

**Mark Verified After Testing**
- \`completed: true\` → Work done
- \`verified: true\` → Tested and reviewed

**Complete Plans When Done**
\`\`\`
update_spec({
  id: "pln-001-auth",
  updates: {
    completed: true,
    approved: true
  }
})
\`\`\`

### ❌ Avoid This

- Batch updates at end of day (lose progress visibility)
- Marking tasks verified without testing
- Completing plans with unfinished tasks

## Common Patterns

### Pattern: Feature Development

\`\`\`
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
\`\`\`

### Pattern: Multi-Team Work

\`\`\`
1. Create requirement with clear criteria
2. Create plans for each criterion
3. Assign plans to teams via priority/dependencies
4. Teams work independently on their plans
5. Use \`depends_on\` to coordinate between plans
6. Validate regularly to catch integration issues
\`\`\`

### Pattern: Technical Debt

\`\`\`
1. Create requirement for improvement
   → priority: "ideal" or "optional"

2. Create plan with refactoring tasks
   → Link to affected components

3. Track in backlog
   → query({ types: ["plan"], filters: { plan_completed: false, plan_priority: ["low"] } })
\`\`\`

## Common Anti-Patterns

### ❌ Big Bang Planning

Creating all specs upfront leads to:
- Stale specs (requirements change)
- Over-specification (too much detail)
- Analysis paralysis

**Instead**: Create just-in-time, iteratively.

### ❌ Implementation Details in Requirements

\`\`\`yaml
# Bad
requirement:
  description: "Implement JWT authentication with bcrypt password hashing"

# Good
requirement:
  description: "Users need secure authentication to access their data"
  criteria:
    - "Passwords are securely stored and cannot be recovered in plain text"
\`\`\`

**Instead**: Keep requirements implementation-agnostic.

### ❌ Orphaned Specs

Specs with no references or dependencies become stale.

**Instead**:
- Link plans to requirements via \`criteria_id\`
- Use \`depends_on\` for relationships
- Run \`query({ filters: { orphaned: true } })\` regularly

### ❌ Circular Dependencies

\`\`\`yaml
# pln-001
depends_on: ["pln-002"]

# pln-002
depends_on: ["pln-001"]  # Circular!
\`\`\`

**Instead**: Run \`validate({ check_cycles: true })\` regularly.

### ❌ Skipping Validation

Not validating leads to:
- Broken references
- Circular dependencies
- Spec drift

**Instead**: Validate frequently, fix issues immediately.

## Tips and Tricks

### Quick Reference

**Find Next Work**: \`query({ next_task: true })\`
**Find Gaps**: \`query({ types: ["requirement"], filters: { uncovered: true } })\`
**Health Check**: \`validate({ check_references: true, check_cycles: true, include_health: true })\`
**Progress Summary**: \`query({ types: ["plan"], include_facets: true, facet_fields: ["status", "priority"] })\`

### Keyboard Shortcuts (Conceptual)

Think of these as mental shortcuts:
- "What's next?" → \`next_task\`
- "What's broken?" → \`validate\`
- "What's missing?" → \`uncovered\` filter
- "What's blocked?" → Check \`depends_on\` + completion status

### Integration with Development

1. **Before coding**: \`query({ next_task: true })\`
2. **During coding**: Reference task file changes and considerations
3. **After coding**: Update task completion status
4. **Before commit**: Run validation
5. **Daily standup**: Review plan progress

## Next Steps

- Read [Getting Started](spec-mcp://guide/getting-started) for quick setup
- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for detailed planning
- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced queries
`,
	},
	{
		uri: "spec-mcp://guide/query-guide",
		name: "Query Guide",
		description: "Complete guide for querying and analyzing specs",
		mimeType: "text/markdown",
		content: `# Query Guide

## Overview

The \`query\` tool is a powerful unified interface for searching, filtering, and analyzing specs. This guide covers all query capabilities.

## Basic Queries

### Get Spec by ID

\`\`\`
query({
  entity_id: "req-001-user-auth"
})
\`\`\`

**Response**: Full spec details.

### Get Multiple Specs by IDs

\`\`\`
query({
  entity_ids: ["req-001-user-auth", "req-002-data-storage"]
})
\`\`\`

**Response**: Array of specs.

### Get Sub-Entity (Task, Test Case, Flow, etc.)

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  sub_entity_id: "task-001"
})
\`\`\`

**Sub-entity IDs**:
- \`task-XXX\` - Tasks
- \`tc-XXX\` - Test cases
- \`flow-XXX\` - Flows
- \`api-XXX\` - API contracts
- \`dm-XXX\` - Data models
- \`crit-XXX\` - Acceptance criteria

## Search Queries

### Full-Text Search

\`\`\`
query({
  search_terms: "authentication security",
  types: ["requirement", "plan"]
})
\`\`\`

**Search fields** (default): \`name\`, \`description\`

**Customize search fields**:
\`\`\`
query({
  search_terms: "oauth",
  search_fields: ["name", "description"]
})
\`\`\`

### Fuzzy Search

\`\`\`
query({
  search_terms: "authetication",  // Typo
  fuzzy: true
})
\`\`\`

Uses Levenshtein distance to find close matches.

### Search with Sorting

\`\`\`
query({
  search_terms: "user",
  sort_by: [
    { field: "relevance", order: "desc" },  // Best matches first
    { field: "created_at", order: "desc" }
  ]
})
\`\`\`

**Sort fields**:
- \`relevance\` - Search score (only for searches)
- \`created_at\` - Creation date
- \`updated_at\` - Last update
- \`priority\` - Priority level
- \`name\` - Alphabetical
- \`type\` - Spec type

## Filtering

### By Type

\`\`\`
query({
  types: ["requirement", "plan"]
})
\`\`\`

**Available types**: \`requirement\`, \`plan\`, \`app\`, \`service\`, \`library\`, \`constitution\`, \`decision\`

### By Priority

**Requirements**:
\`\`\`
query({
  types: ["requirement"],
  filters: {
    requirement_priority: ["critical", "required"]
  }
})
\`\`\`

**Plans**:
\`\`\`
query({
  types: ["plan"],
  filters: {
    plan_priority: ["critical", "high"]
  }
})
\`\`\`

### By Completion Status

**Incomplete plans**:
\`\`\`
query({
  types: ["plan"],
  filters: {
    plan_completed: false
  }
})
\`\`\`

**Completed and approved plans**:
\`\`\`
query({
  types: ["plan"],
  filters: {
    plan_completed: true,
    plan_approved: true
  }
})
\`\`\`

**Incomplete requirements**:
\`\`\`
query({
  types: ["requirement"],
  filters: {
    requirement_completed: false
  }
})
\`\`\`

### By Date Range

**Created after date**:
\`\`\`
query({
  filters: {
    created_after: "2025-01-01T00:00:00Z"
  }
})
\`\`\`

**Updated in date range**:
\`\`\`
query({
  filters: {
    updated_after: "2025-01-01T00:00:00Z",
    updated_before: "2025-01-31T23:59:59Z"
  }
})
\`\`\`

### By Folder

\`\`\`
query({
  filters: {
    folder: "authentication"
  }
})
\`\`\`

Matches folder and all subfolders hierarchically.

### By Criteria ID

**Plans for specific criterion**:
\`\`\`
query({
  types: ["plan"],
  filters: {
    criteria_id: "req-001-user-auth/crit-001"
  }
})
\`\`\`

**Plans linked to any requirement criteria**:
\`\`\`
query({
  types: ["plan"],
  filters: {
    has_criteria_id: true
  }
})
\`\`\`

### Find Gaps: Uncovered and Orphaned

**Uncovered requirements** (no plans):
\`\`\`
query({
  types: ["requirement"],
  filters: {
    uncovered: true
  }
})
\`\`\`

**Orphaned specs** (no references):
\`\`\`
query({
  filters: {
    orphaned: true
  }
})
\`\`\`

## Output Modes

### Summary Mode (Default)

\`\`\`
query({
  entity_id: "req-001-user-auth",
  mode: "summary"
})
\`\`\`

**Returns**: id, type, name, description, priority, status, dates

### Full Mode

\`\`\`
query({
  entity_id: "req-001-user-auth",
  mode: "full"
})
\`\`\`

**Returns**: All fields including tasks, flows, test cases, etc.

### Custom Mode

\`\`\`
query({
  entity_id: "req-001-user-auth",
  mode: "custom",
  include_fields: ["id", "name", "criteria", "priority"]
})
\`\`\`

**Or exclude fields**:
\`\`\`
query({
  entity_id: "req-001-user-auth",
  mode: "custom",
  exclude_fields: ["created_at", "updated_at"]
})
\`\`\`

## Pagination

### Offset and Limit

\`\`\`
query({
  types: ["plan"],
  limit: 20,
  offset: 40  // Skip first 40, get next 20
})
\`\`\`

**Response includes pagination metadata**:
\`\`\`json
{
  "results": [...],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
\`\`\`

### Return All Results

\`\`\`
query({
  types: ["requirement"],
  return_all: true
})
\`\`\`

**Warning**: Use cautiously for large datasets.

## Facets

### Get Facet Counts

\`\`\`
query({
  types: ["plan"],
  include_facets: true,
  facet_fields: ["priority", "status"]
})
\`\`\`

**Response**:
\`\`\`json
{
  "results": [...],
  "facets": {
    "priority": {
      "critical": 5,
      "high": 12,
      "medium": 23,
      "low": 8
    },
    "status": {
      "completed": 15,
      "in_progress": 18,
      "pending": 15
    }
  }
}
\`\`\`

**Available facet fields**: \`type\`, \`priority\`, \`status\`, \`folder\`

## Dependency Expansion

### Include Dependencies

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    dependencies: true
  }
})
\`\`\`

**Returns**: Full dependency specs inline.

### Include Dependency Metrics

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    dependency_metrics: true
  }
})
\`\`\`

**Metrics**:
- **fan_in**: How many specs depend on this
- **fan_out**: How many specs this depends on
- **coupling**: Total dependencies (fan_in + fan_out)
- **stability**: Resistance to change (fan_in / coupling)

### Multi-Level Expansion

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    dependencies: true,
    dependency_metrics: true,
    depth: 2  // Expand 2 levels deep
  }
})
\`\`\`

**Depth options**: 1-3 (default: 1)

### Include References

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    references: true
  }
})
\`\`\`

**Returns**: Specs that reference this spec.

### Include Parent

\`\`\`
query({
  entity_id: "pln-001-auth-impl",
  sub_entity_id: "task-001",
  expand: {
    parent: true
  }
})
\`\`\`

**Returns**: Parent plan for the task.

## Next Task Detection

### Get Next Recommended Task

\`\`\`
query({
  next_task: true
})
\`\`\`

**Returns**: Highest priority unblocked task across all plans.

**Algorithm**:
1. Filter to incomplete, unverified tasks
2. Check task dependencies (must be unblocked)
3. Check plan dependencies (plan must be unblocked)
4. Sort by: task priority > plan priority > creation date
5. Return first task

**Response**:
\`\`\`json
{
  "task": {
    "id": "task-001",
    "priority": "high",
    "description": "Create User model - 2 hours",
    "completed": false,
    "verified": false,
    "depends_on": [],
    "files": [...]
  },
  "plan": {
    "id": "pln-001-auth-impl",
    "name": "Authentication Implementation",
    "priority": "critical",
    "criteria_id": "req-001-user-auth/crit-001"
  },
  "requirement": {
    "id": "req-001-user-auth",
    "name": "User Authentication",
    "priority": "critical"
  }
}
\`\`\`

## Multi-Field Sorting

### Sort by Multiple Fields

\`\`\`
query({
  types: ["plan"],
  filters: { plan_completed: false },
  sort_by: [
    { field: "priority", order: "desc" },    // Highest priority first
    { field: "created_at", order: "asc" }    // Then oldest first
  ]
})
\`\`\`

**Default sorting**:
- Search queries: \`relevance desc\`
- List queries: \`created_at desc\`

## Advanced Query Examples

### Find High-Priority Incomplete Work

\`\`\`
query({
  types: ["plan"],
  filters: {
    plan_priority: ["critical", "high"],
    plan_completed: false
  },
  sort_by: [
    { field: "priority", order: "desc" }
  ],
  mode: "summary"
})
\`\`\`

### Find Recent Changes

\`\`\`
query({
  filters: {
    updated_after: "2025-01-15T00:00:00Z"
  },
  sort_by: [
    { field: "updated_at", order: "desc" }
  ],
  limit: 10
})
\`\`\`

### Find Orphaned High-Priority Items

\`\`\`
query({
  filters: {
    orphaned: true,
    requirement_priority: ["critical", "required"]
  }
})
\`\`\`

### Deep Dependency Analysis

\`\`\`
query({
  entity_id: "req-001-user-auth",
  mode: "full",
  expand: {
    dependencies: true,
    dependency_metrics: true,
    references: true,
    depth: 3
  }
})
\`\`\`

### Search with Filters and Facets

\`\`\`
query({
  search_terms: "authentication",
  types: ["requirement", "plan"],
  filters: {
    plan_priority: ["critical", "high"],
    created_after: "2025-01-01T00:00:00Z"
  },
  include_facets: true,
  facet_fields: ["type", "priority"],
  sort_by: [
    { field: "relevance", order: "desc" },
    { field: "priority", order: "desc" }
  ],
  limit: 20
})
\`\`\`

### Find Work by Component Type

\`\`\`
query({
  types: ["service", "library"],
  filters: {
    component_type: ["service"]
  }
})
\`\`\`

### Find Active Constitutions

\`\`\`
query({
  types: ["constitution"],
  filters: {
    constitution_status: ["active"]
  }
})
\`\`\`

## Query Performance Tips

### Use Specific Filters

\`\`\`
# Faster
query({
  types: ["plan"],
  filters: { plan_priority: ["critical"] },
  limit: 10
})

# Slower
query({
  return_all: true
})
\`\`\`

### Limit Expansion Depth

\`\`\`
# Faster
expand: { dependencies: true, depth: 1 }

# Slower
expand: { dependencies: true, depth: 3 }
\`\`\`

### Use Summary Mode When Possible

\`\`\`
# Faster
mode: "summary"

# Slower
mode: "full"
\`\`\`

### Use Pagination

\`\`\`
# Better for large datasets
limit: 50,
offset: 0

# Avoid for large datasets
return_all: true
\`\`\`

## Common Query Patterns

### Daily Workflow

**Morning**: What should I work on?
\`\`\`
query({ next_task: true })
\`\`\`

**Mid-day**: How's my progress?
\`\`\`
query({
  types: ["plan"],
  filters: { plan_completed: false },
  include_facets: true,
  facet_fields: ["priority", "status"]
})
\`\`\`

**Evening**: What did I complete?
\`\`\`
query({
  types: ["plan"],
  filters: {
    updated_after: "2025-01-20T00:00:00Z",
    plan_completed: true
  },
  sort_by: [{ field: "updated_at", order: "desc" }]
})
\`\`\`

### Sprint Planning

**What's in the backlog?**
\`\`\`
query({
  types: ["requirement"],
  filters: { requirement_completed: false },
  sort_by: [{ field: "priority", order: "desc" }]
})
\`\`\`

**What's uncovered?**
\`\`\`
query({
  types: ["requirement"],
  filters: { uncovered: true }
})
\`\`\`

**What's the team velocity?**
\`\`\`
query({
  types: ["plan"],
  filters: {
    plan_completed: true,
    completed_after: "2025-01-01T00:00:00Z"
  },
  include_facets: true,
  facet_fields: ["priority"]
})
\`\`\`

### Code Review

**What changed recently?**
\`\`\`
query({
  filters: {
    updated_after: "2025-01-19T00:00:00Z"
  },
  sort_by: [{ field: "updated_at", order: "desc" }]
})
\`\`\`

**What's been completed but not approved?**
\`\`\`
query({
  types: ["plan"],
  filters: {
    plan_completed: true,
    plan_approved: false
  }
})
\`\`\`

## Next Steps

- Read [Getting Started](spec-mcp://guide/getting-started) for quick setup
- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for creating specs
- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development
- Read [Best Practices](spec-mcp://guide/best-practices) for patterns and tips
`,
	}
] as const;
