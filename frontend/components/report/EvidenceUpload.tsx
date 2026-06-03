"use client";

/**
 * EvidenceUpload Component
 *
 * Stores the selected file locally in browser memory only.
 * No upload occurs here — upload is deferred to form submission.
 *
 * Modes:
 *  - "screenshot": image files only (PNG, JPG, JPEG). Shows a live preview.
 *  - "attachment": potentially malicious phishing attachments (no images allowed).
 */

import React, { useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Camera, FileCode, AlertTriangle, FileText, Archive, FileImage } from "lucide-react";

// Constants

const ALLOWED_SCREENSHOT_EXTENSIONS = ["png", "jpg", "jpeg"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg"];

// Phishing attachment types — NO images (images go to screenshot uploader)
const ALLOWED_ATTACHMENT_EXTENSIONS = [
  // Documents
  "pdf", "doc", "docx", "docm", "rtf",
  // Archives
  "zip", "rar", "7z",
  // Executables / APKs
  "apk", "exe", "scr", "vbs",
  // Web / Email
  "html", "htm", "eml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Helpers

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

/** Returns a color-coded badge label for attachment file types */
function getAttachmentBadge(ext: string): {
  label: string;
  color: string;
  Icon: React.FC<{ className?: string }>;
} {
  if (["pdf", "doc", "docx", "docm", "rtf"].includes(ext)) {
    return { label: "Document", color: "text-blue-600 bg-blue-50 border-blue-200", Icon: FileText };
  }
  if (["zip", "rar", "7z"].includes(ext)) {
    return { label: "Archive", color: "text-yellow-700 bg-yellow-50 border-yellow-200", Icon: Archive };
  }
  if (["apk", "exe", "scr", "vbs"].includes(ext)) {
    return { label: "Executable", color: "text-risk-high bg-risk-high/10 border-risk-high/30", Icon: FileCode };
  }
  if (["html", "htm", "svg"].includes(ext)) {
    return { label: "Web File", color: "text-purple-600 bg-purple-50 border-purple-200", Icon: FileCode };
  }
  if (["eml"].includes(ext)) {
    return { label: "Email File", color: "text-orange-600 bg-orange-50 border-orange-200", Icon: FileText };
  }
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return { label: "Image", color: "text-green-700 bg-green-50 border-green-200", Icon: FileImage };
  }
  return { label: ext.toUpperCase(), color: "text-secondary bg-neutral-border border-neutral-border", Icon: FileCode };
}

// Props

interface EvidenceUploadProps {
  label: string;
  id?: string;
  accept?: string;
  mode: "screenshot" | "attachment";
  /** Called with the selected File object (or null on reset). No upload happens here. */
  onFileChange: (file: File | null) => void;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  otherSelectedFile?: File | null;
}

// Component

export const EvidenceUpload = ({
  label,
  id = "evidence-upload",
  accept,
  mode,
  onFileChange,
  error,
  errorMessage,
  disabled = false,
  otherSelectedFile,
}: EvidenceUploadProps) => {
  const isScreenshotMode = mode === "screenshot";

  const allowedExtensions = isScreenshotMode
    ? ALLOWED_SCREENSHOT_EXTENSIONS
    : ALLOWED_ATTACHMENT_EXTENSIONS;

  const resolvedAccept =
    accept ||
    (isScreenshotMode
      ? ".png,.jpg,.jpeg"
      : ".pdf,.doc,.docx,.docm,.rtf,.zip,.rar,.7z,.apk,.exe,.scr,.vbs,.html,.htm,.eml");

  // State
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [imageDimensions, setImageDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  // Validation
  const validate = useCallback(
    (f: File): string | null => {
      const ext = getFileExtension(f.name);
      if (!ext || !allowedExtensions.includes(ext)) {
        return `File type not allowed. Supported formats: ${allowedExtensions.join(", ")}`;
      }
      if (f.size > MAX_FILE_SIZE) {
        return `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`;
      }
      if (
        otherSelectedFile &&
        f.name === otherSelectedFile.name &&
        f.size === otherSelectedFile.size
      ) {
        return "This file is already selected in the other upload field.";
      }
      return null;
    },
    [allowedExtensions, otherSelectedFile]
  );

  // Apply selected file
  const applyFile = useCallback(
    (f: File) => {
      const err = validate(f);
      if (err) {
        setValidationError(err);
        return;
      }
      setValidationError(null);
      setFile(f);

      // Revoke previous blob URL to prevent memory leaks
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      const ext = getFileExtension(f.name);
      const isPreviewable = IMAGE_EXTENSIONS.includes(ext);

      if (isPreviewable) {
        const localUrl = URL.createObjectURL(f);
        setPreviewUrl(localUrl);

        // Detect portrait vs landscape safely
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          setImageDimensions(null);
        };
        img.src = localUrl;
      } else {
        setPreviewUrl(null);
        setImageDimensions(null);
      }

      onFileChange(f);
    },
    [validate, onFileChange]
  );

  // Reset
  const handleReset = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);
    setImageDimensions(null);
    setValidationError(null);
    onFileChange(null);
  };

  // Drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  };

  // Derived values
  const ext = file ? getFileExtension(file.name) : "";
  const isImageFile = IMAGE_EXTENSIONS.includes(ext);
  const displayError = validationError || (error ? errorMessage : null);
  const isPortrait =
    imageDimensions && imageDimensions.height > imageDimensions.width;
  const badge = file && !isScreenshotMode ? getAttachmentBadge(ext) : null;
  const fileSizeString = file
    ? file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`
    : "";

  // Render
  return (
    <div className="space-y-3">
      <label className="text-base font-bold text-secondary">{label}</label>
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden native file input */}
        <input
          type="file"
          id={id}
          accept={resolvedAccept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) applyFile(f);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />

        {file ? (
          <div
            className={cn(
              "flex flex-row items-center w-full h-36 md:h-48 border-2 rounded-xl p-3 md:p-4 gap-3 md:gap-4 bg-white transition-all",
              error
                ? "border-risk-high bg-risk-high/5"
                : "border-neutral-border"
            )}
          >
            {/* Left Side: Square Preview Container */}
            <div className="h-full aspect-square rounded-lg overflow-hidden border border-neutral-border bg-neutral-page flex items-center justify-center shrink-0 relative">
              {isImageFile && previewUrl ? (
                <Image
                  src={previewUrl}
                  fill
                  sizes="192px"
                  className="object-cover"
                  alt="preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  {badge ? (
                    <badge.Icon className="size-12 text-secondary/40" />
                  ) : (
                    <FileCode className="size-12 text-secondary/40" />
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Details & Actions */}
            <div className="flex flex-col justify-center h-full flex-1 min-w-0 py-1">
              <div className="space-y-1.5 min-w-0">
                <h4
                  className="text-sm md:text-base font-bold text-secondary truncate"
                  title={file.name}
                >
                  {file.name}
                </h4>
                <p className="text-xs font-semibold text-secondary/60">
                  {fileSizeString}
                </p>

                {/* Badges container */}
                <div className="flex flex-col gap-1">
                  {badge && (
                    <span className="text-xs font-medium text-secondary/60">
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleReset}
                  className="px-4 font-bold text-xs"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <label
            htmlFor={id}
            className={cn(
              "flex flex-col items-center justify-center w-full h-36 md:h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-primary/5 transition-all group overflow-hidden p-3 md:p-4",
              error || validationError
                ? "border-risk-high bg-risk-high/5"
                : isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-neutral-border hover:border-primary",
              disabled && "opacity-60 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="flex flex-col items-center justify-center text-center p-2 gap-2">
              {isScreenshotMode ? (
                <Camera className="w-8 h-8 text-secondary/60 group-hover:text-primary transition-colors" />
              ) : (
                <FileCode className="w-8 h-8 text-secondary/60 group-hover:text-primary transition-colors" />
              )}

              <p className="text-sm font-bold text-secondary">Upload {label}</p>

              <p className="text-[10px] text-secondary/60 max-w-[200px] leading-normal font-semibold">
                {isScreenshotMode
                  ? "PNG, JPG, JPEG (max 10 MB)"
                  : "PDF, DOC, ZIP, APK, & more (max 10 MB)"}
              </p>
            </div>
          </label>
        )}

        {/* Validation / error message */}
        {displayError && (
          <p className="text-xs font-semibold text-risk-high mt-1.5">
            {displayError}
          </p>
        )}
      </div>
    </div>
  );
};
