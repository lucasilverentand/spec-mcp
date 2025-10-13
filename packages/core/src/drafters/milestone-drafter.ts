import { type Milestone, MilestoneSchema } from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createMilestoneDrafterConfig(): EntityDrafterConfig<Milestone> {
	return {
		schema: MilestoneSchema,
		questions: [
			{
				id: "q-001",
				question: `Milestone name and what it represents?

NAME: Clear, memorable identifier (3-6 words)
DESCRIPTION: What this milestone represents, key deliverables, success criteria

Include WHAT is being delivered, WHY it matters, HOW you'll know it's done.

Good: "Name: MVP Launch. Description: First public release with core features (user auth, checkout, payments). Marks transition from private beta to public availability. Success criteria: 100 beta users onboarded, <2s page load times, zero payment failures in 48hr test period."
Good: "Name: Database Migration Complete. Description: All production data migrated from MongoDB to PostgreSQL. Includes data validation, rollback plan tested, monitoring in place. Success: Zero data loss, <100ms query degradation, all services using new DB."
Bad: "Name: Phase 1. Description: Complete the first phase" (vague, no clear deliverables or success criteria)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Priority level?

How critical is this milestone relative to others?

critical - Must be completed first, blocks everything
high - Important, blocks significant work
medium - Normal priority (default)
low - Nice to have, can be deferred
nice-to-have - Aspirational, may not happen

Good: "high - blocks Q2 feature development"
Good: "critical - security vulnerability, must ship by Friday"
Good: "medium"`,
				answer: null,
				optional: true,
			},
			{
				id: "q-003",
				question: `Target completion date? (ISO 8601 format or 'none')

When should this milestone be completed?

Good: "2025-12-31T23:59:59Z"
Good: "2025-06-15T00:00:00Z"
Good: "2025-Q2" (will be converted to end of Q2)
Good: "none - continuous improvement goal"
Bad: "next month" (not specific)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Key dependencies or blockers?

What must be completed before this milestone? What might block it? What depends on it?

Include: prerequisite work, external dependencies, risks, downstream impact

Good: "Prerequisites: pln-001-user-auth, pln-002-payment-integration must be complete. Blocked by: API design approval (dec-012). Enables: pln-015-checkout-flow, brd-020-user-onboarding. Risks: Payment provider integration timeline uncertain."
Good: "Prerequisites: Infrastructure team provisions new DB cluster (external dependency, 2-week lead time). Enables: All Q2 features. Risks: Data migration complexity, potential downtime."
Good: "none - standalone milestone, no dependencies"
Bad: "some other work" (not specific)`,
				answer: null,
				optional: true,
			},
		],
		// Milestones don't have array fields - they're simple entities
		arrayFields: [],
	};
}
