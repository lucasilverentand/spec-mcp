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
				question: `What problem or opportunity does this address?

Good: "40% checkout abandonment due to complex flow. Competitors have one-click checkout. Losing $2M/year."
Bad: "Need better checkout" (lacks context)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `What's the desired outcome?

Good: "Streamlined checkout matching industry standards. Target 15% conversion increase in Q2. Reduce from 5 steps to 2."
Bad: "Implement new payment API" (too technical)`,
				answer: null,
			},
			{
				id: "q-003",
				question: `Key constraints or dependencies?

Good: "PCI-DSS compliance required, Launch by Nov 1, Integrate with Stripe, Budget $50k"
Bad: "Build it fast" (not specific)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Related technical requirements? (PRD IDs comma-separated, or 'none')

Good: "prd-001-api-rate-limiting, prd-002-oauth-integration"
Good: "none"
Bad: "some technical stuff" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-005",
				question: `Which components will implement this? (CMP IDs comma-separated, or 'none')

Good: "cmp-001-checkout-app, cmp-002-payment-service"
Good: "none - new component needed"
Bad: "frontend and backend" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-006",
				question: `Research market data/competitive analysis and record findings.

GOAL: Validate problem/opportunity with market data, understand competitive landscape, and benchmark desired outcomes against industry standards to ensure requirement is grounded in market reality.

Perform research and document what you learned:

Good: "Researched Baymard e-commerce checkout study 2024. Findings: Average cart abandonment 70%. Top reason: unexpected costs (48%). Guest checkout increases conversion 20-30%. Mobile abandonment 85% vs 73% desktop. Our 40% abandonment is better than average. 15% improvement target achievable but ambitious."
Good: "Analyzed Amazon/Shopify checkouts. Findings: Amazon one-click requires stored payment + address. Shopify Shop Pay reduces checkout from 5 steps to 2, shows +18% conversion. Both use address autocomplete. Pattern: minimize form fields, save preferences, show progress indicator. Validates our approach."
Good: "Researched checkout abandonment causes (Baymard Institute). Findings: Account creation required: 24% abandon. Complex checkout: 18%. Slow load: 11%. Security concerns: 18%. Solutions: guest checkout, progress bar, trust badges, <2sec load. Validates our criteria list."
Good: "none - internal operational requirement with no market comparison"

Tool guidance:
- Use web search for: Baymard Institute, Forrester, industry reports, competitor teardowns
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

Distinct, measurable outcomes. Aim for 2-4.

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
						question: `Quantify impact. Include metrics.

Good: "15% conversion increase = $3M annual revenue based on current traffic"
Good: "Reduce support tickets 30% (500 → 350/week), saving $200k/year"
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

Include business and technical. Typically 3-6.

Good: 'Sarah Chen - Product Owner', 'Alex Kim - Engineering Lead', 'VP Sales', 'Customer Success Manager'
Bad: 'The team' (not specific individuals)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "sh-q-001",
						question: `Provide: role, name, interest/concern, email (optional).

Include: ROLE, NAME, INTEREST (why they care, needs, concerns), EMAIL (optional)

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

Consider: key actions delivering value, different user types (new/returning, mobile/desktop), edge cases (guest checkout, saved prefs)

Each story = distinct capability. Aim for 3-8.

Good: 'Customer saves payment method', 'Guest checks out without account', 'Mobile user completes purchase in one tap'
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

Good: "complete checkout with saved payment info in one click"
Bad: "have a better experience" (not actionable)`,
						answer: null,
					},
					{
						id: "us-q-003",
						question: `So that [benefit]...

User's motivation or benefit.

Good: "I can complete purchase quickly without re-entering card details"
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
					question: `List acceptance criteria (comma-separated).

What "done" means. Consider: Functional (features work), Performance (speed, scale), Security/compliance (data protection), UX (accessibility, mobile), Integration (existing systems)

Each testable (pass/fail). Aim for 4-10.

Good: 'Payment processes within 3 seconds', 'User receives confirmation email', 'Works on mobile browsers'
Bad: 'System is good' (not testable)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "cr-q-001",
						question: `Describe criterion (testable, measurable) and explain why it matters.

Include: CRITERION (specific, testable) + RATIONALE (why matters for success)

Good: "User receives order confirmation email within 30sec. Why: Immediate confirmation reduces support inquiries and builds trust."
Good: "Checkout page loads <2sec on 4G. Why: Performance impacts conversion - each second costs 7% conversions."
Good: "Saved payment encrypted, never show full card number. Why: PCI-DSS compliance and prevents fraud."
Bad: "Checkout should be fast" (not measurable)`,
						answer: null,
					},
					{
						id: "cr-q-002",
						question: `Research industry standards and record findings.

GOAL: Ensure acceptance criteria align with industry best practices and accessibility/compliance standards to avoid building below-market expectations or missing regulatory requirements.

Perform research and document what you learned:

Good: "Researched WCAG 2.1 AA accessibility. Findings: Guideline 2.1.1 requires all functionality via keyboard. 2.4.7 requires visible focus indicator. 3.3.2 requires labels for inputs. 1.4.3 requires 4.5:1 contrast ratio. Checkout must support screen readers (NVDA/JAWS). Our criteria missing keyboard navigation requirement - added."
Good: "Researched Core Web Vitals performance standards. Findings: LCP <2.5s (good), 2.5-4s (needs improvement). FID <100ms (good). CLS <0.1 (good). Google uses as ranking factor. 53% mobile users abandon if load >3s. Our <2sec target exceeds 'good' threshold and competitive."
Good: "Researched payment SLA standards. Findings: Stripe p50 <100ms, p99 <500ms. PayPal guarantees <3sec. Industry standard: acknowledge <500ms, complete <3sec. Our 3sec target meets standard but not competitive. Consider <1sec for better UX."
Good: "none - internal business-specific criterion with no applicable standard"

Tool guidance:
- Use web search for: WCAG guidelines, Core Web Vitals, industry SLAs, compliance docs
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
