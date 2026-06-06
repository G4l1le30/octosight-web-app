"""redis_client.py — Redis connection pool singleton with in-memory fallback."""

import json
import logging
import time
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger("octosight.redis")


class RedisClient:
    """Lazy-initialized Redis client with automatic in-memory fallback.

    If Redis is unreachable or ``redis_url`` is empty, all operations fall
    back to a plain dict so the application never crashes due to a missing
    Redis dependency.
    """

    _instance: Optional["RedisClient"] = None

    def __new__(cls) -> "RedisClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._redis: Any = None
        self._fallback: dict[str, tuple[float, Any]] = {}
        self._available = False
        self._connect()

    def _connect(self) -> None:
        url = settings.redis_url
        if not url:
            logger.info("Redis URL not configured — using in-memory fallback.")
            return
        try:
            import redis as sync_redis
            self._redis = sync_redis.from_url(
                url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=False,
                max_connections=10,
            )
            self._available = True
            logger.info("Redis connected at %s", url)
        except Exception as exc:
            logger.warning("Redis unavailable (%s) — using in-memory fallback.", exc)
            self._redis = None
            self._available = False

    # ── Public API ──────────────────────────────────────────────────────────

    def get(self, key: str) -> Optional[str]:
        if self._available and self._redis is not None:
            try:
                return self._redis.get(key)
            except Exception as exc:
                logger.error("Redis GET error: %s — falling back.", exc)
                self._available = False
        return self._fallback_get(key)

    def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        if self._available and self._redis is not None:
            try:
                if ttl is not None:
                    self._redis.setex(key, ttl, value)
                else:
                    self._redis.set(key, value)
                return
            except Exception as exc:
                logger.error("Redis SET error: %s — falling back.", exc)
                self._available = False
        self._fallback_set(key, value, ttl)

    def delete(self, key: str) -> None:
        if self._available and self._redis is not None:
            try:
                self._redis.delete(key)
                return
            except Exception as exc:
                logger.error("Redis DEL error: %s — falling back.", exc)
                self._available = False
        self._fallback.pop(key, None)

    # ── JSON helpers ────────────────────────────────────────────────────────

    def get_json(self, key: str) -> Any:
        raw = self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return None

    def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        try:
            raw = json.dumps(value, default=str)
        except (TypeError, ValueError) as exc:
            logger.error("JSON serialize error for key %s: %s", key, exc)
            return
        self.set(key, raw, ttl)

    # ── Health ──────────────────────────────────────────────────────────────

    @property
    def available(self) -> bool:
        return self._available

    def ping(self) -> bool:
        if self._available and self._redis is not None:
            try:
                return self._redis.ping()
            except Exception:
                return False
        return False

    # ── Fallback (in-memory dict) ───────────────────────────────────────────

    def _fallback_get(self, key: str) -> Optional[str]:
        if key in self._fallback:
            expires, value = self._fallback[key]
            if expires > time.time():
                return value
            del self._fallback[key]
        return None

    def _fallback_set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        expires = time.time() + (ttl if ttl is not None else 3600)
        self._fallback[key] = (expires, value)

    def clear_fallback(self) -> None:
        self._fallback.clear()
