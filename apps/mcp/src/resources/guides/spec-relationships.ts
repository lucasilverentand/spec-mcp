export const specRelationshipsGuide = {
	uri: "spec-mcp://guide/spec-relationships",
	name: "Spec Relationships Guide",
	description: "How different spec types connect and reference each other",
	mimeType: "text/markdown",
	content: `# Spec Relationships

**Goal**: Understand how spec types connect and reference each other.

## Core Relationships

### BRD → PRD → Plan
The most common flow:

\`\`\`
Business Requirement (BRD)
├─ Defines: What users need and why
└─> Technical Requirement (PRD)
    ├─ Defines: How to build it
    └─> Plan (PLN)
        └─ Defines: Implementation tasks
\`\`\`

**Example:**
\`\`\`yaml
# brd-001-user-auth.yml
title: User Authentication System
user_stories:
  - role: user
    feature: securely log in
    benefit: access my account

# prd-001-jwt-auth.yml
title: JWT-Based Authentication
technical_context: Need secure, stateless authentication

# pln-001-implement-auth.yml
criteria:
  requirement: brd-001-user-auth
  criteria: crit-001
\`\`\`

### Decision → Multiple Specs
Decisions influence any spec type:

\`\`\`
Decision: "Use PostgreSQL"
├─> Component (database uses PostgreSQL)
├─> PRD (technical dependencies reference PostgreSQL)
└─> Plan (tasks include PostgreSQL-specific work)
\`\`\`

### Constitution → All Work
Constitutions apply across all specs, establishing principles that guide all work.

### Component → Plans
Plans reference which components they modify.

### Milestone → Plans
Milestones group related plans for releases.

## Reference Types

### Via ID References
\`\`\`yaml
# In a Plan
criteria:
  requirement: brd-001-user-auth  # Links to BRD
  criteria: crit-001

depends_on:
  - pln-001-database-setup  # Links to another Plan

milestones:
  - mls-001-v2-launch  # Links to Milestone
\`\`\`

### Via References Field
\`\`\`yaml
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
\`\`\`

## Common Relationship Patterns

### Feature Development Chain
\`\`\`
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
\`\`\`

### Architecture Documentation
\`\`\`
Constitution: Architecture Principles
  ↓ (guides)
Decision: Specific Choices
  ↓ (implements)
Component: System Components
  ↓ (connect to)
Component Dependencies
\`\`\`

### Refactoring Flow
\`\`\`
PRD: Technical Debt
  ↓ (motivates)
Decision: Refactoring Approach
  ↓ (chooses strategy)
Plan: Refactoring Tasks
  ↓ (modifies)
Component: Existing Component
\`\`\`

## Traceability

### Forward Traceability
From business need to implementation:

\`\`\`
BRD (crit-001)
  ↓ fulfills
Plan (references crit-001)
  ↓ implements
Tasks (task-001, task-002)
  ↓ tested by
Test Cases
\`\`\`

### Backward Traceability
From code to business justification:

\`\`\`
Code Change
  ↑ implements
Task
  ↑ part of
Plan
  ↑ fulfills
Criteria
  ↑ from
BRD
  ↑ justifies
Business Value
\`\`\`

## Dependency Management

### Task Dependencies
\`\`\`yaml
tasks:
  - id: task-001
    task: Setup database schema
    status: completed

  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]  # Can't start until task-001 done
    status: pending
\`\`\`

### Plan Dependencies
\`\`\`yaml
# Plan B
title: Deploy Application
depends_on:
  - pln-001-setup-infrastructure  # Must complete Plan A first
\`\`\`

### Component Dependencies
\`\`\`yaml
# Web App Component
depends_on:
  - cmp-002-api-service
  - cmp-003-auth-service
\`\`\`

## Supersession (Versioning)

When specs evolve, create new versions:

\`\`\`yaml
# Original
dec-001-use-mongodb
decision_status: superseded

# New version
dec-002-use-postgresql
supersedes: dec-001-use-mongodb
decision_status: accepted
\`\`\`

## Best Practices

### Keep References Updated
When specs change, update references to maintain accuracy.

### Link Bidirectionally When Helpful
\`\`\`yaml
# In BRD
references:
  - type: other
    name: Implementation Plan
    description: See pln-001-implement-auth

# In Plan
criteria:
  requirement: brd-001-user-auth  # Links back to BRD
\`\`\`

### Use Descriptive Reference Names
❌ Bad: "See other spec"
✅ Good: "See dec-001-use-postgres for database choice rationale"

### Document Why References Exist
\`\`\`yaml
references:
  - type: url
    name: OWASP Auth Guide
    url: https://owasp.org/auth
    description: Following these security best practices
\`\`\`

## Related Guides

- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for which specs to create
- Use the \`query_specs\` tool to explore relationships in your project`,
} as const;
