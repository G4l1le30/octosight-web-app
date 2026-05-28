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
        self.malicious_extensions = [".apk", ".exe", ".scr", ".bat", ".com"]
        self.suspicious_attachments = [".pdf", ".doc", ".docx", ".zip", ".rar"]

    def _load_whitelist(self, path):
        try:
            with open(path, "r") as f:
                # Remove scheme and trailing slashes for clean matching
                return {
                    urlparse(line.strip()).netloc.lower() or line.strip().lower()
                    for line in f
                    if line.strip()
                }
        except FileNotFoundError:
            return set()

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

        # 1. Whitelist Check
        if url:
            clean_domain = domain.replace("www.", "")
            if clean_domain in self.whitelist or domain in self.whitelist:
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

            brand_terms = ["cimb", "niaga", "octo", "niag"]
            if any(term in domain for term in brand_terms):
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
