"""
Evidence Upload Endpoint for OctoSight.
Handles secure file uploads to Supabase Storage.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Request, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.supabase_service import get_supabase_service, SupabaseStorageService
from app.core.security import get_current_user, require_admin, limiter
from app.core.virustotal_engine import VirusTotalEngine

router = APIRouter(prefix="/api/v1/evidence", tags=["evidence"])

# Allowed file extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "exe", "zip", "docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class EvidenceUploadResponse(BaseModel):
    """Response schema for file upload."""

    filename: str
    preview_url: str
    message: str
    vt_report: Optional[dict] = None


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/upload", response_model=EvidenceUploadResponse)
@limiter.limit("10/minute")
async def upload_evidence(
    request: Request,
    file: UploadFile = File(...),
    supabase_service=Depends(get_supabase_service),
    current_user=Depends(get_current_user),
) -> EvidenceUploadResponse:
    """
    Upload evidence file to Supabase Storage.

    Args:
        file: Uploaded file from multipart form data.
        supabase_service: Supabase Storage service instance.

    Returns:
        EvidenceUploadResponse: Contains unique filename and temporary signed URL.

    Raises:
        HTTPException: For invalid file type, size, or upload failures.
    """
    # ── Validate file extension ──
    file_extension = get_file_extension(file.filename)
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # ── Read file content ──
    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}",
        )

    # ── Validate file size ──
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {MAX_FILE_SIZE / (1024 * 1024):.0f} MB limit.",
        )

    # ── Generate unique filename (UUID + original extension) ──
    unique_filename = f"{uuid.uuid4()}.{file_extension}"

    # ── VirusTotal Scan (Hash-based) ──
    file_hash = VirusTotalEngine.calculate_sha256(file_content)
    vt_report = await VirusTotalEngine.check_file_hash(file_hash)

    # ── Determine content type ──
    content_type_map = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "pdf": "application/pdf",
        "exe": "application/x-msdownload",
        "zip": "application/zip",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    content_type = content_type_map.get(file_extension, "application/octet-stream")

    # ── Upload file (with retry + fallback) ──
    try:
        supabase_service.upload_file(
            file_bytes=file_content,
            filename=unique_filename,
            content_type=content_type,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed after retries: {str(e)}",
        )

    # ── Generate signed URL for preview (1 hour expiration) ──
    try:
        preview_url = supabase_service.get_signed_url(
            filename=unique_filename,
            expires_in=3600,
        )
    except (RuntimeError, Exception):
        preview_url = f"/uploads/evidence/{unique_filename}"

    return EvidenceUploadResponse(
        filename=unique_filename,
        preview_url=preview_url,
        vt_report=vt_report,
        message="File uploaded and scanned successfully." if vt_report else "File uploaded successfully (Scan skipped).",
    )


@router.get("/signed-url")
async def get_evidence_signed_url(
    filename: str,
    supabase_service=Depends(get_supabase_service),
    current_user=Depends(get_current_user),
):
    """Generate a temporary signed URL for an existing Supabase-stored evidence file."""
    try:
        preview_url = supabase_service.get_signed_url(filename=filename)
    except (RuntimeError, Exception):
        preview_url = f"/uploads/evidence/{filename}"
    return {"preview_url": preview_url}


@router.delete("/{filename}")
async def delete_evidence(
    filename: str,
    supabase_service=Depends(get_supabase_service),
    admin=Depends(require_admin),
):
    """
    Delete evidence file from Supabase Storage. Admin only."""
    try:
        supabase_service.delete_file(filename=filename)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "File deleted successfully."},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deletion failed: {str(e)}",
        )
