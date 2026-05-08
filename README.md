# OctoSight (Phishing Detection & Mitigation Prototype)

OctoSight is a proactive anti-phishing and fraud detection system designed for digital banking security (case study: CIMB Niaga). It uses a powerful **hybrid risk-scoring engine** (35% Rule-based + 65% Machine Learning) and provides an integrated triage workflow for security analysts.

## 🚀 Key Features
- **Hybrid Risk Scoring**: Combines traditional heuristics (35%) with an advanced NLP Machine Learning model (65%) for high-accuracy phishing detection.
- **AI/ML Text Analysis**: Uses a fine-tuned Logistic Regression model with `sentence-transformers` (`paraphrase-multilingual-MiniLM-L12-v2`) and TF-IDF to predict spam and phishing in messages.
- **OCR Evidence Analysis**: Extracts and analyzes text from screenshots of suspicious websites using Tesseract OCR.
- **Real-time Phishing Analysis**: Analyzes URLs for homograph attacks, suspicious TLDs, punycode, and brand impersonation.
- **Admin Triage Dashboard**: Manage and investigate reported phishing tickets with detailed risk breakdowns and audit trails.

## 🛠 Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript, Chart.js.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy ORM, Pydantic, JWT Auth.
- **Machine Learning**: `scikit-learn`, `sentence-transformers`, `torch`, `joblib`.
- **Database**: MySQL 8.0 (Relational storage for tickets and audit trails).
- **Detection Engines**: `pytesseract` & `Pillow` (OCR), Rule Engine (`idna`, `unicodedata`).
- **Orchestration**: Docker & Docker Compose.

## 📂 Directory Structure
```text
octosight-web-app/
├── frontend/                  # Next.js Application
│   ├── app/                   # App Router (Pages, API Proxies)
│   ├── components/            # Reusable UI Components
│   └── ...                    
├── backend/                   # Modular FastAPI Application
│   ├── app/
│   │   ├── api/endpoints/     # Route handlers (auth, tickets, detection)
│   │   ├── core/              # Security, ML Engine, Rule Engine, OCR Engine
│   │   ├── db/                # Database configuration & migrations
│   │   ├── models/            # SQLAlchemy ORM Models
│   │   ├── schemas/           # Pydantic Validation Schemas
│   │   └── main.py            # App Entrypoint
│   ├── data/                  # Whitelists
│   ├── models/                # ML Pipeline artifacts (spam_pipeline.pkl)
│   ├── seed.py                # Database initial seeder
│   └── Dockerfile             
├── ml/                        # ML training pipeline and notebooks
├── docker-compose.yml         # Full-stack orchestration
└── README.md                  # Project documentation
```

## 🚥 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd octosight-web-app
   ```

2. **Start the Backend Services (API, Database, phpMyAdmin)**
   The backend, MySQL database, and phpMyAdmin are fully containerized.
   ```bash
   # Run in detached mode
   docker-compose up -d backend db phpmyadmin
   ```
   *Note: On the first run, the backend will automatically migrate the database and seed it with default accounts and 25 diverse dummy tickets.*

3. **Start the Frontend Development Server**
   The Next.js frontend is typically run locally for hot-reloading during development.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Default Credentials
If environment variables are not explicitly set, the database seed (`backend/seed.py`) falls back to these default accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@octosight.id` | `admin1234` |
| **User**  | `user@octosight.id`  | `user123`   |

*(Note: In production, change the `DEFAULT_ADMIN_PASSWORD` and `DEFAULT_USER_PASSWORD` in your environment variables!)*

### Access Points
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **phpMyAdmin**: [http://localhost:8081](http://localhost:8081)
- **MySQL External Port**: `3307`

## 🧠 ML Inference & Core APIs

The backend exposes several key endpoints for the detection flow:
- `POST /api/v1/analyze`: Generates a real-time risk score preview (Rule + ML) without saving to the database. Used by the frontend report confirmation UI.
- `POST /api/v1/report`: Finalizes the report, computes the hybrid score, saves evidence files, and persists the ticket to the database.
- `POST /api/v1/predict-spam`: A standalone endpoint to execute ML inference on text messages directly (useful for "Cek Pesan" feature).

## 🛡 Security & Compliance
- **Database**: External connections use port `3307` to avoid host conflicts.
- **RBAC**: Role-based access control is enforced via JWT. Users cannot access Admin triage endpoints.
- **File Uploads**: Evidences and screenshots are stored securely on disk and hashed to prevent collisions.

---
**Team**: CyberSentinel (Universitas Brawijaya)  
**Stakeholder**: CIMB Niaga (Simulation)
