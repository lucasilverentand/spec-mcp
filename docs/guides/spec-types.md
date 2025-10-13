# Spec Types Guide

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
