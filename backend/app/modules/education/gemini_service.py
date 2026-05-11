import os
import json
import re
import time
from google import genai
from google.genai import types
from typing import Dict, List, Optional

class GeminiEducationService:
    # In-memory caches — keyed by module_order (quiz) or ticket_type+score_bucket (rec)
    _quiz_cache: Dict[int, Dict] = {}
    _rec_cache: Dict[str, Dict] = {}

    # Circuit breaker — skip Gemini until this epoch timestamp
    _circuit_open_until: float = 0.0

    # Multi-key rotation: track which key index to try next
    _current_key_index: int = 0
    # Keys exhausted (429) — map key_index -> epoch when it becomes available again
    _key_exhausted_until: Dict[int, float] = {}

    @staticmethod
    def _get_api_keys() -> List[str]:
        """Return list of API keys from GEMINI_API_KEY (comma-separated for rotation)."""
        raw = os.getenv("GEMINI_API_KEY", "")
        return [k.strip() for k in raw.split(",") if k.strip()]

    @staticmethod
    def _get_client() -> Optional[genai.Client]:
        """
        Returns a Gemini client using the next available (non-exhausted) API key.
        Rotates through keys automatically. Returns None if all keys are exhausted.
        """
        keys = GeminiEducationService._get_api_keys()
        if not keys:
            return None

        now = time.time()
        num_keys = len(keys)

        # Try each key starting from current index, skip exhausted ones
        for attempt in range(num_keys):
            idx = (GeminiEducationService._current_key_index + attempt) % num_keys
            exhausted_until = GeminiEducationService._key_exhausted_until.get(idx, 0)
            if now >= exhausted_until:
                GeminiEducationService._current_key_index = idx
                return genai.Client(api_key=keys[idx])

        # All keys exhausted
        return None

    @staticmethod
    def _rotate_key_on_exhaustion(retry_delay_seconds: float = 60.0) -> None:
        """Mark current key as exhausted and advance to next key."""
        keys = GeminiEducationService._get_api_keys()
        if not keys:
            return
        idx = GeminiEducationService._current_key_index
        GeminiEducationService._key_exhausted_until[idx] = time.time() + retry_delay_seconds
        # Move to next key
        GeminiEducationService._current_key_index = (idx + 1) % len(keys)
        remaining = [
            i for i in range(len(keys))
            if time.time() >= GeminiEducationService._key_exhausted_until.get(i, 0)
        ]
        if remaining:
            print(f"[Key Rotation] Key #{idx} exhausted for {retry_delay_seconds:.0f}s → switching to key #{GeminiEducationService._current_key_index}. {len(remaining)} key(s) still available.")
        else:
            print(f"[Key Rotation] All {len(keys)} key(s) exhausted. Tripping global circuit breaker.")
            GeminiEducationService._trip_circuit(retry_delay_seconds)

    @staticmethod
    def _trip_circuit(retry_delay_seconds: float = 86400.0) -> None:
        """Open the global circuit breaker for `retry_delay_seconds`."""
        open_until = time.time() + retry_delay_seconds
        if open_until > GeminiEducationService._circuit_open_until:
            GeminiEducationService._circuit_open_until = open_until
            print(f"[Circuit Breaker] Gemini calls suspended for {retry_delay_seconds:.0f}s")

    @staticmethod
    def _is_circuit_open() -> bool:
        """Returns True if the global circuit breaker is active."""
        return time.time() < GeminiEducationService._circuit_open_until

    @staticmethod
    def _extract_retry_delay(exception: Exception) -> float:
        """Extract retryDelay (in seconds) from a Gemini 429 exception, default 60s."""
        try:
            msg = str(exception)
            match = re.search(r"'retryDelay':\s*'(\d+(?:\.\d+)?)s'", msg)
            if match:
                return float(match.group(1)) + 5  # add 5s buffer
        except Exception:
            pass
        return 60.0

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
Strictly Important: Use clear, simple English suitable for a general audience.
Analyze the following security report and provide specific educational recommendations.

FORMATTING RULES (IMPORTANT):
1. DO NOT use Markdown symbols like asterisks (**) or backticks (`).
2. Write only in Plain Text.
3. Avoid excessive capitalization except at the beginning of sentences.

REPORT INFORMATION:
- Type: {ticket_type}
- URL: {url}
- Risk Score: {rule_score}
- Content Analysis: {ticket_summary}

{modules_context}

Generate JSON in the following format:
{{
  "warnings": ["plain warning sentence", "plain warning sentence"],
  "suggested_actions": ["plain action", "plain action"],
  "tips": ["plain tip", "plain tip"],
  "relevant_modules": [
    {{"id": 1, "title": "Module Title"}},
    {{"id": 2, "title": "Module Title"}}
  ]
}}
"""
        max_attempts = max(1, len(GeminiEducationService._get_api_keys()))
        for attempt in range(max_attempts):
            client = GeminiEducationService._get_client()
            if not client or GeminiEducationService._is_circuit_open():
                if GeminiEducationService._is_circuit_open():
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
                result = GeminiEducationService._extract_json(response.text)
                if result:
                    print(f"[Gemini OK] Recommendation cached for key '{cache_key}'")
                    GeminiEducationService._rec_cache[cache_key] = result
                    return result
                break # Non-exception failure, fallback
            except Exception as e:
                err_msg = str(e)
                print(f"Gemini API Failure (Rec) on key #{GeminiEducationService._current_key_index}: {err_msg}")
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                    GeminiEducationService._rotate_key_on_exhaustion(GeminiEducationService._extract_retry_delay(e))
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
        # --- Cache check: avoid hitting Gemini on every page load / StrictMode double-render ---
        if module_order in GeminiEducationService._quiz_cache:
            print(f"[Cache HIT] Quiz for module order {module_order}")
            return GeminiEducationService._quiz_cache[module_order]

        articles_text = ", ".join(article_titles)
        prompt = f"""
        Create 10 high-quality multiple-choice quiz questions in English for an E-Learning module.
        
        MODULE CONTEXT:
        - Title: {module_title}
        - Topics to cover: {articles_text}
        - Target Audience: General users with basic security knowledge.
        
        REQUIREMENTS:
        1. Generate exactly 10 questions.
        2. Each question must have 4 clear options.
        3. Provide a clear, educational explanation for the correct answer.
        4. Language: Friendly, clear English. No complex jargon.
        5. Formatting: Output ONLY a valid JSON object. No markdown, no pre-text, no post-text.
        
        STRICT JSON STRUCTURE:
        {{
          "questions": [
            {{
              "question": "The question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer_index": 0,
              "explanation": "Why this is correct"
            }}
          ]
        }}
        """
        
        max_attempts = max(1, len(GeminiEducationService._get_api_keys()))
        for attempt in range(max_attempts):
            client = GeminiEducationService._get_client()
            if not client or GeminiEducationService._is_circuit_open():
                if GeminiEducationService._is_circuit_open():
                    print(f"[Circuit Breaker] Skipping Gemini (Quiz order {module_order}) — quota cooldown active")
                break # Fallback below
            
            try:
                # Use a slightly more lenient model if needed, but 2.0-flash is usually very good at following JSON instructions
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
                print(f"Gemini API Error (Quiz) for module order {module_order} on key #{GeminiEducationService._current_key_index}: {err_msg}")
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                    GeminiEducationService._rotate_key_on_exhaustion(GeminiEducationService._extract_retry_delay(e))
                    continue # Try again with next key
                else:
                    break # Other error, fallback

        # Fallback
        fallback = GeminiEducationService._get_default_quiz(module_order)
        # Cache the fallback too — no point retrying a quota-exhausted API on every request
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
                "warnings": ["No clear indication of danger was found in this report.", "The system considers this link/message relatively safe."],
                "suggested_actions": ["Ensure you access the site from official sources.", "Do not click links if sent by an unknown person."],
                "tips": ["Use the Bookmark feature to save the official bank address.", "Always double-check the sender of the message."],
                "relevant_modules": [get_mod(1)]
            }
        return {
            "warnings": ["Phishing fraud indication detected.", "This page may be trying to steal your personal data."],
            "suggested_actions": ["Close this page immediately.", "Do not enter your password or bank data.", "Report the sender's number if this was via message."],
            "tips": ["The bank never asks for personal data via unofficial links.", "Use the OctoSight app to verify links in the future."],
            "relevant_modules": [get_mod(1), get_mod(2), get_mod(3)]
        }
    
    @staticmethod
    def _get_default_quiz(module_order: int) -> Dict:
        # Database soal cadangan untuk 8 modul
        fallbacks = {
            1: [ # Phishing Basics
                {"question": "What is phishing?", "options": ["A. Fishing for actual fish", "B. Theft of data through fake links/messages", "C. Deleting a virus", "D. Repairing a computer"], "correct_answer_index": 1, "explanation": "Phishing comes from the word 'fishing', meaning lures victims to provide personal data."},
                {"question": "Which of these is a characteristic of a phishing email?", "options": ["A. Official sender address", "B. No links", "C. Urgent/threatening request", "D. Using your real name"], "correct_answer_index": 2, "explanation": "Scammers often create a sense of panic so you click quickly without thinking."},
                {"question": "What is the function of HTTPS (green padlock)?", "options": ["A. Indicates the site is 100% safe", "B. Encrypts data between you and the server", "C. Removes viruses on phones", "D. Speeds up the internet"], "correct_answer_index": 1, "explanation": "HTTPS protects data in transit, but phishing sites can also use HTTPS."},
                {"question": "What does 'Social Engineering' mean?", "options": ["A. Technique of manipulating people's psychology", "B. Studying social sciences", "C. Repairing machines", "D. Creating social media accounts"], "correct_answer_index": 0, "explanation": "Scammers trick your mind, not just the computer system."},
                {"question": "Never give your OTP code to...", "options": ["A. Friends", "B. The Bank", "C. Anyone", "D. Family"], "correct_answer_index": 2, "explanation": "OTP is your final secret key; the bank never asks for it."},
                {"question": "If you see the link 'cimb-niaga.xyz', is it official?", "options": ["A. Yes", "B. Maybe", "C. No, official banks use .co.id", "D. Yes, because it has the bank's name"], "correct_answer_index": 2, "explanation": "Scammers often use cheap domains like .xyz, .tk, or .ml."},
                {"question": "Why do scammers use original bank logos?", "options": ["A. To look cool", "B. To appear trustworthy", "C. Just a coincidence", "D. Bank's orders"], "correct_answer_index": 1, "explanation": "Visuals similar to the original make it easier for scammers to trap victims."},
                {"question": "What to do if an account is hacked?", "options": ["A. Cry", "B. Immediately change password and contact the bank", "C. Do nothing", "D. Delete the app"], "correct_answer_index": 1, "explanation": "Quick response can minimize financial loss."},
                {"question": "Who is the primary target of phishing?", "options": ["A. Only wealthy people", "B. Only non-technical people", "C. Anyone with a digital account", "D. Young people"], "correct_answer_index": 2, "explanation": "Everyone can be a target, which is why literacy is important."},
                {"question": "What service does OctoSight provide?", "options": ["A. Online loans", "B. Security verification of links/messages", "C. Selling mobile credit", "D. Photo editing"], "correct_answer_index": 1, "explanation": "OctoSight helps you distinguish digital threats."}
            ],
            2: [ # Phishing Prevention
                {"question": "What is the best way to avoid phishing?", "options": ["A. Don't use the internet", "B. Always check the URL address manually", "C. Trust all messages", "D. Use expensive antivirus"], "correct_answer_index": 1, "explanation": "Checking the URL carefully is the most effective first line of defense."},
                {"question": "The purpose of 2-Factor Authentication (2FA) is...", "options": ["A. Increasing login speed", "B. A second layer of security after the password", "C. To make the account look cool", "D. Replacing the password function"], "correct_answer_index": 1, "explanation": "Even if the password is stolen, the scammer still needs the second code (SMS/Apps)."},
                {"question": "What is 'Hovering' on a link?", "options": ["A. Clicking the link", "B. Moving the cursor without clicking to see the original URL", "C. Deleting the link", "D. Sharing the link"], "correct_answer_index": 1, "explanation": "Link text can be deceptive, but the browser status bar shows its true destination."},
                {"question": "A strong password consists of...", "options": ["A. Date of birth", "B. Child's name", "C. Mix of letters, numbers, and symbols", "D. 123456"], "correct_answer_index": 2, "explanation": "Complex combinations are hard for hacking machines to guess."},
                {"question": "Is it safe to save passwords in phone notes without a lock?", "options": ["A. Very safe", "B. Not safe", "C. Depends on the phone brand", "D. Safe if the phone is not lost"], "correct_answer_index": 1, "explanation": "Sensitive data should always be protected by encryption or a lock."},
                {"question": "A secure browser usually...", "options": ["A. Gives warnings for dangerous sites", "B. Is blue in color", "C. Is the fastest", "D. Cannot open YouTube"], "correct_answer_index": 0, "explanation": "Modern browsers have a phishing site database updated every hour."},
                {"question": "Updating apps regularly is useful for...", "options": ["A. Consuming data quota", "B. Adding new features only", "C. Closing security holes (Patching)", "D. Changing the interface"], "correct_answer_index": 2, "explanation": "Many hacks happen because old app versions have security holes."},
                {"question": "If the bank calls asking for card data, what do you do?", "options": ["A. Just give it", "B. Refuse and call back the bank's official number", "C. Get angry", "D. Turn off the phone"], "correct_answer_index": 1, "explanation": "Official banks never ask for card data via incoming calls."},
                {"question": "Official company emails usually use the domain...", "options": ["A. @gmail.com", "B. @yahoo.com", "C. @company-name.com", "D. @promo-company.tk"], "correct_answer_index": 2, "explanation": "Large companies always have their own email domain."},
                {"question": "What is the use of the 'Report Spam' feature in email?", "options": ["A. To fill up the email", "B. Training the email filter to be smarter", "C. Deleting our account", "D. Sending a virus back"], "correct_answer_index": 1, "explanation": "Your report helps protect other users from the same scammer."}
            ],
            3: [ # Social Engineering
                {"question": "What is the primary weapon of Social Engineering?", "options": ["A. Advanced computers", "B. Emotional manipulation (fear, joy, urgency)", "C. Firearms", "D. Internet cables"], "correct_answer_index": 1, "explanation": "Scammers attack human psychological weaknesses."},
                {"question": "What is 'Pretexting'?", "options": ["A. Free SMS", "B. Creating a fake scenario so the victim trusts them", "C. Deleting text", "D. Increasing followers"], "correct_answer_index": 1, "explanation": "Scammers pretend to be couriers, police, or bank staff."},
                {"question": "The 'Baiting' technique usually uses...", "options": ["A. Attractive bait (prizes/giveaways)", "B. Threat of prison", "C. Broken links", "D. Sad news"], "correct_answer_index": 0, "explanation": "Victims are lured because they are promised prizes or free benefits."},
                {"question": "Why is Social Engineering very dangerous?", "options": ["A. Hard to detect by antivirus", "B. Can damage the phone", "C. Only for elderly people", "D. Consumes battery"], "correct_answer_index": 0, "explanation": "Even the most advanced technology is useless if the person themselves hands over the data."},
                {"question": "What is 'Quid Pro Quo' in scams?", "options": ["A. Asking for a reward for fake help", "B. Winning a lottery", "C. Buying goods", "D. Selling data"], "correct_answer_index": 0, "explanation": "The scammer offers 'technical help' but asks for a password as a condition."},
                {"question": "How to deal with a scammer who pretends to be panicked/urgent?", "options": ["A. Join the panic", "B. Calm down and verify the information", "C. Transfer immediately", "D. Turn off the lights"], "correct_answer_index": 1, "explanation": "Calmness is key to seeing the lies in the scammer's story."},
                {"question": "What information do scammers look for most on social media?", "options": ["A. Food photos", "B. Personal data (mother's name, birth date, location)", "C. Funny videos", "D. Football news"], "correct_answer_index": 1, "explanation": "Personal data is used to answer your account security questions."},
                {"question": "What is 'Shoulder Surfing'?", "options": ["A. Surfing at the beach", "B. Peeking at a password over someone's shoulder", "C. Repairing shoulders", "D. Stealing clothes"], "correct_answer_index": 1, "explanation": "A simple but effective physical form of social engineering."},
                {"question": "If a stranger acts too friendly and asks for office secrets, it's called...", "options": ["A. Friendly", "B. Elicitation (information gathering)", "C. Interview", "D. Venting"], "correct_answer_index": 1, "explanation": "Building trust is the early stage of Social Engineering."},
                {"question": "The best defense against Social Engineering?", "options": ["A. Stop socializing", "B. Skepticism and always verify", "C. Change phone every month", "D. Wear sunglasses"], "correct_answer_index": 1, "explanation": "Don't trust easily; always check the truth of the information."}
            ],
            4: [ # Spear Phishing & Whaling
                {"question": "What is the difference between regular Phishing and Spear Phishing?", "options": ["A. Phishing is faster", "B. Spear phishing targets specific people", "C. Phishing only via SMS", "D. No difference"], "correct_answer_index": 1, "explanation": "Spear phishing uses your personal information to look very convincing."},
                {"question": "What is 'Whaling'?", "options": ["A. Hunting whales", "B. Phishing that targets big bosses/executives", "C. Catching fish", "D. Mass attack"], "correct_answer_index": 1, "explanation": "Whaling targets 'big fish' because they have access to large amounts of money/data."},
                {"question": "Who is usually targeted by Whaling?", "options": ["A. Students", "B. Chief Financial Officer (CFO)", "C. Social media admins", "D. School children"], "correct_answer_index": 1, "explanation": "Company executives are primary targets because of their authorization."},
                {"question": "Why is Spear Phishing hard to recognize?", "options": ["A. Because it uses a foreign language", "B. Using details only a few people know", "C. Because the link is short", "D. Because it's sent at midnight"], "correct_answer_index": 1, "explanation": "The scammer researches the target before attacking."},
                {"question": "What is 'Business Email Compromise' (BEC)?", "options": ["A. Business email stuck", "B. Scammer hijacks office email to ask for money transfers", "C. Creating a new email", "D. Selling products via email"], "correct_answer_index": 1, "explanation": "This is a spear phishing variation that costs companies billions of dollars."},
                {"question": "How to distinguish a real boss email from a fake one?", "options": ["A. Look at the time it was sent", "B. Verify through another channel (phone/in person)", "C. Look at the text length", "D. Ensure no typos"], "correct_answer_index": 1, "explanation": "Do not trust just one communication channel (email)."},
                {"question": "What is the risk of Whaling for a company?", "options": ["A. Broken computers", "B. Massive financial loss and data breach", "C. Internet quota runs out", "D. Employees become lazy"], "correct_answer_index": 1, "explanation": "One successful attack on a boss can destroy the company's reputation."},
                {"question": "Information source for scammers for Spear Phishing?", "options": ["A. LinkedIn, Office Website, Social Media", "B. School books", "C. Book store", "D. Library"], "correct_answer_index": 0, "explanation": "Your public data is the scammer's capital for crafting an attack."},
                {"question": "Which most indicates a Spear Phishing trait?", "options": ["A. 'Hello customer...'", "B. 'Hello John, how is the March tax report?'", "C. 'Lottery winner...'", "D. 'Account blocked...'"], "correct_answer_index": 1, "explanation": "Use of name and specific details is its hallmark."},
                {"question": "Can regular employees get Spear Phishing?", "options": ["A. Impossible", "B. Yes, if they have access to important data", "C. Only if they are wrong", "D. If their boss tells them to"], "correct_answer_index": 1, "explanation": "Anyone with a 'key' to the company door can be a target."}
            ],
            5: [ # Advanced Threats - Malware & Zero-Day
                {"question": "What is Malware?", "options": ["A. Expensive software", "B. Dangerous software (virus, worm, trojan)", "C. Hardware", "D. Design software"], "correct_answer_index": 1, "explanation": "Malware stands for Malicious Software."},
                {"question": "What is 'Zero-Day Vulnerability'?", "options": ["A. A gap not yet known by the software maker", "B. A virus that lives 0 days", "C. Free app", "D. Auto update"], "correct_answer_index": 0, "explanation": "Very dangerous because there is no 'cure' (patch) yet."},
                {"question": "How does a Trojan infect a computer?", "options": ["A. Disguising itself as a useful program", "B. Jumping through cables", "C. Through the air", "D. Through the casing"], "correct_answer_index": 0, "explanation": "Like a Trojan horse, it looks good outside but is evil inside."},
                {"question": "What is the function of 'Ransomware'?", "options": ["A. Stealing mobile credit", "B. Locking data and asking for ransom money", "C. Speeding up PC", "D. Deleting history"], "correct_answer_index": 1, "explanation": "Ransomware holds your data hostage for money."},
                {"question": "Spyware is used for...", "options": ["A. Spying on user activity secretly", "B. Playing games", "C. Sending large files", "D. Editing video"], "correct_answer_index": 0, "explanation": "Spyware records keyboard typing (keylogger) to your camera."},
                {"question": "Most common way malware enters a phone?", "options": ["A. Via phone call", "B. Downloading apps from outside Play Store/App Store", "C. Sunlight", "D. Via casing"], "correct_answer_index": 1, "explanation": "'Mod' or free apps on dark sites are often injected with malware."},
                {"question": "What is a 'Botnet'?", "options": ["A. Internet robot", "B. Network of infected computers controlled by criminals", "C. Smart chatbot", "D. Game server"], "correct_answer_index": 1, "explanation": "Your computer could become a 'zombie' to attack others."},
                {"question": "Adware is...", "options": ["A. Annoying advertising software", "B. TV ads", "C. Selling goods", "D. Digital billboard"], "correct_answer_index": 0, "explanation": "Although less dangerous than a virus, it is very intrusive to privacy."},
                {"question": "What is a sign of malware infection?", "options": ["A. Monitor becomes clean", "B. Slow performance and weird pop-ups appear", "C. Internet becomes free", "D. Fan noise disappears"], "correct_answer_index": 1, "explanation": "Background malware activity consumes system resources."},
                {"question": "Why should we use Antivirus?", "options": ["A. To make PC heavy", "B. Detecting and removing malware threats", "C. To be able to play games", "D. Office orders"], "correct_answer_index": 1, "explanation": "Antivirus is a digital security guard for your data."}
            ],
            6: [ # Ransomware Fundamentals
                {"question": "The primary goal of Ransomware creators is...", "options": ["A. Fame", "B. Financial Gain", "C. Helping people", "D. Damaging the internet"], "correct_answer_index": 1, "explanation": "The main motivation is extorting victims for material gain."},
                {"question": "Should we pay the Ransomware ransom?", "options": ["A. Yes, definitely data returns", "B. Not recommended, as data might not return", "C. Depends on the price", "D. Pay half only"], "correct_answer_index": 1, "explanation": "Paying funds criminals and does not guarantee the key is given."},
                {"question": "Best defense against Ransomware?", "options": ["A. Antivirus only", "B. Regular data backup in a separate location (Offline)", "C. Use a new laptop", "D. Don't bother saving data"], "correct_answer_index": 1, "explanation": "If you have a backup, you just wipe the system and restore data without paying."},
                {"question": "How does Ransomware spread in an office?", "options": ["A. Through the AC", "B. Through the network (Lateral movement)", "C. Through the window", "D. Through the phone"], "correct_answer_index": 1, "explanation": "One person gets it, the whole office server can be locked."},
                {"question": "What is 'Encryption' in Ransomware?", "options": ["A. Deleting data", "B. Scrambling data so it cannot be read without a key", "C. Copying data", "D. Selling data"], "correct_answer_index": 1, "explanation": "Data is still there, but its content cannot be opened at all."},
                {"question": "Sign of Ransomware infection?", "options": ["A. File names change and cannot be opened", "B. File becomes smaller", "C. File is lost", "D. Folder color becomes red"], "correct_answer_index": 0, "explanation": "Usually file extensions change (e.g., .crypt or .locked)."},
                {"question": "What is a 'Ransom Note'?", "options": ["A. Love letter", "B. Message from criminals containing payment instructions", "C. Shopping note", "D. Manual book"], "correct_answer_index": 1, "explanation": "This message usually appears on the wallpaper or a text file in each folder."},
                {"question": "The payment method requested by criminals is usually...", "options": ["A. Bank transfer", "B. Mobile credit", "C. Cryptocurrency (Bitcoin/Monero)", "D. Cash"], "correct_answer_index": 2, "explanation": "Crypto is hard for authorities to track."},
                {"question": "WannaCry is an example of...", "options": ["A. A game", "B. Famous global ransomware", "C. Artist's name", "D. Diet app"], "correct_answer_index": 1, "explanation": "Attacked hundreds of thousands of computers worldwide in 2017."},
                {"question": "When is the best time to perform a backup?", "options": ["A. When getting a virus", "B. Regularly (Daily/Weekly)", "C. Once a year", "D. Just before buying a new laptop"], "correct_answer_index": 1, "explanation": "Consistency is key to data safety."}
            ],
            7: [ # Incident Response
                {"question": "What is the first step when realizing an attack occurred?", "options": ["A. Panic", "B. Identification (Confirm what happened)", "C. Run", "D. Get angry"], "correct_answer_index": 1, "explanation": "Knowing the type of attack helps determine the next steps."},
                {"question": "What does 'Containment' mean?", "options": ["A. Deleting data", "B. Isolating infected parts so they don't spread", "C. Buying new servers", "D. Reporting to police"], "correct_answer_index": 1, "explanation": "Same as quarantine when sick, so it doesn't spread to other computers."},
                {"question": "Who should be contacted first at the office?", "options": ["A. Office boy", "B. IT / Information Security Team", "C. Deskmate", "D. Family"], "correct_answer_index": 1, "explanation": "Professional teams have specific procedures for handling incidents."},
                {"question": "What is 'Eradication'?", "options": ["A. Removing the root cause of the attack", "B. Adding more viruses", "C. Changing the office name", "D. Reinstalling Windows without checking"], "correct_answer_index": 0, "explanation": "Ensuring no gaps remain that the attacker can use again."},
                {"question": "Why are system logs very important?", "options": ["A. Consuming memory", "B. Trace record of activity for investigation", "C. Decoration only", "D. Windows command"], "correct_answer_index": 1, "explanation": "Logs are silent witnesses to what the intruder did."},
                {"question": "What is 'Post-Incident Activity'?", "options": ["A. Vacation", "B. Evaluation and learning so it doesn't repeat", "C. Disbanding the team", "D. Deleting all data"], "correct_answer_index": 1, "explanation": "Learning from mistakes is the most important part of security."},
                {"question": "Is it okay to turn off the computer (Power Off) during an attack?", "options": ["A. Yes, always", "B. Depends on instructions (can lose evidence in RAM)", "C. Not allowed at all", "D. Just pull the cable"], "correct_answer_index": 1, "explanation": "Forced shutdown can erase digital traces present in temporary memory."},
                {"question": "What is the use of backups in Incident Response?", "options": ["A. Increasing costs", "B. Speeding up the recovery process", "C. Making the server heavy", "D. No use"], "correct_answer_index": 1, "explanation": "Data recovery is the final stage to get business back to normal."},
                {"question": "If customer data is leaked, what is the company's obligation?", "options": ["A. Stay silent", "B. Inform the public and authorities", "C. Pretend not to know", "D. Delete the website"], "correct_answer_index": 1, "explanation": "Transparency is important to protect victim rights."},
                {"question": "Communication during an incident must be...", "options": ["A. Through one official door", "B. Through gossip", "C. Free for anyone", "D. No need to talk"], "correct_answer_index": 0, "explanation": "Conflicting information will only add to the panic."}
            ],
            8: [ # Advanced Detection & CTI
                {"question": "What does CTI stand for?", "options": ["A. Cyber Teknik Indonesia", "B. Cyber Threat Intelligence", "C. Computer Tool International", "D. Cyber Team Investigation"], "correct_answer_index": 1, "explanation": "CTI is the process of gathering information about cyber threats."},
                {"question": "What is the use of CTI for a company?", "options": ["A. Knowing who might attack", "B. Finding new employees", "C. Calculating salary", "D. Repairing the printer"], "correct_answer_index": 0, "explanation": "Knowing the enemy helps us prepare the right defense."},
                {"question": "What are 'Indicators of Compromise' (IoC)?", "options": ["A. Fuel indicators", "B. Digital signs that a system has been breached", "C. Speed indicators", "D. Monitor lights"], "correct_answer_index": 1, "explanation": "E.g., criminal IP addresses, virus file hashes, or fake domains."},
                {"question": "Advanced Persistent Threat (APT) is...", "options": ["A. Fast virus", "B. Advanced and planned attack over a long time", "C. Chat app", "D. Hardware"], "correct_answer_index": 1, "explanation": "Usually carried out by organized groups or states (state-sponsored)."},
                {"question": "What is 'Threat Hunting'?", "options": ["A. Looking for viruses in the forest", "B. Proactively looking for threats before an alarm sounds", "C. Playing shooting games", "D. Buying a new antivirus"], "correct_answer_index": 1, "explanation": "Not waiting to be attacked, but looking for intruders who might already be hiding."},
                {"question": "Deep Web vs Dark Web, which is more dangerous?", "options": ["A. Deep Web", "B. Dark Web (Often used for illegal activities)", "C. Same thing", "D. Neither is dangerous"], "correct_answer_index": 1, "explanation": "Dark web needs special software and many dark markets for leaked data are there."},
                {"question": "What is 'Zero-Trust'?", "options": ["A. Not trusting anyone in the network", "B. Having no friends", "C. Selling accounts", "D. System without passwords"], "correct_answer_index": 0, "explanation": "Security philosophy 'Never Trust, Always Verify'."},
                {"question": "CTI analysts often monitor underground forums to...", "options": ["A. Buy and sell goods", "B. See if any company data is being sold", "C. Find entertainment", "D. Learn to cook"], "correct_answer_index": 1, "explanation": "Knowing about a leak early can save the company."},
                {"question": "What is a 'Sandbox' in security?", "options": ["A. Toy sandbox", "B. Isolated environment for testing dangerous files", "C. Place to save data", "D. Antivirus name"], "correct_answer_index": 1, "explanation": "Files are tried in a safe 'box'; if they explode, they don't damage the main system."},
                {"question": "Ideal cyber security is...", "options": ["A. Reactive (after the event)", "B. Proactive (preventing before it happens)", "C. Passive (doing nothing)", "D. Secret"], "correct_answer_index": 1, "explanation": "Preventing is always cheaper and safer than curing."}
            ]
        }
        
        # Ambil soal berdasarkan module_order, fallback ke modul 1 jika tidak ada
        selected_questions = fallbacks.get(module_order, fallbacks[1])
        return {"questions": selected_questions}
