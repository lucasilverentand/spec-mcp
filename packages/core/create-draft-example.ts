import { SpecManager } from "./src/spec-manager";
import path from "node:path";

async function createDraftExample() {
	const testDir = path.join(process.cwd(), "test-output");
	const specManager = new SpecManager(testDir);

	console.log("Creating draft example...");

	// Create a draft business requirement
	const draft = await specManager.business_requirements.create({
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
				id: "crit-016",
				description: "Support iOS 14+",
				status: "needs-review",
			},
			{
				id: "crit-017",
				description: "Support Android 10+",
				status: "needs-review",
			},
		],
		priority: "medium",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		status: {
			completed: false,
			completed_at: null,
			verified: false,
			verified_at: null,
			notes: ["This is still in draft - requirements not finalized"],
		},
	});

	console.log(`  ✓ Created DRAFT: ${draft.slug} (${draft.number})`);
	console.log("");
	console.log("Draft file created:");
	console.log(
		`  requirements/business/breq-${draft.number}-mobile-app-support.draft.yml`,
	);
	console.log("");
	console.log("Notice the .draft before .yml extension!");
}

createDraftExample().catch((error) => {
	console.error("Error creating draft example:", error);
	process.exit(1);
});
