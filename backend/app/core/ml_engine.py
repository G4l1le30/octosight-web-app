import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def analyze_spam(text: str) -> dict:
    """
    Analyze text for spam using an external ML service (e.g., Hugging Face Spaces).
    
    Args:
        text (str): The text to analyze.
        
    Returns:
        dict: A dictionary containing 'category' and 'confidence'.
    """
    if not isinstance(text, str):
        return {"error": "Input must be a text string"}

    if not settings.ml_service_url:
        logger.warning("[ML Engine] ML_SERVICE_URL is not configured.")
        return {"error": "ML service not configured"}

    try:
        # Simple synchronous POST request to the ML service
        with httpx.Client(timeout=15.0) as client:
            response = client.post(
                settings.ml_service_url,
                json={"text": text}
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "category": data.get("category", "unknown"),
                "confidence": data.get("confidence", 0.0),
            }
    except httpx.HTTPStatusError as e:
        logger.error(f"[ML Engine] External API error: {e.response.status_code} - {e.response.text}")
        return {"error": f"ML prediction service returned error: {e.response.status_code}"}
    except Exception as e:
        logger.error(f"[ML Engine] Failed to reach ML service: {str(e)}")
        return {"error": f"ML prediction service unreachable: {str(e)}"}
