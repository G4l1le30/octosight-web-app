"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
}

export const DatePicker = ({
  label,
  value,
  onChange,
  error,
  className,
  triggerClassName,
  placeholder = "Select date and time...",
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom");
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to validate date
  const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

  // Derive the selected date from value prop
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isValidDate(d) ? d : null;
  }, [value]);

  // viewDate controls what month/year the calendar shows.
  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate || new Date();
    return isValidDate(d) ? d : new Date();
  });

  // Local state for smooth time editing
  const [tempHours, setTempHours] = useState("");
  const [tempMinutes, setTempMinutes] = useState("");

  // Sync temp time state ONLY when the picker opens
  useEffect(() => {
    if (isOpen) {
      const d = selectedDate || new Date();
      setTempHours(d.getHours().toString().padStart(2, "0"));
      setTempMinutes(d.getMinutes().toString().padStart(2, "0"));
      if (selectedDate) {
        setViewDate(selectedDate);
      }
    }
  }, [isOpen]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Dynamic Positioning Logic
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownPosition(spaceBelow < 350 ? "top" : "bottom");
    }
  }, [isOpen]);

  // Click outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    const now = new Date();
    if (nextMonth.getFullYear() > now.getFullYear() ||
      (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() > now.getMonth())) {
      return;
    }
    setViewDate(nextMonth);
  };

  const isFutureDate = (year: number, month: number, day: number) => {
    const target = new Date(year, month, day);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return target > now;
  };

  const updateParent = (targetDate: Date) => {
    const now = new Date();
    // Cap at current time
    const cappedDate = targetDate > now ? now : targetDate;

    if (isValidDate(cappedDate)) {
      const offset = cappedDate.getTimezoneOffset();
      const localDate = new Date(cappedDate.getTime() - (offset * 60 * 1000));
      onChange(localDate.toISOString().slice(0, 16));
    }
  };

  const updateDate = (day: number) => {
    const targetDate = selectedDate ? new Date(selectedDate) : new Date();
    targetDate.setFullYear(viewDate.getFullYear());
    targetDate.setMonth(viewDate.getMonth());
    targetDate.setDate(day);
    updateParent(targetDate);
  };

  const handleTimeChange = (type: "h" | "m", val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 2);
    if (type === "h") setTempHours(cleaned);
    else setTempMinutes(cleaned);

    const num = parseInt(cleaned);
    if (!isNaN(num)) {
      const targetDate = selectedDate ? new Date(selectedDate) : new Date();
      if (type === "h") targetDate.setHours(Math.min(23, num));
      else targetDate.setMinutes(Math.min(59, num));
      updateParent(targetDate);
    }
  };

  const handleTimeBlur = (type: "h" | "m") => {
    if (type === "h") {
      const h = Math.min(23, parseInt(tempHours) || (selectedDate?.getHours() ?? 0));
      setTempHours(h.toString().padStart(2, "0"));
    } else {
      const m = Math.min(59, parseInt(tempMinutes) || (selectedDate?.getMinutes() ?? 0));
      setTempMinutes(m.toString().padStart(2, "0"));
    }
  };

  const formatDisplayDate = (val: string) => {
    if (!val) return placeholder;
    const d = new Date(val);
    if (!isValidDate(d)) return placeholder;

    return d.toLocaleString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderDays = () => {
    const days = [];
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = startDayOfMonth(year, month);

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="p-1.5" />);
    }

    const now = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const isFuture = isFutureDate(year, month, day);
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      const isToday = now.getDate() === day &&
        now.getMonth() === month &&
        now.getFullYear() === year;

      days.push(
        <button
          key={`${year}-${month}-${day}`}
          type="button"
          disabled={isFuture}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateDate(day);
          }}
          className={cn(
            "p-1.5 text-xs rounded-lg transition-all font-bold relative",
            isSelected ? "bg-primary text-white shadow-md" : "text-secondary hover:bg-neutral-page",
            isToday && !isSelected && "text-primary border border-primary/20",
            isFuture && "opacity-25 cursor-not-allowed hover:bg-transparent"
          )}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const isViewingCurrentMonth = useMemo(() => {
    const now = new Date();
    return viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth();
  }, [viewDate]);

  return (
    <div className={cn("w-full relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold text-secondary mb-2">
          {label}
        </label>
      )}

      {/* Trigger Area */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => e.key === "Enter" && setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white border-2 border-neutral-border rounded-lg px-4 py-4 text-left transition-all cursor-pointer flex items-center justify-between",
          triggerClassName,
          isOpen && "border-primary ring-4 ring-primary/5 shadow-sm",
          error && "border-risk-high",
          !value ? "text-secondary/40 font-medium" : "text-secondary font-medium"
        )}
      >
        <span className="truncate text-base">{formatDisplayDate(value)}</span>
        <CalendarIcon className="size-5 text-secondary/40 shrink-0" />
      </div>

      {/* Popover Panel */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute z-100 w-72 bg-white rounded-2xl shadow-2xl border border-neutral-border overflow-hidden animate-in fade-in zoom-in duration-200",
            dropdownPosition === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
          )}
        >
          {/* Header */}
          <div className="p-3 border-b border-neutral-border flex items-center justify-between bg-neutral-page">
            <h4 className="font-bold text-secondary text-sm">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h4>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                <ChevronLeft className="size-4 text-secondary" />
              </button>
              <button
                type="button"
                disabled={isViewingCurrentMonth}
                onClick={handleNextMonth}
                className={cn(
                  "p-1 transition-all rounded-lg",
                  isViewingCurrentMonth ? "opacity-20 cursor-not-allowed" : "hover:bg-white hover:shadow-sm"
                )}
              >
                <ChevronRight className="size-4 text-secondary" />
              </button>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-[10px] uppercase tracking-wider font-extrabold text-secondary/40 text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderDays()}
            </div>
          </div>

          {/* Footer - Time Picker */}
          <div className="p-3 bg-neutral-page border-t border-neutral-border">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-secondary/40" />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempHours}
                  onChange={(e) => handleTimeChange("h", e.target.value)}
                  onBlur={() => handleTimeBlur("h")}
                  placeholder="HH"
                  className="w-14 bg-white border border-neutral-border rounded-lg p-1.5 text-center font-bold text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <span className="font-bold text-secondary/40">:</span>
                <input
                  type="text"
                  value={tempMinutes}
                  onChange={(e) => handleTimeChange("m", e.target.value)}
                  onBlur={() => handleTimeBlur("m")}
                  placeholder="MM"
                  className="w-14 bg-white border border-neutral-border rounded-lg p-1.5 text-center font-bold text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  updateParent(now);
                }}
                className="ml-auto text-xs font-bold text-primary hover:underline px-2"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <span className="text-sm text-risk-high font-bold mt-1 animate-in fade-in slide-in-from-top-1 duration-200 block">
          {error}
        </span>
      )}
    </div>
  );
};
