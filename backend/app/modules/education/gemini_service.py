import os
import json
import google.generativeai as genai
from typing import Dict, List

class GeminiEducationService:
    @staticmethod
    def _get_model():
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
            return genai.GenerativeModel('gemini-1.5-flash')
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
        model = GeminiEducationService._get_model()
        if not model:
            print("GEMINI_API_KEY not configured, returning default recommendations.")
            return GeminiEducationService._get_default_recommendation(ticket_type)

        prompt = f"""
Analyze the following cybersecurity ticket and provide educational recommendations for low-literacy users.

TICKET INFORMATION:
- Type: {ticket_type}
- URL: {url}
- Rule-based Score: {rule_score}
- ML Engine Score: {ml_score}
- Content Summary: {ticket_summary}
- Full Analysis: {ticket_content[:500]}...

Based on this analysis, generate a JSON response with:
1. warnings: Array of 2-3 specific warnings about what happened
2. suggested_actions: Array of 3-4 actionable steps user should take immediately
3. tips: Array of 2-3 future prevention tips relevant to this threat type
4. relevant_modules: Array of module IDs (1-8) that user should complete

Response MUST be valid JSON ONLY, no markdown formatting.

Example format:
{{
  "warnings": ["Email may contain malicious link", "Sender address is spoofed"],
  "suggested_actions": ["Do not click any links in the email", "Report to IT team", "Change your password"],
  "tips": ["Always verify sender address carefully", "Hover over links to see real URL"],
  "relevant_modules": [1, 2, 3]
}}
"""
        try:
            response = model.generate_content(prompt)
            result = json.loads(response.text.strip('` \n'))
            return result
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return GeminiEducationService._get_default_recommendation(ticket_type)
    
    @staticmethod
    def generate_quiz_questions(
        module_id: int,
        module_title: str,
        module_description: str,
        article_titles: List[str]
    ) -> Dict:
        model = GeminiEducationService._get_model()
        if not model:
            print("GEMINI_API_KEY not configured, returning default quiz.")
            return GeminiEducationService._get_default_quiz(module_id)

        articles_text = ", ".join(article_titles)
        prompt = f"""
Sangat Penting: Bertindaklah sebagai Ahli Keamanan Siber dan Spesialis Edukasi.
Buatlah tepat 10 pertanyaan pilihan ganda (Multiple Choice) yang BERKUALITAS TINGGI untuk modul edukasi ini:

MODUL: {module_title}
DESKRIPSI: {module_description}
TOPIK ARTIKEL: {articles_text}

KRITERIA PERTANYAAN:
1. Bahasa Indonesia: Gunakan bahasa yang profesional namun mudah dipahami oleh orang awam.
2. Variasi Soal: 
   - 4 Pertanyaan berbasis skenario (Contoh: "Jika Anda menerima email dari...", "Budi sedang browsing dan melihat...")
   - 3 Pertanyaan konseptual (Definisi dan pemahaman)
   - 3 Pertanyaan analitis (Membedakan antara ancaman asli dan palsu)
3. Tingkat Kesulitan: Berikan campuran antara Mudah (3), Sedang (5), dan Menantang (2).
4. Pilihan Jawaban: Berikan 4 opsi (A, B, C, D). Hindari jawaban yang terlalu jelas salah. Opsi pengecoh harus masuk akal.
5. Penjelasan (Explanation): Berikan alasan teknis MENGAPA jawaban tersebut benar dan MENGAPA opsi lainnya salah.

RESPONSE FORMAT (JSON ONLY):
{{
  "questions": [
    {{
      "question": "Kalimat pertanyaan yang menantang?",
      "options": ["A. Opsi", "B. Opsi", "C. Opsi", "D. Opsi"],
      "correct_answer_index": 0,
      "explanation": "Penjelasan mendalam yang mengedukasi pengguna."
    }}
  ]
}}
"""
        try:
            response = model.generate_content(prompt)
            result = json.loads(response.text.strip('` \n'))
            if "questions" in result and len(result["questions"]) == 10:
                return result
            else:
                return GeminiEducationService._get_default_quiz(module_id)
        except Exception as e:
            print(f"Gemini API error: {e}")
            return GeminiEducationService._get_default_quiz(module_id)
    
    @staticmethod
    def _get_default_recommendation(ticket_type: str) -> Dict:
        recommendations_map = {
            "Website": {
                "warnings": [
                    "Situs ini menunjukkan ciri-ciri phishing yang mencurigakan",
                    "URL yang disertakan mungkin mengarah ke website palsu",
                    "Jangan membagikan informasi pribadi Anda"
                ],
                "suggested_actions": [
                    "Jangan masukkan data apapun ke situs ini",
                    "Tutup halaman segera",
                    "Verifikasi dari alamat asli jika Anda ingin masuk"
                ],
                "tips": [
                    "Periksa alamat URL dengan hati-hati",
                    "Selalu perhatikan ejaan yang tidak biasa",
                    "Akses situs dari bookmark Anda, bukan link"
                ],
                "relevant_modules": [1, 2, 3]
            },
        }
        return recommendations_map.get(ticket_type, {
            "warnings": ["Ticket terdeteksi mengandung ancaman keamanan"],
            "suggested_actions": ["Hubungi tim keamanan untuk bantuan", "Hindari mengklik tautan apapun"],
            "tips": ["Selalu waspada terhadap link/file dari sender yang tidak dikenal", "Jangan bagikan informasi sensitif"],
            "relevant_modules": [1, 2]
        })
    
    @staticmethod
    def _get_default_quiz(module_id: int) -> Dict:
        return {
            "questions": [
                {
                    "question": "Apa yang harus Anda lakukan jika menerima link mencurigakan?",
                    "options": [
                        "A. Klik link untuk verifikasi akun",
                        "B. Download file untuk cek isinya",
                        "C. Jangan klik link dan report",
                        "D. Forward ke teman"
                    ],
                    "correct_answer_index": 2,
                    "explanation": "Jawaban yang benar adalah C. Jangan pernah klik link dari sumber mencurigakan."
                }
            ] * 10
        }
