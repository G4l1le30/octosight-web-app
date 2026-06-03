"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AnomaliesTable } from "@/components/admin/AnomaliesTable";

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

export default function AnomaliesPage() {
  const [items, setItems] = useState<AnomalyTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchAnomalies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/transactions/anomalies?page=${currentPage}&per_page=${itemsPerPage}`,
      );
      const data = await res.json();
      setItems(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  return (
    <>
      <AdminHeader title="Anomalous Transactions" subtitle="Transactions flagged by the anomaly detection engine" stat={{ label: "Flagged", value: total }} />

      <div className="container mx-auto px-4 pb-6 md:pb-8 space-y-6">
        <div className="card bg-white border border-neutral-border shadow-sm rounded-3xl overflow-hidden">
          <AnomaliesTable
            items={items}
            loading={loading}
            emptyMessage="No anomalies detected."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
          />
        </div>
      </div>
    </>
  );
}
