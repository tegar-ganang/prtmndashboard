"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/button/Button";
import clsxm from "@/lib/clsxm";
import type { AccountItem, RoleItem } from "@/types/account";
import { useDefaultPasswordQuery } from "../_hooks/useDefaultPasswordQuery";

export interface UserFormValues {
	name: string;
	email: string;
	roleId: number | null;
}

interface UserFormModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	roles: RoleItem[];
	account?: AccountItem | null;
	isSubmitting?: boolean;
	onSubmit: (values: UserFormValues) => void;
}

const emptyValues: UserFormValues = { name: "", email: "", roleId: null };

export default function UserFormModal({
	isOpen,
	setIsOpen,
	roles,
	account,
	isSubmitting,
	onSubmit,
}: UserFormModalProps) {
	const isEdit = Boolean(account);
	const [values, setValues] = useState<UserFormValues>(emptyValues);
	const { data: defaultPassword } = useDefaultPasswordQuery();

	useEffect(() => {
		if (isOpen) {
			setValues(account ? { name: account.name ?? "", email: account.email, roleId: account.roleId } : emptyValues);
		}
	}, [isOpen, account]);

	const canSubmit = values.email.trim() !== "";

	return (
		<Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
			<div className="fixed inset-0 flex items-center justify-center bg-black/20 px-4">
				<DialogPanel
					className={clsxm(
						"bg-white relative shadow-lg text-gray-900 rounded-lg p-6 w-full max-w-md",
					)}
				>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
					>
						<X strokeWidth={2.5} size={20} />
					</button>

					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						{isEdit ? "Edit User" : "Tambah User"}
					</h2>

					<div className="flex flex-col gap-4">
						<div>
							<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
								Nama
							</label>
							<input
								type="text"
								value={values.name}
								onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
								className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Nama lengkap"
							/>
						</div>

						<div>
							<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
								Email <span className="text-red-500">*</span>
							</label>
							<input
								type="email"
								value={values.email}
								onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
								className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="nama@pertamina.com"
							/>
						</div>

						{!isEdit && (
							<>
								<div>
									<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
										Role
									</label>
									<select
										value={values.roleId ?? ""}
										onChange={(e) =>
											setValues((v) => ({ ...v, roleId: e.target.value === "" ? null : Number(e.target.value) }))
										}
										className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									>
										<option value="">Belum ada role</option>
										{roles.map((role) => (
											<option key={role.id} value={role.id}>
												{role.roleName}
											</option>
										))}
									</select>
								</div>

								<div className="flex items-start gap-2 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
									<Info className="w-4 h-4 shrink-0 mt-0.5" />
									<span>
										User akan dibuat dengan password default{" "}
										<span className="font-semibold">{defaultPassword ?? "…"}</span>. Sampaikan ke user dan minta
										mereka menggantinya lewat halaman Profil setelah login pertama.
									</span>
								</div>
							</>
						)}
					</div>

					<div className="flex justify-end gap-3 mt-6">
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							Batal
						</Button>
						<Button
							variant="blue"
							disabled={!canSubmit}
							isLoading={isSubmitting}
							onClick={() => onSubmit(values)}
						>
							{isEdit ? "Simpan" : "Buat User"}
						</Button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
