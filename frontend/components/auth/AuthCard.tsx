"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
  success?: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthCard({
  title,
  subtitle,
  iconBgClass = "bg-primary/10 text-primary",
  success,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 md:py-8 animate-in fade-in zoom-in duration-300">
      <div className="max-w-lg w-full">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="text-left mb-6 md:mb-8">
            <div
              className={cn(
                "w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4",
                iconBgClass
              )}
            >
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">{title}</h1>
            <p className="text-secondary-light text-xs md:text-sm">{subtitle}</p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="bg-risk-low/10 text-risk-low p-2 md:p-3 rounded-md md:rounded-lg text-xs font-bold text-left mb-4 md:mb-6 border border-risk-low/20 animate-in fade-in slide-in-from-top-1 duration-200">
              {success}
            </div>
          )}

          {/* Form Content */}
          {children}

          {/* Footer */}
          <div className="mt-8 text-left">
            <p className="text-xs md:text-sm text-secondary/80">
              {footerText}{" "}
              <Link
                href={footerLinkHref}
                className="font-bold text-primary hover:underline"
              >
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
