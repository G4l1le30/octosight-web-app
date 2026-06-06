"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { User, Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProfileDropdown } from "./ProfileDropdown";
import { usePermissions } from "@/hooks/usePermissions";

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { can } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `relative h-full flex items-center text-base font-bold transition-all duration-200 ${isActive
      ? "text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary"
      : "text-secondary/80 hover:text-primary"
      }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-border shadow-sm">
      <div className="container mx-auto px-2 sm:px-3 lg:px-6 h-12 lg:h-16 flex items-center justify-between">
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

            </>
          )}

          <div className="self-center w-px h-3 sm:h-4 bg-neutral-border mx-1 sm:mx-1.5 lg:mx-2" />

          <div className="flex items-center gap-2">
            {user && !loading && (
              <Link href="/profile" className="flex items-center gap-1 text-secondary hover:text-primary transition-colors">
                <User className="size-5" />
              </Link>
            )}
            {user && !loading && <NotificationBell />}
            {user && !loading ? (
              <ProfileDropdown user={user} logout={logout} isAdminRoute={isAdminRoute} />
            ) : !loading ? (
              <>
                <Link href="/login" className="text-[11px] sm:text-xs lg:text-sm font-bold bg-white text-primary hover:bg-white px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5 transition-colors">Sign In</Link>
                <Link href="/register" className="text-[11px] sm:text-xs lg:text-sm font-bold text-white bg-primary hover:bg-primary-dark px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-1.5 rounded sm:rounded-md lg:rounded-lg transition-all">Register</Link>
              </>
            ) : null}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-secondary p-1 sm:p-1.5 lg:p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {/* Use three-line Menu icon when closed, X when open */}
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-border shadow-lg z-50 px-4 py-4">
            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-bold text-secondary hover:text-primary">Home</Link>
              <Link href="/report" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-bold text-secondary hover:text-primary">Report Incident</Link>
              <Link href="/check" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-bold text-secondary hover:text-primary">Fraud Check</Link>
              <Link href="/edu" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-bold text-secondary hover:text-primary">E-Learning</Link>
              {user && (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-bold text-secondary hover:text-primary">Profile</Link>
                  <Link href="/notifications" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-bold text-secondary hover:text-primary">Notifications</Link>
                  {can("dashboard.view") && (
                    <Link href={isAdminRoute ? "/" : "/admin"} onClick={() => setMobileOpen(false)} className="py-2 text-sm font-bold text-secondary hover:text-primary">
                      {isAdminRoute ? "User Page" : "Admin Dashboard"}
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="border-t border-neutral-border mt-3 pt-3 flex gap-2">
              {user ? (
                <button
                  onClick={async () => { await logout(); setMobileOpen(false); window.location.href = "/"; }}
                  className="flex-1 text-center py-2 text-sm font-bold bg-primary text-white rounded-lg"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-bold bg-white text-primary rounded-lg transition-colors">Sign In</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-bold text-white bg-primary rounded-lg transition-colors">Register</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar;
