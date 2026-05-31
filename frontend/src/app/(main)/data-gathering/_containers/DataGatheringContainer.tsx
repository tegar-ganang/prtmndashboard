"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
	CalendarDays,
	Target,
	BarChart3,
	Zap,
	Upload,
	Loader2,
	FileSpreadsheet,
} from "lucide-react";
import clsxm from "@/lib/clsxm";

import { useMonitoringBatchMutation } from "../_hooks/useMonitoringBatchMutation";
import { useProduksiBatchMutation } from "../_hooks/useProduksiBatchMutation";
import { useLocationsQuery } from "../_hooks/useLocationsQuery";
import { useExcelProcessor } from "../_hooks/useExcelProcessor";
import { checkMonitoringPeriodExists } from "../_hooks/useMonitoringCheckPeriod";
import {
	DOC_TYPE_CONFIG,
	DOCUMENT_OPTIONS,
	FIELD_OPTIONS,
	MONTH_OPTIONS,
	QUARTER_OPTIONS,
	YEAR_OPTIONS,
	type DocTypeValue,
} from "../_constants/dataGathering.constants";
import type { DocumentOption, ExcelRow, ExtraColumnsState } from "../_types";
import {
	DataGatheringConfirmModal,
	DataGatheringDetailModal,
	DataGatheringDropzone,
	DataGatheringHeader,
	DataGatheringSidebar,
	DataGatheringTable,
	DataGatheringToolbar,
} from "../_components";

function parseProduksiExcelPreview(buffer: ArrayBuffer, selectedMonthVal: number): {
	preview: ExcelRow[];
	targetRows: ExcelRow[];
	totalRows: number;
} {
	const wb = XLSX.read(buffer, { type: "array", cellDates: true });
	const sheet1 = wb.Sheets[wb.SheetNames[0]];
	const sheet2 = wb.Sheets[wb.SheetNames[1]];

	// Parse Sheet2 target
	const s2Raw = XLSX.utils.sheet_to_json<any[]>(sheet2, { header: 1 });
	const targetRows: ExcelRow[] = [];
	const targetMap: Record<number, number> = {};

	for (let i = 2; i < s2Raw.length; i++) {
		const row = s2Raw[i];
		if (!row) continue;
		const bulan = row[0];
		const dmf = row[1];
		if (bulan == null || dmf == null) continue;
		const d = bulan instanceof Date ? bulan : new Date(bulan);
		if (!isNaN(d.getTime())) {
			const mIndex = d.getMonth() + 1;
			const targetVal = Number(dmf);
			targetMap[mIndex] = targetVal;

			const monthLabel = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
			targetRows.push({
				_index: targetRows.length + 1,
				_isValid: true,
				_errors: [],
				"Bulan": monthLabel,
				"Target DMF (MMSCFD)": targetVal,
			});
		}
	}

	// Parse Sheet1 — raw rows (header at row 0+1, data from row 2)
	const s1Raw = XLSX.utils.sheet_to_json<any[]>(sheet1, { header: 1 });
	const dataRows = s1Raw.slice(2);
	const totalRows = dataRows.filter((r) => r[0] != null).length;

	// Build headers exactly like the backend
	const groupRow = s1Raw[0] || [];
	const subRow = s1Raw[1] || [];
	let lastGroup = "";
	const combinedHeaders: string[] = [];
	for (let i = 0; i < Math.max(groupRow.length, subRow.length); i++) {
		if (i === 0) {
			combinedHeaders.push("Tanggal");
			lastGroup = "";
			continue;
		}
		const grp = groupRow[i];
		if (grp != null && String(grp).trim() && String(grp).toLowerCase() !== "nan") {
			lastGroup = String(grp).trim();
		}
		const sub = subRow[i];
		const subStr = sub != null && String(sub).trim() && String(sub).toLowerCase() !== "nan" ? String(sub).trim() : "";
		
		const combined = subStr ? `${lastGroup}|${subStr}` : lastGroup;
		const norm = combined.replace(/\s+/g, " ").trim().toUpperCase().replace(/\s*\|\s*/g, "|");

		if (norm === "ANGKA PRODUKSI PUPO / SOT (BOPD)|REAL") {
			combinedHeaders.push("PUPO/SOT Real (BOPD)");
		} else if (norm === "ANGKA PRODUKSI OPERASI (BOPD)|REAL") {
			combinedHeaders.push("Op Real (BOPD)");
		} else if (norm === "PRODUKSI GAS MMSCFD - DONGGI FIELD|PROD") {
			combinedHeaders.push("Donggi Prod (MMSCFD)");
		} else if (norm === "PRODUKSI GAS MMSCFD - MATINDOK FIELD|PROD") {
			combinedHeaders.push("Matindok Prod (MMSCFD)");
		} else if (norm === "SAFE MAN HOURS|DONGGI MATINDOK FIELD") {
			combinedHeaders.push("Safe Man Hours");
		} else {
			combinedHeaders.push(combined);
		}
	}

	const preview: ExcelRow[] = dataRows
		.filter((r) => r[0] != null)
		.map((r, index) => {
			const obj: ExcelRow = {
				_index: index + 1,
				_isValid: true,
				_errors: [],
			};

			combinedHeaders.forEach((header, colIdx) => {
				if (colIdx === 0) {
					let tgl: string | null = null;
					const rawDate = r[0];
					if (rawDate instanceof Date) {
						tgl = format(rawDate, "dd MMM yyyy", { locale: localeId });
					} else if (rawDate != null) {
						try {
							tgl = format(new Date(rawDate), "dd MMM yyyy", { locale: localeId });
						} catch {
							tgl = String(rawDate);
						}
					}
					obj["Tanggal"] = tgl;
					return;
				}

				const val = r[colIdx];
				const parseCellValue = (v: any) => {
					if (v == null || v === "") return null;
					if (v instanceof Date) {
						return format(v, "dd MMM yyyy", { locale: localeId });
					}
					if (typeof v === "number") return v;
					const num = Number(v);
					if (!isNaN(num) && String(v).trim() !== "") {
						return num;
					}
					return String(v).trim();
				};
				if (header) {
					obj[header] = parseCellValue(val);
				}
			});

			let rowMonth = selectedMonthVal;
			const rawDate = r[0];
			if (rawDate instanceof Date) {
				rowMonth = rawDate.getMonth() + 1;
			} else if (rawDate != null) {
				try {
					rowMonth = new Date(rawDate).getMonth() + 1;
				} catch {}
			}
			const targetDmf = targetMap[rowMonth] ?? targetMap[selectedMonthVal] ?? null;
			obj["Target DMF (MMSCFD)"] = targetDmf;

			return obj;
		});

	return { preview, targetRows, totalRows };
}

export default function DataGatheringContainer() {
	const [data, setData] = useState<ExcelRow[]>([]);
	const [processing, setProcessing] = useState(false);
	const [selectedRow, setSelectedRow] = useState<ExcelRow | null>(null);
	const [extraCols, setExtraCols] = useState<ExtraColumnsState>({});

	// File raw untuk produksi (backend parse langsung)
	const [produksiFile, setProduksiFile] = useState<File | null>(null);
	const [produksiPreview, setProduksiPreview] = useState<ExcelRow[]>([]);
	const [produksiTargetRows, setProduksiTargetRows] = useState<ExcelRow[]>([]);
	const [produksiTotalRows, setProduksiTotalRows] = useState(0);
	const [produksiParsing, setProduksiParsing] = useState(false);
	const [detailDocType, setDetailDocType] = useState<DocTypeValue>("PRODUKSI");
	const [produksiExtraCols, setProduksiExtraCols] = useState<ExtraColumnsState>({});

	const [docType, setDocType] = useState<DocumentOption<DocTypeValue>>(DOCUMENT_OPTIONS[0]);
	const [field, setField] = useState<DocumentOption>(FIELD_OPTIONS[0]);
	const [quarter, setQuarter] = useState<DocumentOption>(QUARTER_OPTIONS[0]);
	const [month, setMonth] = useState<DocumentOption>(MONTH_OPTIONS[new Date().getMonth()]);
	const [year, setYear] = useState<DocumentOption>(YEAR_OPTIONS[2]);

	const isProduksi = docType.value === "PRODUKSI";

	const { data: locationsData } = useLocationsQuery();

	const fieldOptions = useMemo(() => {
		if (locationsData && locationsData.length > 0) {
			return locationsData.map((loc) => ({
				value: loc.code,
				label: loc.name,
			}));
		}
		return FIELD_OPTIONS;
	}, [locationsData]);

	useEffect(() => {
		if (fieldOptions.length > 0) {
			const hasCurrent = fieldOptions.some((opt) => opt.value === field.value);
			if (!hasCurrent) {
				setField(fieldOptions[0]);
			}
		}
	}, [fieldOptions, field.value]);

	// Reset state saat ganti doc type
	const handleDocTypeChange = (option: DocumentOption<DocTypeValue>) => {
		setDocType(option);
		setData([]);
		setProduksiFile(null);
		setProduksiPreview([]);
		setProduksiTargetRows([]);
		setProduksiTotalRows(0);
		setProduksiExtraCols({});
	};

	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [isCheckingPeriod, setIsCheckingPeriod] = useState(false);
	const [isDataExists, setIsDataExists] = useState(false);
	const docConfig = DOC_TYPE_CONFIG[docType.value];

	const router = useRouter();

	// Mutation untuk MIT / HAZID / HAZOP / LOPA (JSON batch)
	const { mutate: uploadBatch, isPending: isUploading } = useMonitoringBatchMutation({
		docType: docType.value,
		onSuccess: (res) => {
			setData([]);
		},
	});

	// Mutation untuk Produksi (raw file FormData)
	const { mutate: uploadProduksi, isPending: isUploadingProduksi } = useProduksiBatchMutation({
		onSuccess: () => {
			setProduksiFile(null);
			setProduksiPreview([]);
			setProduksiTargetRows([]);
			setProduksiTotalRows(0);
			setProduksiExtraCols({});
		},
	});

	const currentGlanceCols = docConfig.glanceCols;
	const extraHeaders = useMemo(
		() => (data.length ? Object.keys(data[0]).filter((k) => !k.startsWith("_") && !currentGlanceCols.includes(k)) : []),
		[data, currentGlanceCols]
	);

	const produksiExtraHeaders = useMemo(() => {
		if (produksiPreview.length === 0) return [];
		const currentGlanceCols = DOC_TYPE_CONFIG["PRODUKSI_REALISASI"].glanceCols;
		return Object.keys(produksiPreview[0]).filter(
			(k) => !k.startsWith("_") && !currentGlanceCols.includes(k)
		);
	}, [produksiPreview]);

	// Processor Excel untuk MIT/HAZID/HAZOP/LOPA (parse di frontend, preview)
	const { processExcel } = useExcelProcessor({
		docType: docType.value,
		onProcessed: (rows) => {
			setData(rows);
			setExtraCols({});
		},
		onProcessing: setProcessing,
	});

	// Dropzone shared — behaviour berbeda berdasarkan isProduksi
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (files) => {
			if (!files.length) return;
			if (isProduksi) {
				setProduksiParsing(true);
				const file = files[0];
				setProduksiFile(file);
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const buf = e.target?.result as ArrayBuffer;
						const { preview: p, targetRows: t, totalRows: total } = parseProduksiExcelPreview(buf, parseInt(month.value, 10));
						setProduksiPreview(p);
						setProduksiTargetRows(t);
						setProduksiTotalRows(total);
					} catch (err) {
						console.error("Gagal membaca file Excel Produksi:", err);
						setProduksiFile(null);
						setProduksiPreview([]);
						setProduksiTargetRows([]);
						setProduksiTotalRows(0);
					} finally {
						setProduksiParsing(false);
					}
				};
				reader.readAsArrayBuffer(file);
			} else {
				// Lainnya: parse di frontend dulu, preview tabel
				processExcel(files[0]);
			}
		},
		accept: {
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
			"application/vnd.ms-excel": [".xls"],
		},
		multiple: false,
	});

	const total = data.length;
	const errors = data.filter((r) => !r._isValid).length;
	const valid = total - errors;
	const canSubmit = isProduksi
		? produksiFile !== null && produksiPreview.length > 0
		: total > 0 && errors === 0;

	const handleProceedUpload = (mode: "append" | "overwrite") => {
		setConfirmModalOpen(false);

		if (isProduksi) {
			if (!produksiFile) return;
			uploadProduksi({
				file: produksiFile,
				reporting_year: parseInt(year.value, 10),
				reporting_month: parseInt(month.value, 10),
				field: undefined,
				mode,
			});
			return;
		}

		const payload = data.map(({ _index, _isValid, _errors, ...rest }) => rest);
		const basePayload = {
			doc_type: docType.value,
			reporting_year: parseInt(year.value, 10),
			field: field.value,
			mode,
			items: payload,
		};
		const periodPayload = docConfig.period === "quarter"
			? { reporting_quarter: parseInt(quarter.value.replace("Q", ""), 10) }
			: { reporting_month: parseInt(month.value, 10) };

		uploadBatch({ ...basePayload, ...periodPayload });
	};

	const handleSubmit = async () => {
		if (!canSubmit) return;
		setIsCheckingPeriod(true);
		try {
			const periodVal = docConfig.period === "quarter"
				? parseInt(quarter.value.replace("Q", ""), 10)
				: parseInt(month.value, 10);
			const exists = await checkMonitoringPeriodExists(
				docType.value,
				parseInt(year.value, 10),
				periodVal,
				isProduksi ? undefined : field.value
			);
			setIsDataExists(exists);
			setConfirmModalOpen(true);
		} catch (error) {
			console.error("Failed to check period existence:", error);
			setIsDataExists(true);
			setConfirmModalOpen(true);
		} finally {
			setIsCheckingPeriod(false);
		}
	};

	const isAnyUploading = isUploading || isUploadingProduksi;

	return (
		<div className="flex flex-col gap-5 p-6 pb-20 w-full min-w-0">
			<DataGatheringHeader docType={docType.value} />

			<div className="grid grid-cols-12 gap-4 items-start w-full min-w-0">
				<DataGatheringSidebar
					docType={docType}
					field={field}
					fieldOptions={fieldOptions}
					quarter={quarter}
					month={month}
					year={year}
					onDocTypeChange={handleDocTypeChange}
					onFieldChange={setField}
					onQuarterChange={setQuarter}
					onMonthChange={setMonth}
					onYearChange={setYear}
				/>

				{/* Dropzone — sama untuk semua doc type */}
				<div className="col-span-12 md:col-span-8 flex flex-col gap-3">
					<DataGatheringDropzone
						getRootProps={getRootProps}
						getInputProps={getInputProps}
						isDragActive={isDragActive}
						processing={processing || produksiParsing}
					/>
				</div>
			</div>

			{/* Preview 2 Tabel untuk Produksi */}
			{isProduksi && produksiPreview.length > 0 && (
				<div className="flex flex-col gap-5 w-full min-w-0">
					<DataGatheringToolbar
						total={produksiTotalRows}
						valid={produksiTotalRows}
						errors={0}
						extraHeaders={produksiExtraHeaders}
						extraCols={produksiExtraCols}
						onToggleExtraCol={(col) => setProduksiExtraCols((p) => ({ ...p, [col]: !p[col] }))}
						onSubmit={handleSubmit}
						canSubmit={canSubmit}
						isUploading={isAnyUploading}
						isCheckingPeriod={isCheckingPeriod}
					/>

					<div className="flex flex-col gap-6">
						{/* Tabel 1: Target Bulanan (Sheet 2) */}
						<div className="flex flex-col gap-2">
							<h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Tabel 1: Target Bulanan (Sheet 2)</h3>
							<DataGatheringTable
								data={produksiTargetRows}
								docType="PRODUKSI_TARGET"
								extraHeaders={[]}
								extraCols={{}}
								onSelectRow={(row) => {
									setDetailDocType("PRODUKSI_TARGET");
									setSelectedRow(row);
								}}
							/>
						</div>

						{/* Tabel 2: Realisasi Harian (Sheet 1) */}
						<div className="flex flex-col gap-2">
							<h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Tabel 2: Realisasi Harian (Sheet 1)</h3>
							<DataGatheringTable
								data={produksiPreview}
								docType="PRODUKSI_REALISASI"
								extraHeaders={produksiExtraHeaders}
								extraCols={produksiExtraCols}
								onSelectRow={(row) => {
									setDetailDocType("PRODUKSI_REALISASI");
									setSelectedRow(row);
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Preview tabel hanya untuk non-Produksi */}
			{!isProduksi && data.length > 0 && (
				<DataGatheringToolbar
					total={total}
					valid={valid}
					errors={errors}
					extraHeaders={extraHeaders}
					extraCols={extraCols}
					onToggleExtraCol={(col) => setExtraCols((p) => ({ ...p, [col]: !p[col] }))}
					onSubmit={handleSubmit}
					canSubmit={canSubmit}
					isUploading={isAnyUploading}
					isCheckingPeriod={isCheckingPeriod}
				/>
			)}

			{!isProduksi && data.length > 0 && (
				<DataGatheringTable
					data={data}
					docType={docType.value}
					extraHeaders={extraHeaders}
					extraCols={extraCols}
					onSelectRow={(row) => {
						setDetailDocType(docType.value);
						setSelectedRow(row);
					}}
				/>
			)}

			<DataGatheringDetailModal
				docType={detailDocType}
				selectedRow={selectedRow}
				onClose={() => setSelectedRow(null)}
			/>

			<DataGatheringConfirmModal
				open={confirmModalOpen}
				docType={docType.value}
				fieldLabel={field.label}
				periodLabel={docConfig.period === "quarter" ? quarter.value : month.label}
				yearLabel={year.value}
				isUploading={isAnyUploading}
				isDataExists={isDataExists}
				onConfirm={() => handleProceedUpload("overwrite")}
				onClose={() => setConfirmModalOpen(false)}
			/>
		</div>
	);
}
