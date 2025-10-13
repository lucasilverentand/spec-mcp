export const planGuide = {
	uri: "spec-mcp://guide/plan",
	name: "Plan Guide",
	description: "When and how to use Plans to organize implementation work",
	mimeType: "text/markdown",
	content: `# Plan Guide

**Goal**: Understand when and how to use Plans to organize implementation work.

## What is a Plan?

A Plan breaks down work into concrete tasks, defines test cases, documents flows, and specifies technical contracts.

## When to Use a Plan

✅ **Use a Plan when:**
- Implementing a feature or capability
- Organizing work into tasks with dependencies
- Tracking implementation progress
- Documenting API contracts or data models
- Defining test cases

❌ **Don't use a Plan for:**
- Business requirements (use BRD)
- Technical decisions (use Decision)
- Architecture components (use Component)

## Key Components

### Required
- **Title**: Clear implementation name
- **Description**: What this accomplishes
- **Criteria**: Links to acceptance criteria being fulfilled
- **Scope**: What's included and excluded
- **Tasks**: Work items with dependencies

### Optional
- **Test Cases**: Verification methods
- **Flows**: User/system/data flows
- **API Contracts**: REST/GraphQL/gRPC specs
- **Data Models**: Schemas or data structures
- **References**: Supporting docs

## Common Patterns

### Feature Implementation
\`\`\`yaml
title: Implement User Authentication
description: Add JWT-based authentication with login/logout
criteria:
  requirement: brd-001-auth
  criteria: crit-001
scope:
  in_scope: [Email/password login, JWT generation, Logout endpoint]
  out_of_scope: [OAuth providers, Two-factor auth]
tasks:
  - task: Setup authentication middleware
    priority: high
  - task: Create login endpoint
    depends_on: [task-001]
    priority: high
\`\`\`

### Refactoring
\`\`\`yaml
title: Refactor Database Layer
description: Extract database logic into repository pattern
scope:
  in_scope: [User repository, Post repository]
  out_of_scope: [Migrations, Query optimization]
\`\`\`

### Technical Debt
\`\`\`yaml
title: Remove Deprecated API Endpoints
description: Clean up v1 API endpoints after v2 migration
scope:
  in_scope: [Remove /api/v1/* endpoints, Update documentation]
  out_of_scope: [V2 endpoint improvements]
\`\`\`

## Task Management

### Dependencies
\`\`\`yaml
tasks:
  - id: task-001
    task: Create database schema
    priority: high
    status: completed
  - id: task-002
    task: Implement API endpoints
    depends_on: [task-001]
    priority: high
    status: in-progress
\`\`\`

### Priorities
- **critical**: Blocks everything, do first
- **high**: Important, do early
- **medium**: Standard (default)
- **low**: Can defer
- **nice-to-have**: Optional

### Status
- **pending**: Not started
- **in-progress**: Currently working
- **completed**: Done and tested
- **blocked**: Waiting on dependency

## Test Cases

\`\`\`yaml
test_cases:
  - name: Valid login with correct credentials
    description: User can log in with email and password
    steps:
      - Create test user in database
      - POST to /auth/login with valid credentials
      - Verify 200 response and JWT token
    expected_result: Valid JWT token and user data returned
    implemented: true
    passing: true
\`\`\`

## API Contracts

\`\`\`yaml
api_contracts:
  - name: POST /auth/login
    description: Authenticate user and return JWT
    contract_type: rest
    specification: |
      POST /auth/login
      Request: { "email": "string", "password": "string" }
      Response: { "token": "string", "user": { "id": "string", "email": "string" } }
      Errors: 400 (invalid), 401 (bad credentials)
\`\`\`

## Data Models

\`\`\`yaml
data_models:
  - name: User
    description: User account model
    format: typescript
    schema: |
      interface User {
        id: string;
        email: string;
        password_hash: string;
        created_at: Date;
        updated_at: Date;
      }
\`\`\`

## Best Practices

### Keep Plans Focused
- One plan per feature or logical unit
- Split large plans into smaller ones
- Typical plan: 3-10 tasks

### Define Clear Scope
- Explicitly state what's in/out of scope
- Prevents scope creep
- Helps reviewers understand boundaries

### Link to Requirements
- Always link to BRD/PRD criteria
- Maintains traceability
- Answers "why are we building this?"

### Update as You Go
- Mark tasks complete when finished
- Add notes about challenges/decisions
- Keep test cases current

### Use Milestones
\`\`\`yaml
milestones:
  - mls-001-v2-launch
\`\`\`

## Related Guides

- [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) - When to use Plans vs other types
- [Spec Relationships](spec-mcp://guide/spec-relationships) - How Plans connect to BRDs/PRDs
- [Plan Schema](spec-mcp://schema/plan) - Complete field reference`,
} as const;
