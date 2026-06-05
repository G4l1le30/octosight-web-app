import math
import os
import unicodedata
from urllib.parse import urlparse

import idna

class RuleEngine:
    def __init__(self, whitelist_path=None):
        if whitelist_path is None:
            # Get the project root (one level up from core/)
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)
            whitelist_path = os.path.join(project_root, "data", "whitelist.txt")

        self.whitelist = self._load_whitelist(whitelist_path)
        self.suspicious_keywords = [
            "login",
            "verifikasi",
            "verif",
            "update",
            "secure",
            "akun",
            "konfirmasi",
            "tarik",
            "hadiah",
            "transfer",
            "pembayaran",
            "mutasi",
            "struk",
            "rekening",
            "biaya admin",
            "dana ditahan",
            "invoice",
            "tagihan",
            "pemenang",
            "undian",
            "selamat",
            "kejutan",
            "resmi",
            "gebyar",
            "beruntung",
            "kode unik",
            "hadiah gratis",
            "pajak",
            "verif",
            "klik",
            "limit",
            "blokir",
        ]
        self.scam_scenarios = {
            "accident": ["kecelakaan", "rumah sakit", "operasi", "darurat", "tabrakan", "pendarahan", "kritis"],
            "legal": ["kantor polisi", "tilang", "narkoba", "ditangkap", "tebusan", "pengadilan"],
            "wrong_transfer": ["salah kirim", "salah transfer", "minta balik", "kembalikan", "refund", "keliru transfer"],
            "banking_urgency": ["akun dibekukan", "limit habis", "pembaharuan data", "ancaman blokir", "octo mobile"]
        }
        self.shorteners = ["bit.ly", "s.id", "tinyurl.com", "t.co", "goo.gl"]
        self.suspicious_tlds = [".top", ".xyz", ".link", ".info", ".online", ".site"]
        self.brand_terms = ["cimb", "niaga", "octo", "niag"]
        self.malicious_extensions = [".apk", ".exe", ".scr", ".bat", ".com"]
        self.suspicious_attachments = [".pdf", ".doc", ".docx", ".zip", ".rar"]

    def _load_whitelist(self, path):
        try:
            whitelist = set()
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    normalized = self._normalize_whitelist_entry(line)
                    if normalized:
                        whitelist.add(normalized)
            return whitelist
        except FileNotFoundError:
            return set()

    def _normalize_whitelist_entry(self, entry: str) -> str:
        """Normalize whitelist entries preserving domain root and optional path prefixes."""
        if not entry:
            return ""

        entry = entry.strip()
        parsed = urlparse(entry)
        if not parsed.scheme:
            parsed = urlparse(f"http://{entry}")

        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]

        path = parsed.path.lower().rstrip("/")
        if path:
            return f"{domain}{path}"
        return domain

    def _is_punycode(self, domain):
        if "xn--" in domain:
            return True
        try:
            p = idna.encode(domain).decode()
            return "xn--" in p
        except:
            return False

    def _has_mixed_scripts(self, domain):
        scripts = set()
        for ch in domain:
            try:
                name = unicodedata.name(ch)
                if "LATIN" in name:
                    scripts.add("latin")
                elif "CYRILLIC" in name:
                    scripts.add("cyrillic")
                elif "GREEK" in name:
                    scripts.add("greek")
            except:
                pass
        return len(scripts) > 1

    def load_from_db(self, db_rules: dict) -> None:
        """
        Override hardcoded defaults with rules loaded from the database.

        Expected keys: keywords, scam_scenarios, tlds, shorteners, brand_terms.
        Each key maps to a list. scam_scenarios is a dict of group -> [keywords].
        """
        if db_rules.get("keywords"):
            self.suspicious_keywords = db_rules["keywords"]
        if db_rules.get("scam_scenarios"):
            self.scam_scenarios = db_rules["scam_scenarios"]
        if db_rules.get("tlds"):
            self.suspicious_tlds = db_rules["tlds"]
        if db_rules.get("shorteners"):
            self.shorteners = db_rules["shorteners"]
        if db_rules.get("brand_terms"):
            self.brand_terms = db_rules["brand_terms"]

    def _is_gibberish_text(self, text: str) -> tuple[bool, int, str]:
        """
        Detect placeholder/gibberish/meaningless text that is neither real phishing nor real ham.
        Returns (is_gibberish, score_boost, flag_reason).
        """
        if not text or len(text.strip()) < 8:
            return False, 0, ""

        t = text.strip().lower()

        # 1. Lorem ipsum or common placeholder text
        placeholder_patterns = [
            "lorem ipsum", "dolor sit amet", "consectetur",
            "sample text", "test message", "testing testing",
        ]
        if any(p in t for p in placeholder_patterns):
            return True, 40, "GIBBERISH_TEXT:placeholder"

        # 2. Keyboard smash — consecutive row chars (qwerty, asdf, zxcv, etc.)
        keyboard_rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
        for row in keyboard_rows:
            for i in range(len(row) - 2):
                seq = row[i:i+3]
                if seq in t and seq not in t.split():
                    return True, 35, "GIBBERISH_TEXT:keyboard_smash"

        # 3. Short < 30 chars — pure alpha with no spaces = likely keyboard smash
        if len(t) < 30 and t.isalpha() and " " not in t:
            max_freq = max(t.count(ch) for ch in set(t))
            if max_freq <= len(t) * 0.6:
                return True, 30, "GIBBERISH_TEXT:short_random"

        # 4. Single character dominant (e.g. "aaaaaa")
        if len(t) >= 8:
            for ch in set(t):
                if t.count(ch) / len(t) > 0.45:
                    return True, 35, "GIBBERISH_TEXT:repetitive_char"

        # 5. Cyclic repeat (e.g. "ababababab")
        if len(t) >= 12:
            for cycle_len in range(1, min(6, len(t) // 3)):
                cycle = t[:cycle_len]
                repeats = len(t) // cycle_len
                if cycle * repeats in t and repeats >= 4:
                    return True, 30, "GIBBERISH_TEXT:cyclic_repeat"

        # 6. Excessive non-alphabetic characters (machine-generated noise)
        if len(t) >= 20:
            alpha = sum(c.isalpha() for c in t)
            non_alpha_ratio = 1 - (alpha / len(t))
            if non_alpha_ratio > 0.50:
                return True, 35, "GIBBERISH_TEXT:excessive_symbols"

        # 7. Very low word variety
        words = [w for w in t.split() if len(w) > 1]
        if len(words) >= 5:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.20:
                return True, 35, "GIBBERISH_TEXT:low_variety"

        # 8. High character entropy — random-looking text
        if len(t) >= 20:
            freq = {}
            for ch in t:
                freq[ch] = freq.get(ch, 0) + 1
            entropy = -sum((c / len(t)) * math.log2(c / len(t)) for c in freq.values())
            # Lower threshold for shorter text
            threshold = 3.8 if len(t) < 40 else 4.2
            if entropy > threshold:
                return True, 30, "GIBBERISH_TEXT:high_entropy"

        # 9. Very low stopword ratio — nonsense text typically lacks function words
        stopwords = {"dan", "di", "ke", "dari", "yang", "ini", "itu", "dengan",
                     "untuk", "tidak", "akan", "saya", "anda", "kami", "pada",
                     "adalah", "the", "a", "an", "in", "on", "at", "to", "for",
                     "of", "and", "is", "it", "that", "this", "with", "your",
                     "please", "has", "have", "been", "was", "were", "are"}
        if len(words) >= 8:
            stopword_count = sum(1 for w in words if w in stopwords)
            if stopword_count / len(words) < 0.05:
                return True, 25, "GIBBERISH_TEXT:no_stopwords"

        # 10. Short text (10-50 chars) with no scam keywords — unlikely to be a real phishing report
        if len(t) < 50 and not any(kw in t for kw in self.suspicious_keywords):
            short_words = [w for w in t.split() if len(w) > 1]
            if 1 <= len(short_words) <= 3 and all(w.isalpha() for w in short_words):
                return True, 20, "GIBBERISH_TEXT:too_short"

        return False, 0, ""

    def calculate_risk(self, url, attachments=None, sender_numbers=None, extracted_text="", 
                       is_transaction=False, ref_found=False, ref_valid=False, account_blacklisted=False,
                       mutation_not_found=False, mutation_found=False):
        parsed = urlparse(url)
        if not parsed.scheme and url:
            parsed = urlparse(f"http://{url}")

        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        
        # Categorized Statuses (Default)
        details = {
            "typosquatting": "Safe",
            "keywords": "Clean",
            "attachments": "Clean",
            "ocr": "N/A",
            "transaction_validation": "N/A",
            "detected_scam_type": "General Phishing"
        }
        
        score = 0
        flags = []

        # 0. Global Hard-Checks (Database Driven)
        is_verified_bank = False
        if mutation_found or ref_valid:
             is_verified_bank = True
             flags.append("VERIFIED_BY_BANK")
             details["transaction_validation"] = "Transaction Verified in CIMB NIAGA Records"

        if account_blacklisted:
            score += 100
            flags.append("BLACKLISTED_ACCOUNT")
            details["transaction_validation"] = "Fraudulent Account Detected"

        # 0a. Transaction & Mutation Checks
        if is_transaction:
            if ref_found:
                if not ref_valid:
                    score += 100
                    flags.append("INVALID_TRANSACTION_REF")
                    details["transaction_validation"] = "Fake Receipt Detected (Reference Not Found)"
            else:
                # If it's a transaction report but no ref number could be extracted from image
                # This might be suspicious but not definitive 100%
                score += 20
                flags.append("NO_TRANSACTION_REF_EXTRACTED")
                details["transaction_validation"] = "Reference Number Not Detected in Image"
        
        # Check for "Salah Transfer" claim but no mutation record found
        if mutation_not_found and not is_verified_bank:
            score += 85
            flags.append("FAKE_WRONG_TRANSFER_CLAIM")
            details["transaction_validation"] = "Mutation Not Found (Suspected Wrong Transfer Scam)"

        # 1. Whitelist Check — match by exact domain or by suffix
        #    (so www.cimbniaga.co.id and any sub-path /id/home/welcome are both whitelisted)
        if url and domain:
            normalized_report = self._normalize_whitelist_entry(url)
            for whitelist_entry in self.whitelist:
                if normalized_report == whitelist_entry:
                    return {
                        "score": 0,
                        "priority": "Low",
                        "flags": ["on_whitelist"],
                        "details": {**details, "typosquatting": "Verified Domain"}
                    }

                # Match domain root and any sub-paths for root entries.
                if whitelist_entry == domain and normalized_report.startswith(f"{whitelist_entry}/"):
                    return {
                        "score": 0,
                        "priority": "Low",
                        "flags": ["on_whitelist"],
                        "details": {**details, "typosquatting": "Verified Domain"}
                    }

                # Match exact path prefix for path-based whitelist entries.
                if normalized_report.startswith(f"{whitelist_entry}/"):
                    return {
                        "score": 0,
                        "priority": "Low",
                        "flags": ["on_whitelist"],
                        "details": {**details, "typosquatting": "Verified Domain"}
                    }

        # 2. URL Checks
        if url:
            url_risk = False
            if self._is_punycode(domain):
                score += 45
                flags.append("punycode_detected")
                url_risk = True

            if self._has_mixed_scripts(domain):
                score += 35
                flags.append("mixed_scripts_detected")
                url_risk = True

            if any(term in domain for term in self.brand_terms):
                score += 40
                flags.append("brand_impersonation")
                details["typosquatting"] = "Highly Suspicious"
                url_risk = True
            
            if any(short in domain for short in self.shorteners):
                score += 25
                flags.append("url_shortener_detected")
                url_risk = True

            if url_risk:
                details["typosquatting"] = "Detected"
            elif any(domain.endswith(tld) for tld in self.suspicious_tlds):
                score += 15
                flags.append("suspicious_tld")
                details["typosquatting"] = "Warning"

        # 3. Keyword Analysis (Summary + OCR)
        all_content = f"{path} {extracted_text}".lower()
        
        # General suspicious keywords
        found_keywords = [kw for kw in self.suspicious_keywords if kw in all_content]
        if found_keywords:
            score += min(len(found_keywords) * 12, 40)
            # Use underscores and pipe instead of comma for parsing safety
            kws = "|".join(found_keywords[:3])
            flags.append(f"malicious_keywords:{kws}")
            details["keywords"] = "High Risk"

        # Specific Scenario Analysis (High Impact)
        for scenario, keywords in self.scam_scenarios.items():
            matches = [kw for kw in keywords if kw in all_content]
            if matches:
                # Direct Hit on a dangerous scenario: Give high base score
                # Accident and Legal are extremely high risk social engineering
                if scenario in ["accident", "legal", "wrong_transfer"]:
                    score += 70  # Force it to be high risk
                else:
                    score += 40
                
                flags.append(f"scam_scenario:{scenario}")
                
                scenario_map = {
                    "accident": "Accident",
                    "legal": "Legal Issues",
                    "wrong_transfer": "Wrong Transfer",
                    "banking_urgency": "Banking Urgency"
                }
                details["detected_scam_type"] = scenario_map.get(scenario, scenario.replace("_", " ").title())
                
                if scenario == "accident" or scenario == "legal":
                    details["keywords"] = "High Risk Threat Pattern"
                
                # Boost based on number of matching keywords within the scenario
                score += min(len(matches) * 5, 20)
        
        # 5a. Gibberish / placeholder text detection (only user's text, not URL path)
        gibberish, gibberish_boost, gibberish_reason = self._is_gibberish_text(extracted_text)
        if gibberish:
            score += gibberish_boost
            flags.append(gibberish_reason)
            details["keywords"] = "Suspicious (Gibberish Content)"

        # FINAL SCORING ADJUSTMENTS
        if is_verified_bank:
            # If the bank verified the transaction, we ignore all accumulated suspicion
            # and set a very low score.
            score = 15
            details["keywords"] = "Clean (Verified)"
            details["detected_scam_type"] = "Verified Transaction"
            details["transaction_validation"] = "Transaction Confirmed by CIMB NIAGA Core Records"

        if not found_keywords and any(kw in domain for kw in self.suspicious_keywords):
            details["keywords"] = "Detected"

        # 4. Attachment Checks
        if attachments:
            for filename in attachments:
                ext = os.path.splitext(filename.lower())[1]
                if ext in self.malicious_extensions:
                    score += 65
                    flags.append("malicious_file_detected")
                    details["attachments"] = "Dangerous"
                elif ext in self.suspicious_attachments:
                    score += 25
                    flags.append("suspicious_file_detected")
                    details["attachments"] = "Suspicious"

        # 5. OCR Status
        if extracted_text.strip():
            details["ocr"] = "Completed"

        # 6. Combined Score (Simulated ML Weighting - Rule Based 35% + Heuristic 65%)
        # Here we normalize the rule score and apply priority logic
        score = min(score, 100)

        if score >= 75:
            priority = "High"
        elif score >= 35:
            priority = "Medium"
        else:
            priority = "Low"

        return {
            "score": score, 
            "priority": priority, 
            "flags": flags,
            "details": details
        }


if __name__ == "__main__":
    engine = RuleEngine()

    test_urls = [
        "https://www.cimbniaga.co.іd",
        "http://bit.ly/cimb-verifikasі",
        "https://cimbniaga-login.secure-update.top",
        "https://www.cimbniaga.co.id",
        "https://cimb-niaga-verif.top",
        "https://octo-mobile.xyz/tarik-hadiah",
        "httрs://satuapp.cimbniaga.co.id",
    ]

    print(f"{'URL':<50} | {'Score':<5} | {'Priority':<8} | {'Flags'}")
    print("-" * 100)
    for url in test_urls:
        result = engine.calculate_risk(url)
        print(
            f"{url:<50} | {result['score']:<5} | {result['priority']:<8} | {result['flags']}"
        )
