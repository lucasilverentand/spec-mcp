# Constitution Interview Process

This document describes the interview process for creating a Constitution entity.

## Overview

A Constitution entity represents a set of core principles and rules that govern development decisions in your project. Think of it as your project's "development constitution" - fundamental guidelines that shape how you build software.

## Interview Stages

### Stage 1: Main Questions

These questions gather the core information about the constitution:

#### Q-001: Title
**Question:** What is the title of this constitution?

**Example Answer:** "Engineering Best Practices Constitution"

---

#### Q-002: Description
**Question:** Provide a detailed description of this constitution.

**Example Answer:** "This constitution defines the core engineering principles and standards that all development teams must follow. It covers code quality, testing standards, deployment practices, and architectural patterns that ensure consistency and quality across all projects."

---

### Stage 2: Array Fields

After answering the main questions, you'll be asked about the articles (principles) in your constitution.

#### Articles Collection

**Collection Question:** List the articles/principles (comma-separated titles, e.g., 'Library-First Principle', 'Code Review Standards')

**Example Answer:** "Test Coverage Requirement, Code Review Policy, API Design Standards, Security First Principle"

For each article listed, you'll answer:

#### Article Questions

1. **What is the title of this article?**
   - Example: "Test Coverage Requirement"

2. **What is the core principle or rule?**
   - Example: "All production code must have minimum 80% test coverage, with 100% coverage required for critical business logic and security-related code"

3. **What is the rationale for this principle?**
   - Example: "High test coverage ensures code reliability, catches bugs early in development, enables confident refactoring, and reduces production incidents. Historical data shows that features with <80% coverage have 3x more production bugs."

4. **Provide concrete examples demonstrating this principle (comma-separated, optional)**
   - Example: "Payment processing module achieved 98% coverage and had zero production bugs in last 6 months, Authentication system maintains 100% coverage for security functions, User profile feature increased coverage from 60% to 85% and reduced bugs by 70%"

5. **Are there exceptions where this principle doesn't apply? (comma-separated, optional)**
   - Example: "Prototype code during discovery phase, Generated code that's covered by integration tests, Simple getter/setter methods, Legacy code pending deprecation"

6. **What is the status? (needs-review, active, archived)**
   - Example: "active"

---

### Stage 3: Finalization

After all questions are answered and all array items are finalized, the system will generate the complete Constitution entity with:
- Computed fields (type, number, slug)
- Status tracking (created_at, updated_at, completed, verified)
- All articles with their principles, rationale, examples, and exceptions
- All provided data structured according to the Constitution schema

## Tips

1. **Clear Principles**: State rules clearly and unambiguously
2. **Explain Why**: The rationale is crucial - help people understand the reasoning
3. **Concrete Examples**: Real examples make principles more tangible and actionable
4. **Document Exceptions**: Be honest about when rules don't apply
5. **Keep Principles Focused**: Each article should cover one main principle
6. **Use Active Voice**: "All code must..." not "Code should ideally..."
7. **Make it Enforceable**: Principles should be verifiable or measurable when possible

## Example Full Interview

**Title:** "Microservices Architecture Constitution"

**Description:** "This constitution defines the architectural principles and standards for building microservices at our company. It ensures consistency, maintainability, and scalability across all services."

**Articles:** "Single Responsibility Principle, Database per Service, API-First Design, Circuit Breaker Pattern"

### Article 1: Single Responsibility Principle

**Title:** "Single Responsibility Principle"

**Principle:** "Each microservice must have a single, well-defined business responsibility and should not share data models or business logic with other services"

**Rationale:** "Services with single responsibilities are easier to understand, test, scale independently, and maintain. They reduce coupling between teams and enable faster development cycles. Historical data shows that multi-purpose services had 2x more merge conflicts and 50% longer deployment times."

**Examples:** "Order Service only handles order lifecycle (create, update, cancel, fulfill), Payment Service only handles payment processing and refunds, User Service only manages user profiles and authentication, Notification Service only sends notifications via various channels"

**Exceptions:** "Shared utility services (logging, monitoring) that provide infrastructure concerns, API Gateway that routes but doesn't implement business logic, Shared libraries for common data structures used across services"

**Status:** "active"

### Article 2: Database per Service

**Title:** "Database per Service"

**Principle:** "Each microservice must own its database and no other service can access it directly. All data access must go through the service's API"

**Rationale:** "Separate databases prevent tight coupling, allow independent scaling, enable technology diversity, and enforce clear service boundaries. Shared databases create hidden dependencies and make it impossible to change schema without coordinating multiple teams."

**Examples:** "Order Service uses PostgreSQL for transactional order data, Product Catalog uses MongoDB for flexible product schemas, User Service uses PostgreSQL with separate schema, Analytics Service uses Clickhouse for fast aggregations"

**Exceptions:** "Read replicas for reporting (read-only, not for operational queries), Shared cache layers (Redis) for session data, Message queue databases (owned by messaging infrastructure)"

**Status:** "active"

### Article 3: API-First Design

**Title:** "API-First Design"

**Principle:** "All microservices must design and document their API contracts (OpenAPI spec) before implementation begins. APIs must be reviewed and approved before coding starts."

**Rationale:** "API-first approach ensures that interfaces are well-designed, consistent, and meet consumer needs. It enables parallel development, catches design issues early, and serves as living documentation. Services with API-first design have 40% fewer breaking changes."

**Examples:** "Order API spec defined all endpoints with request/response schemas before coding, Payment API used OpenAPI spec for client SDK generation, User API spec reviewed by 3 consuming teams before implementation"

**Exceptions:** "Internal experimental features not exposed to other services, Emergency hotfixes (must document API afterwards), Spike solutions during R&D phase"

**Status:** "active"

### Article 4: Circuit Breaker Pattern

**Title:** "Circuit Breaker Pattern"

**Principle:** "All external service calls must be protected with circuit breaker pattern. Services must fail fast and provide graceful degradation when dependencies are unavailable."

**Rationale:** "Circuit breakers prevent cascading failures, improve system resilience, provide faster failure detection than timeouts alone, and protect downstream services from overload. Systems without circuit breakers experienced 10x longer outage recovery times."

**Examples:** "Order Service has circuit breaker for Payment Service with 5-second timeout and 50% error threshold, Product Service falls back to cached data when Search Service is down, Notification Service queues messages when Email Service circuit is open"

**Exceptions:** "Database calls within same service (handled by connection pooling), Fire-and-forget async operations, Health check endpoints"

**Status:** "active"

## Common Constitution Topics

Consider creating articles for:

- **Code Quality**: Coverage requirements, linting rules, complexity limits
- **Security**: Authentication standards, encryption requirements, vulnerability scanning
- **Testing**: Unit test requirements, integration test coverage, E2E test standards
- **Documentation**: README requirements, API docs, architecture diagrams
- **Deployment**: CI/CD requirements, rollback procedures, blue-green deployments
- **Monitoring**: Logging standards, metrics requirements, alerting thresholds
- **Performance**: Response time limits, load test requirements, caching policies
- **Scalability**: Horizontal scaling requirements, statelessness principles
- **Data**: Privacy requirements, backup policies, retention rules
- **Dependencies**: Approval process for new libraries, version update policies
