import os
import random
import uuid
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Load environment variables from the root .env file
load_dotenv()
from app.db.session import SessionLocal, engine
from app.models.models import Base, Ticket, User
from app.models.education import EducationModule, EducationArticle
from app.core.security import hash_password

# Configuration
DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@octosight.id")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
DEFAULT_USER_EMAIL = os.getenv("DEFAULT_USER_EMAIL", "user@octosight.id")
DEFAULT_USER_PASSWORD = os.getenv("DEFAULT_USER_PASSWORD", "user123")

# Education Data
EDUCATION_MODULES_DATA = [
    {
        "title": "Phishing Basics - Understanding Basic Threats",
        "level": "BASIC",
        "order_index": 1,
        "description": "Learn the definition of phishing, how it works, and the basic characteristics of phishing emails. This module provides the foundation for understanding the most common digital security threats.",
        "duration_mins": 30,
        "articles": [
            {
                "title": "How to Detect Phishing Emails: A Comprehensive Guide",
                "url": "https://medium.com/@how-to-identify-phishing-email/how-to-detect-phishing-emails-a-comprehensive-guide-694df7d1794f",
                "author": "Phil Rawlins",
                "duration_mins": 4,
                "publication_date": "2024-02-02",
                "description": "A comprehensive guide to identifying phishing emails focusing on scrutinizing sender addresses, grammatical errors, and unexpected attachments."
            },
            {
                "title": "Phishing Prevention - Learn How to Defend Against Phishing",
                "url": "https://medium.com/@demegorash/phishing-prevention-89579a326d7b",
                "author": "Demegorash",
                "duration_mins": 8,
                "publication_date": "2025-11-15",
                "description": "Learn about various security measures organizations can implement to prevent, detect, and mitigate phishing threats. Understand core email security controls (SPF, DKIM, DMARC, S/MIME)."
            },
            {
                "title": "Phishing Email — Ultimate Resources",
                "url": "https://hassen-hannachi.medium.com/phishing-email-ultimate-resources-60bba3e99fde",
                "author": "Hassen Hannachi",
                "duration_mins": 5,
                "publication_date": "2024-04-28",
                "description": "A compilation of tools and resources for analyzing phishing emails. Covers MXToolbox, VirusTotal, and other user-friendly analysis tools."
            }
        ]
    },
    {
        "title": "Phishing Prevention - Self-Defense Strategies",
        "level": "BEGINNER",
        "order_index": 2,
        "description": "Implementing best practices to prevent phishing. Learn email authentication protocols and technical steps that can be applied.",
        "duration_mins": 25,
        "articles": [
            {
                "title": "A Practical Approach of Phishing Detection Using Email Header",
                "url": "https://ghafoorazhar.medium.com/a-practical-approach-of-phishing-detection-using-email-header-4a8384c4e681",
                "author": "Azhar Ghafoor",
                "duration_mins": 4,
                "publication_date": "2022-04-27",
                "description": "A practical guide to analyzing email headers for phishing detection. Discusses SPF, DKIM setup, and identifying domain spoofing."
            }
        ]
    },
    {
        "title": "Social Engineering - Psychological Manipulation",
        "level": "INTERMEDIATE",
        "order_index": 3,
        "description": "Understanding various social engineering techniques and psychological manipulation. Increase awareness of more sophisticated scam scenarios.",
        "duration_mins": 30,
        "articles": [
            {
                "title": "How to Prevent Social Engineering Attacks",
                "url": "https://ip-specialist.medium.com/how-to-prevent-social-engineering-attacks-1b761e4c82ca",
                "author": "IPSpecialist",
                "duration_mins": 6,
                "publication_date": "2023-02-27",
                "description": "A comprehensive overview of social engineering attacks with a focus on defense mechanisms and warning signs to watch for."
            }
        ]
    },
    {
        "title": "Spear Phishing & Whaling - Targeted Attacks",
        "level": "INTERMEDIATE",
        "order_index": 4,
        "description": "Differentiating between mass phishing, spear phishing, and whaling. Understand the sophistication levels and targeting strategies of advanced attacks.",
        "duration_mins": 20,
        "articles": [
            {
                "title": "What is a Whaling Attack? Whale Phishing Explained",
                "url": "https://medium.com/@clouddefenseai/what-is-a-whaling-attack-whale-phishing-explained-bc215b0a90a3",
                "author": "CloudDefense.AI",
                "duration_mins": 2,
                "publication_date": "2025-05-02",
                "description": "In-depth explanation of whaling attacks targeting executives. Covers statistics ($1.8B annual cost), attack frameworks, and defense strategies."
            }
        ]
    },
    {
        "title": "Advanced Threats - Malware & Zero-Day Exploits",
        "level": "ADVANCED",
        "order_index": 5,
        "description": "Understanding malware concepts, zero-day exploits, and advanced threats. Learn about the zero-day vulnerability lifecycle and detection methods.",
        "duration_mins": 35,
        "articles": [
            {
                "title": "Zero-Day Exploits: A Deep Dive into the Unknown Threat",
                "url": "https://medium.com/@zyadaynshtain/zero-day-exploits-a-deep-dive-into-the-unknown-threat-d1eed5f9ac74",
                "author": "Ziad Tamer",
                "duration_mins": 6,
                "publication_date": "2025-10-24",
                "description": "In-depth explanation of the zero-day lifecycle, detection challenges, and layered defense strategies using NGAV, EDR, and network segmentation."
            }
        ]
    },
    {
        "title": "Ransomware Fundamentals - Understanding & Preventing",
        "level": "ADVANCED",
        "order_index": 6,
        "description": "Understanding ransomware mechanics and attack vectors. Learn best practices for prevention and recovery strategies without paying ransom.",
        "duration_mins": 40,
        "articles": [
            {
                "title": "How to Prevent Ransomware Attacks: Top 10 Best Practices",
                "url": "https://ip-specialist.medium.com/how-to-prevent-ransomware-attacks-top-10-best-practices-7105f6149293",
                "author": "IPSpecialist",
                "duration_mins": 6,
                "publication_date": "2024-12-11",
                "description": "Comprehensive 10-point prevention strategy covering backups, employee training, MFA, email filtering, network segmentation, and incident response planning."
            }
        ]
    },
    {
        "title": "Incident Response - Responding to Attacks",
        "level": "EXPERT",
        "order_index": 7,
        "description": "Understanding the incident response lifecycle and critical actions within the first 24 hours. Master containment, forensics, and recovery procedures.",
        "duration_mins": 45,
        "articles": [
            {
                "title": "Step-By-Step Incident Response Checklist For Ransomware With Sources [2023]",
                "url": "https://medium.com/@EdwardDiazCISSP/step-by-step-incident-response-checklist-for-ransomware-with-sources-2023-e77b4ca670e5",
                "author": "Edward Diaz",
                "duration_mins": 2,
                "publication_date": "2023-05-22",
                "description": "Checklist with best practices from the FBI and SANS Institute. Covers detection, containment, analysis, remediation, and recovery phases."
            }
        ]
    },
    {
        "title": "Advanced Detection & Cyber Threat Intelligence",
        "level": "EXPERT",
        "order_index": 8,
        "description": "Understanding advanced detection methodologies and Cyber Threat Intelligence (CTI). Master threat hunting and proactive defense strategies.",
        "duration_mins": 50,
        "articles": [
            {
                "title": "Zero-Day Hunting with CTI: How to Predict and Respond to Unknown Threats",
                "url": "https://medium.com/@scottbolen/zero-day-hunting-with-cti-how-to-predict-and-respond-to-unknown-threats-a91b66a146b1",
                "author": "Scott Bolen | RONIN OWL CTI",
                "duration_mins": 5,
                "publication_date": "2025-03-25",
                "description": "Advanced CTI-based approach for zero-day hunting. Covers threat intelligence collection, analysis, EDR systems, and response procedures with real-world scenarios."
            }
        ]
    }
]

# Realistic Ticket Scenarios
TICKET_SCENARIOS = [
    {
        "type": "Website",
        "url": "https://cimb-niaga-verifikasi.net/secure-login",
        "summary": "Saya menerima SMS yang mengatakan akun saya diblokir dan diminta login ke link ini. Tampilannya sangat mirip CIMB Clicks.",
        "risk_score": 92,
        "flags": "typosquatting,suspicious_tld,brand_impersonation",
        "extracted_text": "CIMB NIAGA - KEAMANAN AKUN. Silakan masukkan User ID dan Password Anda.",
        "priority": "High",
        "status": "Confirmed"
    },
    {
        "type": "SMS",
        "sender_numbers": "081234567890",
        "summary": "Pesan SMS: 'Nasabah Yth, Akun OCTO Mobile Anda terdeteksi login di perangkat lain. Jika bukan Anda, amankan di: s.id/cimb-safe'",
        "risk_score": 88,
        "flags": "shortener,keywords_found,urgency_detected",
        "extracted_text": "Nasabah Yth, Akun OCTO Mobile Anda terdeteksi login di perangkat lain. Jika bukan Anda, amankan di: s.id/cimb-safe",
        "priority": "High",
        "status": "In Review"
    },
    {
        "type": "WhatsApp",
        "sender_numbers": "+6287712345678",
        "summary": "Ada yang mengirim pesan di WA, katanya dari Customer Service CIMB Niaga. Dia kirim file .apk untuk update aplikasi.",
        "risk_score": 95,
        "flags": "malicious_file,brand_impersonation,suspicious_sender",
        "attachment_names": "OCTO_Mobile_Update_v2.apk",
        "priority": "High",
        "status": "Confirmed"
    },
    {
        "type": "Email",
        "sender_numbers": "security@cimb-niaga-support.com",
        "summary": "Email masuk ke spam, subjeknya 'Unauthorized Transaction Detected'. Isinya minta klik tombol 'Secure My Account'.",
        "risk_score": 75,
        "flags": "suspicious_sender,brand_impersonation,urgency_detected",
        "url": "http://secure-cimb-niaga.portal-apps.com",
        "priority": "High",
        "status": "Submitted"
    },
    {
        "type": "Website",
        "url": "https://clmbniaga-promo.com",
        "summary": "Dapat info promo bunga 0% di Facebook, pas diklik masuk ke web ini dan minta data kartu kredit.",
        "risk_score": 82,
        "flags": "typosquatting,brand_impersonation,phishing_keywords",
        "priority": "High",
        "status": "In Review"
    },
    {
        "type": "SMS",
        "sender_numbers": "085611223344",
        "summary": "SMS undian berhadiah 100 juta dari CIMB Niaga. Minta buka link bit.ly/cimb100jt",
        "risk_score": 90,
        "flags": "shortener,lottery_scam,urgency_detected",
        "priority": "High",
        "status": "Confirmed"
    },
    {
        "type": "WhatsApp",
        "sender_numbers": "Phishing Group",
        "summary": "Dimasukkan ke grup WA 'Promo CIMB 2024'. Admin grup share link hadiah voucher belanja.",
        "risk_score": 65,
        "flags": "suspicious_group,shortener",
        "url": "https://gift-cimb.xyz",
        "priority": "Medium",
        "status": "Submitted"
    },
    {
        "type": "Email",
        "sender_numbers": "no-reply@cimbclicks.co.id.secure.com",
        "summary": "Pemberitahuan perubahan tarif transfer menjadi Rp 150.000/bulan. Jika tidak setuju klik link pembatalan.",
        "risk_score": 94,
        "flags": "suspicious_sender,social_engineering,brand_impersonation",
        "priority": "High",
        "status": "Confirmed"
    },
    {
        "type": "Website",
        "url": "https://niaga-octo.top",
        "summary": "Web palsu untuk ambil OTP. Saya hampir memasukkan data saya tadi.",
        "risk_score": 96,
        "flags": "suspicious_tld,otp_phishing,brand_impersonation",
        "priority": "High",
        "status": "Mitigated"
    },
    {
        "type": "SMS",
        "sender_numbers": "CIMB_NIAGA",
        "summary": "SMS Sender ID-nya 'CIMB_NIAGA' tapi linknya aneh. Minta update data nasabah.",
        "risk_score": 85,
        "flags": "sender_id_spoofing,brand_impersonation",
        "priority": "High",
        "status": "In Review"
    }
]

def main_seed():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Cleanup (Already handled by drop_all)
        print("Starting seeding process...")

        # 2. Seed Users
        print("Seeding users...")
        admin = User(
            id=str(uuid.uuid4()),
            full_name="OctoSight Admin",
            email=DEFAULT_ADMIN_EMAIL,
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
            role="admin"
        )
        user = User(
            id=str(uuid.uuid4()),
            full_name="OctoSight User",
            email=DEFAULT_USER_EMAIL,
            hashed_password=hash_password(DEFAULT_USER_PASSWORD),
            role="user"
        )
        db.add(admin)
        db.add(user)
        db.commit()
        db.refresh(user)

        # 3. Seed Education
        print("Seeding education data...")
        for module_data in EDUCATION_MODULES_DATA:
            articles_data = module_data.pop("articles")
            
            # Use UUID for module ID
            m_id = str(uuid.uuid4())
            module = EducationModule(id=m_id, **module_data)
            db.add(module)
            db.flush()
            
            for article_data in articles_data:
                # Use UUID for article ID
                a_id = str(uuid.uuid4())
                article = EducationArticle(id=a_id, module_id=m_id, **article_data)
                db.add(article)
        db.commit()

        # 4. Seed Tickets (20 tickets)
        print("Seeding 20 realistic tickets...")
        all_tickets = []
        for i in range(20):
            base = random.choice(TICKET_SCENARIOS)
            days_ago = random.randint(0, 14)
            hours_ago = random.randint(0, 23)
            created_at = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)
            
            status = base["status"]
            if days_ago > 7 and status == "Submitted":
                status = random.choice(["In Review", "Closed"])
            
            ticket = Ticket(
                ticket_id=f"OCTO-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                url=base.get("url"),
                type=base["type"],
                summary=base["summary"],
                risk_score=max(0, min(100, base["risk_score"] + random.randint(-5, 3))),
                priority=base["priority"],
                status=status,
                sender_numbers=base.get("sender_numbers"),
                extracted_text=base.get("extracted_text"),
                attachment_names=base.get("attachment_names"),
                flags=base["flags"],
                user_id=user.id,
                created_at=created_at,
                investigation_notes=f"Investigasi awal menunjukkan adanya {base['flags'].replace(',', ', ')}. Langkah mitigasi sedang dilakukan." if status != "Submitted" else None
            )
            all_tickets.append(ticket)
        
        db.add_all(all_tickets)
        db.commit()

        print("\nSeeding completed successfully!")
        print(f"Users created: {DEFAULT_ADMIN_EMAIL}, {DEFAULT_USER_EMAIL}")
        print(f"Tickets created: 20")
        print(f"Education Modules: {len(EDUCATION_MODULES_DATA)}")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main_seed()
