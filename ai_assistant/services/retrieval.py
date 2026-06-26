import logging
import re

from django.conf import settings
from django.db.models import Q

from ai_assistant.models import AssistantDocumentChunk, LegalChunk

from .chroma_client import get_collection
from .embeddings import EmbeddingUnavailableError, cosine_similarity, get_embedder
from .query_enrichment import enrich_query, normalize_for_search

logger = logging.getLogger(__name__)

RAG_MIN_SCORE = getattr(settings, "RAG_MIN_SCORE", 0.58)
RAG_VECTOR_WEIGHT = getattr(settings, "RAG_VECTOR_WEIGHT", 0.60)
RAG_KEYWORD_WEIGHT = getattr(settings, "RAG_KEYWORD_WEIGHT", 0.40)
RAG_USER_DOC_BOOST = getattr(settings, "RAG_USER_DOC_BOOST", 0.05)
RAG_MAX_CONTEXT_CHARS = getattr(settings, "RAG_MAX_CONTEXT_CHARS", 8000)
RAG_OVERFETCH = getattr(settings, "RAG_OVERFETCH", 6)
RAG_KEYWORD_FALLBACK_LIMIT = getattr(settings, "RAG_KEYWORD_FALLBACK_LIMIT", 60)
RAG_VECTOR_CANDIDATES = getattr(settings, "RAG_VECTOR_CANDIDATES", 32)
RAG_FINAL_THRESHOLD = getattr(settings, "RAG_FINAL_THRESHOLD", 0.70)
RAG_RERANK_CANDIDATES = getattr(settings, "RAG_RERANK_CANDIDATES", 20)
RAG_MAX_CHUNK_CHARS = getattr(settings, "RAG_MAX_CHUNK_CHARS", 1200)

LEGAL_INTENTS = [
    {
        "name": "famille",
        "triggers": {"divorce", "divorcer", "mariage", "garde", "pension", "heritage", "succession"},
        "primary_evidence": {"divorce", "mariage", "garde", "pension", "heritage"},
        "evidence": {"famille", "epoux", "epouse", "enfant", "tribunal", "succession", "nafqah"},
        "sources": {"code_famille", "droit de la famille", "fcivil"},
    },
    {
        "name": "travail",
        "triggers": {"licenciement", "travail", "preavis", "salaire", "cnas", "cnss", "accident"},
        "primary_evidence": {"licenciement", "travail", "contrat", "preavis", "salaire"},
        "evidence": {"salarie", "employeur", "cnas", "cnss", "indemnisation", "accident"},
        "sources": {"travail", "social", "emploi", "cnas", "cnss"},
    },
    {
        "name": "penal",
        "triggers": {"penal", "plainte", "infraction", "violence", "agression", "vol", "arnaque", "police"},
        "primary_evidence": {"penal", "plainte", "infraction", "violence", "vol"},
        "evidence": {"victime", "police", "procureur", "amende", "peine", "arrestation", "mineur"},
        "sources": {"code_penal", "penal", "proc penale", "crime", "criminal"},
    },
    {
        "name": "logement",
        "triggers": {"bail", "loyer", "location", "expulsion", "locataire", "proprietaire", "terrain"},
        "primary_evidence": {"bail", "loyer", "location", "expulsion", "terrain"},
        "evidence": {"logement", "locataire", "proprietaire", "preavis", "caution", "foncier"},
        "sources": {"logement", "immobilier", "bail", "foncier"},
    },
    {
        "name": "commercial",
        "triggers": {"commercial", "sarl", "societe", "commerce", "registre", "entreprise", "dette", "facture"},
        "primary_evidence": {"societe", "commercial", "commerce", "entreprise", "sarl"},
        "evidence": {"registre", "statuts", "gerant", "dette", "creance", "facture"},
        "sources": {"commerce", "commercial", "societe", "registre"},
    },
    {
        "name": "administratif",
        "triggers": {"passeport", "residence", "permis", "commune", "consulat", "nationalite", "certificat"},
        "primary_evidence": {"passeport", "residence", "permis", "commune", "certificat"},
        "evidence": {"consulat", "administration", "nationalite", "visa", "wilaya"},
        "sources": {"administratif", "commune", "etat civil", "nationalite", "consulat"},
    },
]

STOPWORDS = {
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "en",
    "au", "aux", "ce", "que", "qui", "pour", "par", "sur", "dans", "avec",
    "il", "elle", "je", "tu", "nous", "vous", "pas", "plus", "the", "a",
    "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by",
    "from", "is", "are", "was", "were", "this", "that",
    "في", "من", "الى", "إلى", "على", "عن", "مع", "هذا", "هذه", "الذي",
    "التي", "ان", "أن", "لا", "ما", "لم", "لن", "قد",
}

_INJECTION_PATTERNS = re.compile(
    r"(ignore\s+(all\s+)?previous\s+instructions?"
    r"|system\s*:"
    r"|<\s*/?\s*system\s*>"
    r"|assistant\s*:"
    r"|\[INST\]"
    r"|###\s*(instruction|system|prompt)"
    r"|<\s*/?\s*prompt\s*>"
    r"|tu\s+es\s+maintenant)",
    re.IGNORECASE,
)


def _sanitize_chunk(text):
    if not text:
        return ""
    text = _INJECTION_PATTERNS.sub("[contenu filtre]", text)
    return text[:RAG_MAX_CHUNK_CHARS]


def _compress_text(query_bundle, text, max_sentences=4):
    if not text:
        return ""
    clean = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[\.\!\?\u061f])\s+", clean)
    if len(sentences) <= max_sentences:
        return _sanitize_chunk(clean)

    ranked = []
    query_tokens = _tokens(query_bundle["expanded"])
    for sentence in sentences:
        sentence_score = len(query_tokens & _tokens(sentence))
        if sentence_score > 0:
            ranked.append((sentence_score, sentence))

    if not ranked:
        return _sanitize_chunk(" ".join(sentences[:max_sentences]))

    top_sentences = [item[1] for item in sorted(ranked, key=lambda x: x[0], reverse=True)[:max_sentences]]
    return _sanitize_chunk(" ".join(top_sentences))


def _tokens(text):
    return set(re.findall(r"\w+", normalize_for_search(text), re.UNICODE)) - STOPWORDS


def _keyword_score(query, text):
    query_tokens = _tokens(query)
    if not query_tokens:
        return 0.0
    text_tokens = _tokens(text)
    if not text_tokens:
        return 0.0
    overlap = query_tokens & text_tokens
    return len(overlap) / len(query_tokens)


def _keyword_overlap_count(query_bundle, text):
    return len(_tokens(query_bundle["expanded"]) & _tokens(text))


def _best_keyword_score(query_bundle, text):
    return max(
        _keyword_score(query_bundle["original"], text),
        _keyword_score(query_bundle["expanded"], text),
    )


def _hybrid_score(vector_score, keyword_score, boost=0.0):
    score = (RAG_VECTOR_WEIGHT * vector_score) + (RAG_KEYWORD_WEIGHT * keyword_score)
    return min(1.0, score + boost)


def _matched_intents(query_bundle):
    query_text = normalize_for_search(
        f"{query_bundle['original']} {query_bundle['expanded']}"
    )
    return [
        intent for intent in LEGAL_INTENTS
        if any(trigger in query_text for trigger in intent["triggers"])
    ]


def _intent_adjusted_score(score, query_bundle, text, source_hint=""):
    target_text = normalize_for_search(f"{text} {source_hint}")
    for intent in _matched_intents(query_bundle):
        primary_hits = sum(1 for term in intent["primary_evidence"] if term in target_text)
        evidence_hits = sum(1 for term in intent["evidence"] if term in target_text)
        source_hit = any(source in target_text for source in intent["sources"])

        if primary_hits and source_hit:
            score += min(0.30, primary_hits * 0.10 + evidence_hits * 0.04)
        elif primary_hits:
            score += min(0.14, primary_hits * 0.05)
        elif source_hit:
            score += 0.06
        else:
            score *= 0.78
    return min(1.0, score)


def _domain_metadata_score(query_bundle, citation, text):
    source = citation.get("source", "")
    reference = citation.get("reference", "")
    target = normalize_for_search(f"{source} {reference} {text}")
    boost = 0.0
    for intent in _matched_intents(query_bundle):
        if any(source_hint in target for source_hint in intent["sources"]):
            boost += 0.08
        elif any(term in target for term in intent["primary_evidence"]):
            boost += 0.04
    return boost


def _candidate_matches_intent(intent, item):
    citation = item["citation"]
    target = normalize_for_search(
        " ".join(
            str(part)
            for part in [
                item.get("text", ""),
                citation.get("source", ""),
                citation.get("reference", ""),
                citation.get("article", ""),
                citation.get("section", ""),
            ]
            if part
        )
    )
    primary_hits = sum(1 for term in intent["primary_evidence"] if term in target)
    evidence_hits = sum(1 for term in intent["evidence"] if term in target)
    source_hit = any(source in target for source in intent["sources"])
    return primary_hits > 0 or source_hit or evidence_hits >= 2


def _filter_candidates_by_domain(query_bundle, candidates):
    intents = _matched_intents(query_bundle)
    if not intents:
        return candidates

    filtered = [
        item for item in candidates
        if any(_candidate_matches_intent(intent, item) for intent in intents)
    ]
    return filtered or candidates


def _rerank_candidates(query_bundle, candidates):
    reranked = []
    exact_normalized = normalize_for_search(query_bundle["original"])
    for item in candidates[:RAG_RERANK_CANDIDATES]:
        text = item["text"]
        citation = item["citation"]
        overlap = _keyword_overlap_count(query_bundle, text)
        rerank_boost = min(0.18, overlap * 0.03)
        if exact_normalized and exact_normalized in normalize_for_search(text):
            rerank_boost += 0.08
        rerank_boost += _domain_metadata_score(query_bundle, citation, text)
        item["score"] = min(1.0, item["score"] + rerank_boost)
        reranked.append(item)
    reranked.sort(key=lambda item: item["score"], reverse=True)
    return reranked


def _passes_abstention_gate(query_bundle, item):
    if not item:
        return False
    if item["score"] < RAG_FINAL_THRESHOLD:
        return False
    overlap = _keyword_overlap_count(query_bundle, item["text"])
    if overlap == 0:
        return False
    if _matched_intents(query_bundle):
        return item["score"] >= RAG_FINAL_THRESHOLD
    return item["score"] >= max(RAG_FINAL_THRESHOLD, 0.75)


def _retrieve_legal_chunks(query_embedding, query_bundle, limit):
    candidates = []
    if not query_embedding:
        return candidates

    try:
        collection = get_collection("legal_chunks")
        n_results = min(max(limit * RAG_OVERFETCH, RAG_VECTOR_CANDIDATES), collection.count())
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

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    for text, meta, dist in zip(docs, metas, distances):
        meta = meta or {}
        vector_score = max(0.0, 1.0 - dist / 2.0)
        source_hint = " ".join(
            str(part)
            for part in [
                meta.get("source_title", ""),
                meta.get("reference", ""),
                meta.get("language", ""),
                meta.get("law_id", ""),
            ]
            if part
        )
        compressed_text = _compress_text(query_bundle, text)
        keyword_score = _best_keyword_score(query_bundle, f"{compressed_text} {source_hint}")
        score = _hybrid_score(vector_score, keyword_score)
        score = _intent_adjusted_score(score, query_bundle, compressed_text, source_hint)
        if score < max(RAG_MIN_SCORE - 0.05, 0.45):
            continue
        candidates.append(
            {
                "kind": "law",
                "text": compressed_text,
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


def _keyword_candidate_queryset(query_bundle):
    tokens = [token for token in _tokens(query_bundle["expanded"]) if len(token) > 1]
    if not tokens:
        return LegalChunk.objects.none()

    token_filters = Q()
    for token in tokens[:8]:
        token_filters |= Q(text__icontains=token)
        token_filters |= Q(article__icontains=token)
        token_filters |= Q(section__icontains=token)
        token_filters |= Q(source__title__icontains=token)
        token_filters |= Q(source__category__icontains=token)
        token_filters |= Q(source__reference__icontains=token)
        token_filters |= Q(metadata__summary__icontains=token)
    return LegalChunk.objects.filter(token_filters).select_related("source")


def _retrieve_keyword_legal_chunks(query_bundle, limit):
    scored = []
    queryset = _keyword_candidate_queryset(query_bundle)
    if not queryset.exists():
        return []

    for chunk in queryset.iterator(chunk_size=250):
        searchable_text = _chunk_search_text(chunk)
        overlap = _keyword_overlap_count(query_bundle, searchable_text)
        if overlap == 0:
            continue
        keyword_score = _best_keyword_score(query_bundle, searchable_text)
        score = min(1.0, 0.18 + (0.82 * keyword_score))
        score = _intent_adjusted_score(score, query_bundle, searchable_text)
        if score < RAG_MIN_SCORE:
            continue
        scored.append((score, overlap, chunk))

    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    candidates = []
    for score, overlap, chunk in scored[:RAG_KEYWORD_FALLBACK_LIMIT]:
        candidates.append(
            {
                "kind": "law",
                "text": _compress_text(query_bundle, chunk.text),
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
    doc_chunks = AssistantDocumentChunk.objects.select_related("document").filter(document__user=user)
    if legal_request:
        doc_chunks = doc_chunks.filter(document__legal_request=legal_request)

    for chunk in doc_chunks.iterator(chunk_size=200):
        vector_score = cosine_similarity(query_embedding, chunk.embedding) if query_embedding else 0.0
        keyword_score = _best_keyword_score(query_bundle, chunk.text)
        score = _hybrid_score(vector_score, keyword_score, RAG_USER_DOC_BOOST)
        if score < RAG_MIN_SCORE:
            continue
        candidates.append(
            {
                "kind": "user_document",
                "text": _compress_text(query_bundle, chunk.text),
                "score": score,
                "citation": {
                    "type": "user_document",
                    "document": chunk.document.title,
                    "chunk_id": chunk.id,
                },
            }
        )
    return candidates


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
    if not query_bundle["is_legal"]:
        logger.info("Query rejected by legal-domain gate: %s", query)
        return []

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
        candidates += _retrieve_user_doc_chunks(query_embedding, query_bundle, user, legal_request)

    candidates = _dedupe_candidates(candidates)
    candidates.sort(key=lambda item: item["score"], reverse=True)
    candidates = _filter_candidates_by_domain(query_bundle, candidates)
    candidates = _rerank_candidates(query_bundle, candidates)
    if not candidates or not _passes_abstention_gate(query_bundle, candidates[0]):
        return []
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
        line = f"[{index}] {label}{article}: {item['text']}"
        if total_chars + len(line) > RAG_MAX_CONTEXT_CHARS:
            break
        lines.append(line)
        total_chars += len(line)

    return "\n\n".join(lines), citations
