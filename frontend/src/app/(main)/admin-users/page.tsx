"use client";

import React, { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import Typography from "@/components/Typography";

// Dummy data as placeholder before API integration
const initialUsers = [
  { id: "1", name: "Budi (Senior Manager)", email: "budi@pertamina.com", role: "Senior Manager", isActive: true, isVerified: true },
  { id: "2", name: "Siti (Manager Projects)", email: "siti@pertamina.com", role: "Manager Projects", isActive: true, isVerified: true },
  { id: "3", name: "Agus (Tim Admin)", email: "agus@pertamina.com", role: "Tim Admin", isActive: false, isVerified: false },
];

const ROLES = ["Senior Manager", "Manager Projects", "Tim Admin", "Tim ITS"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [editRoleModal, setEditRoleModal] = useState<{ isOpen: boolean; userId: string; role: string }>({ isOpen: false, userId: "", role: "" });

  const handleToggleActive = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const handleToggleVerify = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isVerified: !u.isVerified } : u));
  };

  const handleSaveRole = () => {
    setUsers(users.map(u => u.id === editRoleModal.userId ? { ...u, role: editRoleModal.role } : u));
    setEditRoleModal({ isOpen: false, userId: "", role: "" });
  };

  const handleResetPassword = (email: string) => {
    alert(`Reset link sent to ${email}`);
  };

  return (
    <AdminLayout>
      <main className="p-6 space-y-6 bg-white min-h-screen text-slate-800">
        <div>
          <Typography variant="h3">Manajemen User (UAC) - Tim ITS</Typography>
          <Typography variant="p" className="text-gray-500">Kelola daftar pengguna, verifikasi status, dan atur peran (Role).</Typography>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">Role saat ini</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {user.role || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`}></span>
                      <span>{user.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${user.isVerified ? "bg-green-500" : "bg-yellow-500"}`}></span>
                      <span>{user.isVerified ? "Verified" : "Unverified"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 flex flex-col xl:flex-row justify-center space-y-2 xl:space-y-0 xl:space-x-2">
                    <button 
                      onClick={() => setEditRoleModal({ isOpen: true, userId: user.id, role: user.role })}
                      className="bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 text-xs font-medium transition-colors"
                    >
                      Edit Role
                    </button>
                    <button 
                      onClick={() => handleToggleActive(user.id)}
                      className={`${user.isActive ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"} border px-3 py-1.5 rounded-md text-xs font-medium transition-colors`}
                    >
                      {user.isActive ? "Ban" : "Activate"}
                    </button>
                    <button 
                      onClick={() => handleToggleVerify(user.id)}
                      className="bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    >
                      {user.isVerified ? "Unverify" : "Verify"}
                    </button>
                    <button 
                      onClick={() => handleResetPassword(user.email)}
                      className="bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    >
                      Reset Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editRoleModal.isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-black opacity-50 absolute inset-0"></div>
            <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl relative z-10">
              <Typography variant="h4" className="mb-4">Edit Role</Typography>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Role</label>
                  <select 
                    value={editRoleModal.role}
                    onChange={(e) => setEditRoleModal({ ...editRoleModal, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="" disabled>Pilih peran...</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    onClick={() => setEditRoleModal({ isOpen: false, userId: "", role: "" })}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveRole}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

