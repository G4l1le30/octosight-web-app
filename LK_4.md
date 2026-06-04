# LAPORAN LEMBAR KERJA 4

## OctoSight: Prototipe Sistem Deteksi Phishing dan Fraud Berbasis Risk Scoring dan Machine Learning pada Layanan Perbankan Digital

---

**Anggota Kelompok:**

| No | Nama | NIM |
|---|---|---|
| 1 | Samuel Nathanael Sitompul | 235150407111034 |
| 2 | Windi Adelia Sari | 235150401111040 |
| 3 | Joshua Washington Hutasoit | 235150207111037 |
| 4 | Malvinshah Haris Athala | 235150207111042 |
| 5 | Rhesa Tsaqif Adyatma | 235150200111020 |
| 6 | Muhammad Bagas Arya Pratama | 235150207111023 |
| 7 | Benedictus Giri Cahya Saputra | 235150201111065 |

---

**UNIVERSITAS BRAWIJAYA**
**FAKULTAS ILMU KOMPUTER**
**2026**

---

### A. Identitas Proyek

| Aspek | Detail |
|---|---|
| **Judul Capstone** | OctoSight: Prototipe Sistem Deteksi Phishing Berbasis Risk Scoring dan Machine Learning pada Layanan Perbankan Digital |
| **Topik** | B.3 - Advanced Phishing and Fraud |
| **Mitra / Studi Kasus** | CIMB Niaga |
| **Nama Tim Proyek** | OctoSight |

**Komposisi Tim**

| No | Nama | NIM | Prodi | Peran | Kontribusi Utama |
|---|---|---|---|---|---|
| 1 | Samuel Nathanael Sitompul | 235150407111034 | Sistem Informasi | TIF SI - NLP | NLP untuk deteksi phishing messages, Pemodelan Proses Bisnis |
| 2 | Windi Adelia Sari | 235150401111040 | Sistem Informasi | SI PTI - PM, UI/UX | Mengatur jalannya proyek, design tampilan website |
| 3 | Joshua Washington Hutasoit | 235150207111037 | Teknik Informatika | TIF - Algorithm | Risk scoring algorithm untuk URL mencurigakan |
| 4 | Malvinshah Haris Athala | 235150207111042 | Teknik Informatika | TI - Full-stack | Front-end & Back-end Fitur E-learning |
| 5 | Rhesa Tsaqif Adyatma | 235150200111020 | Teknik Informatika | TI - Full-stack | Front-end & Back-end Fitur Lapor, Riwayat, Dashboard |
| 6 | Muhammad Bagas Arya Pratama | 235150207111023 | Teknik Informatika | TIF SI - PM, QA | Mengatur proyek, memastikan fitur berjalan, membuat laporan |
| 7 | Benedictus Giri Cahya Saputra | 235150201111065 | Teknik Informatika | TIF - NLP | NLP untuk deteksi phishing messages |

---

### B. Ringkasan Solusi

Sistem perbankan digital saat ini menghadapi permasalahan utama berupa meningkatnya kasus phishing dan fraud yang masih ditangani secara reaktif, sehingga sering menimbulkan kerugian finansial dan menurunkan kepercayaan pengguna. Untuk mengatasi hal tersebut, dibangun sistem OctoSight, yaitu platform anti-phishing dan fraud berbasis risk scoring dan machine learning yang mampu mendeteksi, menganalisis, serta menangani laporan secara terintegrasi.

Sistem ini menyediakan fitur pelaporan insiden bagi nasabah, deteksi otomatis menggunakan hybrid engine (Rule-based 35% + Machine Learning 65%), workflow penanganan tiket bagi admin (triase, investigasi, blacklist management), serta modul edukasi pengguna berbasis microlearning. Sistem juga dilengkapi Google OAuth, notifikasi email via Gmail SMTP, gamifikasi profil (poin, streak, badge), sistem otorisasi berbasis peran (RBAC) dengan 7 tingkatan akses, notifikasi in-app dan email, SLA monitoring, serta dashboard analitik real-time. Tujuan dari sistem ini adalah meningkatkan kemampuan deteksi secara proaktif, mempercepat proses penanganan kasus, serta meningkatkan literasi keamanan digital pengguna.

---

### C. Capaian Kebutuhan dan Fitur Sistem

#### 1. Pemetaan Kebutuhan terhadap Fitur

| No | Kebutuhan Pengguna | Fitur/Modul yang Dibangun | Status Terpenuhi | Bukti Implementasi |
|---|---|---|---|---|
| 1 | Nasabah dapat melaporkan indikasi phishing/fraud | Modul Pelaporan Insiden (Incident Reporting) | Ya | `frontend/app/(user)/report/page.tsx` — form multi-tipe (SMS, WhatsApp, Email, Website, Transaksi) dengan upload bukti screenshot |
| 2 | Sistem dapat menganalisis tingkat risiko laporan secara otomatis | Hybrid Detection Engine (Rule + ML) | Ya | `backend/app/core/rule_engine.py` (40+ aturan) + `backend/app/core/ml_engine.py` (Logistic Regression) |
| 3 | Nasabah dapat mengecek pesan mencurigakan | Message Checker (Cek Pesan) | Ya | `frontend/app/(user)/check/page.tsx` dengan endpoint `/api/v1/predict-spam` |
| 4 | Nasabah dapat memantau status laporan | Ticket Tracking | Ya | `frontend/app/(user)/status/page.tsx` — tracking berdasarkan ID tiket |
| 5 | Nasabah mendapat notifikasi perubahan status | In-App Notifications & Email | Ya | `frontend/app/(user)/notifications/page.tsx` + `backend/app/modules/notifications/` dengan template email |
| 6 | Admin dapat mengelola tiket secara visual | Kanban Board | Ya | `frontend/components/admin/KanbanBoard.tsx` — drag-and-drop antar status |
| 7 | Admin dapat melakukan triase tiket | Triage Pipeline | Ya | `frontend/app/(admin)/admin/triage/page.tsx` — filter, search, bulk update |
| 8 | Admin dapat menyelidiki tiket secara detail | Investigation Workspace | Ya | `frontend/app/(admin)/admin/investigate/[id]/page.tsx` — detail tiket, OCR, ML feedback, evidence viewer |
| 9 | Admin dapat mengelola blacklist | Blacklist Management | Ya | `frontend/app/(admin)/admin/blacklist/page.tsx` + `backend/app/api/v1/blacklist.py` (4 tipe) |
| 10 | Admin dapat mengonfigurasi aturan deteksi | Rule Configuration | Ya | `frontend/app/(admin)/admin/rule-config/page.tsx` — editor aturan real-time |
| 11 | Sistem memiliki kontrol akses berbasis peran | RBAC (7 Roles, 37+ Permissions) | Ya | `backend/app/core/security.py` — `require_permission()` di semua endpoint |
| 12 | Admin dapat melihat dashboard analitik | Analytics Dashboard | Ya | `frontend/app/(admin)/admin/page.tsx` — Chart.js (4+ widget) |
| 13 | Nasabah dapat mengakses materi edukasi | Education Modules | Ya | `frontend/app/(user)/edu/` + `backend/app/modules/education/` — 8 modul, 10 artikel, kuis |
| 14 | Admin mendapat notifikasi laporan baru | Admin Notifications | Ya | `backend/app/api/endpoints/detection.py` — notifikasi real-time ke admin |
| 15 | Nasabah dapat mereset password | Forgot/Reset Password | Ya | `frontend/app/(auth)/forgot-password/page.tsx` + `frontend/app/(auth)/reset-password/page.tsx` — form lupa password dan reset password dengan validasi keamanan |
| 16 | Sistem dapat memonitor SLA | SLA Monitoring | Ya | Celery beat task pengecekan SLA setiap 60 detik |
| 17 | Admin dapat mengekspor data tiket | CSV Export | Ya | `backend/app/api/v1/tickets.py` — endpoint `/api/v1/tickets/export` |
| 18 | Sistem menyediakan audit trail | Activity Log & Audit Trail | Ya | `backend/app/modules/activity/` + tabel `ticket_audit_logs` immutable |
| 19 | Nasabah mendapat rekomendasi edukasi personal | AI-generated Recommendations | Ya | Integrasi Gemini AI — rekomendasi berdasarkan tipe laporan dan tingkat risiko |
| 20 | Admin dapat memberikan feedback model ML | ML Feedback | Ya | `backend/app/api/v1/tickets.py` — endpoint feedback (TP/FP/TN/FN) |
| 21 | User dapat login dengan Google | Google OAuth Sign-In | Ya | Integrasi `@react-oauth/google` + `backend/app/api/endpoints/auth.py` — endpoint `/api/v1/auth/google` |
| 22 | User mendapat notifikasi via email | Gmail SMTP Notification | Ya | `backend/app/core/email.py` — template email (confirmed, resolved, password reset, user submission confirmation) dikirim via Gmail SMTP |
| 23 | User mendapat gamification (poin, streak, badge) | Profile Gamification | Ya | `frontend/app/(user)/profile/page.tsx` — PointsCounter, StreakTracker, BadgeCard, 14 jenis achievement |
| 24 | Admin dapat melihat aktivitas audit trail | Activity Log | Ya | `backend/app/modules/activity/` + frontend di halaman investigasi — immutable log perubahan tiket |

#### 2. Fitur Utama yang Berhasil Diselesaikan

| No | Fitur Utama | Deskripsi Singkat | Output yang Dihasilkan | Keterangan |
|---|---|---|---|---|
| 1 | **Incident Reporting** | Form multi-tipe laporan phishing dengan validasi input dan upload bukti | Data tiket tersimpan di database, notifikasi terkirim | Mendukung SMS, WhatsApp, Email, Website, Transaksi |
| 2 | **Hybrid Detection Engine** | Analisis risiko menggunakan rule engine (40+ aturan) + ML (Logistic Regression) | Risk score 0–100 dengan breakdown rule dan ML | Formula: `final = rule×0.35 + ml×0.65` dengan context-aware overrides |
| 3 | **Message Checker** | Pengecekan pesan mencurigakan tanpa perlu login | Klasifikasi phishing/not phishing dengan confidence score | Endpoint publik `/api/v1/predict-spam` |
| 4 | **RBAC (Role-Based Access Control)** | 7 roles dengan 37+ permission yang diterapkan di seluruh sistem | Pembatasan akses berbasis peran di semua endpoint API dan komponen frontend | Admin bypass, viewer read-only, user terbatas |
| 5 | **Admin Kanban Board** | Drag-and-drop workflow tiket antar status | Perubahan status tiket secara visual dengan konfirmasi | 7 kolom status, filter prioritas, sortir |
| 6 | **Analytics Dashboard** | Dashboard dengan Chart.js untuk insight data tiket | Grafik tren, distribusi modus, breakdown channel, segmentasi risiko, monitoring SLA | 5 widget dashboard real-time |
| 7 | **Blacklist Management** | CRUD 4 tipe blacklist dengan pengecekan duplikat | Blacklist URL, rekening, nomor telepon, email | Terintegrasi dengan deteksi engine |
| 8 | **Rule Configuration** | Editor aturan deteksi dinamis real-time | Aturan baru langsung mempengaruhi skoring | 5 kategori aturan (keyword, TLD, shortener, scam scenario, brand term) |
| 9 | **Education Modules** | 8 modul pembelajaran dengan artikel dan kuis interaktif | Progress belajar per pengguna, skor kuis | 4 level kesulitan (Basic → Expert) |
| 10 | **In-App Notifications** | Sistem notifikasi real-time dengan 12 tipe notifikasi | Notifikasi push-style dengan bell icon | Notifikasi edukasi khusus HIGH priority |
| 11 | **Google OAuth Sign-In** | Login satu klik dengan akun Google | Autentikasi via Google, akun otomatis terdaftar | Endpoint `/api/v1/auth/google` |
| 12 | **Email Notification Service** | Notifikasi via Gmail SMTP untuk perubahan status dan reset password | Email terkirim untuk confirmed, resolved, forgot/reset password, konfirmasi laporan | Template Jinja2 dengan desain responsif |
| 13 | **Profile Gamification** | Poin, streak harian, badge, dan 14 jenis achievement | Profil user dengan statistik dan pencapaian | PointsCounter, StreakTracker, BadgeCard komponen |
| 14 | **Activity & Audit Trail** | Log immutable untuk setiap perubahan status tiket | Riwayat audit tampil di halaman investigasi | Forward-only `ticket_audit_logs` |

#### 3. Fitur yang Belum Selesai atau Perlu Pengembangan

| No | Fitur/Bagian | Penyebab Belum Selesai | Dampak terhadap Sistem | Rencana Tindak Lanjut |
|---|---|---|---|---|
| 1 | **Real-time WebSocket Notifications** | Menggunakan polling periodik sebagai gantinya | Notifikasi tidak real-time, ada delay hingga polling berikutnya | Upgrade ke WebSocket atau Server-Sent Events |
| 2 | **ML Model Auto-retrain** | Training pipeline offline, model di-copy manual | Model statis hingga di-retrain manual | Integrasi pipeline training otomatis ke dalam Celery task |

---

### D. Evaluasi dan Pengujian Akhir Sistem

#### 1. Lingkungan Pengujian

| Aspek | Deskripsi |
|---|---|
| **Perangkat Pengujian** | Laptop dengan spesifikasi: Intel Core i7, RAM 16GB, SSD 512GB |
| **Sistem Operasi** | Windows 11 (development) + Docker Desktop (container) |
| **Browser** | Google Chrome 125+, Mozilla Firefox 126+ |
| **Database** | MySQL 8.0 (dalam container Docker) |
| **Server** | Lokal (localhost) menggunakan Docker Compose (8 services) |
| **Jumlah Pengguna Uji Coba** | 7 anggota tim + 2 pengguna eksternal |
| **Skenario Demo** | End-to-end: registrasi → login → lapor insiden → cek status → admin triase → investigasi → blacklist → edukasi |

#### 2. Hasil Pengujian Fungsional

| No | Fitur | Skenario Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|
| 1 | Registrasi Pengguna | Mendaftar dengan email dan password valid | Akun terbuat, redirect ke login | Akun terbuat, email verifikasi terkirim | ✅ Lulus |
| 2 | Login | Login dengan kredensial benar | Token JWT diberikan, redirect ke dashboard user | Token JWT ter-set di httpOnly cookie, redirect sukses | ✅ Lulus |
| 3 | Report Incident | Submit laporan tipe SMS dengan pesan phishing | Risk score dihitung, tiket terbuat, notifikasi terkirim | Risk score 85 (HIGH), tiket OCTO-XXXX terbuat, admin mendapat notifikasi | ✅ Lulus |
| 4 | Report Incident (gambar) | Submit laporan dengan upload screenshot | OCR mengekstrak teks dari gambar | Teks berhasil diekstrak, masuk ke analisis | ✅ Lulus |
| 5 | Message Checker | Masukkan pesan mencurigakan tanpa login | Klasifikasi phishing/not phishing | Klasifikasi "phishing" dengan confidence 92% | ✅ Lulus |
| 6 | Cek Status Tiket | Masukkan ID tiket yang valid | Status dan detail tiket ditampilkan | Status "In Review" dengan timeline aktif | ✅ Lulus |
| 7 | Admin Login | Login dengan akun admin | Dashboard admin terbuka | Dashboard dengan 5 widget Chart.js tampil | ✅ Lulus |
| 8 | Kanban Drag-and-Drop | Drag tiket dari "Submitted" ke "In Review" | Status berubah, audit trail tercatat | Status berubah, tercatat di audit log | ✅ Lulus |
| 9 | Triage Filter | Filter tiket berdasarkan status + prioritas | Tabel menampilkan hasil filter | Filter bekerja dengan kombinasi status dan prioritas | ✅ Lulus |
| 10 | Blacklist Add | Tambah URL ke blacklist via modal | URL terblokir untuk laporan selanjutnya | URL masuk blacklist, deteksi otomatis blocking | ✅ Lulus |
| 11 | Rule Configuration | Tambah aturan keyword baru | Aturan aktif untuk laporan berikutnya | Aturan baru langsung mempengaruhi skoring | ✅ Lulus |
| 12 | RBAC Akses | Login sebagai viewer, akses halaman users | Tombol edit users tidak muncul | Edit button tersembunyi (PermissionGate) | ✅ Lulus |
| 13 | RBAC Restriksi | Login sebagai user, akses /admin/triage | Redirect ke halaman akses ditolak | 403 atau redirect ke /access-denied | ✅ Lulus |
| 14 | Education Module | Buka modul dan baca artikel | Progress tercatat | Progress tersimpan di database | ✅ Lulus |
| 15 | Quiz | Jawab kuis modul | Skor tersimpan | Skor dan attempt tercatat | ✅ Lulus |
| 16 | Notifications | Ticketing berubah status | Notifikasi muncul di bell icon | Notifikasi muncul dengan tipe dan warna sesuai | ✅ Lulus |
| 17 | Forgot / Reset Password | Request reset via email, set new password with token | Password berhasil direset dan login dengan password baru | End-to-end: email → token → reset form → sukses | ✅ Lulus |
| 18 | CSV Export | Klik Download CSV di halaman triage | File CSV terunduh | CSV dengan data tiket terunduh | ✅ Lulus |
| 19 | ML Feedback | Submit feedback TP/FP pada tiket | Data feedback tersimpan | Feedback tersimpan untuk retraining | ✅ Lulus |
| 20 | Security Tips | Login page memuat tips keamanan | Tips berganti setiap 5 detik | 8 tips keamanan berotasi otomatis | ✅ Lulus |

#### 3. Hasil Pengujian Non-Fungsional

| Aspek | Indikator | Metode Uji | Hasil | Catatan |
|---|---|---|---|---|
| **Usability** | Pengguna dapat menyelesaikan tugas inti tanpa panduan | Observasi 3 pengguna baru menyelesaikan skenario lapor → cek status | Rata-rata 2 menit untuk lapor, 30 detik untuk cek status | Form laporan memiliki validasi inline yang membantu |
| **Performa** | Waktu muat halaman < 3 detik | Pengukuran manual menggunakan Chrome DevTools (Network tab) | Halaman utama: 1.2s, Dashboard: 2.1s, Triage: 1.8s | Cache Redis membantu mempercepat loading |
| **Performa API** | Response time endpoint < 500ms | Pengukuran via Swagger UI + browser dev tools | `/analyze`: 180ms, `/report`: 350ms, `/predict-spam`: 120ms | ML inference membutuhkan loading model first-call |
| **Keamanan Dasar** | Password tidak tampil di response API | Inspeksi manual response login dan register | Password tidak pernah dikembalikan dalam response | Hash bcrypt tersimpan di database |
| **Keamanan RBAC** | User role rendah tidak bisa akses endpoint admin | Uji coba akses endpoint dengan token user role berbeda | 403 Forbidden untuk endpoint tanpa permission | `require_permission()` di setiap route |
| **Kompatibilitas** | Tampilan responsif di berbagai ukuran layar | Resize browser (320px, 768px, 1280px, 1920px) | Semua halaman responsif dengan 3 breakpoint | 98 file frontend telah di-refactor dengan 3-tier responsive |
| **Keandalan Sistem** | Sistem tidak crash saat input tidak valid | Input karakter spesial, SQL injection pattern, XSS payload | Input divalidasi, error tertangani dengan baik, tidak ada crash | Pengecualian terkelola di global error handlers |
| **Ketersediaan** | Docker services restart otomatis jika crash | Matikan service backend manual, tunggu 10 detik | Service restart otomatis (restart: unless-stopped) | Caddy reverse proxy tetap melayani frontend |

#### 4. Ringkasan Temuan Bug dan Perbaikan

| No | Temuan Bug/Kendala | Prioritas | Perbaikan yang Dilakukan | Status Akhir |
|---|---|---|---|---|
| 1 | `NameError: Optional` di education/service.py | Tinggi | Menambahkan `from typing import Optional` | ✅ Selesai |
| 2 | `ResponseValidationError` di education modules — field `status` tidak optional | Tinggi | Membuat `status: Optional[str] = None` di schema | ✅ Selesai |
| 3 | `predict_spam` endpoint memerlukan autentikasi | Tinggi | Mengganti dependency dari `get_current_user` ke `get_optional_user` | ✅ Selesai |
| 4 | Dashboard menampilkan NaN dan object kosong | Tinggi | Menyimpan serialisasi dict sebelum `db.commit()` | ✅ Selesai |
| 5 | Endpoint `GET /api/v1/tickets` mengembalikan objek kosong `{}` | Tinggi | `TicketResponse.model_validate(t).model_dump()` sebelum commit | ✅ Selesai |
| 6 | Duplikasi notifikasi admin (1 per admin) | Tinggi | Mengubah loop per-admin menjadi 1 notifikasi untuk first admin | ✅ Selesai |
| 7 | Notifikasi tidak terfilter untuk admin | Sedang | Menambahkan parameter `allowed_user_ids` di repository/route | ✅ Selesai |
| 8 | Warna prioritas Low terlalu gelap (#ca8a04) | Rendah | Mengubah ke `#eab308` (bright yellow) di tailwind.config | ✅ Selesai |
| 9 | Audit trail kosong tidak konsisten | Rendah | Empty state: centered, tanpa icon, font lebih besar, opacity 50% | ✅ Selesai |
| 10 | Pagination notifikasi 20/page terlalu banyak | Rendah | Mengubah PER_PAGE dari 20 ke 10 | ✅ Selesai |
| 11 | Typo CSS `py-3rounded-b-3xl` | Rendah | Menambahkan spasi yang hilang | ✅ Selesai |
| 12 | Overlay drag kanban salah warna | Sedang | Overlay mengikuti warna prioritas/risk tiket | ✅ Selesai |
| 13 | Artikel `next_article.id` error null | Sedang | Menggunakan IIFE pattern untuk guard null | ✅ Selesai |
| 14 | Tidak ada security tips di halaman auth | Rendah | Menambahkan komponen SecurityTips di login dan register | ✅ Selesai |
| 15 | 18 komponen frontend tidak terproteksi RBAC | Tinggi | Menambahkan PermissionGate/can() di semua tombol aksi | ✅ Selesai |

---

### E. Validasi Pengguna atau Mitra

#### 1. Metode Validasi

- **Wawancara singkat / demo kepada pengguna:** Demo langsung kepada 3 mahasiswa sebagai simulated user. Skenario: registrasi, lapor insiden, cek status, akses edukasi.
- **Observasi penggunaan sistem:** Mengamati interaksi pengguna dengan form laporan, message checker, dan halaman edukasi. Dicatat waktu penyelesaian dan titik kebingungan.
- **Survei kepuasan pengguna:** Kuesioner singkat (skala 1-4) diberikan setelah sesi demo. Aspek: kemudahan penggunaan, kejelasan informasi, kecepatan respons, tampilan visual.
- **Umpan balik mitra/stakeholder:** Simulasi stakeholder CIMB Niaga oleh dosen pembimbing. Fokus pada kelengkapan fitur anti-phishing, workflow investigasi, dan kesesuaian dengan regulasi perbankan.

#### 2. Ringkasan Umpan Balik

| No | Responden/Stakeholder | Masukan Utama | Kategori Masukan | Tindak Lanjut |
|---|---|---|---|---|
| 1 | Pengguna 1 (Mahasiswa) | Form laporan mudah diisi, validasi membantu | Usability | — (sudah sesuai) |
| 2 | Pengguna 2 (Mahasiswa) | Ingin tahu lebih detail tentang cara deteksi bekerja | Informasi | Menambahkan risk score breakdown di halaman hasil |
| 3 | Pengguna 3 (Mahasiswa) | Halaman edukasi informatif, kuis menantang | Kepuasan | — (sudah sesuai) |
| 4 | Simulasi Stakeholder | Workflow triase dan investigasi sudah sesuai dengan SOP perbankan | Kesesuaian | — (sudah sesuai) |
| 5 | Simulasi Stakeholder | Fitur blacklist dan rule config penting untuk operasional | Fungsional | — (sudah sesuai) |
| 6 | Simulasi Stakeholder | Perlu dipastikan tidak ada akses user biasa ke data admin | Keamanan | Dilengkapi RBAC di frontend (PermissionGate) |

#### 3. Tingkat Kesesuaian Solusi

| Aspek yang Dinilai | Skor 1-4 | Alasan Penilaian | Bukti Pendukung |
|---|---|---|---|
| Kesesuaian dengan kebutuhan pengguna | 4 | Seluruh kebutuhan fungsional utama pengguna (lapor, cek, edukasi) dan admin (triase, investigasi, dashboard) terpenuhi | Tabel pemetaan kebutuhan di bagian C.1 |
| Kemudahan penggunaan | 3 | Form sederhana dan intuitif, namun beberapa pengguna perlu adaptasi di halaman investigasi | Observasi penggunaan: rata-rata 2 menit untuk tugas dasar |
| Performa sistem | 3 | Response API cepat (<200ms untuk analisis), dashboard agak lambat (2.1s) karena banyak query | Pengukuran Chrome DevTools |
| Keamanan sistem | 4 | RBAC menyeluruh, password terhash, JWT httpOnly, rate limiting, input sanitization | Audit kode: require_permission() di semua route |
| Kelengkapan fitur | 4 | Seluruh 24 fitur utama berfungsi penuh, termasuk forgot/reset password, Google OAuth, notifikasi email, dan gamifikasi profil | Tabel capaian fitur di bagian C.2 |

---

### F. Demo dan Dokumentasi Produk

#### 1. Link dan Akses Produk

| Aspek | Detail |
|---|---|
| **Link repository** | `https://github.com/G4l1le30/octosight-web-app` |
| **Link demo/deployment** | Production: `https://octosight.vercel.app` |
| **Akun uji coba** | Tersedia di seed data (`backend/seeds/`) |
| **Link video demo** | [Video Demo OctoSight](#) |

#### 2. Skenario Demo

| No | Langkah Demo | Input/Data yang Digunakan | Output yang Ditampilkan | Catatan |
|---|---|---|---|---|
| 1 | Buka halaman utama | URL `http://localhost:3000` | Landing page dengan fitur unggulan dan navigasi | Tanpa login |
| 2 | Registrasi akun baru | Email: `test@demo.com`, Password: `Test123!` | Redirect ke halaman login, konfirmasi registrasi | — |
| 3 | Login sebagai user | Email: `user@octosight.id`, Password: `user123` | Dashboard user dengan menu Lapor, Cek, Status, Edukasi | Security tips muncul di halaman login |
| 4 | Cek pesan mencurigakan | Pesan: "Akun Anda akan diblokir, klik link berikut..." | Hasil: PHISHING dengan confidence 87% | Tanpa perlu login |
| 5 | Lapor insiden phishing | Tipe: SMS, Pesan: "Menang undian...," Sender: +628123456789 | Risk score: 92 (HIGH), Tiket: OCTO-XXXX terbentuk | Evidence screenshot bisa diupload |
| 6 | Cek status tiket | Masukkan ID tiket: OCTO-XXXX | Status "Submitted", timeline laporan | — |
| 7 | Login sebagai admin | Email: `octosight.admin@gmail.com`, Password: `octosight123` | Dashboard admin dengan widget Chart.js | 5 widget: trend, modus, channel, risk, SLA |
| 8 | Buka Kanban Board | — | Tiket terdistribusi di 7 kolom status | Drag-and-drop aktif |
| 9 | Triase tiket | Filter: status "Submitted", prioritas "High" | Tabel tiket terfilter, bisa bulk update | — |
| 10 | Investigasi tiket | Klik tombol "Investigate" pada tiket | Detail tiket, notes, evidence, ML feedback, audit trail | AI Generate Notes tersedia |
| 11 | Tambah blacklist | URL tiket, klik "Block Domain/URL" | URL masuk blacklist global | Konfirmasi modal |
| 12 | Buka edukasi | Pilih modul "Phishing Basics" | Artikel dan kuis tersedia | Progress tercatat |
| 13 | Forgot / Reset Password | Klik "Forgot Password?" di login → masukkan email → buka link reset → set password baru | Email reset terkirim, password berhasil diupdate, bisa login dengan password baru | End-to-end flow dengan validasi keamanan |
| 14 | Verifikasi RBAC | Login sebagai viewer, buka /admin/users | Edit button tidak muncul, hanya bisa melihat | PermissionGate komponen |

#### 3. Dokumentasi Antarmuka dan Fitur

*(Screenshot akan ditempelkan setelah demo)*

- **Screenshot 1:** Halaman utama — Landing page dengan hero section, fitur unggulan, navigasi user
- **Screenshot 2:** Form report — Multi-tipe form laporan dengan input pesan, sender, upload bukti
- **Screenshot 3:** Hasil analisis — Risk score breakdown, detil rule dan ML contribution
- **Screenshot 4:** Admin dashboard — 5 widget Chart.js (line, bar, pie/donut, stacked bar)
- **Screenshot 5:** Kanban board — 7 kolom status dengan kartu tiket
- **Screenshot 6:** Investigation workspace — Detail tiket, notes, evidence viewer, ML feedback
- **Screenshot 7:** Education module — Daftar modul dengan progress bar
- **Screenshot 8:** Blacklist management — Tabel 4 tipe blacklist dengan filter tab
- **Screenshot 9:** Repository — GitHub repository structure dan commit history

---

### G. Manajemen Proyek dan Kontribusi Tim

#### 1. Realisasi Timeline

| Minggu | Rencana Aktivitas | Realisasi Aktivitas | Output | Keterangan |
|---|---|---|---|---|
| 1 | Diskusi topik dan pembagian tugas | Brainstorming masalah phishing di perbankan | Topik dan scope proyek ditentukan | Scope awal terlalu luas, difokuskan pada deteksi + workflow |
| 2 | Penyusunan proposal dan studi literatur | Riset arsitektur anti-phishing, teknologi stack | Proposal capstone, pemilihan stack (FastAPI + Next.js) | Stack dipilih berdasarkan kebutuhan real-time dan skalabilitas |
| 3 | Setup repository dan Docker | Inisialisasi proyek, Docker Compose, database schema | Repository GitHub, Docker Compose 8 services | MySQL, Redis, Celery, Caddy terkonfigurasi |
| 4 | Pengembangan backend auth | Implementasi auth (register, login, JWT, bcrypt) | Endpoint auth + middleware JWT | httpOnly cookie untuk token storage |
| 5 | Pengembangan backend report + detection | Report endpoint, rule engine (40 aturan), ML integration | Endpoint `/report`, `/analyze`, `/predict-spam` | Hybrid score: rule 35% + ML 65% |
| 6 | Pengembangan backend tickets + admin | CRUD tickets, triage, blacklist, RBAC | Endpoint admin lengkap dengan RBAC | 7 roles, 37+ permissions |
| 7 | Pengembangan frontend auth + report | Halaman login, register, form report | Frontend auth dan report flow | Zod validation + responsive design |
| 8 | Pengembangan frontend admin (triage, kanban) | Triage table, Kanban board, filter | Admin triage dan Kanban | Drag-and-drop dengan @dnd-kit |
| 9 | Pengembangan frontend investigate + dashboard | Detail tiket, Chart.js dashboard, evidence viewer | Investigation workspace + dashboard | OCR text extraction, ML feedback |
| 10 | Pengembangan frontend edukasi + notifikasi | Education modules, quiz, notification system | 8 modul edukasi, in-app notifications | Gemini AI untuk rekomendasi personal |
| 11 | RBAC frontend + perbaikan bug | PermissionGate, RoleGuard, audit trail, responsive | 18 komponen frontend terproteksi RBAC | Bug fixing dan responsive 3-tier |
| 12 | Final testing, dokumentasi, laporan | UAT, bug fixing, dokumentasi API, laporan LK-4 | Laporan LK-4, video demo | Testing dan dokumentasi akhir |

#### 2. Kontribusi Anggota Tim

| Nama | Peran | Tugas yang Dikerjakan | Bukti Kontribusi | Persentase Kontribusi |
|---|---|---|---|---|
| Samuel Nathanael Sitompul | TIF SI - NLP | NLP pipeline training, dataset preparation, model evaluation, business process modeling | `ml/train.py`, `ml/datasets/`, confusion matrix, dokumentasi bisnis proses | 15% |
| Windi Adelia Sari | SI PTI - PM, UI/UX | Manajemen proyek, design UI/UX (Figma), wireframe, color system, responsive design | Design system, color constants (`constants/colors.ts`), responsive breakpoints | 15% |
| Joshua Washington Hutasoit | TIF - Algorithm | Rule engine algorithm, URL scoring algorithm, gibberish detection, risk scoring formula | `backend/app/core/rule_engine.py`, scoring formula, whitelist | 14% |
| Malvinshah Haris Athala | TI - Full-stack | Education module (frontend + backend), quiz system, article management, Gemini AI integration | `backend/app/modules/education/`, `frontend/app/(user)/edu/`, `frontend/app/(quiz)/` | 14% |
| Rhesa Tsaqif Adyatma | TI - Full-stack | Report flow (frontend + backend), ticket history, admin dashboard, Auth system | `frontend/app/(user)/report/`, `frontend/app/(user)/status/`, `frontend/app/(admin)/admin/page.tsx` | 15% |
| Muhammad Bagas Arya Pratama | TIF SI - PM, QA | Manajemen proyek, testing, dokumentasi laporan, quality assurance | Laporan LK-4, test scenarios, bug tracking, timeline monitoring | 14% |
| Benedictus Giri Cahya Saputra | TIF - NLP | NLP untuk phishing detection, model evaluation, TF-IDF vectorization, feature engineering | ML inference pipeline, `backend/app/core/ml_engine.py`, model evaluation | 13% |

#### 3. Kendala Proyek dan Solusi

| No | Kendala | Kategori | Dampak | Solusi yang Dilakukan |
|---|---|---|---|---|
| 1 | Scope awal terlalu luas | Manajemen | Risiko tidak selesai tepat waktu | Memfokuskan pada fitur inti: deteksi, workflow, edukasi |
| 2 | Docker build timeout karena `torch` dan `sentence-transformers` | Teknis | Backend tidak bisa di-build di Docker | Mengomentari dependensi berat, menggunakan model sklearn (.pkl) |
| 3 | Model ML path tidak konsisten antara training dan inference | Teknis | Model training tidak terintegrasi dengan backend | Dokumentasi path inconsistency, manual copy setelah training |
| 4 | ORM object expired setelah `db.commit()` | Teknis | Dashboard menampilkan NaN dan objek kosong | Serialisasi dict sebelum commit dengan `model_dump()` |
| 5 | Duplikasi notifikasi admin | Teknis | Admin menerima N notifikasi identik untuk 1 event | Mengubah loop per-admin menjadi 1 notifikasi untuk first admin |
| 6 | RBAC hanya di backend, frontend tidak terproteksi | Teknis | Tombol admin terlihat oleh user tanpa akses | Menambahkan PermissionGate di 18 komponen frontend |
| 7 | 500 error di education module | Teknis | Endpoint education tidak bisa diakses | Menambahkan import `Optional` di service layer |
| 8 | Responsive tidak konsisten antar halaman | Teknis | Tampilan buruk di mobile | Refactor 98 file dengan 3-tier responsive (default/sm/lg) |

---

### H. Diseminasi Hasil Proyek

Setiap kelompok membuat konten yang nantinya diupload pada `https://filkom.ub.ac.id/project/`

**Konten Diseminasi:**

1. **Judul:** OctoSight — Prototipe Sistem Deteksi Phishing dan Fraud Berbasis Risk Scoring dan Machine Learning pada Layanan Perbankan Digital
2. **Deskripsi Singkat:** OctoSight adalah platform anti-phishing dan fraud end-to-end yang menggabungkan rule-based engine dan machine learning untuk mendeteksi, menganalisis, serta menangani laporan phishing secara terintegrasi. Sistem ini menyediakan portal pelaporan bagi nasabah, workflow triase untuk admin, serta modul edukasi untuk meningkatkan literasi keamanan digital.
3. **Teknologi:** FastAPI (Python), Next.js 15 (TypeScript), MySQL 8, scikit-learn, Docker Compose
4. **Link Repository:** `https://github.com/G4l1le30/octosight-web-app`
5. **Link Video Demo:** [Video Demo OctoSight](#)

---

### I. Refleksi Pembelajaran

**Kompetensi teknis yang meningkat:**
Selama pengerjaan proyek OctoSight, seluruh anggota tim mengalami peningkatan signifikan dalam berbagai kompetensi teknis. Pembelajaran mendalam diperoleh dalam pengembangan full-stack menggunakan FastAPI dan Next.js 15 dengan TypeScript. Tim juga menguasai implementasi sistem autentikasi JWT dengan httpOnly cookies, RBAC dengan permission-based access control, serta integrasi machine learning model (scikit-learn) ke dalam REST API. Selain itu, penggunaan Docker Compose untuk orkestrasi multi-service (8 services) memberikan pengalaman berharga dalam containerisasi dan deployment. Pengelolaan database dengan SQLAlchemy ORM, migrasi dengan Alembic, dan task queue dengan Celery juga menjadi kompetensi baru yang dikuasai.

**Kompetensi kolaborasi dan komunikasi:**
Proyek ini dikerjakan oleh tim yang terdiri dari 7 anggota dengan latar belakang prodi berbeda (Sistem Informasi dan Teknik Informatika). Penggunaan Git dengan branch convention (Conventional Commits) dan GitHub untuk kolaborasi kode menjadi praktik yang sangat membantu. Pembagian tugas berdasarkan role (full-stack, NLP, algorithm, PM/QA) memungkinkan setiap anggota fokus pada area keahliannya. Komunikasi dilakukan melalui diskusi rutin dan review kode bersama. Tantangan terbesar adalah mengintegrasikan komponen yang dikembangkan secara paralel, yang berhasil diatasi dengan interface contract dan API documentation.

**Pembelajaran dari interaksi dengan pengguna/mitra:**
Simulasi interaksi dengan pengguna dan stakeholder memberikan wawasan bahwa sistem deteksi phishing harus menyeimbangkan antara akurasi deteksi dan pengalaman pengguna. Pengguna menginginkan proses pelaporan yang cepat dan sederhana, sementara stakeholder (simulasi) menekankan pentingnya audit trail dan keamanan data. Kedua perspektif ini membentuk keputusan desain seperti form multi-tipe dengan validasi inline, RBAC yang ketat, dan immutable audit logs.

**Hal yang akan dilakukan berbeda jika proyek diulang:**
Jika mengerjakan proyek ini kembali, tim akan memulai dengan pembuatan integration test lebih awal untuk menghindari regresi di tahap akhir. Selain itu, pemilihan model machine learning yang lebih ringan (tanpa sentence-transformers) akan dilakukan sejak awal untuk menghindari masalah kompatibilitas Docker. Tim juga akan mengalokasikan waktu khusus untuk responsive testing di awal siklus pengembangan, bukan di akhir.

**Keterkaitan proyek dengan capaian pembelajaran mata kuliah:**
Proyek ini mengintegrasikan capaian pembelajaran dari beberapa mata kuliah: (1) Pemrograman Web — implementasi REST API dan frontend modern, (2) Kecerdasan Buatan — pipeline machine learning untuk deteksi phishing, (3) Sistem Informasi — pemodelan proses bisnis deteksi fraud, (4) Keamanan Informasi — implementasi autentikasi, RBAC, dan secure coding practices, (5) Manajemen Proyek — perencanaan, pembagian tugas, dan monitoring timeline, (6) Basis Data — perancangan skema relasional dengan SQLAlchemy ORM dan migrasi.

---

### J. Kesimpulan Akhir dan Rencana Keberlanjutan

#### 1. Kesimpulan Akhir

Proyek OctoSight berhasil membangun prototipe sistem deteksi phishing dan fraud yang mengintegrasikan rule-based engine (40+ aturan) dan machine learning (Logistic Regression + TF-IDF) dengan hybrid scoring formula. Sistem ini menjawab permasalahan utama deteksi phishing dengan menyediakan platform end-to-end mulai dari pelaporan insiden oleh nasabah, analisis risiko otomatis, workflow penanganan oleh admin, hingga edukasi pengguna. Seluruh kebutuhan fungsional yang direncanakan telah terpenuhi sepenuhnya (24 fitur, termasuk Google OAuth, notifikasi email, gamifikasi profil, dan audit trail), didukung oleh sistem RBAC dengan 7 roles dan 37+ permissions yang diterapkan baik di backend maupun frontend. Pengujian fungsional menunjukkan seluruh fitur inti berjalan sesuai spesifikasi, dengan response API di bawah 200ms rata-rata dan tampilan responsif di berbagai ukuran layar.

#### 2. Rekomendasi Pengembangan

| No | Rekomendasi | Alasan | Prioritas | Estimasi Tindak Lanjut |
|---|---|---|---|---|
| 1 | Upgrade notifikasi ke WebSocket/SSE | Saat ini polling periodik, kurang real-time | Sedang | 2 minggu |
| 2 | Integrasi pipeline training ML otomatis (Celery) | Model statis, perlu retrain berkala dengan data feedback | Sedang | 2 minggu |
| 3 | Penambahan integration test | Cakupan test masih rendah (hanya unit test) | Sedang | 2 minggu |
| 4 | Integrasi dengan core banking API (simulasi) | Memperkaya skenario deteksi transaksi | Rendah | 4 minggu |

---

### K. Lampiran

1. **Dokumentasi demo sistem** — Video demo end-to-end (link terpisah)
2. **Screenshot fitur lengkap** — 9 screenshot antarmuka (lihat bagian F.3)
3. **Hasil survei atau wawancara validasi** — Kuesioner kepuasan pengguna (dokumen terpisah)
4. **Dokumentasi repository / commit** — GitHub: `https://github.com/G4l1le30/octosight-web-app` — 50+ commits dengan Conventional Commits
5. **Dokumen pendukung dari mitra** — Studi kasus simulasi CIMB Niaga

---

### L. Logbook Masing-Masing Mahasiswa

#### Logbook: Samuel Nathanael Sitompul (235150407111034) — NLP & Business Process

| Tanggal | Kegiatan yang Dikerjakan | Target / Tujuan | Hasil / Progress | Kendala | Solusi / Tindak Lanjut | Paraf Pembimbing |
|---|---|---|---|---|---|---|
| 21 Apr 2026 | Diskusi topik capstone dengan tim | Menentukan scope project | Scope awal berhasil dibuat | Scope terlalu luas | Membatasi fitur utama | |
| 24 Apr 2026 | Riset dataset phishing untuk training ML | Mengumpulkan dataset | Dataset SMS Spam Collection + PhishTank terkumpul | Dataset tidak balance | Oversampling kelas minoritas | |
| 28 Apr 2026 | Menulis script training ML | Pipeline Logistic Regression + TF-IDF | Model pertama berhasil di-train dengan akurasi 83% | Akurasi di bawah target (85%) | Menambahkan bigram features | |
| 5 Mei 2026 | Evaluasi model dan confusion matrix | Mencapai akurasi ≥ 85% | Akurasi 87%, F1-score 0.86 | — | — | |
| 12 Mei 2026 | Integrasi model ke backend FastAPI | Model bisa dipanggil via API | `ml_engine.py` selesai, endpoint `/predict-spam` berfungsi | Path model tidak konsisten | Dokumentasi path inconsistency | |
| 19 Mei 2026 | Pemodelan proses bisnis deteksi fraud | Dokumentasi business process | BPMN diagram selesai | — | — | |
| 26 Mei 2026 | Debug ML inference error | Memperbaiki error handling ML | Image error handling + type guard ditambahkan | — | — | |
| 2 Jun 2026 | Final testing dan dokumentasi | Verifikasi model berjalan di Docker | Model berfungsi di container dengan fallback rule-only | — | — | |

#### Logbook: Windi Adelia Sari (235150401111040) — Project Management & UI/UX

| Tanggal | Kegiatan yang Dikerjakan | Target / Tujuan | Hasil / Progress | Kendala | Solusi / Tindak Lanjut | Paraf Pembimbing |
|---|---|---|---|---|---|---|
| 21 Apr 2026 | Memimpin diskusi topik dan pembagian tugas | Menentukan arah proyek | Tim terbentuk, topik disepakati | — | — | |
| 24 Apr 2026 | Membuat wireframe UI di Figma | Design awal halaman utama dan form | Wireframe 8 halaman selesai | — | — | |
| 28 Apr 2026 | Design system: warna, tipografi, spacing | Konsistensi visual | Color system (primary, secondary, risk colors) selesai | — | — | |
| 5 Mei 2026 | Finalisasi mockup Figma | Design final untuk implementasi | Mockup 12 halaman siap | Perubahan requirement mid-project | Iterasi design | |
| 12 Mei 2026 | Koordinasi progress tim mingguan | Monitoring timeline | Progress check: backend 60%, frontend 40% | Beberapa anggota tertinggal | Realokasi tugas | |
| 19 Mei 2026 | Review responsive design | Memastikan mobile-friendly | 94 file perlu refactor responsive | Banyak halaman belum responsif | Refactor 3-tier responsive | |
| 26 Mei 2026 | Design security tips component | Menambah value untuk halaman auth | 8 tips keamanan bergilir | — | — | |
| 2 Jun 2026 | Finalisasi laporan LK-4 | Dokumentasi lengkap | Laporan selesai | — | — | |

#### Logbook: Joshua Washington Hutasoit (235150207111037) — Algorithm & Rule Engine

| Tanggal | Kegiatan yang Dikerjakan | Target / Tujuan | Hasil / Progress | Kendala | Solusi / Tindak Lanjut | Paraf Pembimbing |
|---|---|---|---|---|---|---|
| 22 Apr 2026 | Riset aturan deteksi URL phishing | Mengidentifikasi pola URL berbahaya | 10 kategori aturan teridentifikasi | — | — | |
| 25 Apr 2026 | Implementasi rule engine awal | Rule engine dasar untuk URL | 15 aturan berfungsi | — | — | |
| 29 Apr 2026 | Menambahkan aturan typosquatting | Deteksi domain tipuan | Algorithm Levenshtein distance untuk domain typosquat | False positive tinggi | Menambahkan whitelist CIMB domains | |
| 6 Mei 2026 | Implementasi gibberish detector | Deteksi teks acak/nonsens | 10 mode analisis gibberish selesai | — | — | |
| 13 Mei 2026 | Pengembangan scam scenario detector | 4 skenario penipuan | Accident, legal, wrong transfer, banking urgency | — | — | |
| 20 Mei 2026 | Hybrid scoring formula | Implementasi final score = rule×35% + ml×65% | Context-aware overrides (blacklist → 100, whitelist → 0) | — | — | |
| 27 Mei 2026 | Testing dan tuning aturan | Validasi akurasi rule engine | 40+ aturan, threshold tuning | — | — | |
| 3 Jun 2026 | Dokumentasi algoritma | Catatan teknis rule engine | Dokumentasi rule categories di README | — | — | |

#### Logbook: Malvinshah Haris Athala (235150207111042) — Full-stack Education

| Tanggal | Kegiatan yang Dikerjakan | Target / Tujuan | Hasil / Progress | Kendala | Solusi / Tindak Lanjut | Paraf Pembimbing |
|---|---|---|---|---|---|---|
| 22 Apr 2026 | Perancangan modul edukasi | 8 modul dengan 4 level | Struktur modul dan artikel siap | — | — | |
| 26 Apr 2026 | Backend education API | CRUD modul, artikel, progress | Endpoint education selesai | — | — | |
| 30 Apr 2026 | Frontend education pages | Halaman daftar modul dan artikel | `frontend/app/(user)/edu/` selesai | — | — | |
| 7 Mei 2026 | Quiz system backend | Endpoint submit quiz | Skor tersimpan di database | — | — | |
| 14 Mei 2026 | Quiz system frontend | Halaman kuis interaktif | `frontend/app/(quiz)/` selesai | Timer kuis perlu tuning | Default 10 menit per kuis | |
| 21 Mei 2026 | Integrasi Gemini AI | Rekomendasi edukasi personal | `gemini.py` + rekomendasi per tiket | API key management | Environment variable | |
| 28 Mei 2026 | Debug 500 error education | Fix NameError Optional | Service layer diperbaiki | — | — | |
| 3 Jun 2026 | Final testing education flow | End-to-end: modul → artikel → kuis | Semua flow berfungsi | — | — | |

#### Logbook: Rhesa Tsaqif Adyatma (235150200111020) — Full-stack Report, Dashboard, Auth

| Tanggal | Kegiatan yang Dikerjakan | Target / Tujuan | Hasil / Progress | Kendala | Solusi / Tindak Lanjut | Paraf Pembimbing |
|---|---|---|---|---|---|---|
| 22 Apr 2026 | Setup proyek Next.js + TypeScript + Tailwind | Boilerplate frontend | Frontend terinisialisasi dengan App Router | — | — | |
| 25 Apr 2026 | Implementasi auth frontend | Halaman login dan register | Login/register dengan JWT httpOnly cookie | — | — | |
| 29 Apr 2026 | Backend auth + JWT | Login, register, refresh, me | Endpoint auth + middleware security.py | — | — | |
| 6 Mei 2026 | Form report frontend | Multi-tipe report form | Form SMS, WhatsApp, Email, Website, Transaksi | Validasi kompleks | Zod schema per tipe | |
| 13 Mei 2026 | Backend report + detection | Endpoint `/report`, `/analyze` | Report flow lengkap dengan hybrid scoring | Image upload handling | Supabase storage fallback | |
| 20 Mei 2026 | Admin dashboard frontend | Chart.js widgets | 5 widget: trend, modus, channel, risk, SLA | NaN bug di dashboard | Serialisasi sebelum commit | |
| 22 Mei 2026 | RBAC frontend | PermissionGate, usePermissions | 18 komponen terproteksi | — | — | |
| 27 Mei 2026 | Ticket serialization fix | Fix empty object response | `model_dump()` sebelum commit | — | — | |
| 28 Mei 2026 | Responsive refactor | 3-tier responsive | 94 file frontend di-refactor | Banyak file | Script otomatis | |
| 3 Jun 2026 | Forgot/Reset password frontend pages | Implementasi UI forgot + reset password | `forgot-password` dan `reset-password` halaman selesai | — | — | |
| 3 Jun 2026 | Bug fixing dan testing | Perbaikan akhir | Bugs teratasi, testing selesai | — | — | |

#### Logbook: Muhammad Bagas Arya Pratama (235150207111023) — PM & QA

| Tanggal | Kegiatan yang Dikerjakan | Target / Tujuan | Hasil / Progress | Kendala | Solusi / Tindak Lanjut | Paraf Pembimbing |
|---|---|---|---|---|---|---|
| 21 Apr 2026 | Menyusun proposal capstone | Dokumen proposal | Proposal selesai | — | — | |
| 24 Apr 2026 | Setup Git repository + branch convention | Infrastructure kolaborasi | GitHub repo + branch protection rules | — | — | |
| 28 Apr 2026 | Menyusun test scenarios | Dokumen testing | Test plan 20 skenario fungsional | — | — | |
| 5 Mei 2026 | Testing backend auth + report | Validasi endpoint | Semua endpoint berfungsi, 1 bug ditemukan (predict-spam auth) | predict-spam butuh auth | Ganti ke get_optional_user | |
| 12 Mei 2026 | Monitoring progress mingguan | Timeline compliance | Progress 70%, sesuai timeline | — | — | |
| 19 Mei 2026 | Regression testing setelah RBAC | Validasi RBAC tidak merusak fitur lain | Tidak ada regresi | — | — | |
| 26 Mei 2026 | Dokumentasi bug dan perbaikan | Bug tracking | 15 bugs tercatat dan diperbaiki | — | — | |
| 2 Jun 2026 | Final testing + laporan LK-4 | Dokumentasi akhir | Laporan selesai, video demo direkam | — | — | |

#### Logbook: Benedictus Giri Cahya Saputra (235150201111065) — NLP & ML Pipeline

| Tanggal | Kegiatan yang Dikerjakan | Target / Tujuan | Hasil / Progress | Kendala | Solusi / Tindak Lanjut | Paraf Pembimbing |
|---|---|---|---|---|---|---|
| 22 Apr 2026 | Studi literatur NLP untuk phishing detection | Memahami pendekatan NLP | Referensi TF-IDF + Logistic Regression untuk phishing | — | — | |
| 25 Apr 2026 | Persiapan dataset training | Mengumpulkan dan membersihkan data | ~2,000 samples siap | Label imbalance | Oversampling | |
| 29 Apr 2026 | Feature engineering TF-IDF | Ekstraksi fitur teks | Unigrams + bigrams, max 5000 features | — | — | |
| 6 Mei 2026 | Training Logistic Regression model | Model pertama | Akurasi 85% tercapai | — | — | |
| 13 Mei 2026 | Evaluasi dengan confusion matrix | Validasi model | Precision 0.87, Recall 0.84, F1 0.86 | — | — | |
| 20 Mei 2026 | Integrasi model ke ml_engine.py | Inference melalui API | Model loading + prediction workflow | torch dependency berat | Fallback sklearn-only | |
| 27 Mei 2026 | Debugging model path inconsistency | Path model konsisten | Dokumentasi path untuk manual copy | Training vs inference beda path | Update environment variable | |
| 3 Jun 2026 | Final testing ML pipeline | Verifikasi end-to-end | Model berfungsi dengan accuracy 87% | — | — | |

---

### M. Penilaian (Diisi Dosen)

| Aspek | Deskripsi Penilaian | Skor (1-4) |
|---|---|---|
| Kesesuaian Solusi | Solusi sesuai dengan masalah, kebutuhan pengguna, dan ruang lingkup proyek | |
| Kelengkapan Implementasi | Fitur inti berjalan dan memiliki bukti implementasi yang jelas | |
| Kualitas Pengujian | Pengujian dilakukan dengan skenario yang relevan dan hasil terdokumentasi | |
| Validasi Pengguna/Mitra | Ada umpan balik pengguna/mitra dan tindak lanjut yang jelas | |
| Dokumentasi Produk | Repository, screenshot, demo, dan dokumentasi teknis tersedia | |
| Manajemen Proyek | Timeline, pembagian tugas, dan kontribusi tim terdokumentasi | |
| Refleksi dan Keberlanjutan | Tim mampu mengevaluasi hasil dan merumuskan pengembangan lanjutan | |
| Kualitas Laporan | Laporan rapi, sistematis, dan mudah dipahami | |

**Catatan Dosen:**


---

*Dokumen ini disusun oleh Tim OctoSight — Fakultas Ilmu Komputer, Universitas Brawijaya 2026*
