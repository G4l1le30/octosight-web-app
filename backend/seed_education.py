import os
import sys

# Tambahkan path backend ke sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.session import SessionLocal, engine
from app.models.models import Base
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
            }
        ]
    }
]

def seed_education_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        print("Cleaning up old education data...")
        db.query(EducationArticle).delete()
        db.query(EducationModule).delete()
        db.commit()

        print("Seeding education modules...")
        for module_data in EDUCATION_MODULES_DATA:
            articles_data = module_data.pop("articles")
            module = EducationModule(**module_data)
            db.add(module)
            db.flush()
            
            for article_data in articles_data:
                article = EducationArticle(module_id=module.id, **article_data)
                db.add(article)
                
        db.commit()
        print("Education data seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding education data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_education_data()
