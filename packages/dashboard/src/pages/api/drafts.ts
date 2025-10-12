import type { APIRoute } from "astro";
import { getDashboardContext } from "@/lib/context";

export const GET: APIRoute = async () => {
	try {
		const { draftStore } = getDashboardContext();

		const allDrafts = draftStore.list();

		const drafts = allDrafts.map((draftInfo) => {
			const progress =
				draftInfo.progress.total > 0
					? (draftInfo.progress.answered / draftInfo.progress.total) * 100
					: 0;

			return {
				id: draftInfo.draftId,
				type: draftInfo.type,
				status: draftInfo.stage === "complete" ? "completed" : "active",
				progress,
				questionsAnswered: draftInfo.progress.answered,
				totalQuestions: draftInfo.progress.total,
				createdAt: new Date().toISOString(),
			};
		});

		return new Response(JSON.stringify({ drafts }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Failed to fetch drafts:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to fetch drafts",
				message: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
