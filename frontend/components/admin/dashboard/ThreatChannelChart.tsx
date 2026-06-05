import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useTheme } from "next-themes";
import { RISK } from "@/constants/colors";
import { DashboardStats } from "@/types/ticket";

const COLORS = [RISK.high.hex, "#333333", RISK.medium.hex, RISK.low.hex, "#8b5cf6"];

interface ThreatChannelChartProps {
  typeDist: DashboardStats["typeDist"];
}

export const ThreatChannelChart: React.FC<ThreatChannelChartProps> = ({ typeDist }) => {
  return (
    <div className="card p-6 md:p-8">
      <h3 className="font-bold mb-4 md:mb-6 text-base md:text-lg text-secondary">
        Threat Channel Distribution
      </h3>
      <div className="h-48 md:h-64 w-full flex flex-col md:flex-row items-center justify-between">
        {typeDist.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center opacity-40 font-bold text-xs md:text-sm">
            No channel data available yet.
          </div>
        ) : (
          <>
            <div className="w-full h-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
              >
                {typeDist.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 space-y-3 md:space-y-4 pl-4 md:pl-6">
          {typeDist.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs md:text-sm"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div
                  className="w-2 md:w-3 h-2 md:h-3 rounded-none md:rounded-sm shadow-sm"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></div>
                <span className="font-bold">{item.name}</span>
              </div>
              <span className="font-bold text-secondary">
                {item.value}
              </span>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
};
