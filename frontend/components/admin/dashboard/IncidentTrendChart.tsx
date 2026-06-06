import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardStats } from "@/types/ticket";
import { RISK } from "@/constants/colors";

export type TimeRange = "7d" | "1m" | "6m";

interface IncidentTrendChartProps {
  trendData: DashboardStats["trendData"];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "Last 7 Days",
  "1m": "Last Month",
  "6m": "Last 6 Months",
};

export const IncidentTrendChart: React.FC<IncidentTrendChartProps> = ({
  trendData,
  timeRange,
  onTimeRangeChange,
}) => {
  return (
    <div className="card p-6 md:p-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="font-bold text-base md:text-lg text-secondary">
          Incident Volume
        </h3>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className="text-xs font-bold border border-neutral-border rounded-md md:rounded-lg px-2 md:px-3 py-1 md:py-1.5 outline-none focus:border-primary bg-white text-secondary cursor-pointer"
        >
          {(Object.entries(TIME_RANGE_LABELS) as [TimeRange, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      <div className="h-48 md:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#eee"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: "bold" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: "bold" }}
            />
            <Tooltip
              cursor={{ stroke: RISK.high.hex, strokeWidth: 1, strokeDasharray: "4 4" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="incidents"
              stroke={RISK.high.hex}
              strokeWidth={2.5}
              dot={{ r: 4, fill: RISK.high.hex, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
