# SKILLS.md — OctoSight Agent Skills

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