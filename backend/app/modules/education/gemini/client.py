import os
import json
import re
import time
from typing import Any, Dict, List, Optional

# Make google.genai optional so the app can run without Gemini SDK installed.
try:
    from google import genai  # type: ignore
    from google.genai import types  # type: ignore
except Exception:
    genai = None
    types = None

class GeminiClient:
    # Circuit breaker — skip Gemini until this epoch timestamp
    _circuit_open_until: float = 0.0

    # Multi-key rotation: track which key index to try next
    _current_key_index: int = 0
    # Keys exhausted (429) — map key_index -> epoch when it becomes available again
    _key_exhausted_until: Dict[int, float] = {}

    # Model fallback list (tried in order when 503 / overloaded is received)
    MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    _current_model_index: int = 0
    # Models overloaded (503) — map model_index -> epoch when it becomes available again
    _model_overloaded_until: Dict[int, float] = {}

    @staticmethod
    def _get_api_keys() -> List[str]:
        """Return list of API keys from GEMINI_API_KEY (comma-separated for rotation)."""
        raw = os.getenv("GEMINI_API_KEY", "")
        return [k.strip() for k in raw.split(",") if k.strip()]

    @staticmethod
    def get_client() -> Optional[Any]:
        """
        Returns a Gemini client using the next available (non-exhausted) API key.
        Rotates through keys automatically. Returns None if all keys are exhausted.
        """
        # If genai SDK is not installed, return None so callers fall back.
        if genai is None:
            return None

        keys = GeminiClient._get_api_keys()
        if not keys:
            return None

        now = time.time()
        num_keys = len(keys)

        # Try each key starting from current index, skip exhausted ones
        for attempt in range(num_keys):
            idx = (GeminiClient._current_key_index + attempt) % num_keys
            exhausted_until = GeminiClient._key_exhausted_until.get(idx, 0)
            if now >= exhausted_until:
                GeminiClient._current_key_index = idx
                return genai.Client(api_key=keys[idx])

        # All keys exhausted
        return None

    @staticmethod
    def rotate_key_on_exhaustion(retry_delay_seconds: float = 60.0) -> None:
        """Mark current key as exhausted and advance to next key."""
        keys = GeminiClient._get_api_keys()
        if not keys:
            return
        idx = GeminiClient._current_key_index
        GeminiClient._key_exhausted_until[idx] = time.time() + retry_delay_seconds
        # Move to next key
        GeminiClient._current_key_index = (idx + 1) % len(keys)
        remaining = [
            i for i in range(len(keys))
            if time.time() >= GeminiClient._key_exhausted_until.get(i, 0)
        ]
        if remaining:
            print(f"[Key Rotation] Key #{idx} exhausted for {retry_delay_seconds:.0f}s → switching to key #{GeminiClient._current_key_index}. {len(remaining)} key(s) still available.")
        else:
            print(f"[Key Rotation] All {len(keys)} key(s) exhausted. Tripping global circuit breaker.")
            GeminiClient._trip_circuit(retry_delay_seconds)

    @staticmethod
    def _trip_circuit(retry_delay_seconds: float = 86400.0) -> None:
        """Open the global circuit breaker for `retry_delay_seconds`."""
        open_until = time.time() + retry_delay_seconds
        if open_until > GeminiClient._circuit_open_until:
            GeminiClient._circuit_open_until = open_until
            print(f"[Circuit Breaker] Gemini calls suspended for {retry_delay_seconds:.0f}s")

    @staticmethod
    def is_circuit_open() -> bool:
        """Returns True if the global circuit breaker is active."""
        return time.time() < GeminiClient._circuit_open_until

    @staticmethod
    def get_model() -> str:
        """Return current model name, accounting for overloaded models (503)."""
        now = time.time()
        num_models = len(GeminiClient.MODEL_FALLBACKS)
        for attempt in range(num_models):
            idx = (GeminiClient._current_model_index + attempt) % num_models
            overloaded_until = GeminiClient._model_overloaded_until.get(idx, 0)
            if now >= overloaded_until:
                GeminiClient._current_model_index = idx
                return GeminiClient.MODEL_FALLBACKS[idx]
        GeminiClient._model_overloaded_until.clear()
        GeminiClient._current_model_index = 0
        print("[Model Rotation] All models overloaded — resetting and retrying from first model.")
        return GeminiClient.MODEL_FALLBACKS[0]

    @staticmethod
    def rotate_model_on_overload(retry_delay_seconds: float = 30.0) -> None:
        """Mark current model as overloaded (503) and advance to next model."""
        idx = GeminiClient._current_model_index
        GeminiClient._model_overloaded_until[idx] = time.time() + retry_delay_seconds
        GeminiClient._current_model_index = (idx + 1) % len(GeminiClient.MODEL_FALLBACKS)
        print(f"[Model Rotation] {GeminiClient.MODEL_FALLBACKS[idx]} overloaded for {retry_delay_seconds:.0f}s → switching to {GeminiClient.MODEL_FALLBACKS[GeminiClient._current_model_index]}")

    @staticmethod
    def extract_retry_delay(exception: Exception) -> float:
        """Extract retryDelay (in seconds) from a Gemini 429 exception, default 60s."""
        try:
            msg = str(exception)
            match = re.search(r"'retryDelay':\s*'(\d+(?:\.\d+)?)s'", msg)
            if match:
                return float(match.group(1)) + 5  # add 5s buffer
        except Exception:
            pass
        return 60.0

    @staticmethod
    def extract_json(text: str) -> Dict:
        try:
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
            json_str = match.group(1) if match else text
            return json.loads(json_str.strip())
        except Exception as e:
            print(f"JSON Parsing Error: {e}")
            return None
