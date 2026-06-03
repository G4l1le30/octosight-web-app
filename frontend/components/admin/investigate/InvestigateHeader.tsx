import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { usePermissions } from "@/hooks/usePermissions";

interface InvestigateHeaderProps {
  ticketId: string;
  onSave: () => void;
  saving: boolean;
  disabled?: boolean;
}

export const InvestigateHeader: React.FC<InvestigateHeaderProps> = ({
  ticketId,
  onSave,
  saving,
  disabled,
}) => {
  const { can } = usePermissions();
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <div className="flex items-center gap-3 md:gap-4">
        <Link
          href="/admin/triage"
          className="p-1.5 md:p-2 hover:bg-neutral-border rounded-full transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 md:h-6 w-4 md:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary">
          Investigate {ticketId}
        </h1>
      </div>
      <div className="flex gap-2 md:gap-3">
        {can("investigate.update_status") && (
          <Button
            onClick={onSave}
            loading={saving}
            disabled={disabled}
            className="px-6 md:px-8"
          >
            Save Changes
          </Button>
        )}
      </div>
    </div>
  );
};
