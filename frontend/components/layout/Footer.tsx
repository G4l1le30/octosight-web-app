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
    <footer className="relative bg-gradient-to-br from-primary via-primary-dark to-primary-light text-white pt-24 pb-16 px-4 md:px-6 mt-auto overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-72 md:w-96 h-72 md:h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 md:w-96 h-72 md:h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 text-center sm:text-left">
            <Link
              href="/"
              className="text-2xl md:text-3xl font-black text-white tracking-wide hover:opacity-80 transition-opacity mb-4 block"
            >
              OCTOSIGHT
            </Link>
            <p className="text-white/80 text-sm leading-relaxed mb-6 md:mb-8 max-w-sm mx-auto sm:mx-0 font-medium">
              Empowering users to detect and report phishing threats with
              advanced AI-driven analysis and real-time security intelligence.
            </p>
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block tracking-wide">
                Developed by
              </span>
              <div className="text-white text-base font-bold">
                Team CyberSentinel (Universitas Brawijaya)
              </div>
              <div className="text-white/80 text-sm font-medium">
                for CIMB Niaga Capstone Project
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-6 text-sm tracking-wide">
              Navigation
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  Home
                </Link>
              </li>
              {!isAdminRoute ? (
                <>
                  <li>
                    <Link
                      href="/report"
                      className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                    >
                      Report Incident
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/check"
                      className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                    >
                      Fraud Check
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/status"
                      className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                    >
                      Check Status
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/edu"
                      className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                    >
                      E-Learning
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  {can("dashboard.view") && (
                    <li>
                      <Link
                        href="/admin"
                        className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                      >
                        Dashboard
                      </Link>
                    </li>
                  )}
                  {can("tickets.view") && (
                    <li>
                      <Link
                        href="/admin/triage"
                        className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                      >
                        Triage
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>

          {/* Links (admin extra + legal) */}
          <div className="text-center sm:text-left">
            {isAdminRoute && <h4 className="text-white font-bold mb-6 text-sm tracking-wide">Links</h4>}
            <ul className="space-y-4">
              {isAdminRoute ? (
                <>
                  {can("blacklist.view") && (
                    <li>
                      <Link href="/admin/blacklist" className="text-white hover:opacity-80 text-sm transition-colors font-medium">Blacklist</Link>
                    </li>
                  )}
                  {can("rules.view") && (
                    <li>
                      <Link href="/admin/rule-config" className="text-white hover:opacity-80 text-sm transition-colors font-medium">Rules</Link>
                    </li>
                  )}
                  {can("transactions.view") && (
                    <li>
                      <Link href="/admin/transactions" className="text-white hover:opacity-80 text-sm transition-colors font-medium">Transactions</Link>
                    </li>
                  )}
                  {can("users.view") && (
                    <li>
                      <Link href="/admin/users" className="text-white hover:opacity-80 text-sm transition-colors font-medium">Users</Link>
                    </li>
                  )}
                </>
              ) : null}
              <li>
                <Link href="#" className="text-white hover:opacity-80 text-sm transition-colors font-medium">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white hover:opacity-80 text-sm transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white hover:opacity-80 text-sm transition-colors font-medium">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-6 text-sm tracking-wide">
              Contact
            </h4>
            <div className="flex flex-col items-center sm:items-start gap-4 md:gap-5">
              <a
                href="mailto:octosight.id@gmail.com"
                className="flex items-center gap-2 md:gap-3 text-white hover:opacity-80 text-sm transition-colors font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Mail className="h-4 w-4" />
                </div>
                octosight.id@gmail.com
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 md:gap-3 text-white hover:opacity-80 text-sm transition-colors font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Instagram className="h-4 w-4" />
                </div>
                @octosight.id
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 md:gap-3 text-white hover:opacity-80 text-sm transition-colors font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Twitter className="h-4 w-4" />
                </div>
                @octosight.id
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
