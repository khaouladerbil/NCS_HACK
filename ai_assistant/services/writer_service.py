import logging

from ai_assistant.models import AssistantDocument, LegalDocument

from .gemini_client import GeminiError, generate_with_gemini
from .prompt_builder import build_writer_prompt
from .retrieval import format_context, retrieve_context
from .template_service import get_template

logger = logging.getLogger(__name__)


class WriterServiceError(Exception):
    pass


def generate_legal_document(user, data):
    template = get_template(
        template_id=data.get("template_id"),
        document_type=data.get("document_type", ""),
    )
    if template is None:
        raise WriterServiceError("Template juridique introuvable.")

    legal_request = _get_legal_request(user, data.get("legal_request_id"))
    situation = data["situation"]
    language = data.get("language", "fr")

    context_results = retrieve_context(
        situation,
        user,
        legal_request=legal_request,
        include_user_docs=True,
        limit=8,
    )
    context, citations = format_context(context_results)
    example_text = _get_example_document_text(user, data.get("example_document_id"))
    prompt = build_writer_prompt(
        template,
        situation,
        context,
        language=language,
        example_text=example_text,
    )

    try:
        content = generate_with_gemini(prompt).strip()
    except GeminiError as exc:
        logger.error("Legal writer Gemini call failed: %s", exc)
        raise WriterServiceError(
            "La generation du document est temporairement indisponible."
        ) from exc

    if not content:
        raise WriterServiceError("Le document genere est vide.")

    title = data.get("title") or f"{template.name} - brouillon"
    return LegalDocument.objects.create(
        user=user,
        legal_request=legal_request,
        template=template,
        title=title[:255],
        document_type=template.document_type,
        situation=situation,
        content=content,
        language=language,
        status="generated",
        citations=citations,
        metadata={
            "template_name": template.name,
            "rag_results": len(context_results),
            "example_document_id": data.get("example_document_id"),
            "example_used": bool(example_text),
        },
    )


def _get_legal_request(user, legal_request_id):
    if not legal_request_id:
        return None
    try:
        from legal_path.models import LegalRequest

        return LegalRequest.objects.filter(id=legal_request_id, user=user).first()
    except Exception:
        return None


def _get_example_document_text(user, document_id):
    if not document_id:
        return ""

    document = (
        AssistantDocument.objects.filter(id=document_id, user=user)
        .prefetch_related("chunks")
        .first()
    )
    if document is None:
        raise WriterServiceError("Livre exemple introuvable ou non autorise.")

    chunks = list(document.chunks.order_by("chunk_index")[:12])
    if chunks:
        return "\n\n".join(chunk.text for chunk in chunks if chunk.text)

    return document.extracted_text or ""
