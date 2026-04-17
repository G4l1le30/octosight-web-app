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
            "niaga",
            "cimb",
        ]
        self.shorteners = ["bit.ly", "s.id", "tinyurl.com", "t.co", "goo.gl"]
        self.suspicious_tlds = [".top", ".xyz", ".link", ".info", ".online", ".site"]

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

    def calculate_risk(self, url):
        parsed = urlparse(url)
        # If no scheme (like raw domain input), re-parse with dummy scheme
        if not parsed.scheme:
            parsed = urlparse(f"http://{url}")

        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        score = 0
        flags = []

        # 1. Whitelist Check (Strip 'www.' for broader matching)
        clean_domain = domain.replace("www.", "")
        if clean_domain in self.whitelist or domain in self.whitelist:
            return {"score": 0, "priority": "Low", "flags": ["on_whitelist"]}

        # 2. Punycode Check
        if self._is_punycode(domain):
            score += 40
            flags.append("punycode_detected")

        # 3. Mixed Script Check
        if self._has_mixed_scripts(domain):
            score += 30
            flags.append("mixed_scripts_detected")

        # 4. URL Shortener Check
        if any(short in domain for short in self.shorteners):
            score += 20
            flags.append("url_shortener_detected")

        # 5. Suspicious Keywords Check (Cumulative 10 pts per keyword)
        triggered_keywords = [
            kw for kw in self.suspicious_keywords if kw in domain or kw in path
        ]
        if triggered_keywords:
            score += len(triggered_keywords) * 10
            flags.append(f"suspicious_keywords_found: {triggered_keywords}")

        # 6. Brand Impersonation Check (CIMB/Niaga terms not in whitelist)
        brand_terms = ["cimb", "niaga"]
        if any(term in domain for term in brand_terms) and domain not in self.whitelist:
            score += 40
            flags.append("brand_impersonation_detected")

        # 7. Suspicious TLD Check
        if any(domain.endswith(tld) for tld in self.suspicious_tlds):
            score += 30
            flags.append("suspicious_tld_detected")

        # 8. Non-HTTPS Check
        if parsed.scheme == "http":
            score += 15
            flags.append("non_https_connection")

        # Cap score and classify
        score = min(score, 100)

        if score >= 70:
            priority = "High"
        elif score >= 31:
            priority = "Medium"
        else:
            priority = "Low"

        return {"score": score, "priority": priority, "flags": flags}


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
