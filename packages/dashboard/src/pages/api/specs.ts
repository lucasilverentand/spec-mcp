import type { APIRoute } from "astro";
import { getSpecManager } from "@/lib/fs-reader";

export const GET: APIRoute = async () => {
	try {
		const specManager = getSpecManager();

		// Use SpecManager.query() to get all specs
		const result = await specManager.query({
			orderBy: "updated",
			direction: "desc",
			objects: {
				specTypes: [
					"business-requirement",
					"technical-requirement",
					"plan",
					"component",
					"constitution",
					"decision",
					"milestone",
				],
			},
		});

		const specs = result.items.map((item) => ({
			id: item.id,
			type: item.type,
			slug: item.resultType === "spec" ? item.slug : "",
			name: item.name,
			draft: false,
			valid: true,
			created_at: item.created_at,
			updated_at: item.updated_at,
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
