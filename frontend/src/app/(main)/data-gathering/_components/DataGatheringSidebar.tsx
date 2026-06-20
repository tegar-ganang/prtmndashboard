"use client";

import Select from "react-select";

import Button from "@/components/button/Button";
import {
	DOC_TYPE_CONFIG,
	DOCUMENT_OPTIONS,
	PSAIMS_OPTIONS,
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
	// PSAIMS
	psaimsSubType?: DocumentOption<DocTypeValue>;
	psaimsZona?: string;
	onPsaimsSubTypeChange?: (option: DocumentOption<DocTypeValue>) => void;
	onPsaimsZonaChange?: (zona: string) => void;
}

// Document options including PSAIMS as a top-level choice
const DOCUMENT_OPTIONS_WITH_PSAIMS = [
	...DOCUMENT_OPTIONS,
	{ value: "PSAIMS" as DocTypeValue, label: "PSAIMS" },
];

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
	psaimsSubType,
	psaimsZona,
	onPsaimsSubTypeChange,
	onPsaimsZonaChange,
}: DataGatheringSidebarProps) {
	const isPsaims =
		(docType.value as string) === "PSAIMS" ||
		docType.value === "ZONA_INDICATOR" ||
		docType.value === "ZONA_PSE_LIST";
	const activePsaimsType = (psaimsSubType?.value ?? "ZONA_INDICATOR") as DocTypeValue;

	const docConfig = isPsaims
		? DOC_TYPE_CONFIG[activePsaimsType]
		: DOC_TYPE_CONFIG[docType.value];

	const currentTemplateUrl = isPsaims
		? DOC_TYPE_CONFIG[activePsaimsType].templateUrl
		: docConfig.templateUrl;

	// The displayed value in the main dropdown
	const displayDocType = isPsaims
		? ({ value: "PSAIMS" as DocTypeValue, label: "PSAIMS" })
		: docType;

	return (
		<div className="col-span-12 md:col-span-4 flex flex-col gap-3">
			<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
				<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
					Jenis Dokumen
				</label>
				<Select
					options={DOCUMENT_OPTIONS_WITH_PSAIMS}
					value={displayDocType}
					onChange={(v) => v && onDocTypeChange(v as DocumentOption<DocTypeValue>)}
					className="text-sm"
					styles={SELECT_STYLES}
				/>

				{/* PSAIMS: Sub-type selector */}
				{isPsaims && onPsaimsSubTypeChange && (
					<div className="mt-4">
						<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
							Tipe PSAIMS
						</label>
						<Select
							options={PSAIMS_OPTIONS}
							value={psaimsSubType ?? PSAIMS_OPTIONS[0]}
							onChange={(v) => v && onPsaimsSubTypeChange(v as DocumentOption<DocTypeValue>)}
							className="text-sm"
							styles={SELECT_STYLES}
						/>
					</div>
				)}

				{/* PSAIMS: Zona input */}
				{isPsaims && onPsaimsZonaChange && (
					<div className="mt-4">
						<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
							Nomor Zona <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							placeholder="Contoh: 13"
							value={psaimsZona ?? ""}
							onChange={(e) => onPsaimsZonaChange(e.target.value)}
							className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
						/>
					</div>
				)}

				{/* Lokasi / Field — tidak ditampilkan untuk PSAIMS */}
				{!isPsaims && docType.value !== "PRODUKSI" && (
					<div className="mt-4">
						<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
							Lokasi / Field
						</label>
						<Select
							options={fieldOptions}
							value={field}
							onChange={(v) => v && onFieldChange(v as DocumentOption)}
							className="text-sm"
							styles={SELECT_STYLES}
						/>
					</div>
				)}

				<div className="mt-4 grid grid-cols-2 gap-2">
					{/* Zona Indicator: hanya butuh Tahun */}
					{isPsaims && activePsaimsType === "ZONA_INDICATOR" ? (
						<div className="col-span-2">
							<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
								Tahun
							</label>
							<Select
								options={YEAR_OPTIONS}
								value={year}
								onChange={(v) => v && onYearChange(v as DocumentOption)}
								className="text-sm"
								styles={SELECT_STYLES}
							/>
						</div>
					) : (
						<>
							{docConfig.period === "quarter" ? (
								<div>
									<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
										Quartal
									</label>
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
									<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
										Bulan
									</label>
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
								<label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
									Tahun
								</label>
								<Select
									options={YEAR_OPTIONS}
									value={year}
									onChange={(v) => v && onYearChange(v as DocumentOption)}
									className="text-sm"
									styles={SELECT_STYLES}
								/>
							</div>
						</>
					)}
				</div>
			</div>

			<div className="bg-green-50 rounded-xl border border-green-100 p-4">
				<h3 className="text-sm font-semibold text-green-900 mb-1">Butuh template?</h3>
				<p className="text-xs text-green-700 mb-3">Gunakan template resmi agar kolom sesuai database.</p>
				<a href={currentTemplateUrl} download>
					<Button variant="green" size="sm" className="w-full justify-center gap-2">
						<Download className="w-4 h-4" /> Download Template
					</Button>
				</a>
			</div>
		</div>
	);
}
