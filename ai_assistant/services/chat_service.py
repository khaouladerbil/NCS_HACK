import logging

from django.db import transaction

from ai_assistant.models import ChatMessage, ChatSession, DraftDocument

from .embeddings import EmbeddingUnavailableError
from .gemini_client import GeminiError, generate_with_gemini
from .language import detect_language
from .prompts import build_prompt
from .query_enrichment import is_legal_query
from .retrieval import format_context, retrieve_context

logger = logging.getLogger(__name__)

# CORRECTION ⑥ : limite maximale sur la réponse LLM
_MAX_LLM_RESPONSE_CHARS = 15_000


class AIServiceError(Exception):
    pass


def _sanitize_llm_response(text: str) -> str:
    """
    CORRECTION ⑥ : Valide et nettoie la réponse brute de Gemini
    avant stockage et envoi au client.
    """
    if not text or not isinstance(text, str):
        return "Une erreur est survenue lors de la generation de la reponse."
    text = text.strip()
    if len(text) > _MAX_LLM_RESPONSE_CHARS:
        logger.warning(
            "LLM response truncated: %d chars > %d", len(text), _MAX_LLM_RESPONSE_CHARS
        )
        text = text[:_MAX_LLM_RESPONSE_CHARS] + "\n\n[Reponse tronquee]"
    return text


class ChatService:
    @staticmethod
    def process_message(user, data):
        legal_request = _get_legal_request(user, data.get("legal_request_id"))
        response_language = detect_language(data["message"], data["language"])
        session = _get_or_create_session(user, data, legal_request)

        ChatMessage.objects.create(session=session, role="user", content=data["message"])

        if not is_legal_query(data["message"]):
            answer = (
                "Je suis JusticePath AI, spécialisé dans le droit algérien. "
                "Cette question sort de mon domaine. "
                "Posez-moi une question juridique — divorce, travail, bail, héritage, procédures administratives — et je vous aide."
            )
            with transaction.atomic():
                ChatMessage.objects.create(
                    session=session, role="assistant", content=answer,
                    citations=[], metadata={"task": data["task"], "language": response_language},
                )
                session.task = data["task"]
                session.language = response_language
                if not session.title:
                    session.title = data["message"][:80]
                session.save(update_fields=["task", "language", "title", "updated_at"])
            return {"session_id": session.id, "message_id": None, "answer": answer, "citations": []}

        # Enrichir la query avec les derniers messages pour les questions de suivi
        retrieval_query = _build_retrieval_query(data["message"], session)
        try:
            context_results = retrieve_context(
                retrieval_query,
                user,
                legal_request=legal_request,
                include_user_docs=True,
            )
        except EmbeddingUnavailableError:
            context_results = []

        user_doc_results = [r for r in context_results if r.get("kind") == "user_document"]
        legal_results = [r for r in context_results if r.get("kind") != "user_document"]
        user_docs_text, _ = format_context(user_doc_results)
        dataset_context, citations = format_context(legal_results)
        context, _ = format_context(context_results)
        prompt = build_prompt(
            task=data["task"],
            language=response_language,
            message=data["message"],
            context=context,
            history=_format_history(session),
            user_docs=user_docs_text,
            dataset_context=dataset_context,
        )

        try:
            raw_answer = generate_with_gemini(prompt)
        except GeminiError as exc:
            logger.error("Gemini unavailable during chat: %s", exc)
            raise AIServiceError(
                "Le service de reponse est temporairement indisponible. "
                "Reessayez dans quelques instants."
            ) from exc

        # CORRECTION ⑥ : sanitiser avant stockage
        answer = _sanitize_llm_response(raw_answer)

        with transaction.atomic():
            assistant_message = ChatMessage.objects.create(
                session=session,
                role="assistant",
                content=answer,
                citations=citations,
                metadata={"task": data["task"], "language": response_language},
            )
            update_fields = ["task", "language", "updated_at"]
            session.task = data["task"]
            session.language = response_language
            if not session.title:
                session.title = data["message"][:80]
                update_fields.append("title")
            session.save(update_fields=update_fields)

        return {
            "session_id": session.id,
            "message_id": assistant_message.id,
            "answer": answer,
            "citations": citations,
        }

    @staticmethod
    def process_draft(user, data):
        from .exports import attach_draft_file

        legal_request = _get_legal_request(user, data.get("legal_request_id"))
        response_language = detect_language(data["message"], data["language"])

        try:
            context_results = retrieve_context(
                data["message"],
                user,
                legal_request=legal_request,
                include_user_docs=True,
                limit=8,
            )
        except EmbeddingUnavailableError:
            context_results = []

        context, citations = format_context(context_results)
        prompt = build_prompt(
            task="draft",
            language=response_language,
            message=f"Type de document: {data['document_type']}\n{data['message']}",
            context=context,
        )

        try:
            raw_content = generate_with_gemini(prompt)
        except GeminiError as exc:
            logger.error("Gemini unavailable during draft: %s", exc)
            raise AIServiceError(
                "La generation du document est temporairement indisponible. "
                "Reessayez dans quelques instants."
            ) from exc

        # CORRECTION ⑥ : sanitiser la réponse du draft aussi
        content = _sanitize_llm_response(raw_content)

        draft = DraftDocument.objects.create(
            user=user,
            legal_request=legal_request,
            document_type=data["document_type"],
            title=data["document_type"],
            content=content,
            output_format=data["output_format"],
            citations=citations,
        )
        attach_draft_file(draft)
        return draft


def _get_legal_request(user, legal_request_id):
    if not legal_request_id:
        return None
    try:
        from legal_path.models import LegalRequest
        return LegalRequest.objects.filter(id=legal_request_id, user=user).first()
    except Exception:
        return None


def _get_or_create_session(user, data, legal_request):
    session_id = data.get("session_id")
    if session_id:
        # CORRECTION ② : filtrage strict user=user déjà présent — OK
        session = ChatSession.objects.filter(id=session_id, user=user).first()
        if session:
            return session
    return ChatSession.objects.create(
        user=user,
        legal_request=legal_request,
        task=data["task"],
        language=data["language"],
        title=data["message"][:80],
    )


def _build_retrieval_query(message, session, context_turns=2):
    recent = list(session.messages.order_by("-created_at")[:context_turns * 2])
    recent.reverse()
    parts = [m.content[:200] for m in recent if m.role == "user"]
    parts.append(message)
    return " ".join(parts)


def _format_history(session, limit=8):
    messages = list(session.messages.order_by("-created_at")[:limit])
    messages.reverse()
    lines = []
    for message in messages:
        role = {
            "user": "Utilisateur",
            "assistant": "JusticePath AI",
            "system": "Systeme",
        }.get(message.role, message.role)
        content = (
            message.content[:500] + "..."
            if len(message.content) > 500
            else message.content
        )
        lines.append(f"[{role}] {content}")
    return "\n\n".join(lines)