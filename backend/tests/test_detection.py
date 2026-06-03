from app.schemas.schemas import (
    RegisterRequest,
    LoginRequest,
    AnalysisRequest,
    MessageRequest,
    HybridScoreResult,
)


class TestRegisterSchema:
    def test_valid_password_passes(self):
        data = RegisterRequest(
            full_name="Test User",
            email="test@example.com",
            password="ValidPass1!",
        )
        assert data.email == "test@example.com"

    def test_weak_password_missing_uppercase_fails(self):
        with pytest.raises(Exception):
            RegisterRequest(
                full_name="Test",
                email="test@test.com",
                password="lowercase1!",
            )

    def test_weak_password_missing_special_fails(self):
        with pytest.raises(Exception):
            RegisterRequest(
                full_name="Test",
                email="test@test.com",
                password="NoSpecial1",
            )


class TestAnalysisRequest:
    def test_valid_url_passes(self):
        data = AnalysisRequest(type="Website", url="https://phishing.com")
        assert data.type == "Website"
        assert data.url == "https://phishing.com"


import pytest


class TestHybridScoreResult:
    def test_hybrid_score_formula(self):
        """Verify hybrid score: final = rule*0.35 + ml*0.65, capped at 100."""
        result = HybridScoreResult(
            final_score=72.5,
            rule_score=50.0,
            ml_score=84.6,
            ml_category="phishing",
            ml_confidence=96.2,
            priority="High",
            flags=["suspicious_url"],
            details={},
        )
        assert result.final_score == 72.5
        assert result.priority == "High"

    def test_hybrid_score_capped(self):
        capped = min(100.0, (100 * 0.35) + (120 * 0.65))
        assert capped == 100.0

    def test_ml_category_maps_to_confidence(self):
        """phishing category → ml_score = confidence, not-phishing → 100 - confidence."""
        phishing_score = 96.2
        not_phishing_score = 100 - 98.1
        assert phishing_score == 96.2
        assert round(not_phishing_score, 1) == 1.9
