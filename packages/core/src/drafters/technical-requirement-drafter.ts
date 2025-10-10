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
				question: `Requirement and what it must accomplish?

Be specific about capability, behavior, or quality attribute.

Good: "Rate limiting preventing API abuse: 100 req/min per key, burst 150. Must handle distributed scenarios across multiple servers."
Good: "Database connection pooling with auto-retry. Pool size 10-50 based on load, 5s timeout, max 3 retries with exponential backoff."
Bad: "Make API better" (what? how?)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Why needed? What problem solved?

Connect to concrete impacts: performance, reliability, security, maintainability, scale, cost.

Good: "3 DDoS incidents this quarter cost $50k in infrastructure overages. Single actor can overwhelm API, affecting all customers. Need abuse prevention while allowing legitimate high-volume use."
Good: "Connection-per-request hits database max (100) under peak load, causing errors. Setup overhead adds 50-100ms per request. Pooling reduces latency and prevents exhaustion."
Bad: "Best practice" (doesn't explain actual problem)`,
				answer: null,
			},
			{
				id: "q-003",
				question: `High-level technical approach?

Consider: key components, technologies, integration points, data flow, patterns.

Good: "Distributed cache for rate limiting state. Middleware intercepts requests, checks counter with sliding window (fairer than fixed). Return error + retry timing if exceeded. Background job expires old keys hourly."
Good: "Connection pool library. Initialize at startup, expose via singleton. Repository requests connections from pool, returns after query. Health check monitors stats, alerts if >80% exhausted."
Bad: "Use a library" (which? how integrated?)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Business requirement driving this? (BRD ID, or explain if tech-debt/infrastructure)

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
				question: `Components affected? (CMP IDs comma-separated, or 'none')

Good: "cmp-003-api-gateway, cmp-005-auth-service"
Good: "none - new component"
Bad: "all the services" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-007",
				question: `Research library/framework documentation and record findings.

GOAL: Understand API capabilities, configuration options, limitations, best practices to inform implementation and identify potential issues early.

Document what you learned:

Good: "Researched sorted set data structure. Findings: TTL doesn't work on members, must use range removal for cleanup. Recommend background job every 1hr. Memory limit via eviction policy. Max 2^32 members safe."
Good: "Researched connection pooling library. Findings: Max pool size = (CPU cores × 2) + disk spindles. Idle timeout default 10s. Must call release() or leaks occur. Graceful drain on shutdown. Recommend 20 max, 5 min, 30s idle."
Good: "Researched webhook handling. Findings: Signature verification using HMAC-SHA256. 5min tolerance window. Retry 3 days with exponential backoff. Must respond success within 30sec or marked failed."
Good: "none - using standard libraries without special configuration needs"

Tool guidance:
- Use doc lookup tools for official library/framework documentation
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

Specific and measurable. 2-6 constraints.

Good: 'p95 <100ms', 'Must work with database v12+', 'Budget $5k/month infrastructure', 'Compliance level 1 required'
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
						question: `Constraint (specific, measurable) and rationale.

CONSTRAINT (with numbers/thresholds) + RATIONALE (what drives it)

Good: "API p95 <100ms under 10k users. Why: SLA guarantees to enterprise customers, breach causes penalties. Current 150ms causing complaints."
Good: "Must use database v12+ with existing replication setup. Why: Team expertise, existing backups/monitoring, rewriting data layer costs 6 months."
Bad: "Should be fast" (not measurable)`,
						answer: null,
					},
					{
						id: "cn-q-003",
						question: `Research industry benchmarks/standards and record findings.

GOAL: Validate constraint aligns with industry standards, ensure compliance requirements met, benchmark against best practices to avoid under/over-engineering.

Document what you learned:

Good: "Researched API security best practices. Findings: Recommends 10-100 req/min for unauthenticated, 100-1000 for authenticated. Use error code with retry header. Implement rate limiting at edge/gateway level. Our 100 req/min aligns with standard."
Good: "Researched Core Web Vitals. Findings: LCP <2.5s (good), 2.5-4s (needs improvement), >4s (poor). FID <100ms (good). Our <2sec target exceeds 'good' threshold. Mobile networks typically 3-5s, so ambitious but achievable."
Good: "Researched compliance standard v4.0. Findings: Requirement 3.4 mandates encryption at rest. Requirement 8.3 requires MFA for admin access. Requirement 10.2 requires audit logging all access. Our constraints cover 3.4 and 8.3, need to add 10.2."
Good: "none - internal business constraint with no applicable industry standard"

Tool guidance:
- Use web search for OWASP, WCAG, compliance standards, industry best practices
- Record specific findings: thresholds, requirements, implementation guidelines, gaps
- Include version/date of standards referenced`,
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

How to verify successful implementation? Consider: Functional tests, Performance tests, Security tests, Integration tests, Reliability tests, Ops readiness (monitoring/logs/docs), Code quality

Testable with clear pass/fail. 4-10 criteria.

Good: 'Load test 10k users at p95 <100ms', 'Security scan zero critical vulns', '90% code coverage', 'All endpoints have Prometheus metrics', 'DR procedure tested'
Bad: 'Code is good' (not testable)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "cr-q-001",
						question: `Criterion (specific, testable) and rationale.

CRITERION (measurable, clear pass/fail) + RATIONALE (why matters, what risk mitigated)

Good: "Load test 10k users maintains p95 <100ms for 10min. Why: SLA requires 100ms under peak, breach causes penalties."
Good: "Security scan zero high/critical vulnerabilities. Why: Compliance required, vulnerabilities block deployment and expose data."
Good: "85% code coverage verified by test framework. Why: Prevents regressions, enables refactoring, required for production per standards."
Bad: "System is tested" (not specific)`,
						answer: null,
					},
				],
			},
		],
	};
}
