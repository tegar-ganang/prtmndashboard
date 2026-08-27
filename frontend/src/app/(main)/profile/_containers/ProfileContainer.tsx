"use client";

import { useEffect, useState } from "react";
import { KeyRound, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/button/Button";
import useAuthStore from "@/app/stores/useAuthStore";
import { useUpdateProfileMutation } from "../_hooks/useUpdateProfileMutation";
import { useChangePasswordMutation } from "../_hooks/useChangePasswordMutation";

export default function ProfileContainer() {
	const user = useAuthStore.useUser();
	const { mutate: updateProfile, isPending: isSavingProfile } = useUpdateProfileMutation();
	const { mutate: changePassword, isPending: isChangingPassword } = useChangePasswordMutation();

	const [name, setName] = useState(user?.name ?? "");
	useEffect(() => setName(user?.name ?? ""), [user?.name]);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const handleSaveProfile = () => {
		if (!user?.id) return;
		updateProfile({ id: user.id, name: name.trim() || undefined });
	};

	const handleChangePassword = () => {
		if (newPassword.length < 8) {
			toast.error("Password baru minimal 8 karakter.");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Konfirmasi password baru tidak cocok.");
			return;
		}
		changePassword(
			{ currentPassword, newPassword },
			{
				onSuccess: () => {
					setCurrentPassword("");
					setNewPassword("");
					setConfirmPassword("");
				},
			},
		);
	};

	return (
		<div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
				<p className="text-sm text-gray-600 mt-1">Kelola informasi akun dan password Anda.</p>
			</div>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6 max-w-xl">
				<div className="flex items-center gap-2 mb-4">
					<UserIcon className="w-5 h-5 text-gray-500" />
					<h2 className="text-lg font-semibold text-gray-900">Edit Profil</h2>
				</div>

				<div className="flex flex-col gap-4">
					<div>
						<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
							Nama
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Nama lengkap"
						/>
					</div>

					<div>
						<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
							Email
						</label>
						<input
							type="email"
							value={user?.email ?? ""}
							disabled
							className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
						/>
					</div>

					{user?.role_name && (
						<div>
							<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
								Role
							</label>
							<p className="text-sm text-gray-900">{user.role_name}</p>
						</div>
					)}

					<div>
						<Button variant="blue" isLoading={isSavingProfile} onClick={handleSaveProfile}>
							Simpan Profil
						</Button>
					</div>
				</div>
			</section>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6 max-w-xl">
				<div className="flex items-center gap-2 mb-4">
					<KeyRound className="w-5 h-5 text-gray-500" />
					<h2 className="text-lg font-semibold text-gray-900">Ubah Password</h2>
				</div>

				<div className="flex flex-col gap-4">
					<div>
						<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
							Password Saat Ini
						</label>
						<input
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="••••••••"
						/>
					</div>

					<div>
						<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
							Password Baru
						</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Minimal 8 karakter"
						/>
					</div>

					<div>
						<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
							Konfirmasi Password Baru
						</label>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Ulangi password baru"
						/>
					</div>

					<div>
						<Button
							variant="blue"
							isLoading={isChangingPassword}
							disabled={!currentPassword || !newPassword || !confirmPassword}
							onClick={handleChangePassword}
						>
							Ubah Password
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
