import type { QueryResultItem } from "@spec-mcp/schemas";
import { Check, CheckCheck, Circle, FileText, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueryResultsProps {
	results: QueryResultItem[];
}

export function QueryResults({ results }: QueryResultsProps) {
	if (results.length === 0) {
		return null;
	}

	const getStatusIcon = (item: QueryResultItem) => {
		if (item.resultType === "sub-item") {
			if (item.verified) {
				return <CheckCheck className="h-4 w-4 text-green-600" />;
			}
			if (item.completed) {
				return <Check className="h-4 w-4 text-blue-600" />;
			}
			return <Circle className="h-4 w-4 text-gray-400" />;
		}
		return null;
	};

	const getTypeIcon = (item: QueryResultItem) => {
		if (item.resultType === "spec") {
			return <FileText className="h-4 w-4" />;
		}
		return <ListTodo className="h-4 w-4" />;
	};

	const getPriorityColor = (priority?: string) => {
		switch (priority) {
			case "critical":
				return "destructive";
			case "high":
				return "default";
			case "medium":
				return "secondary";
			case "low":
				return "outline";
			case "nice-to-have":
				return "outline";
			default:
				return "secondary";
		}
	};

	return (
		<div className="space-y-3">
			{results.map((item, index) => (
				<Card
					key={`${item.id}-${index}`}
					className="hover:shadow-md transition-shadow"
				>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between gap-4">
							<div className="flex items-start gap-3 flex-1 min-w-0">
								<div className="mt-1 flex-shrink-0">{getTypeIcon(item)}</div>
								<div className="flex-1 min-w-0">
									<CardTitle className="text-base flex items-center gap-2 flex-wrap">
										{getStatusIcon(item)}
										<span className="font-mono text-sm">{item.id}</span>
										{item.draft && (
											<Badge variant="outline" className="text-xs">
												Draft
											</Badge>
										)}
									</CardTitle>
									<p className="text-sm font-medium mt-1 truncate">
										{item.name}
									</p>
									{item.resultType === "sub-item" && (
										<p className="text-xs text-muted-foreground mt-1">
											Parent: {item.parentId} ({item.parentName})
										</p>
									)}
								</div>
							</div>
							<div className="flex flex-col gap-2 items-end flex-shrink-0">
								{item.priority && (
									<Badge variant={getPriorityColor(item.priority)}>
										{item.priority}
									</Badge>
								)}
								{item.status && (
									<Badge variant="secondary" className="text-xs">
										{item.status}
									</Badge>
								)}
								<Badge variant="outline" className="text-xs">
									{item.type}
								</Badge>
							</div>
						</div>
					</CardHeader>
					{item.resultType === "spec" && item.description && (
						<CardContent className="pt-0">
							<p className="text-sm text-muted-foreground line-clamp-2">
								{item.description}
							</p>
						</CardContent>
					)}
					{item.resultType === "sub-item" && item.description && (
						<CardContent className="pt-0">
							<p className="text-sm text-muted-foreground line-clamp-2">
								{item.description}
							</p>
						</CardContent>
					)}
					<CardContent className="pt-0 pb-3">
						<div className="flex gap-4 text-xs text-muted-foreground">
							<span>
								Created: {new Date(item.created_at).toLocaleDateString()}
							</span>
							{item.updated_at && (
								<span>
									Updated: {new Date(item.updated_at).toLocaleDateString()}
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
