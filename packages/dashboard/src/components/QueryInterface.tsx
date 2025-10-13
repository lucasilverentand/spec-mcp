import type { QueryResultItem } from "@spec-mcp/schemas";
import { useState } from "react";
import { QueryBuilder } from "./QueryBuilder";
import { QueryResults } from "./QueryResults";

export default function QueryInterface() {
	const [results, setResults] = useState<QueryResultItem[]>([]);

	return (
		<div className="space-y-6">
			<QueryBuilder onQueryChange={setResults} />
			<QueryResults results={results} />
		</div>
	);
}
