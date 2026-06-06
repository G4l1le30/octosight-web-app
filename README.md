# OctoSight — Anti-Phishing & Fraud Detection System

> **Capstone Project** — Fakultas Ilmu Komputer, Universitas Brawijaya 2026 · Case Study: CIMB Niaga Digital Banking

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-000000?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

OctoSight is an end-to-end anti-phishing and fraud detection prototype for digital banking. It provides a **streamlined reporting portal** for customers, a **hybrid AI-driven detection engine** (Rule-based 35% + Machine Learning 65%), and a **full admin triage workflow** with analytics dashboards, RBAC, SLA monitoring, and preventive education modules.

---

## ✨ Features

### 🧑‍💼 For End Users

| # | Feature | Description |
|---|---|---|
| 1 | **Incident Reporting** | Submit phishing/fraud reports (SMS, WhatsApp, Email, Website, Transaction) with evidence screenshots |
| 2 | **Hybrid Risk Analysis** | Real-time preview of risk score — combines rule heuristics + ML prediction |
| 3 | **Message Checker** | Standalone ML-powered tool to scan suspicious messages (no login required) |
| 4 | **Ticket Tracking** | Real-time status tracking for submitted reports |
| 5 | **In-App Notifications** | Push-style notification bell with real-time status change alerts |
| 6 | **Email Notifications** | Gmail SMTP-powered email alerts for status changes and password reset |
| 7 | **Educational Modules** | Microlearning content with quizzes, articles, and prevention tips (8 modules, 4 difficulty levels) |
| 8 | **Personalized Recommendations** | AI-generated (Gemini) security tips tailored to report type and risk level |
| 9 | **Link Validation** | Security indicator for reported URLs — safe, suspicious, or dangerous |
| 10 | **Profile & Gamification** | Points, streaks, badges, and achievements (14 achievement types) for user engagement |
| 11 | **Google OAuth Sign-In** | One-click login with Google account |
| 12 | **Forgot / Reset Password** | Self-service password reset via email with secure token |

### 🕵️ For Administrators

| # | Feature | Description |
|---|---|---|
| 1 | **Analytics Dashboard** | Chart.js widgets: incident trends, modus distribution, channel breakdown, risk segmentation, SLA monitoring |
| 2 | **Kanban Board** | Drag-and-drop workflow for ticket status transitions across 7 columns |
| 3 | **Triage Pipeline** | Paginated, filterable ticket list (status, priority, date range) with inline assignment and CSV export |
| 4 | **Investigation Workspace** | Deep-dive ticket view with rule/ML breakdown, OCR text extraction, evidence viewer, ML feedback, AI-generated notes |
| 5 | **Blacklist Management** | CRUD for blacklisted URLs, bank accounts, phone numbers, emails — 4 types with duplicate checking |
| 6 | **Rule Configuration** | Dynamic rule editor — modify 40+ detection rules in real-time across 5 categories |
| 7 | **User Management** | Multi-role RBAC with 7 roles, create/edit/activate/deactivate accounts |
| 8 | **Bulk Operations** | Batch update ticket status, priority, and assignment |
| 9 | **Admin Notifications** | Real-time alerts for new reports, filtered per admin role |
| 10 | **Activity Log & Audit Trail** | Forward-only immutable history of all ticket changes (admin_id, timestamp, action, notes) |

### 🔍 Detection Engine

| Capability | Detail |
|---|---|
| **Rule Engine** | 40+ rules: typosquatting, punycode, brand impersonation, URL shorteners, phishing keywords, 4 scam scenarios |
| **ML Engine** | Logistic Regression + TF-IDF (scikit-learn), trained on 2,000+ samples, ≥85% accuracy |
| **Hybrid Score** | `final = (rule_score × 0.35) + (ml_score × 0.65)` with context-aware overrides (blacklist → 100, whitelist → 0) |
| **OCR Engine** | Tesseract OCR for screenshot text extraction from uploaded evidence |
| **Gibberish Detector** | 10 analysis modes: placeholder text, keyboard smash, entropy analysis, etc. |
| **Scam Scenario Detector** | 4 built-in scenarios: accident, legal, wrong transfer, banking urgency |
| **Risk Classification** | Priority: ≥75 High · ≥35 Medium · <35 Low |

---

## 🛠️ Tech Stack

**Frontend:** Next.js 15 (App Router) · React 19 · TypeScript 6 · Tailwind CSS 3 · Chart.js (recharts) · @dnd-kit (Kanban) · Zod (validation) · Axios (HTTP) · Lucide (icons) · Sonner (toasts) · next-themes

**Backend:** FastAPI (Python 3.11) · SQLAlchemy 2.0 ORM · Pydantic v2 · Alembic (migrations) · Celery + Redis (task queue) · JWT (jose) · bcrypt (passlib) · Slowapi (rate limiting) · Tesseract OCR · Gemini AI (recommendations) · Jinja2 (email templates)

**ML:** scikit-learn (Logistic Regression) · TF-IDF Vectorizer · Joblib (serialization)

**Infrastructure:** Docker Compose (8 services) · MySQL 8.0 · Caddy (reverse proxy) · Supabase Storage (optional, evidence files)

---

## 👥 User Requirements

| No | Requirement | Stakeholder |
|---|---|---|
| 1 | Report phishing messages/links easily through the application | User |
| 2 | Link validation to check URL safety level | User |
| 3 | Automatic warning notifications for suspicious activity | User |
| 4 | Simple digital security education materials | User |
| 5 | Track submitted report status (ticket tracking) | User |
| 6 | Automatic phishing detection | Admin/System |
| 7 | Manage reports through an integrated dashboard | Admin |
| 8 | Clear case handling workflow (triage, verification, mitigation) | Admin |
| 9 | Phishing data and trends in monitoring dashboard | Admin/Management |
| 10 | Risk level classification (low, medium, high) | Admin |
| 11 | Status change notifications to users | User |
| 12 | Evidence storage (screenshots, links) | User & Admin |

---

## 📋 Functional Requirements

| No | Feature | Description |
|---|---|---|
| 1 | **Login & Account Management** | Role-based login (User/Admin) with JWT httpOnly cookies; separate access for reporting/education (User) vs ticket management/dashboard (Admin) |
| 2 | **User Management** | Admin CRUD for accounts — create, change roles, activate/deactivate |
| 3 | **Phishing/Fraud Report Form** | Multi-type form (URL, sender number, modus type SMS/WhatsApp/Email/Web, summary) |
| 4 | **Evidence Upload** | Optional screenshot/file upload for admin investigation context |
| 5 | **Automatic Ticket Generation** | Unique ID, timestamp, initial "Submitted" status on report submission |
| 6 | **Ticket List & Detail** | Filterable admin list (status, priority); user history; detail page with risk score, priority, notes |
| 7 | **Rule-Based Engine** | Domain similarity, suspicious keywords, abnormal URL patterns — initial score + reasoning |
| 8 | **Machine Learning Engine** | TF-IDF + Logistic Regression for text/URL phishing probability |
| 9 | **Risk Scoring** | Combined rule + ML score (0–100) representing threat level |
| 10 | **Priority Classification** | High/Medium/Low based on risk score for admin triage |
| 11 | **Case Workflow** | Submitted → In Review → Confirmed/False Positive/Need More Info → Mitigated → Closed with audit trail |
| 12 | **Ticket Search & Filter** | Keyword search; filter by status, priority, date range |
| 13 | **Status Change Notifications** | Real-time in-app + email notifications to users |
| 14 | **Monitoring Dashboard** | Incident counts per period, dominant modus, channel distribution, priority distribution |
| 15 | **Link Validation** | Security indicator for reported URLs (safe/suspicious/dangerous) |
| 16 | **Education Modules** | Microlearning materials: phishing examples, danger signs, prevention steps |
| 17 | **Risk-Based Education Notifications** | Contextual educational alerts based on risk level |
| 18 | **CSV Export** | Export ticket summaries by date range for external reporting |

---

## 📋 Non-Functional Requirements

| Aspect | Requirement |
|---|---|
| **Security** | HTTPS (via Caddy reverse proxy), password hashing (bcrypt), RBAC (7 roles, 37+ permissions), JWT httpOnly, rate limiting (Slowapi + Redis), input sanitization |
| **Performance** | Report processing + risk scoring < 5 seconds; average API response < 200ms |
| **Usability** | Intuitive, mobile-responsive interface (3-tier breakpoints); consistent design system across 98 frontend files |
| **Reliability** | 99.9% uptime target; graceful error handling; Docker auto-restart; Celery SLA monitoring every 60s |
| **Scalability** | Modular architecture handles concurrent report submissions and simultaneous users |
| **Maintainability** | Front-end/backend separation; MTTR < 30 min; ML retraining pipeline using standard datasets (Kaggle, UCI, synthetic) |
| **Portability** | Cross-browser web application; Docker Compose for consistent deployment |

---

## 🧩 System Modules

| Module | Function |
|---|---|
| **User Management** | Account management, role-based authentication (RBAC), Google OAuth |
| **Data Processing** | Input validation, data normalization, pre-analysis preparation |
| **Reporting Service** | Accept reports, auto-generate tickets (unique ID), persist to database |
| **Rule-Based Engine** | Initial analysis: phishing keywords, suspicious URL patterns, typosquatting |
| **Machine Learning Engine** | NLP-based analysis: TF-IDF + Logistic Regression for phishing probability |
| **Risk Scoring Engine** | Combine rule (35%) + ML (65%) into 0–100 score |
| **Case Management** | Ticket workflow: Submitted → In Review → Confirmed/FP/NMI → Mitigated → Closed; audit trail |
| **Dashboard Monitoring** | Chart.js visualizations: trends, modus, channels, risk distribution, SLA |
| **Notification Service** | In-app + email (Gmail SMTP) notifications for status changes and risk-based education |
| **Link Validation** | URL security indicator based on detection analysis |
| **Education Module** | Microlearning content: 8 modules, 10+ articles, quizzes, progress tracking |
| **File Storage** | Evidence storage (screenshots) separate from database — Supabase/local |
| **Gamification** | Points, streaks, badges, achievements (14 types) for user engagement |
| **OCR Service** | Tesseract-based text extraction from uploaded evidence images |

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js 18+ (for local frontend dev)
- Tesseract OCR (for local backend OCR)

### Quick Start (Full Stack)
```bash
git clone <repository-url>
cd octosight-web-app
cp .env.example .env
docker compose up -d
```

The backend auto-runs Alembic migrations and seeds the database on first startup (admin account, 25+ dummy tickets, mock transactions, education modules, 37+ RBAC permissions).

### Local Frontend Development
```bash
cd frontend
npm install
npm run dev        # :3000, proxies API to :8000
```

### Running in Production
For production deployment (e.g., Vercel for frontend, and a VPS for backend):
1. Set `FRONTEND_URL` and `API_BASE_URL` in your backend `.env` to match your real domain (e.g., `https://octosight-web-app.vercel.app`).
2. Set `NEXT_PUBLIC_FRONTEND_URL` and `NEXT_PUBLIC_API_URL` in the frontend environment variables (or Vercel dashboard).
3. The Caddy reverse proxy will route `https://octosight-web-app.vercel.app` traffic to the backend, enabling secure cross-origin requests.

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | — | JWT signing key |
| `DATABASE_URL` | `mysql+pymysql://user:pass@db:3306/octosight_db` | MySQL connection |
| `API_BASE_URL` | `http://localhost:8000` | Backend API Base URL |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend Web App URL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL for frontend |
| `NEXT_PUBLIC_FRONTEND_URL` | `http://localhost:3000` | Frontend public URL |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | — | Gmail SMTP credentials |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GEMINI_API_KEY` | — | Google Gemini AI API key |
| `SUPABASE_URL` / `SUPABASE_KEY` | — | File storage |

### Access Points
| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:3000 | Web app |
| **Swagger Docs** | http://localhost:8000/docs | Interactive API docs |
| **phpMyAdmin** | http://localhost:8081 | Database management |

---

## 🔬 Usage

### Hybrid Detection Pipeline
```
User Report → Sanitization → Blacklist Check → Bank Validation
  → OCR (screenshots) → Rule Engine (40+ rules) → ML Engine (TF-IDF + LR)
  → Hybrid Score: rule×0.35 + ml×0.65
  → Priority: ≥75 High · ≥35 Medium · <35 Low
  → Background: Gemini AI recommendation + email notification
```

### API Examples

**Submit a report:**
```bash
curl -X POST http://localhost:8000/api/v1/report \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "SMS", "message": "Your account is locked...", "sender_numbers": "+628123456789"}'
```

**Preview risk score (no save):**
```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Urgent: your account needs verification"}'
```

**Unauthenticated ML-only scan:**
```bash
curl -X POST http://localhost:8000/api/v1/predict-spam \
  -H "Content-Type: application/json" \
  -d '{"text": "Congratulations! You won a prize..."}'
```

---

## 🏗️ Architecture

```
Client (Browser)
    │ HTTPS
    ▼
Caddy Reverse Proxy (:80/:443)
    │
    ├── Frontend (:3000) — Next.js 15 App Router
    └── Backend API (:8000) — FastAPI
            │
            ├── MySQL 8.0 (:3306) — Primary DB
            ├── Redis 7 (:6379) — Cache + Celery broker
            └── Celery (Worker + Beat) — SLA monitoring
```

### Docker Services
| Service | Image | Port | Dependencies |
|---|---|---|---|
| `caddy` | caddy:2-alpine | 80, 443 | frontend, backend |
| `frontend` | node:20-alpine | 3000 | backend |
| `backend` | python:3.11-slim | 8000 | db, redis |
| `db` | mysql:8.0 | 3306 | — |
| `redis` | redis:7-alpine | 6379 | — |
| `celery_worker` | python:3.11-slim | — | db, redis |
| `celery_beat` | python:3.11-slim | — | db, redis |
| `phpmyadmin` | phpmyadmin | 8081 | db |

---

## 📁 Project Structure

```
octosight-web-app/
├── frontend/                          # Next.js 15
│   ├── app/                           # App Router (user, auth, admin, quiz routes)
│   ├── components/                    # Reusable UI (ui/, admin/, layout/, report/)
│   ├── modules/                       # Feature modules (hooks, types, fetchers)
│   ├── lib/                           # Utilities (axios, auth context)
│   ├── constants/                     # Enums, static config
│   └── types/                         # Global TypeScript types
├── backend/                           # FastAPI
│   ├── app/
│   │   ├── api/v1/                    # Versioned API endpoints
│   │   ├── core/                      # Security, rule engine, ML engine, OCR
│   │   ├── modules/                   # Service + Repository per feature
│   │   ├── models/                    # SQLAlchemy ORM (19 tables)
│   │   └── schemas/                   # Pydantic validation
│   ├── migrations/                    # Alembic (0001–0006)
│   └── tests/                         # pytest
├── ml/                                # ML training pipeline
├── docker-compose.yml                 # 8-service orchestration
├── AGENTS.md                          # AI agent instructions
└── OCTOSIGHT_PRD.md                   # Product requirements
```

---

## 👥 Roles & Permissions

| Role | Access Level |
|---|---|
| **admin** | Full access — bypasses all permission checks |
| **moderator** | Senior operator — manage tickets, rules, blacklist |
| **investigator** | Investigation — update tickets, view rules & blacklist |
| **analyst** | Analysis — view tickets, investigate, ML feedback |
| **cs** | Customer service — view tickets, comment |
| **viewer** | Read-only — dashboard, tickets, blacklist, rules |
| **user** | End user — submit reports, education modules |

RBAC enforced at both API layer (`require_permission()` on all protected endpoints) and frontend layer (`PermissionGate` component + `can()` hook across 18+ components). Admin role bypasses at DB query level.

---

## 🔒 Security & Compliance

- **JWT Auth** — Access token (15 min) + refresh token (7 days) via httpOnly cookies
- **RBAC** — `require_permission()` on all protected endpoints; admin bypass at DB level
- **Rate Limiting** — 5 req/s per IP (Slowapi + Redis); 3 req/min for password reset
- **Input Sanitization** — Strips HTML, blocks `javascript:`, validates emails
- **File Upload** — Extension whitelist, size limits, content hashing
- **Passwords** — bcrypt hashing (passlib), no plaintext storage
- **SLA Monitoring** — Celery beat checks every 60s; breaches logged to ticket
- **Audit Trail** — Forward-only `ticket_audit_logs` (immutable history)
- **CORS** — Strict `allowed_origins` via environment variable

---

## 📚 API Reference

### Public
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/google` | Google OAuth login |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password with token |
| POST | `/api/v1/predict-spam` | ML-only scan (unauthenticated) |

### Authenticated (User)
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/report` | Submit phishing report |
| POST | `/api/v1/analyze` | Preview risk score |
| GET | `/api/v1/tickets/me` | My tickets |
| GET | `/api/v1/education/articles` | List education articles |
| POST | `/api/v1/education/articles/{id}/read` | Mark article read |
| POST | `/api/v1/education/quiz/submit` | Submit quiz answers |
| GET | `/api/v1/notifications` | In-app notifications |
| GET | `/api/v1/profile/achievements` | User achievements & gamification |

### Admin
| Method | Path | Description |
|---|---|---|
| GET/PATCH | `/api/v1/tickets` | List & manage tickets |
| GET | `/api/v1/tickets/{id}` | Ticket detail |
| GET | `/api/v1/dashboard/summary` | Dashboard aggregation |
| CRUD | `/api/v1/admin/blacklist/*` | Blacklist management |
| CRUD | `/api/v1/admin/rule-config` | Rule configuration |
| PATCH | `/api/v1/admin/users` | User management |
| GET | `/api/v1/activity/logs` | Activity & audit trail |

Full API reference available at `http://localhost:8000/docs` (Swagger/OpenAPI).

---

## 🤖 ML Pipeline

**Training:** `ml/train.py` — Logistic Regression + TF-IDF (unigrams + bigrams, max 5000 features) on ~2,000 labeled samples. Target accuracy ≥ 85% (achieved: 87%).

**Inference:** Input text → TF-IDF vectorize → Logistic Regression predict_proba → confidence → ml_score

**Evaluation:** Confusion matrix with precision 0.87, recall 0.84, F1-score 0.86.

**Model files:** `backend/models/spam_pipeline.pkl` · `backend/models/vectorizer.pkl` · `ml/artifacts/eval_report.json`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes using [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat(tickets): add evidence upload`)
4. Push and open a Pull Request

Scopes: `tickets`, `detection`, `auth`, `users`, `education`, `notifications`, `blacklist`, `dashboard`, `ml`, `db`, `frontend`, `api`

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with FastAPI, Next.js, and scikit-learn. Containerized with Docker.*
