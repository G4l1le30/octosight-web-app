"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { getRiskLevel, RISK } from "@/constants/colors";

interface AnomalyTransaction {
  id: number;
  reference_number: string;
  sender_name: string;
  sender_account: string | null;
  receiver_account: string | null;
  receiver_bank: string | null;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  merchant_name: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  anomaly_score: number;
  transaction_date: string;
}

interface AnomaliesTableProps {
  items: AnomalyTransaction[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function amountStr(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export const AnomaliesTable: React.FC<AnomaliesTableProps> = ({
  items,
  loading = false,
  emptyMessage = "No anomalies detected.",
  className,
}) => {
  if (loading) {
    return (
      <div className="py-20 text-center opacity-40 font-semibold">
        Loading anomalies...
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead className="bg-neutral-page text-sm font-bold text-secondary border-b border-neutral-border">
          <tr>
            <th className="px-4 md:px-6 py-4">Reference</th>
            <th className="px-4 md:px-6 py-4">Sender</th>
            <th className="px-4 md:px-6 py-4 text-center">Amount</th>
            <th className="px-4 md:px-6 py-4 text-center">Score</th>
            <th className="px-4 md:px-6 py-4 text-center">Reason</th>
            <th className="px-4 md:px-6 py-4 text-center">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 md:px-6 py-8 md:py-10 text-center text-secondary/60"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((tx) => {
              const riskLevel = getRiskLevel(tx.anomaly_score);
              const riskColor = RISK[riskLevel];
              return (
                <tr
                  key={tx.id}
                  className="hover:bg-neutral-page/50 transition-colors group"
                >
                  <td className="px-4 md:px-6 py-4 md:py-5 text-xs text-secondary text-left">
                    {tx.reference_number}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-left">
                    <div className="font-medium text-sm">{tx.sender_name}</div>
                    {tx.sender_account && (
                      <div className="text-xs text-secondary/60">
                        {tx.sender_account}
                      </div>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-sm text-center font-medium tabular-nums">
                    {amountStr(tx.amount)}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg"
                      style={{
                        backgroundColor: riskColor.hex + "20",
                        color: riskColor.hex,
                      }}
                    >
                      <AlertTriangle size={12} />
                      {tx.anomaly_score.toFixed(0)}
                    </span>
                  </td>
                  <td
                    className="px-4 md:px-6 py-4 md:py-5 text-center text-xs text-secondary/70 max-w-xs truncate"
                    title={tx.flag_reason || ""}
                  >
                    {tx.flag_reason || (
                      <span className="text-secondary/40">None</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-center text-xs text-secondary/70">
                    {formatDateTime(tx.transaction_date).full}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
