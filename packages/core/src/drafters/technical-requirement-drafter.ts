import {
	ConstraintSchema,
	CriteriaSchema,
	type TechnicalRequirement,
	TechnicalRequirementSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createTechnicalRequirementDrafterConfig(): EntityDrafterConfig<TechnicalRequirement> {
	return {
		schema: TechnicalRequirementSchema,
		questions: [
			{
				id: "q-001",
				question: `What is this technical requirement and what must it accomplish?

Be specific about capability, behavior, or quality attribute.

Good: "Rate limiting middleware preventing API abuse: 100 req/min per API key, burst 150. Must handle distributed scenarios across multiple servers."
Good: "DB connection pooling with auto-retry. Pool size 10-50 based on load, 5s timeout, max 3 retries with exponential backoff."
Bad: "Make API better" (what? how?)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Why is this needed? What problem does it solve?

Connect to concrete impacts: performance, reliability, security, maintainability, scale, cost.

Good: "3 DDoS incidents this quarter cost $50k in AWS overages. Single actor can overwhelm API, affecting all customers. Need abuse prevention while allowing legitimate high-volume use."
Good: "Connection-per-request hits DB max (100) under peak load, causing 503s. Setup overhead adds 50-100ms per request. Pooling reduces latency and prevents exhaustion."
Bad: "Best practice" (doesn't explain actual problem)`,
				answer: null,
			},
			{
				id: "q-003",
				question: `What's the high-level technical approach?

Consider: key components, technologies, integration points, data flow, patterns.

Good: "Redis for distributed rate limiting state. Middleware intercepts requests, checks Redis counter with sliding window (fairer than fixed). Return 429 + Retry-After if exceeded. Background job expires old keys hourly."
Good: "pg-pool library. Initialize at startup, expose via singleton. Repository requests connections from pool, returns after query. Health check monitors stats, alerts if >80% exhausted."
Bad: "Use a library" (which? how integrated?)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Which business requirement drives this? (BRD ID, or explain if tech-debt/infrastructure)

Good: "brd-042-checkout-optimization"
Good: "Tech debt - migrating from deprecated library"
Good: "Infrastructure - preparing for 10x scale"
Bad: "Someone asked for it" (not specific)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-005",
				question: `Relevant architectural decisions? (DEC IDs comma-separated, or 'none')

Good: "dec-015-microservices-strategy, dec-021-redis-for-state"
Good: "none"
Bad: "we decided some stuff" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-006",
				question: `Which components are affected? (CMP IDs comma-separated, or 'none')

Good: "cmp-003-api-gateway, cmp-005-auth-service"
Good: "none - new component"
Bad: "all the services" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-007",
				question: `Research library/framework documentation and record findings.

GOAL: Understand API capabilities, configuration options, limitations, and best practices to inform implementation approach and identify potential issues early.

Perform research and document what you learned:

Good: "Researched Redis sorted sets. Findings: EXPIRE doesn't work on members, must use ZREMRANGEBYSCORE for TTL. Recommend background job every 1hr to cleanup. Memory limit via maxmemory-policy=volatile-lru. Max 2^32 members safe."
Good: "Researched pg-pool. Findings: Max pool size = (CPU cores × 2) + disk spindles. Idle timeout default 10s. Must call client.release() or leaks occur. Pool.end() gracefully drains. Recommend 20 max, 5 min, 30s idle."
Good: "Researched Stripe webhooks. Findings: Signature in Stripe-Signature header using HMAC-SHA256. 5min tolerance window. Retry 3 days with exponential backoff. Must respond 2xx within 30sec or marked failed."
Good: "none - using standard libraries without special configuration needs"

Tool guidance:
- Use doc lookup tools for official docs: React, PostgreSQL, Redis, Stripe, AWS, Express
- Fallback to web search if doc tools unavailable
- Record actual findings: limits, gotchas, recommended configs, best practices`,
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "constraints",
				itemSchema: ConstraintSchema,
				collectionQuestion: {
					id: "q-constraints",
					question: `List technical constraints (comma-separated).

Types: Performance (latency, throughput), Scale (users, volume, rate), Reliability (uptime, recovery), Security (auth, compliance), Integration (existing systems), Technology (languages, platforms), Cost (budget, ops costs)

Each should be specific and measurable. Aim for 2-6.

Good: 'p95 <100ms', 'Must work with PostgreSQL 12', 'Budget $5k/month AWS', 'PCI-DSS Level 1 required'
Bad: 'Should be fast' (not measurable)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "cn-q-001",
						question: `Type?

Performance | Scale | Reliability | Security | Integration | Technology | Cost | Compliance | Operational`,
						answer: null,
					},
					{
						id: "cn-q-002",
						question: `Describe constraint (specific, measurable) and explain why it exists.

Include: CONSTRAINT (with numbers/thresholds) + RATIONALE (what drives it)

Good: "API p95 <100ms under 10k users. Why: SLA guarantees to enterprise customers, breach causes penalties. Current 150ms causing complaints."
Good: "Must use PostgreSQL 12+ with existing master-replica. Why: Team expertise, existing backups/monitoring, rewriting data layer costs 6 months."
Bad: "Should be fast" (not measurable)`,
						answer: null,
					},
					{
						id: "cn-q-003",
						question: `Research industry benchmarks/standards and record findings.

GOAL: Validate constraint is aligned with industry standards, ensure compliance requirements are met, and benchmark against recognized best practices to avoid under/over-engineering.

Perform research and document what you learned:

Good: "Researched OWASP API Security. Findings: Recommends 10-100 req/min for unauthenticated, 100-1000 for authenticated. Use 429 status with Retry-After header. Implement rate limiting at edge/gateway level. Our 100 req/min aligns with standard."
Good: "Researched Core Web Vitals. Findings: LCP <2.5s (good), 2.5-4s (needs improvement), >4s (poor). FID <100ms (good). Our <2sec target exceeds 'good' threshold. Mobile 4G typically 3-5s, so ambitious but achievable."
Good: "Researched PCI-DSS 4.0. Findings: Requirement 3.4 mandates encryption at rest (AES-256). Requirement 8.3 requires MFA for admin access. Requirement 10.2 requires audit logging all access. Our constraints cover 3.4 and 8.3, need to add 10.2."
Good: "none - internal business constraint with no applicable industry standard"

Tool guidance:
- Use web search for: OWASP, WCAG, PCI-DSS, SOC2, ISO, NIST standards
- Record specific findings: thresholds, requirements, implementation guidelines, gaps
- Include version/date: "WCAG 2.1 AA", "PCI-DSS 4.0"`,
						answer: null,
						optional: true,
					},
				],
			},
			{
				fieldName: "criteria",
				itemSchema: CriteriaSchema,
				collectionQuestion: {
					id: "q-criteria",
					question: `List acceptance criteria defining "done" (comma-separated).

How will you verify successful implementation? Consider: Functional tests, Performance tests, Security tests, Integration tests, Reliability tests, Ops readiness (monitoring/logs/docs), Code quality

Each must be testable with clear pass/fail. Aim for 4-10.

Good: 'Load test 10k users at p95 <100ms', 'Security scan zero critical vulns', '90% code coverage', 'All endpoints have Prometheus metrics', 'DR procedure tested'
Bad: 'Code is good' (not testable)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "cr-q-001",
						question: `Describe criterion (specific, testable) and explain why it matters.

Include: CRITERION (measurable, clear pass/fail) + RATIONALE (why matters, what risk mitigated)

Good: "k6 load test 10k users maintains p95 <100ms for 10min. Why: SLA requires 100ms under peak, breach causes penalties."
Good: "OWASP ZAP scan zero high/critical vulns. Why: PCI-DSS required for payments, vulns block deployment and expose data."
Good: "85% code coverage verified by Jest. Why: Prevents regressions, enables refactoring, required for production per eng standards."
Bad: "System is tested" (not specific)`,
						answer: null,
					},
				],
			},
		],
	};
}
