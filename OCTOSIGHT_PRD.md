# OctoSight — Product Requirements Document (PRD)
> Versi: 1.0 | Proyek Capstone Fakultas Ilmu Komputer, Universitas Brawijaya 2026
> Studi Kasus: CIMB Niaga | Topik B.3 — Advanced Phishing & Fraud

---

## 1. Ringkasan Produk

**OctoSight** adalah prototype sistem anti-phishing dan fraud berbasis web untuk layanan perbankan digital. Sistem ini mengintegrasikan kanal pelaporan pengguna, deteksi otomatis (rule-based + machine learning), workflow ticketing admin, dashboard analytics, dan modul edukasi preventif.

**Stack Teknis:**
- Frontend: React.js + Next.js
- Backend: FastAPI (Python)
- Database: MySQL
- ML Engine: Logistic Regression + TF-IDF
- Visualisasi: Chart.js
- Containerisasi: Docker Compose

---

## 2. Aktor & Peran

| Aktor | Akses | Deskripsi |
|---|---|---|
| `User` (Nasabah) | Frontend terbatas | Melaporkan phishing, melihat status ticket, akses edukasi |
| `Admin` (Fraud Analyst) | Dashboard penuh | Triage, verifikasi, mitigasi, monitoring analitik |
| `System` | Backend | Auto-scoring, notifikasi, audit trail |

---

## 3. Modul & Fitur

### 3.1 Autentikasi & Manajemen Akun
- Login dengan email + password untuk User dan Admin
- Role-Based Access Control (RBAC): User vs Admin
- Admin dapat menambah, mengubah peran, dan menonaktifkan akun

---

### 3.2 Form Pelaporan Phishing/Fraud (User-facing)

**Input wajib (minimal 4 field):**
- `url_or_sender` — URL mencurigakan atau nomor pengirim
- `modus_type` — Pilihan: SMS / WhatsApp / Email / Web
- `incident_summary` — Ringkasan kejadian (teks bebas)
- `report_date` — Tanggal kejadian (auto-filled, editable)

**Input opsional:**
- `evidence_file` — Upload screenshot (JPEG/PNG, max 5 MB)

**Output sistem setelah submit:**
- `ticket_id` — ID unik (format: `OCT-YYYYMMDD-XXXX`)
- `status` awal: `Submitted`
- Timestamp pelaporan
- Notifikasi konfirmasi ke User

---

### 3.3 Detection Engine

#### A. Rule-Based Engine
Jalankan pemeriksaan berurutan terhadap input. Setiap aturan yang terpicu menambah poin ke `rule_score`:

| Rule | Kondisi | Poin |
|---|---|---|
| Domain typosquatting | Edit distance ≤ 2 dari domain bank terkenal | +25 |
| Keyword phishing | Mengandung kata: `verifikasi`, `klik`, `menang`, `hadiah`, `segera`, `OTP`, `data pribadi` | +15 per kata, max +30 |
| URL struktur anomali | Subdomain berlebihan (>3 level), IP literal, port non-standar | +20 |
| Domain usia baru | Ekstensi TLD mencurigakan (`.xyz`, `.top`, `.click`, `.tk`) | +15 |
| Reputasi internal | URL ada dalam blacklist internal simulasi | +40 |

**Output:** `rule_score` (0–100, dikap di 100)

#### B. Machine Learning Engine
- Model: **Logistic Regression + TF-IDF**
- Input: teks pesan atau URL yang dinormalisasi
- Dataset: Kaggle PhishTank + UCI Phishing Websites + data sintetis lokal
- Output: `ml_probability` (0.0–1.0) → dikonversi ke `ml_score` (0–100)
- Akurasi target: ≥ 85% pada data uji

#### C. Risk Scoring Engine
Gabungkan kedua skor dengan bobot:

```
final_risk_score = (rule_score × 0.35) + (ml_score × 0.65)
```

| Risk Score | Prioritas | Label |
|---|---|---|
| 70–100 | HIGH | Phishing |
| 40–69 | MEDIUM | Suspicious |
| 0–39 | LOW | Safe |

**Output risk scoring** harus menyertakan:
- `final_risk_score` (integer 0–100)
- `priority` (HIGH / MEDIUM / LOW)
- `label` (Phishing / Suspicious / Safe)
- `explanation` — array fitur penjelas, contoh: `["domain mirip cimbniaga.co.id", "mengandung kata OTP"]`

---

### 3.4 Workflow Penanganan Kasus (Admin)

**Status Ticket & Transisi:**

```
Submitted → In Review → [Confirmed | False Positive | Need More Info]
                                ↓
                           Mitigated → Closed
```

**Aturan transisi:**
- `Submitted → In Review`: Admin mengklaim ticket (SLA: < 1 jam)
- `In Review → Confirmed`: Admin memverifikasi laporan valid
- `In Review → False Positive`: Laporan tidak terbukti phishing
- `In Review → Need More Info`: Admin meminta data tambahan dari User
- `Confirmed → Mitigated`: Admin menjalankan aksi mitigasi (SLA: < 24 jam)
- `Mitigated → Closed`: Kasus selesai

**Aksi mitigasi tersedia (simulasi):**
- Tambah URL ke blacklist internal
- Broadcast warning template ke User terdampak
- Rekomendasi blokir nomor/akun

**Audit trail wajib per perubahan status:**
- `timestamp`, `admin_id`, `action_taken`, `notes`

---

### 3.5 Dashboard & Analytics (Admin)

Tampilkan minimal 4 metrik berikut menggunakan Chart.js:

| Metrik | Tipe Chart | Deskripsi |
|---|---|---|
| Tren insiden | Line chart | Jumlah laporan per minggu/bulan |
| Top modus | Bar chart | Distribusi: SMS / WA / Email / Web |
| Top channel | Pie/Donut chart | Kanal paling sering digunakan penyerang |
| Segmentasi risiko | Stacked bar | Distribusi HIGH / MEDIUM / LOW per periode |

**Filter yang tersedia:** rentang tanggal, status ticket, prioritas

**Data awal sistem:** minimal 10–50 ticket dummy untuk keperluan demo dan uji

---

### 3.6 Link Validation (User-facing)

- Input: URL bebas dari pengguna
- Proses: jalankan Rule-Based Engine + ML Engine terhadap URL
- Output: indikator visual — 🟢 Aman / 🟡 Mencurigakan / 🔴 Berbahaya + penjelasan singkat
- Waktu respons: < 5 detik

---

### 3.7 Modul Edukasi (User-facing)

**Microlearning:**
- 3–5 materi edukasi singkat (estimasi baca 1 menit)
- Topik wajib: ciri phishing, modus terbaru, langkah keamanan, cara lapor
- Format: teks + ilustrasi sederhana

**Quiz:**
- 3 pertanyaan pilihan ganda per materi
- Tampilkan skor akhir dan feedback per jawaban
- Simpan riwayat skor pengguna

**Notifikasi berbasis risiko:**
- Ticket dengan `priority = HIGH` → tampilkan banner edukasi otomatis
- Konten notifikasi disesuaikan dengan `modus_type` yang dilaporkan

---

### 3.8 Notifikasi Sistem

| Event | Penerima | Isi |
|---|---|---|
| Laporan berhasil dikirim | User | Ticket ID + status awal |
| Status ticket berubah | User | Status baru + ringkasan tindakan admin |
| Risk score tinggi (HIGH) | User | Peringatan + link materi edukasi relevan |
| Ticket menunggu info | User | Permintaan data tambahan dari admin |

---

## 4. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Response time API | < 5 detik untuk scoring, < 2 detik untuk CRUD biasa |
| Uptime (lingkungan lokal) | 99% selama sesi demo |
| SLA triage | < 1 jam dari `Submitted` ke `In Review` |
| SLA mitigasi | < 24 jam dari `Confirmed` ke `Mitigated` |
| Akurasi model ML | ≥ 85% pada data uji (confusion matrix terdokumentasi) |
| RBAC | User tidak dapat mengakses route admin |
| Keamanan | HTTPS wajib di production; password di-hash (bcrypt) |
| MTTRS | < 30 menit |

---

## 5. Skema Data Utama

### Tabel `tickets`
```
id, ticket_code, user_id, url_or_sender, modus_type, incident_summary,
evidence_path, rule_score, ml_score, final_risk_score, priority, label,
explanation (JSON), status, created_at, updated_at
```

### Tabel `ticket_logs` (audit trail)
```
id, ticket_id, admin_id, from_status, to_status, action_taken, notes, created_at
```

### Tabel `users`
```
id, name, email, password_hash, role (user/admin), is_active, created_at
```

### Tabel `education_progress`
```
id, user_id, material_id, quiz_score, completed_at
```

### Tabel `blacklist`
```
id, value (URL/domain/nomor), added_by (admin_id), reason, created_at
```

---

## 6. Batasan (Out-of-Scope)

Hal berikut **tidak dikerjakan** dalam proyek ini:

- Integrasi dengan sistem core banking produksi CIMB Niaga
- Deteksi real-time pada traffic jaringan produksi
- Ensemble model, deep learning, atau model NLP kompleks
- Deployment cloud skala besar (hanya Docker lokal)
- Investigasi forensik digital
- Integrasi threat intelligence platform eksternal
- Aplikasi mobile (iOS/Android)

---

## 7. Kriteria Keberhasilan

| Indikator | Target Verifikasi |
|---|---|
| Form pelaporan berfungsi | Semua 4 field wajib tersimpan, ticket ID unik, tidak ada duplikat |
| Risk scoring akurat | Akurasi ≥ 85% pada test set; confusion matrix terdokumentasi |
| Workflow berjalan | 10 ticket dummy melewati semua status tanpa error |
| Dashboard tampil | 4 metrik muncul sesuai data di database |
| Edukasi berjalan | Notifikasi muncul hanya untuk risk HIGH; skor quiz tersimpan |
| Demo end-to-end | 1–2 skenario lengkap tanpa error kritis dalam satu sesi |

---

## 8. Milestone Pengembangan

| Fase | Minggu | Target |
|---|---|---|
| Setup & Baseline | 1–4 | Stack berjalan, model ML baseline, form pelaporan dasar |
| Workflow & Dashboard | 5–8 | Ticketing lengkap, dashboard 4 metrik, POC demo |
| Edukasi & Integrasi | 9–12 | Modul edukasi, notifikasi, integrasi end-to-end |
| Stabilisasi & Demo | 13–16 | Bug fixing, uji pengguna 10 orang, persiapan presentasi final |

---

## 9. Catatan untuk AI Agent

Saat mengembangkan atau memperluas kode OctoSight, perhatikan hal berikut:

1. **Selalu validasi input** sebelum memasukkan ke detection engine. Gunakan Pydantic di backend.
2. **Jangan expose model ML langsung** ke client. Semua inferensi hanya melalui endpoint API internal.
3. **Risk score adalah gabungan dua engine** — jangan hanya pakai satu. Formula bobot: rule 35%, ML 65%.
4. **Audit trail wajib** untuk setiap perubahan status ticket. Catat admin_id, timestamp, dan notes.
5. **RBAC ketat** — validasi role di setiap protected route. User tidak boleh mengakses endpoint admin.
6. **Data dummy minimal 10 ticket** harus tersedia sejak sistem pertama dijalankan (seed data).
7. **Penjelasan risk score (explainable features)** harus selalu disertakan dalam respons API, bukan hanya angka.
8. **Notifikasi edukasi hanya untuk priority HIGH** — jangan tampilkan untuk MEDIUM atau LOW.
9. **Scope terbatas** — tolak permintaan fitur di luar section 3 dokumen ini. Catat sebagai `future_work`.
10. **Target response time < 5 detik** untuk semua operasi scoring. Optimalkan jika lebih lambat.