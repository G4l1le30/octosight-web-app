import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardStats } from "@/types/ticket";

const COLORS = ["#e31e24", "#333333", "#f97316", "#00a651", "#8b5cf6"];

interface ThreatChannelChartProps {
  typeDist: DashboardStats["typeDist"];
}

export const ThreatChannelChart: React.FC<ThreatChannelChartProps> = ({ typeDist }) => {
  return (
    <div className="card p-8">
      <h3 className="font-bold mb-6 text-lg text-secondary">
        Threat Channel Distribution
      </h3>
      <div className="h-64 w-full flex flex-col md:flex-row items-center justify-between">
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
        <div className="w-full md:w-1/2 space-y-4 pl-6">
          {typeDist.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-sm shadow-sm"
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
      </div>
    </div>
  );
};
