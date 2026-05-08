import os
import json
import re
from google import genai
from google.genai import types
from typing import Dict, List

class GeminiEducationService:
    @staticmethod
    def _get_client():
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            return genai.Client(api_key=api_key)
        return None

    @staticmethod
    def _extract_json(text: str) -> Dict:
        try:
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
            json_str = match.group(1) if match else text
            return json.loads(json_str.strip())
        except Exception as e:
            print(f"JSON Parsing Error: {e}")
            return None

    @staticmethod
    def generate_education_recommendation(
        ticket_type: str,
        url: str,
        rule_score: float,
        ml_score: float,
        ticket_content: str,
        ticket_summary: str
    ) -> Dict:
        client = GeminiEducationService._get_client()
        if not client:
            return GeminiEducationService._get_default_recommendation(ticket_type, rule_score)
        
        prompt = f"""
Sangat Penting: Gunakan Bahasa Indonesia yang ramah untuk pengguna literasi rendah.
Analisis laporan keamanan berikut dan berikan rekomendasi edukasi yang spesifik.

ATURAN FORMATTING (PENTING):
1. JANGAN gunakan simbol Markdown seperti bintang-bintang (**) atau backtick (`).
2. Tuliskan teks polos (Plain Text) saja.
3. Hindari penggunaan huruf kapital berlebihan kecuali di awal kalimat.

INFORMASI LAPORAN:
- Tipe: {ticket_type}
- URL: {url}
- Skor Risiko: {rule_score}
- Analisis Konten: {ticket_summary}

Hasilkan JSON dengan format:
{{
  "warnings": ["kalimat peringatan polos", "kalimat peringatan polos"],
  "suggested_actions": ["tindakan polos", "tindakan polos"],
  "tips": ["tips polos", "tips polos"],
  "relevant_modules": [1, 2]
}}
"""
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    safety_settings=[types.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='OFF')]
                )
            )
            result = GeminiEducationService._extract_json(response.text)
            return result if result else GeminiEducationService._get_default_recommendation(ticket_type, rule_score)
        except Exception as e:
            print(f"Gemini API Failure (Rec): {e}")
            return GeminiEducationService._get_default_recommendation(ticket_type, rule_score)
    
    @staticmethod
    def generate_quiz_questions(
        module_id: int,
        module_title: str,
        module_description: str,
        article_titles: List[str]
    ) -> Dict:
        client = GeminiEducationService._get_client()
        if not client:
            return GeminiEducationService._get_default_quiz(module_id)

        articles_text = ", ".join(article_titles)
        prompt = f"""
Buat 10 soal kuis pilihan ganda berkualitas tinggi dalam Bahasa Indonesia untuk modul: {module_title}.
Topik: {articles_text}.

ATURAN FORMATTING (PENTING):
1. JANGAN gunakan simbol Markdown seperti bintang-bintang (**) atau backtick (`).
2. Tuliskan teks polos (Plain Text) saja untuk pertanyaan, pilihan, dan penjelasan.
3. Pastikan bahasa yang digunakan ramah untuk orang awam.

Format JSON:
{{
  "questions": [
    {{
      "question": "pertanyaan polos",
      "options": ["opsi polos", "opsi polos", "opsi polos", "opsi polos"],
      "correct_answer_index": 0,
      "explanation": "penjelasan polos tanpa simbol"
    }}
  ]
}}
"""
        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    safety_settings=[types.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='OFF')]
                )
            )
            result = GeminiEducationService._extract_json(response.text)
            if result and "questions" in result:
                return result
            return GeminiEducationService._get_default_quiz(module_id)
        except Exception as e:
            print(f"Gemini API Error (Quiz): {e}")
            return GeminiEducationService._get_default_quiz(module_id)
    
    @staticmethod
    def _get_default_recommendation(ticket_type: str, score: float = 0) -> Dict:
        if score < 20:
            return {
                "warnings": ["Tidak ditemukan indikasi bahaya yang jelas pada laporan ini.", "Sistem menilai link/pesan ini relatif aman."],
                "suggested_actions": ["Tetap pastikan Anda mengakses situs dari sumber resmi.", "Jangan klik link jika dikirim oleh orang tidak dikenal."],
                "tips": ["Gunakan fitur Bookmark untuk menyimpan alamat bank asli.", "Selalu periksa ulang pengirim pesan."],
                "relevant_modules": [1]
            }
        return {
            "warnings": ["Indikasi penipuan (phishing) terdeteksi.", "Halaman ini mungkin mencoba mencuri data pribadi Anda."],
            "suggested_actions": ["Segera tutup halaman ini.", "Jangan masukkan kata sandi atau data bank.", "Laporkan nomor pengirim jika ini melalui pesan."],
            "tips": ["Bank tidak pernah meminta data pribadi melalui link tidak resmi.", "Gunakan aplikasi OctoSight untuk verifikasi link di masa depan."],
            "relevant_modules": [1, 2, 3]
        }
    
    @staticmethod
    def _get_default_quiz(module_id: int) -> Dict:
        # Database soal cadangan untuk 8 modul
        fallbacks = {
            1: [ # Phishing Basics
                {"question": "Apa itu phishing?", "options": ["A. Memancing ikan", "B. Pencurian data melalui link/pesan palsu", "C. Menghapus virus", "D. Memperbaiki komputer"], "correct_answer_index": 1, "explanation": "Phishing berasal dari kata 'fishing', yaitu memancing korban untuk memberikan data pribadi."},
                {"question": "Mana yang merupakan ciri email phishing?", "options": ["A. Alamat pengirim resmi", "B. Tidak ada link", "C. Permintaan mendesak/mengancam", "D. Menggunakan nama asli Anda"], "correct_answer_index": 2, "explanation": "Penipu sering membuat rasa panik agar Anda cepat-cepat klik tanpa berpikir."},
                {"question": "Apa fungsi HTTPS (gembok hijau)?", "options": ["A. Menandakan situs 100% aman", "B. Mengenkripsi data antara Anda dan server", "C. Menghapus virus di HP", "D. Mempercepat internet"], "correct_answer_index": 1, "explanation": "HTTPS melindungi perjalanan data, tapi situs phishing pun bisa menggunakan HTTPS."},
                {"question": "Apa arti 'Social Engineering'?", "options": ["A. Teknik memanipulasi psikologi orang", "B. Belajar ilmu sosial", "C. Memperbaiki mesin", "D. Membuat akun sosmed"], "correct_answer_index": 0, "explanation": "Penipu menipu pikiran Anda, bukan hanya sistem komputer."},
                {"question": "Jangan pernah memberikan kode OTP kepada...", "options": ["A. Teman", "B. Pihak Bank", "C. Siapapun", "D. Keluarga"], "correct_answer_index": 2, "explanation": "OTP adalah kunci rahasia terakhir, bank tidak pernah memintanya."},
                {"question": "Jika melihat link 'cimb-niaga.xyz', apakah itu resmi?", "options": ["A. Ya", "B. Mungkin", "C. Tidak, bank resmi menggunakan .co.id", "D. Ya, karena ada nama banknya"], "correct_answer_index": 2, "explanation": "Penipu sering menggunakan domain murah seperti .xyz, .tk, atau .ml."},
                {"question": "Mengapa penipu menggunakan logo bank asli?", "options": ["A. Biar keren", "B. Agar terlihat terpercaya", "C. Kebetulan saja", "D. Perintah bank"], "correct_answer_index": 1, "explanation": "Visual yang mirip asli memudahkan penipu menjebak korban."},
                {"question": "Apa yang dilakukan jika akun diretas?", "options": ["A. Menangis", "B. Segera ganti password dan hubungi bank", "C. Diamkan saja", "D. Hapus aplikasi"], "correct_answer_index": 1, "explanation": "Respon cepat dapat meminimalkan kerugian finansial."},
                {"question": "Siapa target utama phishing?", "options": ["A. Orang kaya saja", "B. Orang gaptek saja", "C. Siapapun yang memiliki akun digital", "D. Anak muda"], "correct_answer_index": 2, "explanation": "Semua orang bisa jadi target, itulah mengapa literasi penting."},
                {"question": "Layanan apa yang disediakan OctoSight?", "options": ["A. Pinjaman online", "B. Verifikasi keamanan link/pesan", "C. Jualan pulsa", "D. Edit foto"], "correct_answer_index": 1, "explanation": "OctoSight membantu Anda membedakan ancaman digital."}
            ],
            2: [ # Phishing Prevention
                {"question": "Apa cara terbaik menghindari phishing?", "options": ["A. Jangan pakai internet", "B. Selalu cek alamat URL secara manual", "C. Percaya semua pesan", "D. Pakai antivirus mahal"], "correct_answer_index": 1, "explanation": "Mengecek URL secara teliti adalah pertahanan pertama yang paling efektif."},
                {"question": "Guna 2-Factor Authentication (2FA) adalah...", "options": ["A. Menambah kecepatan login", "B. Lapis keamanan kedua setelah password", "C. Biar akun keren", "D. Mengganti fungsi password"], "correct_answer_index": 1, "explanation": "Bahkan jika password dicuri, penipu tetap butuh kode kedua (SMS/Apps)."},
                {"question": "Apa itu 'Hovering' pada link?", "options": ["A. Mengklik link", "B. Mengarahkan kursor tanpa klik untuk lihat URL asli", "C. Menghapus link", "D. Membagikan link"], "correct_answer_index": 1, "explanation": "Teks link bisa menipu, tapi status bar browser menunjukkan tujuan aslinya."},
                {"question": "Password yang kuat terdiri dari...", "options": ["A. Tanggal lahir", "B. Nama anak", "C. Campuran huruf, angka, dan simbol", "D. 123456"], "correct_answer_index": 2, "explanation": "Kombinasi yang kompleks sulit ditebak oleh mesin peretas."},
                {"question": "Amankah menyimpan password di catatan HP tanpa kunci?", "options": ["A. Sangat aman", "B. Tidak aman", "C. Tergantung merek HP", "D. Aman jika HP tidak hilang"], "correct_answer_index": 1, "explanation": "Data sensitif harus selalu terlindungi oleh enkripsi atau kunci."},
                {"question": "Browser yang aman biasanya...", "options": ["A. Memberi peringatan situs berbahaya", "B. Warnanya biru", "C. Paling cepat", "D. Tidak bisa buka YouTube"], "correct_answer_index": 0, "explanation": "Browser modern memiliki database situs phishing yang diperbarui tiap jam."},
                {"question": "Update aplikasi secara rutin berguna untuk...", "options": ["A. Menghabiskan kuota", "B. Menambah fitur baru saja", "C. Menutup celah keamanan (Patching)", "D. Mengubah tampilan"], "correct_answer_index": 2, "explanation": "Banyak peretasan terjadi karena aplikasi versi lama punya lubang keamanan."},
                {"question": "Jika bank menepon meminta data kartu, apa yang Anda lakukan?", "options": ["A. Kasih saja", "B. Tolak dan telepon balik ke nomor resmi bank", "C. Marah-marah", "D. Matikan HP"], "correct_answer_index": 1, "explanation": "Bank resmi tidak pernah meminta data kartu melalui telepon masuk."},
                {"question": "Email resmi perusahaan biasanya menggunakan domain...", "options": ["A. @gmail.com", "B. @yahoo.com", "C. @nama-perusahaan.com", "D. @perusahaan-promo.tk"], "correct_answer_index": 2, "explanation": "Perusahaan besar selalu memiliki domain email sendiri."},
                {"question": "Apa guna fitur 'Report Spam' di email?", "options": ["A. Biar email penuh", "B. Melatih filter email agar lebih pintar", "C. Menghapus akun kita", "D. Mengirim virus balik"], "correct_answer_index": 1, "explanation": "Laporan Anda membantu melindungi pengguna lain dari penipu yang sama."}
            ],
            3: [ # Social Engineering
                {"question": "Apa senjata utama Social Engineering?", "options": ["A. Komputer canggih", "B. Manipulasi emosi (takut, senang, terdesak)", "C. Senjata api", "D. Kabel internet"], "correct_answer_index": 1, "explanation": "Penipu menyerang kelemahan psikologis manusia."},
                {"question": "Apa itu 'Pretexting'?", "options": ["A. SMS gratis", "B. Membuat skenario palsu agar korban percaya", "C. Menghapus teks", "D. Menambah followers"], "correct_answer_index": 1, "explanation": "Penipu berpura-pura menjadi kurir, polisi, atau staf bank."},
                {"question": "Teknik 'Baiting' biasanya menggunakan...", "options": ["A. Umpan yang menarik (hadiah/undian)", "B. Ancaman penjara", "C. Link rusak", "D. Berita duka"], "correct_answer_index": 0, "explanation": "Korban terpancing karena dijanjikan hadiah atau keuntungan gratis."},
                {"question": "Mengapa Social Engineering sangat berbahaya?", "options": ["A. Sulit dideteksi oleh antivirus", "B. Bisa merusak HP", "C. Hanya untuk orang tua", "D. Menghabiskan baterai"], "correct_answer_index": 0, "explanation": "Teknologi tercanggih pun tidak berguna jika manusianya sendiri yang menyerahkan data."},
                {"question": "Apa itu 'Quid Pro Quo' dalam penipuan?", "options": ["A. Meminta imbalan atas bantuan palsu", "B. Menang undian", "C. Membeli barang", "D. Menjual data"], "correct_answer_index": 0, "explanation": "Penipu menawarkan 'bantuan teknis' tapi meminta password sebagai syaratnya."},
                {"question": "Cara menghadapi penipu yang pura-pura panik/mendesak?", "options": ["A. Ikut panik", "B. Tenangkan diri dan verifikasi informasi", "C. Langsung transfer", "D. Matikan lampu"], "correct_answer_index": 1, "explanation": "Ketenangan adalah kunci untuk melihat kebohongan dalam cerita penipu."},
                {"question": "Informasi apa yang paling dicari penipu di sosmed?", "options": ["A. Foto makanan", "B. Data pribadi (nama ibu, tgl lahir, lokasi)", "C. Video lucu", "D. Berita bola"], "correct_answer_index": 1, "explanation": "Data pribadi digunakan untuk menjawab pertanyaan keamanan akun Anda."},
                {"question": "Apa itu 'Shoulder Surfing'?", "options": ["A. Berselancar di pantai", "B. Mengintip password dari balik bahu", "C. Memperbaiki bahu", "D. Mencuri baju"], "correct_answer_index": 1, "explanation": "Bentuk social engineering fisik yang sederhana tapi efektif."},
                {"question": "Jika ada orang asing sok akrab dan tanya rahasia kantor, itu disebut...", "options": ["A. Ramah", "B. Elicitation (penggalian informasi)", "C. Wawancara", "D. Curhat"], "correct_answer_index": 1, "explanation": "Membangun kepercayaan adalah tahap awal Social Engineering."},
                {"question": "Pertahanan terbaik melawan Social Engineering?", "options": ["A. Berhenti sosialisasi", "B. Sikap skeptis dan selalu verifikasi", "C. Ganti HP tiap bulan", "D. Pakai kacamata hitam"], "correct_answer_index": 1, "explanation": "Jangan mudah percaya, selalu cek kebenaran informasi."}
            ],
            4: [ # Spear Phishing & Whaling
                {"question": "Apa beda Phishing biasa dengan Spear Phishing?", "options": ["A. Phishing lebih cepat", "B. Spear phishing menargetkan orang spesifik", "C. Phishing hanya lewat SMS", "D. Tidak ada bedanya"], "correct_answer_index": 1, "explanation": "Spear phishing menggunakan informasi pribadi Anda agar terlihat sangat meyakinkan."},
                {"question": "Apa itu 'Whaling'?", "options": ["A. Berburu paus", "B. Phishing yang menargetkan petinggi/bos besar", "C. Menangkap ikan", "D. Serangan massal"], "correct_answer_index": 1, "explanation": "Whaling mengincar 'ikan besar' karena mereka punya akses ke uang/data besar."},
                {"question": "Siapa yang biasanya disasar Whaling?", "options": ["A. Mahasiswa", "B. Direktur Keuangan (CFO)", "C. Admin sosmed", "D. Anak sekolah"], "correct_answer_index": 1, "explanation": "Petinggi perusahaan adalah target utama karena otorisasi mereka."},
                {"question": "Mengapa Spear Phishing sulit dikenali?", "options": ["A. Karena pakai bahasa asing", "B. Menggunakan detail yang hanya diketahui sedikit orang", "C. Karena link-nya pendek", "D. Karena dikirim tengah malam"], "correct_answer_index": 1, "explanation": "Penipu meneliti targetnya terlebih dahulu sebelum menyerang."},
                {"question": "Apa itu 'Business Email Compromise' (BEC)?", "options": ["A. Email bisnis macet", "B. Penipu membajak email kantor untuk minta transfer uang", "C. Membuat email baru", "D. Jualan produk lewat email"], "correct_answer_index": 1, "explanation": "Ini adalah variasi spear phishing yang merugikan perusahaan miliaran rupiah."},
                {"question": "Apa cara membedakan email bos asli dengan yang palsu?", "options": ["A. Lihat jam kirimnya", "B. Verifikasi lewat jalur lain (telepon/tatap muka)", "C. Lihat panjang teksnya", "D. Pastikan tidak ada typo"], "correct_answer_index": 1, "explanation": "Jangan hanya percaya satu jalur komunikasi saja (email)."},
                {"question": "Apa resiko Whaling bagi perusahaan?", "options": ["A. Komputer rusak", "B. Kerugian finansial besar dan kebocoran data", "C. Kuota internet habis", "D. Karyawan jadi malas"], "correct_answer_index": 1, "explanation": "Satu serangan sukses ke bos bisa menghancurkan reputasi perusahaan."},
                {"question": "Sumber informasi penipu untuk Spear Phishing?", "options": ["A. LinkedIn, Website Kantor, Sosmed", "B. Buku sekolah", "C. Toko buku", "D. Perpustakaan"], "correct_answer_index": 0, "explanation": "Data publik Anda adalah modal penipu untuk menyusun serangan."},
                {"question": "Manakah yang paling menunjukkan ciri Spear Phishing?", "options": ["A. 'Halo nasabah...'", "B. 'Halo Budi, bagaimana laporan pajak bulan Maret?'", "C. 'Pemenang undian...'", "D. 'Akun diblokir...'"], "correct_answer_index": 1, "explanation": "Penggunaan nama dan detail spesifik adalah ciri khasnya."},
                {"question": "Apakah karyawan biasa bisa kena Spear Phishing?", "options": ["A. Tidak mungkin", "B. Ya, jika mereka punya akses ke data penting", "C. Hanya jika mereka salah", "D. Jika bosnya menyuruh"], "correct_answer_index": 1, "explanation": "Siapapun yang punya 'kunci' pintu perusahaan bisa jadi target."}
            ],
            5: [ # Advanced Threats - Malware & Zero-Day
                {"question": "Apa itu Malware?", "options": ["A. Software mahal", "B. Software berbahaya (virus, worm, trojan)", "C. Perangkat keras", "D. Software desain"], "correct_answer_index": 1, "explanation": "Malware adalah singkatan dari Malicious Software."},
                {"question": "Apa itu 'Zero-Day Vulnerability'?", "options": ["A. Celah yang belum diketahui pembuat software", "B. Virus yang hidup 0 hari", "C. Aplikasi gratis", "D. Update otomatis"], "correct_answer_index": 0, "explanation": "Sangat berbahaya karena belum ada 'obatnya' (patch)."},
                {"question": "Bagaimana Trojan menginfeksi komputer?", "options": ["A. Menyamar sebagai program berguna", "B. Melompat lewat kabel", "C. Lewat udara", "D. Lewat casing"], "correct_answer_index": 0, "explanation": "Seperti kuda trojan, ia tampak baik di luar tapi jahat di dalam."},
                {"question": "Apa fungsi 'Ransomware'?", "options": ["A. Mencuri pulsa", "B. Mengunci data dan minta uang tebusan", "C. Mempercepat PC", "D. Menghapus history"], "correct_answer_index": 1, "explanation": "Ransomware menyandera data Anda demi uang."},
                {"question": "Spyware digunakan untuk...", "options": ["A. Memata-matai aktivitas user diam-diam", "B. Main game", "C. Mengirim file besar", "D. Edit video"], "correct_answer_index": 0, "explanation": "Spyware mencatat ketikan keyboard (keylogger) hingga kamera Anda."},
                {"question": "Cara paling umum malware masuk ke HP?", "options": ["A. Lewat telepon", "B. Download aplikasi dari luar Play Store/App Store", "C. Sinar matahari", "D. Lewat casing"], "correct_answer_index": 1, "explanation": "Aplikasi 'mod' atau gratisan di situs gelap sering disisipi malware."},
                {"question": "Apa itu 'Botnet'?", "options": ["A. Robot internet", "B. Jaringan komputer terinfeksi yang dikendalikan penjahat", "C. Chatbot pintar", "D. Server game"], "correct_answer_index": 1, "explanation": "Komputer Anda bisa jadi 'zombie' untuk menyerang orang lain."},
                {"question": "Adware adalah...", "options": ["A. Software iklan yang mengganggu", "B. Iklan TV", "C. Jualan barang", "D. Billboard digital"], "correct_answer_index": 0, "explanation": "Meskipun kurang berbahaya dibanding virus, ia sangat mengganggu privasi."},
                {"question": "Apa tanda komputer terinfeksi malware?", "options": ["A. Monitor jadi bersih", "B. Performa lambat dan muncul pop-up aneh", "C. Internet jadi gratis", "D. Suara kipas hilang"], "correct_answer_index": 1, "explanation": "Aktivitas background malware menghabiskan sumber daya sistem."},
                {"question": "Mengapa kita harus pakai Antivirus?", "options": ["A. Biar PC berat", "B. Mendeteksi dan menghapus ancaman malware", "C. Biar bisa main game", "D. Perintah kantor"], "correct_answer_index": 1, "explanation": "Antivirus adalah satpam digital bagi data Anda."}
            ],
            6: [ # Ransomware Fundamentals
                {"question": "Tujuan utama pembuat Ransomware adalah...", "options": ["A. Terkenal", "B. Uang (Financial Gain)", "C. Membantu orang", "D. Merusak internet"], "correct_answer_index": 1, "explanation": "Motivasi utamanya adalah memeras korban demi keuntungan materi."},
                {"question": "Haruskah kita membayar tebusan Ransomware?", "options": ["A. Ya, pasti data kembali", "B. Tidak disarankan, karena belum tentu data kembali", "C. Tergantung harga", "D. Bayar setengah saja"], "correct_answer_index": 1, "explanation": "Membayar justru mendanai penjahat dan tidak menjamin kunci diberikan."},
                {"question": "Pertahanan terbaik melawan Ransomware?", "options": ["A. Antivirus saja", "B. Backup data rutin di tempat terpisah (Offline)", "C. Pakai laptop baru", "D. Tidak usah simpan data"], "correct_answer_index": 1, "explanation": "Jika punya backup, Anda tinggal hapus sistem dan restore data tanpa bayar."},
                {"question": "Cara Ransomware menyebar di kantor?", "options": ["A. Lewat AC", "B. Lewat jaringan (Network lateral movement)", "C. Lewat jendela", "D. Lewat telepon"], "correct_answer_index": 1, "explanation": "Satu orang kena, seluruh server kantor bisa terkunci."},
                {"question": "Apa itu 'Encryption' dalam Ransomware?", "options": ["A. Menghapus data", "B. Mengacak data agar tidak bisa dibaca tanpa kunci", "C. Menyalin data", "D. Menjual data"], "correct_answer_index": 1, "explanation": "Data masih ada, tapi isinya tidak bisa dibuka sama sekali."},
                {"question": "Tanda file kena Ransomware?", "options": ["A. Nama file berubah dan tidak bisa dibuka", "B. File jadi lebih kecil", "C. File hilang", "D. Warna folder jadi merah"], "correct_answer_index": 0, "explanation": "Biasanya ekstensi file berubah (misal: .crypt atau .locked)."},
                {"question": "Apa itu 'Note Ransom'?", "options": ["A. Surat cinta", "B. Pesan dari penjahat berisi instruksi pembayaran", "C. Catatan belanja", "D. Buku manual"], "correct_answer_index": 1, "explanation": "Pesan ini biasanya muncul di wallpaper atau file teks di tiap folder."},
                {"question": "Metode pembayaran yang diminta penjahat biasanya...", "options": ["A. Transfer bank", "B. Pulsa", "C. Cryptocurrency (Bitcoin/Monero)", "D. Cash"], "correct_answer_index": 2, "explanation": "Crypto sulit dilacak oleh pihak berwenang."},
                {"question": "WannaCry adalah contoh dari...", "options": ["A. Game", "B. Ransomware global yang terkenal", "C. Nama artis", "D. Aplikasi diet"], "correct_answer_index": 1, "explanation": "Menyerang ratusan ribu komputer di seluruh dunia pada 2017."},
                {"question": "Kapan waktu terbaik melakukan backup?", "options": ["A. Saat kena virus", "B. Secara rutin (Harian/Mingguan)", "C. Setahun sekali", "D. Pas mau beli laptop baru"], "correct_answer_index": 1, "explanation": "Konsistensi adalah kunci keselamatan data."}
            ],
            7: [ # Incident Response
                {"question": "Apa tahap pertama saat menyadari ada serangan?", "options": ["A. Panik", "B. Identifikasi (Pastikan apa yang terjadi)", "C. Lari", "D. Marah-marah"], "correct_answer_index": 1, "explanation": "Mengetahui jenis serangan membantu menentukan langkah selanjutnya."},
                {"question": "Apa arti 'Containment'?", "options": ["A. Menghapus data", "B. Mengisolasi bagian yang terinfeksi agar tidak menyebar", "C. Membeli server baru", "D. Lapor polisi"], "correct_answer_index": 1, "explanation": "Sama seperti karantina saat sakit, agar tidak menular ke komputer lain."},
                {"question": "Siapa yang harus dihubungi pertama kali di kantor?", "options": ["A. OB", "B. Tim IT / Keamanan Informasi", "C. Teman sebangku", "D. Keluarga"], "correct_answer_index": 1, "explanation": "Tim profesional memiliki prosedur khusus untuk menangani insiden."},
                {"question": "Apa itu 'Eradication'?", "options": ["A. Menghilangkan akar penyebab serangan", "B. Menambah virus", "C. Ganti nama kantor", "D. Instal ulang Windows tanpa cek"], "correct_answer_index": 0, "explanation": "Memastikan tidak ada celah tersisa yang bisa dipakai penyerang lagi."},
                {"question": "Mengapa log sistem sangat penting?", "options": ["A. Menghabiskan memori", "B. Rekaman jejak aktivitas untuk investigasi", "C. Hiasan saja", "D. Perintah Windows"], "correct_answer_index": 1, "explanation": "Log adalah saksi bisu dari apa yang dilakukan penyusup."},
                {"question": "Apa itu 'Post-Incident Activity'?", "options": ["A. Liburan", "B. Evaluasi dan belajar agar tidak terulang", "C. Bubar tim", "D. Hapus semua data"], "correct_answer_index": 1, "explanation": "Belajar dari kesalahan adalah bagian terpenting dari keamanan."},
                {"question": "Bolehkan mematikan komputer (Power Off) saat kena serangan?", "options": ["A. Ya, selalu", "B. Tergantung instruksi (bisa menghilangkan bukti di memori RAM)", "C. Tidak boleh sama sekali", "D. Cabut kabel saja"], "correct_answer_index": 1, "explanation": "Mematikan paksa bisa menghapus jejak digital yang ada di memori sementara."},
                {"question": "Apa guna cadangan (Backup) dalam Incident Response?", "options": ["A. Menambah biaya", "B. Mempercepat proses pemulihan (Recovery)", "C. Biar server berat", "D. Tidak ada gunanya"], "correct_answer_index": 1, "explanation": "Pemulihan data adalah tahap akhir agar bisnis berjalan normal kembali."},
                {"question": "Jika data nasabah bocor, apa kewajiban perusahaan?", "options": ["A. Diam saja", "B. Memberitahu publik dan pihak berwenang", "C. Pura-pura tidak tahu", "D. Hapus website"], "correct_answer_index": 1, "explanation": "Transparansi penting untuk melindungi hak-hak korban."},
                {"question": "Komunikasi saat insiden harus...", "options": ["A. Lewat satu pintu yang resmi", "B. Lewat gosip", "C. Bebas siapa saja", "D. Tidak usah bicara"], "correct_answer_index": 0, "explanation": "Informasi simpang siur justru akan menambah kepanikan."}
            ],
            8: [ # Advanced Detection & CTI
                {"question": "Apa kepanjangan CTI?", "options": ["A. Cyber Teknik Indonesia", "B. Cyber Threat Intelligence", "C. Computer Tool International", "D. Cyber Team Investigation"], "correct_answer_index": 1, "explanation": "CTI adalah proses mengumpulkan informasi tentang ancaman siber."},
                {"question": "Apa guna CTI bagi perusahaan?", "options": ["A. Tahu siapa yang mungkin menyerang", "B. Mencari karyawan baru", "C. Menghitung gaji", "D. Memperbaiki printer"], "correct_answer_index": 0, "explanation": "Mengenal musuh membantu kita menyiapkan pertahanan yang tepat."},
                {"question": "Apa itu 'Indicators of Compromise' (IoC)?", "options": ["A. Indikator bensin", "B. Tanda-tanda digital bahwa sistem telah ditembus", "C. Indikator kecepatan", "D. Lampu monitor"], "correct_answer_index": 1, "explanation": "Misal: alamat IP penjahat, hash file virus, atau domain palsu."},
                {"question": "Advanced Persistent Threat (APT) adalah...", "options": ["A. Virus cepat", "B. Serangan canggih dan terencana dalam waktu lama", "C. Aplikasi chat", "D. Perangkat keras"], "correct_answer_index": 1, "explanation": "Biasanya dilakukan oleh kelompok terorganisir atau negara (state-sponsored)."},
                {"question": "Apa itu 'Threat Hunting'?", "options": ["A. Mencari virus di hutan", "B. Mencari ancaman secara proaktif sebelum alarm berbunyi", "C. Main game tembak-tembakan", "D. Membeli antivirus baru"], "correct_answer_index": 1, "explanation": "Tidak menunggu diserang, tapi mencari penyusup yang mungkin sudah bersembunyi."},
                {"question": "Deep Web vs Dark Web, mana yang lebih berbahaya?", "options": ["A. Deep Web", "B. Dark Web (Sering dipakai aktivitas ilegal)", "C. Sama saja", "D. Tidak ada yang bahaya"], "correct_answer_index": 1, "explanation": "Dark web butuh software khusus dan banyak pasar gelap data bocor di sana."},
                {"question": "Apa itu 'Zero-Trust'?", "options": ["A. Tidak percaya siapapun di dalam jaringan", "B. Tidak punya teman", "C. Jualan akun", "D. Sistem tanpa password"], "correct_answer_index": 0, "explanation": "Filosofi keamanan 'Never Trust, Always Verify'."},
                {"question": "Analis CTI sering memantau forum bawah tanah untuk...", "options": ["A. Jual beli barang", "B. Melihat apakah ada data perusahaan yang dijual", "C. Cari hiburan", "D. Belajar masak"], "correct_answer_index": 1, "explanation": "Mengetahui kebocoran lebih dini bisa menyelamatkan perusahaan."},
                {"question": "Apa itu 'Sandbox' dalam keamanan?", "options": ["A. Kotak pasir mainan", "B. Lingkungan terisolasi untuk menguji file berbahaya", "C. Tempat simpan data", "D. Nama antivirus"], "correct_answer_index": 1, "explanation": "File dicoba di 'kotak' aman, jika meledak tidak merusak sistem utama."},
                {"question": "Keamanan siber yang ideal bersifat...", "options": ["A. Reaktif (setelah kejadian)", "B. Proaktif (mencegah sebelum terjadi)", "C. Pasif (diam saja)", "D. Rahasia"], "correct_answer_index": 1, "explanation": "Mencegah selalu lebih murah dan aman daripada mengobati."}
            ]
        }
        
        # Ambil soal berdasarkan module_id, fallback ke modul 1 jika tidak ada
        selected_questions = fallbacks.get(module_id, fallbacks[1])
        return {"questions": selected_questions}
