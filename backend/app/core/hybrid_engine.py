import os

from .ocr_engine import OCREngine
from .rule_engine import RuleEngine


class HybridEngine:
    def __init__(self):
        self.ocr = OCREngine()
        self.rules = RuleEngine()
        # ML Engine will be added here later

    def analyze_image(self, image_path):
        """Perform full analysis on an image file."""
        print(f"\n[Hybrid Analysis Started] Target: {os.path.basename(image_path)}")

        # 1. OCR Extraction
        raw_text = self.ocr.extract_text(image_path)
        indicators = self.ocr.find_indicators(raw_text)

        reports = []

        # 2. Rule-Based Analysis for each found URL
        for url in indicators["urls"]:
            rule_report = self.rules.calculate_risk(url)
            reports.append(
                {
                    "type": "URL",
                    "indicator": url,
                    "score": rule_report["score"],
                    "priority": rule_report["priority"],
                    "details": rule_report["flags"],
                }
            )

        # 3. Simple Heuristics for Emails (Expansion later)
        for email in indicators["emails"]:
            is_suspicious = "@gmail.com" in email or "@yahoo.com" in email
            reports.append(
                {
                    "type": "Email",
                    "indicator": email,
                    "score": 40 if is_suspicious else 10,
                    "priority": "Medium" if is_suspicious else "Low",
                    "details": [
                        "free_email_provider" if is_suspicious else "official_domain"
                    ],
                }
            )

        # 4. Final Verdict Calculation (Simple Max for now)
        if not reports:
            return {
                "verdict": "Safe",
                "final_score": 0,
                "summary": "No suspicious indicators found in image.",
                "details": [],
            }

        max_score = max(r["score"] for r in reports)
        final_priority = (
            "High" if max_score >= 70 else "Medium" if max_score >= 31 else "Low"
        )

        return {
            "verdict": "Suspicious" if max_score > 30 else "Safe",
            "final_score": max_score,
            "priority": final_priority,
            "findings": reports,
        }


if __name__ == "__main__":
    # Test with one of our samples
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    test_image = os.path.join(
        project_root, "prototype", "samples", "ocr", "phishing_mock.png"
    )

    hybrid = HybridEngine()
    result = hybrid.analyze_image(test_image)

    print("\n" + "=" * 50)
    print(f"FINAL VERDICT: {result['verdict']} (Score: {result['final_score']}/100)")
    print(f"PRIORITY: {result['priority']}")
    print("=" * 50)

    for item in result["findings"]:
        print(f"\n- [{item['type']}] {item['indicator']}")
        print(f"  Score: {item['score']} | {item['priority']}")
        print(f"  Flags: {item['details']}")
