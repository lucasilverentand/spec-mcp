import { AlertCircle, CheckCircle2, FileCode, Folder } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWebSocketClient } from "@/lib/websocket-client";

interface Spec {
	id: string;
	type: string;
	slug: string;
	name?: string;
	draft: boolean;
	valid: boolean;
	created_at: string;
	updated_at: string;
}

interface SpecsByType {
	[type: string]: Spec[];
}

export function SpecBrowser() {
	const [specs, setSpecs] = useState<SpecsByType>({});
	const [loading, setLoading] = useState(true);
	const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

	const fetchSpecs = useCallback(() => {
		fetch("/api/specs")
			.then((res) => res.json())
			.then((data) => {
				// Group specs by type
				const grouped: SpecsByType = {};
				for (const spec of data.specs || []) {
					if (!grouped[spec.type]) {
						grouped[spec.type] = [];
					}
					const typeGroup = grouped[spec.type];
					if (typeGroup) {
						typeGroup.push(spec);
					}
				}
				setSpecs(grouped);
				setLoading(false);

				// Expand all types by default
				setExpandedTypes(new Set(Object.keys(grouped)));
			})
			.catch((error) => {
				console.error("Failed to fetch specs:", error);
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		// Fetch initial specs
		fetchSpecs();

		// Set up WebSocket for real-time updates
		const wsClient = createWebSocketClient();
		wsClient.connect();

		const unsubscribe = wsClient.subscribe((message) => {
			if (
				message.type === "spec:created" ||
				message.type === "spec:updated" ||
				message.type === "spec:deleted"
			) {
				// Refetch specs on any spec event
				fetchSpecs();
			}
		});

		return () => {
			unsubscribe();
			wsClient.disconnect();
		};
	}, [fetchSpecs]);

	const toggleType = (type: string) => {
		setExpandedTypes((prev) => {
			const next = new Set(prev);
			if (next.has(type)) {
				next.delete(type);
			} else {
				next.add(type);
			}
			return next;
		});
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">Loading specs...</p>
				</CardContent>
			</Card>
		);
	}

	if (Object.keys(specs).length === 0) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col items-center justify-center text-center py-8">
						<Folder className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">No specifications found</p>
						<p className="text-sm text-muted-foreground mt-2">
							Create a draft to get started
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{Object.entries(specs).map(([type, typeSpecs]) => (
				<Card key={type}>
					<CardHeader
						className="pb-3 cursor-pointer"
						onClick={() => toggleType(type)}
					>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<Folder className="h-4 w-4" />
								{type.replace(/-/g, " ").toUpperCase()}
							</CardTitle>
							<Badge variant="secondary">{typeSpecs.length}</Badge>
						</div>
					</CardHeader>
					{expandedTypes.has(type) && (
						<CardContent className="pt-0">
							<div className="space-y-2">
								{typeSpecs.map((spec) => (
									<div
										key={spec.id}
										className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors"
									>
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">
													{spec.name || spec.slug}
												</p>
												<p className="text-xs text-muted-foreground">
													{spec.id}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											{spec.draft && (
												<Badge variant="outline" className="text-xs">
													Draft
												</Badge>
											)}
											{spec.valid ? (
												<CheckCircle2 className="h-4 w-4 text-green-500" />
											) : (
												<AlertCircle className="h-4 w-4 text-yellow-500" />
											)}
											<Button variant="ghost" size="sm" asChild>
												<a href={`/specs/${spec.id}`}>View</a>
											</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					)}
				</Card>
			))}
		</div>
	);
}
