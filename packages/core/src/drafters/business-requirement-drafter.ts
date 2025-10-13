import {
	type BusinessRequirement,
	BusinessRequirementSchema,
	BusinessValueSchema,
	CriteriaSchema,
	StakeholderSchema,
	UserStorySchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createBusinessRequirementDrafterConfig(): EntityDrafterConfig<BusinessRequirement> {
	return {
		schema: BusinessRequirementSchema,
		questions: [
			{
				id: "q-001",
				question: `Problem or opportunity addressed?

Good: "40% user drop-off due to complex flow. Competitors have streamlined process. Losing $2M/year in potential revenue."
Bad: "Need better user experience" (lacks context)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Desired outcome?

Good: "Streamlined user flow matching industry standards. Target 15% conversion increase in Q2. Reduce from 5 steps to 2."
Bad: "Implement new API" (too technical)`,
				answer: null,
			},
			{
				id: "q-003",
				question: `Key constraints or dependencies?

Good: "Compliance required, Launch by Nov 1, Integrate with payment provider, Budget $50k"
Bad: "Build it fast" (not specific)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Technical requirements? (PRD IDs comma-separated, or 'none')

Good: "prd-001-api-rate-limiting, prd-002-oauth-integration"
Good: "none"
Bad: "some technical stuff" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-005",
				question: `Components implementing this? (CMP IDs comma-separated, or 'none')

Good: "cmp-001-checkout-app, cmp-002-payment-service"
Good: "none - new component needed"
Bad: "frontend and backend" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-006",
				question: `Research market data/competitive analysis and record findings.

GOAL: Validate problem/opportunity with market data, understand competitive landscape, benchmark desired outcomes against industry standards.

Document what you learned:

Good: "Researched industry study on user flows. Findings: Average abandonment 70%. Top reason: unexpected friction (48%). Streamlined flow increases conversion 20-30%. Mobile abandonment 85% vs 73% desktop. Our 40% is better than average. 15% improvement target achievable but ambitious."
Good: "Analyzed competitor approaches. Findings: Leader A uses saved preferences. Competitor B reduced steps from 5 to 2, shows +18% conversion. Both use autocomplete. Pattern: minimize fields, save preferences, show progress. Validates our approach."
Good: "Researched user abandonment causes. Findings: Account requirement: 24% abandon. Complex flow: 18%. Slow load: 11%. Trust concerns: 18%. Solutions: optional account, progress indicator, trust signals, <2sec load. Validates our criteria list."
Good: "none - internal operational requirement with no market comparison"

Tool guidance:
- Use web search for industry reports, analyst firms, competitor analysis
- Record concrete findings: percentages, conversion rates, user behaviors, competitor features
- Note how findings validate or adjust targets and approach`,
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "business_value",
				itemSchema: BusinessValueSchema,
				collectionQuestion: {
					id: "q-business-value",
					question: `List business values delivered (comma-separated).

Types: Revenue (sales, new streams), Cost savings (support, ops efficiency), Customer (satisfaction, retention), Risk reduction (security, compliance), Competitive (market share, differentiation)

Distinct, measurable outcomes. 2-4 items.

Examples: 'Increased revenue', 'Reduced support costs', 'Improved retention', 'Faster time-to-market'`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "bv-q-001",
						question: `Type?

Revenue | Cost Reduction | Customer Experience | Risk Mitigation | Market Position | Operational Efficiency

Good: "Revenue - increases checkout conversion"`,
						answer: null,
					},
					{
						id: "bv-q-002",
						question: `Quantify impact with metrics.

Good: "15% conversion increase = $3M annual revenue based on current volume"
Good: "Reduce support load 30% (500 → 350/week), saving $200k/year"
Bad: "Will improve things" (not measurable)`,
						answer: null,
					},
				],
			},
			{
				fieldName: "stakeholders",
				itemSchema: StakeholderSchema,
				collectionQuestion: {
					id: "q-stakeholders",
					question: `List key stakeholders (comma-separated).

Who has: DECISION power (approve/reject), ACCOUNTABILITY (responsible for success), EXPERTISE (domain/technical), IMPACT (workflow/metrics affected)

Include business and technical. 3-6 individuals.

Good: 'Sarah Chen - Product Owner', 'Alex Kim - Engineering Lead', 'VP Sales', 'Customer Success Manager'
Bad: 'The team' (not specific individuals)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "sh-q-001",
						question: `Role, name, interest/concern, email (optional).

ROLE, NAME, INTEREST (why they care, needs, concerns), EMAIL (optional)

Good: "Product Owner, Sarah Chen, Needs 15% conversion boost for Q2 targets. Concerns: timeline and UX. sarah.chen@company.com"
Good: "Engineering Lead, Alex Kim, Responsible for implementation. Worried about complexity and team capacity given sprint commitments."
Bad: "Product manager, involved in project" (lacks specifics)`,
						answer: null,
					},
				],
			},
			{
				fieldName: "user_stories",
				itemSchema: UserStorySchema,
				collectionQuestion: {
					id: "q-user-stories",
					question: `List user stories (comma-separated).

Consider: key actions delivering value, different user types (new/returning, mobile/desktop), edge cases (guest mode, saved prefs)

Each story = distinct capability. 3-8 stories.

Good: 'User saves preferences', 'Guest uses without account', 'Mobile user completes action quickly'
Bad: 'User uses system' (vague)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "us-q-001",
						question: `As a [role/persona]...

Be specific about user type.

Good: "returning customer" / "mobile shopper" / "guest user"
Bad: "user" (too generic)`,
						answer: null,
					},
					{
						id: "us-q-002",
						question: `I want to [action/capability]...

Specific action or capability.

Good: "complete transaction with saved preferences in one click"
Bad: "have a better experience" (not actionable)`,
						answer: null,
					},
					{
						id: "us-q-003",
						question: `So that [benefit]...

User's motivation or benefit.

Good: "I can complete action quickly without re-entering information"
Bad: "it's easier" (not specific)`,
						answer: null,
					},
				],
			},
			{
				fieldName: "criteria",
				itemSchema: CriteriaSchema,
				collectionQuestion: {
					id: "q-criteria",
					question: `List criteria (comma-separated).

NOTE: These will be stored in the 'criteria' field. Each criterion defines what "done" means.

Consider: Functional (features work), Performance (speed, scale), Security/compliance (data protection), UX (accessibility, mobile), Integration (existing systems)

Each testable (pass/fail). 4-10 criteria.

Good: 'Transaction processes within 3 seconds', 'User receives confirmation', 'Works on mobile browsers'
Bad: 'System is good' (not testable)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "cr-q-001",
						question: `Criterion (testable, measurable) and rationale.

NOTE: This item will be stored in the 'criteria' array.

CRITERION (specific, testable) + RATIONALE (why matters for success)

Good: "User receives confirmation within 30sec. Why: Immediate confirmation reduces support inquiries and builds trust."
Good: "Page loads <2sec on mobile network. Why: Performance impacts conversion - each second costs 7% conversions."
Good: "Sensitive data encrypted, never show full details. Why: Compliance required and prevents fraud."
Bad: "Should be fast" (not measurable)`,
						answer: null,
					},
					{
						id: "cr-q-002",
						question: `Research industry standards and record findings.

GOAL: Ensure criteria align with industry best practices and accessibility/compliance standards to avoid below-market expectations or missing regulatory requirements.

Document what you learned:

Good: "Researched WCAG 2.1 AA accessibility. Findings: Requires all functionality via keyboard. Requires visible focus. Requires input labels. Requires 4.5:1 contrast. Must support screen readers. Our criteria missing keyboard navigation - added."
Good: "Researched Core Web Vitals performance standards. Findings: LCP <2.5s (good), 2.5-4s (needs improvement). FID <100ms (good). CLS <0.1 (good). Used as ranking factor. 53% mobile users abandon if load >3s. Our <2sec target exceeds 'good' threshold and competitive."
Good: "Researched transaction SLA standards. Findings: Provider A p50 <100ms, p99 <500ms. Provider B guarantees <3sec. Industry standard: acknowledge <500ms, complete <3sec. Our 3sec target meets standard but not competitive. Consider <1sec for better UX."
Good: "none - internal business-specific criterion with no applicable standard"

Tool guidance:
- Use web search for WCAG guidelines, Core Web Vitals, industry SLAs, compliance docs
- Record specific requirements: thresholds, checklist items, compliance rules, gaps in criteria
- Note where standards suggest adjusting or adding criteria`,
						answer: null,
						optional: true,
					},
				],
			},
		],
	};
}
