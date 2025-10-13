"use client";

import type { QueryResultItem } from "@spec-mcp/schemas";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	ArrowUpDown,
	CheckCircle2,
	ChevronDown,
	Clock,
	FileCode,
	MoreHorizontal,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface SpecDataTableProps {
	data: QueryResultItem[];
}

export function SpecDataTable({ data }: SpecDataTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	const columns: ColumnDef<QueryResultItem>[] = React.useMemo(
		() => [
			{
				accessorKey: "id",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							ID
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => (
					<div className="font-mono text-sm">{row.getValue("id")}</div>
				),
			},
			{
				accessorKey: "type",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							Type
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					const type = row.getValue("type") as string;
					return (
						<Badge variant="outline" className="font-mono text-xs">
							{type}
						</Badge>
					);
				},
			},
			{
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => {
					const name = row.original.name;
					return <div className="max-w-[300px] truncate">{name}</div>;
				},
			},
			{
				accessorKey: "draft",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							Status
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					const draft = row.getValue("draft") as boolean;
					return draft ? (
						<Badge variant="secondary" className="gap-1">
							<Clock className="h-3 w-3" />
							Draft
						</Badge>
					) : (
						<Badge variant="default" className="gap-1">
							<CheckCircle2 className="h-3 w-3" />
							Finalized
						</Badge>
					);
				},
			},
			{
				accessorKey: "priority",
				header: "Priority",
				cell: ({ row }) => {
					const priority = row.original.priority;
					if (!priority)
						return <span className="text-muted-foreground">—</span>;

					const variants = {
						critical: "destructive",
						high: "default",
						medium: "secondary",
						low: "outline",
						"nice-to-have": "outline",
					} as const;

					return (
						<Badge
							variant={
								variants[priority as keyof typeof variants] || "secondary"
							}
						>
							{priority}
						</Badge>
					);
				},
			},
			{
				accessorKey: "status",
				header: "Item Status",
				cell: ({ row }) => {
					const status = row.original.status;
					if (!status) return <span className="text-muted-foreground">—</span>;

					const variants = {
						"not-started": "outline",
						"in-progress": "secondary",
						completed: "default",
						verified: "default",
					} as const;

					return (
						<Badge
							variant={variants[status as keyof typeof variants] || "outline"}
						>
							{status}
						</Badge>
					);
				},
			},
			{
				accessorKey: "created_at",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							Created
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					const date = row.getValue("created_at") as string;
					return (
						<div className="text-sm text-muted-foreground">
							{new Date(date).toLocaleDateString()}
						</div>
					);
				},
			},
			{
				accessorKey: "updated_at",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							Updated
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					const date = row.getValue("updated_at") as string;
					return (
						<div className="text-sm text-muted-foreground">
							{new Date(date).toLocaleDateString()}
						</div>
					);
				},
			},
			{
				id: "actions",
				cell: ({ row }) => {
					const item = row.original;

					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0">
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem
									onClick={() => navigator.clipboard.writeText(item.id)}
								>
									Copy ID
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>View details</DropdownMenuItem>
								<DropdownMenuItem>Edit spec</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
		],
		[],
	);

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Input
					placeholder="Filter by ID or title..."
					value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
					onChange={(event) =>
						table.getColumn("id")?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto">
							Columns <ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)
										}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									<div className="flex flex-col items-center justify-center text-muted-foreground">
										<FileCode className="h-8 w-8 mb-2" />
										<p>No results.</p>
										<p className="text-sm mt-1">Try adjusting your filters</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredRowModel().rows.length} row(s) found.
				</div>
				<div className="space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
