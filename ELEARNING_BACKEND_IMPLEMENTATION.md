# OctoSight Education Module - Backend Implementation Guide
## Database Seeding & API Configuration
 
---
 
## 1. ALEMBIC MIGRATION TEMPLATE
 
### File: `backend/alembic/versions/XXXX_add_education_tables.py`
 
```python
"""Add education tables for microlearning feature
 
Revision ID: XXXXX
Revises: XXXXX
Create Date: 2025-05-07 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
 
# Revision identifiers
revision = 'XXXXX'
down_revision = 'XXXXX'
branch_labels = None
depends_on = None
 
def upgrade() -> None:
    # Create education_modules table
    op.create_table(
        'education_modules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('level', sa.String(50), nullable=False),  # BASIC, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
        sa.Column('order_index', sa.Integer(), nullable=False),  # 1-8
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('duration_mins', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_index', name='uq_module_order')
    )
    
    # Create education_articles table
    op.create_table(
        'education_articles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('module_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('author', sa.String(255), nullable=False),
        sa.Column('duration_mins', sa.Integer(), nullable=False),
        sa.Column('publication_date', sa.Date(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['module_id'], ['education_modules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_learning_progress table
    op.create_table(
        'user_learning_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('module_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),  # LOCKED, IN_PROGRESS, COMPLETED
        sa.Column('quiz_score', sa.Float(), nullable=True),
        sa.Column('quiz_attempts', sa.Integer(), default=0),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['module_id'], ['education_modules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'module_id', name='uq_user_module_progress')
    )
    
    # Add education_recommendation column ke tickets table
    op.add_column('tickets', sa.Column('education_recommendation', 
                                       postgresql.JSON(), nullable=True))
    
    # Create indices
    op.create_index('idx_module_level', 'education_modules', ['level'])
    op.create_index('idx_module_order', 'education_modules', ['order_index'])
    op.create_index('idx_article_module', 'education_articles', ['module_id'])
    op.create_index('idx_progress_user', 'user_learning_progress', ['user_id'])
    op.create_index('idx_progress_module', 'user_learning_progress', ['module_id'])
    op.create_index('idx_progress_status', 'user_learning_progress', ['status'])
 
def downgrade() -> None:
    op.drop_index('idx_progress_status')
    op.drop_index('idx_progress_module')
    op.drop_index('idx_progress_user')
    op.drop_index('idx_article_module')
    op.drop_index('idx_module_order')
    op.drop_index('idx_module_level')
    op.drop_column('tickets', 'education_recommendation')
    op.drop_table('user_learning_progress')
    op.drop_table('education_articles')
    op.drop_table('education_modules')
```
 
---
 
## 2. SQLALCHEMY MODELS
 
### File: `backend/app/models/education.py`
 
```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Date, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
 
class EducationModule(Base):
    __tablename__ = "education_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False)  # BASIC, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    order_index = Column(Integer, nullable=False, unique=True)  # 1-8
    description = Column(Text, nullable=False)
    duration_mins = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    articles = relationship("EducationArticle", back_populates="module", cascade="all, delete-orphan")
    user_progress = relationship("UserLearningProgress", back_populates="module", cascade="all, delete-orphan")
 
 
class EducationArticle(Base):
    __tablename__ = "education_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("education_modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    author = Column(String(255), nullable=False)
    duration_mins = Column(Integer, nullable=False)
    publication_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    module = relationship("EducationModule", back_populates="articles")
 
 
class UserLearningProgress(Base):
    __tablename__ = "user_learning_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(Integer, ForeignKey("education_modules.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="LOCKED")  # LOCKED, IN_PROGRESS, COMPLETED
    quiz_score = Column(Float, nullable=True)
    quiz_attempts = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    module = relationship("EducationModule", back_populates="user_progress")
```
 
### Update: `backend/app/models/models.py`
 
```python
# Add to Ticket model
from sqlalchemy.dialects.postgresql import JSON
 
class Ticket(Base):
    # ... existing columns ...
    education_recommendation = Column(JSON, nullable=True)  # New column
```
 
---
 
## 3. PYDANTIC SCHEMAS
 
### File: `backend/app/schemas/education.py`
 
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
 
# ===== MODULE SCHEMAS =====
 
class EducationArticleRead(BaseModel):
    id: int
    title: str
    url: str
    author: str
    duration_mins: int
    publication_date: Optional[str] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True
 
 
class EducationModuleCreate(BaseModel):
    title: str
    level: str  # BASIC, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    order_index: int
    description: str
    duration_mins: int
 
 
class EducationModuleRead(BaseModel):
    id: int
    title: str
    level: str
    order_index: int
    description: str
    duration_mins: int
    articles: List[EducationArticleRead] = []
    
    class Config:
        from_attributes = True
 
 
class EducationModuleWithProgress(EducationModuleRead):
    status: str  # LOCKED, IN_PROGRESS, COMPLETED
    quiz_score: Optional[float] = None
    completed_at: Optional[datetime] = None
 
 
# ===== PROGRESS SCHEMAS =====
 
class UserLearningProgressCreate(BaseModel):
    user_id: int
    module_id: int
 
 
class UserLearningProgressUpdate(BaseModel):
    status: Optional[str] = None
    quiz_score: Optional[float] = None
 
 
class UserLearningProgressRead(BaseModel):
    id: int
    user_id: int
    module_id: int
    status: str
    quiz_score: Optional[float] = None
    quiz_attempts: int
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
 
 
# ===== QUIZ SCHEMAS =====
 
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int
    explanation: str
 
 
class QuizResponse(BaseModel):
    questions: List[QuizQuestion]
 
 
class QuizSubmission(BaseModel):
    module_id: int
    answers: List[int]  # Index of selected answers
 
 
class QuizResult(BaseModel):
    score: float  # Percentage (0-100)
    total_questions: int
    correct_answers: int
    questions_with_explanations: List[dict]
    passed: bool  # True if score >= 70
 
 
# ===== EDUCATION RECOMMENDATION SCHEMA =====
 
class EducationRecommendation(BaseModel):
    warnings: List[str]
    suggested_actions: List[str]
    tips: List[str]
    relevant_modules: List[int]  # Module IDs yang relevant
 
 
class TicketResponse(BaseModel):
    # ... existing fields ...
    education_recommendation: Optional[EducationRecommendation] = None
```
 
---
 
## 4. SEEDING DATA (Python Script)
 
### File: `backend/seeds/education_data.py`
 
```python
from sqlalchemy.orm import Session
from app.models.education import EducationModule, EducationArticle
 
EDUCATION_MODULES_DATA = [
    {
        "title": "Phishing Basics - Mengenal Ancaman Dasar",
        "level": "BASIC",
        "order_index": 1,
        "description": "Pelajari definisi phishing, cara kerjanya, dan ciri-ciri dasar email phishing. Modul ini memberikan foundation untuk memahami ancaman keamanan digital yang paling umum.",
        "duration_mins": 45,
        "articles": [
            {
                "title": "How to Detect Phishing Emails: A Comprehensive Guide",
                "url": "https://medium.com/@how-to-identify-phishing-email/how-to-detect-phishing-emails-a-comprehensive-guide-694df7d1794f",
                "author": "Phil Rawlins",
                "duration_mins": 12,
                "publication_date": "2024-02-02",
                "description": "Panduan komprehensif untuk mengidentifikasi phishing emails dengan fokus pada scrutinizing sender addresses, grammatical errors, dan unexpected attachments."
            },
            {
                "title": "How to Prevent Phishing Attacks on Your Bank Account",
                "url": "https://medium.com/insiden26/how-to-prevent-a-phishing-attacks-on-your-bank-account-3d756ae8fe65",
                "author": "N26 Security Team",
                "duration_mins": 10,
                "publication_date": "2018-10-31",
                "description": "Artikel dari N26 banking tentang pencegahan phishing pada akun bank. Menjelaskan behavioral patterns scammer dan best practices dari institusi finansial."
            },
            {
                "title": "Phishing Email — Ultimate Resources",
                "url": "https://hassen-hannachi.medium.com/phishing-email-ultimate-resources-60bba3e99fde",
                "author": "Hassen Hannachi",
                "duration_mins": 15,
                "publication_date": "2024-04-27",
                "description": "Kompilasi tools dan resources untuk analisis phishing emails. Mencakup MXToolbox, VirusTotal, dan tools analysis lainnya yang user-friendly."
            }
        ]
    },
    {
        "title": "Phishing Prevention - Strategi Pertahanan Diri",
        "level": "BEGINNER",
        "order_index": 2,
        "description": "Menerapkan best practices untuk mencegah phishing. Pelajari email authentication protocols dan langkah-langkah teknis yang dapat diterapkan.",
        "duration_mins": 50,
        "articles": [
            {
                "title": "Phishing Prevention - Email Filtering & Security Gateways",
                "url": "https://medium.com/@piyushkkr12/phishing-prevention-e5778a21c0e4",
                "author": "Piyushkkr12",
                "duration_mins": 14,
                "publication_date": "2025-10-12",
                "description": "Menjelaskan modern email security solutions termasuk Secure Email Gateways (SEGs), link rewriting, sandboxing, dan user awareness training."
            },
            {
                "title": "A Practical Approach of Phishing Detection Using Email Header",
                "url": "https://ghafoorazhar.medium.com/a-practical-approach-of-phishing-detection-using-email-header-4a8384c4e681",
                "author": "Ghafoor Azhar",
                "duration_mins": 11,
                "publication_date": "2022-04-26",
                "description": "Panduan praktis menganalisis email headers untuk deteksi phishing. Membahas SPF, DKIM setup, dan cara mengidentifikasi domain spoofing."
            },
            {
                "title": "Phishing Analysis Fundamentals",
                "url": "https://medium.com/@masif718e/phishing-analysis-fundamentals-tryhackm-bc2fa8cc506d",
                "author": "Masife",
                "duration_mins": 13,
                "publication_date": "2025-11-02",
                "description": "Fundamental knowledge tentang email structure, SMTP protocols, dan cara menganalisis headers dan body untuk mendeteksi suspicious elements."
            }
        ]
    },
    {
        "title": "Social Engineering - Rekayasa Sosial dan Manipulasi",
        "level": "INTERMEDIATE",
        "order_index": 3,
        "description": "Memahami berbagai teknik social engineering dan psychological manipulation. Tingkatkan awareness terhadap scam scenarios yang lebih sophisticated.",
        "duration_mins": 55,
        "articles": [
            {
                "title": "How to Prevent Social Engineering Attacks",
                "url": "https://ip-specialist.medium.com/how-to-prevent-social-engineering-attacks-1b761e4c82ca",
                "author": "IP Specialist",
                "duration_mins": 12,
                "publication_date": "2023-02-27",
                "description": "Overview komprehensif tentang social engineering attacks dengan fokus pada defense mechanisms dan warning signs yang harus diwaspadai."
            },
            {
                "title": "Social Engineering Attacks: Prevention and Best Practices",
                "url": "https://medium.com/@loginradius/social-engineering-attacks-prevention-and-best-practices-b3f127d5328e",
                "author": "LoginRadius",
                "duration_mins": 13,
                "publication_date": "2021-12-16",
                "description": "Mendetailkan berbagai tipe social engineering termasuk phishing, spear phishing, pretexting, dan baiting dengan real-world examples."
            },
            {
                "title": "Social Engineering: Understanding the Threat and Best Practices",
                "url": "https://medium.com/@ensargnsdogdu/social-engineering-understanding-the-threat-and-best-practices-for-prevention-a51392773187",
                "author": "Ensar Güneşdoğdu",
                "duration_mins": 11,
                "publication_date": "2023-03-20",
                "description": "Menjelaskan bagaimana attackers memanfaatkan human psychology, teknik manipulation, dan contoh-contoh real attacks dari perusahaan besar."
            },
            {
                "title": "The Ultimate Guide to Social Engineering Attacks and Prevention",
                "url": "https://santhosh-adiga-u.medium.com/the-ultimate-guide-to-social-engineering-attacks-and-prevention-cad9b80efa09",
                "author": "Santhosh Adiga U",
                "duration_mins": 15,
                "publication_date": "2025-01-23",
                "description": "Guide lengkap dengan case studies termasuk Google/Facebook $100M scam dan Twitter account compromise dengan pelajaran praktis dari real incidents."
            }
        ]
    },
    {
        "title": "Spear Phishing & Whaling - Targeted Attacks",
        "level": "INTERMEDIATE",
        "order_index": 4,
        "description": "Membedakan antara mass phishing, spear phishing, dan whaling. Pahami sophistication level dan targeting strategies dari advanced attacks.",
        "duration_mins": 60,
        "articles": [
            {
                "title": "What is a Whaling Attack? Whale Phishing Explained",
                "url": "https://medium.com/@clouddefenseai/what-is-a-whaling-attack-whale-phishing-explained-bc215b0a90a3",
                "author": "CloudDefense.AI",
                "duration_mins": 12,
                "publication_date": "2025-05-02",
                "description": "Penjelasan mendalam tentang whaling attacks yang menargetkan executives. Mencakup statistics ($1.8B annual cost), attack frameworks, dan defense strategies."
            },
            {
                "title": "Not Just Phishing. This One Hunts The Whales",
                "url": "https://redfoxsecurity.medium.com/not-just-phishing-this-one-hunts-the-whales-8ee29b97b183",
                "author": "Redfox Security",
                "duration_mins": 14,
                "publication_date": "2025-12-18",
                "description": "Analisis mendalam tentang why whales are targeted (power, trust, authority), attack mechanics, dan unique vulnerabilities dari executives."
            },
            {
                "title": "Spear Phishing vs Phishing: What's the Real Difference and Why It Matters",
                "url": "https://threatcop.medium.com/spear-phishing-vs-phishing-whats-the-real-difference-and-why-it-matters-d2ad7176b995",
                "author": "Threatcop",
                "duration_mins": 13,
                "publication_date": "2026-04-01",
                "description": "Perbandingan detail antara phishing dan spear phishing dengan fokus pada personalization, reconnaissance, dan targeting methodology."
            },
            {
                "title": "Understanding Phishing Attacks: Spear Phishing, Whaling, Vishing, Spoofing, Smishing",
                "url": "https://danaconnect.medium.com/understanding-phishing-attacks-spear-phishing-whaling-vishing-spoofing-smishing-and-how-they-2c8c70434cf2",
                "author": "Automation Insider @ Danaconnect",
                "duration_mins": 14,
                "publication_date": "2023-03-14",
                "description": "Comprehensive breakdown tentang berbagai phishing variants termasuk email spoofing dan DMARC protection sebagai preventive measure."
            }
        ]
    },
    {
        "title": "Advanced Threats - Malware & Zero-Day Exploits",
        "level": "ADVANCED",
        "order_index": 5,
        "description": "Memahami konsep malware, zero-day exploits, dan advanced threats. Pelajari lifecycle dari zero-day vulnerabilities dan detection methods.",
        "duration_mins": 65,
        "articles": [
            {
                "title": "Zero-Day Exploits: A Deep Dive into the Unknown Threat",
                "url": "https://medium.com/@zyadaynshtain/zero-day-exploits-a-deep-dive-into-the-unknown-threat-d1eed5f9ac74",
                "author": "Ziad Tamer",
                "duration_mins": 15,
                "publication_date": "2025-10-24",
                "description": "Penjelasan mendalam tentang zero-day lifecycle, detection challenges, dan layered defense strategies menggunakan NGAV, EDR, dan network segmentation."
            },
            {
                "title": "Zero-Day Exploits: The Hidden Threats in Cybersecurity",
                "url": "https://medium.com/@abhilashkrish/zero-day-exploits-the-hidden-threats-in-cybersecurity-ee79454d64e4",
                "author": "Abhilash Krishnan",
                "duration_mins": 13,
                "publication_date": "2024-11-15",
                "description": "Menganalisis bagaimana zero-days ditemukan (researchers, bug bounty, malicious hackers), detection challenges, dan historical examples seperti Stuxnet."
            },
            {
                "title": "Zero-Day Attack Prevention and Reduction",
                "url": "https://medium.com/@aneeqibtesam990/zero-day-attack-prevention-and-reduction-8901d693fa2e",
                "author": "Aneeqibtesam",
                "duration_mins": 12,
                "publication_date": "2026-01-02",
                "description": "Praktis implementation guide untuk advanced endpoint protection termasuk machine learning, behavioral analytics, fileless malware detection, dan EDR systems."
            },
            {
                "title": "Zero-Day Attack Prevention: 4 Ways to Prepare",
                "url": "https://ip-specialist.medium.com/zero-day-attack-prevention-4-ways-to-prepare-6fe320820be3",
                "author": "IPSpecialist",
                "duration_mins": 11,
                "publication_date": "2024-10-09",
                "description": "Strategic framework untuk preparation terhadap zero-day threats menggunakan threat intelligence, behavioral analytics, dan patch management strategies."
            }
        ]
    },
    {
        "title": "Ransomware Fundamentals - Memahami & Mencegah",
        "level": "ADVANCED",
        "order_index": 6,
        "description": "Memahami ransomware mechanics dan attack vectors. Ketahui best practices untuk prevention dan recovery strategies tanpa membayar ransom.",
        "duration_mins": 70,
        "articles": [
            {
                "title": "How to Prevent Ransomware Attacks: Top 10 Best Practices",
                "url": "https://ip-specialist.medium.com/how-to-prevent-ransomware-attacks-top-10-best-practices-7105f6149293",
                "author": "IPSpecialist",
                "duration_mins": 16,
                "publication_date": "2024-12-11",
                "description": "Comprehensive 10-point prevention strategy mencakup backups, employee training, MFA, email filtering, network segmentation, dan incident response planning."
            },
            {
                "title": "How can we prevent ransomware attacks?",
                "url": "https://benpournader.medium.com/how-can-we-prevent-ransomware-attacks-ff0ee644579f",
                "author": "Ben Pournader",
                "duration_mins": 14,
                "publication_date": "2024-11-22",
                "description": "Fokus pada backup strategy (3-2-1 rule), MFA implementation, network segmentation, incident response planning, dan building security culture."
            },
            {
                "title": "Managing a Ransomware Incident: Preparation, Response, and Remediation",
                "url": "https://medium.com/@tribal.secberet/managing-a-ransomware-incident-1f7cbf398c5f",
                "author": "Pietro Romano / SecBeret",
                "duration_mins": 17,
                "publication_date": "2024-11-10",
                "description": "Detailed framework untuk preparation, rapid response, dan remediation phases dengan step-by-step procedures untuk minimizing damage dan recovery."
            },
            {
                "title": "Ransomware Resilience",
                "url": "https://medium.com/@gettingfrankpodcast/ransomware-resilience-699d681d45a2",
                "author": "Getting Frank Podcast",
                "duration_mins": 13,
                "publication_date": "2024-11-14",
                "description": "Holistic approach untuk ransomware resilience termasuk backup strategies, MFA, employee training, network segmentation, incident response, dan cyber insurance."
            }
        ]
    },
    {
        "title": "Incident Response - Respons Terhadap Serangan",
        "level": "EXPERT",
        "order_index": 7,
        "description": "Memahami incident response lifecycle dan first 24 hours critical actions. Kuasai containment, forensics, dan recovery procedures.",
        "duration_mins": 75,
        "articles": [
            {
                "title": "Step-By-Step Incident Response Checklist For Ransomware",
                "url": "https://medium.com/@EdwardDiazCISSP/step-by-step-incident-response-checklist-for-ransomware-with-sources-2023-e77b4ca670e5",
                "author": "Edward Diaz (CISSP)",
                "duration_mins": 15,
                "publication_date": "2023-05-22",
                "description": "CISSP-certified checklist dengan best practices dari FBI dan SANS Institute. Mencakup detection, containment, analysis, remediation, dan recovery phases."
            },
            {
                "title": "How to Respond to Ransomware Attack Incidents?",
                "url": "https://medium.com/@partha.pratimnayak/how-to-respond-to-ransomware-attack-incidents-a85810a74c5e",
                "author": "Partha Pratim Nayak",
                "duration_mins": 14,
                "publication_date": "2024-08-05",
                "description": "Mendalam analysis tentang attack TTPs, logging importance, infrastructure security, dan coordination dengan threat intelligence teams untuk real incidents."
            },
            {
                "title": "Ransomware Response Playbook: The First 24 Hours",
                "url": "https://medium.com/@jsocitblog/ransomware-response-playbook-the-first-24-hours-324121f32eca",
                "author": "JSOC IT BLOG",
                "duration_mins": 18,
                "publication_date": "2025-11-05",
                "description": "Praktis minute-by-minute playbook untuk first 24 hours. Mencakup decision trees, communication strategies, dan cost-benefit analysis dari paying vs. not paying ransom."
            },
            {
                "title": "Defending Against and Responding to Ransomware Attacks",
                "url": "https://medium.com/@chad.barr01/defending-against-and-responding-to-ransomware-attacks-380dc47d01c4",
                "author": "Chad Barr",
                "duration_mins": 13,
                "publication_date": "2025-11-03",
                "description": "Komprehensif defense dan response strategy termasuk IRP development, backup validation, IDPS deployment, penetration testing, dan culture of accountability."
            }
        ]
    },
    {
        "title": "Advanced Detection & Cyber Threat Intelligence",
        "level": "EXPERT",
        "order_index": 8,
        "description": "Memahami advanced detection methodologies dan Cyber Threat Intelligence (CTI). Kuasai threat hunting dan proactive defense strategies.",
        "duration_mins": 80,
        "articles": [
            {
                "title": "Zero-Day Hunting with CTI: How to Predict and Respond to Unknown Threats",
                "url": "https://medium.com/@scottbolen/zero-day-hunting-with-cti-how-to-predict-and-respond-to-unknown-threats-a91b66a146b1",
                "author": "Scott Bolen | RONIN OWL CTI",
                "duration_mins": 16,
                "publication_date": "2025-03-25",
                "description": "Advanced CTI-based approach untuk zero-day hunting. Mencakup threat intelligence collection, analysis, EDR systems, dan response procedures dengan real-world scenarios."
            },
            {
                "title": "Detecting, Countering, and Mitigating Ransomware and Data Breaches",
                "url": "https://medium.com/@scottbolen/detecting-countering-and-mitigating-ransomware-and-data-breaches-852aaabdf6f0",
                "author": "Scott Bolen | RONIN OWL CTI",
                "duration_mins": 14,
                "publication_date": "2024-04-23",
                "description": "Advanced detection strategies menggunakan SIEM, EDR, user activity monitoring. Comprehensive framework untuk detection, countering, dan mitigation."
            },
            {
                "title": "Zero-Day Exploits in 2025: Detection, Prevention, and Response Strategies",
                "url": "https://sennovate.medium.com/zero-day-exploits-in-2025-detection-prevention-and-response-strategies-e600ae912626",
                "author": "Sennovate",
                "duration_mins": 15,
                "publication_date": "2025-07-02",
                "description": "2025 perspective tentang zero-day threats dengan AI-enhanced detection methods, patch prioritization, virtual patching, micro-segmentation, dan forensic analysis."
            },
            {
                "title": "Phishing Email Investigation: A Complete Cybersecurity Analyst Approach",
                "url": "https://medium.com/@savyasachiiarjun/phishing-email-investigation-a-complete-cybersecurity-analyst-approach-2e95d152bdcb",
                "author": "Savyasachi",
                "duration_mins": 12,
                "publication_date": "2025-08-17",
                "description": "Professional analyst approach untuk phishing investigation termasuk evidence gathering, payload analysis, IOC identification, credential reset, dan incident containment."
            }
        ]
    }
]
 
 
def seed_education_data(db: Session):
    """
    Seed education modules dan articles ke database
    
    Usage:
        from sqlalchemy.orm import sessionmaker
        from app.database import engine
        from seeds.education_data import seed_education_data
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        seed_education_data(db)
    """
    
    for module_data in EDUCATION_MODULES_DATA:
        # Cek apakah module sudah ada
        existing_module = db.query(EducationModule).filter(
            EducationModule.order_index == module_data["order_index"]
        ).first()
        
        if existing_module:
            continue  # Skip jika sudah ada
        
        # Extract articles sebelum create module
        articles_data = module_data.pop("articles")
        
        # Create module
        module = EducationModule(**module_data)
        db.add(module)
        db.flush()  # Flush untuk dapat module.id
        
        # Create articles untuk module ini
        for article_data in articles_data:
            article = EducationArticle(
                module_id=module.id,
                **article_data
            )
            db.add(article)
        
    db.commit()
    print("Education data seeding completed successfully!")
 
 
# Alternative: Direct SQL seeding jika prefer raw SQL
SEED_SQL = """
-- Insert modules
INSERT INTO education_modules (title, level, order_index, description, duration_mins, created_at, updated_at) VALUES
-- Module 1
('Phishing Basics - Mengenal Ancaman Dasar', 'BASIC', 1, 'Pelajari definisi phishing, cara kerjanya, dan ciri-ciri dasar email phishing. Modul ini memberikan foundation untuk memahami ancaman keamanan digital yang paling umum.', 45, NOW(), NOW()),
-- Module 2
('Phishing Prevention - Strategi Pertahanan Diri', 'BEGINNER', 2, 'Menerapkan best practices untuk mencegah phishing. Pelajari email authentication protocols dan langkah-langkah teknis yang dapat diterapkan.', 50, NOW(), NOW()),
-- ... (dan seterusnya untuk module 3-8)
 
-- Insert articles untuk setiap module
-- (Terlalu panjang untuk disertakan di sini, gunakan Python script instead)
```
 
---
 
## 5. GEMINI SERVICE MODULE
 
### File: `backend/app/modules/education/gemini_service.py`
 
```python
import json
import google.generativeai as genai
from typing import Dict, List
from app.core.config import settings
 
# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')
 
class GeminiEducationService:
    
    @staticmethod
    def generate_education_recommendation(
        ticket_type: str,
        url: str,
        rule_score: float,
        ml_score: float,
        ticket_content: str,
        ticket_summary: str
    ) -> Dict:
        """
        Generate education recommendations berdasarkan ticket analysis
        
        Args:
            ticket_type: Jenis ticket (phishing, malware, etc)
            url: URL yang di-analyze
            rule_score: Score dari rule-based engine (0-100)
            ml_score: Score dari ML engine (0-100)
            ticket_content: Full content dari ticket
            ticket_summary: Summary dari ticket
            
        Return:
            Dict dengan keys: warnings, suggested_actions, tips, relevant_modules
        """
        
        prompt = f"""
Analyze the following cybersecurity ticket and provide educational recommendations for low-literacy users.
 
TICKET INFORMATION:
- Type: {ticket_type}
- URL: {url}
- Rule-based Score: {rule_score}
- ML Engine Score: {ml_score}
- Content Summary: {ticket_summary}
- Full Analysis: {ticket_content[:500]}...
 
Based on this analysis, generate a JSON response with:
1. warnings: Array of 2-3 specific warnings about what happened
2. suggested_actions: Array of 3-4 actionable steps user should take immediately
3. tips: Array of 2-3 future prevention tips relevant to this threat type
4. relevant_modules: Array of module IDs (1-8) that user should complete
 
Response MUST be valid JSON ONLY, no markdown formatting.
 
Example format:
{{
  "warnings": ["Email may contain malicious link", "Sender address is spoofed"],
  "suggested_actions": ["Do not click any links in the email", "Report to IT team", "Change your password"],
  "tips": ["Always verify sender address carefully", "Hover over links to see real URL"],
  "relevant_modules": [1, 2, 3]
}}
"""
        
        try:
            response = model.generate_content(prompt)
            # Parse response as JSON
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            # Fallback jika response tidak valid JSON
            return GeminiEducationService._get_default_recommendation(ticket_type)
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return GeminiEducationService._get_default_recommendation(ticket_type)
    
    @staticmethod
    def generate_quiz_questions(
        module_id: int,
        module_title: str,
        module_description: str,
        article_titles: List[str]
    ) -> Dict:
        """
        Generate 10 unique quiz questions untuk setiap module
        
        Args:
            module_id: ID dari module
            module_title: Judul module
            module_description: Deskripsi module
            article_titles: List judul artikel dalam module
            
        Return:
            Dict dengan key "questions" berisi array of 10 questions
        """
        
        articles_text = ", ".join(article_titles)
        
        prompt = f"""
Generate exactly 10 multiple choice quiz questions untuk educational module berikut:
 
MODULE TITLE: {module_title}
MODULE DESCRIPTION: {module_description}
ARTICLE TOPICS: {articles_text}
 
Requirements:
- Bahasa Indonesia
- Tingkat kesulitan sesuai dengan module
- Questions harus covering semua artikel topics
- Gunakan realistic scenarios
- Hindari yes/no questions
- Each question harus punya 4 pilihan (A, B, C, D)
 
Response HARUS dalam format JSON ONLY:
{{
  "questions": [
    {{
      "question": "Pertanyaan?",
      "options": ["A. Opsi 1", "B. Opsi 2", "C. Opsi 3", "D. Opsi 4"],
      "correct_answer_index": 1,
      "explanation": "Penjelasan mengapa B benar dan mengapa opsi lain salah."
    }}
  ]
}}
"""
        
        try:
            response = model.generate_content(prompt)
            result = json.loads(response.text)
            
            # Validate response
            if "questions" in result and len(result["questions"]) == 10:
                return result
            else:
                raise ValueError("Invalid number of questions generated")
                
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error generating quiz: {e}")
            return GeminiEducationService._get_default_quiz(module_id)
        except Exception as e:
            print(f"Gemini API error: {e}")
            return GeminiEducationService._get_default_quiz(module_id)
    
    @staticmethod
    def _get_default_recommendation(ticket_type: str) -> Dict:
        """Fallback recommendation jika API fails"""
        recommendations_map = {
            "phishing": {
                "warnings": [
                    "Email ini menunjukkan ciri-ciri phishing yang mencurigakan",
                    "URL yang disertakan mungkin mengarah ke website palsu",
                    "Jangan membagikan informasi pribadi Anda"
                ],
                "suggested_actions": [
                    "Jangan klik link atau buka attachment dari email ini",
                    "Report email ke IT team atau email provider",
                    "Verifikasi dengan pengirim asli melalui channel yang aman"
                ],
                "tips": [
                    "Periksa alamat email pengirim dengan hati-hati",
                    "Hover di atas link untuk melihat URL sebenarnya",
                    "Bank asli tidak pernah minta password via email"
                ],
                "relevant_modules": [1, 2, 3]
            },
            "malware": {
                "warnings": [
                    "File atau link ini terdeteksi mengandung malware",
                    "Bisa menginfeksi device dan mencuri data Anda",
                    "Threat level: Tinggi"
                ],
                "suggested_actions": [
                    "Isolasi device dari network jika sudah download",
                    "Hubungi IT team atau security professional",
                    "Jangan jalankan file yang mencurigakan"
                ],
                "tips": [
                    "Selalu update antivirus dan security software",
                    "Jangan download dari source yang tidak terpercaya",
                    "Scan file sebelum membuka attachment"
                ],
                "relevant_modules": [5, 6, 7]
            }
        }
        
        return recommendations_map.get(ticket_type, {
            "warnings": ["Ticket terdeteksi mengandung ancaman keamanan"],
            "suggested_actions": ["Hubungi tim keamanan untuk bantuan"],
            "tips": ["Selalu waspada terhadap email dari sender yang tidak dikenal"],
            "relevant_modules": [1, 2]
        })
    
    @staticmethod
    def _get_default_quiz(module_id: int) -> Dict:
        """Fallback quiz jika API fails"""
        return {
            "questions": [
                {
                    "question": "Apa yang harus Anda lakukan jika menerima email mencurigakan?",
                    "options": [
                        "A. Klik link untuk verifikasi akun",
                        "B. Download attachment untuk cek isinya",
                        "C. Jangan klik link dan report ke IT team",
                        "D. Forward ke teman untuk konfirmasi"
                    ],
                    "correct_answer_index": 2,
                    "explanation": "Jawaban yang benar adalah C. Jangan pernah klik link dari email mencurigakan. Selalu report ke IT team atau email provider Anda."
                }
                # ... (9 soal lainnya)
            ]
        }
```
 
---
 
## 6. API ENDPOINTS
 
### File: `backend/app/api/education.py`
 
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.education import EducationModule, EducationArticle, UserLearningProgress
from app.schemas.education import (
    EducationModuleRead, EducationModuleWithProgress, QuizResponse, 
    QuizSubmission, QuizResult, UserLearningProgressUpdate
)
from app.modules.education.gemini_service import GeminiEducationService
from app.core.auth import get_current_user
 
router = APIRouter(prefix="/api/education", tags=["education"])
 
# ===== GET ENDPOINTS =====
 
@router.get("/modules", response_model=List[EducationModuleWithProgress])
async def get_all_modules(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get semua 8 modul dengan status progress user"""
    modules = db.query(EducationModule).order_by(EducationModule.order_index).all()
    
    result = []
    for module in modules:
        # Get progress untuk user ini
        progress = db.query(UserLearningProgress).filter(
            UserLearningProgress.user_id == current_user.id,
            UserLearningProgress.module_id == module.id
        ).first()
        
        # Jika belum ada progress, create dengan status LOCKED (kecuali modul 1)
        if not progress:
            if module.order_index == 1:
                status = "IN_PROGRESS"
            else:
                status = "LOCKED"
            
            progress = UserLearningProgress(
                user_id=current_user.id,
                module_id=module.id,
                status=status
            )
            db.add(progress)
        
        result.append({
            **EducationModuleRead.from_orm(module).dict(),
            "status": progress.status,
            "quiz_score": progress.quiz_score,
            "completed_at": progress.completed_at
        })
    
    db.commit()
    return result
 
 
@router.get("/modules/{module_id}", response_model=EducationModuleWithProgress)
async def get_module_detail(
    module_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detail modul dengan artikel"""
    module = db.query(EducationModule).filter(EducationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get progress
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=403, detail="Module locked or not accessible")
    
    return {
        **EducationModuleRead.from_orm(module).dict(),
        "status": progress.status,
        "quiz_score": progress.quiz_score,
        "completed_at": progress.completed_at
    }
 
 
@router.get("/modules/{module_id}/quiz", response_model=QuizResponse)
async def get_quiz(
    module_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get quiz questions untuk module (generated by Gemini)"""
    module = db.query(EducationModule).filter(EducationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check progress
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    if not progress or progress.status == "LOCKED":
        raise HTTPException(status_code=403, detail="Module is locked")
    
    # Get articles untuk modul
    articles = db.query(EducationArticle).filter(
        EducationArticle.module_id == module_id
    ).all()
    
    article_titles = [article.title for article in articles]
    
    # Generate quiz via Gemini
    quiz_data = GeminiEducationService.generate_quiz_questions(
        module_id=module_id,
        module_title=module.title,
        module_description=module.description,
        article_titles=article_titles
    )
    
    return QuizResponse(**quiz_data)
 
 
# ===== POST ENDPOINTS =====
 
@router.post("/modules/{module_id}/submit-quiz", response_model=QuizResult)
async def submit_quiz(
    module_id: int,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Submit jawaban quiz"""
    module = db.query(EducationModule).filter(EducationModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get quiz questions
    articles = db.query(EducationArticle).filter(
        EducationArticle.module_id == module_id
    ).all()
    
    article_titles = [article.title for article in articles]
    quiz_data = GeminiEducationService.generate_quiz_questions(
        module_id=module_id,
        module_title=module.title,
        module_description=module.description,
        article_titles=article_titles
    )
    
    # Calculate score
    correct_count = 0
    questions_with_explanations = []
    
    for i, answer_index in enumerate(submission.answers):
        question = quiz_data["questions"][i]
        is_correct = answer_index == question["correct_answer_index"]
        
        if is_correct:
            correct_count += 1
        
        questions_with_explanations.append({
            "question": question["question"],
            "selected_answer_index": answer_index,
            "correct_answer_index": question["correct_answer_index"],
            "is_correct": is_correct,
            "explanation": question["explanation"]
        })
    
    score = (correct_count / len(quiz_data["questions"])) * 100
    passed = score >= 70
    
    # Update progress
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    progress.quiz_score = score
    progress.quiz_attempts += 1
    
    if passed:
        progress.status = "COMPLETED"
        progress.completed_at = datetime.utcnow()
        
        # Unlock next module
        next_module = db.query(EducationModule).filter(
            EducationModule.order_index == module.order_index + 1
        ).first()
        
        if next_module:
            next_progress = db.query(UserLearningProgress).filter(
                UserLearningProgress.user_id == current_user.id,
                UserLearningProgress.module_id == next_module.id
            ).first()
            
            if next_progress:
                next_progress.status = "IN_PROGRESS"
    else:
        progress.status = "IN_PROGRESS"
    
    db.commit()
    
    return QuizResult(
        score=score,
        total_questions=len(quiz_data["questions"]),
        correct_answers=correct_count,
        questions_with_explanations=questions_with_explanations,
        passed=passed
    )
 
 
@router.post("/modules/{module_id}/complete")
async def complete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark modul as completed"""
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.module_id == module_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    
    if progress.quiz_score is None or progress.quiz_score < 70:
        raise HTTPException(status_code=400, detail="Must pass quiz first (>=70%)")
    
    progress.status = "COMPLETED"
    progress.completed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Module completed", "module_id": module_id}
```
 
---
 
## 7. INTEGRATION DENGAN TICKET ANALYSIS
 
### Update: `backend/app/api/tickets.py` atau `detection.py`
 
```python
from app.modules.education.gemini_service import GeminiEducationService
 
# Di dalam endpoint untuk submit/analyze ticket:
 
@router.post("/tickets/{ticket_id}/analyze", response_model=TicketResponse)
async def analyze_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    # ... existing analysis code ...
    
    # TAMBAHAN: Generate education recommendation
    try:
        recommendation = GeminiEducationService.generate_education_recommendation(
            ticket_type=ticket.ticket_type,
            url=ticket.url,
            rule_score=ticket.rule_score or 0,
            ml_score=ticket.ml_score or 0,
            ticket_content=ticket.raw_content[:1000],
            ticket_summary=ticket.summary or ""
        )
        
        ticket.education_recommendation = recommendation
    except Exception as e:
        print(f"Failed to generate education recommendation: {e}")
        ticket.education_recommendation = None
    
    db.commit()
    db.refresh(ticket)
    
    return TicketResponse.from_orm(ticket)
```
 
---
 
## Environment Variables Required
 
```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
```
 
---
 
**Ready for Implementation!**
 