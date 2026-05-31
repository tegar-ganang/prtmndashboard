"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertCircle, X } from "lucide-react";

import { DRAWER_SECTIONS, LONG_KEYS, type DocTypeValue } from "../_constants/dataGathering.constants";
import type { ExcelRow } from "../_types";

interface DataGatheringDetailModalProps {
	docType: DocTypeValue;
	selectedRow: ExcelRow | null;
	onClose: () => void;
}

export default function DataGatheringDetailModal({
	docType,
	selectedRow,
	onClose,
}: DataGatheringDetailModalProps) {
	const titleMap: Record<string, string> = {
		PRODUKSI_TARGET: "Target Bulanan Produksi",
		PRODUKSI_REALISASI: "Realisasi Harian Produksi",
	};
	const displayTitle = titleMap[docType] || docType;

	return (
		<Transition.Root show={selectedRow !== null} as={Fragment}>
			<Dialog as="div" className="relative z-[999]" onClose={onClose}>
				<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
					<div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
				</Transition.Child>
 
				<div className="fixed inset-0 z-10 w-screen overflow-y-auto">
					<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
						<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
							<Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] flex flex-col">
								<div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
									<div>
										<Dialog.Title className="text-base font-semibold text-gray-900">Detail {displayTitle}</Dialog.Title>
										<p className="text-xs text-gray-500 font-mono mt-0.5">Row #{selectedRow?._index}</p>
									</div>
									<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
										<X className="h-5 w-5" />
									</button>
								</div>
								{selectedRow && (
									<div className="flex-1 overflow-y-auto px-6 py-5">
										<div className="flex flex-col gap-6">
											{!selectedRow._isValid && (
												<div className="rounded-lg bg-red-50 border border-red-200 p-4">
													<h4 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-2">
														<AlertCircle className="w-4 h-4" /> Validation Errors
													</h4>
													<ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
														{selectedRow._errors.map((e, i) => (
															<li key={i}>{e}</li>
														))}
													</ul>
												</div>
											)}
											{docType === "MIT" ? (
												DRAWER_SECTIONS.map((sec) => (
													<div key={sec.title}>
														<h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">
															{sec.title}
														</h4>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{sec.keys.map((k) => (
																<div key={k} className={LONG_KEYS.has(k) ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}>
																	<p className="text-[11px] text-gray-500 mb-1">{k}</p>
																	<p className="text-sm font-medium text-gray-900 whitespace-pre-wrap break-words">
																		{selectedRow[k] || <span className="text-gray-300 italic">—</span>}
																	</p>
																</div>
															))}
														</div>
													</div>
												))
											) : (
												<div>
													<h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Data {docType}</h4>
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
														{Object.keys(selectedRow)
															.filter((k) => !k.startsWith("_"))
															.map((k) => (
																<div key={k} className={LONG_KEYS.has(k) || k.length > 20 ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}>
																	<p className="text-[11px] text-gray-500 mb-1">{k}</p>
																	<p className="text-sm font-medium text-gray-900 whitespace-pre-wrap break-words">
																		{selectedRow[k] !== null && selectedRow[k] !== undefined && selectedRow[k] !== "" ? (
																			String(selectedRow[k])
																		) : (
																			<span className="text-gray-300 italic">—</span>
																		)}
																	</p>
																</div>
															))}
													</div>
												</div>
											)}
										</div>
									</div>
								)}
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
