import logging
import os
import time

from django.conf import settings

logger = logging.getLogger(__name__)

_RETRY_AFTER_SECONDS = 300


class EmbeddingUnavailableError(RuntimeError):
    pass


class EmbeddingService:
    def __init__(self):
        self.model_name = getattr(
            settings,
            "RAG_EMBEDDING_MODEL",
            os.getenv("RAG_EMBEDDING_MODEL", "intfloat/multilingual-e5-large"),
        )
        self._model = None

    def _load_model(self):
        if self._model is not None:
            return self._model

        try:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading embedding model: %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
            return self._model
        except ImportError as exc:
            raise EmbeddingUnavailableError(
                "sentence-transformers is not installed. Install requirements-rag.txt."
            ) from exc
        except Exception as exc:
            logger.exception("Embedding model load failed: %s", self.model_name)
            raise EmbeddingUnavailableError(
                f"Embedding model unavailable: {exc}"
            ) from exc

    def embed_query(self, text):
        return self._embed(f"query: {text}")

    def embed_passage(self, text):
        return self._embed(f"passage: {text}")

    def _embed(self, text):
        model = self._load_model()
        return model.encode(text, normalize_embeddings=True).tolist()


_EMBEDDING_SERVICE = None
_EMBEDDING_FAILED_AT = 0.0


def get_embedder():
    global _EMBEDDING_SERVICE, _EMBEDDING_FAILED_AT

    if _EMBEDDING_SERVICE is not None:
        return _EMBEDDING_SERVICE

    now = time.time()
    if _EMBEDDING_FAILED_AT and (now - _EMBEDDING_FAILED_AT) < _RETRY_AFTER_SECONDS:
        return None
    _EMBEDDING_FAILED_AT = 0.0

    try:
        service = EmbeddingService()
        service.embed_query("test de validation")
        _EMBEDDING_SERVICE = service
        logger.info("Embedding service initialized successfully.")
        return _EMBEDDING_SERVICE
    except EmbeddingUnavailableError as exc:
        _EMBEDDING_FAILED_AT = time.time()
        logger.critical(
            "Embedding service FAILED to initialize - RAG disabled: %s", exc
        )
        return None


def cosine_similarity(left, right):
    if not left or not right or len(left) != len(right):
        return 0.0
    try:
        import numpy as np
        return float(np.dot(left, right))
    except ImportError:
        return sum(a * b for a, b in zip(left, right))