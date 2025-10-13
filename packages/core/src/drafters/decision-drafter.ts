import {
	ConsequenceSchema,
	type Decision,
	DecisionSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createDecisionDrafterConfig(): EntityDrafterConfig<Decision> {
	return {
		schema: DecisionSchema,
		questions: [
			{
				id: "q-001",
				question: `Problem and decision?

CONTEXT: Situation, constraints, forces. What makes this necessary NOW?
DECISION: Clear, specific, actionable. Include timeline/scope.

Good: "Context: Monolith causing 6hr deployments, blocking 3 teams. 3 incidents from coupling. Decision: Split into 5 services (Auth, Orders, Inventory, Payments, Notifications). Each owns data, uses REST+events. Start Auth by Q2."
Good: "Context: 4 date libraries bloat bundle 200kb, cause bugs, confuse team. Decision: Standardize on one library. Remove others by Q3. Linting rule blocks new imports. Migrate high-traffic pages first."
Bad: "Context: Architecture problems. Decision: Use microservices" (vague, not actionable)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Rationale and alternatives considered?

RATIONALE: Concrete outcomes (performance, velocity, cost, risk)
ALTERNATIVES: Options considered and why rejected

Good: "Rationale: Enables 6 teams independent deploy (vs blocking). Reduces risk (one service can't break others). Aligns with architecture strategy. 3mo migration justified by scaling. Alternatives: Modular monolith (doesn't solve coupling); Serverless (lacks expertise, high risk); Do nothing (velocity down 20%/qtr)."
Good: "Rationale: Chosen library is tree-shakeable (saves 180kb), maintained, typed. Team knows it well. Migration 2wks vs 6mo confusion. Alternatives: Library A (deprecated, 67kb); Native approach (poor API, bugs); Library B (less popular)."
Bad: "Rationale: Modern. Alternatives: Other options" (not concrete)`,
				answer: null,
			},
			{
				id: "q-003",
				question: `Supersedes/modifies previous decision?

Reference decision ID or brief description if applicable.

Good: "Supersedes dec-012 (Use Moment.js from 2019)"
Good: "Modifies dec-034 (adds microservices to SOA)"`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Components affected? (CMP IDs comma-separated, 'all', or 'none')

Good: "cmp-001-checkout-app, cmp-002-payment-service, cmp-003-api-gateway"
Good: "all - organization-wide decision"
Good: "none - applies to future components only"
Bad: "some apps" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-005",
				question: `Requirements that drove this? (BRD/PRD IDs comma-separated, or 'none')

Good: "brd-042-checkout-optimization, prd-023-api-security"
Good: "none - proactive architectural decision"
Bad: "business needs" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-006",
				question: `Research supporting this decision and record findings.

GOAL: Validate decision with objective data, find evidence for claimed benefits/trade-offs, compare alternatives using benchmarks or case studies.

Document what you learned:

Good: "Researched framework benchmarks. Findings: Framework A: 1.2x slower than B. Bundle: A 42kb, B 34kb. However A has 10x more libraries, better typing, larger talent pool. Performance diff negligible at our scale. Decision validated by ecosystem advantage."
Good: "Researched microservices case studies (major tech companies). Findings: Company A gained independent deployment but ops team grew 3x. Company B reduced deployment from 45min to 8min but debugging harder. Monitoring costs +40%. Trade-offs match our estimates. Proceed with caution on ops investment."
Good: "Researched library sizes. Findings: Library A 67kb (deprecated), B 72kb, C 12kb tree-shakable (imports only what's used). Our app uses 8 functions = ~2kb. Savings validated at 65-70kb not 180kb. Adjust ROI claim."
Good: "none - decision based on internal constraints and team expertise, no comparable external data"

Tool guidance:
- Use web search for benchmarks, case studies, technology comparisons, engineering blogs
- Record concrete data: numbers, metrics, real-world outcomes, trade-off validation
- Note if findings contradict claims and adjust decision accordingly`,
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "consequences",
				itemSchema: ConsequenceSchema,
				collectionQuestion: {
					id: "q-consequences",
					question: `List key consequences (comma-separated).

Consider: velocity, complexity, ops overhead, performance, costs, risks, maintainability, scale, security.

Include BOTH positives AND negatives. Good decisions acknowledge costs.

Good: 'Faster parallel deployments', 'Increased ops complexity', 'Higher infra costs', 'Risk of service comm failures', 'Improved team autonomy'
Bad: 'Better system' (vague), 'Some drawbacks' (not specific)

Aim for 3-8:`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "cq-q-001",
						question: `Type?

positive | negative | risk

Examples: "positive" for faster deployments, "negative" for complexity, "risk" for data consistency issues`,
						answer: null,
					},
					{
						id: "cq-q-002",
						question: `Describe specifically. Quantify when possible.

Include WHAT changes and HOW MUCH impact.

Good: "Deployment time 6hr → 30min per service. 6 teams can deploy independently."
Good: "Adds ops overhead: manage 5 DBs vs 1, monitor 5 services. Estimate +40% complexity."
Bad: "Faster deployments" (how much? why matters?)`,
						answer: null,
					},
					{
						id: "cq-q-003",
						question: `How will you mitigate? (for negative/risk only)

Specific actions, monitoring, safeguards.

Good: "Circuit breakers + retry logic. Health checks. Dependency monitoring with alerts. Incident runbooks."
Good: "Shared ops dashboard for 5 services. Automate DB backups/migrations. Team training (2-week course)."
Bad: "We'll monitor it" (how? what triggers action?)`,
						answer: null,
						optional: true,
					},
					{
						id: "cq-q-004",
						question: `Research and record evidence for this consequence.

GOAL: Validate claimed impact with industry data or case studies to ensure consequence estimates are realistic and not speculative.

Perform research and document what you learned:

Good: "Researched DORA State of DevOps 2023. Findings: Elite performers deploy 208x more frequently than low performers. Median deployment time for high performers: 1 hour. Our 6hr → 30min is conservative. Also found: deployment frequency correlates 0.82 with business performance. Validates velocity impact."
Good: "Researched microservices operational complexity (Uber, Shopify blogs). Findings: Uber ops team 15 → 45 people (+200%) for 2200 services. Shopify monitoring costs 3x for 300 services. Our estimate of +40% ops overhead for 5 services seems low. Revise to +60-80%."
Good: "Researched service mesh complexity (Martin Fowler, NGINX blogs). Findings: Inter-service communication adds 2-5ms latency. Requires distributed tracing (Jaeger/Zipkin). Circuit breaker complexity high. Validates communication overhead concern. Need dedicated platform team."
Good: "none - consequence is self-evident from our context, no comparable data"

Tool guidance:
- Use web search for: DORA reports, engineering blogs (Uber, Netflix, Spotify), case studies
- Record specific numbers: percentages, before/after metrics, team sizes, costs
- Note if findings suggest adjusting estimate`,
						answer: null,
						optional: true,
					},
				],
			},
		],
	};
}
