import { CheckCircle2, Clock, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createWebSocketClient } from "@/lib/websocket-client";

interface Draft {
	id: string;
	type: string;
	status: "active" | "completed";
	progress: number;
	createdAt: string;
	questionsAnswered: number;
	totalQuestions: number;
}

export function DraftList() {
	const [drafts, setDrafts] = useState<Draft[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Fetch initial drafts
		fetch("/api/drafts")
			.then((res) => res.json())
			.then((data) => {
				setDrafts(data.drafts || []);
				setLoading(false);
			})
			.catch((error) => {
				console.error("Failed to fetch drafts:", error);
				setLoading(false);
			});

		// Set up WebSocket for real-time updates
		const wsClient = createWebSocketClient();
		wsClient.connect();

		const unsubscribe = wsClient.subscribe((message) => {
			if (
				message.type === "draft:created" ||
				message.type === "draft:updated" ||
				message.type === "draft:finalized"
			) {
				// Refetch drafts on any draft event
				fetch("/api/drafts")
					.then((res) => res.json())
					.then((data) => setDrafts(data.drafts || []))
					.catch((error) => console.error("Failed to fetch drafts:", error));
			}
		});

		return () => {
			unsubscribe();
			wsClient.disconnect();
		};
	}, []);

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">Loading drafts...</p>
				</CardContent>
			</Card>
		);
	}

	if (drafts.length === 0) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col items-center justify-center text-center py-8">
						<FileText className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">No active drafts</p>
						<p className="text-sm text-muted-foreground mt-2">
							Start a new draft to see it here
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4">
			{drafts.map((draft) => (
				<Card key={draft.id} className="hover:shadow-md transition-shadow">
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-lg">
									{draft.type.replace(/-/g, " ").toUpperCase()}
								</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">{draft.id}</p>
							</div>
							<Badge
								variant={draft.status === "completed" ? "default" : "secondary"}
							>
								{draft.status === "completed" ? (
									<>
										<CheckCircle2 className="h-3 w-3 mr-1" />
										Completed
									</>
								) : (
									<>
										<Clock className="h-3 w-3 mr-1" />
										Active
									</>
								)}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div>
								<div className="flex items-center justify-between text-sm mb-2">
									<span className="text-muted-foreground">Progress</span>
									<span className="font-medium">
										{Math.round(draft.progress)}%
									</span>
								</div>
								<Progress value={draft.progress} />
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Questions</span>
								<span className="font-medium">
									{draft.questionsAnswered} / {draft.totalQuestions}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Created</span>
								<span className="font-medium">
									{new Date(draft.createdAt).toLocaleString()}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
