"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Edit2,
  Shield,
  ShieldCheck,
  UserCog,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDateTime } from "@/lib/utils";

interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface EditForm {
  full_name: string;
  role: string;
  is_active: boolean;
  password: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<EditForm>({
    full_name: "",
    role: "user",
    is_active: true,
    password: "",
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
  }, [fetchUsers]);

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      password: "",
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
        full_name: form.full_name,
        role: form.role,
        is_active: form.is_active,
      };
      if (form.password.trim()) {
        body.password = form.password;
      }

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
            ? { ...u, ...updated, full_name: form.full_name, role: form.role, is_active: form.is_active }
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
    const styles: Record<string, string> = {
      admin: "bg-amber-100 text-amber-800 border-amber-200",
      investigator: "bg-purple-100 text-purple-800 border-purple-200",
      analyst: "bg-blue-100 text-blue-800 border-blue-200",
      cs: "bg-emerald-100 text-emerald-800 border-emerald-200",
      moderator: "bg-sky-100 text-sky-800 border-sky-200",
      user: "bg-gray-100 text-gray-700 border-gray-200",
    };
    const icons: Record<string, React.ReactNode> = {
      admin: <ShieldCheck className="size-3.5" />,
      investigator: <Shield className="size-3.5" />,
      analyst: <Shield className="size-3.5" />,
      cs: <Shield className="size-3.5" />,
      moderator: <Shield className="size-3.5" />,
      user: <UserCog className="size-3.5" />,
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
          styles[role] || "bg-gray-100 text-gray-700 border-gray-200",
        )}
      >
        {icons[role] || null}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-border rounded-full transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary">
              User Management
            </h1>
            <p className="text-secondary font-medium opacity-80">
              View, edit, and manage all registered users.
            </p>
          </div>
          <div className="ml-auto bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 flex items-center gap-3">
            <div>
              <p className="text-2xl font-bold text-primary leading-none">
                {users.length}
              </p>
              <p className="text-xs text-primary font-bold mt-1">
                Total Users
              </p>
            </div>
            <Users className="size-8 text-primary opacity-40" />
          </div>
        </div>

        {/* Error state */}
        {!loading && users.length === 0 && (
          <div className="card p-20 text-center max-w-md mx-auto">
            <div className="size-16 bg-neutral-page rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="size-8 text-secondary/20" />
            </div>
            <p className="text-secondary font-bold text-base md:text-lg mb-2">
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
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-secondary/40">
                Loading users...
              </p>
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-page/50 text-sm font-semibold text-secondary border-b border-neutral-border">
                  <tr>
                    <th className="px-6 md:px-8 py-4 md:py-5">Name</th>
                    <th className="px-6 md:px-8 py-4 md:py-5">Email</th>
                    <th className="px-6 md:px-8 py-4 md:py-5">Role</th>
                    <th className="px-6 md:px-8 py-4 md:py-5">Status</th>
                    <th className="px-6 md:px-8 py-4 md:py-5">Created</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-page/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-secondary text-sm">
                          {user.full_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-secondary/80 font-medium">
                          {user.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">{roleBadge(user.role)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                            user.is_active
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              user.is_active ? "bg-green-500" : "bg-red-500",
                            )}
                          />
                          {user.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-secondary/80">
                          {formatDateTime(user.created_at).date}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          leftIcon={<Edit2 className="size-3.5" />}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {/* Edit Modal */}
      {modalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-neutral-border animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-neutral-border">
               <div className="flex items-center gap-3">
                 <h2 className="text-lg font-bold text-secondary">
                   Edit User
                 </h2>
               </div>
               <button
                 onClick={closeModal}
                 className="p-2 hover:bg-neutral-border rounded-lg transition-all"
               >
                 <X className="size-5 text-secondary/60" />
               </button>
             </div>

            <div className="px-6 md:px-8 py-6 space-y-5">
              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                placeholder="Enter full name"
              />

              <Select
                label="Role"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                options={[
                  { value: "user", label: "User" },
                  { value: "cs", label: "Customer Service" },
                  { value: "analyst", label: "Analyst" },
                  { value: "investigator", label: "Investigator" },
                  { value: "moderator", label: "Moderator" },
                  { value: "admin", label: "Admin" },
                ]}
              />

              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary block">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: true })}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all",
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
                      "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all",
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

              <Input
                label="New Password (leave blank to keep current)"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Enter new password"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 md:px-8 py-5 border-t border-neutral-border bg-neutral-page/30">
              <Button variant="outline" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saving}
                leftIcon={saving ? undefined : <Save className="size-4" />}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
