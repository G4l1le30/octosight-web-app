# OctoSight — Anti-Phishing & Fraud Detection System

> **Capstone Project** — Fakultas Ilmu Komputer, Universitas Brawijaya 2026  
> **Case Study:** CIMB Niaga Digital Banking  
> **Topic:** Advanced Phishing & Fraud Detection (B.3)

OctoSight is an end-to-end anti-phishing and fraud detection prototype for digital banking. It provides a **streamlined reporting portal** for customers, a **hybrid AI-driven detection engine** (Rule-based 35% + Machine Learning 65%), and a **full admin triage workflow** with analytics dashboards, RBAC, SLA monitoring, and preventive education modules.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Hybrid Detection Pipeline](#hybrid-detection-pipeline)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Access Points](#access-points)
- [Default Credentials](#default-credentials)
- [User Roles & Permissions](#user-roles--permissions)
- [API Reference](#api-reference)
- [ML Pipeline](#ml-pipeline)
- [Security & Compliance](#security--compliance)
- [Team](#team)

---

## Key Features

### For End Users (Bank Customers)

| Feature | Description |
|---|---|
| **Incident Reporting** | Submit phishing/fraud reports (SMS, WhatsApp, Email, Website, Transaction) with evidence screenshots |
| **Hybrid Risk Analysis** | Real-time preview of risk score before submission — combines rule heuristics + ML prediction |
| **Message Checker** | Standalone ML-powered tool to scan suspicious messages ("Cek Pesan") |
| **Ticket Tracking** | Real-time status tracking for submitted reports (OCTO-XXXX-XXXX-XXXX format) |
| **Educational Modules** | Microlearning content about phishing trends, prevention tips, and interactive quizzes |
| **Personalized Recommendations** | AI-generated (Gemini) security tips tailored to report type and risk level |
| **In-App Notifications** | Push-style notification bell with real-time updates on ticket status changes |

### For Administrators (Fraud Analysts)

| Feature | Description |
|---|---|
| **Kanban Board** | Drag-and-drop workflow for ticket status transitions (Submitted → In Review → Confirmed → Mitigated → Closed) |
| **Triage Pipeline** | Paginated, filterable ticket list with inline assignment + priority management |
| **Investigation Workspace** | Deep-dive ticket view with rule/ML breakdown, OCR-extracted text, evidence viewer, ML feedback buttons (TP/FP/TN/FN) |
| **Blacklist Management** | Full CRUD for blacklisted URLs, bank accounts, phone numbers, email addresses |
| **Rule Configuration** | Dynamic rule editor — modify detection keywords, scam scenarios, TLDs, URL shorteners, brand terms in real-time |
| **Analytics Dashboard** | 4+ Chart.js widgets: incident trends (line), modus distribution (bar), channel breakdown (pie/donut), risk segmentation (stacked bar), plus SLA breach monitoring |
| **User Management** | Multi-role RBAC with 7 roles (admin, moderator, investigator, analyst, cs, viewer, user) and activation/deactivation |
| **Activity Feed** | Real-time audit trail of all system actions with color-coded event types |
| **Transaction Monitor** | Mock bank transaction viewer with anomaly analysis |
| **Bulk Operations** | Batch update ticket status, priority, and assignment |
| **Email Notifications** | Automated email alerts on ticket creation, status changes, warnings |
| **Export** | CSV export for tickets |

### Detection Engine

| Capability | Detail |
|---|---|
| **Whitelist/Blacklist** | Domain-level whitelist (36 legitimate CIMB domains) + 4 blacklist types |
| **Rule Engine** | 40+ detection rules across categories: typosquatting, punycode, mixed-scripts, brand impersonation, URL shorteners, suspicious TLDs, phishing keywords, scam scenarios (4 types), gibberish text, malicious attachments |
| **ML Engine** | Logistic Regression + TF-IDF (scikit-learn), trained on 2,000+ samples, 85%+ accuracy |
| **Hybrid Score** | `final = (rule_score × 0.35) + (ml_score × 0.65)` with context-aware overrides |
| **OCR Engine** | Tesseract OCR for screenshot text extraction + reference number extraction |
| **Gibberish Detector** | 10 analysis modes: placeholder text, keyboard smash, repetitive chars, cyclic repeats, excessive symbols, entropy analysis, stopword ratio, etc. |
| **Scam Scenario Detector** | 4 built-in scenarios: accident, legal, wrong transfer, banking urgency |
| **Context Overrides** | Blacklisted → 100, Whitelisted → 0, Gibberish → 70/30 split, Scam without URL → 80/20 split |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
├─────────────────────────────────────────────────────────┤
│         Next.js 15 (App Router) — React 19               │
│  Tailwind CSS · Chart.js · @dnd-kit · Zod · Sonner       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│              Caddy Reverse Proxy (:80 / :443)             │
│            SSL termination · Path-based routing           │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐  ┌──────────▼──────────────────────┐
│  Frontend (:3000)   │  │  Backend API (:8000)             │
│  Next.js App Router │  │  FastAPI (Python 3.11)           │
│  API Proxy routes   │  │  Router → Service → Repository   │
└─────────────────────┘  │  JWT Auth · Rate Limit · CORS    │
                         └──────────┬──────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────▼──────────┐  ┌──────────▼────────┐  ┌────────────▼──────────┐
│  MySQL 8.0 (:3306)  │  │  Redis 7 (:6379)  │  │  Celery (Worker+Beat) │
│  Tickets · Users    │  │  Cache · Session  │  │  SLA Monitoring       │
│  Blacklists · Audit │  │  Rate Limit Store │  │  Background Tasks     │
│  Education · Mock   │  └───────────────────┘  └───────────────────────┘
└─────────────────────┘
```

### Docker Services

| Service | Image | Port | Dependencies |
|---|---|---|---|
| `caddy` | caddy:2-alpine | 80, 443 | frontend, backend |
| `frontend` | node:20-alpine (dev) | 3000 | backend |
| `backend` | python:3.11-slim | 8000 | db, redis |
| `db` | mysql:8.0 | 3306 | — |
| `redis` | redis:7-alpine | 6379 | — |
| `celery_worker` | python:3.11-slim | — | db, redis |
| `celery_beat` | python:3.11-slim | — | db, redis |
| `phpmyadmin` | phpmyadmin | 8081 | db |

---

## Hybrid Detection Pipeline

```
User Report Input
     │
     ├── 1. Input Sanitization (strip HTML, block javascript: URIs)
     ├── 2. Global Blacklist Check (URL · Account · Phone · Email)
     ├── 3. Mock Bank Validation (reference number lookup, mutation verification)
     ├── 4. OCR Engine (Tesseract — text extraction from evidence screenshots)
     ├── 5. Rule Engine (40+ rules across 10 categories → rule_score 0–100)
     ├── 6. ML Engine (TF-IDF → Logistic Regression → ml_score 0–100)
     │
     └── 7. Hybrid Score Calculation
              │
              ├── Whitelisted ──────────────► final = 0
              ├── Blacklisted ──────────────► final = 100
              ├── Gibberish text detected ──► final = rule×0.70 + ml×0.30
              ├── Scam scenario + no URL ──► final = rule×0.80 + ml×0.20
              └── Standard ────────────────► final = rule×0.35 + ml×0.65
                   │
                   └── Priority: ≥75 High · ≥35 Medium · <35 Low

    Background (async):
     ├── Gemini AI → personalized education recommendation
     └── Email notification → reporter confirmation
```

### Risk Score Legend

| Score Range | Priority | Label |
|---|---|---|
| 70–100 | HIGH | Phishing |
| 40–69 | MEDIUM | Suspicious |
| 0–39 | LOW | Safe |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (App Router) | React framework with file-based routing, server components |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Chart.js** (react-chartjs-2) | Analytics dashboard charts (line, bar, pie/donut, stacked bar) |
| **@dnd-kit** | Kanban board drag-and-drop |
| **Zod** | Form validation |
| **Sonner** | Toast notifications |
| **Lucide React** | Icons |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** (Python 3.11) | Async web framework with auto-generated OpenAPI docs |
| **SQLAlchemy** 2.0 | ORM with repository pattern |
| **Pydantic v2** | Request/response validation |
| **Alembic** | Database migrations (6 migration files) |
| **Jose** (python-jose) | JWT token generation and verification |
| **Bcrypt** (passlib) | Password hashing |
| **Celery** | Async task queue (SLA breach monitoring) |
| **Redis** | Cache backend + Celery broker |
| **Slowapi** | Rate limiting |
| **FastAPI-Mail** | Email delivery with Jinja2 templates |
| **Tesseract** (pytesseract) | OCR text extraction |
| **Pillow** | Image processing |
| **Google Generative AI** | Gemini AI chat integration for education recommendations |

### Machine Learning
| Technology | Purpose |
|---|---|
| **scikit-learn** | Logistic Regression classifier |
| **TF-IDF Vectorizer** | Text feature extraction |
| **Joblib** | Model serialization (.pkl) |
| **Confusion Matrix** | Model evaluation (documented in `ml/artifacts/`) |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker Compose** | Multi-container orchestration (8 services) |
| **Caddy** | Reverse proxy, SSL termination |
| **MySQL 8.0** | Primary database |
| **Supabase Storage** | Optional cloud file storage for evidence |

---

## Project Structure

```
octosight-web-app/
│
├── frontend/                          # Next.js 15 Application
│   ├── app/                           # App Router
│   │   ├── (user)/                    # User-facing route group
│   │   │   ├── page.tsx               # Landing / home page
│   │   │   ├── report/                # Incident report form
│   │   │   ├── status/                # Ticket status lookup
│   │   │   ├── check/                 # Message checker tool
│   │   │   ├── edu/                   # Education modules
│   │   │   ├── notifications/         # In-app notification history
│   │   │   └── profile/               # User profile
│   │   ├── (auth)/                    # Authentication group
│   │   │   ├── login/                 # Login page
│   │   │   └── register/              # Registration page
│   │   ├── (admin)/                   # Admin route group
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx           # Dashboard (analytics)
│   │   │   │   ├── kanban/            # Kanban board
│   │   │   │   ├── triage/            # Ticket triage list
│   │   │   │   ├── investigate/[id]/  # Ticket deep-dive
│   │   │   │   ├── users/             # User management
│   │   │   │   ├── blacklist/         # Blacklist management
│   │   │   │   ├── transactions/      # Mock bank transactions
│   │   │   │   └── rule-config/       # Dynamic rule editor
│   │   ├── (quiz)/                    # Quiz route group
│   │   └── access-denied/             # 403 page
│   ├── components/                    # Reusable UI
│   │   ├── ui/                        # Primitives (Button, Badge, etc.)
│   │   ├── home/                      # Landing page sections
│   │   ├── admin/                     # Admin components
│   │   ├── layout/                    # Navbar, Footer, Sidebar
│   │   ├── report/                    # Report form components
│   │   └── notifications/             # Notification components
│   ├── modules/                       # Feature modules (hooks, types, fetchers)
│   ├── lib/                           # Utilities (axios, auth context)
│   ├── constants/                     # Enums, static config
│   └── types/                         # Global TypeScript types
│
├── backend/                           # FastAPI Application
│   ├── app/
│   │   ├── main.py                    # App factory, lifespan, middleware
│   │   ├── config.py                  # Pydantic BaseSettings (env vars)
│   │   ├── api/
│   │   │   ├── v1/                    # Versioned API (current)
│   │   │   │   ├── auth.py            # Login, register, Google OAuth
│   │   │   │   ├── tickets.py         # CRUD, assignment, bulk, feedback
│   │   │   │   ├── detection.py       # /report, /analyze, /predict-spam
│   │   │   │   ├── education.py       # Modules, articles, quizzes
│   │   │   │   ├── evidence.py        # File upload/download
│   │   │   │   ├── blacklist.py       # URL/account/phone/email CRUD
│   │   │   │   ├── dashboard.py       # Summary, timeline analytics
│   │   │   │   ├── notifications.py   # In-app notification CRUD
│   │   │   │   ├── activity.py        # Activity feed
│   │   │   │   ├── rule_config.py     # Dynamic rule configuration
│   │   │   │   ├── rbac.py            # Permission management
│   │   │   │   └── users.py           # User management (admin)
│   │   │   └── endpoints/             # Legacy backward-compat routers
│   │   ├── core/                      # Cross-cutting concerns
│   │   │   ├── security.py            # JWT, hashing, RBAC dependencies
│   │   │   ├── rule_engine.py         # 40+ detection rules
│   │   │   ├── ml_engine.py           # ML model inference
│   │   │   ├── ocr_engine.py          # Tesseract OCR wrapper
│   │   │   ├── engines.py             # Singleton engine instances
│   │   │   ├── exceptions.py          # Typed exception hierarchy
│   │   │   ├── error_handlers.py      # Global exception handlers
│   │   │   ├── rate_limit.py          # Slowapi configuration
│   │   │   └── cache.py               # Redis caching utilities
│   │   ├── modules/                   # Feature modules
│   │   │   ├── auth/                  # Service + Repository
│   │   │   ├── tickets/               # Service + Repository
│   │   │   ├── detection/             # Service, hybrid, similarity
│   │   │   ├── dashboard/             # Service + Repository
│   │   │   ├── blacklist/             # Service + Repository
│   │   │   ├── rule_config/           # Service + Repository
│   │   │   ├── notifications/         # Service + Email templates
│   │   │   ├── education/             # Service + Repository + Gemini
│   │   │   └── activity/              # Service + Repository
│   │   ├── models/                    # SQLAlchemy ORM models (14 tables)
│   │   ├── schemas/                   # Pydantic validation schemas
│   │   ├── services/                  # External integrations
│   │   │   ├── supabase.py            # Supabase Storage
│   │   │   └── gemini.py              # Google AI client
│   │   ├── db/                        # Database config
│   │   └── ml/                        # ML inference + feedback
│   ├── models/                        # ML artifacts (.pkl files)
│   ├── data/                          # whitelist.txt (36 domains)
│   ├── migrations/                    # Alembic migrations (0001–0006)
│   ├── seeds/                         # Seed scripts
│   ├── tests/                         # pytest (unit + integration)
│   └── uploads/                       # Local file storage
│
├── ml/                                # ML Training Pipeline
│   ├── datasets/                      # Training data
│   ├── train.py                       # Training script
│   └── artifacts/                     # Model + evaluation reports
│
├── docker-compose.yml                 # 8-service orchestration
├── AGENTS.md                          # AI agent instructions
├── ARCHITECTURE.md                    # Detailed architecture docs
├── OCTOSIGHT_PRD.md                   # Product requirements
├── SKILLS.md                          # Domain-specific guides
├── PERMISSION_MATRIX.md              # RBAC matrix (7 roles × 40+ permissions)
└── SUMMARY.md                         # Phase 2 completion summary
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 18+](https://nodejs.org/) (for local frontend dev)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) (for local backend OCR)

### Quick Start (Full Stack with Docker)

```bash
# 1. Clone and enter the project
git clone <repository-url>
cd octosight-web-app

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Wait for health checks (backend + db may take 60–90s first run)
docker compose ps
```

The backend auto-runs Alembic migrations and seeds the database on first startup (default admin account, 25+ dummy tickets, mock bank transactions, education modules).

### Local Frontend Development

```bash
cd frontend
npm install
npm run dev        # Starts on :3000, proxies API to :8000
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `octosight-secret-key-...` | JWT signing key |
| `DATABASE_URL` | `mysql+pymysql://user:pass@db:3306/octosight_db` | MySQL connection |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection |
| `MAIL_USERNAME` | — | SMTP username (for email) |
| `MAIL_PASSWORD` | — | SMTP password |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `SUPABASE_URL` | — | Supabase storage URL |
| `SUPABASE_KEY` | — | Supabase API key |
| `DEFAULT_ADMIN_EMAIL` | — | Admin seed email |
| `DEFAULT_ADMIN_PASSWORD` | — | Admin seed password |

---

## Access Points

| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:3000 | Next.js web app |
| **Swagger Docs** | http://localhost:8000/docs | Interactive API docs |
| **ReDoc** | http://localhost:8000/redoc | Alternative API docs |
| **phpMyAdmin** | http://localhost:8081 | Database management |
| **MySQL (external)** | localhost:3307 | Direct DB access |

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `octosight.admin@gmail.com` | `octosight123` |
| **Moderator** | `octosight.moderator@gmail.com` | `octosight123` |
| **Investigator** | `octosight.investigator@gmail.com` | `octosight123` |
| **Analyst** | `octosight.analyst@gmail.com` | `octosight123` |
| **CS** | `octosight.cs@gmail.com` | `octosight123` |
| **User** | `user@octosight.id` | `user123` |

> **Security:** Change all default passwords in `.env` before any production-adjacent use.

---

## User Roles & Permissions

OctoSight implements a granular RBAC system with 7 roles and 40+ permissions.

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

## API Reference

### Public / Semi-Public Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/google` | Google OAuth login |
| POST | `/api/v1/auth/refresh` | Refresh JWT tokens |
| POST | `/api/v1/predict-spam` | ML-only message analysis (unauthenticated) |
| GET | `/api/v1/education/modules` | List education modules |
| GET | `/api/v1/education/articles/{id}` | View article |

### Authenticated User Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/report` | Submit phishing report |
| POST | `/api/v1/analyze` | Preview risk score (no save) |
| POST | `/api/v1/analyze/explain` | Detailed score breakdown |
| GET | `/api/v1/tickets/me` | User's own tickets |
| GET | `/api/v1/tickets/{id}` | Ticket detail |
| POST | `/api/v1/education/articles/{id}/read` | Mark article read |
| POST | `/api/v1/education/quiz/submit` | Submit quiz answers |
| GET | `/api/v1/notifications` | In-app notifications |
| PATCH | `/api/v1/notifications/{id}/read` | Mark notification read |

### Admin Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/tickets` | List all tickets (paginated, filterable) |
| PATCH | `/api/v1/tickets/{id}/status` | Update ticket status |
| PATCH | `/api/v1/tickets/{id}/assign` | Assign ticket to analyst |
| PATCH | `/api/v1/tickets/bulk` | Bulk update tickets |
| POST | `/api/v1/tickets/{id}/feedback` | Submit ML feedback (TP/FP/TN/FN) |
| GET | `/api/v1/dashboard/summary` | Dashboard aggregation |
| GET | `/api/v1/dashboard/timeline` | Timeline analytics |
| GET | `/api/v1/activity` | Activity feed |
| GET/POST/PATCH/DELETE | `/api/v1/admin/blacklist/*` | Blacklist management |
| GET/POST/PATCH/DELETE | `/api/v1/admin/rule-config` | Rule configuration |
| GET/POST/PATCH/DELETE | `/api/v1/admin/transactions` | Mock bank transactions |
| GET/PATCH | `/api/v1/admin/users` | User management |
| GET/PATCH | `/api/v1/admin/rbac` | RBAC permission management |

---

## ML Pipeline

### Training

```
Location: ml/train.py
Algorithm: Logistic Regression
Vectorizer: TF-IDF (unigrams + bigrams, max 5000 features)
Dataset: ~2,000 labeled samples (PhishTank + UCI + synthetic)
Target Accuracy: ≥ 85%
```

### Inference Flow

```
Input text
    → TF-IDF vectorize
    → Logistic Regression predict_proba
    → confidence = max(probability) × 100
    → category = "phishing" | "not phishing"
    → ml_score = confidence (if phishing) else 100 - confidence
```

### Model Files

| File | Location |
|---|---|
| Pipeline model | `backend/models/spam_pipeline.pkl` |
| Vectorizer | `backend/models/vectorizer.pkl` |
| Eval report | `ml/artifacts/eval_report.json` |

---

## Security & Compliance

- **JWT Authentication** — Access token (15 min) + refresh token (7 days) via httpOnly cookies
- **RBAC Enforcement** — `require_permission()` decorator on all protected endpoints; admin bypass at DB query level
- **Rate Limiting** — 5 requests/second per IP (Slowapi + Redis)
- **Input Sanitization** — Strips HTML tags, blocks `javascript:` URIs, validates emails
- **File Upload Security** — Extension whitelist, size limits, content hashing
- **Password Security** — bcrypt hashing (passlib), no plaintext storage
- **SLA Monitoring** — Celery beat checks SLA deadlines every 60 seconds; breaches logged to ticket
- **Audit Trail** — Forward-only `ticket_audit_logs` table (immutable history per status change)
- **CORS** — Strict `allowed_origins` via environment variable
- **Database** — External port 3307 to avoid host conflicts; connection pooling (10–30)

---

## Database Schema (14 Tables)

| Table | Purpose |
|---|---|
| `users` | User accounts + lockout |
| `tickets` | Phishing/fraud reports + hybrid scores |
| `ticket_audit_logs` | Immutable status change history |
| `blacklisted_urls` | Malicious URL/domain list |
| `blacklisted_accounts` | Fraudulent bank accounts |
| `blacklisted_phones` | Scam phone numbers |
| `blacklisted_emails` | Phishing email addresses |
| `mock_bank_transactions` | Simulated bank transactions |
| `ml_feedback` | Admin FP/TP labels for retraining |
| `education_modules` | Learning module metadata |
| `education_articles` | Curated articles per module |
| `user_learning_progress` | Per-user module status (LOCKED/IN_PROGRESS/COMPLETED) |
| `user_article_progress` | Article read tracking |
| `user_quiz_attempts` | Quiz scores and history |
| `notifications` | In-app notification records |
| `activity_logs` | System-wide activity feed |
| `rule_config` | Dynamic detection rules |
| `permissions` | RBAC permission definitions |
| `role_permissions` | Role-to-permission mappings |

---

## Team

**CyberSentinel** — Fakultas Ilmu Komputer, Universitas Brawijaya 2026

| Role | Member |
|---|---|
| Project Lead | Rhesa Tsaqif |
| Backend Developer | — |
| Frontend Developer | — |
| ML Engineer | — |
| UI/UX Designer | — |

**Stakeholder:** CIMB Niaga (Simulation / Case Study)

---

*Built with FastAPI, Next.js, and scikit-learn. Containerized with Docker.*
