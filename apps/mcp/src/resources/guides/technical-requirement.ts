export const technicalRequirementGuide = {
	uri: "spec-mcp://guide/technical-requirement",
	name: "Technical Requirement Guide",
	description:
		"When and how to use Technical Requirements to specify implementation constraints and standards",
	mimeType: "text/markdown",
	content: `# Technical Requirement Guide

**Goal**: Understand when and how to use Technical Requirements (TRDs) to specify implementation constraints, standards, and technical specifications.

## What is a Technical Requirement?

A Technical Requirement defines **how** a feature must be implemented, including technology choices, performance targets, security standards, and technical constraints—distinct from the business "what" and "why."

## When to Use a Technical Requirement

✅ **Use a Technical Requirement when:**
- Specifying performance, security, or scalability requirements
- Defining technical standards or conventions
- Documenting integration specifications
- Setting non-functional requirements (NFRs)
- Establishing technical constraints
- Specifying API contracts or data formats

❌ **Don't use a Technical Requirement for:**
- Business needs or user features (use Business Requirement)
- Architecture decisions (use Decision)
- Implementation tasks (use Plan)
- System components (use Component)

## Key Components

### Required Fields
- **Title**: Clear technical requirement name
- **Description**: What this requirement specifies and why
- **Category**: Type of requirement (performance, security, integration, etc.)
- **Acceptance Criteria**: How to verify compliance

### Optional Fields
- **Related Business Requirements**: BRDs this supports
- **Performance Targets**: Specific metrics and thresholds
- **Security Requirements**: Security standards and controls
- **Integration Specs**: External system interfaces
- **Technical Constraints**: Technology or implementation limitations
- **Validation Methods**: How to test/verify
- **Priority**: Technical priority
- **Dependencies**: Other TRDs required

## Requirement Categories

### Performance Requirements
\`\`\`yaml
title: API Response Time SLA
description: Define maximum acceptable response times for all API endpoints
category: performance
acceptance_criteria:
  - 95th percentile response time < 200ms for read operations
  - 95th percentile response time < 500ms for write operations
  - 99th percentile response time < 1s for all operations
  - No endpoint exceeds 5s timeout
validation_methods:
  - Load testing with 10,000 concurrent users
  - APM monitoring in production (New Relic)
  - Weekly performance regression tests
\`\`\`

### Security Requirements
\`\`\`yaml
title: Authentication and Authorization Standards
description: Security requirements for user authentication and access control
category: security
acceptance_criteria:
  - All passwords hashed with bcrypt (cost factor 12)
  - JWT tokens with 15-minute expiry
  - Refresh tokens with 7-day expiry, stored in httpOnly cookies
  - Rate limiting: 5 failed login attempts = 15-minute lockout
  - All API endpoints require authentication except /health and /login
  - Role-based access control (RBAC) enforced at API layer
security_standards:
  - OWASP Top 10 compliance
  - PCI DSS Level 1 for payment data
  - GDPR requirements for EU users
validation_methods:
  - Quarterly security audits
  - Automated vulnerability scanning (Snyk)
  - Penetration testing before each release
\`\`\`

### Integration Requirements
\`\`\`yaml
title: Payment Gateway Integration
description: Technical specifications for Stripe payment integration
category: integration
integration_specs:
  - protocol: REST API
    endpoint: https://api.stripe.com/v1
    authentication: Bearer token (secret key)
    rate_limits: 100 requests/second
  - webhook_endpoint: /webhooks/stripe
    events: [payment_intent.succeeded, payment_intent.failed, charge.refunded]
    signature_verification: Stripe-Signature header with SHA256 HMAC
acceptance_criteria:
  - Handle webhook retries (exponential backoff)
  - Idempotent payment processing (use Stripe idempotency keys)
  - Log all payment events for audit trail
  - Graceful fallback if Stripe API unavailable
error_handling:
  - Network failures: Retry 3 times with exponential backoff
  - Invalid responses: Log error, alert ops team
  - Webhook failures: Return 200 to prevent retries for malformed payloads
\`\`\`

### Scalability Requirements
\`\`\`yaml
title: Database Scaling Strategy
description: Requirements for database performance at scale
category: scalability
acceptance_criteria:
  - Support 1M active users
  - Handle 10,000 queries per second
  - Database response time < 50ms for 95% of queries
  - Zero downtime for schema migrations
technical_constraints:
  - Use PostgreSQL 14+ with connection pooling (PgBouncer)
  - Read replicas for reporting queries
  - Partition tables over 10M rows
  - Index all foreign keys and frequently queried columns
validation_methods:
  - Load test with 2x expected peak traffic
  - Query performance monitoring (slow query log)
  - Weekly database health checks
\`\`\`

### Data Requirements
\`\`\`yaml
title: Data Retention and Archival
description: Requirements for storing and archiving user data
category: data
acceptance_criteria:
  - Active user data retained indefinitely
  - Inactive user data (no login 2+ years) archived to cold storage
  - Deleted user data permanently removed after 30-day grace period
  - Audit logs retained for 7 years
  - Daily backups retained for 30 days, weekly backups for 1 year
compliance_requirements:
  - GDPR right to erasure (30-day deletion)
  - HIPAA audit trail retention (6 years)
  - SOC 2 backup and recovery standards
technical_constraints:
  - Archive to AWS S3 Glacier
  - Encrypt backups with AES-256
  - Automated backup verification weekly
\`\`\`

### Availability Requirements
\`\`\`yaml
title: System Uptime SLA
description: Service availability and disaster recovery requirements
category: availability
acceptance_criteria:
  - 99.9% uptime (max 43 minutes downtime/month)
  - Recovery Time Objective (RTO): 4 hours
  - Recovery Point Objective (RPO): 1 hour
  - Automated failover to secondary region
  - Health checks every 30 seconds
monitoring:
  - Uptime monitoring (Pingdom)
  - Application health checks (/health endpoint)
  - Database replication lag < 5 seconds
  - Alert on-call team for any downtime
disaster_recovery:
  - Primary: us-east-1
  - Secondary: us-west-2
  - Automated database replication
  - Weekly DR failover tests
\`\`\`

## Performance Targets

Use specific, measurable metrics:

\`\`\`yaml
performance_targets:
  - metric: API Response Time
    target: p95 < 200ms, p99 < 500ms
    measurement: APM tool (New Relic, Datadog)
  - metric: Page Load Time
    target: First Contentful Paint < 1.5s
    measurement: Lighthouse CI, RUM
  - metric: Database Query Time
    target: 95% of queries < 50ms
    measurement: PostgreSQL slow query log
  - metric: Throughput
    target: 10,000 requests/second
    measurement: Load testing (k6, JMeter)
\`\`\`

## Security Requirements

\`\`\`yaml
security_requirements:
  authentication:
    - Multi-factor authentication for admin accounts
    - Password requirements: 12+ chars, uppercase, lowercase, number, symbol
    - Session timeout: 30 minutes inactivity
  authorization:
    - Role-based access control (RBAC)
    - Principle of least privilege
    - API keys rotated every 90 days
  data_protection:
    - Encrypt sensitive data at rest (AES-256)
    - TLS 1.3 for data in transit
    - PII data masked in logs
  compliance:
    - SOC 2 Type II certified
    - GDPR compliant data handling
    - Regular security audits (quarterly)
\`\`\`

## Integration Specifications

\`\`\`yaml
integration_specs:
  - name: Email Service (SendGrid)
    protocol: REST API
    authentication: API key in Authorization header
    rate_limits: 1,000 emails/hour (free tier)
    error_handling: Retry 3 times, then queue for manual review
  - name: Analytics (Google Analytics)
    protocol: Measurement Protocol
    data_format: JSON payload
    privacy: Anonymize IP addresses, no PII in events
\`\`\`

## Technical Constraints

\`\`\`yaml
technical_constraints:
  languages:
    - Backend: TypeScript with Node.js 18+
    - Frontend: TypeScript with React 18+
  frameworks:
    - API: Express.js or Fastify
    - ORM: Prisma or TypeORM
  infrastructure:
    - Cloud provider: AWS only
    - Containerization: Docker
    - Orchestration: ECS or EKS (no EC2 instances)
  third_party:
    - All dependencies must have active maintenance
    - No GPL-licensed libraries (licensing conflict)
    - Maximum 50MB bundle size for frontend
\`\`\`

## Validation Methods

Specify how to verify compliance:

\`\`\`yaml
validation_methods:
  automated:
    - Unit tests with 80% code coverage
    - Integration tests for all API endpoints
    - E2E tests for critical user flows
    - Performance tests in CI/CD pipeline
  manual:
    - Code review by senior engineer
    - Security review for authentication changes
    - Load testing with production-like data
  monitoring:
    - APM alerts for response time > 1s
    - Error rate alerts > 1%
    - Uptime monitoring with 5-minute checks
\`\`\`

## Best Practices

### Be Specific and Measurable
**Good**: "API endpoints must respond within 200ms for 95% of requests under 1,000 concurrent users"
**Bad**: "API should be fast"

### Link to Business Requirements
\`\`\`yaml
fulfills:
  - brd-023-user-authentication
reason: Implements security requirements for user login feature
\`\`\`

### Document the "Why"
\`\`\`yaml
description: |
  JWT tokens must expire after 15 minutes to minimize risk if a token
  is compromised. This balances security (short-lived tokens) with UX
  (refresh tokens prevent constant re-login).
\`\`\`

### Set Realistic Targets
Base performance targets on:
- Industry benchmarks
- User research (acceptable wait times)
- Infrastructure capabilities
- Cost constraints

### Include Validation Methods
Always specify how to test/verify the requirement.

### Consider Trade-offs
\`\`\`yaml
technical_constraints:
  - Use in-memory cache for performance
  - Accept eventual consistency (max 5-second delay)
  - Trade-off: Slight data lag for 10x faster response times
\`\`\`

## Complete Example

\`\`\`yaml
title: Real-Time Notification System
description: Technical requirements for push notifications to web and mobile clients
category: integration
fulfills:
  - brd-045-user-notifications
acceptance_criteria:
  - Notifications delivered within 5 seconds of trigger event
  - Support web (WebSockets), iOS (APNs), and Android (FCM)
  - Handle 100,000 concurrent connections
  - Graceful degradation if WebSocket unavailable (fall back to polling)
performance_targets:
  - metric: Notification Latency
    target: p95 < 3 seconds, p99 < 5 seconds
    measurement: Custom telemetry
  - metric: Connection Throughput
    target: 100,000 concurrent WebSocket connections
    measurement: Load testing
integration_specs:
  - name: Apple Push Notification Service (APNs)
    protocol: HTTP/2
    authentication: JWT with P8 certificate
    payload_size: Max 4KB
  - name: Firebase Cloud Messaging (FCM)
    protocol: HTTP
    authentication: Server key
    payload_size: Max 4KB
technical_constraints:
  - WebSocket library: Socket.IO or ws
  - Message queue: Redis Pub/Sub for horizontal scaling
  - Max message size: 10KB
  - No guaranteed delivery for offline users (notifications expire after 24h)
security_requirements:
  - Encrypt notification payloads containing PII
  - Validate user authorization before sending
  - Rate limit: Max 100 notifications per user per day
validation_methods:
  - Load test with 100,000 WebSocket connections
  - Integration tests for APNs and FCM
  - Monitor notification delivery rate (target: 99%)
  - Alert if delivery latency > 10 seconds
monitoring:
  - Track notification delivery success rate
  - Alert on error rate > 1%
  - Dashboard showing active connections and throughput
\`\`\`

## Anti-Patterns

### Avoid Implementation Details
❌ **Bad**: "Use React useEffect hook for data fetching"
✅ **Good**: "API calls must handle network failures gracefully with 3 retries"

### Don't Prescribe Architecture
❌ **Bad**: "Create a NotificationService class with sendEmail method"
✅ **Good**: "Email delivery must complete within 30 seconds or timeout"

### Don't Duplicate Business Requirements
❌ **Bad**: "Users need to receive order confirmation emails"
✅ **Good**: "Email service must support HTML templates with dynamic data"

## Related Guides

- [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) - When to use TRDs vs other types
- [Business Requirement Guide](spec-mcp://guide/business-requirement) - For user-facing requirements
- [Decision Guide](spec-mcp://guide/decision) - For architecture and design decisions
- [Technical Requirement Schema](spec-mcp://schema/technical-requirement) - Complete field reference`,
} as const;
