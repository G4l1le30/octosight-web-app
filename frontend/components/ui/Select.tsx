import React from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  className,
  label,
  error,
  options,
  placeholder,
  ...props
}) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-sm font-bold text-secondary block">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={cn(
            "w-full bg-white border-2 border-neutral-border rounded-lg outline-none transition-all font-medium placeholder:text-secondary/30",
            "focus:border-primary focus:ring-4 focus:ring-primary/5",
            "appearance-none pr-10 pl-4 py-2 text-sm",
            error ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5" : "border-neutral-border",
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            backgroundSize: '1rem'
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-xs font-bold text-risk-high mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};
