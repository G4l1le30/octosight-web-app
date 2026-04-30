from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Ticket, User, Base, hash_password
import os
import random
import uuid
from datetime import datetime, timedelta
import json

# DB Config
MYSQL_USER = os.getenv("MYSQL_USER", "octouser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "octopassword")
MYSQL_DB = os.getenv("MYSQL_DATABASE", "octosight_db")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed():
    db = SessionLocal()
    try:
        # 1. Cleanup existing data
        print("Cleaning up database...")
        db.query(Ticket).delete()
        db.query(User).delete()
        db.commit()

        # 2. Create Users
        print("Seeding users...")
        admin = User(
            id=str(uuid.uuid4()),
            full_name="OctoSight Admin",
            email="admin@octosight.id",
            hashed_password=hash_password("admin123"),
            role="admin"
        )
        user = User(
            id=str(uuid.uuid4()),
            full_name="OctoSight User",
            email="user@octosight.id",
            hashed_password=hash_password("user123"),
            role="user"
        )
        db.add(admin)
        db.add(user)
        db.commit()
        db.refresh(user)

        # 3. Create Dummy Tickets
        print("Seeding tickets...")
        types = ["Website", "SMS", "WhatsApp", "Email"]
        # Match TicketStatus enum from frontend types/ticket.ts
        statuses = ["Submitted", "In Review", "Confirmed", "False Positive", "Mitigated", "Closed"]
        
        sample_urls = [
            "https://clmbniaga.com/login",
            "http://bit.ly/cimb-promo-2024",
            "https://niaga-verifikasi.top/secure",
            "https://secure.cimb-octo.id/auth",
            "http://promo-cimb-niaga.site",
            "https://cimbniaga-login.web.app",
            "http://update-niaga.cc/portal"
        ]

        sample_summaries = [
            "Received a suspicious link via SMS claiming my account was locked.",
            "Website looks exactly like CIMB Clicks but the domain is strange.",
            "WhatsApp message promising a reward if I log in through this link.",
            "Found an ad on social media redirecting to this fake login portal.",
            "Email from 'CIMB Support' asking to verify my identity urgently."
        ]

        for i in range(25):
            risk_score = random.randint(5, 98)
            ticket_type = random.choice(types)
            status = random.choice(statuses)
            
            if risk_score > 70: priority = "High"
            elif risk_score > 35: priority = "Medium"
            else: priority = "Low"

            # Sophisticated flags
            available_flags = ["typosquatting", "mixed_scripts", "punycode", "shortener", "brand_impersonation", "suspicious_tld", "keywords_found"]
            current_flags = random.sample(available_flags, k=random.randint(1, 3)) if risk_score > 40 else []

            # Details status
            details = {
                "typosquatting": "Detected" if "typosquatting" in current_flags else "Safe",
                "keywords": "High Risk" if risk_score > 60 else "Clean",
                "attachments": "Malicious" if i % 10 == 0 else "Clean",
                "ocr": "Complete" if i % 2 == 0 else "N/A"
            }

            ticket = Ticket(
                ticket_id=f"OCTO-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                url=random.choice(sample_urls) if ticket_type == "Website" else None,
                type=ticket_type,
                summary=random.choice(sample_summaries),
                risk_score=risk_score,
                priority=priority,
                status=status,
                sender_numbers=f"08{random.randint(11111111, 99999999)}" if ticket_type != "Website" else None,
                extracted_text="VERIFIKASI AKUN ANDA SEGERA. LOGIN DI SINI." if i % 2 == 0 else None,
                attachment_names="invoice.pdf.exe" if i % 10 == 0 else None,
                attachment_paths="malicious_1.exe" if i % 10 == 0 else None,
                screenshot_paths="screenshot_1.png,screenshot_2.png" if i % 3 == 0 else "screenshot_1.png",
                flags=",".join(current_flags),
                analysis_results=json.dumps(details),
                investigation_notes=f"Admin investigated this {ticket_type} report on day {i}. Found potential threats." if status != "Submitted" else None,
                admin_notes="Priority assigned based on risk score." if priority == "High" else None,
                user_id=user.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
            )
            db.add(ticket)
        
        db.commit()
        print(f"Database seeded successfully with 25 diverse tickets!")
        print(f"Admin: admin@octosight.id / admin123")
        print(f"User: user@octosight.id / user123")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
