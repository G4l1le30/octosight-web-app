import os
import re
import io

import pytesseract
from PIL import Image


class OCREngine:
    def __init__(self):
        # Tesseract configuration (can be adjusted for better accuracy)
        self.config = r"--oem 3 --psm 6"

    def extract_text(self, image_path):
        """Extracts raw text from an image file."""
        try:
            if not os.path.exists(image_path):
                return f"Error: File {image_path} not found."

            img = Image.open(image_path)
            text = pytesseract.image_to_string(img, config=self.config)
            return text
        except Exception as e:
            return f"OCR Error: {str(e)}"

    def extract_text_from_bytes(self, image_bytes: bytes):
        """Extracts raw text from image bytes in memory."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(img, config=self.config)
            return text
        except Exception as e:
            return f"OCR Error: {str(e)}"

    def find_indicators(self, text):
        """Extracts URLs, emails, and potential phone numbers from text."""
        # Noise-tolerant URL Regex (allows for 1 or more slashes after the colon)
        url_pattern = r'https?:/+(?:[-\w.]|(?:%[\da-fA-F]{2})|[/?#=&%])+'

        # Standard Email Regex

        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

        # Simple Phone Number Regex (Flexible for Indonesian formats)
        phone_pattern = r"(\+?62|08)[0-9]{8,11}"

        urls = re.findall(url_pattern, text)
        emails = re.findall(email_pattern, text)
        phones = re.findall(phone_pattern, text)

        return {
            "urls": list(set(urls)),
            "emails": list(set(emails)),
            "phones": list(set(phones)),
        }

    def extract_reference_number(self, text: str) -> str:
        """
        Attempts to extract a transaction reference number from OCR text.
        Common patterns: No. Ref, TRX ID, Ref:, Nomor Transaksi.
        """
        # Look for alphanumeric codes after common labels
        # Patterns like: Ref: 12345, No. Transaksi TRX-999, etc.
        patterns = [
            r"(?:Ref|No\.?\s?Ref|No\.?\s?Referensi|Nomor\s?Referensi|Nomor\s?Transaksi|TRX\s?ID|OCTO-REF)[:\s]+([A-Z0-9-]+)",
            r"ID\s?Transaksi[:\s]+([A-Z0-9-]+)",
            r"Kode\s?Referensi[:\s]+([A-Z0-9-]+)",
            r"(OCTO-REF-[0-9]+)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""


if __name__ == "__main__":
    # Get the project root relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    test_image = os.path.join(project_root, "prototype", "samples", "ocr", "test_ocr2.png")

    ocr = OCREngine()
    print(f"--- Processing: {test_image} ---")

    extracted_text = ocr.extract_text(test_image)
    print("\n[Raw Text Snippet]")
    print(extracted_text[:500] + "...")  # Show first 500 chars

    indicators = ocr.find_indicators(extracted_text)
    print("\n[Found Indicators]")
    print(f"URLs: {indicators['urls']}")
    print(f"Emails: {indicators['emails']}")
    print(f"Phones: {indicators['phones']}")
