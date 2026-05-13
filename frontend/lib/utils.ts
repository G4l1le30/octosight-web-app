import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string from the backend into a local date and time.
 * Automatically appends 'Z' if missing to ensure the string is treated as UTC.
 */
export function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return { date: "-", time: "-", full: "-" };

  try {
    // If the string doesn't have a timezone indicator, assume it's UTC
    // Backend (FastAPI/MySQL) often sends ISO strings without 'Z'
    const hasTimezone = dateStr.includes("Z") || dateStr.includes("+") || (dateStr.includes("-") && dateStr.length > 10 && dateStr.indexOf("-", 10) > 0);
    const normalizedDate = hasTimezone ? dateStr : `${dateStr.replace(" ", "T")}Z`;

    const date = new Date(normalizedDate);

    // Check if valid date
    if (isNaN(date.getTime())) return { date: "-", time: "-", full: "-" };

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const datePart = date.toLocaleDateString("en-US", dateOptions);
    const timePart = date.toLocaleTimeString("en-US", timeOptions);

    return {
      date: datePart,
      time: timePart,
      full: `${datePart} • ${timePart}`,
    };
  } catch (error) {
    console.error("Error formatting date:", error);
    return { date: "-", time: "-", full: "-" };
  }
}
