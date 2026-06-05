"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { Mail, Instagram, Twitter } from "lucide-react";

const Footer: React.FC = () => {
  const pathname = usePathname();
  const { can } = usePermissions();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <footer className="relative bg-gradient-to-br from-primary via-primary-dark to-primary-light text-white pt-12 sm:pt-16 lg:pt-24 pb-8 sm:pb-12 lg:pb-16 px-2 sm:px-4 lg:px-6 mt-auto overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 text-center sm:text-left">
            <Link
              href="/"
              className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-wide hover:opacity-80 transition-opacity mb-2 sm:mb-3 lg:mb-4 block"
            >
              OCTOSIGHT
            </Link>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 lg:mb-8 max-w-sm mx-auto sm:mx-0 font-medium">
              Empowering users to detect and report phishing threats with
              advanced AI-driven analysis and real-time security intelligence.
            </p>
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs font-bold text-white block tracking-wide">
                Developed by
              </span>
              <div className="text-white text-xs sm:text-sm lg:text-base font-bold">
                Team CyberSentinel (Universitas Brawijaya)
              </div>
              <div className="text-white/70 text-[10px] sm:text-xs lg:text-sm font-medium">
                for CIMB Niaga Capstone Project
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-3 sm:mb-4 lg:mb-6 text-xs sm:text-sm tracking-wide">
              Navigation
            </h4>
            {!isAdminRoute ? (
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
                <li>
                  <Link href="/" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/report" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                    Report Incident
                  </Link>
                </li>
                <li>
                  <Link href="/check" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                    Fraud Check
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                    Check Status
                  </Link>
                </li>
                <li>
                  <Link href="/edu" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                    E-Learning
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
                {can("dashboard.view") && (
                  <li>
                    <Link href="/admin" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                      Dashboard
                    </Link>
                  </li>
                )}
                {can("tickets.view") && (
                  <li>
                    <Link href="/admin/triage" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                      Triage
                    </Link>
                  </li>
                )}
                {can("blacklist.view") && (
                  <li>
                    <Link href="/admin/blacklist" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                      Blacklist
                    </Link>
                  </li>
                )}
                {can("dashboard.view") && (
                  <li>
                    <Link href="/admin/rule-config" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                      Rules
                    </Link>
                  </li>
                )}
                {can("transactions.view") && (
                  <li>
                    <Link href="/admin/transactions" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                      Transactions
                    </Link>
                  </li>
                )}
                {can("users.view") && (
                  <li>
                    <Link href="/admin/users" className="text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium">
                      Users
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Contact & Social */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-3 sm:mb-4 lg:mb-6 text-xs sm:text-sm tracking-wide">
              Contact
            </h4>
            <div className="flex flex-col items-center sm:items-start gap-3 sm:gap-4 lg:gap-5">
              <a
                href="mailto:octosight.id@gmail.com"
                className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium"
              >
                <div className="w-5 sm:w-7 lg:w-9 h-5 sm:h-7 lg:h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Mail className="h-2 sm:h-3 lg:h-4 w-2 sm:w-3 lg:w-4" />
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm">octosight.id@gmail.com</span>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium"
              >
                <div className="w-5 sm:w-7 lg:w-9 h-5 sm:h-7 lg:h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Instagram className="h-2 sm:h-3 lg:h-4 w-2 sm:w-3 lg:w-4" />
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm">@octosight.id</span>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-white hover:opacity-80 text-xs sm:text-sm transition-colors font-medium"
              >
                <div className="w-5 sm:w-7 lg:w-9 h-5 sm:h-7 lg:h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Twitter className="h-2 sm:h-3 lg:h-4 w-2 sm:w-3 lg:w-4" />
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm">@octosight.id</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
