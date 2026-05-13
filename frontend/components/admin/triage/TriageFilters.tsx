"use client";

import React from "react";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";

interface FilterState {
  priority: string;
  status: string;
  type: string;
  flag: string;
  startDate: string;
  endDate: string;
}

interface TriageFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableFlags: string[];
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
}

export const TriageFilters: React.FC<TriageFiltersProps> = ({
  filters,
  setFilters,
  availableFlags,
  filteredCount,
  totalCount,
  onReset,
}) => {
  return (
    <div className="card p-6 mb-8 bg-white border-primary/10 border-t-4 shadow-xl overflow-visible">
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-border pb-4">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z"></path>
        </svg>
        <h2 className="font-bold text-sm text-secondary">Advanced Search Filters</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Select 
          label="Priority"
          value={filters.priority}
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
          options={[
            {value: "All", label: "All Priority"},
            {value: "High", label: "High"},
            {value: "Medium", label: "Medium"},
            {value: "Low", label: "Low"}
          ]}
        />

        <Select 
          label="Ticket Status"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          options={[
            {value: "All", label: "All Status"},
            {value: "Submitted", label: "Submitted"},
            {value: "In Review", label: "In Review"},
            {value: "Confirmed", label: "Confirmed"},
            {value: "Mitigated", label: "Mitigated"},
            {value: "Closed", label: "Closed"}
          ]}
        />

        <Select 
          label="Channel"
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
          options={[
            {value: "All", label: "All Channels"},
            {value: "Website", label: "Website"},
            {value: "SMS", label: "SMS"},
            {value: "WhatsApp", label: "WhatsApp"},
            {value: "Email", label: "Email"}
          ]}
        />

        <Select 
          label="Detection Flag"
          value={filters.flag}
          onChange={(e) => setFilters({...filters, flag: e.target.value})}
          options={[
            {value: "All", label: "Any Flag"},
            ...availableFlags.map(f => ({value: f, label: f.replace(/_/g, ' ')}))
          ]}
        />

        <DatePicker 
          label="From Date"
          value={filters.startDate}
          onChange={(val) => setFilters({...filters, startDate: val})}
          placeholder="Start Date"
          triggerClassName="py-2 text-sm"
        />

        <DatePicker 
          label="To Date"
          value={filters.endDate}
          onChange={(val) => setFilters({...filters, endDate: val})}
          placeholder="End Date"
          triggerClassName="py-2 text-sm"
        />
      </div>

      <div className="mt-6 pt-4 border-t border-dashed border-neutral-border flex items-center justify-between">
        <p className="text-sm font-medium opacity-60">
          Found <span className="text-secondary opacity-100">{filteredCount}</span> matching reports out of {totalCount} total
        </p>
        <button 
          onClick={onReset}
          className="text-xs font-bold text-risk-high px-3 py-1 rounded transition-all hover:underline hover:underline-offset-4"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};
