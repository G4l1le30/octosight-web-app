import joblib
import os
import sys
import threading
from sklearn.base import BaseEstimator, TransformerMixin

# Make heavy ML deps optional so backend can build without `torch` or
# `sentence-transformers` installed. If the runtime model isn't present
# or deps are missing, `spam_model` will be None and the API falls back.
try:
    from sentence_transformers import SentenceTransformer  # type: ignore
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except Exception:
    SentenceTransformer = None
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class SentenceTransformerWrapper(BaseEstimator, TransformerMixin):
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        self.model_name = model_name
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise RuntimeError('sentence-transformers is not installed')
        self.model = SentenceTransformer(model_name)

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return self.model.encode(X)


SentenceTransformerWrapper.__module__ = '__main__'

# Try to import torch only if available; wrapping load to CPU if present.
try:
    import torch
    from unittest.mock import patch
    TORCH_AVAILABLE = True
except Exception:
    torch = None
    patch = None
    TORCH_AVAILABLE = False

# Alias to __main__ so joblib can find the class exactly as it was pickled.
setattr(sys.modules['__main__'], 'SentenceTransformerWrapper', SentenceTransformerWrapper)

from app.config import settings as _app_settings

# Resolve path relative to backend root using settings (configurable via env)
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(_BACKEND_ROOT, _app_settings.ml_model_path)

_spam_model = None
_spam_model_lock = threading.Lock()


def _load_model():
    """Load the ML model on first inference request (lazy loading)."""
    global _spam_model
    if _spam_model is not None:
        return

    with _spam_model_lock:
        if _spam_model is not None:
            return
        if not TORCH_AVAILABLE:
            print('[ML Engine] torch not available — ML model loading skipped')
            return

        original_load = torch.load

        def _cpu_load(*args, **kwargs):
            kwargs['map_location'] = torch.device('cpu')
            return original_load(*args, **kwargs)

        try:
            with patch('torch.load', _cpu_load):
                _spam_model = joblib.load(MODEL_PATH)
            print(f"[ML Engine] Model loaded successfully from: {os.path.abspath(MODEL_PATH)}")
        except FileNotFoundError:
            print(f"[ML Engine] WARNING: Model file not found at {os.path.abspath(MODEL_PATH)}")
        except Exception as e:
            print(f"[ML Engine] ERROR: Failed to load model — {e}")


def analyze_spam(text: str) -> dict:
    _load_model()

    if _spam_model is None:
        return {
            "error": "ML model is not available. Make sure spam_pipeline.pkl exists in backend/models/."
        }

    prediction = _spam_model.predict([text])[0]
    probabilities = _spam_model.predict_proba([text])[0]
    confidence = float(max(probabilities)) * 100

    return {
        "category": str(prediction),
        "confidence": round(confidence, 2),
    }


# Eager-load model at import time so first request is fast
_load_model()
