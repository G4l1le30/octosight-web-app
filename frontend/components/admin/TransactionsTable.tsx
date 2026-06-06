"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface Transaction {
  id: number;
  reference_number: string;
  sender_name: string;
  sender_account: string | null;
  sender_bank: string | null;
  receiver_account: string | null;
  receiver_bank: string | null;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  merchant_name: string | null;
  location: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  anomaly_score: number;
  transaction_date: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (column: string) => void;
  sortBy?: string;
  sortDir?: string;
  className?: string;
}

function amountStr(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    FLAGGED: "bg-red-50 text-red-700 border-red-200",
    REVERSED: "bg-gray-100 text-secondary border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-block px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold rounded-full border",
        colors[status] || "bg-gray-50 text-secondary border-gray-200",
      )}
    >
      {status}
    </span>
  );
}

function typeBadge(type: string) {
  const colors: Record<string, string> = {
    CREDIT: "bg-green-50 text-green-700 border-green-200",
    DEBIT: "bg-blue-50 text-blue-700 border-blue-200",
    TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={cn(
        "inline-block px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold rounded-full border",
        colors[type] || "bg-gray-50 text-secondary border-gray-200",
      )}
    >
      {type}
    </span>
  );
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading = false,
  emptyMessage = "No transactions found.",
  onSort,
  sortBy,
  sortDir,
  className,
}) => {
  if (loading) {
    return (
      <div className="py-14 md:py-20 text-center opacity-40 font-semibold">
        Loading transactions...
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead className="bg-neutral-page text-xs md:text-sm font-bold text-secondary border-b border-neutral-border">
          <tr>
            <th
              className="px-4 md:px-6 py-3 md:py-4 cursor-pointer select-none"
              onClick={() => onSort?.("reference_number")}
            >
              Reference{" "}
              {sortBy === "reference_number" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4">Sender</th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center">Type</th>
            <th
              className="px-4 md:px-6 py-3 md:py-4 text-center cursor-pointer select-none"
              onClick={() => onSort?.("amount")}
            >
              Amount {sortBy === "amount" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center">Status</th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center">Merchant</th>
            <th
              className="px-4 md:px-6 py-3 md:py-4 text-center cursor-pointer select-none"
              onClick={() => onSort?.("transaction_date")}
            >
              Date{" "}
              {sortBy === "transaction_date" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center">Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {transactions.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 md:px-6 py-8 md:py-10 text-center opacity-40"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-neutral-page/50 transition-colors group"
              >
                <td className="px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-semibold text-secondary text-left">
                  {tx.reference_number}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-left">
                  <div className="font-semibold text-xs md:text-sm text-secondary">{tx.sender_name}</div>
                  {tx.sender_account && (
                    <div className="text-xs font-medium text-secondary/80">
                      {tx.sender_bank} • {tx.sender_account}
                    </div>
                  )}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  {typeBadge(tx.transaction_type)}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm text-center font-semibold tabular-nums text-secondary">
                  {amountStr(tx.amount)}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  {statusBadge(tx.status)}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center text-xs md:text-sm font-semibold text-secondary/80">
                  {tx.merchant_name || (
                    <span className="text-secondary/60 font-medium">None</span>
                  )}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center text-xs md:text-sm font-semibold text-secondary/80">
                  {formatDateTime(tx.transaction_date).full}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  {tx.is_flagged ? (
                    <div
                      className="inline-flex items-center gap-0.5 md:gap-1 text-risk-high"
                      title={tx.flag_reason || ""}
                    >
                      <AlertTriangle size={14} />
                      <span className="text-xs font-bold">
                        {tx.anomaly_score.toFixed(0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-secondary/60 text-xs">None</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
