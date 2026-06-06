"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { usePermissions } from "@/hooks/usePermissions";

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { can } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `relative h-full flex items-center text-base font-bold transition-all duration-200 ${
      isActive
        ? "text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary"
        : "text-secondary/80 hover:text-primary"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-border shadow-sm">
      <div className="container mx-auto px-2 sm:px-3 lg:px-6 h-10 sm:h-12 lg:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
          <Image
            src="/icon.png"
            alt="OctoSight"
            width={28}
            height={28}
            className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7"
          />
          <span className="text-primary text-base sm:text-lg lg:text-2xl font-black tracking-wide">
            OCTOSIGHT
          </span>
          {isAdminRoute && (
            <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 bg-primary text-[10px] sm:text-xs lg:text-sm font-bold text-white rounded">
              ADMIN
            </span>
          )}
        </Link>

        <nav className="hidden lg:flex items-stretch gap-4 lg:gap-6 h-full">
          {isAdminRoute ? (
            <>
              {can("dashboard.view") && (
                <Link href="/admin" className={getLinkClass("/admin")}>
                  Dashboard
                </Link>
              )}
              {can("tickets.view") && (
                <>
                  <Link
                    href="/admin/triage"
                    className={getLinkClass("/admin/triage")}
                  >
                    Triage
                  </Link>
                </>
              )}
              {can("blacklist.view") && (
                <Link
                  href="/admin/blacklist"
                  className={getLinkClass("/admin/blacklist")}
                >
                  Blacklist
                </Link>
              )}
              {can("rules.view") && (
                <Link
                  href="/admin/rule-config"
                  className={getLinkClass("/admin/rule-config")}
                >
                  Rules
                </Link>
              )}
              {can("transactions.view") && (
                <Link
                  href="/admin/transactions"
                  className={getLinkClass("/admin/transactions")}
                >
                  Transactions
                </Link>
              )}
              {can("users.view") && (
                <Link
                  href="/admin/users"
                  className={getLinkClass("/admin/users")}
                >
                  Users
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/" className={getLinkClass("/")}>
                Home
              </Link>
              <Link href="/report" className={getLinkClass("/report")}>
                Report Incident
              </Link>
              <Link href="/check" className={getLinkClass("/check")}>
                Fraud Check
              </Link>
              {user && (
                <Link href="/status" className={getLinkClass("/status")}>
                  Check Status
                </Link>
              )}
              <Link href="/edu" className={getLinkClass("/edu")}>
                E-Learning
              </Link>
              {user && (
                <Link href="/profile" className={getLinkClass("/profile")}>
                  Profile
                </Link>
              )}
            </>
          )}

          <div className="self-center w-px h-3 sm:h-4 bg-neutral-border mx-1 sm:mx-1.5 lg:mx-2"></div>

          {user && !loading ? (
            <div className="self-center flex items-center gap-1 sm:gap-1.5 lg:gap-2">
              <NotificationBell />
              <ProfileDropdown
                user={user}
                logout={logout}
                isAdminRoute={isAdminRoute}
              />
            </div>
          ) : (
            <div className="self-center flex items-center gap-1 sm:gap-1.5 lg:gap-2">
              <Link
                href="/login"
                className="text-[11px] sm:text-xs lg:text-sm font-bold text-secondary hover:text-primary px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-[11px] sm:text-xs lg:text-sm font-bold text-white bg-primary hover:bg-primary-dark px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-1.5 rounded sm:rounded-md lg:rounded-lg transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-secondary p-1 sm:p-1.5 lg:p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 sm:h-4 lg:h-6 w-3.5 sm:w-4 lg:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
            />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-border px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 space-y-1 sm:space-y-1.5 lg:space-y-2 animate-in slide-in-from-top-2 duration-200">
          {isAdminRoute ? (
            <>
              {can("dashboard.view") && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                >
                  Dashboard
                </Link>
              )}
              {can("tickets.view") && (
                <>
                  <Link
                    href="/admin/triage"
                    onClick={() => setMobileOpen(false)}
                    className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                  >
                    Triage
                  </Link>
                  <Link
                    href="/admin/kanban"
                    onClick={() => setMobileOpen(false)}
                    className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                  >
                    Kanban
                  </Link>
                </>
              )}
              {can("blacklist.view") && (
                <Link
                  href="/admin/blacklist"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                >
                  Blacklist
                </Link>
              )}
              {can("rules.view") && (
                <Link
                  href="/admin/rule-config"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                >
                  Rules
                </Link>
              )}
              {can("transactions.view") && (
                <Link
                  href="/admin/transactions"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                >
                  Transactions
                </Link>
              )}
              {can("users.view") && (
                <Link
                  href="/admin/users"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                >
                  Users
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
              >
                Home
              </Link>
              <Link
                href="/report"
                onClick={() => setMobileOpen(false)}
                className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
              >
                Report Incident
              </Link>
              <Link
                href="/check"
                onClick={() => setMobileOpen(false)}
                className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
              >
                Fraud Check
              </Link>
              {user && (
                <Link
                  href="/status"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
                >
                  Check Status
                </Link>
              )}
              <Link
                href="/edu"
                onClick={() => setMobileOpen(false)}
                className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium hover:text-primary"
              >
                E-Learning
              </Link>
            </>
          )}

          <div className="border-t border-neutral-border pt-1.5 sm:pt-2 lg:pt-3 mt-1.5 sm:mt-2 lg:mt-3">
            {user ? (
              <>
                <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2 lg:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] sm:text-xs lg:text-sm font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm lg:text-sm font-bold">{user.full_name}</p>
                      <p className="text-[10px] sm:text-xs text-secondary/60">{user.email}</p>
                    </div>
                  </div>
                  <NotificationBell />
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-sm font-bold text-primary"
                >
                  Profile
                </Link>
                {can("dashboard.view") && (
                  <Link
                    href={isAdminRoute ? "/" : "/admin"}
                    onClick={() => setMobileOpen(false)}
                    className="block py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-sm font-bold text-primary"
                  >
                    {isAdminRoute ? "User Page" : "Admin Dashboard"}
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await logout();
                    setMobileOpen(false);
                    window.location.href = "/";
                  }}
                  className="block w-full text-left py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-sm font-bold text-risk-high"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-1 sm:gap-1.5 lg:gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-sm font-bold border border-neutral-border rounded sm:rounded-md lg:rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-sm font-bold bg-primary text-white rounded sm:rounded-md lg:rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
