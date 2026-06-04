"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
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
  icon,
  iconBgClass = "bg-primary/10 text-primary",
  success,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8 md:py-12 animate-in fade-in zoom-in duration-300">
      <div className="max-w-lg w-full">
        <div className="p-10">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">{title}</h1>
            <p className="text-secondary-light text-sm">{subtitle}</p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="bg-risk-low/10 text-risk-low p-3 rounded-lg text-xs font-bold text-center mb-6 border border-risk-low/20 animate-in fade-in slide-in-from-top-1 duration-200">
              {success}
            </div>
          )}

          {/* Form Content */}
          {children}

          {/* Footer */}
          <div className="mt-8 text-left">
            <p className="text-sm text-secondary/80">
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
