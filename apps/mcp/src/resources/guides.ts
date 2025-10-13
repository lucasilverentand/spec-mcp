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
- [Plan Schema](spec-mcp://schema/plan) - Complete field reference
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
		uri: "spec-mcp://guide/technical-requirement",
		name: "Technical Requirement Guide",
		description:
			"When and how to use Technical Requirements (PRDs) to specify technical approaches",
		mimeType: "text/markdown",
		content: `# Technical Requirement Guide

**Goal**: Understand when and how to use Technical Requirements (PRDs) to specify technical approaches.

## What is a Technical Requirement?

A PRD defines the technical approach, constraints, dependencies, and implementation considerations for building something. It's written for engineers and focuses on how to build, not why to build.

## When to Use a PRD

✅ **Use a PRD when:**
- Specifying technical approach or architecture
- Documenting performance, security, or scalability requirements
- Defining technical constraints
- Listing technical dependencies (libraries, APIs, systems)
- Planning complex technical implementations

❌ **Don't use a PRD for:**
- Business justification (use BRD instead)
- Breaking down tasks (use Plan instead)
- Recording architectural decisions (use Decision instead)

## Key Components

### Required Fields
- **Technical Context**: Background and rationale for this requirement
- **Acceptance Criteria**: Technical success criteria

### Optional But Valuable
- **Implementation Approach**: High-level strategy
- **Technical Dependencies**: Libraries, frameworks, APIs needed
- **Constraints**: Performance, security, scalability limits
- **Implementation Notes**: Additional considerations

## Common Patterns

### Performance Requirement
\`\`\`yaml
title: API Response Time Optimization
description: Improve API response times to meet SLA requirements
technical_context: |
  Current API averages 500ms response time. SLA requires 200ms p95.
  Profiling shows database queries as the bottleneck.
implementation_approach: |
  1. Add database indexes on frequently queried fields
  2. Implement Redis caching for read-heavy endpoints
  3. Use connection pooling to reduce overhead
constraints:
  - type: performance
    description: P95 response time must be under 200ms
  - type: infrastructure
    description: Must work with existing PostgreSQL and Redis setup
criteria:
  - description: API p95 response time is under 200ms
    rationale: SLA requirement for production readiness
\`\`\`

### Security Requirement
\`\`\`yaml
title: Implement API Rate Limiting
description: Protect API from abuse and ensure fair usage
technical_context: |
  Current API has no rate limiting, making it vulnerable to abuse.
  Need per-user rate limiting with burst handling.
implementation_approach: |
  Use Redis-backed token bucket algorithm:
  - 100 requests per minute per user
  - 1000 requests per hour per user
  - Burst allowance of 20 requests
constraints:
  - type: performance
    description: Rate limit check must add less than 5ms latency
  - type: security
    description: Limits must be per-user, not per-IP to prevent bypass
technical_dependencies:
  - type: documentation
    name: ioredis
    library: ioredis
    search_term: rate limiting patterns
criteria:
  - description: API returns 429 when rate limit exceeded
    rationale: Standard HTTP convention
  - description: Response includes Retry-After header
    rationale: Tells clients when they can retry
\`\`\`

### Integration Requirement
\`\`\`yaml
title: Stripe Payment Integration
description: Integrate Stripe for payment processing
technical_context: |
  Need payment processing for subscription upgrades.
  Must support credit cards and handle webhooks.
implementation_approach: |
  Use Stripe Checkout for payment UI.
  Implement webhook handler for subscription events.
  Store subscription status in database.
technical_dependencies:
  - type: documentation
    name: Stripe Node.js SDK
    library: stripe
    search_term: checkout session webhooks
constraints:
  - type: security
    description: Never store credit card data directly
  - type: compatibility
    description: Must support existing user account system
\`\`\`

## Technical Constraints

Document limits and requirements:

\`\`\`yaml
constraints:
  - type: performance
    description: Page load must be under 2 seconds on 3G

  - type: security
    description: All data must be encrypted at rest using AES-256

  - type: scalability
    description: Must handle 10,000 concurrent users

  - type: compatibility
    description: Must work on Chrome, Firefox, Safari (last 2 versions)

  - type: infrastructure
    description: Must deploy to AWS using existing VPC configuration
\`\`\`

## Technical Dependencies

Reference external systems and libraries:

\`\`\`yaml
technical_dependencies:
  - type: documentation
    name: React Query
    library: @tanstack/react-query
    search_term: mutations optimistic updates

  - type: url
    name: PostgreSQL Full Text Search
    url: https://postgresql.org/docs/current/textsearch.html
    description: Documentation for implementing search

  - type: file
    name: Existing Auth System
    path: src/auth/README.md
    description: Must integrate with current auth flow
\`\`\`

## Acceptance Criteria

Make criteria technically measurable:

\`\`\`yaml
criteria:
  - id: crit-001
    description: API responds in under 100ms for 95% of requests
    rationale: Performance SLA requirement

  - id: crit-002
    description: System handles 1000 requests/second sustained
    rationale: Peak traffic capacity requirement

  - id: crit-003
    description: Zero data loss during database failover
    rationale: High availability requirement
\`\`\`

## Best Practices

### Be Specific and Measurable
❌ Bad: "System should be fast"
✅ Good: "API p95 response time under 200ms"

### Document "Why" Not Just "What"
❌ Bad: "Use Redis for caching"
✅ Good: "Use Redis for caching because database queries are the bottleneck (profiling data shows 80% of latency)"

### Link Technical Decisions
\`\`\`yaml
references:
  - type: other
    name: Decision to use PostgreSQL
    description: See dec-001-use-postgresql for database choice rationale
\`\`\`

### Include Implementation Notes
\`\`\`yaml
implementation_notes: |
  Consider using Cloudflare rate limiting as backup layer.
  Monitor Redis memory usage - may need separate instance for rate limiting.
  Test with production-like traffic volumes before deploying.
\`\`\`

### Define Clear Constraints
- Make constraints testable
- Include rationale
- Specify exact numbers when possible

## BRD → PRD → Plan Flow

Example: Password Reset Feature

1. **BRD**: "Users need to reset forgotten passwords to regain account access"
   - Business value: Reduces support tickets by 40%
   - User story: "As a user, I want to reset my password so that I can regain access"

2. **PRD** (this level): "Implement email-based password reset with time-limited tokens"
   - Technical approach: JWT tokens, 1-hour expiry, email via SendGrid
   - Constraints: Must not leak user existence, tokens single-use only
   - Dependencies: SendGrid API, existing auth system

3. **Plan**: Tasks to implement
   - Task 1: Email service integration
   - Task 2: Token generation endpoint
   - Task 3: Password reset UI

## Related Guides

- See [Business Requirement Guide](spec-mcp://guide/business-requirement) for business context
- See [Decision Guide](spec-mcp://guide/decision) for documenting technical choices
- See [Plan Guide](spec-mcp://guide/plan) for implementation breakdown
- View the [Technical Requirement Schema](spec-mcp://schema/technical-requirement) for complete field reference
`,
	},
	{
		uri: "spec-mcp://guide/decision",
		name: "Decision Guide",
		description: "When and how to use Decisions to document important choices",
		mimeType: "text/markdown",
		content: `# Decision Guide

**Goal**: Understand when and how to use Decisions to document important choices.

## What is a Decision?

A Decision documents an important architectural or technical choice, including the context, alternatives considered, and consequences. It helps teams understand why certain choices were made and prevents revisiting settled decisions.

## When to Use a Decision

✅ **Use a Decision when:**
- Making a significant technical or architectural choice
- Multiple viable alternatives exist
- The choice has long-term implications
- Future team members will ask "why did we do it this way?"
- There are meaningful trade-offs to consider

❌ **Don't use a Decision for:**
- Obvious choices with no alternatives
- Temporary or experimental choices
- Implementation details (use PRD instead)
- Choices already covered by Constitution

## Key Components

### Required Fields
- **Decision**: Clear statement of what was decided
- **Context**: Situation or problem that prompted this decision
- **Decision Status**: proposed, accepted, deprecated, superseded

### Optional But Valuable
- **Alternatives**: Options that were considered but not chosen
- **Consequences**: Positive, negative, and risk outcomes
- **Supersedes**: Previous decision this replaces

## Common Patterns

### Technology Choice
\`\`\`yaml
title: Use PostgreSQL for Primary Database
description: Choose PostgreSQL as the primary database for all user data
decision: |
  Use PostgreSQL 15+ with jsonb support for flexible schemas where needed.
  Deploy using managed service (Supabase) for reduced operational burden.
context: |
  We need a reliable database that supports:
  - ACID transactions for critical user data
  - Flexible schemas for rapidly evolving features
  - Full-text search capabilities
  - JSON querying for semi-structured data
decision_status: accepted
alternatives:
  - MongoDB for better schema flexibility but sacrificing ACID guarantees
  - MySQL for team familiarity but weaker JSON support
  - DynamoDB for serverless architecture but higher learning curve
consequences:
  - type: positive
    description: ACID compliance ensures data integrity

  - type: negative
    description: Horizontal scaling is more complex than with NoSQL
    mitigation: Use read replicas and connection pooling

  - type: risk
    description: Team has limited PostgreSQL experience
    mitigation: Provide training and pair programming sessions
\`\`\`

### Architecture Decision
\`\`\`yaml
title: Use Microservices Architecture
description: Split monolith into microservices for better scalability
decision: |
  Migrate from monolith to microservices architecture with:
  - API Gateway for routing
  - Event-driven communication via message queue
  - Independent deployment per service
context: |
  Current monolith has become difficult to scale and deploy.
  Teams are blocked waiting for full deployments.
  Need to scale different services independently.
decision_status: accepted
alternatives:
  - Keep monolith and optimize it
  - Modular monolith with clear boundaries
  - Serverless functions for new features only
consequences:
  - type: positive
    description: Teams can deploy independently

  - type: negative
    description: Increased operational complexity
    mitigation: Invest in observability and monitoring tools

  - type: risk
    description: Data consistency across services is harder
    mitigation: Use saga pattern for distributed transactions
\`\`\`

### Process Decision
\`\`\`yaml
title: Adopt Trunk-Based Development
description: Move from GitFlow to trunk-based development
decision: |
  Use trunk-based development:
  - All work on main branch with feature flags
  - Short-lived feature branches (< 2 days)
  - Deploy main branch continuously
context: |
  Current GitFlow causes merge conflicts and delayed feedback.
  Want faster iteration and continuous deployment.
decision_status: accepted
alternatives:
  - Continue with GitFlow (develop/release branches)
  - GitHub Flow (long-lived feature branches)
consequences:
  - type: positive
    description: Faster feedback and reduced merge conflicts

  - type: negative
    description: Requires feature flag infrastructure
    mitigation: Implement feature flag service early
\`\`\`

## Decision Status Flow

\`\`\`
proposed → accepted → deprecated
                  ↓
              superseded (by new decision)
\`\`\`

- **proposed**: Under consideration, not yet implemented
- **accepted**: Agreed upon and in use
- **deprecated**: No longer recommended, but not replaced
- **superseded**: Replaced by a newer decision

## Consequences

Document all outcomes, not just positives:

\`\`\`yaml
consequences:
  # Positive outcomes
  - type: positive
    description: Improves developer productivity by 30%

  # Negative outcomes with mitigation
  - type: negative
    description: Increases infrastructure costs by $500/month
    mitigation: Acceptable trade-off for improved reliability

  # Risks with mitigation
  - type: risk
    description: Vendor lock-in to AWS services
    mitigation: Use abstraction layer to minimize direct dependencies
\`\`\`

## Best Practices

### Write for Future Team Members
Imagine someone joining 2 years from now asking "why did we choose this?"

### Document the Context
❌ Bad: "We chose PostgreSQL"
✅ Good: "We chose PostgreSQL because we needed ACID transactions for financial data and the team had SQL experience"

### List Real Alternatives
❌ Bad: "No other options"
✅ Good: List actual alternatives you considered with pros/cons

### Be Honest About Trade-offs
Document negatives and risks, not just positives. This builds trust and helps with future decisions.

### Update Status Over Time
\`\`\`yaml
# Original decision
decision_status: accepted

# Later, when superseded
decision_status: superseded
supersedes: dec-001-use-mongodb
\`\`\`

### Link to Evidence
\`\`\`yaml
references:
  - type: url
    name: PostgreSQL vs MongoDB Benchmark
    url: https://example.com/benchmark
    description: Performance comparison showing PostgreSQL jsonb performance

  - type: file
    name: Database Requirements Analysis
    path: docs/database-analysis.md
    description: Detailed requirements that led to this decision
\`\`\`

## When to Supersede Decisions

Create a new decision that supersedes the old one:

\`\`\`yaml
title: Migrate from PostgreSQL to CockroachDB
decision: We will migrate to CockroachDB for better global distribution
decision_status: accepted
supersedes: dec-001-use-postgresql
context: |
  Original PostgreSQL decision was correct for our needs.
  Now we've grown to global scale and need distributed SQL.
\`\`\`

This preserves history while documenting the evolution.

## Common Decision Categories

### Technical Decisions
- Database choice
- Framework selection
- Programming language
- Testing strategy
- API design approach

### Architectural Decisions
- Monolith vs microservices
- Synchronous vs asynchronous
- Server-side vs client-side rendering
- Deployment strategy

### Process Decisions
- Git workflow
- Code review process
- Testing requirements
- Documentation standards

## Related Guides

- See [Constitution Guide](spec-mcp://guide/constitution) for documenting principles that guide decisions
- See [Technical Requirement Guide](spec-mcp://guide/technical-requirement) for implementation details
- View the [Decision Schema](spec-mcp://schema/decision) for complete field reference
`,
	},
	{
		uri: "spec-mcp://guide/component",
		name: "Component Guide",
		description: "When and how to use Components to define system architecture",
		mimeType: "text/markdown",
		content: `# Component Guide

**Goal**: Understand when and how to use Components to define system architecture.

## What is a Component?

A Component represents a structural building block of your system - an application, service, or library. It documents what the component does, its technology stack, deployment configuration, and dependencies.

## When to Use a Component

✅ **Use a Component for:**
- Applications (web, mobile, desktop)
- Backend services and APIs
- Shared libraries or packages
- Databases or infrastructure components
- Major architectural building blocks

❌ **Don't use a Component for:**
- Small utility functions
- Individual features (use Plan instead)
- Temporary scripts
- Test fixtures

## Key Components

### Required Fields
- **Component Type**: app, service, or library
- **Description**: What this component does
- **Scope**: What's in and out of scope

### Optional But Valuable
- **Tech Stack**: Technologies and frameworks used
- **Deployments**: Where and how it's deployed
- **External Dependencies**: Third-party services
- **Folder**: Location in monorepo
- **Dev Port**: Development server port

## Common Patterns

### Web Application Component
\`\`\`yaml
title: Web Application
description: |
  React-based web application providing the primary user interface.
  Handles user authentication, dashboard, and settings.
component_type: app
folder: apps/web-app
dev_port: 3000
scope:
  in_scope:
    - User dashboard and profile pages
    - Authentication UI
    - Real-time notifications
  out_of_scope:
    - Admin panel (separate component)
    - Mobile app (native)
depends_on:
  - cmp-002-api-service
  - cmp-003-auth-service
tech_stack:
  - React 18.2
  - TypeScript 5.3
  - Vite 5.0
  - TailwindCSS 3.4
  - React Query 5
deployments:
  - platform: Vercel
    url: https://app.example.com
    build_command: pnpm build
    environment_vars:
      - VITE_API_URL
      - VITE_AUTH_DOMAIN
    secrets:
      - SENTRY_DSN
external_dependencies:
  - Auth0 for user authentication
  - Sentry for error tracking
  - PostHog for analytics
\`\`\`

### API Service Component
\`\`\`yaml
title: REST API Service
description: |
  Core API service handling business logic and data access.
  Provides REST endpoints for web and mobile clients.
component_type: service
folder: apps/api
dev_port: 3001
scope:
  in_scope:
    - User management endpoints
    - Data CRUD operations
    - Authentication middleware
  out_of_scope:
    - WebSocket connections (separate service)
    - Background jobs (separate service)
depends_on:
  - cmp-004-database
tech_stack:
  - Node.js 20
  - Express 4.18
  - Prisma ORM 5.1
  - TypeScript 5.3
deployments:
  - platform: Railway
    url: https://api.example.com
    build_command: pnpm build
    deploy_command: pnpm start:prod
    environment_vars:
      - DATABASE_URL
      - JWT_SECRET
      - REDIS_URL
external_dependencies:
  - PostgreSQL database
  - Redis for caching
  - SendGrid for emails
\`\`\`

### Shared Library Component
\`\`\`yaml
title: UI Component Library
description: |
  Shared React component library used across all frontend applications.
  Provides consistent design system components.
component_type: library
folder: libs/ui
scope:
  in_scope:
    - Buttons, inputs, modals, cards
    - Layout components
    - TypeScript types and utilities
  out_of_scope:
    - Business logic components
    - Application-specific components
tech_stack:
  - React 18
  - TypeScript 5
  - Storybook 7
  - Radix UI primitives
deployments:
  - platform: npm
    url: https://www.npmjs.com/package/@acme/ui
    build_command: pnpm build
notes: |
  Published to npm on every release.
  Used by web-app and admin-app components.
\`\`\`

### Database Component
\`\`\`yaml
title: PostgreSQL Database
description: Primary database for all application data
component_type: service
scope:
  in_scope:
    - User accounts and profiles
    - Application data storage
    - Full-text search indexes
  out_of_scope:
    - Analytics data (separate warehouse)
    - Cache data (Redis)
tech_stack:
  - PostgreSQL 15.3
  - pgvector for embeddings
  - pg_cron for scheduled jobs
deployments:
  - platform: Supabase
    url: postgresql://...
    environment_vars:
      - DATABASE_URL
    notes: Managed PostgreSQL with automatic backups
external_dependencies:
  - Supabase for managed hosting
  - pgvector extension for vector similarity search
\`\`\`

## Component Types

### Application (app)
End-user facing applications:
- Web applications
- Mobile apps
- Desktop applications
- CLI tools

### Service (service)
Backend services:
- REST APIs
- GraphQL APIs
- WebSocket servers
- Background workers
- Microservices

### Library (library)
Shared code:
- Component libraries
- Utility libraries
- SDK packages
- Internal frameworks

## Tech Stack Documentation

List specific versions when helpful:

\`\`\`yaml
tech_stack:
  - Next.js 14.1.0  # Specific version for framework
  - React 18        # Major version for library
  - TypeScript      # No version for language
  - TailwindCSS 3.4
  - Prisma ORM 5.1
\`\`\`

## Deployment Configuration

Document how and where it's deployed:

\`\`\`yaml
deployments:
  # Production deployment
  - platform: Vercel
    url: https://app.example.com
    build_command: pnpm build
    environment_vars:
      - API_URL
      - AUTH_DOMAIN
    secrets:
      - STRIPE_SECRET_KEY
    notes: Auto-deploys on push to main

  # Staging deployment
  - platform: Vercel
    url: https://staging.example.com
    build_command: pnpm build
    environment_vars:
      - API_URL
      - AUTH_DOMAIN
    notes: Auto-deploys on push to develop branch
\`\`\`

## Dependencies

### Internal Dependencies (depends_on)
\`\`\`yaml
depends_on:
  - cmp-002-api-service    # This component needs the API
  - cmp-005-ui-library     # Uses shared UI components
\`\`\`

### External Dependencies
\`\`\`yaml
external_dependencies:
  - Stripe for payment processing
  - SendGrid for transactional emails
  - AWS S3 for file storage
  - Sentry for error tracking
\`\`\`

## Scope Definition

Be explicit about boundaries:

\`\`\`yaml
scope:
  in_scope:
    - User-facing features
    - Public API endpoints
    - User authentication
  out_of_scope:
    - Admin features (in admin-app component)
    - Internal APIs (in internal-api component)
    - Background processing (in worker component)
\`\`\`

## Best Practices

### One Component per Major Piece
Don't create components for everything, but do create them for major architectural pieces.

### Document the "Why"
\`\`\`yaml
description: |
  Separate admin application for internal tools.
  Split from main app to:
  - Keep bundle size small for end users
  - Allow different authentication (internal SSO)
  - Enable admin-specific features without bloating main app
\`\`\`

### Keep Tech Stack Current
Update tech stack versions when you upgrade:
\`\`\`yaml
# Update during upgrades
tech_stack:
  - React 18.2  # ← Updated from 18.1
  - Next.js 14  # ← Updated from 13
\`\`\`

### Link to Decisions
\`\`\`yaml
references:
  - type: other
    name: Framework Choice
    description: See dec-001-use-nextjs for why Next.js was chosen
\`\`\`

### Document Development Setup
\`\`\`yaml
dev_port: 3000
notes: |
  Run \`npm dev\` to start development server.
  Requires DATABASE_URL and REDIS_URL in .env file.
  See API component README for setup instructions.
\`\`\`

## Monorepo Organization

For monorepo projects, use folder paths:

\`\`\`yaml
# Web app
folder: apps/web

# API service
folder: apps/api

# Shared UI library
folder: libs/ui

# Database (no folder, external)
folder: null
\`\`\`

## Related Guides

- See [Decision Guide](spec-mcp://guide/decision) for documenting technology choices
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use Components
- View the [Component Schema](spec-mcp://schema/component) for complete field reference
`,
	},
	{
		uri: "spec-mcp://guide/constitution",
		name: "Constitution Guide",
		description:
			"When and how to use Constitutions to establish project principles",
		mimeType: "text/markdown",
		content: `# Constitution Guide

**Goal**: Understand when and how to use Constitutions to establish project principles.

## What is a Constitution?

A Constitution establishes project-wide principles, standards, and guidelines that govern all development decisions. Think of it as your project's "code of laws" - a set of articles that define how things should be done.

## When to Use a Constitution

✅ **Use a Constitution for:**
- Establishing coding standards and conventions
- Defining architectural principles
- Setting API design guidelines
- Documenting testing requirements
- Codifying team processes
- Establishing quality standards

❌ **Don't use a Constitution for:**
- Specific technical decisions (use Decision instead)
- Project requirements (use BRD/PRD instead)
- Implementation tasks (use Plan instead)

## Key Components

### Required Fields
- **Articles**: Individual principles that make up the constitution (minimum 1)

### Article Fields
- **Title**: Name of the principle
- **Principle**: The core rule or guideline
- **Rationale**: Why this principle exists
- **Examples**: Concrete demonstrations (optional)
- **Exceptions**: When this doesn't apply (optional)
- **Status**: needs-review, active, or archived

## Common Patterns

### API Design Constitution
\`\`\`yaml
title: API Design Principles
description: |
  Core principles and standards for all API design in our platform.
  These ensure consistency, predictability, and excellent developer experience.
articles:
  - id: art-001
    title: RESTful Resource Naming
    principle: Use plural nouns for resource collections
    rationale: |
      Creates predictable, consistent API endpoints. Developers
      intuitively understand that /users returns multiple users
      and /users/123 returns one user.
    examples:
      - "GET /users - List all users"
      - "GET /users/123 - Get one user"
      - "POST /users - Create user"
    exceptions:
      - Singleton resources like /profile can use singular
      - Action endpoints like /users/123/activate are acceptable
    status: active

  - id: art-002
    title: Consistent Error Responses
    principle: All errors must follow RFC 7807 Problem Details format
    rationale: |
      Standardized error format makes it easy for clients to
      handle errors consistently across all endpoints.
    examples:
      - |
        {
          "type": "https://api.example.com/errors/validation-error",
          "title": "Validation Error",
          "status": 400,
          "detail": "Email field is required",
          "instance": "/users"
        }
    status: active

  - id: art-003
    title: Versioning Strategy
    principle: Use URL path versioning (e.g., /v1/users)
    rationale: |
      Makes versioning explicit and easy to understand.
      Allows running multiple versions simultaneously during migrations.
    examples:
      - "/v1/users - Version 1"
      - "/v2/users - Version 2"
    exceptions:
      - Internal APIs may use header versioning if needed
    status: active
\`\`\`

### Code Style Constitution
\`\`\`yaml
title: Code Style and Quality Standards
description: |
  Standards for code quality, style, and best practices across all projects.
articles:
  - id: art-001
    title: Function Length Limit
    principle: Functions should be under 50 lines
    rationale: |
      Short functions are easier to understand, test, and maintain.
      If a function exceeds 50 lines, it likely has multiple responsibilities.
    examples:
      - "Extract helper functions"
      - "Split into smaller, focused functions"
    exceptions:
      - Configuration objects or large switch statements
    status: active

  - id: art-002
    title: Test Coverage Requirement
    principle: All new code must have 80%+ test coverage
    rationale: |
      High test coverage catches bugs early and enables confident refactoring.
    examples:
      - "Write unit tests for business logic"
      - "Write integration tests for API endpoints"
    exceptions:
      - Prototype/spike code marked as experimental
    status: active

  - id: art-003
    title: No Magic Numbers
    principle: Use named constants instead of magic numbers
    rationale: |
      Named constants make code self-documenting and easier to maintain.
    examples:
      - "const MAX_RETRIES = 3 (not just 3)"
      - "const CACHE_TTL_SECONDS = 3600"
    status: active
\`\`\`

### Architecture Constitution
\`\`\`yaml
title: Architecture Principles
description: |
  Core architectural principles that guide all technical decisions.
articles:
  - id: art-001
    title: Library-First Principle
    principle: Prefer libraries over frameworks when possible
    rationale: |
      Libraries give us more control and flexibility.
      Frameworks can lock us into specific patterns.
    examples:
      - "Use Express (library) over NestJS (framework)"
      - "Use React (library) over Angular (framework)"
    exceptions:
      - When framework benefits clearly outweigh flexibility costs
    status: active

  - id: art-002
    title: Database per Service
    principle: Each microservice owns its own database
    rationale: |
      Ensures loose coupling and independent deployment.
      Prevents shared database bottlenecks.
    examples:
      - "User service has users_db"
      - "Order service has orders_db"
    exceptions:
      - Read-only replicas can be shared for reporting
    status: active

  - id: art-003
    title: No Synchronous Service-to-Service Calls
    principle: Services communicate via async events, not direct HTTP calls
    rationale: |
      Async communication prevents cascading failures and improves resilience.
    examples:
      - "Use message queue for service communication"
      - "Publish events, don't call other services directly"
    exceptions:
      - API Gateway can call services synchronously
    status: active
\`\`\`

## Article Status

### needs-review
New principles that haven't been approved yet:
\`\`\`yaml
status: needs-review
\`\`\`

### active
Approved principles in use:
\`\`\`yaml
status: active
\`\`\`

### archived
Old principles no longer relevant:
\`\`\`yaml
- id: art-999
  title: Use jQuery for DOM Manipulation
  principle: All DOM manipulation must use jQuery
  status: archived  # ← No longer relevant
\`\`\`

## Writing Effective Articles

### Be Specific
❌ Bad: "Write good code"
✅ Good: "Functions should have a single, clear purpose (Single Responsibility Principle)"

### Explain the Why
\`\`\`yaml
principle: All API responses must include request ID
rationale: |
  Request IDs enable:
  - Tracing requests across services
  - Debugging issues reported by users
  - Correlating logs and metrics
\`\`\`

### Provide Examples
\`\`\`yaml
examples:
  - "✅ Good: const userId = user.id"
  - "❌ Bad: const x = user.id"
\`\`\`

### Document Exceptions
\`\`\`yaml
exceptions:
  - Prototype code marked as @experimental
  - Generated code from tools
  - Third-party library code
\`\`\`

## Constitution vs Decision

**Constitution**: General principles that apply broadly
- "Use TypeScript for all new code"
- "API responses must be JSON"
- "Functions should be pure when possible"

**Decision**: Specific choices for particular situations
- "Use PostgreSQL for the user database" (not MongoDB)
- "Deploy to Vercel" (not AWS)
- "Use JWT tokens" (not sessions)

## Best Practices

### Start Small
Begin with 3-5 core principles. Add more as needs emerge.

### Get Team Buy-In
\`\`\`yaml
status: needs-review  # ← Start here, discuss with team
# After discussion:
status: active
\`\`\`

### Review Regularly
Archive outdated principles:
\`\`\`yaml
- id: art-old
  title: Support IE 11
  principle: All code must work in IE 11
  status: archived  # ← IE 11 is no longer supported
\`\`\`

### Link to Decisions
\`\`\`yaml
references:
  - type: other
    name: TypeScript Adoption Decision
    description: See dec-005-adopt-typescript for the decision to use TypeScript
\`\`\`

### Make it Discoverable
Put constitution where team can find it:
\`\`\`yaml
references:
  - type: file
    name: Contributing Guide
    path: CONTRIBUTING.md
    description: Link to constitution from contributing guide
\`\`\`

## Common Constitution Types

### API Design
- Endpoint naming conventions
- Error response formats
- Versioning strategy
- Authentication patterns
- Rate limiting policies

### Code Quality
- Testing requirements
- Code review standards
- Documentation requirements
- Naming conventions
- Function/file size limits

### Architecture
- Service boundaries
- Data ownership
- Communication patterns
- Deployment standards
- Technology choices

### Process
- Git workflow
- Release process
- Code review process
- Documentation requirements
- Definition of done

## Related Guides

- See [Decision Guide](spec-mcp://guide/decision) for specific technical choices
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use Constitutions
- View the [Constitution Schema](spec-mcp://schema/constitution) for complete field reference
`,
	},
	{
		uri: "spec-mcp://guide/milestone",
		name: "Milestone Guide",
		description: "When and how to use Milestones to organize releases",
		mimeType: "text/markdown",
		content: `# Milestone Guide

**Goal**: Understand when and how to use Milestones to organize releases.

## What is a Milestone?

A Milestone represents a release or deliverable that groups related work together. It provides a target date, organizes plans and specs, and tracks progress toward a release goal.

## When to Use a Milestone

✅ **Use a Milestone for:**
- Planning releases (v1.0, v2.0, Q1 Release)
- Organizing sprints or iterations
- Grouping related work into deliverables
- Tracking progress toward a launch date
- Setting deadlines for features

❌ **Don't use a Milestone for:**
- Individual features (use Plan instead)
- Technical decisions (use Decision instead)
- Ongoing work with no target date

## Key Components

### Required Fields
- **Title**: Name of the milestone
- **Description**: What this milestone represents

### Optional But Valuable
- **Target Date**: When you aim to complete this
- **References**: Release plans, marketing docs, roadmaps

## Common Patterns

### Version Release Milestone
\`\`\`yaml
title: Version 2.0 Launch
description: |
  Major platform release including:
  - New authentication system with OAuth
  - API v2 with improved rate limiting
  - Performance improvements (50% faster)
  - New user dashboard UI
  - Mobile app support
target_date: "2024-12-31T23:59:59Z"
references:
  - type: url
    name: V2 Launch Plan
    url: https://docs.example.com/v2-launch
    description: Detailed launch plan and timeline
  - type: file
    name: Marketing Plan
    path: docs/marketing/v2-launch.md
    description: Marketing and communications plan
\`\`\`

### Quarterly Release Milestone
\`\`\`yaml
title: Q1 2024 Release
description: |
  First quarter release focusing on:
  - Bug fixes from Q4
  - Performance optimizations
  - Minor feature improvements
target_date: "2024-03-31T23:59:59Z"
\`\`\`

### Feature Bundle Milestone
\`\`\`yaml
title: Enterprise Features Pack
description: |
  Bundle of enterprise features for enterprise tier:
  - SSO integration
  - Advanced analytics
  - Team management
  - API access controls
target_date: "2024-06-30T23:59:59Z"
\`\`\`

### Sprint Milestone
\`\`\`yaml
title: Sprint 23 - Authentication
description: |
  Two-week sprint focused on authentication improvements:
  - Password reset flow
  - Email verification
  - Session management
target_date: "2024-02-15T23:59:59Z"
\`\`\`

## Linking Plans to Milestones

Plans reference milestones:

\`\`\`yaml
# In a Plan
title: Implement OAuth Integration
milestones:
  - mls-001-v2-launch  # ← Links to milestone
\`\`\`

This creates the connection between implementation work and releases.

## Tracking Progress

Use the \`query_specs\` tool to track milestone progress:

\`\`\`typescript
// Find all plans for a milestone
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch"
})

// Check completion status
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch",
  completed: true
})

// Find blocked work
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch",
  status: ["blocked"]
})
\`\`\`

## Target Dates

Use ISO 8601 format:

\`\`\`yaml
# End of day
target_date: "2024-12-31T23:59:59Z"

# Specific time
target_date: "2024-06-15T14:00:00Z"

# No specific date yet
target_date: null
\`\`\`

## Best Practices

### Keep Milestones Focused
❌ Bad: One milestone for the entire year
✅ Good: Quarterly or monthly milestones

### Set Realistic Dates
Consider:
- Dependencies between work items
- Team capacity
- Buffer time for unexpected issues
- Testing and deployment time

### Include Buffer Time
\`\`\`yaml
# Feature work: Feb 1-28
# Testing: Mar 1-7
# Launch prep: Mar 8-14
target_date: "2024-03-15T23:59:59Z"  # ← Includes 2-week buffer
\`\`\`

### Update as Needed
If timeline slips, update the milestone:
\`\`\`yaml
# Original
target_date: "2024-06-30T23:59:59Z"

# Updated after scope change
target_date: "2024-07-31T23:59:59Z"
\`\`\`

### Link to External Plans
\`\`\`yaml
references:
  - type: url
    name: Release Checklist
    url: https://docs.example.com/release-checklist
    description: Step-by-step release process

  - type: file
    name: Go-to-Market Plan
    path: docs/gtm/v2-launch.md
    description: Marketing and sales plan for launch
\`\`\`

### Group Related Work
A milestone should group work that:
- Ships together
- Depends on each other
- Targets the same date
- Serves a common goal

## Milestone Hierarchy

Milestones can represent different levels:

### Release Milestones
\`\`\`yaml
mls-001-v2-0-launch
mls-002-v2-1-patch
mls-003-v3-0-launch
\`\`\`

### Sprint Milestones
\`\`\`yaml
mls-101-sprint-23
mls-102-sprint-24
mls-103-sprint-25
\`\`\`

### Theme Milestones
\`\`\`yaml
mls-201-performance-quarter
mls-202-security-hardening
mls-203-mobile-experience
\`\`\`

## Completing Milestones

When all linked plans are completed:

1. Verify all work is done:
\`\`\`typescript
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch",
  completed: false  // Should return 0
})
\`\`\`

2. Mark milestone as completed (via system or manually)

3. Create retrospective documentation:
\`\`\`yaml
references:
  - type: file
    name: V2 Launch Retrospective
    path: docs/retros/v2-launch.md
    description: Lessons learned from v2 launch
\`\`\`

## Common Milestone Patterns

### Major Version Release
- 3-6 months timeline
- Multiple features and improvements
- Breaking changes possible
- Marketing push
- Documentation overhaul

### Minor Version Release
- 1-2 months timeline
- New features, no breaking changes
- Bug fixes
- Performance improvements

### Patch Release
- 1-2 weeks timeline
- Bug fixes only
- Security patches
- Small improvements

### Sprint Release
- 1-2 weeks timeline
- Agile/Scrum sprint
- Incremental progress
- Regular cadence

## Related Guides

- See [Plan Guide](spec-mcp://guide/plan) for linking plans to milestones
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use Milestones
- View the [Milestone Schema](spec-mcp://schema/milestone) for complete field reference
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
		uri: "spec-mcp://guide/spec-relationships",
		name: "Spec Relationships",
		description: "How different spec types connect and reference each other",
		mimeType: "text/markdown",
		content: `# Spec Relationships Guide

**Goal**: Understand how different spec types connect and reference each other.

## Overview

Specs in spec-mcp form a web of interconnected documentation. Understanding how specs relate helps you navigate the system and maintain consistency.

## Core Relationships

### BRD → PRD → Plan
The most common flow:

\`\`\`
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
description: Implement JWT authentication as specified in brd-001-user-auth
technical_context: Need secure, stateless authentication

# pln-001-implement-auth.yml
title: Implement User Authentication
criteria:
  requirement: brd-001-user-auth  # ← Links to BRD
  criteria: crit-001
\`\`\`

### Decision → Multiple Specs
Decisions can influence any spec type:

\`\`\`
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
\`\`\`

### Constitution → All Work
Constitutions apply across all specs:

\`\`\`
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
\`\`\`

### Component → Plans
Plans reference which components they modify:

\`\`\`
Component (CMP)
├─ "Web Application"
│
└─> Plans
    ├─ pln-001-add-dashboard (modifies Web Application)
    ├─ pln-002-auth-ui (modifies Web Application)
    └─> pln-003-optimize-bundle (modifies Web Application)
\`\`\`

### Milestone → Plans
Milestones group related plans:

\`\`\`
Milestone (MLS)
├─ "v2.0 Launch"
│
└─> Plans
    ├─ pln-001-implement-auth
    ├─ pln-002-new-dashboard
    ├─> pln-003-api-v2
\`\`\`

## Reference Types

### Via ID References
Direct references using spec IDs:

\`\`\`yaml
# In a Plan
criteria:
  requirement: brd-001-user-auth  # ← References BRD by ID
  criteria: crit-001

depends_on:
  - pln-001-database-setup  # ← References another Plan

milestones:
  - mls-001-v2-launch  # ← References Milestone
\`\`\`

### Via References Field
All spec types support a \`references\` array:

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
    description: Current authentication implementation
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

**Example: Password Reset Feature**
\`\`\`
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
\`\`\`

### Architecture Documentation
\`\`\`
Constitution: Architecture Principles
  ↓ (guides)
Decision: Specific Architectural Choices
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
Test Cases (test-001, test-002)
\`\`\`

### Backward Traceability
From code to business justification:

\`\`\`
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
\`\`\`

## Dependency Management

### Task Dependencies
\`\`\`yaml
# In a Plan
tasks:
  - id: task-001
    task: Setup database schema
    status: completed

  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]  # ← Can't start until task-001 done
    status: pending
\`\`\`

### Plan Dependencies
\`\`\`yaml
# Plan A
title: Setup Infrastructure

# Plan B
title: Deploy Application
depends_on:
  - pln-001-setup-infrastructure  # ← Must complete Plan A first
\`\`\`

### Component Dependencies
\`\`\`yaml
# Web App Component
depends_on:
  - cmp-002-api-service    # Needs the API
  - cmp-003-auth-service   # Needs auth
\`\`\`

## Supersession (Versioning)

When specs evolve, create new versions:

\`\`\`yaml
# Original
dec-001-use-mongodb
decision_status: superseded  # ← Marked as replaced

# New version
dec-002-use-postgresql
supersedes: dec-001-use-mongodb  # ← References what it replaces
decision_status: accepted
\`\`\`

This preserves history while documenting evolution.

## Querying Relationships

Use \`query_specs\` to find related specs:

\`\`\`typescript
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
\`\`\`

## Best Practices

### Keep References Updated
When specs change, update references:
\`\`\`yaml
# Old
references:
  - name: Old Design Doc
    url: https://old-link.com

# Updated
references:
  - name: Updated Design Doc
    url: https://new-link.com
    description: Updated after design review
\`\`\`

### Link Bidirectionally When Helpful
\`\`\`yaml
# In BRD
references:
  - type: other
    name: Implementation Plan
    description: See pln-001-implement-auth for implementation

# In Plan
criteria:
  requirement: brd-001-user-auth  # ← Links back to BRD
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
    description: Following these security best practices for implementation
\`\`\`

## Related Guides

- See individual spec type guides for specific relationship patterns
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for which specs to create
- Use the \`query_specs\` tool to explore relationships in your project
`,
	},
	{
		uri: "spec-mcp://guide/getting-started",
		name: "Getting Started",
		description: "Quick start guide for spec-driven development",
		mimeType: "text/markdown",
		content: `# Getting Started

**Goal**: Get up and running with spec-mcp and create your first spec.

## Quick Setup

### Installation

Install spec-mcp in your project:

\`\`\`bash
npx @spec-mcp/cli init
\`\`\`

This creates a \`./specs\` directory with folders for each spec type.

### Configure Your MCP Client

Add spec-mcp to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "npx",
      "args": ["-y", "@spec-mcp/cli", "server"]
    }
  }
}
\`\`\`

### Verify Installation

Check that the server is accessible:

\`\`\`bash
# List available tools
npx @spec-mcp/cli tools

# Create your first spec
npx @spec-mcp/cli draft plan
\`\`\`

## Your First Spec: A Simple Plan

Let's create a plan for adding a new feature.

### Step 1: Start a Draft

\`\`\`
Create a new plan for implementing user profile editing
\`\`\`

Claude will guide you through the draft workflow, asking questions like:
- What's the title?
- What does this plan accomplish?
- What criteria does it fulfill?
- What's in scope?
- What tasks are needed?

### Step 2: Answer Questions

\`\`\`yaml
Title: Implement User Profile Editing
Description: Allow users to update their profile information
Criteria:
  requirement: brd-001-user-profiles
  criteria: crit-003
Scope:
  in_scope:
    - Edit name and email
    - Profile photo upload
    - Save and cancel actions
  out_of_scope:
    - Password changes
    - Account deletion
\`\`\`

### Step 3: Add Tasks

\`\`\`yaml
tasks:
  - task: Create profile edit form UI
    priority: high

  - task: Add profile update API endpoint
    priority: high

  - task: Implement photo upload to cloud storage
    depends_on: [task-002]
    priority: medium

  - task: Add validation and error handling
    depends_on: [task-001, task-002]
    priority: high
\`\`\`

### Step 4: Review and Save

Claude will finalize the spec and save it to \`./specs/plans/pln-001-implement-user-profile-editing.yml\`.

## Understanding Spec Types

### When to Create Each Type

\`\`\`
Business need? → BRD (Business Requirement)
Technical approach? → PRD (Technical Requirement)
Important choice? → Decision
Implementation work? → Plan
System architecture? → Component
Team standards? → Constitution
Release grouping? → Milestone
\`\`\`

### Common Starting Points

**For new features:**
1. BRD - Capture what users need
2. PRD - Define technical approach
3. Plan - Break down implementation

**For technical work:**
1. PRD - Define technical requirements
2. Decision - Document key choices
3. Plan - Organize tasks

**For architecture:**
1. Component - Define system pieces
2. Decision - Document architectural choices
3. Constitution - Establish principles

## Working with Existing Specs

### List Your Specs

\`\`\`
Show me all plans
Show me all specs related to authentication
What work is pending?
\`\`\`

### Query and Filter

\`\`\`
Show me all high-priority plans
What's in the v2.0 milestone?
Which tasks are blocked?
\`\`\`

### Update Specs

\`\`\`
Add a new task to pln-001
Update the scope of pln-002
Mark task-005 as completed
\`\`\`

### Get Spec Details

\`\`\`
Show me pln-001
What are the acceptance criteria for brd-001?
Which plans depend on pln-003?
\`\`\`

## Draft Workflow

The draft workflow is interactive and guided:

1. **Start**: Create a draft of any spec type
2. **Answer**: Respond to questions about the spec
3. **Review**: Claude generates the complete spec
4. **Save**: Spec is saved and ready to use

You can:
- Skip optional questions
- Provide detailed or brief answers
- Ask for clarification
- Restart if needed

## Common Workflows

### Feature Planning

\`\`\`
1. "Create a BRD for user notifications"
2. "Create a PRD for push notification implementation"
3. "Create a plan to implement notifications"
4. "Add this plan to milestone mls-001-mobile-launch"
\`\`\`

### Task Execution

\`\`\`
1. "Show me next tasks to work on"
2. "Start task-001 in pln-001"
3. "Mark task-001 as completed: Implemented the database schema"
4. "Start task-002"
\`\`\`

### Progress Tracking

\`\`\`
1. "Show me all in-progress tasks"
2. "What's the status of pln-001?"
3. "Which plans are blocked?"
4. "Show me completed work this week"
\`\`\`

## File Structure

\`\`\`
./specs/
├── business-requirements/
│   ├── brd-001-user-profiles.yml
│   └── brd-002-notifications.yml
├── technical-requirements/
│   ├── prd-001-profile-api.yml
│   └── prd-002-push-notifications.yml
├── plans/
│   ├── pln-001-implement-user-profile-editing.yml
│   └── pln-002-notification-system.yml
├── decisions/
│   ├── dec-001-use-postgres.yml
│   └── dec-002-use-firebase-messaging.yml
├── components/
│   ├── cmp-001-web-app.yml
│   └── cmp-002-mobile-app.yml
├── constitutions/
│   └── cst-001-api-design-principles.yml
└── milestones/
    └── mls-001-mobile-launch.yml
\`\`\`

## Best Practices from Day One

### Keep It Simple
Start with minimal specs. Add detail as needed.

❌ Don't: Create a 50-task plan for a simple feature
✅ Do: Start with 3-5 key tasks, split if it grows

### Link Things Together
Connect specs to maintain traceability.

\`\`\`yaml
# In a Plan
criteria:
  requirement: brd-001-profiles  # ← Links to business need
  criteria: crit-003
\`\`\`

### Update as You Go
Keep specs current with implementation.

\`\`\`
"Mark task-001 as completed"
"Update pln-001 scope to exclude mobile app"
"Add a note to task-003 about the API change"
\`\`\`

### Use Descriptive Names
Make IDs and titles clear.

❌ Bad: \`pln-001-stuff\`
✅ Good: \`pln-001-implement-user-profile-editing\`

## Tips for Success

### Start Small
Don't spec everything upfront. Create specs as you need them.

### Be Consistent
Follow the same patterns for similar work.

### Ask Questions
Use Claude to help:
\`\`\`
"What spec type should I use for this?"
"How do I link a plan to a BRD?"
"Show me examples of good task descriptions"
\`\`\`

### Review Examples
Look at existing specs in your project for patterns.

\`\`\`
"Show me how other plans define test cases"
"What does a good BRD look like?"
\`\`\`

## Next Steps

Now that you're set up:

1. **Learn Workflows**: See [Planning Workflow](spec-mcp://guide/planning-workflow) and [Implementation Workflow](spec-mcp://guide/implementation-workflow)

2. **Understand Spec Types**: Read [Choosing Spec Types](spec-mcp://guide/choosing-spec-types)

3. **Best Practices**: Check [Best Practices](spec-mcp://guide/best-practices)

4. **Query Data**: Learn [Query Guide](spec-mcp://guide/query-guide)

5. **Spec Details**: See individual guides:
   - [Plan Guide](spec-mcp://guide/plan)
   - [BRD Guide](spec-mcp://guide/business-requirement)
   - [Decision Guide](spec-mcp://guide/decision)

## Getting Help

\`\`\`
"How do I create a decision?"
"Show me the plan schema"
"What tools are available?"
"Explain spec relationships"
\`\`\`

Claude can answer questions and guide you through any workflow.
`,
	},
	{
		uri: "spec-mcp://guide/planning-workflow",
		name: "Planning Workflow",
		description: "Complete workflow for planning features with specs",
		mimeType: "text/markdown",
		content: `# Planning Workflow

**Goal**: Learn the complete workflow for planning features using specs, from initial idea to ready-to-implement plans.

## Overview

The planning workflow transforms ideas into actionable implementation plans through a structured process:

\`\`\`
Idea/Request
  ↓
Business Requirement (BRD)
  ↓
Technical Requirement (PRD)
  ↓
Decisions (if needed)
  ↓
Implementation Plan
  ↓
Ready to Implement
\`\`\`

## Complete Feature Planning Flow

### Phase 1: Capture Business Need

**Create a Business Requirement (BRD)**

\`\`\`
Create a BRD for user notifications
\`\`\`

Claude will guide you through:

**Questions:**
- What's the business need?
- Who are the stakeholders?
- What's the business value?
- What are the user stories?
- What are the acceptance criteria?

**Example Answers:**
\`\`\`yaml
title: User Notifications System
description: Users need to receive timely notifications about account activity

stakeholders:
  - role: product-owner
    name: Jane Smith
    interest: Increase user engagement and retention

business_value:
  - type: customer-satisfaction
    value: Users stay informed of important events
  - type: revenue
    value: Increased engagement leads to 15% higher conversion

user_stories:
  - role: registered user
    feature: receive notifications about account activity
    benefit: I stay informed without checking the app constantly

  - role: premium user
    feature: customize notification preferences
    benefit: I only get notifications I care about

criteria:
  - description: Users receive email notifications within 5 minutes
    rationale: Timely notifications are critical for user experience

  - description: Users can disable notifications per category
    rationale: User control improves satisfaction
\`\`\`

**Result:** \`./specs/business-requirements/brd-001-user-notifications.yml\`

### Phase 2: Define Technical Approach

**Create a Technical Requirement (PRD)**

\`\`\`
Create a PRD for implementing the notification system from brd-001
\`\`\`

Claude will ask:

**Questions:**
- What's the technical context?
- What's the implementation approach?
- What are the technical constraints?
- What are the technical dependencies?
- What are the acceptance criteria?

**Example Answers:**
\`\`\`yaml
title: Push and Email Notification Infrastructure
description: Technical implementation of notification system

technical_context: |
  Need scalable notification delivery supporting multiple channels
  (email, push, SMS). Must handle high volume during peak hours.

implementation_approach: |
  - Use message queue (RabbitMQ) for async delivery
  - Email via SendGrid API
  - Push notifications via Firebase Cloud Messaging
  - Database table for notification preferences and history

constraints:
  - type: performance
    description: Deliver 95% of notifications within 5 minutes

  - type: scalability
    description: Handle 10,000 notifications per minute

technical_dependencies:
  - type: url
    name: SendGrid API
    url: https://sendgrid.com/docs
    description: Email delivery service

  - type: url
    name: Firebase Cloud Messaging
    url: https://firebase.google.com/docs/cloud-messaging
    description: Push notification service

criteria:
  - description: Notification queue processes without data loss
    rationale: Reliability is critical for user trust

  - description: Failed deliveries retry with exponential backoff
    rationale: Handle temporary service outages gracefully
\`\`\`

**Result:** \`./specs/technical-requirements/prd-001-notification-infrastructure.yml\`

### Phase 3: Document Key Decisions

**Create Decisions for significant choices**

\`\`\`
Create a decision for choosing Firebase over OneSignal for push notifications
\`\`\`

**Example:**
\`\`\`yaml
title: Use Firebase Cloud Messaging for Push Notifications
decision: Implement push notifications using Firebase Cloud Messaging (FCM)

context: |
  Need a reliable push notification service for iOS and Android.
  Evaluated Firebase, OneSignal, and AWS SNS.

alternatives:
  - OneSignal: Simpler setup but vendor lock-in concerns
  - AWS SNS: More control but complex setup and higher cost

consequences:
  - type: positive
    description: Free tier covers expected volume for first year

  - type: positive
    description: Excellent documentation and community support

  - type: negative
    description: Vendor lock-in to Google ecosystem
    mitigation: Abstract notification logic behind interface

  - type: risk
    description: Future pricing changes could impact costs
    mitigation: Monitor usage and have migration plan ready
\`\`\`

**Result:** \`./specs/decisions/dec-001-use-firebase-messaging.yml\`

### Phase 4: Create Implementation Plan

**Create a Plan linking to requirements**

\`\`\`
Create a plan to implement the notification system from prd-001
\`\`\`

Claude will ask:

**Questions:**
- What's the scope?
- What tasks are needed?
- What are the dependencies?
- What test cases verify it works?
- What API contracts are involved?
- What data models are needed?

**Example Answers:**
\`\`\`yaml
title: Implement Notification System
description: Build notification infrastructure with email and push support

criteria:
  requirement: brd-001-user-notifications
  criteria: crit-001

scope:
  - type: in-scope
    description: Email notifications via SendGrid

  - type: in-scope
    description: Push notifications via Firebase

  - type: in-scope
    description: User preference management

  - type: out-of-scope
    description: SMS notifications (future phase)

  - type: out-of-scope
    description: In-app notification UI (separate plan)

tasks:
  - id: task-001
    task: Setup RabbitMQ message queue infrastructure
    priority: critical

  - id: task-002
    task: Create notification service worker
    depends_on: [task-001]
    priority: critical

  - id: task-003
    task: Integrate SendGrid for email delivery
    depends_on: [task-002]
    priority: high

  - id: task-004
    task: Integrate Firebase for push notifications
    depends_on: [task-002]
    priority: high

  - id: task-005
    task: Build user notification preferences API
    priority: high

  - id: task-006
    task: Create notification templates
    depends_on: [task-003, task-004]
    priority: medium

  - id: task-007
    task: Implement retry logic and error handling
    depends_on: [task-003, task-004]
    priority: high

test_cases:
  - name: Email notification delivery
    description: Verify emails are sent and delivered
    steps:
      - Trigger notification event
      - Verify message queued
      - Verify email sent via SendGrid
      - Verify user receives email
    expected_result: Email delivered within 5 minutes

  - name: User preference respect
    description: Verify preferences are honored
    steps:
      - User disables email notifications
      - Trigger notification event
      - Verify no email sent
      - Verify push notification still sent
    expected_result: Only enabled channels receive notification

api_contracts:
  - name: POST /api/notifications/preferences
    contract_type: rest
    specification: |
      POST /api/notifications/preferences

      Request:
      {
        "userId": "string",
        "email": { "enabled": boolean, "categories": ["string"] },
        "push": { "enabled": boolean, "categories": ["string"] }
      }

      Response: 200 OK
      { "success": true }

data_models:
  - name: NotificationPreference
    format: typescript
    schema: |
      interface NotificationPreference {
        id: string;
        userId: string;
        email: {
          enabled: boolean;
          categories: string[];
        };
        push: {
          enabled: boolean;
          categories: string[];
        };
        updatedAt: Date;
      }
\`\`\`

**Result:** \`./specs/plans/pln-001-implement-notification-system.yml\`

### Phase 5: Link to Milestone

**Add plan to release milestone**

\`\`\`
Add pln-001 to milestone mls-001-v2-launch
\`\`\`

This connects the work to your release planning.

## Planning Patterns by Situation

### New Feature

\`\`\`
1. BRD: Business need
2. PRD: Technical approach
3. Decision: Key technology choices
4. Plan: Implementation tasks
\`\`\`

**Example: Password Reset**
\`\`\`
brd-002-password-reset → "Users need to reset forgotten passwords"
prd-002-email-reset-flow → "Use email-based reset with time-limited tokens"
dec-002-use-jwt-tokens → "Use JWT for reset tokens"
pln-002-implement-reset → "Tasks to build reset flow"
\`\`\`

### Technical Improvement

\`\`\`
1. PRD: Technical motivation
2. Decision: Approach choice
3. Plan: Refactoring tasks
\`\`\`

**Example: Database Migration**
\`\`\`
prd-003-migrate-to-postgres → "Move from MongoDB to PostgreSQL"
dec-003-use-prisma-orm → "Use Prisma for database access"
pln-003-database-migration → "Migration tasks and rollback plan"
\`\`\`

### Bug Fix with Context

\`\`\`
1. PRD (optional): Technical context
2. Plan: Fix tasks
\`\`\`

**Example: Performance Issue**
\`\`\`
prd-004-api-performance → "API response time > 2 seconds"
pln-004-optimize-queries → "Add indexes and optimize queries"
\`\`\`

## Iterative Planning

Plans evolve as you learn more:

### Add Tasks

\`\`\`
Add a task to pln-001: Implement rate limiting on notification API
\`\`\`

### Update Scope

\`\`\`
Update pln-001 scope to exclude SMS notifications
\`\`\`

### Add Dependencies

\`\`\`
Make task-004 depend on task-003 in pln-001
\`\`\`

### Supersede Items

When requirements change:

\`\`\`
Supersede task-003 in pln-001 with a new approach
\`\`\`

This creates a new version while preserving history.

## Planning Checklist

Before marking a plan ready for implementation:

**Business Alignment**
- [ ] Links to BRD acceptance criteria
- [ ] Business value is clear
- [ ] Stakeholders identified

**Technical Clarity**
- [ ] PRD defines technical approach
- [ ] Key decisions documented
- [ ] Constraints identified

**Implementation Ready**
- [ ] Tasks are concrete and actionable
- [ ] Dependencies are clear
- [ ] Priorities are set
- [ ] Scope is well-defined

**Verification**
- [ ] Test cases defined
- [ ] Acceptance criteria testable
- [ ] API contracts specified (if applicable)

**Traceability**
- [ ] Links to BRD/PRD
- [ ] References supporting docs
- [ ] Connected to milestone (if applicable)

## Tips for Effective Planning

### Right-Size Tasks

❌ Too Large: "Build entire notification system"
✅ Good Size: "Integrate SendGrid for email delivery"

Aim for tasks that take 0.5-2 days.

### Clear Dependencies

\`\`\`yaml
tasks:
  - id: task-001
    task: Setup database schema

  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]  # ← Clear dependency
\`\`\`

### Meaningful Scope

**In-Scope:** What you're building
**Out-of-Scope:** What you're explicitly NOT building

This prevents scope creep and aligns expectations.

### Test Early Planning

Write test cases during planning, not after implementation.

\`\`\`yaml
test_cases:
  - name: Notification delivery
    description: User receives notification
    # ← Written during planning
\`\`\`

### Link Everything

\`\`\`yaml
# Plan links to BRD
criteria:
  requirement: brd-001-notifications
  criteria: crit-001

# References related decisions
references:
  - type: other
    name: Technology Choice
    description: See dec-001-use-firebase-messaging
\`\`\`

## Common Planning Workflows

### Solo Developer

\`\`\`
1. Quick BRD (business context)
2. Skip PRD for simple features
3. Detailed Plan with tasks
4. Start implementation
\`\`\`

### Small Team

\`\`\`
1. BRD (collaborate with stakeholders)
2. PRD (technical team review)
3. Decisions (team discusses)
4. Plan (lead developer creates)
5. Review and refine
6. Start implementation
\`\`\`

### Larger Team

\`\`\`
1. BRD (product manager)
2. PRD (tech lead)
3. Decisions (architecture review)
4. Multiple Plans (one per component)
5. Team review and approval
6. Assign to developers
\`\`\`

## Adapting the Workflow

### When to Skip Steps

**Skip BRD if:**
- Internal technical work
- Bug fixes
- Obvious refactoring

**Skip PRD if:**
- Trivial implementation
- Following existing patterns
- Very small features

**Skip Decisions if:**
- Choice is obvious
- Following existing architecture
- Temporary/experimental

### When to Add Steps

**Add more BRDs:**
- Multiple stakeholder groups
- Complex business requirements
- Regulated industries

**Add more PRDs:**
- Complex technical work
- Multiple technical approaches possible
- High-risk implementation

**Add more Decisions:**
- New technology choices
- Architectural changes
- Trade-offs between options

## Related Guides

- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for executing plans
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use each type
- See [Best Practices](spec-mcp://guide/best-practices) for planning tips
- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how specs connect
`,
	},
	{
		uri: "spec-mcp://guide/implementation-workflow",
		name: "Implementation Workflow",
		description: "Development workflow for implementing from specs",
		mimeType: "text/markdown",
		content: `# Implementation Workflow

**Goal**: Learn the workflow for implementing features from plans, tracking progress, and keeping specs synchronized with code.

## Overview

The implementation workflow takes you from a ready plan to shipped code:

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

**Get familiar with what you're building**

\`\`\`
Show me pln-001
\`\`\`

Review:
- **Scope**: What's included and excluded
- **Tasks**: All work items and their dependencies
- **Test Cases**: How to verify it works
- **API Contracts**: Interfaces to implement
- **Data Models**: Schemas to create
- **References**: Supporting documentation

**Check acceptance criteria:**

\`\`\`
Show me the criteria for pln-001
\`\`\`

This tells you what "done" looks like.

### Step 2: Find Next Task

**Query for available work**

\`\`\`
Show me next tasks I can work on in pln-001
\`\`\`

The system returns tasks that:
- Are not started or in-progress
- Have no unsatisfied dependencies
- Are not blocked
- Ordered by priority

**Example response:**
\`\`\`
Available tasks:
- task-001: Setup database schema (priority: critical)
- task-005: Build user preferences API (priority: high)
\`\`\`

### Step 3: Start a Task

**Mark task as started**

\`\`\`
Start task-001 in pln-001
\`\`\`

This:
- Sets \`status.started_at\` timestamp
- Validates dependencies are met
- Adds a timestamped note
- Marks task as \`in-progress\`

**Dependency validation:**

\`\`\`yaml
# This will fail if task-001 isn't completed
Start task-002 in pln-001
# Error: Cannot start task-002. Depends on task-001 (pending)
\`\`\`

### Step 4: Implement

**Write the code**

Refer to the plan's specifications:

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
    format: typescript
    schema: |
      interface User {
        id: string;
        email: string;
        password_hash: string;
      }
\`\`\`

**Test Cases:**
\`\`\`yaml
test_cases:
  - name: Valid login
    steps:
      - Create test user
      - POST to /auth/login
      - Verify 200 response
    expected_result: JWT token returned
\`\`\`

### Step 5: Track Progress

**Add notes to tasks**

\`\`\`
Add note to task-001: Completed database schema, added indexes
\`\`\`

This helps:
- Document progress
- Remember decisions
- Communicate with team
- Debug issues later

**Handle blockers:**

\`\`\`
Block task-003 in pln-001: Waiting for API access credentials
\`\`\`

Documents what's preventing progress.

### Step 6: Complete Task

**Mark task as done**

\`\`\`
Finish task-001 in pln-001: Implemented and tested database schema
\`\`\`

This:
- Sets \`status.completed_at\` timestamp
- Validates dependencies were met
- Adds completion summary
- Marks task as \`completed\`

**Unblocks dependent tasks:**

\`\`\`yaml
# After completing task-001
tasks:
  - id: task-001
    status: completed  # ✓

  - id: task-002
    depends_on: [task-001]
    status: pending  # ← Now available to start
\`\`\`

### Step 7: Verify with Tests

**Run test cases**

\`\`\`
Show me test cases for pln-001
\`\`\`

Execute each test case and update status:

\`\`\`
Mark test case test-001 as passing in pln-001
Mark test case test-002 as implemented in pln-001
\`\`\`

**Track test coverage:**
\`\`\`yaml
test_cases:
  - id: test-001
    implemented: true  # ✓ Code written
    passing: true      # ✓ Test passes
\`\`\`

### Step 8: Complete the Plan

Once all tasks are done:

\`\`\`
Show plan pln-001 completion status
\`\`\`

**Ready to ship when:**
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
    status: completed  # ✓

  - id: task-002
    task: Build API layer
    depends_on: [task-001]
    status: in-progress  # ← Working on this

  - id: task-003
    task: Add caching layer
    depends_on: [task-002]
    status: pending  # ← Blocked until task-002 done
\`\`\`

**Query dependencies:**

\`\`\`
What tasks does task-003 depend on?
Which tasks are blocked by task-002?
\`\`\`

### Parallel Work

Tasks without dependencies can run in parallel:

\`\`\`yaml
tasks:
  - id: task-001
    task: Backend API

  - id: task-005
    task: Frontend UI
    # No depends_on - can work simultaneously
\`\`\`

### Changing Dependencies

If you discover new dependencies:

\`\`\`
Make task-004 depend on task-003 in pln-001
\`\`\`

This updates the plan to reflect reality.

## Handling Blockers

### Types of Blockers

**Task Dependencies:**
\`\`\`
Block task-005: Depends on task-003 which is blocked
\`\`\`

**External Dependencies:**
\`\`\`
Block task-006: Waiting for third-party API access
\`\`\`

**Technical Issues:**
\`\`\`
Block task-007: Performance issue needs architecture review
\`\`\`

### Resolving Blockers

Document the blocker:
\`\`\`yaml
blocked:
  - reason: Waiting for API credentials from vendor
    blocked_at: 2025-01-15T10:00:00Z
    external_dependency: SendGrid API access
\`\`\`

When resolved:
\`\`\`
Unblock task-006 in pln-001: Received API credentials
\`\`\`

## Task Lifecycle

### Status Flow

\`\`\`
pending
  ↓ (start_task)
in-progress
  ↓ (finish_task)
completed
  ↓ (verify)
verified
\`\`\`

### Status Meanings

- **pending**: Not started, waiting for dependencies or assignment
- **in-progress**: Actively being worked on
- **completed**: Implementation done
- **verified**: Tested and confirmed working
- **blocked**: Can't proceed (temporary state)

### Timestamps

Every task tracks:
\`\`\`yaml
status:
  created_at: 2025-01-10T09:00:00Z
  started_at: 2025-01-12T10:00:00Z
  completed_at: 2025-01-15T16:00:00Z
  verified_at: 2025-01-15T17:00:00Z
  notes:
    - "[2025-01-12T10:00:00Z] Started implementation"
    - "[2025-01-13T14:00:00Z] Completed database layer"
    - "[2025-01-15T16:00:00Z] Finished: All tests passing"
\`\`\`

## Updating Plans During Implementation

### Add Missing Tasks

\`\`\`
Add task to pln-001: Add rate limiting middleware
  priority: high
  depends_on: [task-002]
\`\`\`

Plans evolve as you discover work.

### Update Scope

When scope changes:

\`\`\`
Update pln-001 scope: Remove mobile push notifications (moved to pln-002)
\`\`\`

### Supersede Tasks

When approach changes:

\`\`\`
Supersede task-003 with new implementation approach
\`\`\`

Creates new task version, preserving history.

### Add Files to Tasks

Track code changes per task:

\`\`\`yaml
tasks:
  - id: task-001
    task: Implement user authentication
    files:
      - path: src/auth/service.ts
        action: create
        applied: true
      - path: src/auth/routes.ts
        action: create
        applied: true
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
How many tasks are completed vs pending?
What's blocking progress on pln-001?
\`\`\`

## Testing Integration

### Test-Driven Development

1. **Read test cases from plan**
   \`\`\`
   Show test cases for pln-001
   \`\`\`

2. **Write tests first**
   \`\`\`yaml
   test_cases:
     - name: User login with valid credentials
       implemented: false  # ← Not written yet
       passing: false
   \`\`\`

3. **Implement until passing**
   \`\`\`yaml
   test_cases:
     - name: User login with valid credentials
       implemented: true  # ✓ Test written
       passing: true      # ✓ Test passes
   \`\`\`

### Updating Test Cases

Add tests discovered during implementation:

\`\`\`
Add test case to pln-001:
  name: Login with expired credentials
  description: Verify expired credentials are rejected
  expected_result: 401 error with clear message
\`\`\`

## Common Implementation Patterns

### Feature Branch Per Plan

\`\`\`bash
# Create branch from plan ID
git checkout -b feat/pln-001-notifications

# Work on tasks
# ...

# Reference plan in commits
git commit -m "feat: implement email notifications

Completes task-003 from pln-001-notification-system

- Integrated SendGrid API
- Added email templates
- Implemented retry logic"
\`\`\`

### Task-Based Commits

\`\`\`bash
# One commit per task
git commit -m "feat(auth): add JWT middleware (task-001)"
git commit -m "feat(auth): implement login endpoint (task-002)"
git commit -m "test(auth): add login test cases (task-003)"
\`\`\`

### Continuous Updates

Update specs as you implement:

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

Track who's working on what:

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
- Completes tasks: task-001, task-002, task-003

## Test Coverage

- test-001: Email delivery ✓
- test-002: Preference respect ✓
- test-003: Retry logic ✓

## Acceptance Criteria

- [x] Users receive emails within 5 minutes (crit-001)
- [x] Users can disable per category (crit-002)
\`\`\`

### Pair Programming

Update specs together:

\`\`\`
# Navigator: Check what's next
Show next available tasks in pln-001

# Driver: Start the task
Start task-005 in pln-001

# Implement together
# ...

# Driver: Mark complete
Finish task-005: Implemented with pair programming
\`\`\`

## Handling Issues

### Bugs Found During Implementation

Create PRD for context:

\`\`\`
Create PRD for API performance issue discovered in pln-001
\`\`\`

Then plan the fix:

\`\`\`
Create plan to fix API performance (references prd-005)
\`\`\`

### Scope Changes

When requirements change mid-implementation:

\`\`\`
1. Update BRD with new criteria
2. Update PRD with technical changes
3. Update Plan with new tasks
4. Continue implementation
\`\`\`

### Technical Debt

Document shortcuts:

\`\`\`
Add note to task-003: Used quick solution, needs refactoring
  Reference: TODO in src/auth/service.ts line 45
\`\`\`

Create follow-up plan:

\`\`\`
Create plan: Refactor authentication service (tech debt from pln-001)
\`\`\`

## Completion Checklist

Before marking a plan complete:

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
# Throughout implementation
Add note to task-002: Completed email service integration
Add note to task-002: Added error handling
Add note to task-002: Performance testing looks good
Complete task-002: Email service ready for production
\`\`\`

### Use Notes Liberally

Document decisions and discoveries:

\`\`\`
Add note to task-003: Chose Redis over in-memory cache for scalability
Add note to task-004: API rate limit set to 100/min per user
\`\`\`

### Keep Plans Current

If reality diverges from plan:

\`\`\`
Update pln-001 scope: Added SMS notifications (requested by stakeholders)
Add task to pln-001: Implement SMS via Twilio
\`\`\`

### Communicate Progress

Share updates:

\`\`\`
Show completion percentage for pln-001
Show tasks completed this week in pln-001
Show remaining high-priority tasks
\`\`\`

## Related Guides

- See [Planning Workflow](spec-mcp://guide/planning-workflow) for creating plans
- See [Best Practices](spec-mcp://guide/best-practices) for implementation tips
- See [Query Guide](spec-mcp://guide/query-guide) for tracking progress
- See [Plan Guide](spec-mcp://guide/plan) for plan structure details
`,
	},
	{
		uri: "spec-mcp://guide/best-practices",
		name: "Best Practices",
		description:
			"Patterns, anti-patterns, and tips for spec-driven development",
		mimeType: "text/markdown",
		content: `# Best Practices

**Goal**: Learn patterns, anti-patterns, and tips for effective spec-driven development.

## Core Principles

### 1. Documentation as Code

Treat specs like code:
- Version control everything
- Review changes
- Keep them up-to-date
- Refactor when needed

\`\`\`bash
# Commit specs with code
git add specs/plans/pln-001-auth.yml src/auth/
git commit -m "feat: implement authentication (pln-001)"
\`\`\`

### 2. Just Enough Documentation

❌ **Over-Documentation**
\`\`\`yaml
# Don't: Excessive detail for simple tasks
task: Create user model
considerations:
  - Use TypeScript for type safety
  - Follow naming conventions from style guide section 3.2
  - Ensure compatibility with ORM version 2.1.5+
  - Consider future extensibility for profile fields
  - ... (10 more considerations)
\`\`\`

✅ **Right Amount**
\`\`\`yaml
# Do: Essential information only
task: Create user model with email, password, timestamps
considerations:
  - Hash passwords with bcrypt
  - Add unique index on email
\`\`\`

### 3. Living Documentation

Specs evolve with your project:

\`\`\`
# During planning
Create plan for authentication

# During implementation
Add task: Implement password reset
Mark task-001 as completed

# After shipping
Add reference to pln-001: Production metrics dashboard
\`\`\`

## Spec Type Best Practices

### Business Requirements (BRD)

**Focus on outcomes, not solutions**

❌ **Bad**: "Use JWT tokens for authentication"
✅ **Good**: "Users need secure account access"

**Quantify business value**

❌ **Bad**: "Improves user experience"
✅ **Good**: "Reduces support tickets by 40%, saving $20k annually"

**Write for stakeholders**
\`\`\`yaml
business_value:
  - type: revenue
    value: "15% increase in conversions = $50k annual revenue"
  # Not: "Better database performance"
\`\`\`

### Technical Requirements (PRD)

**Be specific about constraints**

❌ **Bad**: "System should be fast"
✅ **Good**: "API response time < 200ms for 95th percentile"

**Document the "why"**
\`\`\`yaml
technical_context: |
  Current authentication is session-based, causing scalability
  issues with horizontal scaling. Need stateless auth for
  multi-region deployment.
\`\`\`

**List real dependencies**
\`\`\`yaml
technical_dependencies:
  - type: url
    name: Auth0 API
    url: https://auth0.com/docs/api
    description: Used for social login integration
\`\`\`

### Plans

**Keep tasks atomic**

❌ **Too Large**: "Build entire authentication system"
✅ **Good Size**: "Implement JWT token generation"
✅ **Good Size**: "Create login API endpoint"
✅ **Good Size**: "Add password hashing with bcrypt"

**Clear dependencies**
\`\`\`yaml
tasks:
  - id: task-001
    task: Create database schema

  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]  # ← Explicit
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

❌ **Incomplete**:
\`\`\`yaml
decision: Use PostgreSQL
\`\`\`

✅ **Complete**:
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

**Use descriptive slugs**

❌ **Bad**: \`pln-001-stuff\`, \`brd-002-thing\`
✅ **Good**: \`pln-001-user-authentication\`, \`brd-002-password-reset\`

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
\`\`\`

## Task Management

### Priority Guidelines

**Critical**: Blocks all other work
\`\`\`yaml
- task: Setup database connection
  priority: critical  # Nothing works without this
\`\`\`

**High**: Important for core functionality
\`\`\`yaml
- task: Implement login endpoint
  priority: high  # Core feature
\`\`\`

**Medium**: Standard work (default)
\`\`\`yaml
- task: Add password strength indicator
  priority: medium
\`\`\`

**Low**: Nice to have
\`\`\`yaml
- task: Add remember-me checkbox
  priority: low
\`\`\`

### Dependency Patterns

**Linear dependencies:**
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

**Parallel work:**
\`\`\`yaml
tasks:
  - id: task-001
    task: Backend API
  - id: task-002
    task: Frontend UI
    # Independent - work in parallel
\`\`\`

**Converging dependencies:**
\`\`\`yaml
tasks:
  - id: task-001
    task: Email service
  - id: task-002
    task: Push notification service
  - id: task-003
    task: Notification UI
    depends_on: [task-001, task-002]  # Needs both
\`\`\`

## Testing Best Practices

### Write Test Cases Early

**During planning, not after:**

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
    # ...

  - name: Invalid password (error path)
    expected_result: 401 error with message "Invalid credentials"

  - name: Account locked (edge case)
    expected_result: 403 error with message "Account locked"
\`\`\`

### Update Test Status

\`\`\`yaml
test_cases:
  - id: test-001
    implemented: true   # ✓ Test code written
    passing: true       # ✓ Test passes
\`\`\`

## Scope Management

### Define Clear Boundaries

**In-Scope**: What you're building
\`\`\`yaml
scope:
  - type: in-scope
    description: User login with email/password
  - type: in-scope
    description: Password reset via email
\`\`\`

**Out-of-Scope**: What you're NOT building
\`\`\`yaml
scope:
  - type: out-of-scope
    description: Social login (OAuth)
    rationale: Phase 2 after MVP validation
  - type: out-of-scope
    description: Two-factor authentication
    rationale: Security enhancement for future release
\`\`\`

### Update Scope as Needed

\`\`\`
# Requirements changed
Update pln-001 scope: Add social login (stakeholder request)

# Add corresponding tasks
Add task to pln-001: Implement OAuth with Google
\`\`\`

## Traceability

### Maintain Links

**BRD → PRD → Plan flow:**
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

❌ **Don't**: Create specs and never update them
✅ **Do**: Update as implementation progresses

\`\`\`
# During implementation
Add note to task-002: Using Redis for session storage instead of JWT
Update prd-001 technical approach: Changed to Redis sessions
\`\`\`

### 2. Over-Planning

❌ **Don't**: Spec every detail for 6 months
✅ **Do**: Plan 1-2 weeks ahead, adjust as you learn

### 3. Under-Planning

❌ **Don't**: Start coding with no plan
✅ **Do**: At minimum, create a plan with tasks and scope

### 4. Ignoring Dependencies

❌ **Bad**:
\`\`\`yaml
tasks:
  - task: Build UI
  - task: Build API
  # No dependencies - UI will break!
\`\`\`

✅ **Good**:
\`\`\`yaml
tasks:
  - id: task-001
    task: Build API
  - id: task-002
    task: Build UI
    depends_on: [task-001]
\`\`\`

### 5. Vague Acceptance Criteria

❌ **Bad**: "System works well"
✅ **Good**: "Login responds in < 500ms for 95% of requests"

### 6. Missing Business Context

❌ **Bad**: Jump straight to PRD
✅ **Good**: Start with BRD to capture "why"

## Team Collaboration

### Code Reviews

**Reference specs in PRs:**
\`\`\`markdown
## Implements
- pln-001-user-authentication
- Tasks: task-001, task-002, task-003

## Acceptance Criteria
- [x] crit-001: Users can log in with email/password
- [x] crit-002: Invalid credentials show clear error
- [ ] crit-003: Account lockout after 5 failed attempts (follow-up)
\`\`\`

### Standups

**Use specs for status updates:**
\`\`\`
Yesterday: Completed task-002 (login endpoint)
Today: Working on task-003 (password reset)
Blocked: task-004 waiting on API access (see blocker note)
\`\`\`

### Sprint Planning

**Query for available work:**
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
- Add new tasks discovered

**Monthly:**
- Review decision status
- Update outdated references
- Archive superseded specs

### Cleanup

**Archive completed work:**
\`\`\`yaml
# Plan completed
status: completed
completed_at: 2025-01-15T16:00:00Z

# Keep for history, not active work
\`\`\`

**Supersede outdated specs:**
\`\`\`
Create decision to replace MongoDB with PostgreSQL
  supersedes: dec-001-use-mongodb
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

### Editor Integration

Many editors support YAML schema validation. Configure for spec-mcp schemas.

## Metrics and Reporting

### Track Progress

\`\`\`
# Plan completion
Show completion status for all plans

# Task velocity
How many tasks completed this week?

# Blockers
Show all blocked tasks
\`\`\`

### Visualize Work

\`\`\`
# Milestone progress
Show plans in milestone mls-001-v2-launch

# Dependency graph
Show task dependencies for pln-001
\`\`\`

## Related Guides

- See [Planning Workflow](spec-mcp://guide/planning-workflow) for planning process
- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for execution
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use each type
- See individual spec guides for detailed usage
`,
	},
	{
		uri: "spec-mcp://guide/query-guide",
		name: "Query Guide",
		description: "Complete guide for querying and analyzing specs",
		mimeType: "text/markdown",
		content: `# Query Guide

**Goal**: Learn how to query, filter, and analyze specs to find information and track progress.

## Overview

The \`query_specs\` tool provides powerful filtering and searching capabilities across all your specs.

\`\`\`typescript
query_specs({
  objects: ["plan", "task"],
  priority: ["high", "critical"],
  status: ["pending", "in-progress"],
  orderBy: "next-to-do"
})
\`\`\`

## Basic Queries

### List All Specs

**All plans:**
\`\`\`
Show me all plans
\`\`\`

**All business requirements:**
\`\`\`
Show me all BRDs
\`\`\`

**All specs:**
\`\`\`
Show me all specs
\`\`\`

### Get Specific Spec

**By ID:**
\`\`\`
Show me pln-001
Show me brd-002-user-auth
Get spec pln-001
\`\`\`

**With relationships:**
\`\`\`
Show me pln-001 with all related specs
What requirements does pln-001 fulfill?
\`\`\`

## Filtering

### By Object Type

**Single type:**
\`\`\`typescript
query_specs({
  objects: ["plan"]
})
\`\`\`

**Multiple types:**
\`\`\`typescript
query_specs({
  objects: ["plan", "business-requirement"]
})
\`\`\`

**Sub-items:**
\`\`\`typescript
query_specs({
  objects: ["task", "test-case", "criterion"]
})
\`\`\`

### By Status

**Completion status:**
\`\`\`typescript
query_specs({
  completed: false  // Only incomplete
})

query_specs({
  completed: true  // Only completed
})
\`\`\`

**Verification status:**
\`\`\`typescript
query_specs({
  verified: true  // Only verified work
})
\`\`\`

**Task status:**
\`\`\`typescript
query_specs({
  objects: ["task"],
  status: ["pending", "in-progress"]
})
\`\`\`

**Status values:**
- \`not-started\`: Not begun
- \`in-progress\`: Currently working
- \`completed\`: Finished
- \`verified\`: Tested and confirmed

### By Priority

\`\`\`typescript
query_specs({
  priority: ["critical", "high"]
})
\`\`\`

**Priority levels:**
- \`critical\`: Blocks everything
- \`high\`: Important
- \`medium\`: Standard (default)
- \`low\`: Can defer
- \`nice-to-have\`: Optional

### By Milestone

\`\`\`typescript
query_specs({
  milestone: "mls-001-v2-launch"
})
\`\`\`

Returns all specs linked to that milestone.

### By ID

**Single ID:**
\`\`\`typescript
query_specs({
  id: "pln-001-user-auth"
})
\`\`\`

**Multiple IDs:**
\`\`\`typescript
query_specs({
  id: ["pln-001", "pln-002", "brd-001"]
})
\`\`\`

### By Draft Status

**Only drafts:**
\`\`\`typescript
query_specs({
  draft: true
})
\`\`\`

**Only finalized:**
\`\`\`typescript
query_specs({
  draft: false
})
\`\`\`

## Sorting

### Next-To-Do (Priority-Based)

\`\`\`typescript
query_specs({
  orderBy: "next-to-do",
  direction: "asc"
})
\`\`\`

Returns work ordered by:
1. Priority (critical → high → medium → low → nice-to-have)
2. Within same priority, by created date

**Best for:** "What should I work on next?"

### By Creation Date

\`\`\`typescript
query_specs({
  orderBy: "created",
  direction: "desc"  // Newest first
})
\`\`\`

**Best for:** "What was added recently?"

### By Update Date

\`\`\`typescript
query_specs({
  orderBy: "updated",
  direction: "desc"  // Most recently changed
})
\`\`\`

**Best for:** "What changed recently?"

## Common Query Patterns

### Work Planning

**What can I start now?**
\`\`\`typescript
query_specs({
  objects: ["task"],
  status: ["pending"],
  priority: ["critical", "high"],
  orderBy: "next-to-do"
})
\`\`\`

**What's in progress?**
\`\`\`typescript
query_specs({
  status: ["in-progress"]
})
\`\`\`

**What's blocked?**
\`\`\`typescript
query_specs({
  objects: ["task"],
  // Tasks with active blockers
})
\`\`\`

### Progress Tracking

**Completion rate:**
\`\`\`typescript
// All tasks
query_specs({ objects: ["task"] })

// Completed tasks
query_specs({
  objects: ["task"],
  completed: true
})
\`\`\`

**Milestone progress:**
\`\`\`typescript
query_specs({
  milestone: "mls-001-v2-launch",
  completed: false  // Remaining work
})
\`\`\`

**This week's completions:**
\`\`\`typescript
query_specs({
  completed: true,
  orderBy: "updated",
  direction: "desc"
})
\`\`\`

### Quality Assurance

**Unverified work:**
\`\`\`typescript
query_specs({
  completed: true,
  verified: false
})
\`\`\`

**Test cases:**
\`\`\`typescript
query_specs({
  objects: ["test-case"],
  // Filter by implemented/passing status
})
\`\`\`

**High-priority criteria:**
\`\`\`typescript
query_specs({
  objects: ["criterion"],
  priority: ["high", "critical"]
})
\`\`\`

### Team Coordination

**High-priority pending work:**
\`\`\`typescript
query_specs({
  priority: ["critical", "high"],
  status: ["pending"]
})
\`\`\`

**Work by milestone:**
\`\`\`typescript
query_specs({
  milestone: "mls-001-v2-launch",
  orderBy: "next-to-do"
})
\`\`\`

**Recently updated specs:**
\`\`\`typescript
query_specs({
  orderBy: "updated",
  direction: "desc"
})
\`\`\`

## Natural Language Queries

You can also ask in natural language:

\`\`\`
"Show me all high-priority pending tasks"
"What work is in the v2.0 milestone?"
"Which plans are incomplete?"
"Show me recently completed work"
"What's the next task I should work on?"
"Which tests are failing?"
\`\`\`

Claude translates these to \`query_specs\` calls.

## Example Workflows

### Daily Standup

\`\`\`
1. "What did I complete yesterday?"
   query_specs({
     completed: true,
     orderBy: "updated",
     direction: "desc"
   })

2. "What am I working on today?"
   query_specs({
     status: ["in-progress"]
   })

3. "What's blocked?"
   query_specs({
     objects: ["task"],
     // Filter for blocked tasks
   })
\`\`\`

### Sprint Planning

\`\`\`
1. "Show available work for next sprint"
   query_specs({
     status: ["pending"],
     priority: ["high", "medium"],
     orderBy: "next-to-do"
   })

2. "What's the milestone progress?"
   query_specs({
     milestone: "mls-002-sprint-5"
   })

3. "Any dependencies to resolve?"
   query_specs({
     objects: ["task"],
     // Check dependency chains
   })
\`\`\`

### Status Reports

\`\`\`
1. "Completion metrics"
   query_specs({ completed: true })   // Done
   query_specs({ completed: false })  // Remaining

2. "High-priority work status"
   query_specs({
     priority: ["critical", "high"]
   })

3. "What changed this week?"
   query_specs({
     orderBy: "updated",
     direction: "desc"
   })
\`\`\`

### Quality Review

\`\`\`
1. "Unverified completed work"
   query_specs({
     completed: true,
     verified: false
   })

2. "Test coverage"
   query_specs({
     objects: ["test-case"]
   })

3. "Acceptance criteria status"
   query_specs({
     objects: ["criterion"]
   })
\`\`\`

## Combining Filters

Filters combine with AND logic:

\`\`\`typescript
query_specs({
  objects: ["task"],              // Tasks only
  priority: ["high"],             // AND high priority
  status: ["pending"],            // AND pending status
  milestone: "mls-001-v2-launch"  // AND in milestone
})
\`\`\`

Returns: High-priority pending tasks in the v2 launch milestone.

## Pagination

Results are automatically paginated if there are many matches.

## Query Response Format

\`\`\`typescript
{
  specs: [
    {
      id: "pln-001-user-auth",
      type: "plan",
      name: "Implement User Authentication",
      priority: "high",
      status: {
        completed: false,
        verified: false,
        ...
      },
      ...
    },
    // More specs
  ],
  stats: {
    total: 15,
    completed: 8,
    verified: 5
  }
}
\`\`\`

## Tips for Effective Querying

### Start Broad, Then Narrow

\`\`\`
1. "Show all plans"
2. "Show incomplete plans"
3. "Show high-priority incomplete plans"
4. "Show high-priority incomplete plans in milestone mls-001"
\`\`\`

### Use Sorting Strategically

**For planning:**
\`\`\`typescript
orderBy: "next-to-do"  // Priority-based
\`\`\`

**For status:**
\`\`\`typescript
orderBy: "updated"  // Recently changed
\`\`\`

**For history:**
\`\`\`typescript
orderBy: "created"  // Chronological
\`\`\`

### Combine Object Types

\`\`\`typescript
query_specs({
  objects: ["plan", "business-requirement", "decision"]
})
\`\`\`

Returns all specs involved in planning a feature.

### Check Related Items

\`\`\`
"Show me pln-001 with all its tasks"
"What BRD does pln-001 fulfill?"
"Which decisions influenced pln-001?"
\`\`\`

## Common Query Examples

### Find Next Work

\`\`\`
Show me next tasks to work on
\`\`\`
\`\`\`typescript
query_specs({
  objects: ["task"],
  status: ["pending"],
  orderBy: "next-to-do"
})
\`\`\`

### Milestone Status

\`\`\`
Show all work in milestone mls-001
\`\`\`
\`\`\`typescript
query_specs({
  milestone: "mls-001-v2-launch"
})
\`\`\`

### Recent Activity

\`\`\`
What changed in the last week?
\`\`\`
\`\`\`typescript
query_specs({
  orderBy: "updated",
  direction: "desc"
})
\`\`\`

### High-Priority Items

\`\`\`
Show all critical and high-priority work
\`\`\`
\`\`\`typescript
query_specs({
  priority: ["critical", "high"]
})
\`\`\`

### Incomplete Work

\`\`\`
What's not done yet?
\`\`\`
\`\`\`typescript
query_specs({
  completed: false
})
\`\`\`

### Specific Types

\`\`\`
Show all decisions
Show all BRDs
Show all components
\`\`\`
\`\`\`typescript
query_specs({ objects: ["decision"] })
query_specs({ objects: ["business-requirement"] })
query_specs({ objects: ["component"] })
\`\`\`

## Advanced Patterns

### Dependency Analysis

\`\`\`
Which tasks depend on task-001?
Which plans depend on pln-001?
\`\`\`

Query a spec and examine its \`depends_on\` and related specs.

### Test Coverage

\`\`\`typescript
query_specs({
  objects: ["test-case"]
})
\`\`\`

Then analyze:
- \`implemented: true/false\`
- \`passing: true/false\`

### Criteria Fulfillment

\`\`\`
What criteria is pln-001 fulfilling?
Which plans fulfill crit-001?
\`\`\`

Check \`criteria\` field in plans.

### Blocked Work

\`\`\`
Show all blocked tasks
\`\`\`

Query tasks and check \`blocked\` array for active blockers.

## Performance Tips

### Limit Scope

\`\`\`typescript
// More efficient
query_specs({
  objects: ["task"],
  milestone: "mls-001"
})

// Less efficient
query_specs({})  // Returns everything
\`\`\`

### Use Appropriate Sorting

\`\`\`typescript
// Fast
orderBy: "created"

// Slower (calculates priority)
orderBy: "next-to-do"
\`\`\`

### Filter Early

\`\`\`typescript
// Better
query_specs({
  objects: ["task"],
  priority: ["high"]
})

// Worse
query_specs({})  // Then filter in code
\`\`\`

## Related Guides

- See [Getting Started](spec-mcp://guide/getting-started) for basic usage
- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for tracking work
- See [Planning Workflow](spec-mcp://guide/planning-workflow) for creating specs
- See [Best Practices](spec-mcp://guide/best-practices) for query patterns
`,
	},
] as const;
