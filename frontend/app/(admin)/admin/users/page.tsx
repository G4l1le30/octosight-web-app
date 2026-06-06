"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Edit2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/utils";
import { ROLE_BADGE_COLORS, type UserRole } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/ui/PermissionGate";

interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface EditForm {
  role: string;
  is_active: boolean;
}

export default function AdminUsersPage() {
  const { can } = usePermissions();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<EditForm>({
    role: "user",
    is_active: true,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    setCurrentPage(1);
  }, [fetchUsers]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return users.slice(start, start + itemsPerPage);
  }, [users, currentPage, itemsPerPage]);

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      role: user.role,
      is_active: user.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        role: form.role,
        is_active: form.is_active,
      };

      const res = await fetch(`/api/v1/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update user");

      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...updated, role: form.role, is_active: form.is_active }
            : u,
        ),
      );
      toast.success("User updated successfully.");
      closeModal();
    } catch {
      toast.error("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role: string) => {
    const color =
      ROLE_BADGE_COLORS[role as UserRole] ?? "bg-gray-100 text-secondary";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold",
          color,
        )}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-3 md:px-4 pb-6 md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-secondary">
              User Management
            </h1>
            <p className="text-xs md:text-sm text-secondary/80 font-medium mt-0.5 md:mt-1">
              View, edit, and manage all registered users.
            </p>
          </div>
          <div className="ml-auto bg-primary/10 border border-primary/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3">
            <div>
              <p className="text-xl md:text-2xl font-bold text-primary leading-none">
                {users.length}
              </p>
              <p className="text-xs text-primary font-bold mt-0.5 md:mt-1">Total Users</p>
            </div>
            <Users className="size-8 text-primary opacity-40" />
          </div>
        </div>

        {/* Error state */}
        {!loading && users.length === 0 && (
          <div className="card p-14 md:p-20 text-center max-w-md mx-auto">
            <div className="size-16 bg-neutral-page rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Users className="size-8 text-secondary/20" />
            </div>
            <p className="text-secondary font-bold text-base md:text-lg mb-1.5 md:mb-2">
              No users found
            </p>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="card shadow-md border border-neutral-border">
          {loading ? (
            <div className="p-14 md:p-20 text-center flex flex-col items-center gap-2 md:gap-3">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-xs md:text-sm font-bold text-secondary/60">
                Loading users...
              </p>
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-page/50 text-xs md:text-sm font-semibold text-secondary border-b border-neutral-border">
                  <tr>
                    <th className="px-6 md:px-8 py-4 md:py-5">Name</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-center">
                      Email
                    </th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-center">
                      Role
                    </th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-center">
                      Status
                    </th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-center">
                      Created
                    </th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-page/30 transition-colors group"
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="font-semibold text-secondary text-xs md:text-sm">
                          {user.full_name}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="text-xs md:text-sm text-secondary/80 font-medium">
                          {user.email}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        {roleBadge(user.role)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="inline-flex items-center gap-1 md:gap-1.5 text-xs font-bold">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              user.is_active ? "bg-green-500" : "bg-red-500",
                            )}
                          />
                          <span
                            className={
                              user.is_active ? "text-green-700" : "text-red-700"
                            }
                          >
                            {user.is_active ? "Active" : "Suspended"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="text-xs font-semibold text-secondary/80">
                          {formatDateTime(user.created_at).date}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <PermissionGate permission="users.update_role">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            leftIcon={<Edit2 className="size-3.5" />}
                          >
                            Edit
                          </Button>
                        </PermissionGate>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {users.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={users.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {modalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg border border-neutral-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 md:px-8 py-4 md:py-5 border-b border-neutral-border">
              <div className="flex items-center gap-2 md:gap-3">
                <h2 className="text-base md:text-lg font-bold text-secondary">Edit User</h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 md:p-2 hover:bg-neutral-border rounded-md md:rounded-lg transition-all"
              >
                <X className="size-5 text-secondary/60" />
              </button>
            </div>

            <div className="px-6 md:px-8 py-4 md:py-6 space-y-4 md:space-y-5">
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={[
                  { value: "viewer", label: "Viewer" },
                  { value: "user", label: "User" },
                  { value: "cs", label: "Customer Service" },
                  { value: "analyst", label: "Analyst" },
                  { value: "investigator", label: "Investigator" },
                  { value: "moderator", label: "Moderator" },
                  { value: "admin", label: "Admin" },
                ]}
              />

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-bold text-secondary block">
                  Status
                </label>
                <div className="flex items-center gap-3 md:gap-4">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: true })}
                    className={cn(
                      "flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold border-2 transition-all",
                      form.is_active
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-neutral-border bg-white text-secondary/60 hover:border-green-300",
                    )}
                  >
                    <span className="size-2.5 rounded-full bg-green-500" />
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: false })}
                    className={cn(
                      "flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold border-2 transition-all",
                      !form.is_active
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-neutral-border bg-white text-secondary/60 hover:border-red-300",
                    )}
                  >
                    <span className="size-2.5 rounded-full bg-red-500" />
                    Suspended
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 md:gap-3 px-6 md:px-8 py-4 md:py-5 border-t border-neutral-border">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 bg-white border-2 border-neutral-border text-secondary font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:bg-neutral-page transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 bg-secondary text-white font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Edit2 className="size-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
