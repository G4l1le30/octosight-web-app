"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface EvidenceUploadProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  error?: boolean;
  errorMessage?: string;
  id: string;
  accept?: string;
  multiple?: boolean;
}

export const EvidenceUpload = ({
  label,
  files,
  onFilesChange,
  error,
  errorMessage,
  id,
  accept,
  multiple,
}: EvidenceUploadProps) => {
  return (
    <div className="space-y-3">
      <label className="text-base font-bold text-secondary">{label}</label>
      <div className="relative">
        <input
          type="file"
          id={id}
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const newFiles = e.target.files ? Array.from(e.target.files) : [];
            onFilesChange(newFiles);
          }}
        />
        <label
          htmlFor={id}
          className={cn(
            "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer hover:bg-primary/5 transition-all group overflow-hidden p-2",
            error
              ? "border-risk-high bg-risk-high/5"
              : "border-neutral-border hover:border-primary",
          )}
        >
          {files.length > 0 ? (
            <div className="relative w-full h-full">
              {files[0].type.startsWith("image/") ? (
                <Image
                  src={URL.createObjectURL(files[0])}
                  className="w-full h-full object-cover rounded-lg"
                  alt="preview"
                  fill
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
                  <span className="text-secondary font-bold text-xs truncate p-4">
                    {files[0].name}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 rounded-lg">
                <span className="text-white font-bold text-sm truncate w-full text-center">
                  {files[0].name}
                </span>
                {files.length > 1 && (
                  <span className="text-white/80 text-xs font-medium mt-1">
                    +{files.length - 1} more files
                  </span>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFilesChange([]);
                  }}
                  className="mt-3 px-4"
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className="w-8 h-8 mb-3 text-secondary/60 group-hover:text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-bold text-secondary">Upload {label}</p>
            </div>
          )}
        </label>
        {error && errorMessage && (
          <p className="text-xs font-semibold text-risk-high mt-1.5">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};
