# Plan Guide

**Goal**: Understand when and how to use Plans to organize implementation work.

## What is a Plan?

A Plan is an executable implementation specification that breaks down work into concrete tasks, defines test cases, documents flows, and specifies technical contracts.

## When to Use a Plan

✅ **Use a Plan when:**
- You're ready to implement a feature or capability
- You need to organize work into tasks with dependencies
- You want to track implementation progress
- You need to document API contracts or data models
- You're defining test cases for a feature

❌ **Don't use a Plan for:**
- Capturing business requirements (use BRD instead)
- Documenting technical decisions (use Decision instead)
- Defining architecture components (use Component instead)

## Key Components

### Required Fields
- **Title**: Clear name for what you're implementing
- **Description**: What this plan accomplishes
- **Criteria**: Links to the acceptance criteria this fulfills
- **Scope**: What's included and excluded
- **Tasks**: Concrete work items with dependencies

### Optional But Valuable
- **Test Cases**: How to verify it works
- **Flows**: User/system/data flows
- **API Contracts**: REST/GraphQL/gRPC specifications
- **Data Models**: Database schemas or data structures
- **References**: Supporting documentation

## Common Patterns

### Feature Implementation Plan
```yaml
title: Implement User Authentication
description: Add JWT-based authentication with login/logout
criteria:
  requirement: brd-001-auth
  criteria: crit-001
scope:
  in_scope:
    - Email/password login
    - JWT token generation
    - Logout endpoint
  out_of_scope:
    - OAuth providers
    - Two-factor authentication
tasks:
  - task: Setup authentication middleware
    priority: high
  - task: Create login endpoint
    depends_on: [task-001]
    priority: high
```

### Refactoring Plan
```yaml
title: Refactor Database Layer
description: Extract database logic into repository pattern
scope:
  in_scope:
    - User repository
    - Post repository
  out_of_scope:
    - Migrations
    - Query optimization
```

### Technical Debt Plan
```yaml
title: Remove Deprecated API Endpoints
description: Clean up v1 API endpoints after v2 migration
scope:
  in_scope:
    - Remove /api/v1/* endpoints
    - Update documentation
  out_of_scope:
    - V2 endpoint improvements
```

## Task Management

### Task Dependencies
```yaml
tasks:
  - id: task-001
    task: Create database schema
    priority: high
    status: completed

  - id: task-002
    task: Implement API endpoints
    depends_on: [task-001]  # Can't start until task-001 done
    priority: high
    status: in-progress
```

### Task Priorities
- **critical**: Must be done first, blocks everything
- **high**: Important, should be done early
- **medium**: Standard priority (default)
- **low**: Can be deferred if needed
- **nice-to-have**: Optional enhancement

### Task Status Tracking
- **pending**: Not started yet
- **in-progress**: Currently being worked on
- **completed**: Done and tested
- **blocked**: Waiting on something else

## Test Cases

Document how to verify your implementation:

```yaml
test_cases:
  - name: Valid login with correct credentials
    description: User can log in with email and password
    steps:
      - Create test user in database
      - POST to /auth/login with valid credentials
      - Verify 200 response
      - Verify JWT token in response
    expected_result: Valid JWT token and user data returned
    implemented: true
    passing: true
```

## API Contracts

Define your API interfaces:

```yaml
api_contracts:
  - name: POST /auth/login
    description: Authenticate user and return JWT
    contract_type: rest
    specification: |
      POST /auth/login
      Request: { "email": "string", "password": "string" }
      Response: { "token": "string", "user": { "id": "string", "email": "string" } }
      Errors: 400 (invalid), 401 (bad credentials)
```

## Data Models

Document your schemas:

```yaml
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
```

## Best Practices

### Keep Plans Focused
- One plan per feature or logical unit of work
- Split large plans into multiple smaller ones
- Typical plan has 3-10 tasks

### Define Clear Scope
- Explicitly state what's in and out of scope
- Prevents scope creep
- Helps reviewers understand boundaries

### Link to Requirements
- Always link to the BRD/PRD criteria you're fulfilling
- Maintains traceability
- Helps answer "why are we building this?"

### Update as You Go
- Mark tasks complete as they finish
- Add notes about challenges or decisions
- Keep test cases updated with implementation

### Use Milestones
```yaml
milestones:
  - mls-001-v2-launch
```

Links this plan to a release milestone for tracking.

## Related Guides

- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use Plans vs other types
- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how Plans connect to BRDs/PRDs
- View the [Plan Schema](spec-mcp://schema/plan) for complete field reference
