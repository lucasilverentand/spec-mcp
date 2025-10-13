import { QuerySchema } from "@spec-mcp/schemas";
import type { APIRoute } from "astro";
import { getSpecManager } from "@/lib/fs-reader";

export const POST: APIRoute = async ({ request }) => {
	try {
		const specManager = getSpecManager();

		// Parse request body
		const body = await request.json();

		// Validate query with Zod schema
		const parseResult = QuerySchema.safeParse(body);

		if (!parseResult.success) {
			return new Response(
				JSON.stringify({
					error: "Invalid query",
					details: parseResult.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Execute query via SpecManager
		const result = await specManager.query(parseResult.data);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Failed to execute query:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to execute query",
				message: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
