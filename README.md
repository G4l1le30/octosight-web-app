# OctoSight 🛡️ — Anti-Phishing & Fraud Detection

> Hybrid AI-driven phishing/fraud detection for digital banking.  
> Case study: CIMB Niaga · Built with FastAPI + Next.js + scikit-learn

![Architecture](https://img.shields.io/badge/stack-FastAPI%20%7C%20Next.js%20%7C%20MySQL-blue)
![ML](https://img.shields.io/badge/ML-scikit--learn-orange)
![Auth](https://img.shields.io/badge/auth-JWT%20%7C%20RBAC-green)
![Docker](https://img.shields.io/badge/docker-compose-2496ED)

---

## ✨ Key Features

**👤 For Users**
- **Report** phishing/fraud (SMS, WhatsApp, Email, Website, Transaction) with evidence uploads
- **AI Preview** — hybrid risk score before submitting (rule engine + ML)
- **Message Checker** — standalone ML scanner for suspicious messages
- **Track tickets** in real time, get personalized education tips from Gemini AI

**🔐 For Admins**
- **Kanban + Triage** — drag-and-drop status workflow, bulk operations, CSV export
- **Investigation workspace** — rule/ML breakdown, OCR-extracted text, evidence viewer, ML feedback (TP/FP/TN/FN)
- **Manage** blacklists, dynamic detection rules, users (7 roles), and mock bank transactions
- **Analytics dashboard** — incident trends, modus distribution, channel breakdown, SLA monitoring
- **RBAC** — 7 roles (admin → user) with 40+ granular permissions

**🧠 Detection Engine**
- Rule engine (40+ rules) × ML (Logistic Regression + TF-IDF) → hybrid score
- OCR (Tesseract), gibberish detection (10 modes), scam scenario classifier
- Blacklist/whitelist overrides, context-aware weighting

---

## 🏗️ Architecture

```
┌─ Browser ─────────────────────────────────┐
│  Next.js 15 · Tailwind · Chart.js · @dnd-kit │
└──────────────────┬────────────────────────┘
                   │ HTTPS
┌──────────────────▼────────────────────────┐
│         Caddy Reverse Proxy               │
└──────────────────┬────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐        ┌─────▼──────────────┐
   │ Frontend │        │ Backend (FastAPI)  │
   │  :3000   │        │  :8000             │
   └──────────┘        │ JWT · RBAC · CORS  │
                       └─────┬──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐        ┌────▼─────┐        ┌─────▼──────────┐
   │  MySQL 8 │        │  Redis 7 │        │ Celery (Worker │
   │   :3306  │        │  :6379   │        │  + Beat)       │
   └──────────┘        └──────────┘        └────────────────┘
```

8 Docker services: `caddy` · `frontend` · `backend` · `db` · `redis` · `celery_worker` · `celery_beat` · `phpmyadmin`

---

## ⚡ Hybrid Detection Pipeline

```
User Input → Sanitize → Blacklist Check → OCR → Rule Engine → ML Engine
                                                                    ↓
                              Hybrid Score = rule×0.35 + ml×0.65
                              Overrides: blacklisted→100, whitelisted→0,
                              gibberish→70/30, scam+noURL→80/20
```

| Score | Priority |
|---|---|
| 70–100 | 🔴 High |
| 40–69  | 🟡 Medium |
| 0–39   | 🟢 Low |

---

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Chart.js, @dnd-kit, Zod |
| **Backend** | FastAPI (Python 3.11), SQLAlchemy 2.0, Pydantic v2, Alembic, Celery, Redis |
| **ML** | scikit-learn (Logistic Regression), TF-IDF, Joblib |
| **Infra** | Docker Compose, Caddy, MySQL 8.0, Supabase Storage |

---

## 🚀 Getting Started

```bash
git clone <repo-url> && cd octosight-web-app
cp .env.example .env
docker compose up -d
```

Backend auto-runs migrations + seeds (25+ tickets, mock transactions, education modules).

**Local frontend dev:**
```bash
cd frontend && npm install && npm run dev
```

---

## 🔑 Access & Credentials

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| phpMyAdmin | http://localhost:8081 |

| Role | Email | Password |
|---|---|---|
| Admin | octosight.admin@gmail.com | octosight123 |
| Moderator | octosight.moderator@gmail.com | octosight123 |
| User | user@octosight.id | user123 |

> 🔒 Change default passwords in `.env` for production use.

---

## 📁 Project Layout

```
octosight-web-app/
├── frontend/          # Next.js 15 (user + admin routes)
├── backend/           # FastAPI (router → service → repository)
│   ├── app/api/v1/    # 12 route modules
│   ├── app/core/      # Security, rule engine, ML inference, OCR
│   ├── app/modules/   # 9 feature modules
│   └── migrations/    # Alembic (6 migrations)
├── ml/                # Training pipeline
└── docker-compose.yml
```

---

## 🤝 Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/amazing`)
2. Commit your changes (`git commit -m 'feat: add amazing feature'`)
3. Push to the branch (`git push origin feat/amazing`)
4. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

*Built with FastAPI, Next.js, and scikit-learn. Containerized with Docker.*
