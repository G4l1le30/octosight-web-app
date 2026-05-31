import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardStats } from "@/types/ticket";
import { RISK } from "@/constants/colors";

interface SecurityFlagAnalysisProps {
  flagDist: DashboardStats["flagDist"];
}

export const SecurityFlagAnalysis: React.FC<SecurityFlagAnalysisProps> = ({
  flagDist,
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayFlags = showAll ? flagDist : flagDist.slice(0, 8);
  const maxVal = Math.max(...displayFlags.map((f) => f.value), 1);

  return (
    <div className="card p-6 md:p-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="font-bold text-base md:text-lg text-secondary">
          Security Flag Analysis (Sub-Categories)
        </h3>
        {flagDist.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1 rounded-lg transition-colors"
          >
            {showAll ? "Show Less" : `Show All (${flagDist.length})`}
          </button>
        )}
      </div>

      {displayFlags.length > 0 ? (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayFlags}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#eee"
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: "bold" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: "bold" }}
                width={140}
              />
              <Tooltip
                cursor={{ fill: "#f9fafb" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar
                dataKey="value"
                fill={RISK.medium.hex}
                radius={[0, 6, 6, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-8 text-center opacity-40 font-semibold text-sm">
          No detection flags triggered yet.
        </div>
      )}
    </div>
  );
};
