"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

import { useMonitoringBatchMutation } from "../_hooks/useMonitoringBatchMutation";
import { useLocationsQuery } from "../_hooks/useLocationsQuery";
import { useExcelProcessor } from "../_hooks/useExcelProcessor";
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

export default function DataGatheringContainer() {
	const [data, setData] = useState<ExcelRow[]>([]);
	const [processing, setProcessing] = useState(false);
	const [selectedRow, setSelectedRow] = useState<ExcelRow | null>(null);
	const [extraCols, setExtraCols] = useState<ExtraColumnsState>({});

	const [docType, setDocType] = useState<DocumentOption<DocTypeValue>>(DOCUMENT_OPTIONS[0]);
	const [field, setField] = useState<DocumentOption>(FIELD_OPTIONS[0]);
	const [quarter, setQuarter] = useState<DocumentOption>(QUARTER_OPTIONS[0]);
	const [month, setMonth] = useState<DocumentOption>(MONTH_OPTIONS[new Date().getMonth()]);
	const [year, setYear] = useState<DocumentOption>(YEAR_OPTIONS[2]);

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

	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [isCheckingPeriod, setIsCheckingPeriod] = useState(false);
	const docConfig = DOC_TYPE_CONFIG[docType.value];

	const router = useRouter();

	const { mutate: uploadBatch, isPending: isUploading } = useMonitoringBatchMutation({
		docType: docType.value,
		onSuccess: (res) => {
			setData([]);
		},
	});

	const currentGlanceCols = docConfig.glanceCols;
	const extraHeaders = useMemo(
		() => (data.length ? Object.keys(data[0]).filter((k) => !k.startsWith("_") && !currentGlanceCols.includes(k)) : []),
		[data, currentGlanceCols]
	);

	const { processExcel } = useExcelProcessor({
		docType: docType.value,
		onProcessed: (rows) => {
			setData(rows);
			setExtraCols({});
		},
		onProcessing: setProcessing,
	});

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (files) => {
			if (files.length) processExcel(files[0]);
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
	const canSubmit = total > 0 && errors === 0;

	const handleProceedUpload = (mode: "append" | "overwrite") => {
		setConfirmModalOpen(false);
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

	const handleSubmit = () => {
		if (!canSubmit) return;
		setConfirmModalOpen(true);
	};

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
					onDocTypeChange={setDocType}
					onFieldChange={setField}
					onQuarterChange={setQuarter}
					onMonthChange={setMonth}
					onYearChange={setYear}
				/>

				<DataGatheringDropzone
					getRootProps={getRootProps}
					getInputProps={getInputProps}
					isDragActive={isDragActive}
					processing={processing}
				/>
			</div>

			{data.length > 0 && (
				<DataGatheringToolbar
					total={total}
					valid={valid}
					errors={errors}
					extraHeaders={extraHeaders}
					extraCols={extraCols}
					onToggleExtraCol={(col) => setExtraCols((p) => ({ ...p, [col]: !p[col] }))}
					onSubmit={handleSubmit}
					canSubmit={canSubmit}
					isUploading={isUploading}
					isCheckingPeriod={isCheckingPeriod}
				/>
			)}

			{data.length > 0 && (
				<DataGatheringTable
					data={data}
					docType={docType.value}
					extraHeaders={extraHeaders}
					extraCols={extraCols}
					onSelectRow={setSelectedRow}
				/>
			)}

			<DataGatheringDetailModal
				docType={docType.value}
				selectedRow={selectedRow}
				onClose={() => setSelectedRow(null)}
			/>

			<DataGatheringConfirmModal
				open={confirmModalOpen}
				docType={docType.value}
				fieldLabel={field.label}
				periodLabel={docConfig.period === "quarter" ? quarter.value : month.label}
				yearLabel={year.value}
				isUploading={isUploading}
				onConfirm={() => handleProceedUpload("overwrite")}
				onClose={() => setConfirmModalOpen(false)}
			/>
		</div>
	);
}
