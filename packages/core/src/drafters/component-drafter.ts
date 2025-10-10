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
				question: `Describe this component: type, purpose, location, and configuration.

TYPE: app (user-facing) | service (backend API) | library (shared code)
PURPOSE: What it does, why it exists
PATH: Relative folder from repo root (default: .)
DEV: Dev server port if applicable

Good: "Type: app. Purpose: Customer-facing checkout SPA built with React. Handles cart, payment, order confirmation. Path: apps/checkout. Dev: 3000"
Good: "Type: service. Purpose: Rate limiting API service. Protects backend from abuse. Path: services/rate-limiter. Dev: 8080"
Good: "Type: library. Purpose: Shared UI components for all apps. Path: packages/ui. Dev: 6006 (Storybook)"
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
				question: `Which requirements does this fulfill? (BRD/PRD IDs comma-separated, or 'none')

Good: "brd-042-checkout-optimization, prd-023-api-security"
Good: "none - infrastructure component"
Bad: "payment stuff" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Research documentation for key technologies and record findings.

GOAL: Understand framework capabilities, deployment platform features, and library best practices to ensure component is built according to recommended patterns and utilizes platform features effectively.

Perform research and document what you learned:

Good: "Researched Next.js 14 App Router. Findings: Server Components are default, fetch in parallel. Use generateStaticParams for SSG. Incremental Static Regeneration via revalidate option. Route handlers replace API routes. Recommend: Server Components for product display, Client for cart interactions, ISR with 60s revalidate for checkout."
Good: "Researched Vercel deployment. Findings: Edge Functions run in 30+ regions, <50ms cold start. Supports streaming. 1MB size limit. Edge config for feature flags (<512KB). Recommend: Edge for rate limiting, Serverless for checkout. Use edge config for A/B tests."
Good: "Researched Express.js middleware best practices. Findings: Helmet for security headers, morgan for logging, express-validator for input validation. Error handler must have 4 params. Use async error wrapper or express-async-errors. Recommend: helmet + compression + rate-limit stack, centralized error handler."
Good: "none - simple component using well-known stack, no special configuration"

Tool guidance:
- Use doc lookup tools for: Next.js, React, Express, Vercel, AWS, deployment platforms
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
						question: `Platform, URL, and commands.

PLATFORM: Where deployed (AWS ECS, Vercel, Railway, GCP Cloud Run, etc.)
URL: Production endpoint if applicable
BUILD: Build command (npm run build, docker build, etc.)
DEPLOY: Deploy command or CI/CD trigger

Good: "Platform: Vercel. URL: https://checkout.acme.com. Build: npm run build. Deploy: Automatic on main branch push."
Good: "Platform: AWS ECS. URL: https://api.acme.com/rate-limiter. Build: docker build -t rate-limiter. Deploy: aws ecs update-service via GitHub Actions."
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
