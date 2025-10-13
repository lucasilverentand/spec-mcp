import {
	BookOpen,
	FileCode,
	FileText,
	Folder,
	GitBranch,
	Lightbulb,
	ScrollText,
	Target,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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

interface SpecTypeInfo {
	name: string;
	description: string;
	icon: typeof FileCode;
}

const specTypeInfo: Record<string, SpecTypeInfo> = {
	"business-requirements": {
		name: "Business Requirements",
		description: "High-level business goals and objectives",
		icon: Target,
	},
	"tech-requirements": {
		name: "Technical Requirements",
		description: "Technical specifications and constraints",
		icon: FileCode,
	},
	plans: {
		name: "Plans",
		description: "Implementation plans and strategies",
		icon: GitBranch,
	},
	components: {
		name: "Components",
		description: "System components and architecture",
		icon: FileText,
	},
	decisions: {
		name: "Decisions",
		description: "Architectural and design decisions",
		icon: Lightbulb,
	},
	constitutions: {
		name: "Constitutions",
		description: "Project principles and guidelines",
		icon: BookOpen,
	},
	milestones: {
		name: "Milestones",
		description: "Project milestones and goals",
		icon: ScrollText,
	},
};

function SpecBrowser() {
	const [specs, setSpecs] = useState<SpecsByType>({});
	const [loading, setLoading] = useState(true);

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

	// Get all possible spec types
	const allSpecTypes = Object.keys(specTypeInfo);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{allSpecTypes.map((type) => {
				const info = specTypeInfo[type];
				const typeSpecs = specs[type] || [];
				const Icon = info?.icon || FileCode;
				const displayName = info?.name || type.replace(/-/g, " ").toUpperCase();
				const description = info?.description || "";

				return (
					<Card
						key={type}
						className="hover:shadow-lg transition-shadow cursor-pointer group"
					>
						<a href={`/specs/${type}`} className="block">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
											<Icon className="h-5 w-5 text-primary" />
										</div>
										<div>
											<CardTitle className="text-lg">{displayName}</CardTitle>
											<CardDescription className="text-sm mt-1">
												{description}
											</CardDescription>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between">
									<div className="text-sm text-muted-foreground">
										{typeSpecs.length === 0 ? (
											"No specs yet"
										) : (
											<span className="font-medium text-foreground">
												{typeSpecs.length}{" "}
												{typeSpecs.length === 1 ? "spec" : "specs"}
											</span>
										)}
									</div>
									<Badge variant="secondary">{typeSpecs.length}</Badge>
								</div>
							</CardContent>
						</a>
					</Card>
				);
			})}
		</div>
	);
}

export default SpecBrowser;
