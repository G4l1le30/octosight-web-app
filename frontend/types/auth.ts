export type UserRole = "user" | "cs" | "analyst" | "investigator" | "moderator" | "admin" | "viewer";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: -1,
  user: 0,
  cs: 1,
  analyst: 2,
  investigator: 3,
  moderator: 5,
  admin: 10,
};

export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  viewer: "bg-gray-100 text-gray-700",
  user: "bg-blue-100 text-blue-700",
  cs: "bg-green-100 text-green-700",
  analyst: "bg-purple-100 text-purple-700",
  investigator: "bg-orange-100 text-orange-700",
  moderator: "bg-yellow-100 text-yellow-700",
  admin: "bg-risk-high/10 text-risk-high",
};

/**
 * Role-based default permissions (fallback when JWT doesn't include permissions list).
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  user: ["education.view", "education.complete_modules", "tickets.create", "notifications.view_own"],
  cs: ["education.view", "education.complete_modules", "tickets.view", "tickets.comment", "notifications.view_own"],
  analyst: [
    "dashboard.view", "tickets.view", "tickets.assign", "tickets.comment",
    "investigate.view", "investigate.comment", "ml.submit_feedback",
    "education.view", "education.complete_modules", "rules.view", "notifications.view_own",
  ],
  investigator: [
    "dashboard.view", "tickets.view", "tickets.assign", "tickets.comment",
    "investigate.view", "investigate.update_notes", "investigate.update_status",
    "blacklist.view", "blacklist.add", "transactions.view", "transactions.analyze",
    "education.view", "education.complete_modules", "rules.view",
    "ml.submit_feedback", "notifications.view_own",
  ],
  moderator: [
    "dashboard.view", "dashboard.view_team",
    "tickets.view", "tickets.assign", "tickets.comment", "tickets.bulk_update", "tickets.export",
    "investigate.view", "investigate.update_notes", "investigate.update_status", "investigate.generate_notes",
    "blacklist.view", "blacklist.add", "blacklist.remove",
    "rules.view", "rules.create", "rules.update", "rules.deactivate",
    "ml.view_stats", "ml.submit_feedback",
    "transactions.view", "transactions.analyze",
    "education.view", "education.complete_modules",
    "notifications.view_own", "notifications.manage_channels",
  ],
  admin: ["*"],  // wildcard — admin has all permissions
  viewer: [
    "dashboard.view", "tickets.view", "investigate.view",
    "blacklist.view", "rules.view", "ml.view_stats",
    "transactions.view", "education.view",
  ],
};

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  permissions?: string[];
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}
