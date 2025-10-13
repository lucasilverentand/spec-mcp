import { type Milestone, MilestoneSchema } from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createMilestoneDrafterConfig(): EntityDrafterConfig<Milestone> {
	return {
		schema: MilestoneSchema,
		questions: [
			{
				id: "q-001",
				question: `Milestone name and description?

NAME: Clear, concise identifier (e.g., "MVP Launch", "Beta Release", "Q1 Goals")
DESCRIPTION: What this milestone represents, why it matters, what success looks like

Good: "Name: MVP Launch. Description: First public release with core features (auth, checkout, payments). Success: 100 beta users, <2s page loads, zero payment failures."
Good: "Name: Infrastructure Modernization. Description: Migrate from legacy monolith to microservices architecture. Success: All services deployed independently, 50% reduced deployment time."
Bad: "Name: Milestone 1. Description: First milestone" (not specific)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Target completion date? (ISO 8601 format or 'none')

Provide realistic target date or 'none' if not time-bound.

Good: "2025-12-31T23:59:59Z"
Good: "2025-06-15T00:00:00Z"
Good: "none - continuous improvement goal"
Bad: "next month" (not ISO format)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-003",
				question: `Related plans, requirements, or decisions? (IDs comma-separated, or 'none')

Link to entities that contribute to or depend on this milestone.

Good: "pln-001-user-auth, pln-002-payment-integration, brd-005-checkout-flow"
Good: "dec-012-tech-stack, prd-023-api-design"
Good: "none - high-level organizational goal"
Bad: "some plans" (not specific IDs)`,
				answer: null,
				optional: true,
			},
		],
		// Milestones don't have array fields - they're simple entities
		arrayFields: [],
	};
}
