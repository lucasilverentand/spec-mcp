import type { QueryResultItem } from "@spec-mcp/schemas";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryBuilder } from "./QueryBuilder";
import { SpecDataTable } from "./SpecDataTable";
import UnifiedBrowser from "./UnifiedBrowser";

export default function BrowseWithQuery() {
	const [results, setResults] = useState<QueryResultItem[]>([]);

	return (
		<Tabs defaultValue="browse" className="space-y-6">
			<TabsList>
				<TabsTrigger value="browse">Browse</TabsTrigger>
				<TabsTrigger value="query">Advanced Query</TabsTrigger>
			</TabsList>

			<TabsContent value="browse" className="space-y-6">
				<UnifiedBrowser />
			</TabsContent>

			<TabsContent value="query" className="space-y-6">
				<QueryBuilder onQueryChange={setResults} />
				{results.length > 0 && <SpecDataTable data={results} />}
			</TabsContent>
		</Tabs>
	);
}
