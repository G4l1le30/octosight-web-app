import React from "react";
import { EducationRecommendation } from "@/types/education";
import { AlertCircle, CheckCircle2, Lightbulb, BookOpen } from "lucide-react";
import Link from "next/link";

interface RiskEducationPanelProps {
  recommendation: EducationRecommendation;
}

export const RiskEducationPanel: React.FC<RiskEducationPanelProps> = ({
  recommendation,
}) => {
  if (!recommendation) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-secondary">Rekomendasi Keamanan</h3>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-sm">
          <div className="size-2 bg-white rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-wider">
            Powered by Gemini AI
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Warnings */}
        {recommendation.warnings && recommendation.warnings.length > 0 && (
          <div className="bg-risk-high/10 border border-risk-high/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-risk-high">
              <AlertCircle className="size-5" />
              <h4 className="font-bold">Peringatan Risiko</h4>
            </div>
            <ul className="space-y-2">
              {recommendation.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm font-medium text-risk-high/90 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Actions */}
        {recommendation.suggested_actions && recommendation.suggested_actions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-blue-700">
              <CheckCircle2 className="size-5" />
              <h4 className="font-bold">Saran Tindakan</h4>
            </div>
            <ul className="space-y-2">
              {recommendation.suggested_actions.map((action, idx) => (
                <li key={idx} className="text-sm font-medium text-blue-800 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        {recommendation.tips && recommendation.tips.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 md:col-span-2">
            <div className="flex items-center gap-2 mb-3 text-green-700">
              <Lightbulb className="size-5" />
              <h4 className="font-bold">Tips Pencegahan</h4>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendation.tips.map((tip, idx) => (
                <li key={idx} className="text-sm font-medium text-green-800 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Relevant Modules */}
      {recommendation.relevant_modules && recommendation.relevant_modules.length > 0 && (
        <div className="bg-neutral-page border border-neutral-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-secondary">
              <BookOpen className="size-5 text-primary" />
              <h4 className="font-bold">Modul Pembelajaran Disarankan</h4>
            </div>
            <Link
              href="/edu"
              className="text-sm font-bold text-primary hover:underline"
            >
              Lihat Semua Modul
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendation.relevant_modules.map((modId) => (
              <Link
                key={modId}
                href={`/edu/${modId}`}
                className="px-4 py-2 bg-white border border-neutral-border rounded-lg text-sm font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                Pelajari Modul {modId}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
