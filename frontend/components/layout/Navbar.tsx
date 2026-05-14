"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { ProfileDropdown } from "./ProfileDropdown";

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary text-2xl font-black tracking-tight">
            OCTOSIGHT
          </span>
          {isAdminRoute && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-sm font-bold text-white rounded uppercase">
              ADMIN
            </span>
          )}
        </Link>

        <nav className="hidden lg:flex items-stretch gap-6 h-full">
          {isAdminRoute ? (
            <>
              <Link href="/" className={getLinkClass("/")}>
                Home
              </Link>
              <Link href="/admin" className={getLinkClass("/admin")}>
                Dashboard
              </Link>
              <Link
                href="/admin/triage"
                className={getLinkClass("/admin/triage")}
              >
                Triage
              </Link>
              <Link
                href="/admin/blacklist"
                className={getLinkClass("/admin/blacklist")}
              >
                Blacklist
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={getLinkClass("/")}>
                Home
              </Link>
              <Link href="/report" className={getLinkClass("/report")}>
                Report Incident
              </Link>
              <Link href="/status" className={getLinkClass("/status")}>
                Check Status
              </Link>
              <Link href="/edu" className={getLinkClass("/edu")}>
                E-Learning
              </Link>
            </>
          )}

          <div className="self-center w-px h-4 bg-neutral-border mx-2"></div>

          {loading ? (
            <div className="w-20 h-8 bg-neutral-page rounded-lg animate-pulse"></div>
          ) : user ? (
            <ProfileDropdown 
              user={user} 
              logout={logout} 
              isAdminRoute={isAdminRoute} 
            />
          ) : (
            <div className="self-center flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-bold text-secondary hover:text-primary px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-1.5 rounded-lg transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-secondary p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
        <div className="lg:hidden bg-white border-t border-neutral-border px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {isAdminRoute ? (
            <>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                Home
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/triage"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                Triage
              </Link>
              <Link
                href="/admin/blacklist"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                Blacklist
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                Home
              </Link>
              <Link
                href="/report"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                Report Incident
              </Link>
              <Link
                href="/status"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                Check Status
              </Link>
              <Link
                href="/edu"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium hover:text-primary"
              >
                E-Learning
              </Link>
            </>
          )}

          <div className="border-t border-neutral-border pt-3 mt-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.full_name}</p>
                    <p className="text-xs text-secondary/60">{user.email}</p>
                  </div>
                </div>
                {user.role === "admin" && (
                  <Link
                    href={isAdminRoute ? "/" : "/admin"}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm font-bold text-primary"
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
                  className="block w-full text-left py-2 text-sm font-bold text-risk-high"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-bold border border-neutral-border rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-bold bg-primary text-white rounded-lg"
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
