"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthUser } from "@/types/auth";

interface ProfileDropdownProps {
  user: AuthUser;
  logout: () => Promise<void>;
  isAdminRoute: boolean;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  logout,
  isAdminRoute,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    window.location.href = "/";
  };

  return (
    <div className="self-center relative">
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-neutral-border rounded-lg hover:border-primary/30 transition-all"
      >
        <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-bold text-secondary max-w-[120px] truncate">
          {user.full_name}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3.5 w-3.5 text-secondary/60 transition-transform ${profileOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {profileOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setProfileOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-neutral-border bg-neutral-page">
              <p className="text-sm font-bold text-secondary truncate">
                {user.full_name}
              </p>
              <p className="mt-1 text-xs text-secondary/80 truncate">
                {user.email}
              </p>
              <span
                className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded ${
                  user.role === "admin"
                    ? "bg-primary/10 text-primary"
                    : "bg-neutral-border text-secondary/60"
                }`}
              >
                {user.role.toUpperCase()}
              </span>
            </div>
            {user.role === "admin" && (
              <Link
                href={isAdminRoute ? "/" : "/admin"}
                onClick={() => setProfileOpen(false)}
                className="block px-4 py-2.5 text-sm font-bold text-secondary hover:bg-neutral-page transition-colors"
              >
                {isAdminRoute ? "User Page" : "Admin Dashboard"}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm font-bold text-risk-high hover:bg-risk-high/5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};
