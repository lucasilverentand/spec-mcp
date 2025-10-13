# Technical Requirement Guide

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
```yaml
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
```

### Security Requirement
```yaml
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
```

### Integration Requirement
```yaml
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
```

## Technical Constraints

Document limits and requirements:

```yaml
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
```

## Technical Dependencies

Reference external systems and libraries:

```yaml
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
```

## Acceptance Criteria

Make criteria technically measurable:

```yaml
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
```

## Best Practices

### Be Specific and Measurable
❌ Bad: "System should be fast"
✅ Good: "API p95 response time under 200ms"

### Document "Why" Not Just "What"
❌ Bad: "Use Redis for caching"
✅ Good: "Use Redis for caching because database queries are the bottleneck (profiling data shows 80% of latency)"

### Link Technical Decisions
```yaml
references:
  - type: other
    name: Decision to use PostgreSQL
    description: See dec-001-use-postgresql for database choice rationale
```

### Include Implementation Notes
```yaml
implementation_notes: |
  Consider using Cloudflare rate limiting as backup layer.
  Monitor Redis memory usage - may need separate instance for rate limiting.
  Test with production-like traffic volumes before deploying.
```

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
