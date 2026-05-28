"""
Supabase Storage Service for OctoSight.
Handles secure file uploads and generation of signed URLs for the "octosight-evidence" bucket.
"""

import os
from typing import Optional
from supabase import create_client, Client
from fastapi import HTTPException, status


class SupabaseStorageService:
    """Service for managing file uploads and retrieval from Supabase Storage."""

    def __init__(self):
        """Initialize Supabase client with credentials from environment variables.
        
        Uses service_role key which bypasses RLS — do NOT call sign_in_anonymously()
        as that would replace the service_role session with a weak anon session.
        """
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.bucket_name = "octosight-evidence"

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required.")

        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        print(f"[Supabase] Client initialized (key role: {'service' if len(self.supabase_key) > 200 else 'anon'})")

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> bool:
        """
        Upload a file to the Supabase Storage bucket.

        Args:
            file_bytes: Raw file bytes to upload.
            filename: Unique filename (typically UUID with extension).
            content_type: MIME type of the file (e.g., 'image/png', 'application/pdf').

        Returns:
            bool: True if upload is successful, raises HTTPException otherwise.

        Raises:
            HTTPException: If upload fails.
        """
        try:
            self.client.storage.from_(self.bucket_name).upload(
                path=filename,
                file=file_bytes,
                file_options={"content-type": content_type},
            )
            print(f"[Supabase] Upload OK: {filename}")
            return True
        except Exception as e:
            print(f"[Supabase] Upload FAILED for '{filename}': {type(e).__name__}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}",
            )

    def get_signed_url(self, filename: str, expires_in: int = 3600) -> str:
        """
        Generate a secure signed URL for reading/previewing a file.

        Args:
            filename: Name of the file in the bucket.
            expires_in: Expiration time in seconds (default: 1 hour).

        Returns:
            str: Signed URL that can be used to access the file.

        Raises:
            HTTPException: If signed URL generation fails.
        """
        try:
            response = self.client.storage.from_(self.bucket_name).create_signed_url(
                path=filename,
                expires_in=expires_in,
            )
            return response["signedURL"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate signed URL: {str(e)}",
            )

    def download_file(self, filename: str) -> bytes:
        """
        Download a file from Supabase Storage as bytes.

        Args:
            filename: Name of the file in the bucket.

        Returns:
            bytes: Raw file bytes.

        Raises:
            HTTPException: If the download fails.
        """
        try:
            response = self.client.storage.from_(self.bucket_name).download(filename)
            if isinstance(response, dict) and response.get("error"):
                raise Exception(response["error"])
            return response
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File download failed: {str(e)}",
            )

    def delete_file(self, filename: str) -> bool:
        """
        Delete a file from the Supabase Storage bucket.

        Args:
            filename: Name of the file to delete.

        Returns:
            bool: True if deletion is successful.

        Raises:
            HTTPException: If deletion fails.
        """
        try:
            self.client.storage.from_(self.bucket_name).remove([filename])
            return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File deletion failed: {str(e)}",
            )


# Singleton instance
_supabase_service: Optional[SupabaseStorageService] = None


def get_supabase_service() -> SupabaseStorageService:
    """Get or create the Supabase Storage Service instance."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseStorageService()
    return _supabase_service
