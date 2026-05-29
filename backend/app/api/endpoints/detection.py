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

import asyncio
import hashlib
import json
import os
import random
import shutil
import time
import uuid
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import SessionLocal, get_db
from app.models.models import Ticket, BlacklistedURL, BlacklistedAccount, MockBankTransaction, BlacklistedPhone, BlacklistedEmail
from pydantic import BaseModel
from app.schemas.schemas import AnalysisRequest, MessageRequest, SpamPredictionResponse
from app.core.engines import analyze_spam, ocr_engine, rule_engine
from app.modules.education.gemini_service import GeminiEducationService
from app.modules.education.gemini.client import GeminiClient
from app.api.endpoints.blacklist import normalize_url_for_match, _extract_domain
from app.modules.notifications.service import send_email_notification, send_email_async
from app.services.supabase_service import get_supabase_service, SupabaseStorageService

router = APIRouter(prefix="/api/v1", tags=["detection"])


# ── Input Sanitization & Validation ───────────────────────────────────────────

import re as _re

_HTML_TAG_RE = _re.compile(r"<[^>]*>")
_SCRIPT_RE = _re.compile(r"javascript\s*:", _re.IGNORECASE)
_EVENT_HANDLER_RE = _re.compile(r"\bon\w+\s*=", _re.IGNORECASE)


def _sanitize_text(value: str) -> str:
    """Strip HTML tags, script protocols, and event handlers from user input."""
    return _HTML_TAG_RE.sub(
        "", _SCRIPT_RE.sub("blocked:", _EVENT_HANDLER_RE.sub("disabled=", value))
    ).strip()


def _validate_report_inputs(
    url: str,
    report_type: str,
    summary: str,
    sender_numbers: str,
    bank_name: str,
    bank_account: str,
    reference_number: str,
):
    """Validate and sanitize all text inputs for report/analyze endpoints."""
    errors = []

    # report_type
    allowed_types = {"Website", "SMS", "WhatsApp", "Email", "Transaction"}
    if report_type not in allowed_types:
        errors.append(f"Invalid report_type. Must be one of: {', '.join(sorted(allowed_types))}")

    # url
    if url and len(url) > 2048:
        errors.append("URL must not exceed 2048 characters")

    # summary
    if summary and len(summary) > 2000:
        errors.append("Summary must not exceed 2000 characters")

    # sender_numbers
    if sender_numbers and len(sender_numbers) > 500:
        errors.append("Sender numbers must not exceed 500 characters")

    # bank_name
    if bank_name:
        if len(bank_name) > 100:
            errors.append("Bank name must not exceed 100 characters")
        elif not _re.match(r"^[a-zA-Z\s&.\',-]*$", bank_name):
            errors.append("Bank name contains invalid characters")

    # bank_account
    if bank_account:
        if len(bank_account) > 50:
            errors.append("Account number must not exceed 50 characters")
        elif not _re.match(r"^\d*$", bank_account):
            errors.append("Account number must contain only digits (0-9)")

    # reference_number
    if reference_number:
        if len(reference_number) > 100:
            errors.append("Reference number must not exceed 100 characters")
        elif not _re.match(r"^[a-zA-Z0-9\s\-/.]*$", reference_number):
            errors.append("Reference number contains invalid characters")

    if errors:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=errors)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _check_blacklist(db: Session, url: str) -> Optional[BlacklistedURL]:
    """Reusable helper to check if a URL matches any active blacklist entry."""
    if not url:
        return None
        
    normalized_report_url = normalize_url_for_match(url)
    report_domain = _extract_domain(url)
    
    # Get all active blacklist entries
    all_blacklist = db.query(BlacklistedURL).filter(BlacklistedURL.is_active == True).all()
    
    for entry in all_blacklist:
        normalized_entry_url = normalize_url_for_match(entry.url)
        # Match if:
        # 1. Domains match exactly (protocol-agnostic)
        # 2. Normalized report URL contains the normalized blacklisted URL (supports path matching)
        if (entry.domain and entry.domain == report_domain) or (normalized_entry_url and normalized_entry_url in normalized_report_url):
            return entry
            
    return None


def _check_account_blacklist(db: Session, account_number: str) -> Optional[BlacklistedAccount]:
    """Check if a bank account matches any active blacklist entry."""
    if not account_number:
        return None
    
    # Strip whitespace/formatting
    clean_acc = account_number.strip().replace(" ", "").replace("-", "")
    
    return db.query(BlacklistedAccount).filter(
        BlacklistedAccount.account_number == clean_acc,
        BlacklistedAccount.is_active == True
    ).first()


def _check_phone_blacklist(db: Session, phone_number: str) -> Optional[BlacklistedPhone]:
    """Check if a phone number matches any active blacklist entry."""
    if not phone_number:
        return None
    
    clean_phone = phone_number.strip().replace(" ", "").replace("-", "").replace("+", "")
    
    return db.query(BlacklistedPhone).filter(
        BlacklistedPhone.phone_number == clean_phone,
        BlacklistedPhone.is_active == True
    ).first()


def _check_email_blacklist(db: Session, email: str) -> Optional[BlacklistedEmail]:
    """Check if an email matches any active blacklist entry."""
    if not email:
        return None
    
    clean_email = email.strip().lower()
    
    return db.query(BlacklistedEmail).filter(
        BlacklistedEmail.email == clean_email,
        BlacklistedEmail.is_active == True
    ).first()


def _validate_transaction(db: Session, ref_number: str) -> Optional[MockBankTransaction]:
    """Validate a transaction reference number against the mock bank database."""
    if not ref_number:
        return None
    
    # Ref numbers are case-insensitive in our mock bank
    return db.query(MockBankTransaction).filter(
        MockBankTransaction.reference_number.ilike(ref_number.strip())
    ).first()


def _check_mutation_exists(db: Session, summary: str, extracted_text: str, account_number: str, bank_name: str = "") -> bool:
    """
    If the text mentions 'salah transfer/kirim', check if a corresponding 
    transaction exists in our mock bank for that account and bank.
    """
    combined = f"{summary} {extracted_text}".lower()
    trigger_keywords = ["salah transfer", "salah kirim", "keliru transfer", "salah masuk"]
    
    if any(kw in combined for kw in trigger_keywords):
        if account_number:
            clean_acc = account_number.strip().replace(" ", "").replace("-", "")
            # Check if this account exists in our mock bank as sender or receiver
            # AND if the bank name matches (if provided)
            query = db.query(MockBankTransaction).filter(
                (MockBankTransaction.sender_account == clean_acc) | 
                (MockBankTransaction.receiver_account == clean_acc)
            )
            
            if bank_name:
                query = query.filter(
                    (MockBankTransaction.sender_bank.ilike(f"%{bank_name}%")) |
                    (MockBankTransaction.receiver_bank.ilike(f"%{bank_name}%"))
                )

            exists = query.first()
            return exists is not None
        return False
    
    return True


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _compute_hybrid_score(rule_score: float, combined_text: str, only_ml: bool = False) -> dict:
    """
    Compute the hybrid (rule + ML) risk score.
    If only_ml is True, the rule score is ignored (except for hard checks).
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
    # But if only_ml is True, we use 100% ML
    if only_ml and ml_available:
        final_score = ml_score
        formula = "final = ml×1.00 (URL missing)"
        rule_weight = 0
        ml_weight = 100
    else:
        final_score = round((rule_score * 0.35) + (ml_score * 0.65), 2)
        formula = "final = rule×0.35 + ml×0.65"
        rule_weight = 35
        ml_weight = 65
    
    final_score = min(100.0, final_score)

    print(f"--- Hybrid Score Calculation ---")
    print(f"Rule Score: {rule_score} (weight {rule_weight}%) -> {rule_score * (rule_weight/100)}")
    print(f"ML Score: {ml_score} (weight {ml_weight}%) -> {ml_score * (ml_weight/100)}")
    print(f"ML Category: {ml_category}, Confidence: {ml_confidence}")
    print(f"Final Score: {final_score}")
    print(f"-------------------------------")

    return {
        "final_score": final_score,
        "rule_score": rule_score,
        "ml_score": ml_score,
        "ml_category": ml_category,
        "ml_confidence": ml_confidence,
        "ml_available": ml_available,
        "formula": formula,
        "rule_weight": rule_weight,
        "ml_weight": ml_weight
    }


def _resolve_priority(score: float) -> str:
    if score >= 75:
        return "High"
    elif score >= 35:
        return "Medium"
    return "Low"


def _save_upload(file: UploadFile, prefix: str, subfolder: str = "") -> str:
    """Save an uploaded file to UPLOAD_DIR (optionally in a subfolder). Returns relative filename."""
    target_dir = os.path.join(UPLOAD_DIR, subfolder) if subfolder else UPLOAD_DIR
    os.makedirs(target_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    salt = uuid.uuid4().hex
    file_hash = hashlib.sha256(
        f"{file.filename}{salt}{time.time()}".encode()
    ).hexdigest()[:20]
    filename = f"{prefix}_{file_hash}{ext}"
    
    # Store path relative to UPLOAD_DIR for the DB, but full path for saving
    relative_path = os.path.join(subfolder, filename) if subfolder else filename
    full_path = os.path.join(UPLOAD_DIR, relative_path)
    
    with open(full_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return relative_path


def _save_upload_bytes(content: bytes, original_filename: str, prefix: str, subfolder: str = "") -> str:
    """Save uploaded bytes to UPLOAD_DIR and return the relative path."""
    target_dir = os.path.join(UPLOAD_DIR, subfolder) if subfolder else UPLOAD_DIR
    os.makedirs(target_dir, exist_ok=True)

    ext = os.path.splitext(original_filename)[1]
    salt = uuid.uuid4().hex
    file_hash = hashlib.sha256(
        f"{original_filename}{salt}{time.time()}".encode()
    ).hexdigest()[:20]
    filename = f"{prefix}_{file_hash}{ext}"

    relative_path = os.path.join(subfolder, filename) if subfolder else filename
    full_path = os.path.join(UPLOAD_DIR, relative_path)

    with open(full_path, "wb") as buf:
        buf.write(content)

    return relative_path


async def _download_supabase_screenshot_and_extract_text(
    path: str, supabase_service: SupabaseStorageService
) -> Optional[dict]:
    """Download a screenshot from Supabase and run OCR on its bytes."""
    if not path:
        return None

    try:
        content = await asyncio.to_thread(supabase_service.download_file, path)
        if not content:
            return None

        text = await asyncio.to_thread(ocr_engine.extract_text_from_bytes, content)
        indicators = ocr_engine.find_indicators(text)
        return {
            "path": path,
            "text": text,
            "indicators": indicators,
        }
    except Exception as e:
        print(f"Supabase download error for {path}: {e}")
        return None


async def _persist_screenshot_and_extract_text(
    file: UploadFile,
    ticket_id: str,
    supabase_service: SupabaseStorageService,
) -> Optional[dict]:
    """
    Read one screenshot UploadFile, run OCR, then upload it to Supabase Storage.
    Returns the Supabase filename (UUID-based), the extracted text, and URL indicators.
    Falls back to local disk if Supabase upload fails.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        return None

    content = await file.read()
    if not content:
        return None

    # OCR is always done from bytes regardless of storage destination
    text = await asyncio.to_thread(ocr_engine.extract_text_from_bytes, content)
    indicators = ocr_engine.find_indicators(text)

    # Try Supabase upload first
    try:
        ext = os.path.splitext(file.filename or "screenshot")[1].lstrip(".").lower() or "png"
        supabase_filename = f"{ticket_id}/screenshot_{uuid.uuid4().hex}.{ext}"
        content_type_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}
        ct = content_type_map.get(ext, "image/png")
        await asyncio.to_thread(
            supabase_service.upload_file,
            content,
            supabase_filename,
            ct,
        )
        saved_path = supabase_filename
    except Exception as e:
        print(f"[screenshot upload] Supabase failed, falling back to disk: {e}")
        saved_path = await asyncio.to_thread(
            _save_upload_bytes, content, file.filename or "screenshot", "screenshot", ticket_id
        )

    return {
        "path": saved_path,
        "text": text,
        "indicators": indicators,
    }


async def _persist_attachment_to_supabase(
    file: UploadFile,
    ticket_id: str,
    supabase_service: SupabaseStorageService,
) -> Optional[str]:
    """
    Upload one attachment (image or PDF) to Supabase Storage.
    Returns the Supabase filename, or falls back to a local path on error.
    """
    content = await file.read()
    if not content:
        return None

    try:
        ext = os.path.splitext(file.filename or "attachment")[1].lstrip(".").lower() or "bin"
        supabase_filename = f"{ticket_id}/attachment_{uuid.uuid4().hex}.{ext}"
        content_type_map = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "pdf": "application/pdf",
        }
        ct = content_type_map.get(ext, "application/octet-stream")
        await asyncio.to_thread(
            supabase_service.upload_file,
            content,
            supabase_filename,
            ct,
        )
        return supabase_filename
    except Exception as e:
        print(f"[attachment upload] Supabase failed, falling back to disk: {e}")
        return await asyncio.to_thread(
            _save_upload_bytes, content, file.filename or "attachment", "attachment", ticket_id
        )


async def _generate_education_recommendation_for_ticket(ticket_id: int, user_email: Optional[str] = None) -> None:
    """Generate education recommendation after the main response returns and optionally send email."""
    db = SessionLocal()
    try:
        from app.models.education import EducationModule

        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return

        modules = db.query(EducationModule).order_by(EducationModule.order_index).all()
        available_modules = [{"id": m.id, "title": m.title} for m in modules]

        recommendation = GeminiEducationService.generate_education_recommendation(
            ticket_type=ticket.type,
            url=ticket.url,
            rule_score=ticket.rule_score or 0,
            ml_score=ticket.ml_score or 0,
            ticket_content=ticket.extracted_text[:1000] if ticket.extracted_text else "",
            ticket_summary=ticket.summary or "",
            available_modules=available_modules,
        )

        ticket.education_recommendation = recommendation
        db.commit()

        if user_email:
            # All tickets receive an education notification. Gemini AI generates
            # recommendations tailored to the actual risk score, so content is
            # already risk-aware (lighter for Low, stronger for High).
            template_body = {
                "ticket_id": ticket.ticket_id,
                "type": ticket.type or "N/A",
                "url": ticket.url or "N/A",
                "sender_numbers": ticket.sender_numbers or "N/A",
                "summary": (ticket.summary or "")[:300],
                "risk_score": ticket.risk_score,
                "priority": ticket.priority,
                "bank_name": ticket.bank_name or "",
                "bank_account": ticket.bank_account or "",
                "reference_number": ticket.reference_number or "",
                "gemini_warnings": recommendation.get("warnings", []),
                "gemini_actions": recommendation.get("suggested_actions", []),
                "gemini_tips": recommendation.get("tips", []),
            }
            await send_email_async(
                subject=f"OctoSight - Report Submitted [{ticket.ticket_id}]",
                email_to=user_email,
                template_name="form_submit.html",
                template_body=template_body
            )
            
    except Exception as e:
        print(f"Failed to generate education recommendation: {e}")
    finally:
        db.close()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/report", summary="Submit a phishing/fraud report")
async def create_report(
    background_tasks: BackgroundTasks,
    url: str = Form(""),
    report_type: str = Form(...),
    summary: str = Form(""),
    sender_numbers: str = Form(""),
    bank_name: str = Form(""),
    bank_account: str = Form(""),
    reference_number: str = Form(""),
    screenshots: List[UploadFile] = File(None),
    attachments: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    supabase_service: SupabaseStorageService = Depends(get_supabase_service),
    current_user=Depends(get_current_user),
):
    """
    Submit a new phishing/fraud report.
    - Files (screenshots & attachments) are uploaded to Supabase Storage atomically here.
    - Up to 10 screenshots allowed.
    - Files grouped in a per-ticket folder by Ticket ID.
    """
    # 0. Sanitize all text inputs
    url = _sanitize_text(url)
    report_type = _sanitize_text(report_type)
    summary = _sanitize_text(summary)
    sender_numbers = _sanitize_text(sender_numbers)
    bank_name = _sanitize_text(bank_name)
    bank_account = _sanitize_text(bank_account)
    reference_number = _sanitize_text(reference_number)
    _validate_report_inputs(url, report_type, summary, sender_numbers, bank_name, bank_account, reference_number)

    # 0b. Validation: Require either summary or at least one screenshot
    if not summary.strip() and not screenshots:
        raise HTTPException(
            status_code=400,
            detail="Either message content (summary) or an evidence screenshot is required."
        )

    # 1. Pre-generate Ticket ID for Supabase folder grouping
    ticket_id = f"OCTO-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"

    all_extracted_text: List[str] = []
    screenshot_list: List[str] = []
    orig_attachment_names: List[str] = []
    hashed_attachment_paths: List[str] = []

    # 2. Process screenshots: OCR + upload to Supabase
    if screenshots:
        processed_screenshots = await asyncio.gather(
            *[
                _persist_screenshot_and_extract_text(file, ticket_id, supabase_service)
                for file in screenshots[:10]
            ]
        )
        for processed in processed_screenshots:
            if not processed:
                continue
            screenshot_list.append(processed["path"])
            all_extracted_text.append(processed["text"])

            if processed["indicators"]["urls"] and not url:
                url = processed["indicators"]["urls"][0]

    # 3. Process attachments: upload to Supabase
    if attachments:
        for file in attachments:
            orig_attachment_names.append(file.filename or "attachment")
            saved = await _persist_attachment_to_supabase(file, ticket_id, supabase_service)
            if saved:
                hashed_attachment_paths.append(saved)

    # 4. Rule-based analysis
    combined_text = "\n---\n".join(all_extracted_text)
    
    # --- GLOBAL VALIDATIONS ---
    is_transaction = report_type == "Transaction"
    blacklisted_entry = None
    account_blacklisted = False
    ref_found = False
    ref_valid = False
    global_flags = []

    # 1. Global Account Blacklist Check
    target_account = bank_account if bank_account else (sender_numbers if is_transaction else "")
    if target_account:
        blacklisted_acc = _check_account_blacklist(db, target_account)
        if blacklisted_acc:
            account_blacklisted = True
            global_flags.append("BLACKLISTED_ACCOUNT")

    # 1b. Global Phone & Email Blacklist Check
    if sender_numbers and not is_transaction:
        if "@" in sender_numbers:
            if _check_email_blacklist(db, sender_numbers):
                account_blacklisted = True
                global_flags.append("BLACKLISTED_EMAIL")
        else:
            if _check_phone_blacklist(db, sender_numbers):
                account_blacklisted = True
                global_flags.append("BLACKLISTED_PHONE")
    
    # Check indicators extracted by OCR
    indicators = ocr_engine.find_indicators(combined_text)
    for phone in indicators["phones"]:
        if _check_phone_blacklist(db, phone):
            account_blacklisted = True
            if "BLACKLISTED_PHONE" not in global_flags:
                global_flags.append("BLACKLISTED_PHONE")
    for email in indicators["emails"]:
        if _check_email_blacklist(db, email):
            account_blacklisted = True
            if "BLACKLISTED_EMAIL" not in global_flags:
                global_flags.append("BLACKLISTED_EMAIL")

    # 2. Global Reference Validation (OCR text or manual input)
    ref_no = ocr_engine.extract_reference_number(combined_text)
    if not ref_no and reference_number:
        ref_no = reference_number
    
    if ref_no:
        ref_found = True
        valid_tx = _validate_transaction(db, ref_no)
        if valid_tx:
            ref_valid = True

    # 3. URL Blacklist (for non-transaction reports)
    if not is_transaction and url:
        blacklisted_entry = _check_blacklist(db, url)

    # 4. Specific Social Engineering Mutation Check
    mutation_not_found = False
    mutation_found = False
    if "salah" in (summary + combined_text).lower():
        mutation_valid = _check_mutation_exists(db, summary, combined_text, bank_account or sender_numbers, bank_name)
        if mutation_valid:
            mutation_found = True
        else:
            mutation_not_found = True
    # --------------------------

    # Engine execution
    # Ensure rule engine looks at both summary and OCR text
    combined_text_for_rules = f"{summary}\n{combined_text}".strip()

    rule_analysis = rule_engine.calculate_risk(
        url=url,
        attachments=orig_attachment_names or None,
        sender_numbers=sender_numbers,
        extracted_text=combined_text_for_rules,
        is_transaction=is_transaction,
        ref_found=ref_found,
        ref_valid=ref_valid,
        account_blacklisted=account_blacklisted,
        mutation_not_found=mutation_not_found,
        mutation_found=mutation_found
    )
    
    # Add our global flags to rule analysis
    for gf in global_flags:
        if gf not in rule_analysis["flags"]:
            rule_analysis["flags"].append(gf)

    rule_score: float = rule_analysis["score"]

    if blacklisted_entry:
        rule_score = 100.0
        rule_analysis["flags"].append("domain_blacklisted")

    # 5. Hybrid scoring: Rule (35%) + ML (65%)
    ml_input_text = f"{summary}\n{combined_text}".strip()
    flags: List[str] = list(rule_analysis["flags"])

    if blacklisted_entry or account_blacklisted:
        hybrid = {
            "final_score": 100.0,
            "rule_score": 100.0,
            "ml_score": 100.0,
            "ml_category": "phishing",
            "ml_confidence": 100.0,
            "ml_available": True,
            "rule_weight": 100,
            "ml_weight": 0,
            "formula": "final = 100 (Blacklisted)"
        }
        if "BLACKLISTED" not in flags:
            flags.append("BLACKLISTED")
    else:
        # Restore standard hybrid scoring (35% Rule + 65% ML)
        hybrid = _compute_hybrid_score(rule_score, ml_input_text, only_ml=False)
    
    final_score = hybrid["final_score"]

    # --- Context-Aware Scoring Override ---
    is_scam_scenario = any("scam_scenario:" in f for f in flags)
    is_valid_ref = "VERIFIED_BY_BANK" in flags
    is_any_blacklisted = blacklisted_entry or account_blacklisted
    
    if not url.strip() and (is_scam_scenario or is_valid_ref) and not is_any_blacklisted:
        # If it's a scam scenario without a link, Rule Engine is prioritized
        # User Requirement: ML still gets 20% contribution
        # ONLY apply this if NOT explicitly blacklisted
        final_score = round((rule_score * 0.8) + (hybrid["ml_score"] * 0.2), 2)
        hybrid["rule_weight"] = 80
        hybrid["ml_weight"] = 20
        hybrid["formula"] = "final = rule×0.80 + ml×0.20 (Verification Override)"
        print(f"[Override] Verification override triggered (80/20). Final score: {final_score}")
    
    # If blacklisted, ensure everything is consistent at 100
    if is_any_blacklisted:
        final_score = 100.0
        hybrid["final_score"] = 100.0
        hybrid["rule_weight"] = 100
        hybrid["ml_weight"] = 0
    # --------------------------------------

    priority = _resolve_priority(final_score)

    if not hybrid["ml_available"]:
        flags.append("ml_engine_offline")
    else:
        category = hybrid['ml_category'].replace(' ', '_')
        flags.append(f"ml_prediction_{category}")

    details = {
        **rule_analysis["details"],
        "hybrid_scoring": {
            "rule_score": hybrid["rule_score"],
            "ml_score": hybrid["ml_score"],
            "ml_category": hybrid["ml_category"],
            "ml_confidence": hybrid["ml_confidence"],
            "rule_weight": hybrid.get("rule_weight", 35),
            "ml_weight": hybrid.get("ml_weight", 65),
            "formula": hybrid.get("formula", "final = rule×0.35 + ml×0.65"),
        },
    }

    # 6. Persist to DB
    db_ticket = Ticket(
        ticket_id=ticket_id,
        url=url,
        type=report_type,
        summary=summary,
        sender_numbers=sender_numbers,
        bank_name=bank_name,
        bank_account=bank_account,
        reference_number=reference_number,
        extracted_text=combined_text,
        attachment_paths=",".join(hashed_attachment_paths),
        screenshot_paths=",".join(screenshot_list),
        risk_score=final_score,
        rule_score=hybrid["rule_score"],
        ml_score=hybrid["ml_score"],
        priority=priority,
        flags=",".join(flags),
        analysis_results=json.dumps(details),
        status="Submitted",
        sla_deadline=datetime.now(timezone.utc) + timedelta(hours=1),
        user_id=current_user.id,
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    if current_user and current_user.email:
        background_tasks.add_task(
            _generate_education_recommendation_for_ticket, db_ticket.id, current_user.email
        )
    else:
        background_tasks.add_task(
            _generate_education_recommendation_for_ticket, db_ticket.id, None
        )

    return db_ticket


@router.post("/analyze", summary="Preview risk score without saving")
async def analyze_preview(
    report_type: str = Form(""),
    url: str = Form(""),
    summary: str = Form(""),
    sender_numbers: str = Form(""),
    bank_name: str = Form(""),
    bank_account: str = Form(""),
    reference_number: str = Form(""),
    attachment_path: str = Form(""),
    screenshot_path: str = Form(""),
    screenshots: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    supabase_service: SupabaseStorageService = Depends(get_supabase_service),
):
    """
    Calculate the hybrid risk score from form data **without** saving a ticket.
    Includes OCR analysis for a more accurate preview if screenshots are provided.
    """
    # 0. Sanitize all text inputs
    report_type = _sanitize_text(report_type)
    url = _sanitize_text(url)
    summary = _sanitize_text(summary)
    sender_numbers = _sanitize_text(sender_numbers)
    bank_name = _sanitize_text(bank_name)
    bank_account = _sanitize_text(bank_account)
    reference_number = _sanitize_text(reference_number)
    _validate_report_inputs(url, report_type, summary, sender_numbers, bank_name, bank_account, reference_number)

    # 1. Volatile OCR for preview
    combined_ocr_text = ""
    if screenshots:
        screenshot_bytes: List[bytes] = []
        for ss in screenshots[:10]:
            try:
                content = await ss.read()
                await ss.seek(0)
                if content:
                    screenshot_bytes.append(content)
            except Exception as e:
                print(f"Preview OCR Read Error: {e}")

        if screenshot_bytes:
            ocr_results = await asyncio.gather(
                *[
                    asyncio.to_thread(ocr_engine.extract_text_from_bytes, content)
                    for content in screenshot_bytes
                ],
                return_exceptions=True,
            )
            for result in ocr_results:
                if isinstance(result, Exception):
                    print(f"Preview OCR Error: {result}")
                    continue
                if result:
                    combined_ocr_text += f"\n{result}"
    elif screenshot_path:
        processed = await _download_supabase_screenshot_and_extract_text(screenshot_path, supabase_service)
        if processed and processed["text"]:
            combined_ocr_text += f"\n{processed['text']}"

    # --- GLOBAL VALIDATIONS ---
    is_transaction = report_type == "Transaction"
    blacklisted_entry = None
    account_blacklisted = False
    ref_found = False
    ref_valid = False
    global_flags = []

    # 1. Global Account Blacklist Check
    target_account = bank_account if bank_account else (sender_numbers if is_transaction else "")
    if target_account:
        blacklisted_acc = _check_account_blacklist(db, target_account)
        if blacklisted_acc:
            account_blacklisted = True
            global_flags.append("BLACKLISTED_ACCOUNT")

    # 1b. Global Phone & Email Blacklist Check
    if sender_numbers and not is_transaction:
        if "@" in sender_numbers:
            if _check_email_blacklist(db, sender_numbers):
                account_blacklisted = True
                global_flags.append("BLACKLISTED_EMAIL")
        else:
            if _check_phone_blacklist(db, sender_numbers):
                account_blacklisted = True
                global_flags.append("BLACKLISTED_PHONE")

    # Check indicators extracted by OCR
    indicators = ocr_engine.find_indicators(combined_ocr_text)
    for phone in indicators["phones"]:
        if _check_phone_blacklist(db, phone):
            account_blacklisted = True
            if "BLACKLISTED_PHONE" not in global_flags:
                global_flags.append("BLACKLISTED_PHONE")
    for email in indicators["emails"]:
        if _check_email_blacklist(db, email):
            account_blacklisted = True
            if "BLACKLISTED_EMAIL" not in global_flags:
                global_flags.append("BLACKLISTED_EMAIL")

    # 2. Global Reference Validation (OCR text or manual input)
    ref_no = ocr_engine.extract_reference_number(combined_ocr_text)
    if not ref_no and reference_number:
        ref_no = reference_number
    
    if ref_no:
        ref_found = True
        valid_tx = _validate_transaction(db, ref_no)
        if valid_tx:
            ref_valid = True

    # 3. URL Blacklist (for non-transaction reports)
    if not is_transaction and url:
        blacklisted_entry = _check_blacklist(db, url)

    # 4. Specific Social Engineering Mutation Check
    mutation_not_found = False
    mutation_found = False
    if "salah" in (summary + combined_ocr_text).lower():
        mutation_valid = _check_mutation_exists(db, summary, combined_ocr_text, bank_account or sender_numbers, bank_name)
        if mutation_valid:
            mutation_found = True
        else:
            mutation_not_found = True
    # --------------------------

    # 3. Rule Engine calculation
    # We combine summary and OCR text for rule engine too in preview
    full_text_context = f"{summary}\n{combined_ocr_text}".strip()
    
    att_list = []
    if attachment_path:
        att_list.append(os.path.basename(attachment_path))

    rule_analysis = rule_engine.calculate_risk(
        url=url,
        attachments=att_list or None,
        sender_numbers=sender_numbers,
        extracted_text=full_text_context,
        is_transaction=is_transaction,
        ref_found=ref_found,
        ref_valid=ref_valid,
        account_blacklisted=account_blacklisted,
        mutation_not_found=mutation_not_found,
        mutation_found=mutation_found
    )
    
    # Add our global flags to rule analysis
    for gf in global_flags:
        if gf not in rule_analysis["flags"]:
            rule_analysis["flags"].append(gf)
    rule_score: float = rule_analysis["score"]

    if blacklisted_entry:
        rule_score = 100.0
        if "domain_blacklisted" not in rule_analysis["flags"]:
            rule_analysis["flags"].append("domain_blacklisted")

    # 4. Hybrid scoring (Rule 35% + ML 65%)
    if blacklisted_entry or account_blacklisted or (is_transaction and ref_found and not ref_valid):
        final_score = 100.0
        hybrid = {
            "final_score": 100.0,
            "rule_score": 100.0,
            "ml_score": 100.0,
            "ml_category": "phishing",
            "ml_confidence": 100.0,
            "ml_available": True,
            "rule_weight": 100,
            "ml_weight": 0,
            "formula": "final = 100 (Blacklisted/Invalid Ref)"
        }
        if "BLACKLISTED" not in rule_analysis["flags"] and (blacklisted_entry or account_blacklisted):
             rule_analysis["flags"].append("BLACKLISTED")
    else:
        # Restore standard hybrid scoring (35% Rule + 65% ML)
        hybrid = _compute_hybrid_score(rule_score, full_text_context or url, only_ml=False)
        final_score = hybrid["final_score"]

    # --- Context-Aware Scoring Override (Preview) ---
    is_scam_scenario = any("scam_scenario:" in f for f in rule_analysis["flags"])
    is_valid_ref = "VERIFIED_BY_BANK" in rule_analysis["flags"]
    is_any_blacklisted = blacklisted_entry is not None or account_blacklisted

    if not url.strip() and (is_scam_scenario or is_valid_ref) and not is_any_blacklisted:
        final_score = round((rule_score * 0.8) + (hybrid["ml_score"] * 0.2), 2)
        hybrid["rule_weight"] = 80
        hybrid["ml_weight"] = 20
        hybrid["formula"] = "final = rule×0.80 + ml×0.20 (Verification Override)"
    
    if is_any_blacklisted:
        final_score = 100.0
        hybrid["rule_weight"] = 100
        hybrid["ml_weight"] = 0
    # -----------------------------------------------

    return {
        **rule_analysis,
        "score": final_score,
        "rule_score": hybrid["rule_score"],
        "ml_score": hybrid["ml_score"],
        "ml_category": hybrid["ml_category"],
        "ml_confidence": hybrid["ml_confidence"],
        "rule_weight": hybrid.get("rule_weight", 35),
        "ml_weight": hybrid.get("ml_weight", 65),
        "hybrid_formula": hybrid.get("formula"),
        "extracted_ocr_text": combined_ocr_text.strip(),
        "is_blacklisted": blacklisted_entry is not None or account_blacklisted
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


class ExplainRequest(BaseModel):
    report_type: str = ""
    url: str = ""
    summary: str = ""
    score: float = 0
    priority: str = "Low"
    ml_category: str = ""
    flags: list[str] = []
    detected_scam_type: str = ""


@router.post(
    "/analyze/explain",
    summary="Generate a brief AI explanation for the analysis result (UI only, not stored)",
)
def analyze_explain(request: ExplainRequest):
    """
    Call Gemini AI to produce a concise 1-2 sentence explanation of why the
    system classified the user's input the way it did. This is purely for
    UI display on the Report Confirmation page — the result is never stored.
    Falls back to a deterministic template if Gemini is unavailable.
    """
    flags_str = ", ".join(request.flags) if request.flags else "none"
    prompt = f"""You are a cybersecurity assistant for a bank's anti-phishing system.
Generate a VERY BRIEF explanation (1-2 short sentences, max 40 words total) for a bank customer.
Explain what the user submitted and why the system gave the result it did.
Use clear, simple English. Do NOT use markdown. Do NOT use first-person voice.

USER INPUT:
- Type: {request.report_type}
- URL/Indicator: {request.url or 'N/A'}
- Summary: {(request.summary or '')[:300]}

SYSTEM RESULT:
- Risk Score: {request.score}/100 ({request.priority})
- ML Prediction: {request.ml_category or 'N/A'}
- Flags: {flags_str}
- Detected Scenario: {request.detected_scam_type or 'N/A'}

Generate the explanation now:"""

    try:
        client = GeminiClient.get_client()
        if client and not GeminiClient.is_circuit_open():
            from google.genai import types as gtypes
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=gtypes.GenerateContentConfig(
                    safety_settings=[
                        gtypes.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='BLOCK_NONE'),
                    ]
                )
            )
            explanation = response.text.strip()
            if explanation:
                return {"explanation": explanation}
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            GeminiClient.rotate_key_on_exhaustion(GeminiClient.extract_retry_delay(Exception(err)))
        print(f"[Gemini Explain] Error: {err}")

    risk = "high risk" if request.score >= 70 else "medium risk" if request.score >= 40 else "low risk"
    fallback = (
        f"The {request.report_type.lower() or 'reported content'} "
        f"{f'({request.url}) ' if request.url else ''}"
        f"was flagged as {risk} (score: {request.score:.0f}/100). "
        f"System detected the following indicators: {flags_str}. "
        f"Please review the details above and contact your bank if you shared any personal information."
    )
    return {"explanation": fallback}
