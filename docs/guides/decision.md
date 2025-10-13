# Decision Guide

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
```yaml
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
```

### Architecture Decision
```yaml
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
```

### Process Decision
```yaml
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
```

## Decision Status Flow

```
proposed → accepted → deprecated
                  ↓
              superseded (by new decision)
```

- **proposed**: Under consideration, not yet implemented
- **accepted**: Agreed upon and in use
- **deprecated**: No longer recommended, but not replaced
- **superseded**: Replaced by a newer decision

## Consequences

Document all outcomes, not just positives:

```yaml
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
```

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
```yaml
# Original decision
decision_status: accepted

# Later, when superseded
decision_status: superseded
supersedes: dec-001-use-mongodb
```

### Link to Evidence
```yaml
references:
  - type: url
    name: PostgreSQL vs MongoDB Benchmark
    url: https://example.com/benchmark
    description: Performance comparison showing PostgreSQL jsonb performance

  - type: file
    name: Database Requirements Analysis
    path: docs/database-analysis.md
    description: Detailed requirements that led to this decision
```

## When to Supersede Decisions

Create a new decision that supersedes the old one:

```yaml
title: Migrate from PostgreSQL to CockroachDB
decision: We will migrate to CockroachDB for better global distribution
decision_status: accepted
supersedes: dec-001-use-postgresql
context: |
  Original PostgreSQL decision was correct for our needs.
  Now we've grown to global scale and need distributed SQL.
```

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
