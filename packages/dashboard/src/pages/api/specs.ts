import type { APIRoute } from "astro";
import { getDashboardContext } from "@/lib/context";

export const GET: APIRoute = async () => {
	try {
		const { specManager } = getDashboardContext();

		// Load all spec types
		const [
			businessRequirements,
			techRequirements,
			plans,
			components,
			decisions,
			constitutions,
			milestones,
		] = await Promise.all([
			specManager.business_requirements.list(),
			specManager.tech_requirements.list(),
			specManager.plans.list(),
			specManager.components.list(),
			specManager.decisions.list(),
			specManager.constitutions.list(),
			specManager.milestones.list(),
		]);

		const allSpecs = [
			...businessRequirements,
			...techRequirements,
			...plans,
			...components,
			...decisions,
			...constitutions,
			...milestones,
		];

		const specs = allSpecs.map((spec) => ({
			id: `${spec.type}-${spec.number}`,
			type: spec.type,
			slug: spec.slug,
			name: "name" in spec ? spec.name : undefined,
			draft: "draft" in spec ? spec.draft : false,
			valid: true, // Assume valid if it loaded successfully
			created_at: spec.created_at,
			updated_at: spec.updated_at,
		}));

		return new Response(JSON.stringify({ specs }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Failed to fetch specs:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to fetch specs",
				message: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
