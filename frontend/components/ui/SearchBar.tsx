import React from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  placeholder?: string;
  loading?: boolean;
  buttonText?: string;
  className?: string;
  inputClassName?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  loading = false,
  buttonText = "Search",
  className,
  inputClassName
}) => {
  return (
    <form onSubmit={onSearch} className={cn("flex flex-col sm:flex-row gap-3", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-secondary/30" />
        <input 
          type="text" 
          placeholder={placeholder} 
          className={cn(
            "w-full pl-11 pr-4 py-3 border-2 border-neutral-border rounded-xl focus:border-primary outline-none transition-all font-medium text-sm text-secondary",
            inputClassName
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} size="md" className="px-8 text-sm h-[48px]">
        {loading ? <Loader2 className="animate-spin size-4" /> : buttonText}
      </Button>
    </form>
  );
};
