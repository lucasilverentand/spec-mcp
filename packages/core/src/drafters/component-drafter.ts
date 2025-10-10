import {
	type Component,
	ComponentSchema,
	DeploymentSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createComponentDrafterConfig(): EntityDrafterConfig<Component> {
	return {
		schema: ComponentSchema,
		questions: [
			{
				id: "q-001",
				question: `Describe component: type, purpose, location, configuration.

TYPE: app (user-facing) | service (backend API) | library (shared code)
PURPOSE: What it does, why it exists
PATH: Relative folder from repo root (default: .)
DEV: Dev server port if applicable

Good: "Type: app. Purpose: Customer-facing checkout SPA. Handles cart, payment, order flow. Path: apps/checkout. Dev: 3000"
Good: "Type: service. Purpose: Rate limiting service. Protects backend from abuse. Path: services/rate-limiter. Dev: 8080"
Good: "Type: library. Purpose: Shared UI components for all apps. Path: packages/ui. Dev: 6006"
Bad: "Type: app. A web app. Path: ." (what does it do?)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Key architectural decisions shaping this? (DEC IDs comma-separated, or 'none')

Good: "dec-008-library-first-approach, dec-015-react-for-ui"
Good: "none"
Bad: "we decided to use React" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-003",
				question: `Requirements fulfilled? (BRD/PRD IDs comma-separated, or 'none')

Good: "brd-042-checkout-optimization, prd-023-api-security"
Good: "none - infrastructure component"
Bad: "payment stuff" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Research key technologies documentation and record findings.

GOAL: Understand framework capabilities, deployment platform features, library best practices to ensure recommended patterns and effective platform utilization.

Document what you learned:

Good: "Researched framework rendering patterns. Findings: Server components fetch data directly, client handles interactivity. Static generation via config. Incremental regeneration via cache options. Recommend: Server for display, client for forms, incremental refresh with 60s cache."
Good: "Researched edge platform deployment. Findings: Edge functions run globally, <50ms cold start. Supports streaming. Size limits apply. Edge config for flags. Recommend: Edge for rate limiting, traditional for complex logic."
Good: "Researched server middleware patterns. Findings: Security headers middleware, logging middleware, validation middleware. Error handlers need specific signature. Use async wrappers. Recommend: security + compression + rate-limit stack, centralized errors."
Good: "none - simple component using well-known stack, no special configuration"

Tool guidance:
- Use doc lookup tools for official framework/platform documentation
- Fallback to web search if doc tools unavailable
- Record actionable findings: patterns to use, config recommendations, limits, best practices`,
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "deployments",
				itemSchema: DeploymentSchema,
				collectionQuestion: {
					id: "q-deployments",
					question: `List deployment environments (comma-separated).

Good: 'production', 'staging', 'preview'
Good: 'prod-us-east', 'prod-eu-west', 'staging'`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "dp-q-001",
						question: `Platform, URL, build and deploy commands.

PLATFORM: Where deployed (cloud platform, container service, etc.)
URL: Production endpoint if applicable
BUILD: Build command
DEPLOY: Deploy command or CI/CD trigger

Good: "Platform: Edge hosting platform. URL: https://checkout.example.com. Build: npm run build. Deploy: Automatic on main branch push."
Good: "Platform: Container service. URL: https://api.example.com/rate-limiter. Build: docker build -t rate-limiter. Deploy: Container update via CI/CD."
Bad: "Platform: Cloud. Build: npm. Deploy: Auto." (too vague)`,
						answer: null,
					},
					{
						id: "dp-q-002",
						question: `Environment variables and secrets.

ENV VARS: Required config (comma-separated). Example: NODE_ENV, API_URL, LOG_LEVEL
SECRETS: Sensitive values (comma-separated). Example: STRIPE_SECRET_KEY, DATABASE_URL, JWT_SECRET

Good: "Env vars: NODE_ENV, API_BASE_URL, REDIS_HOST, RATE_LIMIT_DEFAULT. Secrets: STRIPE_SECRET_KEY, DATABASE_URL, API_SECRET."
Good: "Env vars: PORT, LOG_LEVEL. Secrets: None (public frontend)."
Bad: "Env vars: Some config" (which vars?)`,
						answer: null,
						optional: true,
					},
				],
			},
		],
	};
}
