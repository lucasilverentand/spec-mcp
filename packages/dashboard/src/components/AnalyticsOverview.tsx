import type { QueryResultItem } from "@spec-mcp/schemas";
import { CheckCircle2, Clock, FileCode, ListTodo } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createWebSocketClient } from "@/lib/websocket-client";

interface Analytics {
	totalSpecs: number;
	totalDrafts: number;
	totalItems: number;
	completedItems: number;
	verifiedItems: number;
	completionPercentage: number;
	verificationPercentage: number;
	specsByType: Record<string, number>;
}

function AnalyticsOverview() {
	const [analytics, setAnalytics] = useState<Analytics>({
		totalSpecs: 0,
		totalDrafts: 0,
		totalItems: 0,
		completedItems: 0,
		verifiedItems: 0,
		completionPercentage: 0,
		verificationPercentage: 0,
		specsByType: {},
	});
	const [loading, setLoading] = useState(true);

	const fetchAnalytics = useCallback(() => {
		Promise.all([
			fetch("/api/specs").then((res) => res.json()),
			fetch("/api/drafts").then((res) => res.json()),
			fetch("/api/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					objects: {
						itemTypes: [
							"task",
							"test-case",
							"criteria",
							"flow",
							"api-contract",
							"data-model",
							"user-story",
						],
					},
				}),
			}).then((res) => res.json()),
		])
			.then(([specsData, draftsData, itemsData]) => {
				const specs = specsData.specs || [];
				const drafts = draftsData.drafts || [];
				const items = itemsData.items || [];

				// Count specs by type
				const specsByType: Record<string, number> = {};
				for (const spec of specs) {
					specsByType[spec.type] = (specsByType[spec.type] || 0) + 1;
				}

				// Calculate item completion
				const completedItems = items.filter(
					(item: QueryResultItem) =>
						item.status && ["completed", "verified"].includes(item.status),
				).length;
				const verifiedItems = items.filter(
					(item: QueryResultItem) => item.status === "verified",
				).length;

				const completionPercentage =
					items.length > 0 ? (completedItems / items.length) * 100 : 0;
				const verificationPercentage =
					items.length > 0 ? (verifiedItems / items.length) * 100 : 0;

				setAnalytics({
					totalSpecs: specs.length,
					totalDrafts: drafts.length,
					totalItems: items.length,
					completedItems,
					verifiedItems,
					completionPercentage,
					verificationPercentage,
					specsByType,
				});
				setLoading(false);
			})
			.catch((error) => {
				console.error("Failed to fetch analytics:", error);
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		fetchAnalytics();

		// Set up WebSocket for real-time updates
		const wsClient = createWebSocketClient();
		wsClient.connect();

		const unsubscribe = wsClient.subscribe((message) => {
			if (
				message.type === "spec:created" ||
				message.type === "spec:updated" ||
				message.type === "spec:deleted" ||
				message.type === "draft:created" ||
				message.type === "draft:updated" ||
				message.type === "draft:finalized"
			) {
				fetchAnalytics();
			}
		});

		return () => {
			unsubscribe();
			wsClient.disconnect();
		};
	}, [fetchAnalytics]);

	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<p className="text-muted-foreground text-sm">Loading...</p>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Main Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Specifications
						</CardTitle>
						<FileCode className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalSpecs}</div>
						<p className="text-xs text-muted-foreground">
							Across all spec types
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Drafts</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalDrafts}</div>
						<p className="text-xs text-muted-foreground">In progress</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Items</CardTitle>
						<ListTodo className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalItems}</div>
						<p className="text-xs text-muted-foreground">
							Tasks, tests, criteria, etc.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Completed</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.completedItems}</div>
						<p className="text-xs text-muted-foreground">
							{Math.round(analytics.completionPercentage)}% of all items
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Progress Overview */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Overall Completion</CardTitle>
						<CardDescription>
							Track progress across all items in your specifications
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="flex items-center justify-between text-sm mb-2">
								<span className="text-muted-foreground">Completed Items</span>
								<span className="font-medium">
									{analytics.completedItems} / {analytics.totalItems}
								</span>
							</div>
							<Progress value={analytics.completionPercentage} />
							<p className="text-xs text-muted-foreground mt-2">
								{Math.round(analytics.completionPercentage)}% complete
							</p>
						</div>

						<div>
							<div className="flex items-center justify-between text-sm mb-2">
								<span className="text-muted-foreground">Verified Items</span>
								<span className="font-medium">
									{analytics.verifiedItems} / {analytics.totalItems}
								</span>
							</div>
							<Progress value={analytics.verificationPercentage} />
							<p className="text-xs text-muted-foreground mt-2">
								{Math.round(analytics.verificationPercentage)}% verified
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Specifications by Type</CardTitle>
						<CardDescription>
							Distribution of your specifications
						</CardDescription>
					</CardHeader>
					<CardContent>
						{Object.keys(analytics.specsByType).length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-4">
								No specifications yet
							</p>
						) : (
							<div className="space-y-3">
								{Object.entries(analytics.specsByType)
									.sort(([, a], [, b]) => b - a)
									.map(([type, count]) => (
										<div
											key={type}
											className="flex items-center justify-between"
										>
											<span className="text-sm font-medium capitalize">
												{type.replace(/-/g, " ")}
											</span>
											<div className="flex items-center gap-2">
												<div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
													<div
														className="h-full bg-primary"
														style={{
															width: `${(count / analytics.totalSpecs) * 100}%`,
														}}
													/>
												</div>
												<span className="text-sm text-muted-foreground w-8 text-right">
													{count}
												</span>
											</div>
										</div>
									))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default AnalyticsOverview;
