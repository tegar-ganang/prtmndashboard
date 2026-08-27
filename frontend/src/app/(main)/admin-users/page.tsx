import { Metadata } from "next";
import AdminUsersContainer from "./_containers/AdminUsersContainer";

export const metadata: Metadata = {
	title: "User Management",
	description: "Kelola role akses pengguna dashboard",
};

export default function AdminUsersPage() {
	return <AdminUsersContainer />;
}
