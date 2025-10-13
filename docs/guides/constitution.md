# Constitution Guide

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
```yaml
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
```

### Code Style Constitution
```yaml
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
```

### Architecture Constitution
```yaml
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
```

## Article Status

### needs-review
New principles that haven't been approved yet:
```yaml
status: needs-review
```

### active
Approved principles in use:
```yaml
status: active
```

### archived
Old principles no longer relevant:
```yaml
- id: art-999
  title: Use jQuery for DOM Manipulation
  principle: All DOM manipulation must use jQuery
  status: archived  # ← No longer relevant
```

## Writing Effective Articles

### Be Specific
❌ Bad: "Write good code"
✅ Good: "Functions should have a single, clear purpose (Single Responsibility Principle)"

### Explain the Why
```yaml
principle: All API responses must include request ID
rationale: |
  Request IDs enable:
  - Tracing requests across services
  - Debugging issues reported by users
  - Correlating logs and metrics
```

### Provide Examples
```yaml
examples:
  - "✅ Good: const userId = user.id"
  - "❌ Bad: const x = user.id"
```

### Document Exceptions
```yaml
exceptions:
  - Prototype code marked as @experimental
  - Generated code from tools
  - Third-party library code
```

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
```yaml
status: needs-review  # ← Start here, discuss with team
# After discussion:
status: active
```

### Review Regularly
Archive outdated principles:
```yaml
- id: art-old
  title: Support IE 11
  principle: All code must work in IE 11
  status: archived  # ← IE 11 is no longer supported
```

### Link to Decisions
```yaml
references:
  - type: other
    name: TypeScript Adoption Decision
    description: See dec-005-adopt-typescript for the decision to use TypeScript
```

### Make it Discoverable
Put constitution where team can find it:
```yaml
references:
  - type: file
    name: Contributing Guide
    path: CONTRIBUTING.md
    description: Link to constitution from contributing guide
```

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
