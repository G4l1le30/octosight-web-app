import hashlib
import logging
import httpx
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class VirusTotalEngine:
    """
    Engine to interact with VirusTotal v3 API.
    Used for checking file hashes (SHA-256) against known malware databases.
    """

    @staticmethod
    def calculate_sha256(file_content: bytes) -> str:
        """Calculates SHA-256 hash of given file bytes."""
        return hashlib.sha256(file_content).hexdigest()

    @staticmethod
    async def check_file_hash(file_hash: str) -> Optional[Dict[str, Any]]:
        """
        Checks a file hash on VirusTotal.
        Returns analysis stats if found, None if not found or error.
        """
        if not settings.virustotal_api_key:
            logger.warning("[VirusTotal] API Key not configured. Skipping check.")
            return None

        url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
        headers = {
            "x-apikey": settings.virustotal_api_key,
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    attributes = data.get("data", {}).get("attributes", {})
                    stats = attributes.get("last_analysis_stats", {})
                    
                    return {
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "harmless": stats.get("harmless", 0),
                        "undetected": stats.get("undetected", 0),
                        "reputation": attributes.get("reputation", 0),
                        "meaningful_name": attributes.get("meaningful_name", "Unknown"),
                        "vt_link": f"https://www.virustotal.com/gui/file/{file_hash}"
                    }
                elif response.status_code == 404:
                    logger.info(f"[VirusTotal] Hash {file_hash} not found (Clean or Unknown).")
                    return {"found": False, "message": "Not found in VirusTotal database"}
                else:
                    logger.error(f"[VirusTotal] API error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"[VirusTotal] Exception during hash check: {e}")
            return None
