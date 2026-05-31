"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface MLStats {
  total_feedback: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  accuracy: number | null;
  model_exists: boolean;
  last_modified: string | null;
}

export default function MLAdminPage() {
  const [stats, setStats] = useState<MLStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/v1/ml/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainResult(null);
    try {
      const res = await fetch("/api/v1/ml/retrain", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Retrain failed");
      setRetrainResult(data);
    } catch (err: any) {
      setRetrainResult({ error: err.message });
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center font-bold opacity-40">Loading ML Dashboard...</div>;
  }

  const confusionMatrix = stats
    ? [
        [stats.tp, stats.fn],
        [stats.fp, stats.tn],
      ]
    : null;

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">ML Admin Dashboard</h1>

        {/* Model Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Model Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-secondary/60">Status</p>
              <p className={cn("text-sm font-bold", stats?.model_exists ? "text-green-600" : "text-red-600")}>
                {stats?.model_exists ? "Loaded" : "Not Found"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-secondary/60">Last Retrain</p>
              <p className="text-sm font-bold text-secondary">
                {stats?.last_modified ? new Date(stats.last_modified).toLocaleDateString() : "Never"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-secondary/60">Total Feedback</p>
              <p className="text-sm font-bold text-secondary">{stats?.total_feedback ?? 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-secondary/60">Accuracy</p>
              <p className="text-sm font-bold text-secondary">
                {stats?.accuracy != null ? `${stats.accuracy}%` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Confusion Matrix */}
        {confusionMatrix && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Confusion Matrix</h2>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-0.5 text-center text-sm">
                <div />
                <div className="font-bold text-secondary/60 pb-2">Predicted Positive</div>
                <div className="font-bold text-secondary/60 pb-2">Predicted Negative</div>
                <div className="font-bold text-secondary/60 pr-4 text-right py-2">Actual Positive</div>
                <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold">{confusionMatrix[0][0]}</div>
                <div className="bg-red-100 text-red-800 p-4 rounded-lg font-bold">{confusionMatrix[0][1]}</div>
                <div className="font-bold text-secondary/60 pr-4 text-right py-2">Actual Negative</div>
                <div className="bg-red-100 text-red-800 p-4 rounded-lg font-bold">{confusionMatrix[1][0]}</div>
                <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold">{confusionMatrix[1][1]}</div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs text-secondary/60">
              <span>TP: {stats?.tp} | FP: {stats?.fp} | FN: {stats?.fn} | TN: {stats?.tn}</span>
            </div>
          </div>
        )}

        {/* Retrain */}
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4">Model Retraining</h2>
          <p className="text-sm text-secondary/60 mb-4">
            Retrain the ML model using accumulated admin feedback (TP/FP/FN/TN labels).
            Requires at least 10 feedback entries.
          </p>
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-5 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {retraining ? "Retraining..." : "Retrain Model"}
          </button>
          {retrainResult && (
            <div className={cn(
              "mt-4 p-4 rounded-xl text-sm",
              retrainResult.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
            )}>
              {retrainResult.error ? (
                <p className="font-bold">{retrainResult.error}</p>
              ) : (
                <div>
                  <p className="font-bold mb-1">Retrain Complete</p>
                  <p>Version: {retrainResult.version}</p>
                  <p>Accuracy: {retrainResult.accuracy}%</p>
                  <p>Samples: {retrainResult.training_samples}</p>
                  {retrainResult.note && <p className="mt-2 italic text-xs opacity-70">{retrainResult.note}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
