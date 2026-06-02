"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Edit2, XCircle, Loader2 } from "lucide-react";

interface RuleConfig {
  id: number;
  config_type: string;
  key: string;
  value: string;
  group: string | null;
  score: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface RulesTableProps {
  rules: RuleConfig[];
  loading?: boolean;
  emptyMessage?: string;
  deactivatingId?: number | null;
  onEdit: (rule: RuleConfig) => void;
  onToggle: (rule: RuleConfig) => void;
  onSort?: (column: string) => void;
  sortBy?: string;
  sortDir?: string;
  className?: string;
}

function formatType(type: string) {
  const map: Record<string, string> = {
    keyword: "Keyword",
    scam_scenario: "Scam Scenario",
    tld: "TLD",
    shortener: "Shortener",
    brand_term: "Brand Term",
  };
  return map[type] || type;
}

export const RulesTable: React.FC<RulesTableProps> = ({
  rules,
  loading = false,
  emptyMessage = "No rules found.",
  deactivatingId = null,
  onEdit,
  onToggle,
  onSort,
  sortBy,
  sortDir,
  className,
}) => {
  if (loading) {
    return (
      <div className="py-20 text-center opacity-40 font-semibold">
        Loading rule configurations...
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead className="bg-neutral-page text-sm font-bold text-secondary border-b border-neutral-border">
          <tr>
            <th className="px-4 md:px-6 py-4 cursor-pointer select-none" onClick={() => onSort?.("config_type")}>
              Type {sortBy === "config_type" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-4 cursor-pointer select-none" onClick={() => onSort?.("key")}>
              Key {sortBy === "key" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-4 cursor-pointer select-none" onClick={() => onSort?.("group")}>
              Group {sortBy === "group" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-4 text-center cursor-pointer select-none" onClick={() => onSort?.("score")}>
              Score {sortBy === "score" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-4">Description</th>
            <th className="px-4 md:px-6 py-4 text-center cursor-pointer select-none" onClick={() => onSort?.("is_active")}>
              Active {sortBy === "is_active" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {rules.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 md:px-6 py-8 md:py-10 text-center opacity-40"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rules.map((rule) => (
              <tr
                key={rule.id}
                className="hover:bg-neutral-page/50 transition-colors group"
              >
                <td className="px-4 md:px-6 py-4 md:py-5">
                  <span className="inline-flex items-center px-2.5 py-1 bg-neutral-page text-xs font-bold text-secondary rounded-lg">
                    {formatType(rule.config_type)}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5">
                  <span className="font-bold text-sm text-secondary break-all">
                    {rule.key}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5">
                  <span className="text-sm font-semibold text-secondary/80">
                    {rule.group || (
                      <span className="text-secondary/60 font-medium">
                        None
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold",
                      rule.score >= 70
                        ? "bg-risk-high/10 text-risk-high"
                        : rule.score >= 40
                          ? "bg-risk-medium/10 text-risk-medium"
                          : "bg-risk-low/10 text-risk-low",
                    )}
                  >
                    {rule.score}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5">
                  <p className="text-sm font-semibold text-secondary/80 max-w-xs break-words">
                    {rule.description || (
                      <span className="text-secondary/60 font-medium">
                        None
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <label
                    className="relative inline-flex items-center cursor-pointer"
                    title={
                      rule.is_active ? "Deactivate rule" : "Reactivate rule"
                    }
                  >
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={rule.is_active}
                      onChange={() => onToggle(rule)}
                      disabled={deactivatingId === rule.id}
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                  </label>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(rule)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-secondary/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      title="Edit rule"
                    >
                      <Edit2 className="size-3.5" />
                      Edit
                    </button>
                    {deactivatingId === rule.id && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
