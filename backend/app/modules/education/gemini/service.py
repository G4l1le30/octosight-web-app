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
Very Important: Use clear and VERY simple English suitable for a non-technical audience (laypeople).
Analyze the following security report and provide specific and easy-to-understand educational recommendations.

FORMAT RULES:
1. DO NOT use Markdown symbols like asterisks (**) or backticks (`).
2. Write ONLY in Plain Text.
3. Avoid excessive use of capital letters.
4. Limit each list (warnings, suggested_actions, tips) to a MAXIMUM of 3 concise points.

REPORT INFORMATION:
- Type: {ticket_type}
- URL: {url}
- Risk Score: {rule_score}
- Content Analysis: {ticket_summary}

{modules_context}

Generate JSON in the following format:
{{
  "warnings": ["maximum 3 simple warning sentences"],
  "suggested_actions": ["maximum 3 simple actions"],
  "tips": ["maximum 3 simple tips"],
  "relevant_modules": [
    {{"id": "module_id", "title": "Module Title"}}
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
        Create 10 VERY SIMPLE multiple-choice quiz questions in English for an E-Learning module.
        
        MODULE CONTEXT:
        - Title: {module_title}
        - Topics to cover: {articles_text}
        - Target Audience: General users with basic security knowledge.
        
        REQUIREMENTS:
        1. Target Audience: Non-technical laypeople (beginners).
        2. Complexity: Very Simple. Avoid technical jargon or complex security concepts.
        3. Tone: Friendly and encouraging. Use everyday analogies if possible.
        4. Questions: Generate exactly 10 questions with 4 clear answer choices each.
        5. Explanation: Provide a very simple explanation of why the answer is correct.
        6. Format: Generate ONLY a valid JSON object. No markdown.
        
        STRICT JSON STRUCTURE:
        {{
          "questions": [
            {{
              "question": "Question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer_index": 0,
              "explanation": "Simple explanation"
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
            return {"id": "1", "title": "Phishing Basics"}

        if score < 20:
            return {
                "warnings": ["No clear indication of danger found in this report.", "The system considers this link/message to be relatively safe."],
                "suggested_actions": ["Ensure you access sites from official sources.", "Do not click links if sent by unknown persons."],
                "tips": ["Use the Bookmark feature to save official bank addresses.", "Always double-check the sender of the message."],
                "relevant_modules": [get_mod(1)]
            }
        return {
            "warnings": ["Detected indications of Phishing fraud.", "This page might be trying to steal your personal data."],
            "suggested_actions": ["Close this page immediately.", "Do not enter your password or bank data.", "Report the sender's number if this is via a message."],
            "tips": ["The bank never asks for personal data via unofficial links.", "Use the OctoSight app to verify links in the future."],
            "relevant_modules": [get_mod(1), get_mod(2), get_mod(3)]
        }
    
    @staticmethod
    def _get_default_quiz(module_order: int) -> Dict:
        # Get questions based on module_order, fallback to module 1 if not found
        selected_questions = QUIZ_FALLBACKS.get(module_order, QUIZ_FALLBACKS[1])
        return {"questions": selected_questions}
