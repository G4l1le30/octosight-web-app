import joblib
import os
import sys
from sklearn.base import BaseEstimator, TransformerMixin
from sentence_transformers import SentenceTransformer

class SentenceTransformerWrapper(BaseEstimator, TransformerMixin):
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return self.model.encode(X)

SentenceTransformerWrapper.__module__ = '__main__'

import torch
from unittest.mock import patch

# Alias to __main__ so joblib can find the class exactly as it was pickled in the Jupyter Notebook
setattr(sys.modules['__main__'], 'SentenceTransformerWrapper', SentenceTransformerWrapper)

# Resolve the path relative to this file (app/core/) up to backend/models/
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'spam_pipeline.pkl')

original_load = torch.load
def _cpu_load(*args, **kwargs):
    kwargs['map_location'] = torch.device('cpu')
    return original_load(*args, **kwargs)

# Load the model once at module import time to minimize per-request latency.
try:
    with patch('torch.load', _cpu_load):
        spam_model = joblib.load(MODEL_PATH)
    print(f"[ML Engine] Model loaded successfully from: {os.path.abspath(MODEL_PATH)}")
except FileNotFoundError:
    spam_model = None
    print(f"[ML Engine] WARNING: Model file not found at {os.path.abspath(MODEL_PATH)}")
except Exception as e:
    spam_model = None
    print(f"[ML Engine] ERROR: Failed to load model — {e}")


def analyze_spam(text: str) -> dict:
    """
    Predict whether the given text is spam/phishing using a pre-trained
    scikit-learn pipeline (TF-IDF + Logistic Regression).

    Args:
        text: The message string to analyze.

    Returns:
        A dict with 'category' (predicted label) and 'confidence' (percentage).
        Returns a dict with 'error' key if the model is unavailable.
    """
    if spam_model is None:
        return {
            "error": "ML model is not available. Make sure spam_pipeline.pkl exists in backend/models/."
        }

    prediction = spam_model.predict([text])[0]
    probabilities = spam_model.predict_proba([text])[0]
    confidence = float(max(probabilities)) * 100

    return {
        "category": str(prediction),
        "confidence": round(confidence, 2),
    }
