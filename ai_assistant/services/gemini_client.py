import logging
import os
import time

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"

GEMINI_TIMEOUT = getattr(settings, "GEMINI_TIMEOUT", 30)
GEMINI_MAX_RETRIES = getattr(settings, "GEMINI_MAX_RETRIES", 3)
GEMINI_RETRY_DELAY = getattr(settings, "GEMINI_RETRY_DELAY", 1.0)


class GeminiError(RuntimeError):
    pass


class GeminiClient:
    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
        self.model = getattr(settings, "GEMINI_MODEL", os.getenv("GEMINI_MODEL", "google/gemma-3-27b-it"))
        if not self.api_key:
            raise GeminiError("GEMINI_API_KEY is missing.")

    def generate(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://justicepath.dz",
            "X-Title": "JusticePath AI",
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2048,
            "temperature": 0.7,
        }

        last_error = None
        for attempt in range(1, GEMINI_MAX_RETRIES + 1):
            try:
                resp = requests.post(
                    OPENROUTER_BASE,
                    headers=headers,
                    json=payload,
                    timeout=GEMINI_TIMEOUT,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]

                last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
                retryable = resp.status_code in (429, 500, 502, 503, 504)
                if not retryable or attempt == GEMINI_MAX_RETRIES:
                    logger.error("OpenRouter error: %s", last_error)
                    break
                time.sleep(GEMINI_RETRY_DELAY * (2 ** (attempt - 1)))

            except requests.Timeout as exc:
                last_error = exc
                if attempt == GEMINI_MAX_RETRIES:
                    break
                time.sleep(GEMINI_RETRY_DELAY * attempt)
            except Exception as exc:
                last_error = exc
                logger.exception("Unexpected error calling OpenRouter")
                break

        raise GeminiError(f"OpenRouter unavailable after retries: {last_error}")


_GEMINI_CLIENT: GeminiClient | None = None
_GEMINI_FAILED_AT = 0.0
_RETRY_AFTER = 120.0


def get_gemini_client() -> GeminiClient:
    global _GEMINI_CLIENT, _GEMINI_FAILED_AT

    if _GEMINI_CLIENT is not None:
        return _GEMINI_CLIENT

    now = time.time()
    if _GEMINI_FAILED_AT and (now - _GEMINI_FAILED_AT) < _RETRY_AFTER:
        raise GeminiError("OpenRouter unavailable (retry window).")

    try:
        _GEMINI_CLIENT = GeminiClient()
        _GEMINI_FAILED_AT = 0.0
        return _GEMINI_CLIENT
    except GeminiError:
        _GEMINI_FAILED_AT = time.time()
        raise


def generate_with_gemini(prompt: str) -> str:
    return get_gemini_client().generate(prompt)
