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
| Feature | Description |
|---|---|
| **Incident Reporting** | Submit phishing/fraud reports (SMS, WhatsApp, Email, Website, Transaction) with evidence screenshots |
| **Hybrid Risk Analysis** | Real-time preview of risk score — combines rule heuristics + ML prediction |
| **Message Checker** | Standalone ML-powered tool to scan suspicious messages |
| **Ticket Tracking** | Real-time status tracking for submitted reports |
| **Educational Modules** | Microlearning content with quizzes and prevention tips |
| **Personalized Recommendations** | AI-generated (Gemini) security tips tailored to report type |
| **In-App Notifications** | Push-style notification bell with real-time updates |

### 🕵️ For Administrators
| Feature | Description |
|---|---|
| **Kanban Board** | Drag-and-drop workflow for ticket status transitions |
| **Triage Pipeline** | Paginated, filterable ticket list with inline assignment |
| **Investigation Workspace** | Deep-dive ticket view with rule/ML breakdown, OCR text, evidence viewer, ML feedback |
| **Blacklist Management** | CRUD for blacklisted URLs, bank accounts, phone numbers, emails |
| **Rule Configuration** | Dynamic rule editor — modify detection rules in real-time |
| **Analytics Dashboard** | Chart.js widgets: incident trends, modus distribution, channel breakdown, SLA monitoring |
| **User Management** | Multi-role RBAC with 7 roles and activation/deactivation |
| **Bulk Operations** | Batch update ticket status, priority, and assignment |

### 🔍 Detection Engine
| Capability | Detail |
|---|---|
| **Rule Engine** | 40+ rules: typosquatting, punycode, brand impersonation, URL shorteners, phishing keywords, scam scenarios |
| **ML Engine** | Logistic Regression + TF-IDF (scikit-learn), trained on 2,000+ samples, ≥85% accuracy |
| **Hybrid Score** | `final = (rule_score × 0.35) + (ml_score × 0.65)` with context-aware overrides |
| **OCR Engine** | Tesseract OCR for screenshot text extraction |
| **Gibberish Detector** | 10 analysis modes: placeholder text, keyboard smash, entropy analysis, etc. |
| **Scam Scenario Detector** | 4 built-in scenarios: accident, legal, wrong transfer, banking urgency |

---

## 🛠️ Tech Stack

**Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Chart.js · @dnd-kit · Zod · Axios

**Backend:** FastAPI (Python 3.11) · SQLAlchemy 2.0 · Pydantic v2 · Alembic · Celery · Redis · JWT (jose) · bcrypt · Tesseract OCR · Gemini AI

**ML:** scikit-learn (Logistic Regression) · TF-IDF Vectorizer · Joblib

**Infrastructure:** Docker Compose (8 services) · MySQL 8.0 · Caddy reverse proxy · Supabase Storage (optional)

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

The backend auto-runs Alembic migrations and seeds the database on first startup (admin account, 25+ dummy tickets, mock transactions, education modules).

### Local Frontend Development
```bash
cd frontend
npm install
npm run dev        # :3000, proxies API to :8000
```

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `octosight-secret-key-...` | JWT signing key |
| `DATABASE_URL` | `mysql+pymysql://user:pass@db:3306/octosight_db` | MySQL connection |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | — | SMTP credentials |
| `GOOGLE_CLIENT_ID` | — | Google OAuth |
| `SUPABASE_URL` / `SUPABASE_KEY` | — | File storage |
| `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` | — | Seed credentials |

### Access Points
| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:3000 | Web app |
| **Swagger Docs** | http://localhost:8000/docs | Interactive API docs |
| **phpMyAdmin** | http://localhost:8081 | Database management |

### Default Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `octosight.admin@gmail.com` | `octosight123` |
| **Moderator** | `octosight.moderator@gmail.com` | `octosight123` |
| **Investigator** | `octosight.investigator@gmail.com` | `octosight123` |
| **Analyst** | `octosight.analyst@gmail.com` | `octosight123` |
| **CS** | `octosight.cs@gmail.com` | `octosight123` |
| **User** | `user@octosight.id` | `user123` |

> Change all default passwords in `.env` before any production-adjacent use.

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
├── ARCHITECTURE.md                    # Detailed architecture
├── OCTOSIGHT_PRD.md                   # Product requirements
└── PERMISSION_MATRIX.md               # RBAC matrix
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

See `PERMISSION_MATRIX.md` for the complete permission-to-role mapping.

---

## 🔒 Security & Compliance

- **JWT Auth** — Access token (15 min) + refresh token (7 days) via httpOnly cookies
- **RBAC** — `require_permission()` on all protected endpoints; admin bypass at DB level
- **Rate Limiting** — 5 req/s per IP (Slowapi + Redis)
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
| POST | `/api/v1/predict-spam` | ML-only scan (unauthenticated) |

### Authenticated
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/report` | Submit phishing report |
| POST | `/api/v1/analyze` | Preview risk score |
| GET | `/api/v1/tickets/me` | My tickets |
| POST | `/api/v1/education/articles/{id}/read` | Mark article read |
| GET | `/api/v1/notifications` | In-app notifications |

### Admin
| Method | Path | Description |
|---|---|---|
| GET/PATCH | `/api/v1/tickets` | List & manage tickets |
| GET | `/api/v1/dashboard/summary` | Dashboard aggregation |
| CRUD | `/api/v1/admin/blacklist/*` | Blacklist management |
| CRUD | `/api/v1/admin/rule-config` | Rule configuration |
| PATCH | `/api/v1/admin/users` | User management |

Full API reference available at `http://localhost:8000/docs` (Swagger/OpenAPI).

---

## 🤖 ML Pipeline

**Training:** `ml/train.py` — Logistic Regression + TF-IDF (unigrams + bigrams, max 5000 features) on ~2,000 labeled samples. Target accuracy ≥ 85%.

**Inference:** Input text → TF-IDF vectorize → Logistic Regression predict_proba → confidence → ml_score

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
