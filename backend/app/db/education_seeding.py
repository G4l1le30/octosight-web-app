import os
from sqlalchemy.orm import Session
from app.models.education import EducationModule, EducationArticle

EDUCATION_MODULES_DATA = [
    {
        "title": "Dasar-dasar Phishing - Memahami Ancaman Dasar",
        "level": "BASIC",
        "order_index": 1,
        "description": "Pelajari definisi phishing, cara kerjanya, dan ciri-ciri dasar email phishing. Modul ini memberikan landasan untuk memahami ancaman keamanan digital yang paling umum.",
        "duration_mins": 30,
        "articles": [
            {
                "title": "Cara Mendeteksi Email Phishing: Panduan Lengkap",
                "url": "https://medium.com/@how-to-identify-phishing-email/how-to-detect-phishing-emails-a-comprehensive-guide-694df7d1794f",
                "author": "Phil Rawlins",
                "duration_mins": 4,
                "publication_date": "2024-02-02",
                "description": "Panduan komprehensif untuk mengidentifikasi email phishing dengan fokus pada pemeriksaan alamat pengirim, kesalahan tata bahasa, dan lampiran yang tidak terduga."
            },
            {
                "title": "Pencegahan Phishing - Pelajari Cara Mempertahankan Diri",
                "url": "https://medium.com/@demegorash/phishing-prevention-89579a326d7b",
                "author": "Demegorash",
                "duration_mins": 8,
                "publication_date": "2025-11-15",
                "description": "Pelajari tentang berbagai langkah keamanan yang dapat diterapkan organisasi untuk mencegah, mendeteksi, dan memitigasi ancaman phishing. Pahami kontrol keamanan email inti (SPF, DKIM, DMARC, S/MIME)."
            },
            {
                "title": "Email Phishing — Sumber Daya Utama",
                "url": "https://hassen-hannachi.medium.com/phishing-email-ultimate-resources-60bba3e99fde",
                "author": "Hassen Hannachi",
                "duration_mins": 5,
                "publication_date": "2024-04-28",
                "description": "Kumpulan alat dan sumber daya untuk menganalisis email phishing. Mencakup MXToolbox, VirusTotal, dan alat analisis ramah pengguna lainnya."
            }
        ]
    },
    {
        "title": "Pencegahan Phishing - Strategi Pertahanan Diri",
        "level": "BEGINNER",
        "order_index": 2,
        "description": "Menerapkan praktik terbaik untuk mencegah phishing. Pelajari protokol autentikasi email dan langkah-laki teknis yang dapat diterapkan.",
        "duration_mins": 25,
        "articles": [
            {
                "title": "Pendekatan Praktis Deteksi Phishing Menggunakan Header Email",
                "url": "https://ghafoorazhar.medium.com/a-practical-approach-of-phishing-detection-using-email-header-4a8384c4e681",
                "author": "Azhar Ghafoor",
                "duration_mins": 4,
                "publication_date": "2022-04-27",
                "description": "Panduan praktis untuk menganalisis header email untuk deteksi phishing. Membahas pengaturan SPF, DKIM, dan mengidentifikasi spoofing domain."
            }
        ]
    },
    {
        "title": "Rekayasa Sosial - Manipulasi Psikologis",
        "level": "INTERMEDIATE",
        "order_index": 3,
        "description": "Memahami berbagai teknik rekayasa sosial dan manipulasi psikologis. Tingkatkan kesadaran akan skenario penipuan yang lebih canggih.",
        "duration_mins": 30,
        "articles": [
            {
                "title": "Cara Mencegah Serangan Rekayasa Sosial",
                "url": "https://ip-specialist.medium.com/how-to-prevent-social-engineering-attacks-1b761e4c82ca",
                "author": "IPSpecialist",
                "duration_mins": 6,
                "publication_date": "2023-02-27",
                "description": "Tinjauan komprehensif tentang serangan rekayasa sosial dengan fokus pada mekanisme pertahanan dan tanda-tanda peringatan yang harus diwaspadai."
            }
        ]
    },
    {
        "title": "Spear Phishing & Whaling - Serangan Bertarget",
        "level": "INTERMEDIATE",
        "order_index": 4,
        "description": "Membedakan antara phishing massal, spear phishing, dan whaling. Pahami tingkat kecanggihan dan strategi penargetan serangan tingkat lanjut.",
        "duration_mins": 20,
        "articles": [
            {
                "title": "Apa itu Serangan Whaling? Penjelasan Whale Phishing",
                "url": "https://medium.com/@clouddefenseai/what-is-a-whaling-attack-whale-phishing-explained-bc215b0a90a3",
                "author": "CloudDefense.AI",
                "duration_mins": 2,
                "publication_date": "2025-05-02",
                "description": "Penjelasan mendalam tentang serangan whaling yang menargetkan eksekutif. Mencakup statistik, kerangka serangan, dan strategi pertahanan."
            }
        ]
    },
    {
        "title": "Ancaman Lanjutan - Malware & Eksploitasi Zero-Day",
        "level": "ADVANCED",
        "order_index": 5,
        "description": "Memahami konsep malware, eksploitasi zero-day, dan ancaman tingkat lanjut. Pelajari tentang siklus hidup kerentanan zero-day dan metode deteksi.",
        "duration_mins": 35,
        "articles": [
            {
                "title": "Eksploitasi Zero-Day: Penyelaman Mendalam ke dalam Ancaman yang Tidak Diketahui",
                "url": "https://medium.com/@zyadaynshtain/zero-day-exploits-a-deep-dive-into-the-unknown-threat-d1eed5f9ac74",
                "author": "Ziad Tamer",
                "duration_mins": 6,
                "publication_date": "2025-10-24",
                "description": "Penjelasan mendalam tentang siklus hidup zero-day, tantangan deteksi, dan strategi pertahanan berlapis menggunakan NGAV, EDR, dan segmentasi jaringan."
            }
        ]
    },
    {
        "title": "Dasar-dasar Ransomware - Memahami & Mencegah",
        "level": "ADVANCED",
        "order_index": 6,
        "description": "Memahami mekanik ransomware dan vektor serangan. Pelajari praktik terbaik untuk pencegahan dan strategi pemulihan tanpa membayar tebusan.",
        "duration_mins": 40,
        "articles": [
            {
                "title": "Cara Mencegah Serangan Ransomware: 10 Praktik Terbaik",
                "url": "https://ip-specialist.medium.com/how-to-prevent-ransomware-attacks-top-10-best-practices-7105f6149293",
                "author": "IPSpecialist",
                "duration_mins": 6,
                "publication_date": "2024-12-11",
                "description": "Strategi pencegahan 10 poin yang komprehensif mencakup backup, pelatihan karyawan, MFA, pemfilteran email, segmentasi jaringan, dan perencanaan respons insiden."
            }
        ]
    },
    {
        "title": "Respon Insiden - Menanggapi Serangan",
        "level": "EXPERT",
        "order_index": 7,
        "description": "Memahami siklus hidup respons insiden dan tindakan kritis dalam 24 jam pertama. Kuasai penahanan (containment), forensik, dan prosedur pemulihan.",
        "duration_mins": 45,
        "articles": [
            {
                "title": "Daftar Periksa Respon Insiden Langkah-Demi-Langkah Untuk Ransomware [2023]",
                "url": "https://medium.com/@EdwardDiazCISSP/step-by-step-incident-response-checklist-for-ransomware-with-sources-2023-e77b4ca670e5",
                "author": "Edward Diaz",
                "duration_mins": 2,
                "publication_date": "2023-05-22",
                "description": "Daftar periksa dengan praktik terbaik dari FBI dan SANS Institute. Mencakup fase deteksi, penahanan, analisis, remediasi, dan pemulihan."
            }
        ]
    },
    {
        "title": "Deteksi Lanjutan & Intelijen Ancaman Siber (CTI)",
        "level": "EXPERT",
        "order_index": 8,
        "description": "Memahami metodologi deteksi tingkat lanjut dan Cyber Threat Intelligence (CTI). Kuasai perburuan ancaman (threat hunting) dan strategi pertahanan proaktif.",
        "duration_mins": 50,
        "articles": [
            {
                "title": "Berburu Zero-Day dengan CTI: Cara Memprediksi dan Menanggapi Ancaman yang Tidak Diketahui",
                "url": "https://medium.com/@scottbolen/zero-day-hunting-with-cti-how-to-predict-and-respond-to-unknown-threats-a91b66a146b1",
                "author": "Scott Bolen | RONIN OWL CTI",
                "duration_mins": 5,
                "publication_date": "2025-03-25",
                "description": "Pendekatan berbasis CTI tingkat lanjut untuk perburuan zero-day. Mencakup pengumpulan intelijen ancaman, analisis, sistem EDR, dan prosedur respons dengan skenario dunia nyata."
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
