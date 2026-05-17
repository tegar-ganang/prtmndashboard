"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertCircle } from "lucide-react";

import Button from "@/components/button/Button";
import type { DocTypeValue } from "../_constants/dataGathering.constants";

interface DataGatheringConfirmModalProps {
	open: boolean;
	docType: DocTypeValue;
	fieldLabel: string;
	periodLabel: string;
	yearLabel: string;
	isUploading: boolean;
	isDataExists?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}


export default function DataGatheringConfirmModal({
	open,
	docType,
	fieldLabel,
	periodLabel,
	yearLabel,
	isUploading,
	isDataExists = true,
	onConfirm,
	onClose,
}: DataGatheringConfirmModalProps) {
	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog as="div" className="relative z-[999]" onClose={() => !isUploading && onClose()}>
				<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
					<div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
				</Transition.Child>

				<div className="fixed inset-0 z-10 w-screen overflow-y-auto">
					<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
						<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
							<Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
								<div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
									<div className="sm:flex sm:items-start">
										<div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDataExists ? "bg-yellow-100" : "bg-blue-100"}`}>
											<AlertCircle className={`h-6 w-6 ${isDataExists ? "text-yellow-600" : "text-blue-600"}`} aria-hidden="true" />
										</div>
										<div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
											<Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
												{isDataExists ? "Data Periode Ini Sudah Ada" : "Konfirmasi Proses Data"}
											</Dialog.Title>
											<div className="mt-2">
												{isDataExists ? (
													<>
														<p className="text-sm text-gray-500">
															Data {docType} untuk <b>{fieldLabel} — {periodLabel} Tahun {yearLabel}</b> sudah tersedia di database.
														</p>
														<p className="text-sm text-gray-500 mt-2">
															Apakah Anda ingin memproses data ini? <br />
															<span className="text-red-500 font-semibold">Peringatan:</span> Memproses akan menghapus data lama pada periode yang sama.
														</p>
													</>
												) : (
													<p className="text-sm text-gray-500">
														Apakah Anda yakin ingin memproses data {docType} untuk <b>{fieldLabel} — {periodLabel} Tahun {yearLabel}</b>?
													</p>
												)}
											</div>
										</div>
									</div>
								</div>
								<div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
									<Button variant="red" onClick={onConfirm} disabled={isUploading} className="w-full sm:w-auto">
										Proses Data
									</Button>
									<Button variant="outline" onClick={onClose} disabled={isUploading} className="w-full sm:w-auto mt-3 sm:mt-0 mr-auto">
										Batal
									</Button>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
