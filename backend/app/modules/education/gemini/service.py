import json
import re
from typing import Dict, List, Optional

from .client import GeminiClient

# Make types optional — if the Gemini SDK isn't installed, we'll fallback.
try:
    from google.genai import types  # type: ignore
except Exception:
    types = None
from .quiz_fallbacks import QUIZ_FALLBACKS

class GeminiEducationService:
    # In-memory caches — keyed by module_order (quiz) or ticket_type+score_bucket (rec)
    _quiz_cache: Dict[int, Dict] = {}
    _rec_cache: Dict[str, Dict] = {}

    @staticmethod
    def generate_education_recommendation(
        ticket_type: str,
        url: str,
        rule_score: float,
        ml_score: float,
        ticket_content: str,
        ticket_summary: str,
        available_modules: List[Dict] = None
    ) -> Dict:
        # --- Cache check: keyed by ticket_type + score bucket (low/high) ---
        score_bucket = "low" if rule_score < 20 else "high"
        cache_key = f"{ticket_type}:{score_bucket}"
        if cache_key in GeminiEducationService._rec_cache:
            print(f"[Cache HIT] Recommendation for key '{cache_key}'")
            return GeminiEducationService._rec_cache[cache_key]

        modules_context = ""
        if available_modules:
            modules_context = "AVAILABLE MODULES:\n" + "\n".join([f"- ID {m['id']}: {m['title']}" for m in available_modules])

        prompt = f"""
Sangat Penting: Gunakan Bahasa Indonesia yang jelas dan SANGAT sederhana yang cocok untuk audiens non-teknis (orang awam).
Analisis laporan keamanan berikut dan berikan rekomendasi edukasi yang spesifik dan mudah dipahami.

ATURAN FORMAT:
1. JANGAN gunakan simbol Markdown seperti tanda bintang (**) atau backticks (`).
2. Tulis hanya dalam Teks Polos.
3. Hindari penggunaan huruf kapital yang berlebihan.
4. Batasi setiap daftar (warnings, suggested_actions, tips) menjadi MAKSIMAL 3 poin ringkas.

INFORMASI LAPORAN:
- Tipe: {ticket_type}
- URL: {url}
- Risk Score: {rule_score}
- Analisis Konten: {ticket_summary}

{modules_context}

Hasilkan JSON dalam format berikut:
{{
  "warnings": ["maksimal 3 kalimat peringatan sederhana"],
  "suggested_actions": ["maksimal 3 tindakan sederhana"],
  "tips": ["maksimal 3 tips sederhana"],
  "relevant_modules": [
    {{"id": "module_id", "title": "Judul Modul"}}
  ]
}}
"""
        # If Gemini SDK or types are not available, skip attempting remote calls
        # and use the fallback immediately. This avoids hard dependency on
        # the Google Gemini SDK during image builds.
        if types is None:
            print("[Gemini] SDK not installed — using fallback recommendation")
            fallback = GeminiEducationService._get_default_recommendation(ticket_type, rule_score, available_modules)
            GeminiEducationService._rec_cache[cache_key] = fallback
            return fallback

        max_attempts = max(1, len(GeminiClient._get_api_keys()))
        for attempt in range(max_attempts):
            client = GeminiClient.get_client()
            if not client or GeminiClient.is_circuit_open():
                if GeminiClient.is_circuit_open():
                    print(f"[Circuit Breaker] Skipping Gemini (Rec) — quota cooldown active")
                break # Fallback below

            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        safety_settings=[types.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='OFF')]
                    )
                )
                result = GeminiClient.extract_json(response.text)
                if result:
                    print(f"[Gemini OK] Recommendation cached for key '{cache_key}'")
                    GeminiEducationService._rec_cache[cache_key] = result
                    return result
                break # Non-exception failure, fallback
            except Exception as e:
                err_msg = str(e)
                print(f"Gemini API Failure (Rec) on key #{GeminiClient._current_key_index}: {err_msg}")
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                    GeminiClient.rotate_key_on_exhaustion(GeminiClient.extract_retry_delay(e))
                    continue # Try again with next key
                else:
                    break # Other error, fallback

        # Fallback
        fallback = GeminiEducationService._get_default_recommendation(ticket_type, rule_score, available_modules)
        GeminiEducationService._rec_cache[cache_key] = fallback
        return fallback
    
    @staticmethod
    def generate_quiz_questions(
        module_order: int,
        module_title: str,
        module_description: str,
        article_titles: List[str]
    ) -> Dict:
        # --- Cache check: avoid hitting Gemini on every page load ---
        if module_order in GeminiEducationService._quiz_cache:
            print(f"[Cache HIT] Quiz for module order {module_order}")
            return GeminiEducationService._quiz_cache[module_order]

        articles_text = ", ".join(article_titles)
        prompt = f"""
        Buatlah 10 pertanyaan kuis pilihan ganda yang SANGAT SEDERHANA dalam Bahasa Indonesia untuk modul E-Learning.
        
        KONTEKS MODUL:
        - Judul: {module_title}
        - Topik yang harus dicakup: {articles_text}
        - Target Audiens: Pengguna umum dengan pengetahuan keamanan dasar.
        
        PERSYARATAN:
        1. Target Audiens: Orang awam non-teknis (pemula).
        2. Kompleksitas: Sangat Sederhana. Hindari jargon teknis atau konsep keamanan yang rumit.
        3. Nada: Ramah dan menyemangati. Gunakan analogi sehari-hari jika memungkinkan.
        4. Pertanyaan: Hasilkan tepat 10 pertanyaan dengan masing-masing 4 pilihan jawaban yang jelas.
        5. Penjelasan: Berikan penjelasan yang sangat sederhana mengapa jawaban tersebut benar.
        6. Format: Hasilkan HANYA objek JSON yang valid. Tanpa markdown.
        
        STRUKTUR JSON YANG KETAT:
        {{
          "questions": [
            {{
              "question": "Teks pertanyaan",
              "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
              "correct_answer_index": 0,
              "explanation": "Penjelasan sederhana"
            }}
          ]
        }}
        """
        
        # If Gemini SDK not available, use fallback instead of remote calls
        if types is None:
            print(f"[Gemini] SDK not installed — using fallback quiz for module order {module_order}")
            fallback = GeminiEducationService._get_default_quiz(module_order)
            GeminiEducationService._quiz_cache[module_order] = fallback
            return fallback

        max_attempts = max(1, len(GeminiClient._get_api_keys()))
        for attempt in range(max_attempts):
            client = GeminiClient.get_client()
            if not client or GeminiClient.is_circuit_open():
                if GeminiClient.is_circuit_open():
                    print(f"[Circuit Breaker] Skipping Gemini (Quiz order {module_order}) — quota cooldown active")
                break # Fallback below

            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        safety_settings=[
                            types.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='BLOCK_NONE'),
                            types.SafetySetting(category='HARM_CATEGORY_HATE_SPEECH', threshold='BLOCK_NONE'),
                            types.SafetySetting(category='HARM_CATEGORY_HARASSMENT', threshold='BLOCK_NONE'),
                            types.SafetySetting(category='HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold='BLOCK_NONE'),
                        ]
                    )
                )

                # Clean response text in case it still includes markdown
                text = response.text.strip()
                if text.startswith("```"):
                    text = re.sub(r'^```(?:json)?\n?|\n?```$', '', text, flags=re.MULTILINE)

                result = json.loads(text)
                if result and "questions" in result and len(result["questions"]) > 0:
                    print(f"[Gemini OK] Quiz cached for module order {module_order}")
                    GeminiEducationService._quiz_cache[module_order] = result
                    return result

                print(f"[Gemini] Invalid structure for Quiz order {module_order}, using fallback")
                break # Non-exception failure, go to fallback
            except Exception as e:
                err_msg = str(e)
                print(f"Gemini API Error (Quiz) for module order {module_order} on key #{GeminiClient._current_key_index}: {err_msg}")
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                    GeminiClient.rotate_key_on_exhaustion(GeminiClient.extract_retry_delay(e))
                    continue # Try again with next key
                else:
                    break # Other error, fallback

        # Fallback
        fallback = GeminiEducationService._get_default_quiz(module_order)
        GeminiEducationService._quiz_cache[module_order] = fallback
        return fallback
    
    @staticmethod
    def _get_default_recommendation(ticket_type: str, score: float = 0, available_modules: List[Dict] = None) -> Dict:
        # Helper to get module by ID or fallback to first available
        def get_mod(idx):
            if available_modules and len(available_modules) >= idx:
                return available_modules[idx-1]
            return {"id": "1", "title": "Dasar-dasar Phishing"}

        if score < 20:
            return {
                "warnings": ["Tidak ditemukan indikasi bahaya yang jelas pada laporan ini.", "Sistem menganggap link/pesan ini relatif aman."],
                "suggested_actions": ["Pastikan Anda mengakses situs dari sumber resmi.", "Jangan klik link jika dikirim oleh orang yang tidak dikenal."],
                "tips": ["Gunakan fitur Bookmark untuk menyimpan alamat bank resmi.", "Selalu cek ulang pengirim pesan."],
                "relevant_modules": [get_mod(1)]
            }
        return {
            "warnings": ["Terdeteksi indikasi penipuan Phishing.", "Halaman ini mungkin mencoba mencuri data pribadi Anda."],
            "suggested_actions": ["Segera tutup halaman ini.", "Jangan masukkan kata sandi atau data bank Anda.", "Laporkan nomor pengirim jika ini melalui pesan."],
            "tips": ["Bank tidak pernah meminta data pribadi melalui link tidak resmi.", "Gunakan aplikasi OctoSight untuk memverifikasi link di masa depan."],
            "relevant_modules": [get_mod(1), get_mod(2), get_mod(3)]
        }
    
    @staticmethod
    def _get_default_quiz(module_order: int) -> Dict:
        # Ambil soal berdasarkan module_order, fallback ke modul 1 jika tidak ada
        selected_questions = QUIZ_FALLBACKS.get(module_order, QUIZ_FALLBACKS[1])
        return {"questions": selected_questions}
