export const decisionGuide = {
	uri: "spec-mcp://guide/decision",
	name: "Decision Guide",
	description:
		"When and how to use Decisions to document important technical and architectural choices",
	mimeType: "text/markdown",
	content: `# Decision Guide

**Goal**: Understand when and how to use Decisions to document important technical and architectural choices.

## What is a Decision?

A Decision captures **why** a particular technical or architectural choice was made, including the context, alternatives considered, and trade-offs evaluated. It's similar to an Architectural Decision Record (ADR) but broader in scope.

## When to Use a Decision

✅ **Use a Decision when:**
- Making significant architectural choices (frameworks, databases, infrastructure)
- Selecting technologies, libraries, or tools
- Choosing between multiple design approaches
- Establishing technical standards or conventions
- Making trade-offs between competing concerns
- Deciding to deprecate or replace existing systems

❌ **Don't use a Decision for:**
- Business requirements (use Business Requirement)
- Technical implementation details (use Technical Requirement)
- Task tracking (use Plan)
- System documentation (use Component)

## Key Components

### Required Fields
- **Title**: Clear decision statement
- **Status**: Current state (proposed, accepted, rejected, deprecated, superseded)
- **Context**: Situation that necessitated the decision
- **Decision**: The actual choice made
- **Consequences**: Positive and negative outcomes

### Optional Fields
- **Alternatives Considered**: Other options evaluated
- **Rationale**: Why this choice over alternatives
- **Trade-offs**: What's gained and what's sacrificed
- **Implementation Notes**: Guidance for implementation
- **Review Date**: When to reconsider this decision
- **Related Decisions**: Other decisions that influenced or are influenced by this one

## Decision Statuses

- **proposed**: Under consideration, not yet finalized
- **accepted**: Approved and should be followed
- **rejected**: Evaluated but not chosen
- **deprecated**: Previously accepted, now discouraged
- **superseded**: Replaced by a newer decision

## Common Decision Types

### Technology Selection
\`\`\`yaml
title: Use PostgreSQL for Primary Database
status: accepted
context: |
  We need a relational database for our application that handles user data,
  transactions, and complex queries. Requirements include:
  - ACID compliance for financial transactions
  - Support for JSON data in some tables
  - Horizontal scalability for future growth
  - Strong community and ecosystem
decision: |
  We will use PostgreSQL as our primary database for all relational data
  storage. Version 14+ with connection pooling via PgBouncer.
rationale: |
  - ACID compliance for transaction safety
  - Excellent JSON support via jsonb type
  - Strong reputation for data integrity
  - Rich ecosystem of tools and extensions
  - Team has PostgreSQL experience
alternatives_considered:
  - option: MySQL
    pros: [Slightly faster for simple queries, Larger market share]
    cons: [Weaker JSON support, Less powerful query optimizer]
  - option: MongoDB
    pros: [Flexible schema, Horizontal scaling]
    cons: [No ACID guarantees, Weaker for complex queries]
  - option: CockroachDB
    pros: [Built-in horizontal scaling, PostgreSQL compatible]
    cons: [Higher latency, More expensive, Less mature]
consequences:
  positive:
    - Strong data consistency guarantees
    - Advanced query capabilities (CTEs, window functions)
    - Mature replication and backup tools
  negative:
    - Vertical scaling limits (need sharding for massive scale)
    - More complex operations than NoSQL for simple key-value storage
    - Requires more setup than managed NoSQL services
\`\`\`

### Architectural Pattern
\`\`\`yaml
title: Adopt Microservices Architecture
status: accepted
context: |
  Our monolithic application is becoming difficult to maintain and deploy.
  Multiple teams are working on different features, causing deployment
  conflicts and long release cycles. We need better isolation and independent
  deployability.
decision: |
  Migrate to a microservices architecture with services organized by
  business domain. Start with extracting the payment processing and
  notification services, then gradually decompose the monolith.
rationale: |
  - Enable independent team ownership
  - Allow different deployment schedules
  - Improve fault isolation
  - Support polyglot persistence (different databases per service)
alternatives_considered:
  - option: Keep monolithic architecture
    pros: [Simpler operations, No distributed systems complexity]
    cons: [Continues scaling problems, Team conflicts on deployments]
  - option: Modular monolith
    pros: [Simpler than microservices, Better module boundaries]
    cons: [Still couples deployment, Doesn't solve team isolation]
consequences:
  positive:
    - Teams can deploy independently
    - Technology flexibility per service
    - Better fault isolation
    - Easier to scale specific components
  negative:
    - Increased operational complexity
    - Need for service mesh or API gateway
    - More difficult distributed debugging
    - Eventual consistency challenges
trade_offs:
  - Gain: Team autonomy and deployment independence
  - Sacrifice: Operational simplicity and transaction boundaries
implementation_notes: |
  - Start with strangler fig pattern
  - Use shared libraries for common code
  - Implement distributed tracing (OpenTelemetry)
  - Establish API contracts between services
review_date: 2025-12-31
\`\`\`

### Design Pattern
\`\`\`yaml
title: Use Repository Pattern for Data Access
status: accepted
context: |
  Our data access code is scattered throughout controllers and services,
  making it difficult to test and maintain. We need a consistent approach
  to database operations that supports unit testing and future migration.
decision: |
  Implement the Repository pattern for all database access. Each domain
  entity gets a repository interface with concrete implementations for
  the current database (PostgreSQL) and in-memory test implementation.
rationale: |
  - Centralize data access logic
  - Enable easy mocking for unit tests
  - Prepare for potential database migration
  - Enforce consistent query patterns
consequences:
  positive:
    - Improved testability (mock repositories)
    - Cleaner separation of concerns
    - Easier to switch databases or add caching
    - Consistent error handling
  negative:
    - Additional abstraction layer
    - More boilerplate code
    - Potential for leaky abstractions
\`\`\`

### Coding Standard
\`\`\`yaml
title: Enforce TypeScript Strict Mode
status: accepted
context: |
  We've had several production bugs caused by null/undefined errors and
  type coercion issues. Code reviews often catch type errors that should
  be caught by the compiler.
decision: |
  Enable TypeScript strict mode for all projects. All new code must pass
  strict type checking. Gradually migrate existing code to strict mode.
rationale: |
  - Catch more errors at compile time
  - Improve code quality and maintainability
  - Better IDE support and autocomplete
  - Industry best practice
consequences:
  positive:
    - Fewer runtime type errors
    - Better code documentation via types
    - Improved developer experience
  negative:
    - More verbose code (explicit null checks)
    - Migration effort for existing code
    - Steeper learning curve for junior developers
\`\`\`

### Tool Selection
\`\`\`yaml
title: Use Vitest for Unit Testing
status: accepted
context: |
  We're using Jest for testing, but build times have increased significantly
  as the codebase grows. We need faster test execution, especially in CI/CD.
decision: |
  Migrate from Jest to Vitest for all unit and integration tests.
  Vitest is Jest-compatible, so migration should be straightforward.
rationale: |
  - 10x faster test execution (Vite-powered)
  - Jest-compatible API (minimal migration)
  - Better ESM support
  - Active development and modern design
alternatives_considered:
  - option: Stay with Jest
    pros: [No migration needed, Widely used]
    cons: [Slower, Older architecture]
  - option: Node native test runner
    pros: [No dependencies, Built into Node]
    cons: [Limited features, Less mature]
consequences:
  positive:
    - Faster CI/CD pipelines
    - Better developer experience (fast test feedback)
    - Modern ESM support
  negative:
    - Migration effort (estimated 2 weeks)
    - Smaller community than Jest
    - Some Jest plugins may not work
implementation_notes: |
  - Migrate test files gradually (by directory)
  - Update CI configuration
  - Document migration guide for team
\`\`\`

### Deprecation Decision
\`\`\`yaml
title: Deprecate Legacy REST API (v1)
status: accepted
context: |
  We launched a new GraphQL API (v2) six months ago. The legacy REST API
  (v1) is still supported but creates maintenance burden and security risks.
  Analytics show only 5% of requests still use v1.
decision: |
  Deprecate v1 API immediately, with full shutdown in 6 months.
  Send deprecation notices to all v1 API users and provide migration guide.
rationale: |
  - Reduce maintenance burden
  - Focus resources on v2 improvements
  - Eliminate security vulnerabilities in v1 code
  - Simplify infrastructure
consequences:
  positive:
    - Remove legacy code and reduce complexity
    - Lower infrastructure costs
    - Reduce security surface area
  negative:
    - Potential churn of remaining v1 users
    - Support burden during migration period
implementation_notes: |
  - Month 1: Email all v1 users with deprecation notice
  - Month 3: Return deprecation warnings in API responses
  - Month 5: Final reminder emails
  - Month 6: Shut down v1 endpoints
\`\`\`

## Rationale and Trade-offs

### Rationale
Explain **why** this decision is better than alternatives:
\`\`\`yaml
rationale: |
  We chose React over Vue because:
  - Larger ecosystem of libraries and components
  - More team members have React experience
  - Better TypeScript support and type definitions
  - Easier to hire React developers in our market
\`\`\`

### Trade-offs
Explicitly state what you're gaining and sacrificing:
\`\`\`yaml
trade_offs:
  - Gain: Developer productivity with familiar framework
  - Sacrifice: Slightly larger bundle size than Vue
  - Gain: Rich ecosystem of components
  - Sacrifice: More boilerplate than Vue's simpler API
\`\`\`

## Alternatives Considered

Always document alternatives to show you evaluated options:
\`\`\`yaml
alternatives_considered:
  - option: Server-Side Rendering (SSR)
    pros:
      - Better SEO
      - Faster initial page load
      - Works without JavaScript
    cons:
      - More complex deployment
      - Higher server costs
      - Harder to cache
    why_not_chosen: Our app is behind authentication, so SEO doesn't matter
  - option: Static Site Generation (SSG)
    pros:
      - Best performance
      - Simplest deployment
      - Lowest cost
    cons:
      - Not suitable for dynamic content
      - Long build times for large sites
    why_not_chosen: We have too much dynamic, user-specific content
\`\`\`

## Consequences

### Positive Consequences
\`\`\`yaml
consequences:
  positive:
    - Reduced latency for users (CDN caching)
    - Lower infrastructure costs
    - Simpler deployment pipeline
    - Better developer experience (hot reload)
\`\`\`

### Negative Consequences
Be honest about downsides:
\`\`\`yaml
consequences:
  negative:
    - Requires JavaScript enabled in browser
    - More complex state management
    - SEO requires additional tooling (prerendering)
    - Learning curve for team unfamiliar with React
\`\`\`

### Mitigations
Address how you'll handle negative consequences:
\`\`\`yaml
mitigations:
  - Provide graceful degradation for non-JS users
  - Use React Query to simplify state management
  - Implement Prerender.io for SEO
  - Schedule React training for team
\`\`\`

## Implementation Notes

Provide guidance for implementing the decision:
\`\`\`yaml
implementation_notes: |
  - Create a shared component library for common UI elements
  - Use Vite for fast build times
  - Configure ESLint with React rules
  - Set up React Testing Library for component tests
  - Use React Router for client-side routing
  - Document component patterns in Storybook
\`\`\`

## Review and Iteration

### Review Date
Set a date to reconsider the decision:
\`\`\`yaml
review_date: 2025-12-31
review_notes: |
  Revisit if:
  - Performance issues arise
  - New frameworks gain significant traction
  - Team composition changes significantly
\`\`\`

### Superseding Decisions
When a decision is replaced:
\`\`\`yaml
status: superseded
superseded_by: dec-089-migrate-to-nextjs
superseded_date: 2024-06-15
superseded_reason: |
  Migrated to Next.js to add SSR capabilities for marketing pages
  while keeping React ecosystem benefits.
\`\`\`

## Best Practices

### Capture Context Early
Document the situation **before** making the decision, while context is fresh.

### Be Honest About Trade-offs
Every decision has downsides. Acknowledging them builds trust and helps future maintainers.

### Focus on "Why", Not "What"
The decision itself is obvious from the title. Spend more time explaining why.

### Make It Reviewable
Decisions should be proposed and reviewed before being accepted, especially for major architectural choices.

### Link to Related Decisions
\`\`\`yaml
related_decisions:
  - dec-023-microservices-architecture (parent decision)
  - dec-045-use-kubernetes (related infrastructure decision)
\`\`\`

### Update When Circumstances Change
Mark decisions as deprecated or superseded when no longer applicable.

### Use Plain Language
Avoid excessive jargon. Explain technical concepts so future team members can understand.

## Complete Example

\`\`\`yaml
title: Adopt Monorepo with Turborepo
status: accepted
date: 2024-03-15
context: |
  We have 8 separate repositories for our frontend apps, backend services,
  and shared libraries. This causes:
  - Difficult cross-repo changes (update library, then update all apps)
  - Inconsistent tooling and configurations
  - Duplicate code and dependencies
  - Complex CI/CD pipelines
  - Hard to onboard new developers
decision: |
  Migrate all projects into a single monorepo managed by Turborepo.
  Structure:
  - /apps/* - Applications (web, mobile, admin)
  - /packages/* - Shared libraries
  - /services/* - Backend services
rationale: |
  - Atomic commits across related projects
  - Shared tooling and dependencies
  - Better code reuse via shared packages
  - Simplified CI/CD (Turborepo's smart caching)
  - Single source of truth for entire codebase
  - Easier refactoring across boundaries
alternatives_considered:
  - option: Keep separate repos
    pros: [No migration, Clear ownership boundaries]
    cons: [Continues current problems, No improvement]
    why_not_chosen: Pain points are only getting worse
  - option: Use Nx
    pros: [More features, Better plugins]
    cons: [More complex, Steeper learning curve, Slower builds]
    why_not_chosen: Turborepo is simpler and faster for our needs
  - option: Use Yarn/npm workspaces only
    pros: [Built into package managers, No extra tool]
    cons: [No smart caching, No task orchestration]
    why_not_chosen: Need build caching and task pipelines
consequences:
  positive:
    - Fast incremental builds (only rebuild changed packages)
    - Shared configuration (ESLint, TypeScript, etc.)
    - Atomic refactoring across projects
    - Single CI pipeline
    - Better developer experience
  negative:
    - Larger git repo (longer clone times)
    - Need clear conventions to prevent coupling
    - Single CI pipeline means failures block everyone
    - Requires discipline to maintain boundaries
trade_offs:
  - Gain: Development velocity and code sharing
  - Sacrifice: Some autonomy and git history simplicity
  - Gain: Consistent tooling and dependencies
  - Sacrifice: Flexibility to use different tools per project
implementation_notes: |
  Phase 1 (Week 1-2):
  - Create monorepo structure
  - Migrate shared libraries first
  - Set up Turborepo configuration
  Phase 2 (Week 3-4):
  - Migrate frontend apps
  - Update import paths
  - Configure CI/CD for monorepo
  Phase 3 (Week 5-6):
  - Migrate backend services
  - Update deployment pipelines
  - Archive old repositories
  Guidelines:
  - Use workspace protocol for internal dependencies (@myorg/*)
  - Configure Turborepo pipelines for build, test, lint
  - Set up remote caching (Vercel or Turborepo)
  - Document monorepo conventions in README
mitigations:
  - Use Git LFS for large assets to minimize clone size
  - Configure CI to only test affected projects
  - Establish clear package boundaries (no circular dependencies)
  - Use CODEOWNERS for clear ownership
review_date: 2025-03-15
review_notes: |
  After 1 year, evaluate:
  - Is build time still fast? (target: < 5 min CI)
  - Are teams following conventions?
  - Is code reuse actually happening?
  - Any unexpected downsides?
related_decisions:
  - dec-067-use-typescript-project-references
  - dec-089-shared-component-library
\`\`\`

## Related Guides

- [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) - When to use Decisions vs other types
- [Technical Requirement Guide](spec-mcp://guide/technical-requirement) - For implementation requirements
- [Component Guide](spec-mcp://guide/component) - For documenting system architecture
- [Decision Schema](spec-mcp://schema/decision) - Complete field reference`,
} as const;
