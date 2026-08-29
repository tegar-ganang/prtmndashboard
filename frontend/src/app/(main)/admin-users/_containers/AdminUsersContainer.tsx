"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import AccessDeniedCard from "@/components/feedback/AccessDeniedCard";
import Button from "@/components/button/Button";
import IconButton from "@/components/button/IconButton";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import Table from "@/components/table/Table";
import useAuthStore from "@/app/stores/useAuthStore";
import type { AccountItem } from "@/types/account";
import { useAccountsQuery } from "../_hooks/useAccountsQuery";
import { useRolesQuery } from "../_hooks/useRolesQuery";
import { useUpdateAccountRoleMutation } from "../_hooks/useUpdateAccountRoleMutation";
import { useUpdateAccountStatusMutation } from "../_hooks/useUpdateAccountStatusMutation";
import { useCreateAccountMutation } from "../_hooks/useCreateAccountMutation";
import { useEditAccountMutation } from "../_hooks/useEditAccountMutation";
import { useDeleteAccountMutation } from "../_hooks/useDeleteAccountMutation";
import UserFormModal, { type UserFormValues } from "../_components/UserFormModal";

function formatDate(value: string | null) {
	if (!value) return "-";
	return new Date(value).toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

export default function AdminUsersContainer() {
	const currentUser = useAuthStore.useUser();
	const isAdmin = currentUser?.is_admin ?? false;

	const { data: accounts = [], isLoading: isLoadingAccounts } = useAccountsQuery();
	const { data: roles = [], isLoading: isLoadingRoles } = useRolesQuery();
	const { mutate: updateRole, isPending: isUpdatingRole, variables: pendingVariables } =
		useUpdateAccountRoleMutation();
	const { mutate: updateStatus, isPending: isUpdatingStatus, variables: pendingStatusVariables } =
		useUpdateAccountStatusMutation();
	const { mutate: createAccount, isPending: isCreating } = useCreateAccountMutation();
	const { mutate: editAccount, isPending: isEditing } = useEditAccountMutation();
	const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccountMutation();

	const [formModalOpen, setFormModalOpen] = useState(false);
	const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

	const NO_ROLE = "__none__";
	const [roleFilter, setRoleFilter] = useState<string>("");

	const filteredAccounts = useMemo(() => {
		if (!roleFilter) return accounts;
		if (roleFilter === NO_ROLE) return accounts.filter((a) => !a.roleName);
		return accounts.filter((a) => a.roleName === roleFilter);
	}, [accounts, roleFilter]);

	const columns = useMemo<ColumnDef<AccountItem>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
				cell: (props) => <span>{`${props.getValue() ?? "-"}`}</span>,
			},
			{
				accessorKey: "email",
				header: "Email",
				cell: (props) => <span>{`${props.getValue()}`}</span>,
			},
			{
				id: "role",
				header: "Role",
				accessorFn: (account) => account.roleName ?? "Belum ada role",
				cell: ({ row }) => {
					const account = row.original;
					const isRowUpdating = isUpdatingRole && pendingVariables?.id === account.id;

					return (
						<select
							value={account.roleId ?? ""}
							disabled={isRowUpdating || isLoadingRoles}
							onChange={(e) =>
								updateRole({
									id: account.id,
									roleId: e.target.value === "" ? null : Number(e.target.value),
								})
							}
							className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="">Belum ada role</option>
							{roles.map((role) => (
								<option key={role.id} value={role.id}>
									{role.roleName}
								</option>
							))}
						</select>
					);
				},
			},
			{
				id: "status",
				header: "Status",
				accessorFn: (account) =>
					[account.isActive ? "Active" : "Inactive", account.isAdmin ? "Admin" : ""].join(" "),
				cell: ({ row }) => {
					const account = row.original;
					const isSelf = account.email === currentUser?.email;
					const isRowUpdating = isUpdatingStatus && pendingStatusVariables?.id === account.id;
					return (
						<div className="flex flex-col gap-1 text-xs">
							<button
								type="button"
								disabled={isSelf || isRowUpdating}
								title={isSelf ? "Tidak bisa menonaktifkan akun sendiri" : "Klik untuk ubah status"}
								onClick={() => updateStatus({ id: account.id, isActive: !account.isActive })}
								className={
									account.isActive
										? "inline-flex w-fit items-center px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 hover:bg-green-200 disabled:hover:bg-green-100 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
										: "inline-flex w-fit items-center px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
								}
							>
								{account.isActive ? "Active" : "Inactive"}
							</button>
							{account.isAdmin && (
								<span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
									Admin
								</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: "createdAt",
				header: "Joined",
				cell: (props) => <span>{formatDate(`${props.getValue()}`)}</span>,
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => {
					const account = row.original;
					const isSelf = account.email === currentUser?.email;
					return (
						<div className="flex items-center justify-center gap-2">
							<IconButton
								type="button"
								variant="yellow"
								size="sm"
								icon={Pencil}
								title="Edit user"
								aria-label="Edit user"
								onClick={() => {
									setEditingAccount(account);
									setFormModalOpen(true);
								}}
							/>
							<IconButton
								type="button"
								variant="red"
								size="sm"
								icon={Trash2}
								title={isSelf ? "Tidak bisa menghapus akun sendiri" : "Delete user"}
								aria-label="Delete user"
								disabled={isSelf}
								onClick={() => setDeleteTargetId(account.id)}
							/>
						</div>
					);
				},
			},
		],
		[
			roles,
			isLoadingRoles,
			isUpdatingRole,
			pendingVariables,
			updateRole,
			isUpdatingStatus,
			pendingStatusVariables,
			updateStatus,
			currentUser?.email,
		],
	);

	const handleFormSubmit = (values: UserFormValues) => {
		if (editingAccount) {
			editAccount(
				{
					id: editingAccount.id,
					name: values.name || undefined,
					email: values.email || undefined,
				},
				{ onSuccess: () => setFormModalOpen(false) },
			);
			return;
		}

		createAccount(
			{ email: values.email, name: values.name || null, roleId: values.roleId },
			{ onSuccess: () => setFormModalOpen(false) },
		);
	};

	const handleDelete = () => {
		if (!deleteTargetId) return;
		deleteAccount(deleteTargetId, { onSuccess: () => setDeleteTargetId(null) });
	};

	if (!isAdmin) {
		return (
			<div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">User Management</h1>
					<p className="text-sm text-gray-600 mt-1">Kelola role akses pengguna dashboard.</p>
				</div>
				<AccessDeniedCard description="Halaman ini hanya bisa diakses oleh administrator. Hubungi administrator jika Anda memerlukan akses." />
			</div>
		);
	}

	return (
		<div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">User Management</h1>
					<p className="text-sm text-gray-600 mt-1">
						Kelola akun dan assign role untuk mengatur hak akses (RBAC) mereka di dashboard.
					</p>
				</div>
				<Button
					variant="blue"
					leftIcon={Plus}
					onClick={() => {
						setEditingAccount(null);
						setFormModalOpen(true);
					}}
				>
					Tambah User
				</Button>
			</div>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>
				<Table
					className="text-black"
					data={filteredAccounts}
					columns={columns}
					withFilter
					withEntries
					withPaginationControl
					isLoading={isLoadingAccounts}
					leftExtras={
						<select
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="">Semua Role</option>
							{roles.map((role) => (
								<option key={role.id} value={role.roleName}>
									{role.roleName}
								</option>
							))}
							<option value={NO_ROLE}>Belum ada role</option>
						</select>
					}
				/>
			</section>

			<UserFormModal
				isOpen={formModalOpen}
				setIsOpen={setFormModalOpen}
				roles={roles}
				account={editingAccount}
				isSubmitting={isCreating || isEditing}
				onSubmit={handleFormSubmit}
			/>

			<ConfirmationDialog
				isOpen={Boolean(deleteTargetId)}
				setIsOpen={(open) => {
					if (!open) setDeleteTargetId(null);
				}}
				message={isDeleting ? "Menghapus user..." : "Yakin ingin menghapus user ini?"}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
