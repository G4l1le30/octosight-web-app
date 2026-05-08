# OctoSight E-Learning & Risk-Based Education Planning

Dokumen ini memandu implementasi fitur edukasi (microlearning) dan intervensi berbasis risiko untuk pengguna literasi rendah di OctoSight, sesuai dengan kebutuhan proyek (Tujuan B.3 dan E.1 - E.3).

## 1. Peringatan & Tips Berbasis Risiko (Review Your Report)

**Tujuan**: Memberikan edukasi spesifik setelah laporan dianalisis berdasarkan *risk score*, jenis laporan, dan engine (rule-based + ML). Menggunakan API Gemini untuk menghasilkan peringatan, saran tindakan, dan tips secara dinamis.

### Perubahan Backend (FastAPI)
1. **Database Model**: Tambahkan kolom `education_recommendation` (tipe JSON/Text) pada tabel `tickets` di `backend/app/models/models.py`.
2. **Alembic Migration**: Buat file migrasi untuk penambahan kolom `education_recommendation`.
3. **Integrasi Gemini AI**:
   - Instal dependensi `google-generativeai`.
   - Buat modul `backend/app/modules/education/gemini_service.py` untuk mengelola *prompt* ke Gemini.
   - *Prompt* akan mengirimkan data: `ticket_type`, `url`, `rule_score`, `ml_score`, dan ekstrak teks/summary.
   - *Output schema*: JSON yang berisi `warnings` (array of string), `suggested_actions` (array of string), dan `tips` (array of string).
4. **Alur Analisis**: Saat analisis report selesai (pada endpoint detection/scoring), panggil `gemini_service.py` secara *asynchronous* atau dalam *background task* untuk mengisi `education_recommendation` lalu simpan ke database.
5. **Schema Pydantic**: Update `TicketResponse` di `schemas.py` agar mengembalikan field `education_recommendation`.

### Perubahan Frontend (Next.js)
1. **UI Komponen**: Pada halaman `frontend/app/(user)/dashboard/tickets/[id]/page.tsx` (Review Your Report).
2. **Integrasi Data**: Ambil object `education_recommendation` dari response API.
3. **Tampilan**: Buat komponen `<RiskEducationPanel />` yang menampilkan section *Peringatan*, *Saran Tindakan*, dan *Tips* dengan desain yang menarik (menggunakan icon peringatan/info) tepat di bawah section analisis rule/ML.

---

## 2. Security Microlearning Path (8 Modul)

**Tujuan**: Menyediakan alur belajar terstruktur (Basic hingga Expert) dengan artikel kurasi dari Medium dan aturan progresi sekuensial (harus berurutan).

### Perubahan Database & Backend
1. **Tabel Baru** (`backend/app/models/models.py`):
   - `education_modules`: `id`, `title`, `level` (Basic, Beginner, dst.), `order_index` (1-8), `description`.
   - `education_articles`: `id`, `module_id`, `title`, `url` (link Medium), `duration_mins`.
   - `user_learning_progress`: `id`, `user_id`, `module_id`, `status` (`LOCKED`, `IN_PROGRESS`, `COMPLETED`), `quiz_score`, `completed_at`.
2. **Alembic Migration**: Buat migrasi untuk 3 tabel di atas.
3. **Seeding Data**: Update `backend/seeds/` untuk memasukkan 8 modul awal dan artikel-artikel Medium terkait phishing/security.
4. **Endpoint API** (`backend/app/api/education.py`):
   - `GET /api/education/modules` -> Mengembalikan list 8 modul berserta `status` masing-masing (dihitung dari `user_learning_progress` untuk user yang sedang login). Logic: Modul 1 otomatis `IN_PROGRESS`/`UNLOCKED`, sisanya `LOCKED` sampai modul sebelumnya `COMPLETED`.
   - `GET /api/education/modules/{id}` -> Mengembalikan detail modul dan list artikel.
   - `POST /api/education/modules/{id}/complete` -> Mengupdate status modul menjadi `COMPLETED` dan menyimpan *quiz score*.

### Perubahan Frontend
1. **Learning Path UI** (`frontend/app/(user)/education/page.tsx`):
   - Tampilkan *roadmap* 8 modul mirip dengan *Dicoding learning path*.
   - Tambahkan visualisasi gembok (locked) dan ceklis (completed).
   - Indikator progres keseluruhan (misal: 25% Selesai).
2. **Module Detail UI** (`frontend/app/(user)/education/[id]/page.tsx`):
   - Menampilkan deskripsi modul dan daftar 3-4 artikel.
   - Tautan ke Medium bisa menggunakan tag `<a>` dengan `target="_blank"` atau ditampilkan dalam *iframe* jika Medium mengizinkan (direkomendasikan *external link* dengan tombol *Mark as Read*).

---

## 3. Dynamic Quiz Generator (Gemini AI)

**Tujuan**: Memberikan evaluasi 10 soal pilihan ganda di akhir setiap modul, di-*generate* secara unik oleh Gemini AI berdasarkan materi modul.

### Perubahan Backend (API)
1. **Endpoint Quiz Generator** (`GET /api/education/modules/{id}/quiz`):
   - Mengambil data artikel (judul & konteks/ringkasan) dari modul tersebut.
   - Memanggil `gemini_service.py` untuk *generate* 10 soal quiz berbentuk JSON.
   - *Format JSON yang diharapkan*:
     ```json
     {
       "questions": [
         {
           "question": "Apa ciri utama dari email phishing?",
           "options": ["A", "B", "C", "D"],
           "correct_answer_index": 1,
           "explanation": "Penjelasan mengapa B benar."
         }
       ]
     }
     ```
   - *Security Note*: Backend tidak perlu menyimpan quiz di DB karena di-*generate on the fly*, namun jika perlu, *correct_answer_index* bisa disembunyikan dan divalidasi di backend saat submit. Untuk prototipe (SKS), mengembalikan seluruh JSON ke frontend untuk dikelola *state*-nya lebih efisien.

### Perubahan Frontend
1. **Quiz UI** (`frontend/app/(user)/education/[id]/quiz/page.tsx`):
   - Menampilkan soal satu per satu atau list ke bawah.
   - *State Management* (React useState) untuk menyimpan jawaban *user*.
   - Setelah *submit*, hitung skor (`jawaban benar / 10 * 100`).
   - Tampilkan hasil (Skor, Penjelasan Jawaban).
2. **Penyelesaian**:
   - Jika skor memenuhi syarat (misal >= 70), tampilkan tombol "Selesaikan Modul".
   - Panggil `POST /api/education/modules/{id}/complete` dengan skor yang didapat.
   - *Redirect* ke halaman Learning Path utama.

---

## Langkah Eksekusi (Checklist)

1. [ ] Install dependensi `google-generativeai` di backend.
2. [ ] Tambahkan konfigurasi `GEMINI_API_KEY` di `.env` backend.
3. [ ] Buat file `gemini_service.py` untuk *prompting* laporan dan quiz.
4. [ ] Tambahkan model DB (Tabel modules, articles, progress) & kolom `education_recommendation` pada `Ticket`.
5. [ ] *Generate* Alembic migration & jalankan *upgrade*.
6. [ ] Buat *seed script* untuk data 8 modul dan artikelnya.
7. [ ] Buat endpoints FastAPI (`router.include_router(education.router)`).
8. [ ] Modifikasi sistem deteksi untuk otomatis mengisi `education_recommendation` via Gemini.
9. [ ] Implementasi UI Learning Path (`/education`).
10. [ ] Implementasi UI Quiz dinamis.
11. [ ] Uji coba progresi antar modul (lock/unlock).
12. [ ] Uji coba hasil *generate* Gemini pada laporan tiket.
