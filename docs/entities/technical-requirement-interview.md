# Technical Requirement Interview Process

This document describes the interview process for creating a Technical Requirement entity.

## Overview

A Technical Requirement entity represents a technical need or constraint for implementing a system. It includes technical context, constraints, dependencies, and technical acceptance criteria.

## Interview Stages

### Stage 1: Main Questions

These questions gather the core information about the technical requirement:

#### Q-001: Title/Name
**Question:** What is the title/name of this technical requirement?

**Example Answer:** "High-Performance API Rate Limiting System"

---

#### Q-002: Description
**Question:** Provide a detailed description of this technical requirement.

**Example Answer:** "Implement a distributed rate limiting system that can handle 100K+ requests per second across multiple API gateways, with configurable limits per endpoint, user tier, and IP address. Must support both sliding window and token bucket algorithms."

---

#### Q-003: Technical Context
**Question:** Describe the technical context, background, or rationale for this requirement.

**Example Answer:** "Our current rate limiting is done at the application level with in-memory counters, which doesn't work in a distributed environment. As we scale to multiple regions and instances, we need a centralized rate limiting solution that maintains consistency across all API gateways while minimizing latency overhead."

---

#### Q-004: Implementation Approach
**Question:** Describe the high-level implementation approach (optional).

**Example Answer:** "Use Redis with Lua scripts for atomic rate limit operations. Deploy Redis cluster with sentinel for high availability. Implement rate limiting middleware in API gateway layer that queries Redis before forwarding requests to backend services."

---

#### Q-005: Implementation Notes
**Question:** Any additional implementation notes or considerations? (optional)

**Example Answer:** "Consider using Redis Streams for rate limit event logging. Implement circuit breaker pattern if Redis becomes unavailable. Cache rate limit rules locally with periodic refresh to reduce Redis queries."

---

### Stage 2: Array Fields

After answering the main questions, you'll be asked about collection fields.

#### Constraints Collection

**Collection Question:** List the technical constraints (comma-separated descriptions, e.g., 'must support 10k concurrent users', 'response time under 100ms')

**Example Answer:** "Response time under 5ms, 99.9% availability, Handle 100K requests per second, Support multi-region deployment"

For each constraint listed, you'll answer:

1. **What type of constraint is this?**
   - Options: performance, security, scalability, compatibility, infrastructure, other
   - Example: "performance"

2. **Describe the constraint in detail**
   - Example: "Rate limiting check must add less than 5ms of latency to request processing time at the 99th percentile, measured under load of 100K requests/second"

---

#### Criteria Collection (Technical Acceptance Criteria)

**Collection Question:** List the technical acceptance criteria (comma-separated descriptions, e.g., 'passes load test', 'security scan shows no vulnerabilities')

**Example Answer:** "Load test passes, Latency under 5ms, Handles Redis failure gracefully, Rate limits accurate within 1%"

For each criterion listed, you'll answer:

1. **Describe this technical acceptance criterion in detail**
   - Example: "System must successfully pass load test simulating 100K requests/second distributed across 10 API gateway instances, with rate limiting correctly enforced and no more than 0.1% false positives or false negatives"

---

### Stage 3: Finalization

After all questions are answered and all array items are finalized, the system will generate the complete Technical Requirement entity with:
- Computed fields (type, number, slug)
- Status tracking (created_at, updated_at, completed, verified)
- All constraints
- All technical acceptance criteria
- Technical dependencies (if provided via references)
- All provided data structured according to the Technical Requirement schema

## Tips

1. **Be Specific with Numbers**: Include concrete metrics and thresholds
2. **Context Matters**: Explain why this technical requirement exists
3. **Constraints**: Focus on non-functional requirements (performance, security, scalability)
4. **Implementation Approach**: High-level architecture, not detailed code
5. **Measurable Criteria**: Acceptance criteria should be testable and verifiable
6. **Dependencies**: Reference specific libraries, frameworks, or systems

## Example Full Interview

**Title:** "WebSocket Real-time Communication Infrastructure"

**Description:** "Build a scalable WebSocket infrastructure to support real-time bidirectional communication between clients and servers, handling 50K+ concurrent connections per server instance with message delivery guarantees."

**Technical Context:** "Current polling-based approach creates excessive load on servers and introduces 5-10 second delays in updates. Business requirements for real-time order tracking and live notifications require sub-second message delivery. Need to support both web and mobile clients with automatic reconnection and message queuing."

**Implementation Approach:** "Use Socket.IO for WebSocket abstraction with fallback to long-polling. Deploy on Node.js servers with Redis adapter for horizontal scaling. Implement message queue (RabbitMQ) for reliable delivery. Use JWT for WebSocket authentication."

**Implementation Notes:** "Consider rate limiting per connection to prevent abuse. Implement heartbeat mechanism to detect dead connections. Use binary protocol for efficiency. Set up monitoring for connection metrics and message throughput."

**Constraints:** "50K concurrent connections, Sub-second message delivery, 99.95% uptime, Cross-platform support"

For each:
1. "50K concurrent connections" - scalability - "Each server instance must maintain at least 50,000 concurrent WebSocket connections with minimal memory footprint (< 4GB RAM per instance). Must support horizontal scaling to 1M+ total connections."

2. "Sub-second message delivery" - performance - "Messages must be delivered from server to client within 500ms at the 95th percentile under normal load. End-to-end latency including network should not exceed 1 second for 99% of messages."

3. "99.95% uptime" - infrastructure - "WebSocket service must maintain 99.95% uptime (max 4.38 hours downtime per year). Must support rolling deployments with zero connection drops. Automatic failover when server instances fail."

4. "Cross-platform support" - compatibility - "Must work on modern browsers (Chrome, Firefox, Safari, Edge), iOS 13+, and Android 8+. Graceful degradation to long-polling for older clients. Same client library and API across all platforms."

**Criteria:** "Load test passes, Reconnection works, Message order preserved, Authentication secure"

For each:
1. "System passes load test with 250K concurrent connections across 5 server instances, maintaining sub-second message delivery and no connection drops during 1-hour sustained load period. CPU usage remains below 70%."

2. "Automatic reconnection logic successfully recovers from network interruptions within 5 seconds, queues messages during disconnection, and delivers them in order upon reconnection. Tested with network interruptions up to 60 seconds."

3. "Message ordering is preserved for messages sent to the same client, even across server instance changes during scaling events. Verified through integration tests with concurrent message streams."

4. "WebSocket authentication uses JWT tokens with expiration, tokens are validated on connection and periodically refreshed. Security audit shows no vulnerabilities. Prevents unauthorized connections and message injection attacks."
