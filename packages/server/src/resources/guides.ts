/**
 * Generated file - DO NOT EDIT
 * Run 'pnpm embed-guides' to regenerate
 */

/**
 * Guide resource definitions with embedded content
 */
export const GUIDE_RESOURCES = [
	{
		uri: "spec-mcp://guide/plan",
		name: "Plan Guide",
		description: "When and how to use Plans to organize implementation work",
		mimeType: "text/markdown",
		content: `# Plan Guide

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
\`\`\`yaml
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
\`\`\`

### Refactoring Plan
\`\`\`yaml
title: Refactor Database Layer
description: Extract database logic into repository pattern
scope:
  in_scope:
    - User repository
    - Post repository
  out_of_scope:
    - Migrations
    - Query optimization
\`\`\`

### Technical Debt Plan
\`\`\`yaml
title: Remove Deprecated API Endpoints
description: Clean up v1 API endpoints after v2 migration
scope:
  in_scope:
    - Remove /api/v1/* endpoints
    - Update documentation
  out_of_scope:
    - V2 endpoint improvements
\`\`\`

## Task Management

### Task Dependencies
\`\`\`yaml
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
\`\`\`

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

\`\`\`yaml
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
\`\`\`

## API Contracts

Define your API interfaces:

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

Document your schemas:

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
\`\`\`yaml
milestones:
  - mls-001-v2-launch
\`\`\`

Links this plan to a release milestone for tracking.

## Related Guides

- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use Plans vs other types
- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how Plans connect to BRDs/PRDs
- View the [Plan Schema](spec-mcp://schema/plan) for complete field reference
`,
	},
	{
		uri: "spec-mcp://guide/business-requirement",
		name: "Business Requirement Guide",
		description:
			"When and how to use Business Requirements (BRDs) to capture business needs",
		mimeType: "text/markdown",
		content: `# Business Requirement Guide

**Goal**: Understand when and how to use Business Requirements (BRDs) to capture business needs.

## What is a Business Requirement?

A BRD captures what the business needs, why it matters, who cares about it, and what value it delivers. It's written for stakeholders and focuses on outcomes, not implementation details.

## When to Use a BRD

✅ **Use a BRD when:**
- Capturing stakeholder needs and business goals
- Defining user-facing features or capabilities
- Justifying investment in a project
- Documenting business value (revenue, cost savings, satisfaction)
- Tracking multiple stakeholders with different interests

❌ **Don't use a BRD for:**
- Technical implementation details (use PRD instead)
- Architectural decisions (use Decision instead)
- Task breakdowns (use Plan instead)

## Key Components

### Required Fields
- **Business Value**: What business benefit this delivers (revenue, cost savings, satisfaction)
- **User Stories**: Who needs this and why ("As a..., I want..., so that...")
- **Acceptance Criteria**: What must be true for this to be complete

### Optional But Valuable
- **Stakeholders**: Who cares about this and why
- **References**: Market research, competitor analysis, user feedback

## Common Patterns

### Feature BRD
\`\`\`yaml
title: User Authentication System
description: Users need secure account access for personalized experience
business_value:
  - type: customer-satisfaction
    value: Reduces friction in accessing personalized features
  - type: cost-savings
    value: Reduces support tickets for account access by 40%
user_stories:
  - role: registered user
    feature: securely log into my account
    benefit: I can access my personalized dashboard
stakeholders:
  - role: product-owner
    name: Jane Smith
    interest: Improve user retention and security
criteria:
  - description: Users can log in with email and password
    rationale: Core authentication requirement
\`\`\`

### Improvement BRD
\`\`\`yaml
title: Faster Page Load Times
description: Reduce page load times to improve user experience
business_value:
  - type: customer-satisfaction
    value: Every 100ms improvement increases conversion by 1%
  - type: revenue
    value: Estimated $50k annual revenue increase
user_stories:
  - role: website visitor
    feature: see content load quickly
    benefit: I don't get frustrated and leave
\`\`\`

### Capability BRD
\`\`\`yaml
title: Export Data to CSV
description: Users need to export their data for external analysis
business_value:
  - type: customer-satisfaction
    value: Power users can integrate with their own tools
user_stories:
  - role: power user
    feature: export my data to CSV format
    benefit: I can analyze it in Excel or other tools
\`\`\`

## User Stories

Follow the format: **As a [role], I want [feature], so that [benefit]**

Good user stories:
- **Specific role**: "registered user" not just "user"
- **Clear feature**: "reset my password via email"
- **Obvious benefit**: "I can regain access to my account"

Examples:
\`\`\`yaml
user_stories:
  - role: admin user
    feature: bulk update user permissions
    benefit: I can manage access efficiently

  - role: free tier user
    feature: upgrade to paid plan
    benefit: I can access premium features
\`\`\`

## Stakeholders

Document who cares and why:

\`\`\`yaml
stakeholders:
  - role: product-owner
    name: Jane Smith
    email: jane@example.com
    interest: Drive user adoption and retention

  - role: end-user
    name: App Users
    interest: Secure and convenient access

  - role: executive
    name: CEO
    interest: Reduce churn and increase revenue
\`\`\`

## Acceptance Criteria

What must be true for this to be complete?

\`\`\`yaml
criteria:
  - id: crit-001
    description: Users can log in with valid credentials within 3 seconds
    rationale: Performance requirement for good UX

  - id: crit-002
    description: Failed login shows clear error message
    rationale: User needs to understand what went wrong

  - id: crit-003
    description: Passwords are stored securely (bcrypt with salt)
    rationale: Security requirement for user data protection
\`\`\`

## Best Practices

### Focus on Outcomes, Not Solutions
❌ Bad: "Use JWT tokens for authentication"
✅ Good: "Users can securely access their accounts"

### Quantify Business Value
❌ Bad: "Improves user experience"
✅ Good: "Reduces support tickets by 40%, saving $20k annually"

### Write for Stakeholders
- Use business language, not technical jargon
- Explain "why" before "what"
- Show ROI and business impact

### Link to Evidence
\`\`\`yaml
references:
  - type: url
    name: User Survey Results
    url: https://docs.example.com/survey-2024
    description: 73% of users requested password reset feature
\`\`\`

### Keep Criteria Testable
❌ Bad: "System should be fast"
✅ Good: "Page loads in under 2 seconds on 3G connection"

## BRD → PRD → Plan Flow

1. **BRD**: "Users need to reset forgotten passwords"
2. **PRD**: "Use email-based reset flow with time-limited tokens"
3. **Plan**: "Task 1: Email service, Task 2: Reset endpoint, Task 3: UI"

## Related Guides

- See [Technical Requirement Guide](spec-mcp://guide/technical-requirement) for technical specifications
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use BRDs
- View the [Business Requirement Schema](spec-mcp://schema/business-requirement) for complete field reference
`,
	},
	{
		uri: "spec-mcp://guide/choosing-spec-types",
		name: "Choosing Spec Types",
		description: "Which spec types to use for different situations",
		mimeType: "text/markdown",
		content: `# Choosing Spec Types

**Goal**: Learn which spec types to use for different situations.

## Quick Decision Tree

\`\`\`
Need to capture business value and stakeholder needs?
  → Business Requirement (BRD)

Need to specify technical approach or constraints?
  → Technical Requirement (PRD)

Need to document an important choice or trade-off?
  → Decision (DEC)

Need to define system architecture or components?
  → Component (CMP)

Need to break work into executable tasks?
  → Plan (PLN)

Need to establish team standards or principles?
  → Constitution (CST)

Need to organize work into a release?
  → Milestone (MLS)
\`\`\`

## By Situation

### Starting a New Feature

**Minimum:**
1. **BRD** - What users need and why
2. **Plan** - Tasks to implement it

**Recommended:**
1. **BRD** - Business context and value
2. **PRD** - Technical approach
3. **Plan** - Implementation tasks
4. **Decision** - Any significant choices

### Refactoring or Tech Debt

**Minimum:**
1. **Plan** - What needs to be refactored

**Recommended:**
1. **PRD** - Technical motivation and constraints
2. **Decision** - Approach chosen (if alternatives exist)
3. **Plan** - Refactoring tasks

### Documenting Architecture

**Minimum:**
1. **Component** - For each major component

**Recommended:**
1. **Components** - All major pieces
2. **Decisions** - Why this architecture
3. **Constitution** - Architectural principles

### Planning a Release

**Minimum:**
1. **Milestone** - Release container
2. **Plans** - Linked to milestone

**Recommended:**
1. **Milestone** - With target date
2. **BRDs** - Features in release
3. **PRDs** - Technical requirements
4. **Plans** - Implementation work

## Common Combinations

### Feature Development
\`\`\`
BRD (what/why)
  ↓
PRD (how technically)
  ↓
Decision (significant choices)
  ↓
Plan (implementation tasks)
\`\`\`

### Bug Fix
\`\`\`
PRD (technical context)
  ↓
Plan (fix tasks)
\`\`\`

### New Service/Component
\`\`\`
Component (architecture)
  ↓
Decisions (technology choices)
  ↓
PRD (technical requirements)
  ↓
Plan (implementation)
\`\`\`

### Establishing Standards
\`\`\`
Constitution (principles)
  ↓
Decisions (specific choices that follow principles)
\`\`\`

## When to Skip Spec Types

### Skip BRD if:
- Internal refactoring with no user impact
- Bug fix with obvious value
- Technical debt everyone agrees on

### Skip PRD if:
- Trivial implementation (< 1 day work)
- No technical decisions to document
- Following established patterns exactly

### Skip Decision if:
- Choice is obvious with no alternatives
- Decision is temporary/experimental
- Covered by existing Constitution

### Skip Plan if:
- Work is < 1 hour
- Single, simple task
- Exploratory spike work

## Anti-Patterns

### ❌ Too Many Specs
Don't create specs for every tiny change. Use judgment.

**Bad**: Separate BRD, PRD, Decision, Plan for changing a button color
**Good**: Just make the change, or at most a simple Plan

### ❌ Wrong Spec Type
Using the wrong type creates confusion.

**Bad**: Putting implementation tasks in a BRD
**Good**: BRD for business need, Plan for tasks

### ❌ Duplicate Information
Don't repeat the same info across specs.

**Bad**: Copy-paste user stories into PRD and Plan
**Good**: Reference the BRD from PRD and Plan

## Project Type Recommendations

### Web Application
- **Start**: Constitution, Components
- **Per Feature**: BRD, PRD, Plan
- **Per Release**: Milestone

### Library/SDK
- **Start**: Constitution, Component
- **Per Feature**: PRD, Plan (skip BRD unless public API)
- **Per Release**: Milestone, Decision (for breaking changes)

### Microservices
- **Start**: Constitution, Components (per service)
- **Per Service**: BRD (capability), PRD, Plan
- **Cross-Service**: Decisions (communication patterns)

### Internal Tool
- **Start**: Component
- **Per Feature**: BRD (if user-facing), PRD, Plan
- **Standards**: Constitution

## Related Guides

- See individual spec type guides for detailed usage
- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how specs connect
- See [Getting Started guides](spec-mcp://guide/getting-started) for project setup
`,
	},
	{
		uri: "spec-mcp://guide/getting-started",
		name: "Getting Started",
		description: "Quick start guide for spec-driven development",
		mimeType: "text/markdown",
		content: `# Getting Started

Placeholder guide.
`,
	},
	{
		uri: "spec-mcp://guide/spec-types",
		name: "Spec Types Guide (Legacy)",
		description:
			"Complete guide to spec types (being replaced by focused guides)",
		mimeType: "text/markdown",
		content: `# Spec Types Guide

This guide explains the different specification types in spec-mcp, their purposes, relationships, and where to start when building specs for your project.

## Overview

spec-mcp provides seven core specification types that work together to document your software project from high-level requirements through implementation plans:

1. **Business Requirements (BRD)** - What the business needs
2. **Technical Requirements (PRD)** - How to build it technically
3. **Decisions (DEC)** - Key architectural and design choices
4. **Components (CMP)** - System components and their relationships
5. **Plans (PLN)** - Execution plans with tasks and workflows
6. **Constitutions (CST)** - Project principles and standards
7. **Milestones (MLS)** - Release planning and deliverables

## Spec Type Details

### Business Requirements (BRD)

**Purpose**: Define what the business needs and why it matters.

**Use when**: You need to capture stakeholder requirements, user needs, or business value propositions.

**Key features**:
- User stories (As a..., I want..., so that...)
- Business value propositions (revenue, cost savings, satisfaction)
- Stakeholder tracking
- Acceptance criteria
- Business goals

**Example**: "User Authentication System" BRD would capture login requirements, stakeholder interests (security team, users, compliance), and business value (reduced support tickets, improved security posture).

### Technical Requirements (PRD)

**Purpose**: Define the technical approach and implementation requirements.

**Use when**: You need to specify how something will be built technically.

**Key features**:
- Technical constraints (performance, security, scalability)
- Implementation approach
- Technical dependencies
- Acceptance criteria
- Priority levels

**Example**: "API Rate Limiting" PRD would specify rate limit algorithms, storage mechanisms, performance requirements, and error handling.

### Decisions (DEC)

**Purpose**: Document important architectural and technical decisions with context.

**Use when**: You need to make or record a significant choice that affects the project.

**Key features**:
- Decision context and rationale
- Alternatives considered
- Consequences (positive, negative, risks)
- Status tracking (proposed, accepted, rejected, deprecated)

**Example**: "Use PostgreSQL for Primary Database" decision would explain why PostgreSQL was chosen over alternatives, considering factors like ACID compliance, tooling, and team expertise.

### Components (CMP)

**Purpose**: Define the structural building blocks of your system.

**Use when**: You need to document services, libraries, applications, or databases in your architecture.

**Key features**:
- Component type classification
- Technology stack
- Deployment configuration
- External dependencies
- Repository and folder paths

**Example**: "Web Application" component would specify React/TypeScript stack, Vercel deployment, API dependencies, and monorepo location.

### Plans (PLN)

**Purpose**: Organize implementation work into executable tasks with dependencies.

**Use when**: You're ready to implement features or make changes.

**Key features**:
- Task lists with dependencies
- Scope definition (in/out of scope)
- Test cases
- User/system/data flows
- API contracts
- Data models
- Git workflow integration

**Example**: "Implement User Authentication" plan would break down login/logout/password reset into tasks, define test cases, and specify API contracts.

### Constitutions (CST)

**Purpose**: Establish project-wide principles, standards, and guidelines.

**Use when**: You need to codify how the team works, coding standards, or architectural principles.

**Key features**:
- Core principles
- Technical standards
- Process guidelines
- Quality requirements

**Example**: "API Design Constitution" would define REST conventions, versioning strategy, error handling standards, and documentation requirements.

### Milestones (MLS)

**Purpose**: Plan releases and group related work.

**Use when**: You need to organize specs and plans into deliverable releases.

**Key features**:
- Release planning
- Spec and plan grouping
- Timeline tracking
- Success criteria

**Example**: "v2.0 Launch" milestone would group all BRDs, PRDs, and Plans needed for the next major release.

## How Specs Interact

### The Typical Flow

1. **Start with Business Requirements (BRD)**: Capture what stakeholders need
2. **Create Technical Requirements (PRD)**: Define how to build it
3. **Document Decisions (DEC)**: Record important choices made
4. **Define Components (CMP)**: Structure your architecture
5. **Create Plans (PLN)**: Break work into executable tasks
6. **Establish Constitutions (CST)**: Codify standards (can be created early)
7. **Organize with Milestones (MLS)**: Group work into releases

### Relationships

- **BRDs → PRDs**: Business requirements inform technical requirements
- **PRDs → Plans**: Technical requirements guide implementation planning
- **Decisions → All Specs**: Decisions can influence any spec type
- **Components → Plans**: Plans reference which components they modify
- **Constitutions → All Work**: Standards apply across all specs
- **Milestones → Groups**: Milestones organize related specs and plans

### Reference System

All spec types support references to:
- External URLs and documentation
- Internal files and code
- Other specs (via spec IDs)
- Code examples

This creates a web of interconnected documentation that evolves with your project.

## Where to Start

### For New Projects

1. **Create a Constitution (CST)** - Establish your team's principles and standards
2. **Define initial Components (CMP)** - Sketch your architecture
3. **Write Business Requirements (BRDs)** - Capture your MVP features
4. **Create Technical Requirements (PRDs)** - Plan the implementation approach
5. **Make key Decisions (DECs)** - Document technology choices
6. **Build Plans (PLNs)** - Break work into tasks
7. **Set Milestones (MLS)** - Organize into releases

### For Existing Projects

1. **Start with Decisions (DECs)** - Document existing architectural choices
2. **Map Components (CMPs)** - Document your current architecture
3. **Create Plans (PLNs)** - Plan new features or refactoring
4. **Add Requirements as Needed** - Document BRDs/PRDs for new work
5. **Consider a Constitution (CST)** - Codify informal standards
6. **Track with Milestones (MLS)** - Organize future releases

### For Single Features

1. **Business Requirement (BRD)** - What's needed and why
2. **Technical Requirement (PRD)** - How to build it
3. **Plan (PLN)** - Tasks to execute
4. **Decisions (DECs)** - Any choices made along the way

## Common Patterns

### Bottom-Up (Reactive)

Start with what you're building now, document as you go:
- Create a Plan for immediate work
- Add PRD if technical decisions need documentation
- Add BRD if business context is important
- Document Decisions as they arise

**Good for**: Established projects, tactical work, prototyping

### Top-Down (Proactive)

Start with business needs, plan thoroughly:
- Write BRD for business context
- Create PRD for technical approach
- Document key Decisions
- Build detailed Plan
- Define or update Components

**Good for**: New features, complex changes, regulated industries

### Architecture-First

Start with structure:
- Define Components (system architecture)
- Write Constitution (standards)
- Document Decisions (technology choices)
- Create Plans for component development

**Good for**: New projects, major refactors, greenfield development

## Tips for Success

### Keep Specs Focused
Each spec should have a single, clear purpose. Split large specs into multiple focused ones.

### Link Freely
Use references to connect related specs. This creates a knowledge graph.

### Iterate
Specs evolve. Use versioning (supersede) to track changes over time.

### Use the Right Tool
Not every task needs every spec type. Use what adds value.

### Start Simple
Begin with basic information. Add detail as needs emerge.

### Follow Through
Update specs as implementation progresses. Keep plans in sync with code.

## Examples by Project Type

### Web Application
- **Components**: Frontend, API, Database, Auth Service
- **Constitution**: Code style, API conventions, testing requirements
- **Plans**: Feature implementations, tech debt, refactoring
- **BRDs**: User-facing features
- **PRDs**: Technical capabilities
- **Decisions**: Framework choices, deployment strategy

### Library/SDK
- **Components**: Core library, documentation, examples
- **Constitution**: API design principles, versioning strategy
- **Plans**: Feature additions, breaking changes
- **PRDs**: API specifications, performance requirements
- **Decisions**: Design philosophy, dependency choices

### Microservices
- **Components**: Each service, shared libraries, infrastructure
- **Constitution**: Service contracts, data ownership, deployment standards
- **Plans**: Service development, cross-service features
- **BRDs**: Business capabilities
- **PRDs**: Service specifications, inter-service protocols
- **Decisions**: Technology stack, communication patterns

## Next Steps

- See [Planning Workflow](spec-mcp://guide/planning-workflow) for how to create and execute plans
- See [Best Practices](spec-mcp://guide/best-practices) for tips on writing effective specs
- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development workflow
`,
	},
	{
		uri: "spec-mcp://guide/planning-workflow",
		name: "Planning Workflow",
		description: "Complete workflow for planning features with specs",
		mimeType: "text/markdown",
		content: `# planning-workflow

Placeholder.
`,
	},
	{
		uri: "spec-mcp://guide/implementation-workflow",
		name: "Implementation Workflow",
		description: "Development workflow for implementing from specs",
		mimeType: "text/markdown",
		content: `# implementation-workflow

Placeholder.
`,
	},
	{
		uri: "spec-mcp://guide/best-practices",
		name: "Best Practices",
		description:
			"Patterns, anti-patterns, and tips for spec-driven development",
		mimeType: "text/markdown",
		content: `# best-practices

Placeholder.
`,
	},
	{
		uri: "spec-mcp://guide/query-guide",
		name: "Query Guide",
		description: "Complete guide for querying and analyzing specs",
		mimeType: "text/markdown",
		content: `# query-guide

Placeholder.
`,
	},
] as const;
