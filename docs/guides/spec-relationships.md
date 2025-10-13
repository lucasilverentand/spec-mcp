# Spec Relationships Guide

**Goal**: Understand how different spec types connect and reference each other.

## Overview

Specs in spec-mcp form a web of interconnected documentation. Understanding how specs relate helps you navigate the system and maintain consistency.

## Core Relationships

### BRD → PRD → Plan
The most common flow:

```
Business Requirement (BRD)
├─ Defines: What users need and why
├─ Contains: User stories, business value, criteria
│
└─> Technical Requirement (PRD)
    ├─ Defines: How to build it technically
    ├─ Contains: Technical approach, constraints
    │
    └─> Plan (PLN)
        ├─ Defines: Implementation tasks
        └─ Contains: Tasks, test cases, API contracts
```

**Example:**
```yaml
# brd-001-user-auth.yml
title: User Authentication System
user_stories:
  - role: user
    feature: securely log in
    benefit: access my account

# prd-001-jwt-auth.yml
title: JWT-Based Authentication
description: Implement JWT authentication as specified in brd-001-user-auth
technical_context: Need secure, stateless authentication

# pln-001-implement-auth.yml
title: Implement User Authentication
criteria:
  requirement: brd-001-user-auth  # ← Links to BRD
  criteria: crit-001
```

### Decision → Multiple Specs
Decisions can influence any spec type:

```
Decision (DEC)
├─ "Use PostgreSQL for Primary Database"
│
├─> Component (CMP)
│   └─ Database component uses PostgreSQL
│
├─> Technical Requirement (PRD)
│   └─ Technical dependencies reference PostgreSQL
│
└─> Plan (PLN)
    └─ Tasks include PostgreSQL-specific work
```

### Constitution → All Work
Constitutions apply across all specs:

```
Constitution (CST)
├─ "API Design Principles"
│
├─> All Plans
│   └─ API implementations follow principles
│
├─> All Components
│   └─ API services adhere to standards
│
└─> All Decisions
    └─ API decisions respect principles
```

### Component → Plans
Plans reference which components they modify:

```
Component (CMP)
├─ "Web Application"
│
└─> Plans
    ├─ pln-001-add-dashboard (modifies Web Application)
    ├─ pln-002-auth-ui (modifies Web Application)
    └─> pln-003-optimize-bundle (modifies Web Application)
```

### Milestone → Plans
Milestones group related plans:

```
Milestone (MLS)
├─ "v2.0 Launch"
│
└─> Plans
    ├─ pln-001-implement-auth
    ├─ pln-002-new-dashboard
    ├─> pln-003-api-v2
```

## Reference Types

### Via ID References
Direct references using spec IDs:

```yaml
# In a Plan
criteria:
  requirement: brd-001-user-auth  # ← References BRD by ID
  criteria: crit-001

depends_on:
  - pln-001-database-setup  # ← References another Plan

milestones:
  - mls-001-v2-launch  # ← References Milestone
```

### Via References Field
All spec types support a `references` array:

```yaml
references:
  # Reference another spec
  - type: other
    name: Related Decision
    description: See dec-001-use-postgres for database choice

  # Reference external documentation
  - type: url
    name: Design Mockups
    url: https://figma.com/...
    description: UI mockups for this feature

  # Reference code files
  - type: file
    name: Existing Auth Code
    path: src/auth/README.md
    description: Current authentication implementation
```

## Common Relationship Patterns

### Feature Development Chain
```
BRD: User Feature Request
  ↓ (defines business need)
PRD: Technical Specification
  ↓ (defines how to build)
Decision: Technology Choice
  ↓ (chooses approach)
Plan: Implementation Tasks
  ↓ (breaks down work)
Component: Modified Component
  ↓ (where code lives)
Milestone: Target Release
```

**Example: Password Reset Feature**
```
brd-002-password-reset
  ↓
prd-002-email-based-reset
  ↓
dec-002-use-sendgrid
  ↓
pln-002-implement-reset
  ↓
cmp-001-web-app (UI)
cmp-002-api (backend)
  ↓
mls-001-v2-launch
```

### Architecture Documentation
```
Constitution: Architecture Principles
  ↓ (guides)
Decision: Specific Architectural Choices
  ↓ (implements)
Component: System Components
  ↓ (connect to)
Component Dependencies
```

### Refactoring Flow
```
PRD: Technical Debt
  ↓ (motivates)
Decision: Refactoring Approach
  ↓ (chooses strategy)
Plan: Refactoring Tasks
  ↓ (modifies)
Component: Existing Component
```

## Traceability

### Forward Traceability
From business need to implementation:

```
BRD (crit-001)
  ↓ fulfills
Plan (references crit-001)
  ↓ implements
Tasks (task-001, task-002)
  ↓ tested by
Test Cases (test-001, test-002)
```

### Backward Traceability
From code to business justification:

```
Code Change
  ↑ implements
Task (task-001)
  ↑ part of
Plan (pln-001)
  ↑ fulfills
Criteria (crit-001)
  ↑ from
BRD (brd-001)
  ↑ justifies
Business Value
```

## Dependency Management

### Task Dependencies
```yaml
# In a Plan
tasks:
  - id: task-001
    task: Setup database schema
    status: completed

  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]  # ← Can't start until task-001 done
    status: pending
```

### Plan Dependencies
```yaml
# Plan A
title: Setup Infrastructure

# Plan B
title: Deploy Application
depends_on:
  - pln-001-setup-infrastructure  # ← Must complete Plan A first
```

### Component Dependencies
```yaml
# Web App Component
depends_on:
  - cmp-002-api-service    # Needs the API
  - cmp-003-auth-service   # Needs auth
```

## Supersession (Versioning)

When specs evolve, create new versions:

```yaml
# Original
dec-001-use-mongodb
decision_status: superseded  # ← Marked as replaced

# New version
dec-002-use-postgresql
supersedes: dec-001-use-mongodb  # ← References what it replaces
decision_status: accepted
```

This preserves history while documenting evolution.

## Querying Relationships

Use `query_specs` to find related specs:

```typescript
// Find all plans for a BRD's criteria
query_specs({
  objects: ["plan"],
  // Filter by criteria reference
})

// Find all work for a milestone
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch"
})

// Find all plans that depend on another plan
query_specs({
  objects: ["plan"],
  // Filter by depends_on field
})
```

## Best Practices

### Keep References Updated
When specs change, update references:
```yaml
# Old
references:
  - name: Old Design Doc
    url: https://old-link.com

# Updated
references:
  - name: Updated Design Doc
    url: https://new-link.com
    description: Updated after design review
```

### Link Bidirectionally When Helpful
```yaml
# In BRD
references:
  - type: other
    name: Implementation Plan
    description: See pln-001-implement-auth for implementation

# In Plan
criteria:
  requirement: brd-001-user-auth  # ← Links back to BRD
```

### Use Descriptive Reference Names
❌ Bad: "See other spec"
✅ Good: "See dec-001-use-postgres for database choice rationale"

### Document Why References Exist
```yaml
references:
  - type: url
    name: OWASP Auth Guide
    url: https://owasp.org/auth
    description: Following these security best practices for implementation
```

## Related Guides

- See individual spec type guides for specific relationship patterns
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for which specs to create
- Use the `query_specs` tool to explore relationships in your project
