import type { APIRoute } from "astro";

const serverStartTime = Date.now();

export const GET: APIRoute = async () => {
	try {
		const uptime = Math.floor((Date.now() - serverStartTime) / 1000);

		return new Response(
			JSON.stringify({
				running: true,
				clients: 0, // This would be populated by the WebSocket server
				uptime,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Failed to fetch status:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to fetch status",
				message: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
