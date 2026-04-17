# OctoSight (Phishing Detection & Mitigation Prototype)

OctoSight is a proactive anti-phishing system designed for digital banking security. It uses a hybrid risk-scoring engine (Rule-based + ML/OCR) and provides an integrated triage workflow for security analysts.

## 🚀 Key Features
- **Real-time Phishing Analysis**: Analyze URLs for homograph attacks, suspicious TLDs, and punycode.
- **OCR Evidence Analysis**: Extract and analyze text from screenshots of suspicious websites using Tesseract OCR.
- **Admin Triage Dashboard**: Manage and investigate reported phishing tickets with detailed risk breakdowns.
- **Hybrid Risk Scoring**: Combines traditional heuristics with evidence-based detection for high-accuracy scoring.

## 🛠 Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide-React.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy (ORM), Pydantic.
- **Database**: MySQL 8.0 (Relational storage for tickets and audit trails).
- **Detection Engines**: `pytesseract` & `Pillow` (OCR), `idna` & `unicodedata` (Rule Engine).
- **Orchestration**: Docker & Docker Compose.

## 📂 Directory Structure
```text
octosight-web-app/
├── frontend/             # Next.js Application
├── backend/              # FastAPI Application
│   ├── core/             # Detection Engines (OCR, Rule, Hybrid)
│   └── data/             # Whitelists and datasets
├── docker-compose.yml    # Full-stack orchestration
└── README.md             # Project documentation
```

## 🚥 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Setup
1. Clone this repository (or navigate to the project directory).
2. Start the full stack using Docker Compose:
   ```bash
   docker-compose up --build
   ```

### Access Points
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **phpMyAdmin**: [http://localhost:8081](http://localhost:8081)
- **MySQL External Port**: `3307`

## 🛡 Security & Compliance
- **Database**: External connections use port `3307` to avoid host conflicts.
- **Credentials**: Default credentials for development are provided in `docker-compose.yml`. Update these for production environments.

---
**Team**: CyberSentinel (Universitas Brawijaya)  
**Stakeholder**: CIMB Niaga (Simulation)
