import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push("...");
      }
    }
    return Array.from(new Set(pages));
  };

  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-neutral-border",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <span className="text-sm text-secondary/60 font-medium">
          Showing <span className="text-secondary font-bold">{startItem}-{endItem}</span> of <span className="text-secondary font-bold">{totalItems}</span> reports
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-secondary/40 uppercase tracking-wider">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="text-sm font-bold bg-neutral-page border border-neutral-border rounded-lg px-2 py-1 outline-none focus:border-primary transition-all cursor-pointer"
          >
            {[10, 20, 50].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-neutral-border hover:bg-neutral-page disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={cn(
              "min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all border",
              page === currentPage
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : page === "..."
                ? "border-transparent cursor-default"
                : "border-neutral-border hover:bg-neutral-page text-secondary"
            )}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-neutral-border hover:bg-neutral-page disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
