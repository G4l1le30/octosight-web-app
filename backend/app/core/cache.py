import functools
import hashlib
import inspect
import json
import os
import time
from typing import Any, Callable, Optional

import redis.asyncio as aioredis

# ── Redis Connection ─────────────────────────────────────────────────────────

REDIS_URL = os.getenv("REDIS_URL", "")

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    """Return a shared async Redis client, or None if Redis is unavailable."""
    global _redis_client
    if _redis_client is None and REDIS_URL:
        try:
            _redis_client = aioredis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=3,
                socket_timeout=3,
            )
            await _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


async def close_redis():
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


# ── Key helpers ──────────────────────────────────────────────────────────────

def _is_depends_param(param: inspect.Parameter) -> bool:
    try:
        if param.default is None:
            return False
        return type(param.default).__name__ == "Depends" and type(param.default).__module__ == "fastapi.params"
    except Exception:
        return False


def _cache_params(fn: Callable, *args, **kwargs) -> str:
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


def _make_key(fn: Callable, *args, **kwargs) -> str:
    parts = [fn.__qualname__, _cache_params(fn, *args, **kwargs)]
    return "octosight:" + hashlib.md5("|".join(parts).encode()).hexdigest()


# ── Cache class (Redis-backed with in-memory fallback) ───────────────────────

class TimedCache:
    """Cache with Redis backend and in-memory fallback."""

    def __init__(self, ttl_seconds: int = 3600):
        self._ttl = ttl_seconds
        self._mem: dict[str, tuple[float, Any]] = {}

    async def get(self, key: str) -> Any | None:
        # Try Redis first
        r = await get_redis()
        if r:
            try:
                raw = await r.get(key)
                if raw:
                    return json.loads(raw)
            except Exception:
                pass
        # Fallback to in-memory
        if key in self._mem:
            expires, value = self._mem[key]
            if time.time() < expires:
                return value
            del self._mem[key]
        return None

    async def set(self, key: str, value: Any) -> None:
        r = await get_redis()
        if r:
            try:
                await r.set(key, json.dumps(value, default=str), ex=self._ttl)
            except Exception:
                pass
        self._mem[key] = (time.time() + self._ttl, value)

    async def invalidate(self, key: str) -> None:
        r = await get_redis()
        if r:
            try:
                await r.delete(key)
            except Exception:
                pass
        self._mem.pop(key, None)

    async def clear_pattern(self, pattern: str = "octosight:*") -> None:
        r = await get_redis()
        if r:
            try:
                keys = []
                async for k in r.scan_iter(match=pattern):
                    keys.append(k)
                if keys:
                    await r.delete(*keys)
            except Exception:
                pass
        self._mem.clear()

    def key(self, fn: Callable, *args, **kwargs) -> str:
        return _make_key(fn, *args, **kwargs)

    async def get_or_compute_async(self, fn: Callable, *args, **kwargs) -> Any:
        k = self.key(fn, *args, **kwargs)
        cached = await self.get(k)
        if cached is not None:
            return cached
        value = await fn(*args, **kwargs)
        await self.set(k, value)
        return value


# ── Shared instances ─────────────────────────────────────────────────────────

explain_cache = TimedCache(ttl_seconds=3600)


def cache_result(ttl: int = 60):
    """Decorator that caches async route handler return values via Redis."""

    def decorator(fn):
        cache = TimedCache(ttl_seconds=ttl)

        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            return await cache.get_or_compute_async(fn, *args, **kwargs)

        wrapper._cache = cache
        return wrapper

    return decorator
