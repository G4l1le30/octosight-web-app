from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
from datetime import datetime, timedelta
import os
import random
import time
import sys
import shutil
import uuid
import hashlib
from typing import List, Optional

from passlib.context import CryptContext
from jose import JWTError, jwt

# Core Engines
from core.rule_engine import RuleEngine
from core.ocr_engine import OCREngine

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="OctoSight API")

# ==================== JWT & AUTH CONFIG ====================
SECRET_KEY = os.getenv("SECRET_KEY", "octosight-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ==================== FILE STORAGE ====================
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== DATABASE ====================
MYSQL_USER = os.getenv("MYSQL_USER", "octouser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "octopassword")
MYSQL_DB = os.getenv("MYSQL_DATABASE", "octosight_db")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
WHITELIST_PATH = os.getenv("WHITELIST_PATH", "/app/data/whitelist.txt")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== MODELS ====================

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
    sender_numbers = Column(String(500))
    extracted_text = Column(Text)
    attachment_names = Column(String(500))
    attachment_paths = Column(String(1000))
    screenshot_paths = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ==================== SCHEMAS ====================

class ReportCreate(BaseModel):
    url: str
    type: str
    summary: str = ""

class TicketUpdate(BaseModel):
    status: str = None
    priority: str = None
    investigation_notes: str = None

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# ==================== AUTH DEPENDENCIES ====================

def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Extract and validate JWT from httpOnly cookie."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(current_user = Depends(get_current_user)):
    """Ensure the current user has admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== SEED & MIGRATIONS ====================

def seed_db():
    db = SessionLocal()
    try:
        # Seed admin user
        admin = db.query(User).filter(User.email == "admin@octosight.id").first()
        if not admin:
            admin_user = User(
                id=str(uuid.uuid4()),
                full_name="OctoSight Admin",
                email="admin@octosight.id",
                hashed_password=hash_password("admin1234"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Admin user seeded: admin@octosight.id / admin1234")

        # Seed dummy tickets
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
                db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    retries = 10
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            apply_migrations()
            seed_db()
            return
        except OperationalError:
            retries -= 1
            time.sleep(5)

rule_engine = RuleEngine(whitelist_path=WHITELIST_PATH)
ocr_engine = OCREngine()

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/v1/auth/register")
def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """Register a new user account. Role is always 'user'."""
    if not data.full_name or len(data.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters")
    if not data.email or "@" not in data.email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    if not data.password or len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    response.set_cookie(
        key="access_token", value=token,
        httponly=True, samesite="lax", max_age=86400, path="/"
    )
    return {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role}

@app.post("/api/v1/auth/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate user and set httpOnly JWT cookie."""
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    response.set_cookie(
        key="access_token", value=token,
        httponly=True, samesite="lax", max_age=86400, path="/"
    )
    return {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role}

@app.get("/api/v1/auth/me")
def get_me(current_user = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

@app.post("/api/v1/auth/logout")
def logout(response: Response):
    """Clear the auth cookie."""
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PUBLIC ENDPOINTS ====================

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
            indicators = ocr_engine.find_indicators(text)
            if indicators["urls"] and not url:
                url = indicators["urls"][0]

    # Process Attachments
    if attachments:
        orig_names = []
        hashed_paths = []
        for file in attachments:
            orig_names.append(file.filename)
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

    combined_text = "\n---\n".join(all_extracted_text)
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

@app.get("/api/v1/tickets/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Public endpoint for users to track their ticket status."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

# ==================== ADMIN ENDPOINTS (Protected) ====================

@app.get("/api/v1/tickets")
def get_tickets(db: Session = Depends(get_db), admin = Depends(require_admin)):
    """Get all tickets. Admin only."""
    return db.query(Ticket).order_by(Ticket.risk_score.desc()).all()

@app.patch("/api/v1/tickets/{ticket_id}")
def update_ticket(ticket_id: str, update: TicketUpdate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    """Update ticket status/notes. Admin only."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    if update.status: ticket.status = update.status
    if update.priority: ticket.priority = update.priority
    if update.investigation_notes is not None: ticket.investigation_notes = update.investigation_notes
    db.commit(); db.refresh(ticket)
    return ticket

@app.get("/api/v1/admin/download/{filename}")
def download_file(filename: str, admin = Depends(require_admin)):
    """Download evidence file. Admin only."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
