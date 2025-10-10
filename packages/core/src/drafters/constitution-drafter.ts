import {
	ArticleSchema,
	type Constitution,
	ConstitutionSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createConstitutionDrafterConfig(): EntityDrafterConfig<Constitution> {
	return {
		schema: ConstitutionSchema,
		questions: [
			{
				id: "q-001",
				question: `What is this constitution's purpose and context?

Cover: WHAT it governs, WHO it applies to, WHEN to reference it.

Good: "Defines technical decision-making for platform team. Guides architecture, tech selection, code quality. Reference during design reviews, tech debt discussions, tool evaluation."
Bad: "Guidelines for good code" (vague)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Why does this exist? What problem does it solve?

Connect to benefits: faster decisions, better alignment, fewer errors, easier onboarding.

Good: "Team debated build vs buy for every tool, wasting time. 3 incidents from custom crypto. Codifies 'library-first' approach, speeds decisions, reduces security risk."
Bad: "To have better principles" (circular)`,
				answer: null,
			},
			{
				id: "q-003",
				question: `What key areas should this address?

Consider: recurring debates, past mistakes, common trade-offs, behaviors to encourage/discourage, implicit knowledge to codify. List 3-7 areas.

Good: "Tech selection, Code review standards, Tech debt paydown, Security practices, Testing requirements"
Bad: "Be good engineers" (not specific)

Comma-separated:`,
				answer: null,
			},
		],
		arrayFields: [
			{
				fieldName: "articles",
				itemSchema: ArticleSchema,
				collectionQuestion: {
					id: "q-articles",
					question: `List article/principle titles (comma-separated).

Convert key areas into actionable principles: Tech decisions (build vs buy), Code quality (review, tests, docs), Architecture (service boundaries, API design), Security (auth, data handling), Ops (deployment, monitoring), Team collaboration

Each should address specific decision type or practice. Aim for 3-7.

Good: 'Library-First Principle', 'Code Review Standards', 'API Design Guidelines', 'Tech Debt Paydown Policy'
Bad: 'Be good engineers' (vague)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "ar-q-001",
						question: `State principle as clear, actionable guideline.

Must be: SPECIFIC + DEBATABLE + ACTIONABLE

Good: "Evaluate existing libraries before building custom. Prefer battle-tested tools for non-core functionality."
Good: "All DB schema changes via migrations. No direct production modifications."
Bad: "Code quality is important" (vague)`,
						answer: null,
					},
					{
						id: "ar-q-002",
						question: `WHY does this exist? What problem or benefit?

Focus on concrete impact: quality/security/reliability, speed, reduced debt/bugs, alignment.

Good: "Libraries reduce security vulns (less crypto to maintain), speed delivery (no building auth from scratch), improve quality (battle-tested vs custom)"
Bad: "Libraries are good practice" (generic)`,
						answer: null,
					},
					{
						id: "ar-q-003",
						question: `2-3 scenarios where this guided a decision. Be concrete.

Good: "Auth0 vs custom JWT—saved 2 weeks, got MFA"; "Stripe SDK vs direct API—prevented 3 edge cases"
Bad: "We use libraries for auth" (vague)

If new, hypothetical scenarios. Comma-separated:`,
						answer: null,
						optional: true,
					},
					{
						id: "ar-q-004",
						question: `When should this NOT apply? Valid exceptions?

Consider: emergencies, conflicting priorities, technical constraints, scale.

Good: "Critical security fixes may need direct patches vs waiting for library updates"; "Domain-specific algorithms (ML ranking) have no suitable libraries"
Bad: "No exceptions" (dogmatic)

Comma-separated or 'none' with explanation:`,
						answer: null,
						optional: true,
					},
					{
						id: "ar-q-005",
						question: `Decisions exemplifying this principle? (DEC IDs comma-separated, or 'none' if new)

Good: "dec-012-adopt-auth0, dec-034-use-stripe-sdk"
Good: "none - new principle"
Bad: "past decisions" (not specific IDs)`,
						answer: null,
						optional: true,
					},
					{
						id: "ar-q-006",
						question: `Research industry best practices/case studies and record findings.

GOAL: Strengthen principle with external validation, learn from others' experiences, and ensure principle aligns with proven industry practices rather than being purely theoretical.

Perform research and document what you learned:

Good: "Researched Google Engineering Practices. Findings: Code reviews required for all changes. Reviewers check: design, functionality, complexity, tests, naming, comments. Max 400 lines per review. Approver must be domain expert. LGTM + approval required. Validates our 2-reviewer requirement and domain expertise rule."
Good: "Researched Spotify engineering culture (blog + Henrik Kniberg). Findings: Autonomous squads own features end-to-end. 'Spotify model' emphasizes trust over control. Technical decisions delegated to teams. Architecture review only for cross-team impact. Validates decentralized decision-making principle but need guardrails for cross-cutting concerns."
Good: "Researched 12-factor app methodology. Findings: Factor III: store config in environment (not code). Factor VI: processes are stateless. Factor XI: logs to stdout. Our principles missing config management - added 'externalize all configuration' principle. Aligns deployment practices."
Good: "none - principle is specific to our unique context, no comparable industry practice"

Tool guidance:
- Use web search for: Google/Netflix/Spotify engineering blogs, Martin Fowler articles, industry methodologies
- Record specific practices: rules, thresholds, processes, organizational patterns
- Note where findings validate principle or reveal gaps to address`,
						answer: null,
						optional: true,
					},
					// Status defaults to "needs-review" via schema default
				],
			},
		],
	};
}
