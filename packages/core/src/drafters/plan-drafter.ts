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
				question: `What does this plan accomplish?

WHAT you're building, WHY (requirement/criteria), HOW (key technical decisions)

Good: "Build rate limiting for API protection (fulfills prd-023, crit-001). Uses distributed cache with sliding window algorithm."
Good: "Implement streamlined checkout flow (brd-042, crit-003-004). Integrate payment provider API, add saved preferences UI, reduce steps from 5 to 2."
Bad: "Build new feature" (what? why? how?)`,
				answer: null,
			},
			{
				id: "q-002",
				question: `Architectural decisions guiding this? (DEC IDs comma-separated, or 'none')

Good: "dec-008-library-first-approach, dec-015-microservices-strategy"
Good: "none"
Bad: "we follow best practices" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-003",
				question: `Components modified or created? (CMP IDs comma-separated, or 'none')

Good: "cmp-001-checkout-app, cmp-002-payment-service"
Good: "none - creating new cmp-007-notification-service"
Bad: "some components" (not specific IDs)`,
				answer: null,
				optional: true,
			},
			{
				id: "q-004",
				question: `Research implementation guides/examples and record findings.

GOAL: Find proven approaches, understand integration patterns, learn from existing solutions to reduce risk and avoid pitfalls.

Document what you learned:

Good: "Researched framework routing patterns. Findings: Server-side data fetching reduces client complexity. Component boundary patterns affect hydration. Recommend server rendering for display, client for interactive forms."
Good: "Researched sliding window rate limiting. Findings: Sorted data structure with timestamps enables efficient cleanup. Use atomic operations for consistency. Example operations: remove expired, add current, count active. Complexity O(log(N)+M)."
Good: "Researched webhook handling. Findings: Verify signatures before processing. Return success immediately, process async. Implement idempotency checks. Handle retries and duplicates gracefully."
Good: "none - straightforward CRUD with well-known patterns"

Tool guidance:
- Use doc lookup tools for official framework/library documentation
- Use web search for code examples, architecture patterns, blog tutorials
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

Break into concrete, actionable steps ordered by dependency/sequence.

Good: 'Set up Redis connection pooling', 'Implement sliding window algorithm', 'Add rate limit middleware', 'Write integration tests', 'Update API docs'
Bad: 'Do the work', 'Build feature' (not specific or actionable)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "tk-q-001",
						question: `Describe task: details, dependencies, considerations.

WHAT to do, WHY it matters, DEPENDS ON (task IDs if any), CONSIDERATIONS (gotchas, edge cases)

Good: "Implement sliding window algorithm in cache layer. Why: More fair than fixed window, prevents burst abuse. Depends: task-001. Consider: Handle cache failures gracefully, use batching for performance."
Good: "Add payment provider integration. Why: Security compliance, fraud protection support. No dependencies. Consider: Test with sandbox first, handle async callback retries."
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

GOAL: Understand specific APIs/features needed, find code examples, identify implementation challenges before starting.

Document what you learned:

Good: "Researched identity management API. Findings: Need admin-level token (not user token). User creation via POST /users endpoint. Role assignment separate endpoint. Max 50 items per batch. Rate limit 15 req/sec. Recommend caching to reduce calls."
Good: "Researched CI/CD caching strategies. Findings: Use layer caching with remote storage. Store in build cache or registry. Proper config reduces build from 10min to 2min. Cache size limits apply, auto-eviction after period."
Good: "Researched container multi-stage builds. Findings: Separate build from runtime stages. Copy only needed artifacts. Exclude dev dependencies. Minimal base image saves 80-90% size."
Good: "none - standard implementation with clear approach"

Tool guidance:
- Use doc lookup tools for official API/framework documentation
- Use web search for code examples, Stack Overflow solutions, troubleshooting guides
- Record actionable findings: API patterns, config examples, limits, gotchas, performance tips`,
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

Cover critical paths, error scenarios, edge cases.

Good: 'Successful rate limit flow', 'Rate limit exceeded flow', 'Redis failover flow'
Good: 'One-click checkout', 'Guest checkout', 'Payment failure recovery'
Bad: 'Main flow' (which one? what happens?)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "fl-q-001",
						question: `Flow type and numbered steps.

Type: user (user-facing) | system (backend/automated) | data (data movement/sync)
Steps: Numbered sequence with actors and actions

Good: "Type: user. Steps: 1) User submits request 2) System checks rate limit counter 3a) If under limit: increment, allow 3b) If over: return error with retry time 4) User sees response"
Good: "Type: system. Steps: 1) External event received 2) Verify authenticity 3) Update data state 4) Send notifications 5) Log to audit trail"
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
						question: `Scenario, steps, expected result.

SCENARIO: What you're testing
STEPS: How to execute (Given/When/Then works well)
EXPECTED: What should happen (pass condition)

Good: "Scenario: Request exceeds rate limit. Steps: 1) Make requests up to limit 2) Make one more request. Expected: Returns error status, includes retry timing, counter state persists."
Good: "Scenario: Valid transaction processing. Steps: Given user has items ready, When user submits valid payment, Then record created, payment processed, confirmation sent."
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

All public interfaces: REST endpoints, GraphQL operations, library exports, CLI commands.

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

Good: "Type: rest. Description: Creates transaction intent. Accepts amount, currency, user ID. Returns client token. Spec: POST /api/transactions, Body: {amount: number, currency: string, userId?: string}, Response: {token: string, status: string}"
Good: "Type: library. Description: Rate limiting middleware. Spec: rateLimiter(options: {limit: number, window: string, keyGenerator?: (req) => string}): Handler"
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

Entities, DTOs, database schemas.

Good: 'RateLimitEntry', 'ApiKey', 'RateLimitConfig'
Good: 'Order', 'Payment', 'Customer', 'PaymentMethod'
Bad: 'Data' (which entity?)`,
					answer: null,
				},
				itemQuestions: [
					{
						id: "dm-q-001",
						question: `Description, format, schema.

DESCRIPTION: What this represents, relationships
FORMAT: json-schema | sql | typescript | protobuf | graphql | mongoose
SCHEMA: Complete definition

Good: "Description: Stores rate limit state per key. Ordered collection with timestamps. Format: typescript. Schema: interface RateLimitEntry { key: string; timestamps: number[]; limit: number; window: number; }"
Good: "Description: Transaction record linked to Order. Format: sql. Schema: CREATE TABLE transactions (id UUID PRIMARY KEY, order_id UUID REFERENCES orders(id), amount DECIMAL, currency VARCHAR(3), status VARCHAR(20), external_id VARCHAR(255), created_at TIMESTAMP);"
Bad: "Description: Some data. Format: unknown. Schema: TBD"`,
						answer: null,
					},
				],
			},
		],
	};
}
