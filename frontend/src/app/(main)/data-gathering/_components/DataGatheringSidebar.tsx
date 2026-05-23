"use client";

import Select from "react-select";

import Button from "@/components/button/Button";
import {
	DOC_TYPE_CONFIG,
	DOCUMENT_OPTIONS,
	MONTH_OPTIONS,
	QUARTER_OPTIONS,
	SELECT_STYLES,
	YEAR_OPTIONS,
} from "../_constants/dataGathering.constants";
import type { DocTypeValue } from "../_constants/dataGathering.constants";
import type { DocumentOption } from "../_types";
import { Download } from "lucide-react";

interface DataGatheringSidebarProps {
	docType: DocumentOption<DocTypeValue>;
	field: DocumentOption;
	fieldOptions: DocumentOption[];
	quarter: DocumentOption;
	month: DocumentOption;
	year: DocumentOption;
	onDocTypeChange: (option: DocumentOption<DocTypeValue>) => void;
	onFieldChange: (option: DocumentOption) => void;
	onQuarterChange: (option: DocumentOption) => void;
	onMonthChange: (option: DocumentOption) => void;
	onYearChange: (option: DocumentOption) => void;
}

export default function DataGatheringSidebar({
	docType,
	field,
	fieldOptions,
	quarter,
	month,
	year,
	onDocTypeChange,
	onFieldChange,
	onQuarterChange,
	onMonthChange,
	onYearChange,
}: DataGatheringSidebarProps) {
	const docConfig = DOC_TYPE_CONFIG[docType.value];

	return (
		<div className="col-span-12 md:col-span-4 flex flex-col gap-3">
			<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
				<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Jenis Dokumen</label>
				<Select
					options={DOCUMENT_OPTIONS}
					value={docType}
					onChange={(v) => v && onDocTypeChange(v as DocumentOption<DocTypeValue>)}
					className="text-sm"
					styles={SELECT_STYLES}
				/>

				<div className="mt-4">
					<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lokasi / Field</label>
					<Select
						options={fieldOptions}
						value={field}
						onChange={(v) => v && onFieldChange(v as DocumentOption)}
						className="text-sm"
						styles={SELECT_STYLES}
					/>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-2">
					{docConfig.period === "quarter" ? (
						<div>
							<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quartal</label>
							<Select
								options={QUARTER_OPTIONS}
								value={quarter}
								onChange={(v) => v && onQuarterChange(v as DocumentOption)}
								className="text-sm"
								styles={SELECT_STYLES}
							/>
						</div>
					) : (
						<div>
							<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bulan</label>
							<Select
								options={MONTH_OPTIONS}
								value={month}
								onChange={(v) => v && onMonthChange(v as DocumentOption)}
								className="text-sm"
								styles={SELECT_STYLES}
							/>
						</div>
					)}
					<div>
						<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tahun</label>
						<Select
							options={YEAR_OPTIONS}
							value={year}
							onChange={(v) => v && onYearChange(v as DocumentOption)}
							className="text-sm"
							styles={SELECT_STYLES}
						/>
					</div>
				</div>
			</div>

			<div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
				<h3 className="text-sm font-semibold text-blue-900 mb-1">Butuh template?</h3>
				<p className="text-xs text-blue-700 mb-3">Gunakan template resmi agar kolom sesuai database.</p>
				<a href={docConfig.templateUrl} download>
					<Button variant="blue" size="sm" className="w-full justify-center gap-2">
						<Download className="w-4 h-4" /> Download Template
					</Button>
				</a>
			</div>
		</div>
	);
}
