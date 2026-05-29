import pytest
from app.schemas.schemas import MessageRequest


class TestMessageRequest:
    def test_valid_message_passes(self):
        req = MessageRequest(text="Hello, is this a scam?")
        assert req.text == "Hello, is this a scam?"

    def test_empty_message_fails(self):
        with pytest.raises(Exception):
            MessageRequest(text="")


class TestSpamPredictionResponse:
    def test_response_structure(self):
        from app.schemas.schemas import SpamPredictionResponse

        resp = SpamPredictionResponse(
            message="Analysis complete",
            data={
                "category": "phishing",
                "confidence": 95.5,
                "error": None,
            },
        )
        assert resp.message == "Analysis complete"
        assert resp.data["category"] == "phishing"
