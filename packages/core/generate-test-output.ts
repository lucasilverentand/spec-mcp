import { SpecManager } from "./src/spec-manager";
import path from "node:path";
import { promises as fs } from "node:fs";

async function generateTestOutput() {
	const testDir = path.join(process.cwd(), "test-output");

	// Clean up existing test output
	console.log("Cleaning up existing test-output folder...");
	await fs.rm(testDir, { recursive: true, force: true });

	const specManager = new SpecManager(testDir);

	console.log("Creating comprehensive test data in:", testDir);
	console.log("");

	// ===========================================
	// BUSINESS REQUIREMENTS
	// ===========================================
	console.log("📋 Creating Business Requirements...");

	const br1 = await specManager.business_requirements.create({
		type: "business-requirement",
		slug: "user-authentication",
		name: "User Authentication",
		description:
			"Users need to be able to authenticate securely to access the system",
		draft: false,
		business_value: [
			{
				type: "customer-satisfaction",
				value: "Provides secure access to user data",
			},
			{ type: "revenue", value: "Enables paid subscription features" },
		],
		user_stories: [
			{
				role: "user",
				feature: "login with email and password",
				benefit: "access my account securely",
			},
			{
				role: "admin",
				feature: "manage user permissions",
				benefit: "control access to sensitive features",
			},
		],
		criteria: [
			{
				id: "crit-001",
				description: "User can successfully login with valid credentials",
				status: "needs-review",
			},
			{
				id: "crit-002",
				description: "User receives error message with invalid credentials",
				status: "needs-review",
			},
		],
		priority: "critical",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	const br2 = await specManager.business_requirements.create({
		type: "business-requirement",
		slug: "payment-processing",
		name: "Payment Processing",
		description:
			"System must support multiple payment methods for user transactions",
		draft: false,
		business_value: [
			{
				type: "revenue",
				value: "Directly enables monetization of the platform",
			},
		],
		user_stories: [
			{
				role: "customer",
				feature: "pay with credit card or PayPal",
				benefit: "complete purchases using my preferred method",
			},
		],
		criteria: [
			{
				id: "crit-003",
				description: "Support credit card payments (Visa, Mastercard, Amex)",
				status: "approved",
			},
			{
				id: "crit-004",
				description: "Support PayPal integration",
				status: "approved",
			},
		],
		priority: "high",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	// Draft business requirement
	const br3 = await specManager.business_requirements.create({
		type: "business-requirement",
		slug: "mobile-app-support",
		name: "Mobile App Support (DRAFT)",
		description:
			"[DRAFT] Add mobile application support for iOS and Android platforms",
		draft: true,
		business_value: [
			{
				type: "customer-satisfaction",
				value: "Allows users to access platform on mobile devices",
			},
		],
		user_stories: [
			{
				role: "mobile-user",
				feature: "access the platform on my smartphone",
				benefit: "use the service on the go",
			},
		],
		criteria: [
			{
				id: "crit-005",
				description: "Support iOS 14+",
				status: "needs-review",
			},
		],
		priority: "medium",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: ["This is still in draft - requirements not finalized"],
		},
	});

	console.log(`  ✓ Created ${br1.slug} (brq-${br1.number})`);
	console.log(`  ✓ Created ${br2.slug} (brq-${br2.number})`);
	console.log(`  ✓ Created ${br3.slug} (brq-${br3.number}) [DRAFT]`);
	console.log("");

	// ===========================================
	// TECHNICAL REQUIREMENTS
	// ===========================================
	console.log("⚙️  Creating Technical Requirements...");

	const tr1 = await specManager.tech_requirements.create({
		type: "technical-requirement",
		slug: "api-response-time",
		name: "API Response Time",
		description: "All API endpoints must respond within 200ms",
		draft: false,
		technical_context:
			"To ensure good user experience, the API must be performant. This includes database query optimization, caching strategies, and efficient algorithm implementations.",
		criteria: [
			{
				id: "crit-006",
				description: "P95 response time under 200ms for all GET requests",
				status: "needs-review",
			},
			{
				id: "crit-007",
				description: "Implement Redis caching for frequently accessed data",
				status: "approved",
			},
		],
		priority: "high",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	const tr2 = await specManager.tech_requirements.create({
		type: "technical-requirement",
		slug: "database-schema-design",
		name: "Database Schema Design",
		description: "Design normalized database schema with proper indexing",
		draft: false,
		technical_context:
			"PostgreSQL database with proper foreign key constraints, indexes on frequently queried columns, and partitioning for large tables.",
		criteria: [
			{
				id: "crit-008",
				description: "All tables in 3NF (Third Normal Form)",
				status: "completed",
			},
		],
		priority: "critical",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	console.log(`  ✓ Created ${tr1.slug} (trq-${tr1.number})`);
	console.log(`  ✓ Created ${tr2.slug} (trq-${tr2.number})`);
	console.log("");

	// ===========================================
	// PLANS
	// ===========================================
	console.log("📝 Creating Plans...");

	const plan1 = await specManager.plans.create({
		type: "plan",
		slug: "implement-authentication",
		name: "Implement Authentication System",
		description:
			"Implementation plan for the user authentication system",
		draft: false,
		criteria: {
			requirement: "brd-001-user-authentication",
			criteria: "crit-001",
		},
		scope: [
			{
				type: "in-scope",
				description: "Email/password authentication",
				rationale: "Core requirement for MVP",
			},
			{
				type: "in-scope",
				description: "JWT token management",
			},
			{
				type: "out-of-scope",
				description: "OAuth/Social login",
				rationale: "Post-MVP feature",
			},
		],
		tasks: [
			{
				id: "task-001",
				task: "Set up authentication database tables",
				status: {
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
					completed: false,
					completed_at: null,
					verified: false,
					verified_at: null,
					notes: [],
				},
			},
			{
				id: "task-002",
				task: "Implement password hashing with bcrypt",
				status: {
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
					completed: false,
					completed_at: null,
					verified: false,
					verified_at: null,
					notes: [],
				},
			},
		],
		flows: [],
		test_cases: [],
		api_contracts: [],
		data_models: [],
		references: [],
		priority: "critical",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	const plan2 = await specManager.plans.create({
		type: "plan",
		slug: "payment-integration",
		name: "Payment Gateway Integration",
		description: "Plan for integrating Stripe payment gateway",
		draft: true,
		criteria: {
			requirement: "brd-002-payment-processing",
			criteria: "crit-003",
		},
		scope: [
			{
				type: "in-scope",
				description: "Stripe API integration",
			},
			{
				type: "in-scope",
				description: "Webhook handling for payment events",
			},
		],
		tasks: [],
		flows: [],
		test_cases: [],
		api_contracts: [],
		data_models: [],
		references: [],
		priority: "high",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: ["Draft plan - awaiting approval"],
		},
	});

	console.log(`  ✓ Created ${plan1.slug} (pln-${plan1.number})`);
	console.log(`  ✓ Created ${plan2.slug} (pln-${plan2.number}) [DRAFT]`);
	console.log("");

	// ===========================================
	// COMPONENTS
	// ===========================================
	console.log("🔧 Creating Components...");

	const comp1 = await specManager.components.create({
		type: "component",
		slug: "auth-service",
		name: "Authentication Service",
		description: "Microservice handling user authentication and authorization",
		draft: false,
		component_type: "service",
		folder: "services/auth",
		tech_stack: ["Node.js", "Express", "JWT", "bcrypt", "PostgreSQL"],
		scope: [
			{
				type: "in-scope",
				description: "User login and registration",
			},
			{
				type: "in-scope",
				description: "Token generation and validation",
			},
			{
				type: "out-of-scope",
				description: "User profile management",
				rationale: "Handled by separate user-service",
			},
		],
		dev_port: 3001,
		priority: "critical",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	const comp2 = await specManager.components.create({
		type: "component",
		slug: "web-dashboard",
		name: "Web Dashboard",
		description: "Frontend web application for the admin dashboard",
		draft: false,
		component_type: "app",
		folder: "apps/web-dashboard",
		tech_stack: ["React", "TypeScript", "Vite", "TailwindCSS"],
		scope: [
			{
				type: "in-scope",
				description: "Admin interface for managing users",
			},
			{
				type: "in-scope",
				description: "Analytics dashboard",
			},
		],
		dev_port: 3000,
		priority: "high",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	console.log(`  ✓ Created ${comp1.slug} (cmp-${comp1.number})`);
	console.log(`  ✓ Created ${comp2.slug} (cmp-${comp2.number})`);
	console.log("");

	// ===========================================
	// CONSTITUTIONS
	// ===========================================
	console.log("📜 Creating Constitutions...");

	const const1 = await specManager.constitutions.create({
		type: "constitution",
		slug: "engineering-principles",
		name: "Engineering Principles",
		description:
			"Core principles that guide all engineering decisions and practices",
		draft: false,
		articles: [
			{
				id: "art-001",
				title: "Code Quality Over Speed",
				principle:
					"We prioritize writing clean, maintainable code over rushing to delivery",
				rationale:
					"Technical debt compounds over time and makes future development slower and more expensive",
				examples: [
					"Code reviews are mandatory for all PRs",
					"All code must have unit tests with >80% coverage",
				],
				exceptions: [
					"Time-boxed prototypes explicitly marked as throwaway code",
				],
				status: "active",
			},
			{
				id: "art-002",
				title: "API-First Design",
				principle: "Design and document APIs before implementation",
				rationale:
					"Clear API contracts enable parallel development and reduce integration issues",
				examples: [
					"OpenAPI specs written before coding begins",
					"API contracts reviewed by frontend and backend teams",
				],
				exceptions: [],
				status: "active",
			},
		],
		priority: "critical",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	const const2 = await specManager.constitutions.create({
		type: "constitution",
		slug: "security-guidelines",
		name: "Security Guidelines (DRAFT)",
		description: "Security best practices and requirements",
		draft: true,
		articles: [
			{
				id: "art-003",
				title: "Principle of Least Privilege",
				principle:
					"Grant minimum necessary permissions for users and services",
				rationale: "Limits potential damage from compromised accounts",
				examples: ["Role-based access control", "Scoped API tokens"],
				exceptions: [],
				status: "needs-review",
			},
		],
		priority: "high",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: ["Under review by security team"],
		},
	});

	console.log(`  ✓ Created ${const1.slug} (con-${const1.number})`);
	console.log(`  ✓ Created ${const2.slug} (con-${const2.number}) [DRAFT]`);
	console.log("");

	// ===========================================
	// DECISIONS
	// ===========================================
	console.log("💡 Creating Decisions...");

	const dec1 = await specManager.decisions.create({
		type: "decision",
		slug: "use-typescript",
		name: "Adopt TypeScript for All New Code",
		description:
			"Decision to use TypeScript instead of JavaScript for type safety",
		draft: false,
		decision:
			"All new code will be written in TypeScript. Existing JavaScript code will be gradually migrated.",
		context:
			"Team experienced frequent runtime errors that could have been caught at compile time. IDE support and developer productivity were also concerns.",
		decision_status: "accepted",
		alternatives: [
			"Continue with JavaScript and JSDoc",
			"Use Flow for type checking",
		],
		consequences: [
			{
				type: "positive",
				description: "Catch type errors at compile time rather than runtime",
			},
			{
				type: "positive",
				description: "Better IDE autocomplete and refactoring support",
			},
			{
				type: "negative",
				description: "Steeper learning curve for developers new to TypeScript",
			},
			{
				type: "negative",
				description: "Additional build step and configuration complexity",
				mitigation:
					"Provide team training and establish TypeScript best practices guide",
			},
		],
		references: [],
		priority: "high",
		status: {
			completed: true,
			completed_at: new Date().toISOString(),
			verified: true,
			verified_at: new Date().toISOString(),
			notes: [],
		},
	});

	const dec2 = await specManager.decisions.create({
		type: "decision",
		slug: "monorepo-architecture",
		name: "Use Monorepo with Turborepo",
		description: "Decision to structure codebase as a monorepo",
		draft: false,
		decision:
			"Adopt a monorepo structure using Turborepo for build orchestration and pnpm workspaces for dependency management.",
		context:
			"Managing multiple repositories was becoming difficult with shared code duplication and version drift between packages.",
		decision_status: "accepted",
		alternatives: [
			"Multi-repo with separate versioning",
			"Monorepo with Nx",
			"Monorepo with Lerna",
		],
		consequences: [
			{
				type: "positive",
				description: "Simplified dependency management and code sharing",
			},
			{
				type: "positive",
				description: "Atomic cross-package changes in single commits",
			},
			{
				type: "risk",
				description: "Repository size may grow significantly",
				mitigation: "Use Git LFS for large assets and implement proper caching",
			},
		],
		references: [],
		priority: "high",
		status: {
			completed: true,
			completed_at: new Date().toISOString(),
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	const dec3 = await specManager.decisions.create({
		type: "decision",
		slug: "graphql-vs-rest",
		name: "Evaluate GraphQL vs REST (DRAFT)",
		description: "Decision on API architecture approach",
		draft: true,
		decision:
			"Proposal to adopt GraphQL for the main API while keeping REST for webhook endpoints.",
		context:
			"Mobile team requesting more flexible data fetching to reduce over-fetching and number of API calls.",
		decision_status: "proposed",
		alternatives: ["Pure REST API", "Pure GraphQL API", "gRPC"],
		consequences: [
			{
				type: "positive",
				description: "Clients can request exactly the data they need",
			},
			{
				type: "negative",
				description: "Additional complexity in backend implementation",
			},
		],
		references: [],
		priority: "medium",
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: ["Awaiting technical review and team discussion"],
		},
	});

	console.log(`  ✓ Created ${dec1.slug} (dec-${dec1.number})`);
	console.log(`  ✓ Created ${dec2.slug} (dec-${dec2.number})`);
	console.log(`  ✓ Created ${dec3.slug} (dec-${dec3.number}) [DRAFT]`);
	console.log("");

	// ===========================================
	// SUMMARY
	// ===========================================
	console.log("====================================================================");
	console.log("                    GENERATION COMPLETE");
	console.log("====================================================================");
	console.log("");

	const allBr = await specManager.business_requirements.list();
	const allTr = await specManager.tech_requirements.list();
	const allPlans = await specManager.plans.list();
	const allComponents = await specManager.components.list();
	const allConstitutions = await specManager.constitutions.list();
	const allDecisions = await specManager.decisions.list();

	console.log("📊 Summary:");
	console.log(`  Business Requirements: ${allBr.length} (${allBr.filter(x => x.draft).length} drafts)`);
	console.log(`  Technical Requirements: ${allTr.length} (${allTr.filter(x => x.draft).length} drafts)`);
	console.log(`  Plans: ${allPlans.length} (${allPlans.filter(x => x.draft).length} drafts)`);
	console.log(`  Components: ${allComponents.length} (${allComponents.filter(x => x.draft).length} drafts)`);
	console.log(`  Constitutions: ${allConstitutions.length} (${allConstitutions.filter(x => x.draft).length} drafts)`);
	console.log(`  Decisions: ${allDecisions.length} (${allDecisions.filter(x => x.draft).length} drafts)`);
	console.log("");

	console.log("📁 Files created:");
	console.log(`  requirements/business/brq-1-user-authentication.yml`);
	console.log(`  requirements/business/brq-2-payment-processing.yml`);
	console.log(`  requirements/business/brq-3-mobile-app-support.draft.yml`);
	console.log(`  requirements/technical/trq-1-api-response-time.yml`);
	console.log(`  requirements/technical/trq-2-database-schema-design.yml`);
	console.log(`  plans/pln-1-implement-authentication.yml`);
	console.log(`  plans/pln-2-payment-integration.draft.yml`);
	console.log(`  components/cmp-1-auth-service.yml`);
	console.log(`  components/cmp-2-web-dashboard.yml`);
	console.log(`  constitutions/con-1-engineering-principles.yml`);
	console.log(`  constitutions/con-2-security-guidelines.draft.yml`);
	console.log(`  decisions/dec-1-use-typescript.yml`);
	console.log(`  decisions/dec-2-monorepo-architecture.yml`);
	console.log(`  decisions/dec-3-graphql-vs-rest.draft.yml`);
	console.log("");
	console.log(`✅ All files generated using SpecManager API in: ${testDir}`);
	console.log("====================================================================");
}

generateTestOutput().catch((error) => {
	console.error("❌ Error generating test output:", error);
	process.exit(1);
});
