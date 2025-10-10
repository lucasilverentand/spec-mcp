import {
	ApiContractSchema,
	DataModelSchema,
	FlowSchema,
	type Plan,
	PlanSchema,
	TaskSchema,
	TestCaseSchema,
} from "@spec-mcp/schemas";
import type { EntityDrafterConfig } from "../entity-drafter-factory.js";

export function createPlanDrafterConfig(): EntityDrafterConfig<Plan> {
	return {
		schema: PlanSchema,
		questions: [
			{
				id: "q-001",
				question: `What does this plan accomplish? Describe goal and approach.

Include: WHAT you're building, WHY (requirement/criteria), HOW (key technical decisions)

Good: "Build rate limiting middleware for API abuse prevention (fulfills prd-023-api-security, crit-001). Uses Redis with sliding window, deployed as Express middleware."
Good: "Implement one-click checkout (brd-042-checkout, crit-003-004). Integrate Stripe Payment Intents, add saved payment UI, reduce 5 steps to 2."
Bad: "Build new feature" (what? why? how?)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Architectural decisions guiding this implementation? (DEC IDs comma-separated, or 'none')

Good: "dec-008-library-first-approach, dec-015-microservices-strategy"
Good: "none"
Bad: "we follow best practices" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-003",
				question: `Which components will be modified or created? (CMP IDs comma-separated, or 'none')

Good: "cmp-001-checkout-app, cmp-002-payment-service"
Good: "none - creating new cmp-007-notification-service"
Bad: "some components" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Research implementation guides/examples and record findings.

GOAL: Find proven implementation approaches, understand integration patterns, and learn from existing solutions to reduce implementation risk and avoid common pitfalls.

Perform research and document what you learned:

Good: "Researched Next.js App Router patterns. Findings: Server Components fetch data directly, no useEffect. Client Components need 'use client' directive. Avoid mixing - causes hydration errors. Recommend Server Components for checkout page, Client for payment form. Use server actions for mutations."
Good: "Researched Redis sliding window rate limiting. Findings: Use sorted set with timestamps as scores. ZREMRANGEBYSCORE removes old entries. ZADD adds new. ZCARD counts. Single pipeline for atomicity. Example: MULTI + ZREMRANGEBYSCORE + ZADD + ZCARD + EXPIRE + EXEC. Complexity O(log(N)+M)."
Good: "Researched Stripe webhooks. Findings: Store webhook secret in env. Verify stripe.webhooks.constructEvent() before processing. Return 200 immediately, process async. Implement idempotency using event.id in DB. Handle duplicate events gracefully. Test with Stripe CLI."
Good: "none - straightforward CRUD with well-known patterns"

Tool guidance:
- Use doc lookup tools for: Next.js, React, Express, Stripe, AWS SDK official docs
- Use web search for: code examples, architecture patterns, blog tutorials
- Record concrete findings: code patterns, gotchas, recommended approaches, performance notes`,
				answer: null,
				optional: true,
			},
		],
		arrayFields: [
			{
				fieldName: "tasks",
				itemSchema: TaskSchema,
				collectionQuestion: {
					id: "q-tasks",
					question: `List implementation tasks (comma-separated).

Break down work into concrete, actionable steps. Order by dependency/sequence.

Good: 'Set up Redis connection pooling', 'Implement sliding window algorithm', 'Add rate limit middleware', 'Write integration tests', 'Update API docs'
Bad: 'Do the work', 'Build feature' (not specific or actionable)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "tk-q-001",
						question: `Describe task details, dependencies, and considerations.

Include: WHAT to do, WHY it matters, DEPENDS ON (task IDs if any), CONSIDERATIONS (gotchas, edge cases)

Good: "Implement sliding window in Redis using sorted sets. Why: More fair than fixed window, prevents burst abuse. Depends: task-001. Consider: Handle Redis failures gracefully, use pipelining for performance."
Good: "Add Stripe Payment Intents integration. Why: PCI compliance, 3DS support. No dependencies. Consider: Test with test mode keys first, handle webhook retries."
Bad: "Write code" (what code? why? considerations?)`,
						answer: null,
					},
					{
						id: "tk-q-002",
						question: `Priority?

low | medium | high | critical`,
						answer: null,
					},
					{
						id: "tk-q-003",
						question: `Research external resources and record findings.

GOAL: Understand specific APIs/features needed for this task, find code examples demonstrating the approach, and identify potential implementation challenges before starting work.

Perform research and document what you learned:

Good: "Researched Auth0 Management API. Findings: Need management API token (not user token). POST /api/v2/users creates user. Roles assigned via POST /api/v2/users/{id}/roles. Max 50 roles per request. Rate limit 15 req/sec. Recommend caching role IDs to reduce calls."
Good: "Researched GitHub Actions Docker caching. Findings: Use buildx with cache-from/cache-to. Store in GitHub cache or registry. Example: cache-from: type=gha, cache-to: type=gha,mode=max. Reduces 10min build to 2min. Max cache 10GB, auto-evicts after 7 days."
Good: "Researched Docker multi-stage builds. Findings: Separate build stage from runtime. Copy only artifacts, not build tools. Use .dockerignore for node_modules. Alpine base saves 90% size. Example reduced 1.2GB to 150MB image."
Good: "none - standard implementation with clear approach"

Tool guidance:
- Use doc lookup tools for: Auth0, Stripe, AWS SDK, framework-specific APIs
- Use web search for: code examples, Stack Overflow solutions, troubleshooting guides
- Record actionable findings: API calls, config examples, limits, gotchas, performance tips`,
						answer: null,
						optional: true,
					},
				],
			},
			{
				fieldName: "flows",
				itemSchema: FlowSchema,
				collectionQuestion: {
					id: "q-flows",
					question: `List key user/system flows (comma-separated).

Document critical paths, error scenarios, edge cases.

Good: 'Successful rate limit flow', 'Rate limit exceeded flow', 'Redis failover flow'
Good: 'One-click checkout', 'Guest checkout', 'Payment failure recovery'
Bad: 'Main flow' (which one? what happens?)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "fl-q-001",
						question: `Type and steps for this flow.

Type: user (user-facing) | system (backend/automated) | data (data movement/sync)

Steps: Numbered sequence with actors and actions.

Good: "Type: user. Steps: 1) User submits request 2) Middleware checks Redis counter 3a) If under limit: increment counter, allow request 3b) If over limit: return 429 with Retry-After header 4) User sees response"
Good: "Type: system. Steps: 1) Payment webhook received 2) Verify signature 3) Update order status 4) Send confirmation email 5) Log to analytics"
Bad: "Some steps happen" (not specific)`,
						answer: null,
					},
				],
			},
			{
				fieldName: "test_cases",
				itemSchema: TestCaseSchema,
				collectionQuestion: {
					id: "q-test-cases",
					question: `List test cases (comma-separated).

Cover: happy paths, error cases, edge cases, security scenarios.

Good: 'Request under limit succeeds', 'Request over limit returns 429', 'Redis connection fails gracefully', 'Burst capacity works correctly'
Good: 'Valid payment completes', 'Invalid card shows error', 'Webhook retry succeeds', '3DS authentication flow'
Bad: 'Test the feature' (which scenario?)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "tc-q-001",
						question: `Test scenario, steps, and expected result.

SCENARIO: What you're testing
STEPS: How to execute (Given/When/Then format works well)
EXPECTED: What should happen (pass condition)

Good: "Scenario: Request exceeds rate limit. Steps: 1) Make 100 requests 2) Make 101st request. Expected: Returns 429 status, Retry-After header with reset time, counter persists in Redis."
Good: "Scenario: Payment with valid card. Steps: Given user has items in cart, When user submits valid card, Then order created, payment processed, confirmation email sent."
Bad: "Test works" (what scenario? how? what's expected?)`,
						answer: null,
					},
				],
			},
			{
				fieldName: "api_contracts",
				itemSchema: ApiContractSchema,
				collectionQuestion: {
					id: "q-api-contracts",
					question: `List API contracts (comma-separated).

Document all public interfaces: REST endpoints, GraphQL operations, library exports, CLI commands.

Good: 'POST /api/checkout', 'GET /api/orders/:id', 'rateLimiter() middleware'
Good: 'mutation createPayment', 'query getOrderStatus', 'webhook POST /webhooks/stripe'
Bad: 'The API' (which endpoint/operation?)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "ac-q-001",
						question: `Contract type, description, and specification.

TYPE: rest | graphql | grpc | library | cli | websocket
DESCRIPTION: What it does, when to use
SPEC: Full contract (OpenAPI, GraphQL schema, TypeScript types, etc.)

Good: "Type: rest. Description: Creates payment intent for checkout. Accepts amount, currency, customer. Returns client_secret for frontend. Spec: POST /api/checkout/payment-intent, Body: {amount: number, currency: string, customerId?: string}, Response: {clientSecret: string, status: string}"
Good: "Type: library. Description: Rate limiting middleware. Spec: rateLimiter(options: {limit: number, window: string, keyGenerator?: (req) => string}): RequestHandler"
Bad: "Type: rest. Some endpoint" (what does it do? what's the contract?)`,
						answer: null,
					},
				],
			},
			{
				fieldName: "data_models",
				itemSchema: DataModelSchema,
				collectionQuestion: {
					id: "q-data-models",
					question: `List data models (comma-separated).

Document entities, DTOs, database schemas.

Good: 'RateLimitEntry', 'ApiKey', 'RateLimitConfig'
Good: 'Order', 'Payment', 'Customer', 'PaymentMethod'
Bad: 'Data' (which entity?)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "dm-q-001",
						question: `Model description, format, and schema.

DESCRIPTION: What this represents, relationships
FORMAT: json-schema | sql | typescript | protobuf | graphql | mongoose
SCHEMA: Complete definition

Good: "Description: Stores rate limit state per API key. Redis sorted set with timestamps. Format: typescript. Schema: interface RateLimitEntry { key: string; timestamps: number[]; limit: number; window: number; }"
Good: "Description: Payment record linked to Order. Format: sql. Schema: CREATE TABLE payments (id UUID PRIMARY KEY, order_id UUID REFERENCES orders(id), amount DECIMAL, currency VARCHAR(3), status VARCHAR(20), stripe_intent_id VARCHAR(255), created_at TIMESTAMP);"
Bad: "Description: Some data. Format: unknown. Schema: TBD"`,
						answer: null,
					},
				],
			},
		],
	};
}
