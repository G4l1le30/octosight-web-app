/**
 * EvidenceUploader Component
 * Secure file upload to Supabase Storage with live preview.
 * 
 * Features:
 * - Drag-and-drop file upload
 * - File validation (png, jpg, jpeg, pdf)
 * - Real-time preview with Next.js Image component
 * - Loading and error states
 */

"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface EvidenceUploaderProps {
  label?: string;
  accept?: string;
  onUploadSuccess?: (filename: string, previewUrl: string) => void;
  onUploadError?: (error: string) => void;
  onReset?: () => void;
}

interface UploadResponse {
  filename: string;
  preview_url: string;
  message: string;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  label,
  accept,
  onUploadSuccess,
  onUploadError,
  onReset,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((f: File): string | null => {
    const extension = f.name.split(".").pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }

    if (f.size > MAX_FILE_SIZE) {
      return `File size exceeds ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB limit.`;
    }

    return null;
  }, []);

  const handleFileSelect = useCallback((f: File) => {
    const validationError = validateFile(f);

    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    setFile(f);
    setError(null);
    setSuccess(false);

    // Generate local preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(f);
  }, [onUploadError, validateFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/v1/evidence/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data: UploadResponse = await response.json();
      setUploadedFilename(data.filename);
      setPreviewUrl(data.preview_url);
      setSuccess(true);
      onUploadSuccess?.(data.filename, data.preview_url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadedFilename(null);
    setError(null);
    setSuccess(false);
    onReset?.();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl border border-neutral-border shadow-sm">
      <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
        <Upload className="size-6 text-primary" />
        {label ?? "Upload Evidence"}
      </h2>

      {/* File Input / Drag Zone */}
      {!file && !success && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-neutral-border hover:border-primary/50"
          }`}
        >
          <input
            type="file"
            accept={accept ?? ".png,.jpg,.jpeg,.pdf"}
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Upload evidence file"
          />
          <div className="pointer-events-none">
            <Upload className="size-12 text-neutral-border mx-auto mb-3" />
            <p className="text-lg font-bold text-secondary mb-1">
              Drag and drop your file here
            </p>
            <p className="text-sm text-secondary/60">
              or click to browse (PNG, JPG, JPEG, PDF - max 10MB)
            </p>
          </div>
        </div>
      )}

      {/* File Preview */}
      {file && previewUrl && !success && (
        <div className="space-y-4">
          <div className="bg-neutral-page rounded-xl p-4 border border-neutral-border">
            <p className="text-sm font-bold text-secondary/60 mb-3">Preview</p>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-border">
              {file.type.startsWith("image/") ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                  <Upload className="size-12 text-secondary/40" />
                  <p className="text-sm text-secondary/60 font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-secondary/40">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={uploading}
              className="flex-1 py-3 px-4 border border-neutral-border text-secondary font-bold rounded-lg hover:bg-neutral-page transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {success && previewUrl && uploadedFilename && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-800">Upload Successful!</p>
              <p className="text-sm text-green-700 mt-1">
                File: <code className="bg-white px-2 py-1 rounded text-xs">{uploadedFilename}</code>
              </p>
            </div>
          </div>

          <div className="bg-neutral-page rounded-xl p-4 border border-neutral-border">
            <p className="text-sm font-bold text-secondary/60 mb-3">
              Uploaded Image
            </p>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white border border-neutral-border">
              {uploadedFilename.endsWith(".pdf") ? (
                <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                  <Upload className="size-12 text-secondary/40" />
                  <p className="text-sm text-secondary/60 font-medium">
                    PDF Document
                  </p>
                </div>
              ) : (
                <Image
                  src={previewUrl}
                  alt="Uploaded evidence"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
                  priority
                />
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="size-4" />
            Upload Another File
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-risk-high/10 border border-risk-high/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="size-5 text-risk-high mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-risk-high">Upload Error</p>
            <p className="text-sm text-risk-high/80 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
