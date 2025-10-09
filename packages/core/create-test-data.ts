import { SpecManager } from "./src/spec-manager";
import path from "node:path";

async function createTestData() {
	const testDir = path.join(process.cwd(), "test-output");
	const specManager = new SpecManager(testDir);

	console.log("Creating test data in:", testDir);
	console.log("");

	// Create business requirements
	console.log("Creating business requirements...");
	const br1 = await specManager.business_requirements.create({
		type: "business-requirement",
		slug: "user-authentication",
		name: "User Authentication",
		description:
			"Users need to be able to authenticate securely to access the system",
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
			{
				id: "crit-003",
				description: "User can reset password via email",
				status: "needs-review",
			},
		],
		draft: false,
		draft: false,
		priority: "critical",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
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
		business_value: [
			{
				type: "revenue",
				value: "Directly enables monetization of the platform",
			},
			{
				type: "customer-satisfaction",
				value: "Provides flexible payment options for users",
			},
		],
		user_stories: [
			{
				role: "customer",
				feature: "pay with credit card or PayPal",
				benefit: "complete purchases using my preferred method",
			},
			{
				role: "business-owner",
				feature: "track payment transactions",
				benefit: "monitor revenue and reconcile accounts",
			},
		],
		criteria: [
			{
				id: "crit-004",
				description: "Support credit card payments (Visa, Mastercard, Amex)",
				status: "approved",
			},
			{
				id: "crit-005",
				description: "Support PayPal integration",
				status: "approved",
			},
			{
				id: "crit-006",
				description: "Process payments within 3 seconds",
				status: "needs-review",
			},
		],
		draft: false,
		priority: "high",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: ["Integrate with Stripe API", "Implement webhook handlers"],
		},
	});

	const br3 = await specManager.business_requirements.create({
		type: "business-requirement",
		slug: "user-profile-management",
		name: "User Profile Management",
		description: "Users should be able to manage their profile information",
		business_value: [
			{
				type: "customer-satisfaction",
				value: "Empowers users to control their data",
			},
		],
		user_stories: [
			{
				role: "user",
				feature: "update my profile picture and bio",
				benefit: "personalize my account",
			},
			{
				role: "user",
				feature: "change my email address",
				benefit: "keep my contact information up to date",
			},
		],
		criteria: [
			{
				id: "crit-007",
				description: "User can upload profile picture",
				status: "completed",
			},
			{
				id: "crit-008",
				description: "User can edit bio text (max 500 characters)",
				status: "in-progress",
			},
			{
				id: "crit-009",
				description: "User can update email with verification",
				status: "needs-review",
			},
		],
		draft: false,
		priority: "medium",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: [],
		},
	});

	console.log(`  ✓ Created ${br1.slug} (${br1.number})`);
	console.log(`  ✓ Created ${br2.slug} (${br2.number})`);
	console.log(`  ✓ Created ${br3.slug} (${br3.number})`);
	console.log("");

	// Create technical requirements
	console.log("Creating technical requirements...");
	const tr1 = await specManager.tech_requirements.create({
		type: "technical-requirement",
		slug: "api-response-time",
		name: "API Response Time",
		description: "All API endpoints must respond within 200ms",
		technical_context:
			"To ensure good user experience, the API must be performant. This includes database query optimization, caching strategies, and efficient algorithm implementations.",
		criteria: [
			{
				id: "crit-010",
				description: "P95 response time under 200ms for all GET requests",
				status: "needs-review",
			},
			{
				id: "crit-011",
				description: "P95 response time under 500ms for all POST/PUT requests",
				status: "needs-review",
			},
			{
				id: "crit-012",
				description: "Implement Redis caching for frequently accessed data",
				status: "approved",
			},
		],
		draft: false,
		priority: "high",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
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
		technical_context:
			"PostgreSQL database with proper foreign key constraints, indexes on frequently queried columns, and partitioning for large tables.",
		criteria: [
			{
				id: "crit-013",
				description: "All tables in 3NF (Third Normal Form)",
				status: "completed",
			},
			{
				id: "crit-014",
				description: "Indexes on all foreign keys",
				status: "completed",
			},
			{
				id: "crit-015",
				description: "Composite indexes for common query patterns",
				status: "in-progress",
			},
		],
		draft: false,
		priority: "critical",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: ["Schema migration scripts ready", "Review with DBA team"],
		},
	});

	console.log(`  ✓ Created ${tr1.slug} (${tr1.number})`);
	console.log(`  ✓ Created ${tr2.slug} (${tr2.number})`);
	console.log("");

	// List all created entities
	const allBr = await specManager.business_requirements.list();
	const allTr = await specManager.tech_requirements.list();

	console.log("Summary:");
	console.log(`  Business Requirements: ${allBr.length}`);
	console.log(`  Technical Requirements: ${allTr.length}`);
	console.log("");

	console.log("Files created:");
	console.log(
		"  requirements/business/breq-1-user-authentication.yml",
	);
	console.log(
		"  requirements/business/breq-2-payment-processing.yml",
	);
	console.log(
		"  requirements/business/breq-3-user-profile-management.yml",
	);
	console.log(
		"  requirements/technical/treq-1-api-response-time.yml",
	);
	console.log(
		"  requirements/technical/treq-2-database-schema-design.yml",
	);
	console.log("");
	console.log(`Test data created successfully in: ${testDir}`);
}

createTestData().catch((error) => {
	console.error("Error creating test data:", error);
	process.exit(1);
});
