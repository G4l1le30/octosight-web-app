from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
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

# Core Engines
from core.rule_engine import RuleEngine
from core.ocr_engine import OCREngine

app = FastAPI(title="OctoSight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Config
MYSQL_USER = os.getenv("MYSQL_USER", "octouser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "octopassword")
MYSQL_DB = os.getenv("MYSQL_DATABASE", "octosight_db")
MYSQL_HOST = os.getenv("MYSQL_HOST", "db")
WHITELIST_PATH = os.getenv("WHITELIST_PATH", "/app/data/whitelist.txt")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
    investigation_notes = Column(Text) # Added for Investigate Page
    created_at = Column(DateTime, default=datetime.utcnow)

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

@app.on_event("startup")
def startup_event():
    retries = 10
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
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
def create_report(report: ReportCreate, db: Session = Depends(lambda: SessionLocal())):
    analysis = rule_engine.calculate_risk(report.url)
    db_report = Ticket(
        ticket_id=f"OCTO-{random.randint(1000, 9999)}",
        url=report.url, type=report.type, summary=report.summary,
        risk_score=analysis["score"], priority=analysis["priority"],
        flags=",".join(analysis["flags"]), status="Submitted"
    )
    db.add(db_report); db.commit(); db.refresh(db_report)
    return db_report

@app.get("/api/v1/tickets")
def get_tickets(db: Session = Depends(lambda: SessionLocal())):
    return db.query(Ticket).order_by(Ticket.risk_score.desc()).all()

@app.get("/api/v1/tickets/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(lambda: SessionLocal())):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.patch("/api/v1/tickets/{ticket_id}")
def update_ticket(ticket_id: str, update: TicketUpdate, db: Session = Depends(lambda: SessionLocal())):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    if update.status: ticket.status = update.status
    if update.priority: ticket.priority = update.priority
    if update.investigation_notes is not None: ticket.investigation_notes = update.investigation_notes
    
    db.commit(); db.refresh(ticket)
    return ticket
