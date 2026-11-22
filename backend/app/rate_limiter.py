"""In-memory rate limiter per IP address for FastAPI endpoints."""

from collections import defaultdict
import time
from threading import Lock

from fastapi import HTTPException, Request, status

from app.config import settings


class RateLimiter:
    """Sliding-window in-memory rate limiter per client IP."""

    def __init__(self, requests_per_minute: int = 10) -> None:
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self._history: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def get_client_ip(self, request: Request) -> str:
        """Extract the client IP address, supporting proxy headers."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def check(self, request: Request) -> None:
        """Record a request for the client IP; raise HTTP 429 if limit is exceeded."""
        client_ip = self.get_client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            # Filter out entries older than the window
            timestamps = [ts for ts in self._history[client_ip] if ts > cutoff]
            if len(timestamps) >= self.requests_per_minute:
                retry_after = int(self.window_seconds - (now - timestamps[0])) + 1
                self._history[client_ip] = timestamps
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please wait before submitting another request.",
                    headers={"Retry-After": str(max(1, retry_after))},
                )
            timestamps.append(now)
            self._history[client_ip] = timestamps

    def reset(self) -> None:
        """Clear all rate limit history (primarily for unit tests)."""
        with self._lock:
            self._history.clear()


# Default singleton instance
rate_limiter = RateLimiter(requests_per_minute=getattr(settings, "rate_limit_per_minute", 10))


def check_rate_limit(request: Request) -> None:
    """FastAPI dependency to enforce rate limiting."""
    rate_limiter.check(request)

