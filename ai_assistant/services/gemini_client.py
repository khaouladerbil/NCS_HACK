import logging
import os
import time

from django.conf import settings

logger = logging.getLogger(__name__)

GEMINI_TIMEOUT = getattr(settings, "GEMINI_TIMEOUT", 30)
GEMINI_MAX_RETRIES = getattr(settings, "GEMINI_MAX_RETRIES", 3)
GEMINI_RETRY_DELAY = getattr(settings, "GEMINI_RETRY_DELAY", 1.0)

_GEMINI_RETRY_AFTER = 300


class GeminiError(RuntimeError):
    pass


class GeminiClient:
    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
        self.model_name = getattr(settings, "GEMINI_MODEL", os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        self._model = None
        if not self.api_key:
            raise GeminiError("GEMINI_API_KEY is missing.")

    def _get_model(self):
        if self._model is not None:
            return self._model
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)
            return self._model
        except ImportError as exc:
            raise GeminiError("google-generativeai is not installed.") from exc
        except Exception as exc:
            raise GeminiError(f"Gemini initialization failed: {exc}") from exc

    def generate(self, prompt):
        model = self._get_model()
        last_error = None

        for attempt in range(1, GEMINI_MAX_RETRIES + 1):
            try:
                try:
                    from google.generativeai.types import RequestOptions

                    response = model.generate_content(
                        prompt,
                        request_options=RequestOptions(timeout=GEMINI_TIMEOUT),
                    )
                except (ImportError, TypeError):
                    response = model.generate_content(prompt)
                return response.text or ""
            except Exception as exc:
                last_error = exc
                error_text = str(exc).lower()
                retryable = any(code in error_text for code in ["429", "500", "502", "503", "504"])
                retryable = retryable or any(term in error_text for term in ["rate limit", "quota", "unavailable"])
                if not retryable or attempt == GEMINI_MAX_RETRIES:
                    logger.exception("Gemini generation failed")
                    break
                time.sleep(GEMINI_RETRY_DELAY * (2 ** (attempt - 1)))

        raise GeminiError(f"Gemini unavailable after retries: {last_error}") from last_error


_GEMINI_CLIENT = None
_GEMINI_FAILED_AT = 0.0


def get_gemini_client():
    global _GEMINI_CLIENT, _GEMINI_FAILED_AT

    if _GEMINI_CLIENT is not None:
        return _GEMINI_CLIENT

    now = time.time()
    if _GEMINI_FAILED_AT and (now - _GEMINI_FAILED_AT) < _GEMINI_RETRY_AFTER:
        raise GeminiError("Gemini unavailable (retry window).")

    try:
        _GEMINI_CLIENT = GeminiClient()
        _GEMINI_FAILED_AT = 0.0
        return _GEMINI_CLIENT
    except GeminiError:
        _GEMINI_FAILED_AT = time.time()
        raise


def generate_with_gemini(prompt):
    return get_gemini_client().generate(prompt)
