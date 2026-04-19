from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
from datetime import datetime
import os
import random
import time
import sys
import shutil
import uuid
import hashlib
from typing import List, Optional

# Core Engines
from core.rule_engine import RuleEngine
from core.ocr_engine import OCREngine

from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import FileResponse

app = FastAPI(title="OctoSight API")
security = HTTPBasic()

# Admin credentials
ADMIN_USER = "admin"
ADMIN_PASS = "admin1234"

def authenticate_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != ADMIN_USER or credentials.password != ADMIN_PASS:
        raise HTTPException(
            status_code=401,
            detail="Incorrect admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Serve uploads folder for admin viewing
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/v1/admin/download/{filename}")
def download_file(filename: str, username: str = Depends(authenticate_admin)):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return as attachment with forced download to prevent execution in browser
    return FileResponse(
        path=file_path, 
        filename=filename,
        media_type='application/octet-stream',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (DB config stays same)
MYSQL_USER = os.getenv("MYSQL_USER", "octouser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "octopassword")
MYSQL_DB = os.getenv("MYSQL_DATABASE", "octosight_db")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
WHITELIST_PATH = os.getenv("WHITELIST_PATH", "/app/data/whitelist.txt")

# Define paths for file storage
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ... (SQLAlchemy setup stays same)
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, index=True)
    url = Column(String(255))
    type = Column(String(50))
    summary = Column(String(500))
    risk_score = Column(Float)
    status = Column(String(50), default="Submitted")
    priority = Column(String(50))
    flags = Column(String(500))
    investigation_notes = Column(Text)
    sender_numbers = Column(String(500)) # Comma separated
    extracted_text = Column(Text)
    attachment_names = Column(String(500)) # Original filenames, comma separated
    attachment_paths = Column(String(1000)) # Hashed filenames for storage, comma separated
    screenshot_paths = Column(String(1000)) # Comma separated paths for images
    created_at = Column(DateTime, default=datetime.utcnow)

# ... (seed_db stays mostly same, but maybe update it if needed)

# Schemas
class ReportCreate(BaseModel):
    url: str
    type: str
    summary: str = ""

class TicketUpdate(BaseModel):
    status: str = None
    priority: str = None
    investigation_notes: str = None

# Init & Seed
def seed_db():
    db = SessionLocal()
    try:
        if db.query(Ticket).count() == 0:
            dummy_tickets = [
                Ticket(ticket_id="OCTO-8825", url="https://clmbniaga-bonus.tk/claim", type="Website", risk_score=95, priority="High", status="Submitted", flags="punycode_detected,suspicious_tld"),
                Ticket(ticket_id="OCTO-8821", url="https://cimb-niaga-verif.net/login", type="Website", risk_score=92, priority="High", status="In Review", flags="brand_impersonation"),
                Ticket(ticket_id="OCTO-8822", url="https://security-cimb.xyz/blocked", type="Website", risk_score=88, priority="High", status="Submitted", flags="suspicious_tld"),
            ]
            db.add_all(dummy_tickets)
            db.commit()
    finally:
        db.close()

def apply_migrations():
    db = SessionLocal()
    try:
        from sqlalchemy import text
        # List of columns to ensure exist
        cols = {
            "sender_numbers": "VARCHAR(500)",
            "extracted_text": "TEXT",
            "attachment_names": "VARCHAR(500)",
            "attachment_paths": "VARCHAR(1000)",
            "screenshot_paths": "VARCHAR(1000)",
            "investigation_notes": "TEXT"
        }
        for col, type_info in cols.items():
            try:
                db.execute(text(f"ALTER TABLE tickets ADD COLUMN {col} {type_info}"))
                db.commit()
                print(f"Added missing column: {col}")
            except:
                db.rollback() # Column likely already exists
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    retries = 10
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            apply_migrations() # Add missing columns if table already exists
            seed_db()
            return
        except OperationalError:
            retries -= 1
            time.sleep(5)

rule_engine = RuleEngine(whitelist_path=WHITELIST_PATH)
ocr_engine = OCREngine()

# --- Endpoints ---

@app.get("/")
def read_root(): return {"status": "OctoSight API Active"}

@app.post("/api/v1/report")
async def create_report(
    url: str = Form(""),
    type: str = Form(...),
    summary: str = Form(""),
    sender_numbers: str = Form(""),
    screenshots: List[UploadFile] = File(None),
    attachments: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    all_extracted_text = []
    attachment_list = []
    screenshot_list = []
    
    # Process Screenshots (OCR)
    if screenshots:
        for file in screenshots:
            if not file.content_type.startswith("image/"):
                continue
            
            # Create a salted hash for the filename
            ext = os.path.splitext(file.filename)[1]
            salt = uuid.uuid4().hex
            file_hash = hashlib.sha256(f"{file.filename}{salt}{time.time()}".encode()).hexdigest()[:20]
            filename = f"screenshot_{file_hash}{ext}"
            
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            screenshot_list.append(filename)
            text = ocr_engine.extract_text(file_path)
            all_extracted_text.append(text)
            
            # Find indicators in OCR text and add to summary for analysis
            indicators = ocr_engine.find_indicators(text)
            # If we found URLs in images, we should analyze them too
            if indicators["urls"] and not url:
                url = indicators["urls"][0] # Use first found URL if none provided

    # Process Attachments
    if attachments:
        orig_names = []
        hashed_paths = []
        for file in attachments:
            orig_names.append(file.filename)
            # Create a salted hash for the filename
            ext = os.path.splitext(file.filename)[1]
            salt = uuid.uuid4().hex
            file_hash = hashlib.sha256(f"{file.filename}{salt}{time.time()}".encode()).hexdigest()[:20]
            filename = f"attachment_{file_hash}{ext}"
            
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            hashed_paths.append(filename)
            
        attachment_names = ",".join(orig_names)
        attachment_paths = ",".join(hashed_paths)
    else:
        attachment_names = ""
        attachment_paths = ""

    # Analyze Risk
    sender_list = [n.strip() for n in sender_numbers.split(",") if n.strip()]
    analysis = rule_engine.calculate_risk(
        url=url, 
        attachments=orig_names if attachments else None, 
        sender_numbers=sender_list
    )
    
    # Combined Flags
    combined_text = "\n---\n".join(all_extracted_text)
    
    # Generate a more secure, longer Ticket ID
    secure_id = f"OCTO-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    
    db_report = Ticket(
        ticket_id=secure_id,
        url=url, 
        type=type, 
        summary=summary,
        sender_numbers=sender_numbers,
        extracted_text=combined_text,
        attachment_names=attachment_names,
        attachment_paths=attachment_paths,
        screenshot_paths=",".join(screenshot_list),
        risk_score=analysis["score"], 
        priority=analysis["priority"],
        flags=",".join(analysis["flags"]), 
        status="Submitted"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@app.get("/api/v1/tickets")
def get_tickets(db: Session = Depends(get_db), username: str = Depends(authenticate_admin)):
    return db.query(Ticket).order_by(Ticket.risk_score.desc()).all()

@app.get("/api/v1/tickets/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    # This remains public for users to track their status
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.patch("/api/v1/tickets/{ticket_id}")
def update_ticket(ticket_id: str, update: TicketUpdate, db: Session = Depends(get_db), username: str = Depends(authenticate_admin)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    if update.status: ticket.status = update.status
    if update.priority: ticket.priority = update.priority
    if update.investigation_notes is not None: ticket.investigation_notes = update.investigation_notes
    
    db.commit(); db.refresh(ticket)
    return ticket
