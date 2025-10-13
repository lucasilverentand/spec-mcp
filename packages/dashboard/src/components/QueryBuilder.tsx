import type {
	EntityType,
	ItemPriority,
	ItemType,
	Query,
	QueryResultItem,
	StatusFilter,
} from "@spec-mcp/schemas";
import { ArrowUpDown, Filter, Search, X } from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface QueryBuilderProps {
	onQueryChange: (results: QueryResultItem[]) => void;
}

export function QueryBuilder({ onQueryChange }: QueryBuilderProps) {
	const idFilterId = useId();
	const milestoneFilterId = useId();

	const [_query, setQuery] = useState<Query>({
		orderBy: "created",
		direction: "desc",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<QueryResultItem[]>([]);

	// Filter states
	const [draftFilter, setDraftFilter] = useState<boolean | undefined>(
		undefined,
	);
	const [idFilter, setIdFilter] = useState("");
	const [objectTypeFilter, setObjectTypeFilter] = useState<
		"spec" | "item" | "none"
	>("none");
	const [selectedSpecTypes, setSelectedSpecTypes] = useState<EntityType[]>([]);
	const [selectedItemTypes, setSelectedItemTypes] = useState<ItemType[]>([]);
	const [completedFilter, setCompletedFilter] = useState<boolean | undefined>(
		undefined,
	);
	const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(
		undefined,
	);
	const [selectedPriorities, setSelectedPriorities] = useState<ItemPriority[]>(
		[],
	);
	const [milestoneFilter, setMilestoneFilter] = useState("");
	const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>([]);

	// New filter states
	const [textSearch, setTextSearch] = useState("");
	const [searchFields, setSearchFields] = useState<
		("title" | "description" | "all")[]
	>(["all"]);
	const [createdAfter, setCreatedAfter] = useState("");
	const [createdBefore, setCreatedBefore] = useState("");
	const [updatedAfter, setUpdatedAfter] = useState("");
	const [updatedBefore, setUpdatedBefore] = useState("");
	const [selectedDependencyStatus, setSelectedDependencyStatus] = useState<
		Array<"blocked" | "blocking" | "no-dependencies" | "has-dependencies">
	>([]);
	const [limit, setLimit] = useState<number | undefined>(undefined);
	const [offset, setOffset] = useState<number>(0);
	const [includeStats, setIncludeStats] = useState(false);
	const [includeRelated, setIncludeRelated] = useState(false);
	const [relatedTypes, setRelatedTypes] = useState<
		("dependencies" | "blocking" | "linked-specs")[]
	>([]);

	const [orderBy, setOrderBy] = useState<"next-to-do" | "created" | "updated">(
		"created",
	);
	const [direction, setDirection] = useState<"asc" | "desc">("desc");

	const specTypes: EntityType[] = [
		"business-requirement",
		"technical-requirement",
		"plan",
		"component",
		"constitution",
		"decision",
		"milestone",
	];

	const itemTypes: ItemType[] = [
		"task",
		"test-case",
		"criteria",
		"flow",
		"api-contract",
		"data-model",
		"user-story",
	];

	const priorities: ItemPriority[] = [
		"critical",
		"high",
		"medium",
		"low",
		"nice-to-have",
	];
	const statuses: StatusFilter[] = [
		"not-started",
		"in-progress",
		"completed",
		"verified",
	];

	const executeQuery = async () => {
		setLoading(true);
		setError(null);

		try {
			// Build query object
			const queryObj: Query = {
				orderBy,
				direction,
			};

			if (draftFilter !== undefined) {
				queryObj.draft = draftFilter;
			}

			if (idFilter.trim()) {
				queryObj.id = idFilter.trim();
			}

			if (objectTypeFilter === "spec" && selectedSpecTypes.length > 0) {
				queryObj.objects = { specTypes: selectedSpecTypes };
			} else if (objectTypeFilter === "item" && selectedItemTypes.length > 0) {
				queryObj.objects = { itemTypes: selectedItemTypes };
			}

			if (completedFilter !== undefined) {
				queryObj.completed = completedFilter;
			}

			if (verifiedFilter !== undefined) {
				queryObj.verified = verifiedFilter;
			}

			if (selectedPriorities.length > 0) {
				queryObj.priority = selectedPriorities;
			}

			if (milestoneFilter.trim()) {
				queryObj.milestone = milestoneFilter.trim();
			}

			if (selectedStatuses.length > 0) {
				queryObj.status = selectedStatuses;
			}

			// New filters
			if (textSearch.trim()) {
				queryObj.textSearch = textSearch.trim();
				if (!searchFields.includes("all")) {
					queryObj.searchFields = searchFields;
				}
			}

			if (createdAfter) {
				queryObj.createdAfter = createdAfter;
			}

			if (createdBefore) {
				queryObj.createdBefore = createdBefore;
			}

			if (updatedAfter) {
				queryObj.updatedAfter = updatedAfter;
			}

			if (updatedBefore) {
				queryObj.updatedBefore = updatedBefore;
			}

			if (selectedDependencyStatus.length > 0) {
				queryObj.dependencyStatus = selectedDependencyStatus;
			}

			if (limit !== undefined) {
				queryObj.limit = limit;
			}

			if (offset > 0) {
				queryObj.offset = offset;
			}

			if (includeStats) {
				queryObj.includeStats = true;
			}

			if (includeRelated && relatedTypes.length > 0) {
				queryObj.includeRelated = true;
				queryObj.relatedTypes = relatedTypes;
			}

			// Execute query via API
			const response = await fetch("/api/query", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(queryObj),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to execute query");
			}

			const result = await response.json();
			setResults(result.items);
			onQueryChange(result.items);
			setQuery(queryObj);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to execute query");
			console.error("Query error:", err);
		} finally {
			setLoading(false);
		}
	};

	const clearFilters = () => {
		setDraftFilter(undefined);
		setIdFilter("");
		setObjectTypeFilter("none");
		setSelectedSpecTypes([]);
		setSelectedItemTypes([]);
		setCompletedFilter(undefined);
		setVerifiedFilter(undefined);
		setSelectedPriorities([]);
		setMilestoneFilter("");
		setSelectedStatuses([]);
		setTextSearch("");
		setSearchFields(["all"]);
		setCreatedAfter("");
		setCreatedBefore("");
		setUpdatedAfter("");
		setUpdatedBefore("");
		setSelectedDependencyStatus([]);
		setLimit(undefined);
		setOffset(0);
		setIncludeStats(false);
		setIncludeRelated(false);
		setRelatedTypes([]);
		setOrderBy("created");
		setDirection("desc");
		setResults([]);
		onQueryChange([]);
	};

	const toggleArrayValue = <T,>(
		array: T[],
		value: T,
		setter: (arr: T[]) => void,
	) => {
		if (array.includes(value)) {
			setter(array.filter((v) => v !== value));
		} else {
			setter([...array, value]);
		}
	};

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Filter className="h-5 w-5" />
					Query Builder
				</CardTitle>
				<CardDescription>
					Filter and search specs and sub-items with advanced criteria
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Draft Filter */}
					<div>
						<div className="text-sm font-medium mb-2">Draft Status</div>
						<div className="flex gap-2">
							<Button
								variant={draftFilter === undefined ? "default" : "outline"}
								size="sm"
								onClick={() => setDraftFilter(undefined)}
							>
								All
							</Button>
							<Button
								variant={draftFilter === true ? "default" : "outline"}
								size="sm"
								onClick={() => setDraftFilter(true)}
							>
								Drafts Only
							</Button>
							<Button
								variant={draftFilter === false ? "default" : "outline"}
								size="sm"
								onClick={() => setDraftFilter(false)}
							>
								Finalized Only
							</Button>
						</div>
					</div>

					{/* ID Filter */}
					<div>
						<label
							htmlFor={idFilterId}
							className="text-sm font-medium mb-2 block"
						>
							ID Filter
						</label>
						<Input
							id={idFilterId}
							placeholder="e.g., pln-001 or breq-001-auth"
							value={idFilter}
							onChange={(e) => setIdFilter(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground mt-1">
							Full ID, partial ID, or parent ID to get sub-items
						</p>
					</div>

					{/* Object Type Filter */}
					<div>
						<div className="text-sm font-medium mb-2">Object Type</div>
						<div className="flex gap-2 mb-2">
							<Button
								variant={objectTypeFilter === "none" ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setObjectTypeFilter("none");
									setSelectedSpecTypes([]);
									setSelectedItemTypes([]);
								}}
							>
								All
							</Button>
							<Button
								variant={objectTypeFilter === "spec" ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setObjectTypeFilter("spec");
									setSelectedItemTypes([]);
								}}
							>
								Spec Types
							</Button>
							<Button
								variant={objectTypeFilter === "item" ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setObjectTypeFilter("item");
									setSelectedSpecTypes([]);
								}}
							>
								Item Types
							</Button>
						</div>

						{objectTypeFilter === "spec" && (
							<div className="flex flex-wrap gap-2">
								{specTypes.map((type) => (
									<Badge
										key={type}
										variant={
											selectedSpecTypes.includes(type) ? "default" : "outline"
										}
										className="cursor-pointer"
										onClick={() =>
											toggleArrayValue(
												selectedSpecTypes,
												type,
												setSelectedSpecTypes,
											)
										}
									>
										{type}
									</Badge>
								))}
							</div>
						)}

						{objectTypeFilter === "item" && (
							<div className="flex flex-wrap gap-2">
								{itemTypes.map((type) => (
									<Badge
										key={type}
										variant={
											selectedItemTypes.includes(type) ? "default" : "outline"
										}
										className="cursor-pointer"
										onClick={() =>
											toggleArrayValue(
												selectedItemTypes,
												type,
												setSelectedItemTypes,
											)
										}
									>
										{type}
									</Badge>
								))}
							</div>
						)}
					</div>

					{/* Completion Filters */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="text-sm font-medium mb-2">Completed</div>
							<div className="flex gap-2">
								<Button
									variant={
										completedFilter === undefined ? "default" : "outline"
									}
									size="sm"
									onClick={() => setCompletedFilter(undefined)}
								>
									All
								</Button>
								<Button
									variant={completedFilter === true ? "default" : "outline"}
									size="sm"
									onClick={() => setCompletedFilter(true)}
								>
									Yes
								</Button>
								<Button
									variant={completedFilter === false ? "default" : "outline"}
									size="sm"
									onClick={() => setCompletedFilter(false)}
								>
									No
								</Button>
							</div>
						</div>

						<div>
							<div className="text-sm font-medium mb-2">Verified</div>
							<div className="flex gap-2">
								<Button
									variant={verifiedFilter === undefined ? "default" : "outline"}
									size="sm"
									onClick={() => setVerifiedFilter(undefined)}
								>
									All
								</Button>
								<Button
									variant={verifiedFilter === true ? "default" : "outline"}
									size="sm"
									onClick={() => setVerifiedFilter(true)}
								>
									Yes
								</Button>
								<Button
									variant={verifiedFilter === false ? "default" : "outline"}
									size="sm"
									onClick={() => setVerifiedFilter(false)}
								>
									No
								</Button>
							</div>
						</div>
					</div>

					{/* Priority Filter */}
					<div>
						<div className="text-sm font-medium mb-2">Priority</div>
						<div className="flex flex-wrap gap-2">
							{priorities.map((priority) => (
								<Badge
									key={priority}
									variant={
										selectedPriorities.includes(priority)
											? "default"
											: "outline"
									}
									className="cursor-pointer"
									onClick={() =>
										toggleArrayValue(
											selectedPriorities,
											priority,
											setSelectedPriorities,
										)
									}
								>
									{priority}
								</Badge>
							))}
						</div>
					</div>

					{/* Milestone Filter */}
					<div>
						<label
							htmlFor={milestoneFilterId}
							className="text-sm font-medium mb-2 block"
						>
							Milestone
						</label>
						<Input
							id={milestoneFilterId}
							placeholder="e.g., mls-001-q1-release"
							value={milestoneFilter}
							onChange={(e) => setMilestoneFilter(e.target.value)}
						/>
					</div>

					{/* Status Filter */}
					<div>
						<div className="text-sm font-medium mb-2">Status</div>
						<div className="flex flex-wrap gap-2">
							{statuses.map((status) => (
								<Badge
									key={status}
									variant={
										selectedStatuses.includes(status) ? "default" : "outline"
									}
									className="cursor-pointer"
									onClick={() =>
										toggleArrayValue(
											selectedStatuses,
											status,
											setSelectedStatuses,
										)
									}
								>
									{status}
								</Badge>
							))}
						</div>
					</div>

					{/* Text Search (Feature 1 & 8) */}
					<div>
						<div className="text-sm font-medium mb-2">
							Text Search
							<span className="text-xs text-muted-foreground ml-2">
								(Supports +required -excluded "exact phrase")
							</span>
						</div>
						<Input
							placeholder="Search in titles and descriptions..."
							value={textSearch}
							onChange={(e) => setTextSearch(e.target.value)}
							className="mb-2"
						/>
						<div className="flex gap-2">
							<Button
								variant={searchFields.includes("all") ? "default" : "outline"}
								size="sm"
								onClick={() => setSearchFields(["all"])}
							>
								All Fields
							</Button>
							<Button
								variant={
									searchFields.includes("title") &&
									!searchFields.includes("all")
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setSearchFields(["title"])}
							>
								Title Only
							</Button>
							<Button
								variant={
									searchFields.includes("description") &&
									!searchFields.includes("all")
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setSearchFields(["description"])}
							>
								Description Only
							</Button>
						</div>
					</div>

					{/* Date Range Filters (Feature 2) */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="text-sm font-medium mb-2">Created Date Range</div>
							<div className="space-y-2">
								<Input
									type="datetime-local"
									placeholder="After..."
									value={createdAfter}
									onChange={(e) => setCreatedAfter(e.target.value)}
								/>
								<Input
									type="datetime-local"
									placeholder="Before..."
									value={createdBefore}
									onChange={(e) => setCreatedBefore(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<div className="text-sm font-medium mb-2">Updated Date Range</div>
							<div className="space-y-2">
								<Input
									type="datetime-local"
									placeholder="After..."
									value={updatedAfter}
									onChange={(e) => setUpdatedAfter(e.target.value)}
								/>
								<Input
									type="datetime-local"
									placeholder="Before..."
									value={updatedBefore}
									onChange={(e) => setUpdatedBefore(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{/* Dependency Filters (Feature 3) */}
					<div>
						<div className="text-sm font-medium mb-2">
							Dependency Status
							<span className="text-xs text-muted-foreground ml-2">
								(For tasks only)
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{[
								"blocked",
								"blocking",
								"no-dependencies",
								"has-dependencies",
							].map((status) => {
								const typedStatus = status as
									| "blocked"
									| "blocking"
									| "no-dependencies"
									| "has-dependencies";
								return (
									<Badge
										key={status}
										variant={
											selectedDependencyStatus.includes(typedStatus)
												? "default"
												: "outline"
										}
										className="cursor-pointer"
										onClick={() =>
											toggleArrayValue(
												selectedDependencyStatus,
												typedStatus,
												setSelectedDependencyStatus,
											)
										}
									>
										{status}
									</Badge>
								);
							})}
						</div>
					</div>

					{/* Pagination (Feature 4) */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="text-sm font-medium mb-2">Limit</div>
							<Input
								type="number"
								placeholder="Max results (leave empty for all)"
								value={limit ?? ""}
								onChange={(e) =>
									setLimit(
										e.target.value
											? Number.parseInt(e.target.value, 10)
											: undefined,
									)
								}
								min={1}
								max={1000}
							/>
						</div>
						<div>
							<div className="text-sm font-medium mb-2">Offset</div>
							<Input
								type="number"
								placeholder="Skip first N results"
								value={offset}
								onChange={(e) =>
									setOffset(
										e.target.value ? Number.parseInt(e.target.value, 10) : 0,
									)
								}
								min={0}
							/>
						</div>
					</div>

					{/* Advanced Options (Features 6 & 7) */}
					<div>
						<div className="text-sm font-medium mb-2">Advanced Options</div>
						<div className="space-y-2">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={includeStats}
									onChange={(e) => setIncludeStats(e.target.checked)}
									className="rounded"
								/>
								<span className="text-sm">Include Statistics</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={includeRelated}
									onChange={(e) => {
										setIncludeRelated(e.target.checked);
										if (!e.target.checked) {
											setRelatedTypes([]);
										} else {
											setRelatedTypes(["dependencies", "blocking"]);
										}
									}}
									className="rounded"
								/>
								<span className="text-sm">Include Related Items</span>
							</label>
							{includeRelated && (
								<div className="ml-6 flex flex-wrap gap-2">
									{["dependencies", "blocking", "linked-specs"].map((type) => {
										const typedType = type as
											| "dependencies"
											| "blocking"
											| "linked-specs";
										return (
											<Badge
												key={type}
												variant={
													relatedTypes.includes(typedType)
														? "default"
														: "outline"
												}
												className="cursor-pointer"
												onClick={() =>
													toggleArrayValue(
														relatedTypes,
														typedType,
														setRelatedTypes,
													)
												}
											>
												{type}
											</Badge>
										);
									})}
								</div>
							)}
						</div>
					</div>

					{/* Sorting */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="text-sm font-medium mb-2 flex items-center gap-2">
								<ArrowUpDown className="h-4 w-4" />
								Sort By
							</div>
							<div className="flex gap-2">
								<Button
									variant={orderBy === "created" ? "default" : "outline"}
									size="sm"
									onClick={() => setOrderBy("created")}
								>
									Created
								</Button>
								<Button
									variant={orderBy === "updated" ? "default" : "outline"}
									size="sm"
									onClick={() => setOrderBy("updated")}
								>
									Updated
								</Button>
								<Button
									variant={orderBy === "next-to-do" ? "default" : "outline"}
									size="sm"
									onClick={() => setOrderBy("next-to-do")}
								>
									Next To-Do
								</Button>
							</div>
						</div>

						<div>
							<div className="text-sm font-medium mb-2">Direction</div>
							<div className="flex gap-2">
								<Button
									variant={direction === "asc" ? "default" : "outline"}
									size="sm"
									onClick={() => setDirection("asc")}
								>
									Ascending
								</Button>
								<Button
									variant={direction === "desc" ? "default" : "outline"}
									size="sm"
									onClick={() => setDirection("desc")}
								>
									Descending
								</Button>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-2 pt-4">
						<Button
							onClick={executeQuery}
							disabled={loading}
							className="flex-1"
						>
							<Search className="h-4 w-4 mr-2" />
							{loading ? "Searching..." : "Search"}
						</Button>
						<Button variant="outline" onClick={clearFilters}>
							<X className="h-4 w-4 mr-2" />
							Clear
						</Button>
					</div>

					{/* Error Display */}
					{error && (
						<div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
							{error}
						</div>
					)}

					{/* Results Count */}
					{results.length > 0 && (
						<div className="text-sm text-muted-foreground">
							Found {results.length}{" "}
							{results.length === 1 ? "result" : "results"}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
