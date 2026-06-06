import functools
import hashlib
import inspect
import json
import time
from typing import Any, Callable, Optional

from app.core.redis_client import RedisClient


def _is_depends_param(param: inspect.Parameter) -> bool:
    """Check if a function parameter is a FastAPI Depends() injection."""
    try:
        if param.default is None:
            return False
        return type(param.default).__name__ == 'Depends' and type(param.default).__module__ == 'fastapi.params'
    except Exception:
        return False


def _cache_params(fn: Callable, *args, **kwargs) -> str:
    """Build a stable cache key from serializable parameters only.

    Filters out FastAPI dependency-injected params (Depends, db sessions, etc.)
    so the key is deterministic across requests.
    """
    try:
        sig = inspect.signature(fn)
        param_names = list(sig.parameters.keys())
    except (ValueError, TypeError):
        param_names = []

    filtered: dict[str, Any] = {}
    for i, name in enumerate(param_names):
        if i < len(args):
            val = args[i]
        elif name in kwargs:
            val = kwargs[name]
        else:
            continue
        if name in sig.parameters and _is_depends_param(sig.parameters[name]):
            continue
        filtered[name] = val

    for name, val in kwargs.items():
        if name not in filtered and name not in param_names:
            filtered[name] = val

    def _jsonable(v: Any) -> Any:
        if isinstance(v, (str, int, float, bool, type(None), list, dict, tuple)):
            return v
        try:
            json.dumps(v)
            return v
        except (TypeError, ValueError):
            return str(v)

    safe = {k: _jsonable(v) for k, v in filtered.items()}
    raw = json.dumps(safe, sort_keys=True, default=str)
    return hashlib.md5(raw.encode()).hexdigest()


class TimedCache:
    """TTL-based cache backed by Redis, falling back to in-memory dict."""

    def __init__(self, ttl_seconds: int = 3600, use_redis: bool = True):
        self._data: dict[str, tuple[float, Any]] = {}
        self._ttl = ttl_seconds
        self._use_redis = use_redis
        self._redis: Optional[RedisClient] = None

    def _get_redis(self) -> Optional[RedisClient]:
        if self._use_redis:
            if self._redis is None:
                self._redis = RedisClient()
            if self._redis.available:
                return self._redis
        return None

    def key(self, fn: Callable, *args, **kwargs) -> str:
        parts = [fn.__qualname__, _cache_params(fn, *args, **kwargs)]
        return hashlib.md5("|".join(parts).encode()).hexdigest()

    def get(self, key: str) -> Any | None:
        r = self._get_redis()
        if r is not None:
            return r.get_json(key)

        if key in self._data:
            expires, value = self._data[key]
            if time.time() < expires:
                return value
            del self._data[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        r = self._get_redis()
        if r is not None:
            r.set_json(key, value, ttl or self._ttl)
            return
        t = ttl or self._ttl
        self._data[key] = (time.time() + t, value)

    def get_or_compute(self, fn: Callable, *args, **kwargs) -> Any:
        k = self.key(fn, *args, **kwargs)
        cached = self.get(k)
        if cached is not None:
            return cached
        value = fn(*args, **kwargs)
        self.set(k, value)
        return value

    async def get_or_compute_async(self, fn: Callable, *args, **kwargs) -> Any:
        k = self.key(fn, *args, **kwargs)
        cached = self.get(k)
        if cached is not None:
            return cached
        value = await fn(*args, **kwargs)
        self.set(k, value)
        return value

    def invalidate(self, fn: Callable, *args, **kwargs) -> None:
        k = self.key(fn, *args, **kwargs)
        r = self._get_redis()
        if r is not None:
            r.delete(k)
            return
        self._data.pop(k, None)

    def clear(self) -> None:
        r = self._get_redis()
        if r is not None:
            r.clear_fallback()
        self._data.clear()


# Shared instances
try:
    explain_cache = TimedCache(ttl_seconds=3600)
    cache = TimedCache(ttl_seconds=300)  # Default short-TTL cache
except Exception:
    explain_cache = None
    cache = None


def cache_result(ttl: int = 60):
    """Decorator that caches return values of async route handlers.

    Cache key is derived from the qualified function name and serializable
    arguments only — DB sessions, request objects, and other dependency-injected
    parameters are excluded automatically.
    """
    def decorator(fn):
        cache = TimedCache(ttl_seconds=ttl)

        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            return await cache.get_or_compute_async(fn, *args, **kwargs)

        return wrapper
    return decorator
