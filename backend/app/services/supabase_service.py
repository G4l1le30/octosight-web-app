"""
Supabase Storage Service for OctoSight.
Handles secure file uploads and generation of signed URLs for the "octosight-evidence" bucket.
"""

import os
import time
import asyncio
from typing import Optional, Callable
from supabase import create_client, Client
from fastapi import HTTPException, status


def _sync_retry(max_attempts: int = 3, base_delay: float = 1.0):
    """Decorator for synchronous methods: retry with exponential backoff."""
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    if attempt < max_attempts:
                        delay = base_delay * (2 ** (attempt - 1))
                        print(f"[Supabase] Retry {attempt}/{max_attempts} after {delay:.1f}s — {type(e).__name__}: {e}")
                        time.sleep(delay)
            raise last_exc
        return wrapper
    return decorator


def _async_retry(max_attempts: int = 3, base_delay: float = 1.0):
    """Decorator for async methods: retry with exponential backoff."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    if attempt < max_attempts:
                        delay = base_delay * (2 ** (attempt - 1))
                        print(f"[Supabase] Retry {attempt}/{max_attempts} after {delay:.1f}s — {type(e).__name__}: {e}")
                        await asyncio.sleep(delay)
            raise last_exc
        return wrapper
    return decorator


class SupabaseStorageService:
    """Service for managing file uploads and retrieval from Supabase Storage."""

    def __init__(self):
        """Initialize Supabase client with credentials from environment variables.
        
        Uses service_role key which bypasses RLS — do NOT call sign_in_anonymously()
        as that would replace the service_role session with a weak anon session.
        
        Falls back to local filesystem when Supabase credentials are missing
        or when all Supabase upload retries are exhausted.
        """
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.bucket_name = "octosight-evidence"
        self.fallback_dir = os.getenv("UPLOAD_DIR", "uploads/evidence")

        if not self.supabase_url or not self.supabase_key:
            self.client = None
            print("[Supabase] Credentials missing — using local filesystem fallback.")
        else:
            self.client: Client = create_client(self.supabase_url, self.supabase_key)
            print(f"[Supabase] Client initialized (key role: {'service' if len(self.supabase_key) > 200 else 'anon'})")

    def _fallback_upload(self, file_bytes: bytes, filename: str) -> str:
        """Save file to local filesystem as fallback when Supabase is unavailable."""
        os.makedirs(self.fallback_dir, exist_ok=True)
        local_path = os.path.join(self.fallback_dir, filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        print(f"[Supabase] Upload fallback → local filesystem: {local_path}")
        return local_path

    @_sync_retry(max_attempts=3, base_delay=1.0)
    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> bool:
        if not self.client:
            self._fallback_upload(file_bytes, filename)
            return True

        self.client.storage.from_(self.bucket_name).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        print(f"[Supabase] Upload OK: {filename}")
        return True

    @_sync_retry(max_attempts=3, base_delay=1.0)
    def get_signed_url(self, filename: str, expires_in: int = 3600) -> str:
        if not self.client:
            raise RuntimeError("Supabase not configured — cannot generate signed URL")

        response = self.client.storage.from_(self.bucket_name).create_signed_url(
            path=filename,
            expires_in=expires_in,
        )
        return response["signedURL"]

    @_sync_retry(max_attempts=3, base_delay=1.0)
    def download_file(self, filename: str) -> bytes:
        if not self.client:
            local_path = os.path.join(self.fallback_dir, filename)
            if not os.path.exists(local_path):
                raise FileNotFoundError(f"Fallback file not found: {local_path}")
            with open(local_path, "rb") as f:
                return f.read()

        response = self.client.storage.from_(self.bucket_name).download(filename)
        if isinstance(response, dict) and response.get("error"):
            raise Exception(response["error"])
        return response

    @_sync_retry(max_attempts=3, base_delay=1.0)
    def delete_file(self, filename: str) -> bool:
        if not self.client:
            local_path = os.path.join(self.fallback_dir, filename)
            if os.path.exists(local_path):
                os.remove(local_path)
                print(f"[Supabase] Delete fallback → local: {local_path}")
            return True

        self.client.storage.from_(self.bucket_name).remove([filename])
        return True


# Singleton instance
_supabase_service: Optional[SupabaseStorageService] = None


def get_supabase_service() -> SupabaseStorageService:
    """Get or create the Supabase Storage Service instance."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseStorageService()
    return _supabase_service
