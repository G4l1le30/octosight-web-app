"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Trash2, X } from "lucide-react";
import PointsCounter from "@/components/gamification/PointsCounter";
import StreakTracker from "@/components/gamification/StreakTracker";
import BadgeCard from "@/components/gamification/BadgeCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const ACHIEVEMENT_ORDER: Record<string, number> = {
  first_report: 0,
  reporter_5: 1,
  reporter_10: 2,
  feedback_master: 3,
  accurate_eye: 4,
  streak_3: 5,
  streak_7: 6,
  first_module: 7,
  quiz_ace: 8,
  bookworm: 9,
  half_modules: 10,
  scholar: 11,
  phishing_hunter: 12,
  guardian: 13,
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [achLoading, setAchLoading] = useState(true);
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/v1/gamification/my-stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/v1/gamification/achievements")
      .then((r) => r.json())
      .then((data) => setAchievements(data))
      .catch(console.error)
      .finally(() => setAchLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.full_name || "");
    }
  }, [user]);

  const sortedAchievements = achievements
    .slice()
    .sort(
      (a, b) =>
        (ACHIEVEMENT_ORDER[a.code] ?? 999) - (ACHIEVEMENT_ORDER[b.code] ?? 999),
    );

  const [fieldErrors, setFieldErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validatePassword = (pw: string): string | null => {
    if (!pw) return null;
    if (pw.length < 8) return "Must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(pw)) return "Must contain at least one lowercase letter";
    if (!/\d/.test(pw)) return "Must contain at least one number";
    if (!/[@$!%*?&#^]/.test(pw)) return "Must contain at least one special character";
    return null;
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setFieldErrors({ oldPassword: "", newPassword: "", confirmPassword: "" });

    let hasErrors = false;
    const newErrors = { oldPassword: "", newPassword: "", confirmPassword: "" };

    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    if (newPassword || oldPassword) {
      if (user?.auth_provider !== "google" && !oldPassword) {
        newErrors.oldPassword = "Enter your current password to change it";
        hasErrors = true;
      }
      if (newPassword) {
        const pwError = validatePassword(newPassword);
        if (pwError) {
          newErrors.newPassword = pwError;
          hasErrors = true;
        }
      } else {
        newErrors.newPassword = "New password is required";
        hasErrors = true;
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setFieldErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        full_name: name.trim(),
      };
      if (newPassword) {
        if (user?.auth_provider !== "google") payload.old_password = oldPassword;
        payload.new_password = newPassword;
      }

      const response = await fetch(`/api/v1/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Unable to update settings at this time.",
        );
      }

      toast.success("Profile settings saved.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-24 md:py-32 text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4" />
        <p className="text-secondary font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 sm:px-8 py-8 md:py-12 max-w-6xl">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-secondary">
          My Profile
        </h1>
        <p className="text-secondary opacity-70 font-medium max-w-2xl mx-auto">
          Track your gamification progress and achievements in one place.
        </p>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2 mb-6 md:mb-8">
        <PointsCounter
          points={stats?.total_points || 0}
          level={stats?.level || 1}
        />
        <StreakTracker
          current={stats?.current_streak || 0}
          longest={stats?.longest_streak || 0}
        />
      </div>

      <div className="rounded-2xl md:rounded-3xl border border-neutral-border bg-white shadow-xl p-4 md:p-6">
        <div className="flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 md:mb-6">
          <div>
            <p className="text-xs md:text-sm text-secondary/60 font-semibold">
              Achievements
            </p>
            <h2 className="mt-1.5 md:mt-2 text-xl md:text-2xl font-bold text-secondary">
              Your Badge Collection
            </h2>
          </div>
          <p className="text-xs md:text-sm text-secondary/80">
            {achievements.filter((a) => a.earned).length} of{" "}
            {achievements.length} earned
          </p>
        </div>

        {achLoading ? (
          <div className="flex items-center justify-center py-12 md:py-16 text-secondary/80">
            Loading achievements...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {sortedAchievements.map((ach) => (
              <BadgeCard
                key={ach.code}
                name={ach.name}
                description={ach.description}
                icon_url={ach.icon_url}
                earned={ach.earned}
                points={ach.points}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl md:rounded-3xl border border-neutral-border bg-white shadow-xl p-4 md:p-6 mt-6 md:mt-8">
        <div className="flex items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <p className="text-xs md:text-sm text-secondary/60 font-semibold">
              User Settings
            </p>
            <h2 className="mt-1.5 md:mt-2 text-xl md:text-2xl font-bold text-secondary">
              Account Preferences
            </h2>
          </div>
          <span className="text-xs md:text-sm font-semibold text-secondary/80">
            {user?.role === "admin" ? "Admin" : "User"}
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 md:space-y-6">
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            <Input label="Email Address" value={user?.email || ""} disabled />
            <Input
              label="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-3 md:gap-4 md:grid-cols-3">
            {user?.auth_provider !== "google" && (
              <Input
                label="Old Password"
                type="password"
                showPasswordToggle
                placeholder="Enter current password"
                value={oldPassword}
                error={fieldErrors.oldPassword || undefined}
                onChange={(event) => {
                  setOldPassword(event.target.value);
                  if (fieldErrors.oldPassword) setFieldErrors(prev => ({ ...prev, oldPassword: "" }));
                }}
              />
            )}
            <Input
              label={user?.auth_provider === "google" ? "Set Password" : "New Password"}
              type="password"
              showPasswordToggle
              placeholder="New password"
              value={newPassword}
              error={fieldErrors.newPassword || undefined}
              onChange={(event) => {
                setNewPassword(event.target.value);
                if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: "" }));
              }}
            />
            <Input
              label="Confirm Password"
              type="password"
              showPasswordToggle
              placeholder="Repeat new password"
              value={confirmPassword}
              error={fieldErrors.confirmPassword || undefined}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
              }}
            />
          </div>

          <div className="grid gap-2 md:gap-3 md:grid-cols-2 items-end">
            <div>
              <p className="text-xs md:text-sm font-semibold text-secondary">
                Authentication Method
              </p>
              <p className="text-xs md:text-sm text-secondary/80">
                {user?.auth_provider === "google" ? (
                  <>
                    <CheckCircle className="size-3.5 inline mr-1 text-green-600" />
                    Connected with Google
                  </>
                ) : (
                  "Email & password"
                )}
              </p>
            </div>
            {user?.auth_provider !== "google" && (
              <Button type="submit" size="lg" loading={saving} className="w-full md:w-auto">
                Save Settings
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="rounded-2xl md:rounded-3xl border border-red-200 bg-white shadow-xl p-4 md:p-6 mt-6 md:mt-8">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-risk-high mb-1 md:mb-1.5">
              Delete Account
            </h3>
            <p className="text-sm md:text-base text-secondary leading-relaxed mb-4 md:mb-5">
              Permanently delete your account and all associated data. This
              action cannot be undone. Your tickets will be anonymized, and all
              personal information will be removed from our system.
            </p>
            <div className="flex flex-wrap gap-2">
              {user?.auth_provider === "google" && (
                <Button
                  variant="danger"
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch("/api/v1/auth/request-deletion", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({}),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => null);
                        throw new Error(err?.detail || "Failed to send deletion request.");
                      }
                      toast.success("Confirmation email sent. Please check your inbox.");
                    } catch (err: any) {
                      toast.error(err.message);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  leftIcon={<Trash2 className="size-4" />}
                  className="bg-risk-high text-white hover:bg-risk-high/90"
                >
                  Send Confirmation Email
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                leftIcon={<Trash2 className="size-4" />}
                className="bg-risk-high text-white hover:bg-risk-high/90"
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-secondary/50 hover:text-secondary transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <div className="size-10 md:size-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 md:size-6 text-risk-high" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-secondary">Confirm Deletion</h3>
                <p className="text-xs md:text-sm text-secondary/80">This action is permanent</p>
              </div>
            </div>

            <p className="text-sm md:text-base text-secondary/80 mb-5 md:mb-6 leading-relaxed">
              {user?.auth_provider === "google"
                ? "Confirm that you want to permanently delete your account."
                : "Please enter your password to confirm you want to permanently delete your account."}
            </p>

            <div className="space-y-4">
              {user?.auth_provider !== "google" && (
                <Input
                  label="Password"
                  type="password"
                  showPasswordToggle
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 bg-risk-high text-white hover:bg-risk-high/90"
                  loading={deleting}
                  onClick={async () => {
                    if (user?.auth_provider !== "google" && !deletePassword.trim()) {
                      toast.error("Please enter your password.");
                      return;
                    }
                    setDeleting(true);
                    try {
                      const res = await fetch("/api/v1/auth/me", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: deletePassword }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => null);
                        throw new Error(err?.detail || "Failed to delete account.");
                      }
                      toast.success("Account deleted permanently.");
                      setShowDeleteModal(false);
                      await logout();
                      window.location.href = "/";
                    } catch (err: any) {
                      toast.error(err.message);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? "Deleting..." : "Delete My Account"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
