"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
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
  scholar: 7,
  phishing_hunter: 8,
  guardian: 9,
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [achLoading, setAchLoading] = useState(true);
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
      if (!oldPassword) {
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
      if (newPassword && oldPassword) {
        payload.old_password = oldPassword;
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
      <div className="container mx-auto px-4 py-32 text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-secondary font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-secondary">
          My Profile
        </h1>
        <p className="text-secondary opacity-70 font-medium max-w-2xl mx-auto">
          Track your gamification progress and achievements in one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <PointsCounter
          points={stats?.total_points || 0}
          level={stats?.level || 1}
        />
        <StreakTracker
          current={stats?.current_streak || 0}
          longest={stats?.longest_streak || 0}
        />
      </div>

      <div className="rounded-3xl border border-neutral-border bg-white shadow-xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <p className="text-sm text-secondary/60 font-semibold">
              Achievements
            </p>
            <h2 className="mt-2 text-2xl font-bold text-secondary">
              Your Badge Collection
            </h2>
          </div>
          <p className="text-sm text-secondary/80">
            {achievements.filter((a) => a.earned).length} of{" "}
            {achievements.length} earned
          </p>
        </div>

        {achLoading ? (
          <div className="flex items-center justify-center py-16 text-secondary/70">
            Loading achievements...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      <div className="rounded-3xl border border-neutral-border bg-white shadow-xl p-6 mt-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-secondary/60 font-semibold">
              User Settings
            </p>
            <h2 className="mt-2 text-2xl font-bold text-secondary">
              Account Preferences
            </h2>
          </div>
          <span className="text-sm font-semibold text-secondary/80">
            {user?.role === "admin" ? "Admin" : "User"}
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email Address" value={user?.email || ""} disabled />
            <Input
              label="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
            <Input
              label="New Password"
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

          <div className="grid gap-3 md:grid-cols-2 items-end">
            <div>
              <p className="text-sm font-semibold text-secondary">
                Authentication Method
              </p>
              <p className="text-sm text-secondary/70">Email &amp; password</p>
            </div>
            <Button type="submit" loading={saving} className="w-full md:w-auto">
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
