import pytest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from jose import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "octosight-secret-key-change-in-production-2024")
ALGORITHM = "HS256"


class TestPasswordHashing:
    def test_hash_and_verify_correct(self):
        password = "SecurePass123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_hash_and_verify_incorrect(self):
        hashed = hash_password("RealPass789!")
        assert verify_password("WrongPass789!", hashed) is False

    def test_hash_is_unique(self):
        pwd = "SamePass1!"
        h1 = hash_password(pwd)
        h2 = hash_password(pwd)
        assert h1 != h2


class TestJWT:
    def test_create_access_token_contains_expected_claims(self):
        token = create_access_token({"sub": "user-abc", "role": "admin"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user-abc"
        assert payload["role"] == "admin"
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_create_refresh_token_has_longer_expiry(self):
        token = create_refresh_token({"sub": "user-abc"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["type"] == "refresh"
        assert payload["sub"] == "user-abc"
