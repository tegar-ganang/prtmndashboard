"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type RowData,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import Filter from "@/components/table/Filter";
import PaginationControl from "@/components/table/PaginationControl";
import TBody from "@/components/table/TBody";
import THead from "@/components/table/THead";
import TOption from "@/components/table/TOption";
import clsxm from "@/lib/clsxm";

export type ColumnMetaType = {
	apiField?: string;
};

// Extend the ColumnMeta interface from @tanstack/react-table
declare module "@tanstack/react-table" {
	// biome-ignore lint/correctness/noUnusedVariables: All declarations of 'ColumnMeta' must have identical type parameters.
	interface ColumnMeta<TData extends RowData, TValue> extends ColumnMetaType {}
}

type PaginationState = {
	page: number;
	size: number;
};

type TableProps<T extends object> = {
	data: T[];
	columns: ColumnDef<T, unknown>[];
	initialPageSize?: number;
	footers?: React.ReactNode;
	extras?: React.ReactNode;
	leftExtras?: React.ReactNode;
	isLoading?: boolean;
	omitSort?: boolean;
	withFilter?: boolean;
	withEntries?: boolean;
	withPaginationControl?: boolean;
	withLink?: boolean;
	tableClassName?: string;
} & React.ComponentPropsWithoutRef<"div">;

const DEFAULT_PAGE_SIZE = 10;

export default function Table<T extends object>({
	className,
	columns,
	data,
	initialPageSize = DEFAULT_PAGE_SIZE,
	footers,
	extras,
	leftExtras,
	isLoading,
	omitSort = false,
	withFilter = false,
	withEntries = false,
	withPaginationControl = false,
	withLink = false,
	tableClassName,
	...rest
}: TableProps<T>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [pagination, setPagination] = React.useState<PaginationState>({
		page: 1,
		size: initialPageSize,
	});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			pagination: {
				pageIndex: pagination.page - 1,
				pageSize: pagination.size,
			},
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: (updater) => {
			setPagination((previous) => {
				const oldState = {
					pageIndex: previous.page - 1,
					pageSize: previous.size,
				};
				const nextState =
					typeof updater === "function" ? updater(oldState) : updater;

				return {
					page: nextState.pageIndex + 1,
					size: nextState.pageSize,
				};
			});
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	React.useEffect(() => {
		setPagination((prev) => {
			if (prev.size === initialPageSize) {
				return prev;
			}

			return {
				page: 1,
				size: initialPageSize,
			};
		});
	}, [initialPageSize]);

	const handlePageSizeChange = React.useCallback((value: string | number) => {
		const parsedValue = Number(value) || DEFAULT_PAGE_SIZE;
		setPagination((prev) => {
			if (prev.size === parsedValue && prev.page === 1) {
				return prev;
			}

			return {
				page: 1,
				size: parsedValue,
			};
		});
	}, []);

	return (
		<div className={clsxm("flex flex-col", className)} {...rest}>
			<div className="flex items-end justify-between gap-5 mb-2">
				<div className="flex items-start gap-2">
					{withFilter && <Filter table={table} />}
					{leftExtras && <>{leftExtras}</>}
				</div>

				<div className="flex items-end gap-4">
					{extras && <>{extras}</>}
					{withEntries && (
						<TOption
							value={pagination.size}
							onChange={handlePageSizeChange}
							title="Show"
							options={[
								{ value: 10, label: "10 entries" },
								{ value: 25, label: "25 entries" },
								{ value: 50, label: "50 entries" },
								{ value: 100, label: "100 entries" },
							]}
						/>
					)}
				</div>
			</div>
			<div className="-my-2 mt-2 overflow-x-auto sm:-mx-6 lg:-mx-8 px-2">
				<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
					<div className="overflow-hidden shadow ring-8 ring-[#EBEBEB] rounded-md md:rounded-lg">
						<div
							className={`relative overflow-y-auto custom-scrollbar ${tableClassName}`}
						>
							<table className="min-w-full">
								<THead
									table={table}
									omitSort={omitSort}
									className="sticky top-0 z-10"
								/>
								<TBody
									table={table}
									isLoading={isLoading}
									withLink={withLink}
								/>
								{footers && (
									<tfoot className="bg-[#EBEBEB] sticky bottom-0 z-10">
										<tr>
											<td
												colSpan={columns.length}
												className="text-S2 pt-2 pl-2"
											>
												{footers}
											</td>
										</tr>
									</tfoot>
								)}
							</table>
						</div>
					</div>
				</div>
			</div>
			{withPaginationControl && (
				<PaginationControl
					table={table}
					data={data}
					setParams={setPagination}
					className="mt-5"
				/>
			)}
		</div>
	);
}
