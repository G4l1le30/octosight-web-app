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
  className,
}: RiskScoreCardProps) => {
  // Guard against NaN / null / undefined
  const score = typeof rawScore === "number" && !isNaN(rawScore) ? Math.round(rawScore) : 0;

  const getRiskDetails = (score: number) => {
    if (score < 40)
      return {
        label: "Low Risk",
        stroke: "text-risk-low",
        text: "text-risk-low",
        badge: "text-risk-low bg-risk-low/10",
      };
    if (score < 70)
      return {
        label: "Medium Risk",
        stroke: "text-risk-medium",
        text: "text-risk-medium",
        badge: "text-risk-medium bg-risk-medium/10",
      };
    return {
      label: "High Risk",
      stroke: "text-risk-high",
      text: "text-risk-high",
      badge: "text-risk-high bg-risk-high/10",
    };
  };

  const riskDetails = getRiskDetails(score);
  const activeLabel = status || riskDetails.label;
  const activeBadgeClass = colorClass || riskDetails.badge;

  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-6 border-2 border-gray-100 flex items-center justify-center h-full gap-8",
        className,
      )}
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
        {/* Circular Gauge Background */}
        <svg className="size-full transform -rotate-90" viewBox="0 0 128 128">
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
            className={cn(
              "transition-all duration-1000 ease-out",
              riskDetails.stroke,
            )}
          />
        </svg>
        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn("text-3xl font-bold leading-none", riskDetails.text)}
          >
            {score}
          </span>
          <span className="text-xs md:text-sm font-semibold text-gray-600 mt-1">
            / 100
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start text-left">
        <p className="text-sm font-semibold text-secondary mb-2">
          Initial Risk Estimate
        </p>
        <span
          className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap",
            activeBadgeClass,
          )}
        >
          {activeLabel}
        </span>
      </div>
    </div>
  );
};
