import {
	BookOpen,
	CheckCircle2,
	Clock,
	FileCode,
	FileText,
	GitBranch,
	Lightbulb,
	ScrollText,
	Search,
	Target,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

interface Draft {
	id: string;
	type: string;
	status: "active" | "completed";
	progress: number;
	createdAt: string;
	questionsAnswered: number;
	totalQuestions: number;
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

type ViewMode = "all" | "specs" | "drafts";

interface FilterChip {
	type: "view" | "specType";
	value: string;
	label: string;
	icon?: typeof FileCode;
}

function UnifiedBrowser() {
	const [specs, setSpecs] = useState<SpecsByType>({});
	const [drafts, setDrafts] = useState<Draft[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchInput, setSearchInput] = useState("");
	const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const fetchData = useCallback(() => {
		Promise.all([
			fetch("/api/specs").then((res) => res.json()),
			fetch("/api/drafts").then((res) => res.json()),
		])
			.then(([specsData, draftsData]) => {
				// Group specs by type
				const grouped: SpecsByType = {};
				for (const spec of specsData.specs || []) {
					if (!grouped[spec.type]) {
						grouped[spec.type] = [];
					}
					const typeGroup = grouped[spec.type];
					if (typeGroup) {
						typeGroup.push(spec);
					}
				}
				setSpecs(grouped);
				setDrafts(draftsData.drafts || []);
				setLoading(false);
			})
			.catch((error) => {
				console.error("Failed to fetch data:", error);
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		fetchData();

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
				fetchData();
			}
		});

		return () => {
			unsubscribe();
			wsClient.disconnect();
		};
	}, [fetchData]);

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">Loading...</p>
				</CardContent>
			</Card>
		);
	}

	// Get all available spec types
	const allSpecTypes = Object.keys(specTypeInfo);

	// Parse active filters
	const viewFilter =
		activeFilters.find((f) => f.type === "view")?.value || "all";
	const typeFilters = activeFilters
		.filter((f) => f.type === "specType")
		.map((f) => f.value);

	// Filter data based on active filters and search
	const searchLower = searchInput.toLowerCase().trim();

	let filteredSpecs = { ...specs };
	let filteredDrafts = [...drafts];

	// Apply type filters
	if (typeFilters.length > 0) {
		filteredSpecs = Object.fromEntries(
			Object.entries(specs).filter(([type]) => typeFilters.includes(type)),
		);
		filteredDrafts = drafts.filter((d) => typeFilters.includes(d.type));
	}

	// Apply search filter
	if (searchLower) {
		filteredSpecs = Object.fromEntries(
			Object.entries(filteredSpecs)
				.map(([type, items]) => [
					type,
					items.filter(
						(spec) =>
							spec.id.toLowerCase().includes(searchLower) ||
							spec.slug.toLowerCase().includes(searchLower) ||
							spec.name?.toLowerCase().includes(searchLower) ||
							type.toLowerCase().includes(searchLower),
					),
				])
				.filter(([, items]) => items && items.length > 0),
		);
		filteredDrafts = filteredDrafts.filter(
			(draft) =>
				draft.id.toLowerCase().includes(searchLower) ||
				draft.type.toLowerCase().includes(searchLower),
		);
	}

	const showSpecs = viewFilter === "all" || viewFilter === "specs";
	const showDrafts = viewFilter === "all" || viewFilter === "drafts";

	// Generate suggestions based on input
	const suggestions: FilterChip[] = [];
	const inputLower = searchInput.toLowerCase().trim();

	if (inputLower && !showSuggestions) {
		// Don't show suggestions if explicitly hidden
	} else if (inputLower) {
		// View mode suggestions
		const viewModes: Array<{ value: ViewMode; label: string }> = [
			{ value: "all", label: "All" },
			{ value: "specs", label: "Specs" },
			{ value: "drafts", label: "Drafts" },
		];

		for (const mode of viewModes) {
			if (
				mode.label.toLowerCase().includes(inputLower) &&
				!activeFilters.some((f) => f.type === "view" && f.value === mode.value)
			) {
				suggestions.push({
					type: "view",
					value: mode.value,
					label: mode.label,
				});
			}
		}

		// Type suggestions
		for (const type of allSpecTypes) {
			const info = specTypeInfo[type];
			const hasContent =
				(specs[type]?.length || 0) > 0 || drafts.some((d) => d.type === type);

			if (
				hasContent &&
				(type.toLowerCase().includes(inputLower) ||
					info?.name.toLowerCase().includes(inputLower)) &&
				!activeFilters.some((f) => f.type === "specType" && f.value === type)
			) {
				const suggestion: FilterChip = {
					type: "specType",
					value: type,
					label: info?.name || type,
				};
				if (info?.icon) {
					suggestion.icon = info.icon;
				}
				suggestions.push(suggestion);
			}
		}
	}

	const addFilter = (filter: FilterChip) => {
		if (filter.type === "view") {
			// Replace existing view filter
			setActiveFilters([
				...activeFilters.filter((f) => f.type !== "view"),
				filter,
			]);
		} else {
			// Add type filter if not already present
			if (!activeFilters.some((f) => f.value === filter.value)) {
				setActiveFilters([...activeFilters, filter]);
			}
		}
		setSearchInput("");
		setShowSuggestions(false);
		inputRef.current?.focus();
	};

	const removeFilter = (filter: FilterChip) => {
		setActiveFilters(activeFilters.filter((f) => f !== filter));
	};

	const clearAllFilters = () => {
		setActiveFilters([]);
		setSearchInput("");
	};

	return (
		<div className="space-y-6">
			{/* Search & Filter Input */}
			<Card className="relative">
				<CardContent className="pt-6">
					<div className="space-y-3">
						{/* Input with chips */}
						<div className="relative">
							<div className="flex items-center gap-2 p-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[42px] flex-wrap">
								<Search className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />

								{/* Active filter chips */}
								{activeFilters.map((filter, index) => {
									const Icon = filter.icon;
									return (
										<Badge
											key={`${filter.type}-${filter.value}-${index}`}
											variant="secondary"
											className="gap-1.5 px-2 py-1"
										>
											{Icon && <Icon className="h-3 w-3" />}
											{filter.label}
											<button
												type="button"
												onClick={() => removeFilter(filter)}
												className="hover:bg-background/50 rounded-sm"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									);
								})}

								{/* Input field */}
								<input
									ref={inputRef}
									type="text"
									value={searchInput}
									onChange={(e) => {
										setSearchInput(e.target.value);
										setShowSuggestions(true);
									}}
									onFocus={() => setShowSuggestions(true)}
									placeholder={
										activeFilters.length === 0
											? "Search or filter by type, view mode..."
											: "Add more filters or search..."
									}
									className="flex-1 min-w-[200px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
								/>

								{/* Clear button */}
								{(activeFilters.length > 0 || searchInput) && (
									<button
										type="button"
										onClick={clearAllFilters}
										className="text-xs text-muted-foreground hover:text-foreground shrink-0"
									>
										Clear all
									</button>
								)}
							</div>

							{/* Suggestions dropdown */}
							{showSuggestions && suggestions.length > 0 && (
								<Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-[300px] overflow-y-auto">
									<CardContent className="p-2">
										<div className="space-y-1">
											{suggestions.map((suggestion, index) => {
												const Icon = suggestion.icon;
												return (
													<button
														key={`${suggestion.type}-${suggestion.value}-${index}`}
														type="button"
														onClick={() => addFilter(suggestion)}
														className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm transition-colors"
													>
														{Icon && (
															<Icon className="h-4 w-4 text-muted-foreground" />
														)}
														<span className="flex-1 text-left">
															{suggestion.label}
														</span>
														<Badge variant="outline" className="text-xs">
															{suggestion.type === "view" ? "View" : "Type"}
														</Badge>
													</button>
												);
											})}
										</div>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Quick filter chips */}
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-xs text-muted-foreground">
								Quick filters:
							</span>
							<Badge
								variant="outline"
								className="cursor-pointer hover:bg-accent transition-colors text-xs"
								onClick={() =>
									addFilter({ type: "view", value: "drafts", label: "Drafts" })
								}
							>
								<Clock className="h-3 w-3 mr-1" />
								Drafts
							</Badge>
							<Badge
								variant="outline"
								className="cursor-pointer hover:bg-accent transition-colors text-xs"
								onClick={() =>
									addFilter({ type: "view", value: "specs", label: "Specs" })
								}
							>
								<FileCode className="h-3 w-3 mr-1" />
								Specs
							</Badge>
							{allSpecTypes.slice(0, 3).map((type) => {
								const info = specTypeInfo[type];
								const Icon = info?.icon || FileCode;
								const hasContent =
									(specs[type]?.length || 0) > 0 ||
									drafts.some((d) => d.type === type);

								if (!hasContent) return null;

								return (
									<Badge
										key={type}
										variant="outline"
										className="cursor-pointer hover:bg-accent transition-colors text-xs"
										onClick={() =>
											addFilter({
												type: "specType",
												value: type,
												label: info?.name || type,
												icon: Icon,
											})
										}
									>
										<Icon className="h-3 w-3 mr-1" />
										{info?.name || type}
									</Badge>
								);
							})}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Content */}
			<div className="space-y-8">
				{/* Drafts Section */}
				{showDrafts && filteredDrafts.length > 0 && (
					<section>
						<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
							<Clock className="h-5 w-5" />
							Active Drafts
						</h3>
						<div className="grid gap-4">
							{filteredDrafts.map((draft) => {
								const typeInfo = specTypeInfo[draft.type];
								const Icon = typeInfo?.icon || FileCode;

								return (
									<Card
										key={draft.id}
										className="hover:shadow-md transition-shadow"
									>
										<CardHeader className="pb-3">
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-3">
													<div className="p-2 rounded-lg bg-primary/10">
														<Icon className="h-4 w-4 text-primary" />
													</div>
													<div>
														<CardTitle className="text-lg">
															{typeInfo?.name ||
																draft.type.replace(/-/g, " ").toUpperCase()}
														</CardTitle>
														<p className="text-sm text-muted-foreground mt-1">
															{draft.id}
														</p>
													</div>
												</div>
												<Badge
													variant={
														draft.status === "completed"
															? "default"
															: "secondary"
													}
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
														<span className="text-muted-foreground">
															Progress
														</span>
														<span className="font-medium">
															{Math.round(draft.progress)}%
														</span>
													</div>
													<Progress value={draft.progress} />
												</div>
												<div className="flex items-center justify-between text-sm">
													<span className="text-muted-foreground">
														Questions
													</span>
													<span className="font-medium">
														{draft.questionsAnswered} / {draft.totalQuestions}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</section>
				)}

				{/* Specs Section */}
				{showSpecs && Object.keys(filteredSpecs).length > 0 && (
					<section>
						<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
							<FileCode className="h-5 w-5" />
							Specifications
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{allSpecTypes.map((type) => {
								if (typeFilters.length > 0 && !typeFilters.includes(type))
									return null;

								const info = specTypeInfo[type];
								const typeSpecs = filteredSpecs[type] || [];

								if (typeSpecs.length === 0) return null;

								const Icon = info?.icon || FileCode;
								const displayName =
									info?.name || type.replace(/-/g, " ").toUpperCase();
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
															<CardTitle className="text-lg">
																{displayName}
															</CardTitle>
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
														<span className="font-medium text-foreground">
															{typeSpecs.length}{" "}
															{typeSpecs.length === 1 ? "spec" : "specs"}
														</span>
													</div>
													<Badge variant="secondary">{typeSpecs.length}</Badge>
												</div>
											</CardContent>
										</a>
									</Card>
								);
							})}
						</div>
					</section>
				)}

				{/* Empty State */}
				{((showSpecs &&
					Object.keys(filteredSpecs).every(
						(k) => filteredSpecs[k]?.length === 0,
					)) ||
					!showSpecs) &&
					((showDrafts && filteredDrafts.length === 0) || !showDrafts) && (
						<Card>
							<CardContent className="p-12">
								<div className="flex flex-col items-center justify-center text-center">
									<FileCode className="h-12 w-12 text-muted-foreground mb-4" />
									<p className="text-muted-foreground">No items found</p>
									<p className="text-sm text-muted-foreground mt-2">
										Try adjusting your filters
									</p>
								</div>
							</CardContent>
						</Card>
					)}
			</div>
		</div>
	);
}

export default UnifiedBrowser;
