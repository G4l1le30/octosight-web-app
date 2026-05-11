import os
from sqlalchemy.orm import Session
from app.models.education import EducationModule, EducationArticle

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

def seed_education_data(db: Session):
    """Seed education modules and articles only if they don't exist."""
    if db.query(EducationModule).count() > 0:
        print("[Seed] Education data already exists, skipping.")
        return

    print("[Seed] Seeding education modules...")
    for module_data in EDUCATION_MODULES_DATA:
        # Create a copy to avoid mutating the original list on re-runs
        data = module_data.copy()
        articles_data = data.pop("articles")
        module = EducationModule(**data)
        db.add(module)
        db.flush()
        
        for article_data in articles_data:
            article = EducationArticle(module_id=module.id, **article_data)
            db.add(article)
            
    db.commit()
    print("[Seed] Education data seeded successfully!")
