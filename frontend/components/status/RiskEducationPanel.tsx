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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-secondary">
          Security Recommendations
        </h3>
        <div className="flex items-center gap-1.5 px-0 py-0 bg-transparent">
          <span className="text-sm font-bold text-secondary">
            Powered by Gemini AI
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Warnings */}
        {recommendation.warnings && recommendation.warnings.length > 0 && (
          <div className="bg-white border-2 border-risk-high rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 text-risk-high">
              <AlertCircle className="size-5" />
              <h4 className="font-bold">Risk Warnings</h4>
            </div>
            <ul className="space-y-2">
              {recommendation.warnings.map((warning, idx) => (
                <li
                  key={idx}
                  className="text-sm font-medium text-secondary flex items-start gap-2"
                >
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Actions */}
        {recommendation.suggested_actions &&
          recommendation.suggested_actions.length > 0 && (
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <CheckCircle2 className="size-5" />
                <h4 className="font-bold">Suggested Actions</h4>
              </div>
              <ul className="space-y-2">
                {recommendation.suggested_actions.map((action, idx) => (
                  <li
                    key={idx}
                    className="text-sm font-medium text-secondary flex items-start gap-2"
                  >
                    <span className="mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Tips */}
        {recommendation.tips && recommendation.tips.length > 0 && (
          <div className="bg-white border-2 border-green-600 rounded-2xl p-6 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-green-600">
              <Lightbulb className="size-5" />
              <h4 className="font-bold">Prevention Tips</h4>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendation.tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="text-sm font-medium text-secondary flex items-start gap-2"
                >
                  <span className="mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Relevant Modules */}
      {recommendation.relevant_modules &&
        recommendation.relevant_modules.length > 0 && (
          <div className="bg-neutral-page/30 border border-neutral-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-secondary">
                <BookOpen className="size-5 text-primary" />
                <h4 className="font-bold">Recommended Learning Modules</h4>
              </div>
              <Link
                href="/edu"
                className="text-sm font-bold text-primary hover:underline"
              >
                View all modules
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {recommendation.relevant_modules.map((m: any, idx) => {
                // Handle both legacy (number) and new (object) formats
                const id = typeof m === "object" ? m.id : m;
                const title = typeof m === "object" ? m.title : `Module ${m}`;
                
                return (
                  <Link
                    key={idx}
                    href={`/edu/${id}`}
                    className="px-5 py-2.5 bg-white border border-neutral-border rounded-xl text-sm font-bold text-secondary hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <BookOpen className="size-4" />
                    {title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
};

export default RiskEducationPanel;
