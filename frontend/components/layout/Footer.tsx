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
    <footer className="relative bg-gradient-to-br from-primary via-primary-dark to-primary-light text-white pt-8 sm:pt-10 lg:pt-12 pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8 mt-auto overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="absolute top-0 right-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Row 1: Description | Navigation | Contact */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12 mb-4 w-full">
          {/* Left: Description (50%) */}
          <div className="w-full lg:w-1/2 text-center xl:text-left xl:pr-8">
            <p className="text-white text-sm md:text-base leading-relaxed lg:max-w-md md:px-16 mx-auto font-medium">
              Empowering users to detect and report phishing threats with AI‑driven analysis and real‑time security intelligence. Our platform blends machine learning and human expertise to monitor and mitigate fraud, keeping digital banking safe.
            </p>
          </div>

          {/* Right side wrapper: Navigation & Contact (50%) */}
          <div className="w-full lg:w-1/2 flex flex-col sm:flex-row justify-center lg:justify-end gap-12 sm:gap-16 lg:gap-24 lg:pr-8">
            {/* Center-Right: Navigation */}
            <div className="text-center lg:text-start min-w-[140px]">
              <h4 className="text-white font-bold mb-3 sm:mb-4 text-xs sm:text-sm tracking-wide uppercase">
                Navigation
              </h4>
              {!isAdminRoute ? (
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <Link href="/" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/report" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                      Report Incident
                    </Link>
                  </li>
                  <li>
                    <Link href="/check" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                      Fraud Check
                    </Link>
                  </li>
                  <li>
                    <Link href="/status" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                      Check Status
                    </Link>
                  </li>
                  <li>
                    <Link href="/edu" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                      E-Learning
                    </Link>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 sm:space-y-3">
                  {can("dashboard.view") && (
                    <li>
                      <Link href="/admin" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                        Dashboard
                      </Link>
                    </li>
                  )}
                  {can("tickets.view") && (
                    <li>
                      <Link href="/admin/triage" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                        Triage
                      </Link>
                    </li>
                  )}
                  {can("blacklist.view") && (
                    <li>
                      <Link href="/admin/blacklist" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                        Blacklist
                      </Link>
                    </li>
                  )}
                  {can("dashboard.view") && (
                    <li>
                      <Link href="/admin/rule-config" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                        Rules
                      </Link>
                    </li>
                  )}
                  {can("transactions.view") && (
                    <li>
                      <Link href="/admin/transactions" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                        Transactions
                      </Link>
                    </li>
                  )}
                  {can("users.view") && (
                    <li>
                      <Link href="/admin/users" className="text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium">
                        Users
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Right: Contact */}
            <div className="text-center lg:text-start min-w-[140px]">
              <h4 className="text-white font-bold mb-3 sm:mb-4 text-xs sm:text-sm tracking-wide uppercase">
                Contact
              </h4>
              <div className="flex flex-col items-center sm:items-start gap-3 sm:gap-4">
                <a
                  href="mailto:octosight.id@gmail.com"
                  className="flex items-center gap-2 sm:gap-3 text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium"
                >
                  <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                    <Mail className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                  </div>
                  <span>octosight.id@gmail.com</span>
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium"
                >
                  <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                    <Instagram className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                  </div>
                  <span>@octosight.id</span>
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 text-white/90 hover:text-white text-xs sm:text-sm transition-colors font-medium"
                >
                  <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                    <Twitter className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                  </div>
                  <span>@octosight.id</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Super big OctoSight text */}
        <div className="text-center my-2 md:my-4 select-none">
          <p className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] xl:text-[12rem] font-bold text-white leading-none tracking-wide">
            OctoSight
          </p>
        </div>

        {/* Row 3: Developed by credit */}
        <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
          <p className="text-white/90 text-xs sm:text-sm font-medium">
            Developed by <span className="text-white font-bold">Capstone B3 Team 4 FILKOM UB</span> for CIMB Niaga Capstone Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
