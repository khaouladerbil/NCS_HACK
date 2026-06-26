import logging
import re

from django.conf import settings

from ai_assistant.models import AssistantDocumentChunk, LegalChunk

from .chroma_client import get_collection
from .embeddings import EmbeddingUnavailableError, cosine_similarity, get_embedder
from .query_enrichment import enrich_query, normalize_for_search

logger = logging.getLogger(__name__)

RAG_MIN_SCORE = getattr(settings, "RAG_MIN_SCORE", 0.30)
RAG_VECTOR_WEIGHT = getattr(settings, "RAG_VECTOR_WEIGHT", 0.75)
RAG_KEYWORD_WEIGHT = getattr(settings, "RAG_KEYWORD_WEIGHT", 0.25)
RAG_USER_DOC_BOOST = getattr(settings, "RAG_USER_DOC_BOOST", 0.05)
RAG_MAX_CONTEXT_CHARS = getattr(settings, "RAG_MAX_CONTEXT_CHARS", 12000)
RAG_OVERFETCH = getattr(settings, "RAG_OVERFETCH", 4)
RAG_KEYWORD_FALLBACK_LIMIT = getattr(settings, "RAG_KEYWORD_FALLBACK_LIMIT", 120)

# CORRECTION ⑤ : limite la taille d'un chunk injecté dans le prompt
RAG_MAX_CHUNK_CHARS = 800

STOPWORDS = {
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "en",
    "au", "aux", "ce", "que", "qui", "pour", "par", "sur", "dans", "avec",
    "il", "elle", "je", "tu", "nous", "vous", "pas", "plus", "the", "a",
    "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by",
    "from", "is", "are", "was", "were", "this", "that",
    "في", "من", "الى", "إلى", "على", "عن", "مع", "هذا", "هذه", "الذي",
    "التي", "ان", "أن", "لا", "ما", "لم", "لن", "قد",
}

# CORRECTION ⑤ : patterns d'injection prompt à neutraliser
_INJECTION_PATTERNS = re.compile(
    r"(ignore\s+(all\s+)?previous\s+instructions?"
    r"|system\s*:"
    r"|<\s*/?\s*system\s*>"
    r"|assistant\s*:"
    r"|\[INST\]"
    r"|###\s*(instruction|system|prompt)"
    r"|<\s*/?\s*prompt\s*>"
    r"|tu\s+es\s+maintenant)"
    ,
    re.IGNORECASE,
)


def _sanitize_chunk(text: str) -> str:
    """
    CORRECTION ⑤ : Nettoie le texte d'un chunk avant injection dans le prompt.
    - Tronque à RAG_MAX_CHUNK_CHARS
    - Neutralise les patterns d'injection prompt connus
    """
    if not text:
        return ""
    text = text[:RAG_MAX_CHUNK_CHARS]
    text = _INJECTION_PATTERNS.sub("[contenu filtre]", text)
    return text


def _tokens(text):
    return set(re.findall(r"\w+", normalize_for_search(text), re.UNICODE)) - STOPWORDS


def _keyword_score(query, text):
    query_tokens = _tokens(query)
    if not query_tokens:
        return 0.0
    return len(query_tokens & _tokens(text)) / len(query_tokens)


def _best_keyword_score(query_bundle, text):
    return max(
        _keyword_score(query_bundle["original"], text),
        _keyword_score(query_bundle["expanded"], text),
    )


def _hybrid_score(vector_score, keyword_score, boost=0.0):
    score = (RAG_VECTOR_WEIGHT * vector_score) + (RAG_KEYWORD_WEIGHT * keyword_score)
    return min(1.0, score + boost)


def _retrieve_legal_chunks(query_embedding, query_bundle, limit):
    candidates = []

    if not query_embedding:
        return candidates

    try:
        collection = get_collection("legal_chunks")
        n_results = min(limit * RAG_OVERFETCH, collection.count())
        if n_results == 0:
            return candidates

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as exc:
        logger.error("ChromaDB query failed: %s", exc)
        return candidates

    ids = results["ids"][0]
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    for doc_id, text, meta, dist in zip(ids, docs, metas, distances):
        vector_score = max(0.0, 1.0 - dist / 2.0)
        keyword_score = _best_keyword_score(query_bundle, text)
        score = _hybrid_score(vector_score, keyword_score)
        if score < RAG_MIN_SCORE:
            continue
        candidates.append(
            {
                "kind": "law",
                # CORRECTION ⑤ : texte sanitisé
                "text": _sanitize_chunk(text),
                "score": score,
                "citation": {
                    "type": "law",
                    "source": meta.get("source_title", ""),
                    "reference": meta.get("reference", ""),
                    "article": meta.get("article", ""),
                    "section": meta.get("section", ""),
                    "chunk_id": meta.get("chunk_id"),
                },
            }
        )

    return candidates


def _chunk_search_text(chunk):
    metadata = chunk.metadata or {}
    keywords = metadata.get("keywords") or []
    if isinstance(keywords, list):
        keywords = " ".join(str(keyword) for keyword in keywords)
    return " ".join(
        str(part)
        for part in [
            chunk.text,
            chunk.article,
            chunk.section,
            chunk.source.title,
            chunk.source.category,
            chunk.source.reference,
            metadata.get("summary", ""),
            keywords,
        ]
        if part
    )


def _retrieve_keyword_legal_chunks(query_bundle, limit):
    scored = []
    chunks = (
        LegalChunk.objects.select_related("source")
        .only(
            "id",
            "text",
            "article",
            "section",
            "metadata",
            "source__title",
            "source__category",
            "source__reference",
        )
    )

    for chunk in chunks.iterator(chunk_size=250):
        searchable_text = _chunk_search_text(chunk)
        keyword_score = _best_keyword_score(query_bundle, searchable_text)
        if keyword_score <= 0:
            continue
        score = min(1.0, max(RAG_MIN_SCORE, 0.20 + (0.80 * keyword_score)))
        scored.append((score, keyword_score, chunk))

    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    candidates = []
    max_results = min(limit * RAG_OVERFETCH, RAG_KEYWORD_FALLBACK_LIMIT)
    for score, keyword_score, chunk in scored[:max_results]:
        candidates.append(
            {
                "kind": "law",
                "text": _sanitize_chunk(chunk.text),
                "score": score,
                "citation": {
                    "type": "law",
                    "source": chunk.source.title,
                    "reference": chunk.source.reference or "",
                    "article": chunk.article or "",
                    "section": chunk.section or "",
                    "chunk_id": chunk.id,
                },
            }
        )
    return candidates


def _retrieve_user_doc_chunks(query_embedding, query_bundle, user, legal_request):
    candidates = []

    doc_chunks = AssistantDocumentChunk.objects.select_related("document").filter(
        document__user=user
    )
    if legal_request:
        doc_chunks = doc_chunks.filter(document__legal_request=legal_request)

    for chunk in doc_chunks:
        vector_score = (
            cosine_similarity(query_embedding, chunk.embedding)
            if query_embedding
            else 0.0
        )
        keyword_score = _best_keyword_score(query_bundle, chunk.text)
        score = _hybrid_score(vector_score, keyword_score, RAG_USER_DOC_BOOST)
        if score < RAG_MIN_SCORE:
            continue
        candidates.append(
            {
                "kind": "user_document",
                # CORRECTION ⑤ : texte sanitisé
                "text": _sanitize_chunk(chunk.text),
                "score": score,
                "citation": {
                    "type": "user_document",
                    "document": chunk.document.title,
                    "chunk_id": chunk.id,
                },
            }
        )

    return candidates


def retrieve_context(query, user, legal_request=None, include_user_docs=True, limit=6):
    # CORRECTION ④ : get_embedder() peut retourner None
    embedder = get_embedder()
    if embedder is None:
        logger.warning("RAG skipped — embedding service unavailable.")
        return []

    try:
        query_embedding = embedder.embed_query(query)
    except EmbeddingUnavailableError as exc:
        logger.error("Embedding unavailable for retrieval: %s", exc)
        query_embedding = []

    candidates = _retrieve_legal_chunks(query_embedding, query, limit)

    if include_user_docs:
        candidates += _retrieve_user_doc_chunks(query_embedding, query, user, legal_request)

    candidates.sort(key=lambda item: item["score"], reverse=True)
    return candidates[:limit]


def _dedupe_candidates(candidates):
    best_by_key = {}
    for item in candidates:
        citation = item["citation"]
        key = (
            citation.get("type"),
            citation.get("chunk_id"),
            citation.get("source") or citation.get("document"),
        )
        current = best_by_key.get(key)
        if current is None or item["score"] > current["score"]:
            best_by_key[key] = item
    return list(best_by_key.values())


def retrieve_context(query, user, legal_request=None, include_user_docs=True, limit=6):
    query_bundle = enrich_query(query)
    embedder = get_embedder()
    query_embedding = []

    if embedder is None:
        logger.warning("Embedding skipped; keyword fallback remains available.")
    else:
        try:
            query_embedding = embedder.embed_query(query_bundle["expanded"])
        except EmbeddingUnavailableError as exc:
            logger.error("Embedding unavailable for retrieval: %s", exc)

    candidates = _retrieve_legal_chunks(query_embedding, query_bundle, limit)
    candidates += _retrieve_keyword_legal_chunks(query_bundle, limit)

    if include_user_docs:
        candidates += _retrieve_user_doc_chunks(
            query_embedding, query_bundle, user, legal_request
        )

    candidates = _dedupe_candidates(candidates)
    candidates.sort(key=lambda item: item["score"], reverse=True)
    return candidates[:limit]


def format_context(results):
    lines = []
    citations = []
    total_chars = 0

    for index, item in enumerate(results, start=1):
        citation = item["citation"]
        citations.append(citation)
        label = citation.get("source") or citation.get("document") or "source"
        article = f", article {citation['article']}" if citation.get("article") else ""
        # Le texte est déjà sanitisé par _sanitize_chunk() en amont
        line = f"[{index}] {label}{article}: {item['text']}"
        if total_chars + len(line) > RAG_MAX_CONTEXT_CHARS:
            break
        lines.append(line)
        total_chars += len(line)

    return "\n\n".join(lines), citations
