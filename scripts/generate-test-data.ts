#!/usr/bin/env node
/**
 * Generate test data for spec-mcp
 *
 * This script creates realistic test data for all spec types:
 * - Business Requirements
 * - Technical Requirements
 * - Plans
 * - Components
 * - Decisions
 * - Constitutions
 * - Milestones
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

const SPECS_DIR = join(process.cwd(), "specs");

// Ensure directories exist
const dirs = [
	"requirements/business",
	"requirements/technical",
	"plans",
	"components",
	"decisions",
	"constitutions",
	"milestones",
];

for (const dir of dirs) {
	mkdirSync(join(SPECS_DIR, dir), { recursive: true });
}

// Helper to generate timestamp
const timestamp = () => new Date().toISOString();

// Generate Business Requirements
const businessRequirements = [
	{
		type: "business-requirement",
		number: 1,
		slug: "user-authentication",
		name: "User Authentication System",
		description:
			"Implement a secure user authentication system that allows users to register, log in, and manage their accounts with OAuth2 support for major providers.",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		business_value: [
			{
				type: "revenue",
				value:
					"Enable user tracking and personalized experiences, expected to increase conversion by 15%",
			},
			{
				type: "customer-satisfaction",
				value: "Reduce friction in user onboarding with social login options",
			},
		],
		stakeholders: [
			{
				role: "product-owner",
				name: "Sarah Chen",
				email: "sarah.chen@example.com",
				interest: "Ensure smooth user experience and high conversion rates",
			},
			{
				role: "customer",
				name: "Beta User Group",
				interest:
					"Quick and secure access to the platform without remembering passwords",
			},
		],
		user_stories: [
			{
				role: "new user",
				feature: "register with email and password",
				benefit: "create an account and access the platform quickly",
			},
			{
				role: "returning user",
				feature: "log in with Google or GitHub",
				benefit: "access my account without remembering another password",
			},
		],
		criteria: [
			{
				id: "crt-001",
				description: "Users can register with email/password",
				met: false,
			},
			{
				id: "crt-002",
				description: "Users can log in with Google OAuth",
				met: false,
			},
			{
				id: "crt-003",
				description: "Password reset flow works via email",
				met: false,
			},
		],
		references: [
			{
				type: "documentation",
				description: "OAuth 2.0 Best Practices",
				url: "https://oauth.net/2/",
				title: "OAuth 2.0 Framework",
			},
		],
	},
	{
		type: "business-requirement",
		number: 2,
		slug: "analytics-dashboard",
		name: "Analytics Dashboard",
		description:
			"Provide users with a comprehensive analytics dashboard showing usage metrics, trends, and actionable insights for their projects.",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		business_value: [
			{
				type: "customer-satisfaction",
				value:
					"Increase user engagement by providing visibility into their usage patterns",
			},
			{
				type: "revenue",
				value: "Drive upsells by highlighting usage approaching plan limits",
			},
		],
		stakeholders: [
			{
				role: "product-owner",
				name: "Sarah Chen",
				email: "sarah.chen@example.com",
				interest: "Deliver value to users and drive premium conversions",
			},
			{
				role: "end-user",
				name: "Power Users",
				interest: "Understand usage patterns and optimize workflows",
			},
		],
		user_stories: [
			{
				role: "user",
				feature: "view real-time usage metrics",
				benefit: "understand how my team is using the platform",
			},
			{
				role: "admin",
				feature: "export analytics data to CSV",
				benefit: "share insights with stakeholders",
			},
		],
		criteria: [
			{
				id: "crt-001",
				description: "Dashboard shows last 30 days of usage data",
				met: false,
			},
			{
				id: "crt-002",
				description: "Users can filter by date range",
				met: false,
			},
			{
				id: "crt-003",
				description: "Export to CSV functionality works",
				met: false,
			},
		],
		references: [],
	},
	{
		type: "business-requirement",
		number: 3,
		slug: "team-collaboration",
		name: "Team Collaboration Features",
		description:
			"Enable teams to collaborate effectively with shared workspaces, role-based permissions, and activity feeds.",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		business_value: [
			{
				type: "revenue",
				value:
					"Team plans drive 3x higher revenue per account compared to individual plans",
			},
			{
				type: "customer-satisfaction",
				value: "Reduce churn by enabling seamless team workflows",
			},
		],
		stakeholders: [
			{
				role: "product-owner",
				name: "Sarah Chen",
				email: "sarah.chen@example.com",
				interest: "Drive team plan adoption and reduce enterprise churn",
			},
			{
				role: "customer",
				name: "Enterprise Teams",
				interest: "Collaborate efficiently with proper access controls",
			},
		],
		user_stories: [
			{
				role: "team admin",
				feature: "invite team members and assign roles",
				benefit: "control who has access to what resources",
			},
			{
				role: "team member",
				feature: "see recent activity in shared workspace",
				benefit: "stay updated on team changes",
			},
		],
		criteria: [
			{
				id: "crt-001",
				description: "Team admins can invite members via email",
				met: false,
			},
			{
				id: "crt-002",
				description:
					"Role-based permissions (admin, member, viewer) work correctly",
				met: false,
			},
			{
				id: "crt-003",
				description: "Activity feed shows last 50 team actions",
				met: false,
			},
		],
		references: [],
	},
];

// Generate Technical Requirements
const technicalRequirements = [
	{
		type: "technical-requirement",
		number: 1,
		slug: "api-rate-limiting",
		name: "API Rate Limiting Implementation",
		description:
			"Implement rate limiting across all API endpoints to prevent abuse and ensure fair usage across all users.",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		technical_context:
			"The API currently has no rate limiting, making it vulnerable to abuse and potential DDoS attacks. We need a distributed rate limiting solution that works across multiple API servers.",
		implementation_approach:
			"Use Redis-backed rate limiting with sliding window algorithm. Implement middleware that checks rate limits before processing requests.",
		technical_dependencies: [
			{
				type: "library",
				description: "Redis for distributed rate limit storage",
				url: "https://redis.io/",
				title: "Redis",
			},
			{
				type: "library",
				description: "Rate limiting library for Node.js",
				title: "express-rate-limit",
			},
		],
		constraints: [
			{
				type: "performance",
				description: "Rate limit checks must add <10ms latency to API requests",
			},
			{
				type: "scalability",
				description:
					"Must support 10,000 requests per second across all API servers",
			},
		],
		implementation_notes:
			"Consider implementing different rate limits for different endpoint types (read vs write). Authenticated users should have higher limits than anonymous users.",
		criteria: [
			{
				id: "crt-001",
				description: "Rate limits enforced on all public API endpoints",
				met: false,
			},
			{
				id: "crt-002",
				description: "Rate limit headers (X-RateLimit-*) returned in responses",
				met: false,
			},
			{
				id: "crt-003",
				description: "Redis failover doesn't break API (graceful degradation)",
				met: false,
			},
		],
		references: [
			{
				type: "documentation",
				description: "Rate Limiting Best Practices",
				url: "https://cloud.google.com/architecture/rate-limiting-strategies-techniques",
				title: "Rate Limiting Strategies",
			},
		],
	},
	{
		type: "technical-requirement",
		number: 2,
		slug: "database-migrations",
		name: "Database Migration System",
		description:
			"Implement a robust database migration system that supports versioning, rollbacks, and safe production deployments.",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		technical_context:
			"Currently making ad-hoc database changes without proper version control or rollback capability. Need formal migration system before launching v2 features.",
		implementation_approach:
			"Use a migration tool that supports both up/down migrations with automatic versioning. Integrate into CI/CD pipeline.",
		technical_dependencies: [
			{
				type: "library",
				description: "Database migration tool",
				title: "node-pg-migrate",
			},
		],
		constraints: [
			{
				type: "compatibility",
				description: "Must work with PostgreSQL 14+ and TimescaleDB extensions",
			},
			{
				type: "infrastructure",
				description: "Must run in CI/CD pipeline before deployments",
			},
		],
		implementation_notes:
			"Ensure migrations are idempotent and can run multiple times safely. Test rollback procedures in staging.",
		criteria: [
			{
				id: "crt-001",
				description: "Migrations run automatically on deployment",
				met: false,
			},
			{
				id: "crt-002",
				description: "Rollback mechanism tested and documented",
				met: false,
			},
			{
				id: "crt-003",
				description: "Migration history tracked in database",
				met: false,
			},
		],
		references: [],
	},
];

// Generate Plans
const plans = [
	{
		type: "plan",
		number: 1,
		slug: "implement-oauth-authentication",
		name: "Implement OAuth Authentication",
		description:
			"Build OAuth 2.0 authentication flow supporting Google and GitHub providers with secure token management.",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		criteria: {
			requirement: "brd-001-user-authentication",
			criteria: "crt-002",
		},
		scope: {
			in_scope: [
				{
					item: "Google OAuth integration",
					reasoning: "Most requested provider by users",
				},
				{
					item: "GitHub OAuth integration",
					reasoning: "Important for developer audience",
				},
				{
					item: "Token refresh mechanism",
					reasoning: "Required for maintaining sessions",
				},
			],
			out_of_scope: [
				{
					item: "Facebook and Twitter OAuth",
					reasoning: "Can be added in future iteration based on demand",
				},
				{
					item: "Two-factor authentication",
					reasoning: "Separate security enhancement tracked in brd-004",
				},
			],
		},
		depends_on: [],
		milestones: ["mls-001-auth-launch"],
		tasks: [
			{
				id: "tsk-001",
				description:
					"Set up OAuth application credentials with Google and GitHub",
				priority: "critical",
				estimated_hours: 2,
				status: "pending",
			},
			{
				id: "tsk-002",
				description: "Implement OAuth callback handlers",
				priority: "critical",
				estimated_hours: 8,
				status: "pending",
			},
			{
				id: "tsk-003",
				description: "Build token storage and refresh mechanism",
				priority: "high",
				estimated_hours: 6,
				status: "pending",
			},
			{
				id: "tsk-004",
				description: "Add OAuth login buttons to UI",
				priority: "medium",
				estimated_hours: 4,
				status: "pending",
			},
		],
		flows: [
			{
				id: "flw-001",
				name: "OAuth Login Flow",
				description:
					"User clicks OAuth button, redirects to provider, returns with token",
				steps: [
					"User clicks 'Sign in with Google' button",
					"Application redirects to Google OAuth consent screen",
					"User approves access",
					"Google redirects back with authorization code",
					"Backend exchanges code for access token",
					"User profile created/updated in database",
					"Session cookie set and user redirected to dashboard",
				],
			},
		],
		test_cases: [
			{
				id: "tst-001",
				description: "User successfully logs in with Google",
				type: "integration",
				status: "pending",
			},
			{
				id: "tst-002",
				description: "OAuth flow handles provider errors gracefully",
				type: "integration",
				status: "pending",
			},
		],
		api_contracts: [
			{
				id: "api-001",
				endpoint: "/auth/google",
				method: "GET",
				description: "Initiates Google OAuth flow",
				request_example: "GET /auth/google?redirect=/dashboard",
				response_example: "302 Redirect to Google OAuth",
			},
			{
				id: "api-002",
				endpoint: "/auth/google/callback",
				method: "GET",
				description: "Handles OAuth callback from Google",
				request_example: "GET /auth/google/callback?code=xxx&state=yyy",
				response_example: "302 Redirect to application with session cookie",
			},
		],
		data_models: [
			{
				id: "dat-001",
				name: "OAuthToken",
				description: "Stores OAuth tokens for users",
				fields: [
					"user_id: string",
					"provider: 'google' | 'github'",
					"access_token: string (encrypted)",
					"refresh_token: string (encrypted)",
					"expires_at: timestamp",
				],
			},
		],
		references: [
			{
				type: "documentation",
				description: "Google OAuth 2.0 Documentation",
				url: "https://developers.google.com/identity/protocols/oauth2",
				title: "Google OAuth Docs",
			},
		],
	},
	{
		type: "plan",
		number: 2,
		slug: "analytics-data-pipeline",
		name: "Analytics Data Pipeline",
		description:
			"Build real-time data pipeline to collect, process, and store analytics events for dashboard visualization.",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		criteria: {
			requirement: "brd-002-analytics-dashboard",
			criteria: "crt-001",
		},
		scope: {
			in_scope: [
				{
					item: "Event collection API",
					reasoning: "Core requirement for capturing analytics data",
				},
				{
					item: "Real-time event processing",
					reasoning: "Users expect up-to-date metrics",
				},
				{
					item: "Time-series data storage",
					reasoning: "Efficient storage for trend analysis",
				},
			],
			out_of_scope: [
				{
					item: "ML-based anomaly detection",
					reasoning: "Future enhancement, not MVP requirement",
				},
			],
		},
		depends_on: [],
		milestones: ["mls-002-analytics-launch"],
		tasks: [
			{
				id: "tsk-001",
				description: "Design analytics event schema",
				priority: "critical",
				estimated_hours: 4,
				status: "pending",
			},
			{
				id: "tsk-002",
				description: "Implement event ingestion API",
				priority: "critical",
				estimated_hours: 8,
				status: "pending",
			},
			{
				id: "tsk-003",
				description: "Set up TimescaleDB for time-series data",
				priority: "high",
				estimated_hours: 6,
				status: "pending",
			},
			{
				id: "tsk-004",
				description: "Build aggregation queries for dashboard",
				priority: "high",
				estimated_hours: 12,
				status: "pending",
			},
		],
		flows: [],
		test_cases: [
			{
				id: "tst-001",
				description: "Events are ingested and queryable within 5 seconds",
				type: "performance",
				status: "pending",
			},
		],
		api_contracts: [
			{
				id: "api-001",
				endpoint: "/analytics/events",
				method: "POST",
				description: "Submit analytics events",
				request_example:
					'{"event": "page_view", "properties": {"path": "/dashboard"}}',
				response_example: '{"success": true}',
			},
		],
		data_models: [
			{
				id: "dat-001",
				name: "AnalyticsEvent",
				description: "Individual analytics event",
				fields: [
					"id: uuid",
					"user_id: string",
					"event_name: string",
					"properties: jsonb",
					"timestamp: timestamptz",
				],
			},
		],
		references: [],
	},
];

// Generate Components
const components = [
	{
		type: "component",
		number: 1,
		slug: "web-app",
		name: "Web Application",
		description:
			"Main web application built with React and TypeScript, providing the user interface for all platform features.",
		component_type: "app",
		folder: "apps/web",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		tech_stack: [
			"React 18",
			"TypeScript",
			"Vite",
			"TailwindCSS",
			"React Router",
			"TanStack Query",
		],
		deployments: [
			{
				platform: "Vercel",
				url: "https://app.example.com",
				build_command: "pnpm build",
				deploy_command: "vercel --prod",
				environment_vars: ["VITE_API_URL", "VITE_OAUTH_GOOGLE_CLIENT_ID"],
				secrets: ["OAUTH_GOOGLE_CLIENT_SECRET"],
				notes: "Preview deployments created for all PRs automatically",
			},
		],
		scope: {
			in_scope: [
				{
					item: "User authentication UI",
					reasoning: "Core user-facing feature",
				},
				{
					item: "Analytics dashboard",
					reasoning: "Primary value proposition",
				},
				{
					item: "Team management interface",
					reasoning: "Required for team plans",
				},
			],
			out_of_scope: [
				{
					item: "Mobile app",
					reasoning: "Separate component tracked as cmp-003",
				},
				{
					item: "Admin panel",
					reasoning: "Separate internal tool, different deployment",
				},
			],
		},
		depends_on: ["cmp-002-api-server"],
		external_dependencies: ["Google OAuth SDK", "Chart.js", "Stripe Elements"],
		dev_port: 3000,
		notes: "Uses pnpm workspaces for monorepo setup",
	},
	{
		type: "component",
		number: 2,
		slug: "api-server",
		name: "API Server",
		description:
			"REST API server built with Node.js and Express, handling all backend logic, authentication, and data persistence.",
		component_type: "service",
		folder: "apps/api",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		tech_stack: [
			"Node.js 20",
			"Express",
			"TypeScript",
			"PostgreSQL",
			"Prisma ORM",
			"Redis",
		],
		deployments: [
			{
				platform: "Railway",
				url: "https://api.example.com",
				build_command: "pnpm build",
				deploy_command: "railway up",
				environment_vars: ["DATABASE_URL", "REDIS_URL", "JWT_SECRET"],
				secrets: [
					"OAUTH_GOOGLE_CLIENT_SECRET",
					"OAUTH_GITHUB_CLIENT_SECRET",
					"STRIPE_SECRET_KEY",
				],
				notes: "Auto-scaling enabled with 2-10 instances",
			},
		],
		scope: {
			in_scope: [
				{
					item: "RESTful API endpoints",
					reasoning: "Core backend functionality",
				},
				{
					item: "Authentication middleware",
					reasoning: "Security requirement",
				},
				{
					item: "Database migrations",
					reasoning: "Data management",
				},
			],
			out_of_scope: [
				{
					item: "GraphQL API",
					reasoning: "Future consideration, REST is sufficient for now",
				},
			],
		},
		depends_on: [],
		external_dependencies: ["PostgreSQL 14+", "Redis 7+", "Stripe API"],
		dev_port: 4000,
		notes: "Runs database migrations on startup in production",
	},
	{
		type: "component",
		number: 3,
		slug: "shared-ui-library",
		name: "Shared UI Component Library",
		description:
			"Reusable React component library with design system components used across web and mobile applications.",
		component_type: "library",
		folder: "packages/ui",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		tech_stack: ["React", "TypeScript", "Storybook", "TailwindCSS", "Radix UI"],
		deployments: [
			{
				platform: "npm",
				url: "https://www.npmjs.com/package/@example/ui",
				build_command: "pnpm build",
				deploy_command: "pnpm publish",
				notes: "Published as public npm package with semantic versioning",
			},
		],
		scope: {
			in_scope: [
				{
					item: "Button, Input, Card, Modal components",
					reasoning: "Most commonly used UI primitives",
				},
				{
					item: "Design tokens and theme system",
					reasoning: "Consistent styling across apps",
				},
				{
					item: "Storybook documentation",
					reasoning: "Component usage examples for developers",
				},
			],
			out_of_scope: [
				{
					item: "Complex data visualization components",
					reasoning: "App-specific, not shared across projects",
				},
			],
		},
		depends_on: [],
		external_dependencies: ["Radix UI primitives", "class-variance-authority"],
		notes: "Components are fully typed and tested with Vitest",
	},
];

// Generate Decisions
const decisions = [
	{
		type: "decision",
		number: 1,
		slug: "use-postgresql",
		name: "Use PostgreSQL as Primary Database",
		description:
			"Decision to use PostgreSQL instead of MongoDB for our primary database, with TimescaleDB extension for time-series analytics data.",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		decision:
			"We will use PostgreSQL 14+ as our primary database with TimescaleDB extension for analytics time-series data.",
		context:
			"Need to select a database that supports both relational data (users, teams, permissions) and efficient time-series analytics storage. Team has more experience with SQL databases and values ACID guarantees.",
		decision_status: "accepted",
		alternatives: [
			"MongoDB - Good for flexible schema but team less experienced with it",
			"MySQL - Similar to PostgreSQL but weaker JSON support and no TimescaleDB equivalent",
			"Separate databases for relational and time-series data - Added operational complexity",
		],
		references: [
			{
				type: "benchmark",
				description: "TimescaleDB Performance Benchmarks",
				url: "https://www.timescale.com/blog/timescaledb-vs-influxdb-for-time-series-data-timescale-influx-sql-nosql-36489299877",
				title: "TimescaleDB Benchmarks",
			},
		],
		consequences: [
			{
				type: "positive",
				description: "Strong ACID guarantees and data consistency",
			},
			{
				type: "positive",
				description: "Team already familiar with SQL and PostgreSQL",
			},
			{
				type: "positive",
				description:
					"TimescaleDB provides excellent time-series performance without separate system",
			},
			{
				type: "negative",
				description:
					"Requires more careful schema design upfront compared to document databases",
			},
			{
				type: "risk",
				description: "May need sharding if we exceed single-server capacity",
				mitigation:
					"Start with vertical scaling and plan for horizontal sharding using Citus extension if needed",
			},
		],
	},
	{
		type: "decision",
		number: 2,
		slug: "monorepo-with-pnpm",
		name: "Use pnpm Monorepo Structure",
		description:
			"Decision to organize codebase as a monorepo using pnpm workspaces instead of separate repositories.",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		decision:
			"We will use a monorepo structure with pnpm workspaces to manage all applications and shared packages in a single repository.",
		context:
			"Need to decide on repository structure for multiple applications (web, api, mobile) and shared packages (UI library, utilities). Want to enable code sharing while maintaining good development experience.",
		decision_status: "accepted",
		alternatives: [
			"Separate repositories - Clean boundaries but harder to coordinate changes across repos",
			"npm workspaces - Similar features but pnpm has better performance and disk usage",
			"Yarn workspaces - Good option but pnpm's stricter dependency resolution prevents issues",
		],
		references: [
			{
				type: "documentation",
				description: "pnpm Workspaces Documentation",
				url: "https://pnpm.io/workspaces",
				title: "pnpm Workspaces",
			},
		],
		consequences: [
			{
				type: "positive",
				description: "Easy to share code between applications and packages",
			},
			{
				type: "positive",
				description: "Atomic commits across multiple packages",
			},
			{
				type: "positive",
				description: "Simplified CI/CD with single repository",
			},
			{
				type: "negative",
				description: "Large repository size as project grows",
			},
			{
				type: "risk",
				description: "CI builds become slower with many packages",
				mitigation:
					"Use Turborepo or Nx for smart caching and incremental builds",
			},
		],
	},
	{
		type: "decision",
		number: 3,
		slug: "react-for-frontend",
		name: "React for Frontend Framework",
		description:
			"Decision to use React instead of Vue or Svelte for all frontend applications.",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		decision:
			"We will use React 18+ with TypeScript for all frontend applications (web and mobile via React Native).",
		context:
			"Need to select a frontend framework that the team can use effectively, has good ecosystem support, and can be shared between web and mobile platforms.",
		decision_status: "accepted",
		alternatives: [
			"Vue 3 - Clean API and good DX but smaller ecosystem for complex applications",
			"Svelte - Excellent performance but smaller ecosystem and no mobile solution",
			"Angular - Full framework but heavier learning curve and not suitable for mobile",
		],
		references: [],
		consequences: [
			{
				type: "positive",
				description:
					"Largest ecosystem with most third-party libraries and components",
			},
			{
				type: "positive",
				description:
					"Can share components between web (React) and mobile (React Native)",
			},
			{
				type: "positive",
				description: "Team already has React experience",
			},
			{
				type: "negative",
				description: "More boilerplate compared to Vue or Svelte",
			},
			{
				type: "risk",
				description: "React's update cycle can break things in major versions",
				mitigation:
					"Pin versions carefully and allocate time for upgrade testing",
			},
		],
	},
];

// Generate Constitutions
const constitutions = [
	{
		type: "constitution",
		number: 1,
		slug: "core-engineering-principles",
		name: "Core Engineering Principles",
		description:
			"Foundational principles that guide all technical decisions and development practices across the organization.",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		articles: [
			{
				id: "art-001",
				title: "Security First",
				principle:
					"Security considerations must be addressed at the design phase, not as an afterthought.",
				rationale:
					"Retrofitting security into existing systems is expensive and often incomplete. Early security design prevents vulnerabilities and builds user trust.",
				examples: [
					"All new APIs undergo security review before implementation",
					"Authentication and authorization designed before building features",
					"Dependencies scanned for vulnerabilities in CI/CD pipeline",
				],
				exceptions: [
					"Proof-of-concept code for internal evaluation only (must not reach production)",
				],
				status: "active",
			},
			{
				id: "art-002",
				title: "Test-Driven Quality",
				principle:
					"All production code must have accompanying automated tests before being merged.",
				rationale:
					"Tests serve as living documentation, enable safe refactoring, and catch regressions early. Writing tests first improves API design.",
				examples: [
					"Unit tests for all business logic with >80% coverage",
					"Integration tests for API endpoints",
					"End-to-end tests for critical user flows",
				],
				exceptions: [
					"Prototype code in feature branches not intended for production",
					"Generated code (migrations, types) where tests would be redundant",
				],
				status: "active",
			},
			{
				id: "art-003",
				title: "Performance Budget",
				principle:
					"All features must meet defined performance budgets for load time, response time, and resource usage.",
				rationale:
					"Performance directly impacts user experience and conversion rates. Slow applications lose users and revenue.",
				examples: [
					"Web pages must load in <2s on 4G connections",
					"API endpoints must respond in <200ms at p95",
					"Bundle size increases require explicit approval",
				],
				exceptions: [
					"Admin interfaces with limited user base (but still must be usable)",
					"One-time migration scripts",
				],
				status: "active",
			},
			{
				id: "art-004",
				title: "Accessibility is Not Optional",
				principle:
					"All user interfaces must meet WCAG 2.1 Level AA standards for accessibility.",
				rationale:
					"Accessible design benefits all users and is increasingly a legal requirement. Excluding users with disabilities limits our market and is unethical.",
				examples: [
					"All interactive elements keyboard accessible",
					"Proper ARIA labels on all form controls",
					"Minimum 4.5:1 contrast ratio for text",
				],
				exceptions: [
					"Internal development tools (but should still follow basics)",
				],
				status: "active",
			},
			{
				id: "art-005",
				title: "Code Review is Mandatory",
				principle:
					"All code changes must be reviewed and approved by at least one other engineer before merging.",
				rationale:
					"Code review catches bugs, shares knowledge across the team, and maintains consistent code quality and style.",
				examples: [
					"Pull requests require approval from one reviewer",
					"Complex changes require architecture review",
					"Security-sensitive changes reviewed by security team",
				],
				exceptions: [
					"Hotfixes for production incidents (but must be reviewed retroactively)",
					"Documentation-only changes (but still recommended)",
				],
				status: "active",
			},
		],
	},
];

// Generate Milestones
const milestones = [
	{
		type: "milestone",
		number: 1,
		slug: "auth-launch",
		name: "Authentication System Launch",
		description:
			"Complete and launch the full authentication system including email/password and OAuth flows.",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
		references: [
			{
				type: "documentation",
				description: "Authentication implementation plan",
				title: "Auth Plan",
			},
		],
	},
	{
		type: "milestone",
		number: 2,
		slug: "analytics-launch",
		name: "Analytics Dashboard Launch",
		description:
			"Launch the analytics dashboard with real-time metrics and reporting capabilities.",
		priority: "high",
		created_at: timestamp(),
		updated_at: timestamp(),
		target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
		references: [],
	},
	{
		type: "milestone",
		number: 3,
		slug: "beta-launch",
		name: "Public Beta Launch",
		description:
			"Launch platform to public beta users with core features complete and stable.",
		priority: "critical",
		created_at: timestamp(),
		updated_at: timestamp(),
		target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
		references: [
			{
				type: "documentation",
				description: "Beta launch checklist and requirements",
				title: "Beta Launch Plan",
			},
		],
	},
];

// Write all files
console.log("Generating test data...\n");

// Business Requirements
for (const req of businessRequirements) {
	const filename = `brd-${String(req.number).padStart(3, "0")}-${req.slug}.yml`;
	const filepath = join(SPECS_DIR, "requirements/business", filename);
	writeFileSync(filepath, YAML.stringify(req));
	console.log(`✓ Created ${filename}`);
}

// Technical Requirements
for (const req of technicalRequirements) {
	const filename = `prd-${String(req.number).padStart(3, "0")}-${req.slug}.yml`;
	const filepath = join(SPECS_DIR, "requirements/technical", filename);
	writeFileSync(filepath, YAML.stringify(req));
	console.log(`✓ Created ${filename}`);
}

// Plans
for (const plan of plans) {
	const filename = `pln-${String(plan.number).padStart(3, "0")}-${plan.slug}.yml`;
	const filepath = join(SPECS_DIR, "plans", filename);
	writeFileSync(filepath, YAML.stringify(plan));
	console.log(`✓ Created ${filename}`);
}

// Components
for (const component of components) {
	const filename = `cmp-${String(component.number).padStart(3, "0")}-${component.slug}.yml`;
	const filepath = join(SPECS_DIR, "components", filename);
	writeFileSync(filepath, YAML.stringify(component));
	console.log(`✓ Created ${filename}`);
}

// Decisions
for (const decision of decisions) {
	const filename = `dec-${String(decision.number).padStart(3, "0")}-${decision.slug}.yml`;
	const filepath = join(SPECS_DIR, "decisions", filename);
	writeFileSync(filepath, YAML.stringify(decision));
	console.log(`✓ Created ${filename}`);
}

// Constitutions
for (const constitution of constitutions) {
	const filename = `con-${String(constitution.number).padStart(3, "0")}-${constitution.slug}.yml`;
	const filepath = join(SPECS_DIR, "constitutions", filename);
	writeFileSync(filepath, YAML.stringify(constitution));
	console.log(`✓ Created ${filename}`);
}

// Milestones
for (const milestone of milestones) {
	const filename = `mls-${String(milestone.number).padStart(3, "0")}-${milestone.slug}.yml`;
	const filepath = join(SPECS_DIR, "milestones", filename);
	writeFileSync(filepath, YAML.stringify(milestone));
	console.log(`✓ Created ${filename}`);
}

// Update specs.yml counters
const counters = {
	counters: {
		business_requirements: businessRequirements.length,
		tech_requirements: technicalRequirements.length,
		plans: plans.length,
		components: components.length,
		constitutions: constitutions.length,
		decisions: decisions.length,
		milestones: milestones.length,
		tasks: plans.reduce((sum, plan) => sum + plan.tasks.length, 0),
	},
};

writeFileSync(join(SPECS_DIR, "specs.yml"), YAML.stringify(counters));
console.log(`✓ Updated specs.yml`);

console.log("\n✨ Test data generation complete!");
console.log("\nSummary:");
console.log(`  ${businessRequirements.length} business requirements`);
console.log(`  ${technicalRequirements.length} technical requirements`);
console.log(`  ${plans.length} plans`);
console.log(`  ${components.length} components`);
console.log(`  ${decisions.length} decisions`);
console.log(`  ${constitutions.length} constitutions`);
console.log(`  ${milestones.length} milestones`);
