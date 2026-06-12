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

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_optional_user, limiter
from app.db.session import SessionLocal, get_db
from app.models.models import Ticket, User, BlacklistedURL, BlacklistedAccount, MockBankTransaction, BlacklistedPhone, BlacklistedEmail
from pydantic import BaseModel
from app.schemas.schemas import AnalysisRequest, MessageRequest, SpamPredictionResponse
from app.core.engines import analyze_spam, ocr_engine, rule_engine
from app.core.virustotal_engine import VirusTotalEngine
from app.modules.education.gemini_service import GeminiEducationService
from app.modules.education.gemini.client import GeminiClient
try:
    from app.core.cache import explain_cache
except ImportError:
    explain_cache = None
from app.api.endpoints.blacklist import normalize_url_for_match, _extract_domain
from app.modules.activity.service import ActivityService
from app.modules.notifications.service import NotificationService, send_email_notification, send_email_async
from app.services.supabase_service import get_supabase_service, SupabaseStorageService

router = APIRouter(prefix="/api/v1", tags=["detection"])
ADMIN_NOTIFICATION_EMAIL = "octosight.id@gmail.com"


# ── Input Sanitization & Validation ───────────────────────────────────────────

import re as _re

_HTML_TAG_RE = _re.compile(r"<[^>]*>")
_EVENT_HANDLER_RE = _re.compile(r"\bon\w+\s*=", _re.IGNORECASE)
_DANGEROUS_PROTOCOL_RE = _re.compile(r"(?:javascript|data|vbscript)\s*:", _re.IGNORECASE)


def _sanitize_text(value: str) -> str:
    """Strip HTML tags, dangerous protocols, and event handlers from user input."""
    value = _DANGEROUS_PROTOCOL_RE.sub("", value)
    value = _EVENT_HANDLER_RE.sub("disabled=", value)
    value = _HTML_TAG_RE.sub("", value)
    return value.strip()


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

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".pdf", ".doc", ".docx", ".txt", ".csv", ".xlsx", ".zip"}

def _validate_extension(filename: str) -> str:
    """Validate file extension against whitelist. Returns the extension or raises 400."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    return ext


# ── Internal helpers ──────────────────────────────────────────────────────────

def _compute_hybrid_score(rule_score: float, combined_text: str, only_ml: bool = False) -> dict:
    """
    Compute the hybrid (rule + ML) risk score.
    If only_ml is True, the rule score is ignored (except for hard checks).
    """
    try:
        ml_result = analyze_spam(combined_text) if combined_text.strip() else {}
    except Exception as _ml_err:
        ml_result = {"error": f"ML engine error: {_ml_err}"}

    if "error" in ml_result or not ml_result:
        # ML unavailable — fall back to 100% rule score
        ml_score = rule_score
        ml_category = "unavailable"
        ml_confidence = 0.0
        ml_available = False
    else:
        ml_category = ml_result["category"]
        ml_confidence = ml_result["confidence"]

        # Normalize legacy ML labels: ham → not phishing
        if ml_category == "ham":
            ml_category = "not phishing"

        # Convert ML output into a 0-100 phishing-probability score
        if ml_category == "phishing":
            ml_score = ml_confidence          # e.g. 96.2 → 96.2
        else:
            ml_score = 100.0 - ml_confidence  # e.g. 98.1 → 1.9

        ml_available = True

    # OctoSight Aturan #2: rule 35% + ML 65%
    # Weight selection based on context
    text_len = len(combined_text.strip())

    if only_ml and ml_available:
        final_score = ml_score
        formula = "final = ml\xd71.00 (URL missing)"
        rule_weight = 0
        ml_weight = 100
    elif text_len < 50 and ml_available:
        # Text too short for reliable ML analysis — rule engine dominates
        final_score = round((rule_score * 0.80) + (ml_score * 0.20), 2)
        formula = "final = rule\xd70.80 + ml\xd70.20 (insufficient text)"
        rule_weight = 80
        ml_weight = 20
    else:
        final_score = round((rule_score * 0.35) + (ml_score * 0.65), 2)
        formula = "final = rule\xd70.35 + ml\xd70.65"
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


def _admin_notification_users(db: Session) -> list[User]:
    """Return admin recipients for in-app operational notifications."""
    users = db.query(User).filter(
        (User.email == ADMIN_NOTIFICATION_EMAIL) | (User.role == "admin")
    ).all()
    seen: set[str] = set()
    unique_users: list[User] = []
    for user in users:
        if user.id in seen:
            continue
        seen.add(user.id)
        unique_users.append(user)
    return unique_users


def _notify_admin_report_submitted(
    db: Session,
    background_tasks: BackgroundTasks,
    ticket: Ticket,
    reporter: User,
) -> None:
    """Notify admins by email and in-app when a user submits a report."""
    indicator = ticket.url or ticket.sender_numbers or ticket.bank_account or "N/A"
    reporter_email = reporter.email or "unknown reporter"
    body = f"{ticket.type or 'Report'} report from {reporter_email}: {indicator}"
    link = f"/admin/investigate/{ticket.ticket_id}"

    admin_users = _admin_notification_users(db)
    if admin_users:
        NotificationService.create_notification(
            db=db,
            user_id=admin_users[0].id,
            notification_type="ticket_created",
            title=f"New report from {reporter_email}",
            body=body,
            link=link,
        )

    send_email_notification(
        background_tasks=background_tasks,
        subject=f"OctoSight: New report from {reporter_email} [{ticket.ticket_id}]",
        email_to=ADMIN_NOTIFICATION_EMAIL,
        template_name="form_submit.html",
        template_body={
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
            "gemini_warnings": [],
            "gemini_actions": [],
            "gemini_tips": [],
            "reporter_email": reporter_email,
            "link": link,
        },
    )


def _save_upload(file: UploadFile, prefix: str, subfolder: str = "") -> str:
    """Save an uploaded file to UPLOAD_DIR (optionally in a subfolder). Returns relative filename."""
    _validate_extension(file.filename or "")
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
    _validate_extension(original_filename)
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
) -> Optional[dict]:
    """
    Upload one attachment (image or PDF) to Supabase Storage.
    Returns a dict with Supabase filename and VT report, or None on error.
    """
    content = await file.read()
    if not content:
        return None

    # VirusTotal Scan (Hash-based)
    file_hash = VirusTotalEngine.calculate_sha256(content)
    vt_report = await VirusTotalEngine.check_file_hash(file_hash)

    try:
        ext = os.path.splitext(file.filename or "attachment")[1].lstrip(".").lower() or "bin"
        supabase_filename = f"{ticket_id}/attachment_{uuid.uuid4().hex}.{ext}"

        content_type_map = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "pdf": "application/pdf",
            "exe": "application/x-msdownload",
            "zip": "application/zip",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        ct = content_type_map.get(ext, "application/octet-stream")
        await asyncio.to_thread(
            supabase_service.upload_file,
            content,
            supabase_filename,
            ct,
        )
        saved_path = supabase_filename
    except Exception as e:
        print(f"[attachment upload] Supabase failed, falling back to disk: {e}")
        saved_path = await asyncio.to_thread(
            _save_upload_bytes, content, file.filename or "attachment", "attachment", ticket_id
        )

    return {
        "path": saved_path,
        "vt_report": vt_report,
        "filename": file.filename or "attachment"
    }


async def _generate_education_recommendation_for_ticket(ticket_id: str, user_email: Optional[str] = None) -> None:
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
                template_name="user_submit_confirmation.html",
                template_body=template_body
            )
            
    except Exception as e:
        print(f"Failed to generate education recommendation: {e}")
    finally:
        db.close()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/report", summary="Submit a phishing/fraud report")
@limiter.limit("5/minute")
async def create_report(
    request: Request,
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

    # 3. Process attachments: upload to Supabase + VT Scan
    vt_reports_list = []
    if attachments:
        for file in attachments:
            orig_attachment_names.append(file.filename or "attachment")
            processed = await _persist_attachment_to_supabase(file, ticket_id, supabase_service)
            if processed:
                hashed_attachment_paths.append(processed["path"])
                if processed.get("vt_report"):
                    vt_reports_list.append({
                        "filename": processed["filename"],
                        "report": processed["vt_report"]
                    })

    # 4. Rule-based analysis
    combined_text = "\n---\n".join(all_extracted_text)
    
    # --- GLOBAL VALIDATIONS ---
    is_transaction = report_type == "Transaction"
    blacklisted_entry = None
    account_blacklisted = False
    ref_found = False
    ref_valid = False
    global_flags = []

    # VirusTotal Risk Penalty
    vt_malicious_found = False
    for vtr in vt_reports_list:
        rep = vtr["report"]
        malicious_count = rep.get("malicious", 0)
        suspicious_count = rep.get("suspicious", 0)
        
        if malicious_count > 10:
            vt_malicious_found = True
            global_flags.append("VIRUSTOTAL_MALICIOUS")
        elif malicious_count > 0 or suspicious_count > 0:
            if malicious_count > 0: vt_malicious_found = True
            global_flags.append("VIRUSTOTAL_WARNING")

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

    is_whitelisted = "on_whitelist" in flags

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
    elif is_whitelisted:
        # Skip ML entirely for whitelisted URLs — all scores 0
        hybrid = {
            "final_score": 0.0,
            "rule_score": 0.0,
            "ml_score": 0.0,
            "ml_category": "not phishing",
            "ml_confidence": 100.0,
            "ml_available": True,
            "rule_weight": 100,
            "ml_weight": 0,
            "formula": "final = 0 (Whitelisted)"
        }
        if "WHITELISTED" not in flags:
            flags.append("WHITELISTED")
    else:
        # Restore standard hybrid scoring (35% Rule + 65% ML)
        hybrid = _compute_hybrid_score(rule_score, ml_input_text, only_ml=False)
    
    final_score = hybrid["final_score"]

    # --- Context-Aware Scoring Override ---
    is_scam_scenario = any("scam_scenario:" in f for f in flags)
    is_valid_ref = "VERIFIED_BY_BANK" in flags
    is_any_blacklisted = blacklisted_entry or account_blacklisted
    is_whitelisted = "on_whitelist" in flags
    is_gibberish = any("GIBBERISH_TEXT:" in f for f in flags)

    # Gibberish override — ML confidently says "not phishing" but the rule engine
    # found the text is meaningless/junk. Bump score so gibberish isn't hidden
    # by the ML's 65% weight.
    if is_gibberish and not is_any_blacklisted and not is_whitelisted:
        # Rule engine already applied a boost; ensure it isn't washed out by ML
        boosted = round((rule_score * 0.70) + (hybrid["ml_score"] * 0.30), 2)
        if boosted > final_score:
            final_score = boosted
            hybrid["rule_weight"] = 70
            hybrid["ml_weight"] = 30
            hybrid["formula"] = "final = rule×0.70 + ml×0.30 (Gibberish Override)"
            print(f"[Override] Gibberish override triggered (70/30). Final score: {final_score}")

    if not url.strip() and (is_scam_scenario or is_valid_ref) and not is_any_blacklisted and not is_whitelisted:
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
    
    # VirusTotal Penalty (Malicious file found)
    if vt_malicious_found:
        if final_score < 80.0:
            final_score = 80.0
            hybrid["formula"] += " + VirusTotal Malicious Penalty (min 80)"
            print(f"[Override] VT Malicious detected. Risk score set to {final_score}")
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
        "virustotal_analysis": vt_reports_list,
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

    from app.modules.detection.similarity import invalidate_cache as invalidate_similarity_cache
    invalidate_similarity_cache()

    ActivityService.log_ticket_created(
        db, current_user.id, db_ticket.ticket_id,
        f"Report submitted: {report_type}: {url or sender_numbers or 'N/A'}",
    )

    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        notification_type="ticket_created",
        title="Report submitted",
        body=f"{report_type} report: {url or sender_numbers or 'N/A'}",
        link=f"/report/{db_ticket.ticket_id}",
    )

    _notify_admin_report_submitted(db, background_tasks, db_ticket, current_user)

    from app.modules.gamification.service import GamificationService
    GamificationService.add_points_and_check_achievements(
        db, current_user.id, 10, "report"
    )

    email_param = current_user.email if current_user and current_user.email else None
    asyncio.create_task(
        _generate_education_recommendation_for_ticket(db_ticket.id, email_param)
    )

    return db_ticket


@router.post("/analyze", summary="Preview risk score without saving")
@limiter.limit("10/minute")
async def analyze_preview(
    request: Request,
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
    _=Depends(get_optional_user),
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
    is_whitelisted = "on_whitelist" in rule_analysis["flags"]

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
    elif is_whitelisted:
        # Skip ML entirely for whitelisted URLs — all scores 0
        hybrid = {
            "final_score": 0.0,
            "rule_score": 0.0,
            "ml_score": 0.0,
            "ml_category": "not phishing",
            "ml_confidence": 100.0,
            "ml_available": True,
            "rule_weight": 100,
            "ml_weight": 0,
            "formula": "final = 0 (Whitelisted)"
        }
        final_score = 0.0
    else:
        # Restore standard hybrid scoring (35% Rule + 65% ML)
        hybrid = _compute_hybrid_score(rule_score, full_text_context or url, only_ml=False)
        final_score = hybrid["final_score"]

    # --- Context-Aware Scoring Override (Preview) ---
    is_scam_scenario = any("scam_scenario:" in f for f in rule_analysis["flags"])
    is_valid_ref = "VERIFIED_BY_BANK" in rule_analysis["flags"]
    is_suspicious_verified = "VERIFIED_TRANSACTION_WITH_SUSPICIOUS_LINK" in rule_analysis["flags"]
    is_any_blacklisted = blacklisted_entry is not None or account_blacklisted
    is_whitelisted = "on_whitelist" in rule_analysis["flags"]

    if is_suspicious_verified:
        # High Risk override: Verified data used for phishing
        final_score = rule_score  # Should be 90
        hybrid["final_score"] = final_score
        hybrid["rule_weight"] = 100
        hybrid["ml_weight"] = 0
        hybrid["formula"] = "final = rule (Selective Phishing Detection)"
    elif not url.strip() and (is_scam_scenario or is_valid_ref) and not is_any_blacklisted and not is_whitelisted:
        final_score = round((rule_score * 0.8) + (hybrid["ml_score"] * 0.2), 2)
        hybrid["rule_weight"] = 80
        hybrid["ml_weight"] = 20
        hybrid["formula"] = "final = rule×0.80 + ml×0.20 (Verification Override)"
    
    if is_any_blacklisted:
        final_score = 100.0
        hybrid["rule_weight"] = 100
        hybrid["ml_weight"] = 0
    # -----------------------------------------------

    if not hybrid.get("ml_available", True):
        rule_analysis.setdefault("flags", []).append("ml_engine_offline")

    return {
        **rule_analysis,
        "score": final_score,
        "rule_score": hybrid["rule_score"],
        "ml_score": hybrid["ml_score"],
        "ml_category": hybrid["ml_category"],
        "ml_confidence": hybrid["ml_confidence"],
        "ml_available": hybrid.get("ml_available", True),
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
@limiter.limit("10/minute")
def predict_spam(
    request: Request,
    body: MessageRequest,
    current_user=Depends(get_optional_user),
):
    """
    Run the ML pipeline on a free-text message and return the predicted
    label ('phishing' / 'not phishing') and confidence percentage.
    Public — no login required.

    This endpoint is ML-only (no rule engine). Use /analyze for the full
    hybrid score.
    """
    try:
        result = analyze_spam(body.text)
    except Exception as e:
        err_msg = str(e)
        if "image" in err_msg.lower() and "not support" in err_msg.lower():
            result = {"error": "The analysis model only supports text input. Please provide text content instead of image files."}
        else:
            result = {"error": f"Analysis failed: {err_msg}"}
    return SpamPredictionResponse(message=body.text, data=result)


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
@limiter.limit("10/minute")
def analyze_explain(explain_req: ExplainRequest, request: Request):
    """
    Call Gemini AI to produce a concise 1-2 sentence explanation of why the
    system classified the user's input the way it did. This is purely for
    UI display on the Report Confirmation page — the result is never stored.
    Falls back to a deterministic template if Gemini is unavailable.
    """
    return _get_explanation(explain_req)


def _build_explain_prompt(request: ExplainRequest) -> tuple[str, str]:
    """Build the Gemini prompt and return (prompt, flags_str)."""
    flags_str = ", ".join(request.flags) if request.flags else "none"
    prompt = f"""You are a security analyst summarizing the suspicious report for a bank customer.
Write 2-3 short, factual sentences describing what the system detected.
Use simple, direct language and avoid reassurance or emotional tone.
Focus on observed risk indicators and report details.

What was reported: {request.report_type or 'something'}
URL: {request.url or 'N/A'}
Details: {(request.summary or '')[:200]}
Risk score: {request.score}/100 ({request.priority})
What the system saw: {flags_str}
Detected type: {request.detected_scam_type or 'N/A'}"""
    return prompt, flags_str


def _call_gemini_explain(request: ExplainRequest) -> str:
    """Call Gemini for an explanation. Raises on failure so the cache never stores empty."""
    prompt, _ = _build_explain_prompt(request)
    client = GeminiClient.get_client()
    if not client or GeminiClient.is_circuit_open():
        raise RuntimeError("Gemini unavailable (client or circuit open)")
    from google.genai import types as gtypes

    max_retries = 3
    last_err = None
    for attempt in range(1, max_retries + 1):
        model = GeminiClient.get_model()
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=gtypes.GenerateContentConfig(
                    safety_settings=[
                        gtypes.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='BLOCK_NONE'),
                    ]
                )
            )
            explanation = response.text.strip()
            if not explanation:
                raise RuntimeError("Gemini returned empty explanation")
            return explanation
        except Exception as e:
            last_err = e
            err_str = str(e)
            if "503" in err_str or "UNAVAILABLE" in err_str:
                GeminiClient.rotate_model_on_overload(retry_delay_seconds=15.0)
                if attempt < max_retries:
                    wait = 2 ** attempt
                    print(f"[Gemini Explain] 503 on model {model}, retry {attempt}/{max_retries} after {wait}s")
                    time.sleep(wait)
                continue
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                delay = GeminiClient.extract_retry_delay(e)
                GeminiClient.rotate_key_on_exhaustion(delay)
                if attempt < max_retries:
                    wait = 2 ** attempt
                    print(f"[Gemini Explain] 429 on key, retry {attempt}/{max_retries} after {wait}s")
                    time.sleep(wait)
                continue
            raise  # non-retryable error

    raise RuntimeError(f"Gemini explain failed after {max_retries} retries: {last_err}")


def _fallback_explain(request: ExplainRequest) -> str:
    """Deterministic fallback explanation when Gemini is unavailable."""
    flags_text = ", ".join(
        [f.replace("_", " ").replace(":", " ") for f in request.flags]
    ) if request.flags else "none"
    risk = "high risk" if request.score >= 70 else "medium risk" if request.score >= 40 else "low risk"
    target = request.url or "the reported item"
    return (
        f"The report for {target} was assigned a {risk} score of {request.score:.0f}/100. "
        f"The system identified indicators such as {flags_text}. "
        f"The evidence is consistent with a potential phishing attempt. "
        f"Review the details and verify the source before taking action."
    )


def _get_explanation(request: ExplainRequest) -> dict:
    """Generate explanation with server-side caching to reduce Gemini quota usage."""
    if explain_cache is not None:
        try:
            result = explain_cache.get_or_compute(_call_gemini_explain, request)
            return {"explanation": result}
        except Exception as e:
            _handle_gemini_error(e)
    else:
        try:
            result = _call_gemini_explain(request)
            return {"explanation": result}
        except Exception as e:
            _handle_gemini_error(e)
    return {"explanation": _fallback_explain(request)}


def _handle_gemini_error(e: Exception) -> None:
    err = str(e)
    if "503" in err or "UNAVAILABLE" in err:
        GeminiClient.rotate_model_on_overload(retry_delay_seconds=30.0)
    elif "429" in err or "RESOURCE_EXHAUSTED" in err:
        delay = GeminiClient.extract_retry_delay(e)
        if delay is not None:
            GeminiClient.rotate_key_on_exhaustion(delay)
    print(f"[Gemini Explain] Error: {err}")
