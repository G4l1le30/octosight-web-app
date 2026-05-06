"""
core/engines.py — Module-level singleton instances of all detection engines.

Import from this module in routers/services instead of instantiating engines
per-request, which would incur unnecessary startup cost (especially the ML model).
"""

import os

from app.core.rule_engine import RuleEngine
from app.core.ocr_engine import OCREngine
from app.core.ml_engine import analyze_spam  # noqa: F401 — re-exported for convenience

WHITELIST_PATH = os.getenv("WHITELIST_PATH", "/app/data/whitelist.txt")

# Instantiated once at import time — shared across all requests
rule_engine = RuleEngine(whitelist_path=WHITELIST_PATH)
ocr_engine = OCREngine()
