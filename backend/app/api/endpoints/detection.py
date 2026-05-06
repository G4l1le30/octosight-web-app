"""
routers/detection.py — Endpoints for phishing/spam detection.

Endpoints:
  POST /api/v1/report          Submit a new phishing report (saves to DB)
  POST /api/v1/analyze         Preview risk score without saving
  POST /api/v1/predict-spam    Standalone ML-only prediction

Hybrid scoring formula (OctoSight Aturan #2):
  final_score = (rule_score × 0.35) + (ml_score × 0.65)

  ml_score is derived from the ML pipeline confidence:
  - category == "phishing"     → ml_score = confidence  (e.g. 96.2)
  - category == "not phishing" → ml_score = 100 - confidence (e.g. 100 - 98.1 = 1.9)

  If the ML model is unavailable, the rule score is used for both components
  (effectively 100% rule-based), and a warning flag is appended.
"""

import hashlib
import json
import os
import random
import shutil
import time
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import Ticket
from app.schemas.schemas import AnalysisRequest, MessageRequest, SpamPredictionResponse
from app.core.engines import analyze_spam, ocr_engine, rule_engine

router = APIRouter(prefix="/api/v1", tags=["detection"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _compute_hybrid_score(rule_score: float, combined_text: str) -> dict:
    """
    Compute the hybrid (rule + ML) risk score.

    Returns a dict with:
        final_score  – blended 0-100 score
        rule_score   – raw rule-engine score
        ml_score     – normalised ML score (0-100, phishing direction)
        ml_category  – predicted label from ML model
        ml_confidence– model confidence (%)
        ml_available – whether the ML model loaded successfully
    """
    ml_result = analyze_spam(combined_text) if combined_text.strip() else {}

    if "error" in ml_result or not ml_result:
        # ML unavailable — fall back to 100% rule score
        ml_score = rule_score
        ml_category = "unavailable"
        ml_confidence = 0.0
        ml_available = False
    else:
        ml_category = ml_result["category"]
        ml_confidence = ml_result["confidence"]

        # Convert ML output into a 0-100 phishing-probability score
        if ml_category == "phishing":
            ml_score = ml_confidence          # e.g. 96.2 → 96.2
        else:
            ml_score = 100.0 - ml_confidence  # e.g. 98.1 → 1.9

        ml_available = True

    # OctoSight Aturan #2: rule 35% + ML 65%
    final_score = min(100.0, round((rule_score * 0.35) + (ml_score * 0.65), 2))

    return {
        "final_score": final_score,
        "rule_score": rule_score,
        "ml_score": ml_score,
        "ml_category": ml_category,
        "ml_confidence": ml_confidence,
        "ml_available": ml_available,
    }


def _resolve_priority(score: float) -> str:
    if score >= 75:
        return "High"
    elif score >= 35:
        return "Medium"
    return "Low"


def _save_upload(file: UploadFile, prefix: str) -> str:
    """Save an uploaded file to UPLOAD_DIR with a hashed filename. Returns filename."""
    ext = os.path.splitext(file.filename)[1]
    salt = uuid.uuid4().hex
    file_hash = hashlib.sha256(
        f"{file.filename}{salt}{time.time()}".encode()
    ).hexdigest()[:20]
    filename = f"{prefix}_{file_hash}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return filename


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/report", summary="Submit a phishing/fraud report")
async def create_report(
    url: str = Form(""),
    type: str = Form(...),
    summary: str = Form(""),
    sender_numbers: str = Form(""),
    screenshots: List[UploadFile] = File(None),
    attachments: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Submit a new phishing/fraud report.

    Risk is scored using the hybrid engine:
      - Rule Engine  (35%) — URL heuristics, attachments, keywords
      - ML Engine    (65%) — SentenceTransformer + Logistic Regression

    Evidence files are stored to disk; only their paths are saved in the DB.
    """
    all_extracted_text: List[str] = []
    screenshot_list: List[str] = []
    orig_attachment_names: List[str] = []
    hashed_attachment_paths: List[str] = []

    # 1. Process screenshots via OCR
    if screenshots:
        for file in screenshots:
            if not file.content_type or not file.content_type.startswith("image/"):
                continue
            filename = _save_upload(file, "screenshot")
            file_path = os.path.join(UPLOAD_DIR, filename)
            screenshot_list.append(filename)

            text = ocr_engine.extract_text(file_path)
            all_extracted_text.append(text)

            # Auto-detect URL from screenshot if reporter didn't supply one
            indicators = ocr_engine.find_indicators(text)
            if indicators["urls"] and not url:
                url = indicators["urls"][0]

    # 2. Process attachments (evidence files)
    if attachments:
        for file in attachments:
            orig_attachment_names.append(file.filename)
            filename = _save_upload(file, "attachment")
            hashed_attachment_paths.append(filename)

    # 3. Rule-based analysis
    combined_text = "\n---\n".join(all_extracted_text)
    rule_analysis = rule_engine.calculate_risk(
        url=url,
        attachments=orig_attachment_names or None,
        sender_numbers=sender_numbers,
        extracted_text=combined_text,
    )
    rule_score: float = rule_analysis["score"]

    # 4. Hybrid scoring: Rule (35%) + ML (65%)
    hybrid = _compute_hybrid_score(rule_score, combined_text or summary)
    final_score = hybrid["final_score"]
    priority = _resolve_priority(final_score)

    # Append ML flag for transparency
    flags: List[str] = list(rule_analysis["flags"])
    if not hybrid["ml_available"]:
        flags.append("ml_engine_unavailable")
    else:
        flags.append(f"ml_prediction:{hybrid['ml_category']}")

    # 5. Build enriched analysis_results for the admin dashboard
    details = {
        **rule_analysis["details"],
        "hybrid_scoring": {
            "rule_score": hybrid["rule_score"],
            "ml_score": hybrid["ml_score"],
            "ml_category": hybrid["ml_category"],
            "ml_confidence": hybrid["ml_confidence"],
            "formula": "final = rule×0.35 + ml×0.65",
        },
    }

    # 6. Persist to DB
    ticket_id = f"OCTO-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"

    db_ticket = Ticket(
        ticket_id=ticket_id,
        url=url,
        type=type,
        summary=summary,
        sender_numbers=sender_numbers,
        extracted_text=combined_text,
        attachment_names=",".join(orig_attachment_names),
        attachment_paths=",".join(hashed_attachment_paths),
        screenshot_paths=",".join(screenshot_list),
        risk_score=final_score,
        rule_score=hybrid["rule_score"],
        ml_score=hybrid["ml_score"],
        priority=priority,
        flags=",".join(flags),
        analysis_results=json.dumps(details),
        status="Submitted",
        user_id=current_user.id,
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    return db_ticket


@router.post("/analyze", summary="Preview risk score without saving")
async def analyze_preview(
    data: AnalysisRequest,
    current_user=Depends(get_current_user),
):
    """
    Calculate the hybrid risk score from form data **without** saving a ticket.
    Useful for real-time feedback while the user fills in the report form.
    """
    rule_analysis = rule_engine.calculate_risk(
        url=data.url,
        attachments=data.attachment_names or None,
        sender_numbers=data.sender_numbers,
        extracted_text=data.summary,
    )
    rule_score: float = rule_analysis["score"]

    # Include ML in preview as well
    text_to_analyse = data.summary or data.url or ""
    hybrid = _compute_hybrid_score(rule_score, text_to_analyse)

    return {
        **rule_analysis,
        "score": hybrid["final_score"],        # override with hybrid final
        "rule_score": hybrid["rule_score"],
        "ml_score": hybrid["ml_score"],
        "ml_category": hybrid["ml_category"],
        "ml_confidence": hybrid["ml_confidence"],
    }


@router.post(
    "/predict-spam",
    response_model=SpamPredictionResponse,
    summary="Standalone ML spam/phishing prediction",
)
def predict_spam(
    request: MessageRequest,
    current_user=Depends(get_current_user),
):
    """
    Run the ML pipeline on a free-text message and return the predicted
    label ('phishing' / 'not phishing') and confidence percentage.

    This endpoint is ML-only (no rule engine). Use /analyze for the full
    hybrid score.
    """
    result = analyze_spam(request.text)
    return SpamPredictionResponse(message=request.text, data=result)
