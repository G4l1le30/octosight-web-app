# AGENTS.md — OctoSight AI Agent Guide

> Baca file ini **pertama kali** sebelum mengerjakan task apapun di repositori ini.
> Referensi lengkap ada di file-file yang disebutkan di bawah.

---

## Identitas Proyek

**OctoSight** adalah prototype sistem anti-phishing dan fraud untuk layanan perbankan digital (studi kasus: CIMB Niaga). Stack utama:

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Database | MySQL 8 |
| ML Engine | scikit-learn (Logistic Regression + TF-IDF) |
| Visualisasi | Chart.js |
| Containerisasi | Docker Compose |# SKILLS.md — OctoSight Agent Skills

Skills adalah panduan spesifik per domain yang harus dibaca sebelum mengerjakan task di domain tersebut.

---

## Cara Menggunakan Skill

1. Tentukan domain task: backend / frontend / ML / DB.
2. Buka skill yang relevan (bisa lebih dari satu jika task lintas domain).
3. Baca cukup untuk memahami workflow dan guardrail.
4. Ikuti skill tersebut sepanjang task. Jangan kombinasikan dengan pola lain yang bertentangan.
5. Jika task jelas di luar scope skill yang ada, gunakan `AGENTS.md` sebagai panduan umum.

---

## Daftar Skill

### 1. `octosight-backend`

**Deskripsi:** Standar pengembangan backend FastAPI untuk OctoSight. Mencakup struktur modul, layer boundaries (router → service → repository), Pydantic validation, respons API standar, error handling, autentikasi JWT, dan otorisasi berbasis role.

**Gunakan ketika:**
- Membuat route handler baru di `backend/app/api/`
- Membuat atau mengubah service, repository, atau schema Pydantic di `backend/app/modules/`
- Menambahkan endpoint ML inference
- Mengimplementasikan autentikasi atau middleware
- Menambahkan Swagger/OpenAPI docs

**File:** `BACKEND_BEST_PRACTICES.md` + `BACKEND_ENGINEERING_STANDARD.md`

---

### 2. `octosight-frontend`

**Deskripsi:** Standar pengembangan frontend Next.js 15 (App Router) + TypeScript + Tailwind CSS untuk OctoSight. Mencakup struktur halaman, komponen, Zod validation di form, pengambilan data dengan Axios, state management, dan konvensi naming.

**Gunakan ketika:**
- Membuat halaman baru di `frontend/app/`
- Membuat atau mengubah komponen di `frontend/components/`
- Membuat form pelaporan, dashboard, atau halaman edukasi
- Mengimplementasikan fetching data dari backend API
- Membuat custom hook di `frontend/modules/`

**File:** `FRONTEND_BEST_PRACTICES.md` + `FRONTEND_ENGINEERING_STANDARD.md`

---

### 3. `octosight-ml`

**Deskripsi:** Standar training, penyimpanan, dan inferensi model machine learning OctoSight (Logistic Regression + TF-IDF). Mencakup pipeline training, evaluasi (confusion matrix, F1, accuracy), serialisasi model (.pkl), dan cara mengekspos inference melalui FastAPI endpoint.

**Gunakan ketika:**
- Mengerjakan script training di `ml/train.py`
- Mengubah fitur atau vectorizer TF-IDF
- Menambahkan evaluasi model baru
- Mengintegrasikan model ke `backend/app/ml/`
- Menjalankan inference dari endpoint `/api/detection/`

**Aturan wajib:**
- Model hanya boleh diakses melalui `backend/app/ml/inference.py` — jangan load model langsung di router.
- Setiap perubahan model wajib diikuti dengan update confusion matrix di `ml/artifacts/eval_report.json`.
- Akurasi target ≥ 85% sebelum model dianggap production-ready untuk demo.
- Dataset training harus disimpan di `ml/datasets/` dan tidak di-commit jika ukuran > 50 MB (gunakan `.gitignore`).

---

### 4. `octosight-db`

**Deskripsi:** Standar pengelolaan database MySQL menggunakan SQLAlchemy ORM dan Alembic migration untuk OctoSight. Mencakup pembuatan model ORM, migration, seed data, dan konvensi penamaan kolom.

**Gunakan ketika:**
- Membuat atau mengubah tabel di `backend/models/`
- Menjalankan atau membuat migration Alembic di `backend/migrations/`
- Menambahkan atau mengubah seed data di `backend/seeds/`
- Menulis query SQLAlchemy di repository layer

**Aturan wajib:**
- Semua perubahan skema harus melalui Alembic migration — jangan edit tabel langsung via SQL tanpa migration file.
- Seed data wajib mencakup minimal: 2 akun (1 user, 1 admin) dan 10 dummy ticket dengan variasi status dan priority.
- Kolom database menggunakan `snake_case`.
- Semua tabel wajib memiliki kolom `created_at` dan `updated_at` dengan default `CURRENT_TIMESTAMP`.
- Foreign key harus eksplisit dengan `ondelete` behavior yang jelas (`CASCADE` atau `RESTRICT`).

---

## Skill Lintas Domain

Untuk task yang menyentuh lebih dari satu domain, gunakan skill dalam urutan berikut:

| Skenario | Urutan Skill |
|---|---|
| Fitur baru end-to-end | `octosight-db` → `octosight-backend` → `octosight-frontend` |
| Update ML + expose endpoint | `octosight-ml` → `octosight-backend` |
| Tambah tabel + API + UI | `octosight-db` → `octosight-backend` → `octosight-frontend` |
| Perbaikan bug frontend saja | `octosight-frontend` |
| Perbaikan logic bisnis backend | `octosight-backend` |

---

## Skill Tidak Tersedia

Jika task membutuhkan skill yang tidak ada di daftar ini (misalnya Redis caching, WebSocket, atau integrasi eksternal), gunakan `AGENTS.md` sebagai panduan umum dan tandai hasilnya sebagai `[no-skill, best-effort]` dalam commit message.
| Auth | JWT (jose) — backend issues token, frontend stores in httpOnly cookie |

---

## Struktur Repositori

```
octosight/
├── frontend/                  # Next.js App
│   ├── app/                   # Route groups, pages, layouts
│   │   ├── (auth)/            # Login, register pages
│   │   ├── (user)/            # User-facing pages
│   │   ├── (admin)/           # Admin dashboard pages
│   │   └── api/               # Next.js API proxies (thin wrappers)
│   ├── components/            # Reusable UI components
│   │   └── ui/                # Primitive UI pieces (button, badge, etc.)
│   ├── modules/               # Feature modules (hooks, types, fetchers)
│   ├── lib/                   # Shared utilities (axios, auth helpers)
│   ├── constants/             # Enums, static config
│   ├── types/                 # Global TypeScript types
│   └── public/                # Static assets
│
├── backend/                   # FastAPI App
│   ├── app/
│   │   ├── api/               # Route handlers per feature
│   │   ├── modules/           # Feature modules (service, repository, schema)
│   │   │   ├── tickets/
│   │   │   ├── detection/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── education/
│   │   │   ├── notifications/
│   │   │   ├── blacklist/
│   │   │   └── dashboard/
│   │   ├── core/              # Config, security, dependencies
│   │   ├── db/                # SQLAlchemy engine, session, base
│   │   └── ml/                # ML model loading, inference
│   ├── models/                # SQLAlchemy ORM models
│   ├── migrations/            # Alembic migration files
│   ├── seeds/                 # Seed data scripts (dummy tickets, users)
│   └── tests/                 # pytest test files
│
├── ml/                        # ML training pipeline (offline)
│   ├── datasets/              # Raw and processed datasets
│   ├── notebooks/             # Jupyter exploration notebooks
│   ├── train.py               # Training script
│   └── artifacts/             # Saved model (.pkl) and vectorizer
│
├── docker-compose.yml
└── docs/                      # PRD, ERD, API spec
    ├── OCTOSIGHT_PRD.md
    ├── AGENTS.md              ← file ini
    ├── SKILLS.md
    ├── BACKEND_BEST_PRACTICES.md
    ├── FRONTEND_BEST_PRACTICES.md
    ├── BACKEND_ENGINEERING_STANDARD.md
    └── FRONTEND_ENGINEERING_STANDARD.md
```

---

## Skills yang Tersedia

Skills adalah panduan spesifik per domain. Baca `SKILLS.md` untuk daftar lengkap.

| Skill | Gunakan ketika... |
|---|---|
| `octosight-backend` | Membuat atau mengubah FastAPI route, service, repository, schema, atau ML endpoint |
| `octosight-frontend` | Membuat atau mengubah komponen Next.js, page, hook, atau form |
| `octosight-ml` | Mengerjakan training pipeline, inference endpoint, atau evaluasi model |
| `octosight-db` | Membuat migration Alembic, seed data, atau query SQLAlchemy |

---

## Workflow Umum Agent

### Sebelum Mengerjakan Task
1. Baca task secara menyeluruh — tentukan layer mana yang terpengaruh (frontend / backend / ML / DB).
2. Buka skill yang relevan dari `SKILLS.md`.
3. Periksa apakah ada file yang sudah ada sebelum membuat yang baru.
4. Identifikasi apakah task menyentuh fitur yang ada di PRD (`OCTOSIGHT_PRD.md`). Jika tidak ada di PRD, tandai sebagai `future_work` dan tanyakan ke pengguna.

### Saat Mengerjakan
5. Ikuti layer boundaries — jangan taruh logika bisnis di route handler, jangan query DB dari service langsung tanpa repository.
6. Validasi semua input eksternal (Pydantic di backend, Zod di frontend).
7. Pastikan setiap endpoint yang mengubah data (POST/PUT/DELETE) memerlukan autentikasi + otorisasi role yang sesuai.
8. Tulis docstring / JSDoc untuk fungsi publik.

### Setelah Selesai
9. Jalankan lint dan build sebelum menyerahkan perubahan.
10. Pastikan tidak ada secret, credential, atau path absolut yang ter-hardcode.
11. Update file seed jika menambahkan tabel atau kolom baru.

---

## Aturan Wajib (Non-negotiable)

| # | Aturan |
|---|---|
| 1 | RBAC wajib — User tidak boleh mengakses endpoint admin. Validasi di setiap protected route. |
| 2 | Risk score selalu gabungan rule-based (35%) + ML (65%). Jangan skip salah satu engine. |
| 3 | Audit trail wajib untuk setiap perubahan status ticket. Simpan `admin_id`, `timestamp`, `action_taken`, `notes`. |
| 4 | Jangan expose model ML (.pkl) langsung ke client. Inferensi hanya melalui internal API endpoint. |
| 5 | Password harus di-hash dengan bcrypt. Jangan simpan plaintext. |
| 6 | Semua response API menggunakan format standar (lihat `BACKEND_BEST_PRACTICES.md`). |
| 7 | Evidence file (screenshot) disimpan ke file storage, bukan ke kolom DB. Simpan path-nya saja. |
| 8 | Notifikasi edukasi hanya untuk ticket dengan `priority = HIGH`. |
| 9 | Seed data minimal 10–50 dummy ticket harus selalu tersedia (`seeds/`). |
| 10 | Out-of-scope (core banking, cloud deploy, mobile app) → tolak dan catat sebagai `future_work`. |

---

## Konvensi Commit

Gunakan Conventional Commits:

```
feat(tickets): add evidence file upload endpoint
fix(detection): cap rule_score at 100
refactor(auth): move JWT decode to dependency
docs(api): add swagger for blacklist endpoint
test(ml): add unit test for risk score formula
```

Scope yang valid: `tickets`, `detection`, `auth`, `users`, `education`, `notifications`, `blacklist`, `dashboard`, `ml`, `db`, `frontend`, `api`.

---

## Environment Variables

Jangan pernah hardcode. Selalu gunakan `.env` (backend) dan `.env.local` (frontend).

**Backend (`.env`):**
```
DATABASE_URL=mysql+pymysql://user:pass@db:3306/octosight
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ML_MODEL_PATH=ml/artifacts/model.pkl
ML_VECTORIZER_PATH=ml/artifacts/vectorizer.pkl
UPLOAD_DIR=uploads/evidence
```

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Referensi Cepat

- PRD & fitur lengkap → `OCTOSIGHT_PRD.md`
- Skill list → `SKILLS.md`
- Backend patterns → `BACKEND_BEST_PRACTICES.md`
- Frontend patterns → `FRONTEND_BEST_PRACTICES.md`
- Backend standar detail → `BACKEND_ENGINEERING_STANDARD.md`
- Frontend standar detail → `FRONTEND_ENGINEERING_STANDARD.md`