# Transaction Fraud Validation Architecture (OctoSight) - CIMB NIAGA Focused

## Konsep Utama
Fitur ini mendeteksi penipuan transaksi (struk palsu/salah kirim) dengan memvalidasi data laporan terhadap database internal yang menyimulasikan data perbankan **CIMB NIAGA**.

Sistem bekerja dengan dua tabel database utama:
1. **Mock Bank Transactions:** Menyimpan data transaksi CIMB NIAGA "asli" (simulasi). Digunakan untuk memvalidasi apakah Nomor Referensi pada struk benar-benar ada di sistem bank.
2. **Blacklisted Accounts:** Menyimpan data nomor rekening yang telah terbukti atau dilaporkan sebagai penipu (termasuk bank lain atau e-wallet).

---

## 1. Arsitektur Komponen

### A. Database-Backed Validation
Alih-alih menggunakan file statis, semua pengecekan dilakukan melalui query database:
- **Validasi Struk:** Sistem mengekstrak Nomor Referensi dari struk via OCR, lalu mencari record tersebut di tabel `mock_bank_transactions`.
- **Cek Reputasi:** Sistem mencari nomor rekening yang dilaporkan di tabel `blacklisted_accounts`.

### B. OCR Engine Enhancement (`backend/app/core/ocr_engine.py`)
- OCR Engine menggunakan *Regular Expressions (Regex)* untuk mencari pola Nomor Referensi (misal: "Ref:", "TRX ID", "OCTO-REF") pada gambar.

### C. Rule Engine Logic (`backend/app/core/rule_engine.py`)
- Jika tipe laporan adalah **Transaction**:
    1. Ambil nomor rekening input -> Cek di `blacklisted_accounts`.
    2. Ambil No. Ref hasil OCR -> Cek di `mock_bank_transactions`.
    3. Jika No. Ref ditemukan tapi data di database bank simulasi berbeda -> **Risk Score = 100**.

---

## 2. Struktur Database Baru (SQLAlchemy)

### Tabel: `mock_bank_transactions` (Data CIMB Simulasi)
```python
class MockBankTransaction(Base):
    __tablename__ = "mock_bank_transactions"
    id = Column(Integer, primary_key=True)
    reference_number = Column(String(100), unique=True, index=True) 
    sender_name = Column(String(255))
    sender_account = Column(String(50))     # Rekening Pengirim
    receiver_account = Column(String(50))   # Rekening Penerima (User)
    amount = Column(Float)
    transaction_date = Column(DateTime)
```

### Tabel: `blacklisted_accounts` (Database Penipu)
```python
class BlacklistedAccount(Base):
    __tablename__ = "blacklisted_accounts"
    id = Column(Integer, primary_key=True)
    account_number = Column(String(50), unique=True, index=True)
    bank_name = Column(String(100))
    reason = Column(Text)
    is_active = Column(Boolean, default=True)
```

---

## 4. Rencana Seeding Data (Demo CIMB NIAGA)

Untuk keperluan demo, database diisi dengan data dummy bertema CIMB:
- **Valid Transaction**: `OCTO-REF-001` (Budi CIMB User -> User Account)
- **Valid Transaction**: `OCTO-REF-002` (Siti Niaga -> User Account)
- **Blacklisted Account**: `1234567890` (OCTO Virtual - Scammer)
