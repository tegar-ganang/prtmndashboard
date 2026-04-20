import type { RowData, Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";
import clsxm from "@/lib/clsxm";

type FilterProps<T extends RowData> = {
	table: Table<T>;
	placeholder?: string;
} & React.ComponentPropsWithoutRef<"div">;

export default function Filter<T extends RowData>({
	className,
	table,
	placeholder = "Cari Data",
	...rest
}: FilterProps<T>) {
	const [filter, setFilter] = React.useState("");

	const handleClearFilter = () => {
		table.setGlobalFilter("");
		setFilter("");
	};

	React.useEffect(() => {
		const timeout = setTimeout(() => {
			table.setGlobalFilter(filter);
		}, 360);
		return () => clearTimeout(timeout);
	}, [filter, table]);

	return (
		<div className={clsxm("relative", className)} {...rest}>
			<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<Search className="text-xl text-base-secondary" size="1em" />
			</div>
			<input
				type="text"
				value={filter ?? ""}
				onChange={(e) => {
					setFilter(String(e.target.value));
				}}
				className={clsxm(
					"block w-full rounded-lg py-2 pl-12 pr-16 text-xs sm:text-sm shadow-sm transition duration-100",
					"border border-blue-200 text-base-dark caret-blue-600",
					"focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
					"text-typo-main placeholder:text-[#9AA2B1]",
				)}
				placeholder={placeholder}
			/>
			{table.getState().globalFilter !== "" && (
				<div className="absolute inset-y-0 right-0 flex items-center pr-3">
					<button type="button" onClick={handleClearFilter} className="p-1">
						<X className="text-xl text-typo-main" />
					</button>
				</div>
			)}
		</div>
	);
}
