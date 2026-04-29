"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RiskScoreCardProps {
  score: number;
  status?: string;
  colorClass?: string;
  className?: string;
}

export const RiskScoreCard = ({
  score: rawScore,
  status,
  colorClass,
  className
}: RiskScoreCardProps) => {
  // Guard against NaN / null / undefined
  const score = typeof rawScore === "number" && !isNaN(rawScore) ? rawScore : 0;

  const getRiskDetails = (score: number) => {
    if (score < 40) return { label: "Low Risk", stroke: "text-green-500", text: "text-green-600", badge: "text-green-700 bg-green-50" };
    if (score < 60) return { label: "Medium Risk", stroke: "text-yellow-500", text: "text-yellow-600", badge: "text-yellow-700 bg-yellow-50" };
    if (score < 80) return { label: "High Risk", stroke: "text-orange-500", text: "text-orange-600", badge: "text-orange-700 bg-orange-50" };
    return { label: "Critical Risk", stroke: "text-risk-high", text: "text-risk-high", badge: "text-risk-high bg-risk-high/10" };
  };

  const riskDetails = getRiskDetails(score);
  const activeLabel = status || riskDetails.label;
  const activeBadgeClass = colorClass || riskDetails.badge;

  return (
    <div className={cn(
      "bg-white rounded-3xl p-8 border-2 border-gray-100 flex flex-col items-center justify-center text-center h-full lg:min-h-[260px]",
      className
    )}>
      <div className="relative size-32 mb-4 md:mb-6">
        {/* Circular Gauge Background */}
        <svg className="size-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-50"
          />
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={364}
            strokeDashoffset={364 - (364 * score) / 100}
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", riskDetails.stroke)}
          />
        </svg>
        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-bold leading-none", riskDetails.text)}>
            {score}
          </span>
          <span className="text-xs md:text-sm font-semibold text-gray-600 mt-1">
            / 100
          </span>
        </div>
      </div>

      <p className="text-sm md:text-base font-semibold text-secondary mb-2 md:mb-4">
        Initial Risk Estimate
      </p>
      <span className={cn(
        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase",
        activeBadgeClass
      )}>
        {activeLabel}
      </span>
    </div>
  );
};
