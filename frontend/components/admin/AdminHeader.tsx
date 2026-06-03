"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatBox {
  label: string;
  value: string | number;
}

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  stat?: StatBox;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, stat }) => {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">{title}</h1>
          {subtitle && (
            <p className="text-secondary font-medium opacity-80 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {stat && (
          <div className="flex items-center gap-2.5 bg-neutral-page border border-neutral-border rounded-xl px-4 py-2.5">
            <span className="text-xs font-semibold text-secondary/70 uppercase tracking-wide">{stat.label}</span>
            <span className="text-lg font-bold text-secondary">{stat.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
