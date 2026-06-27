import logging

from rest_framework import serializers, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AssistantDocument,
    ChatSession,
    DocumentTemplate,
    DraftDocument,
    LawyerProfile,
    LegalDocument,
    LegalSource,
)
from .services.chat_service import AIServiceError, ChatService
from .services.lawyer_recommender import recommend_lawyers
from .services.text_extraction import extract_text_from_file

logger = logging.getLogger(__name__)


# ── Serializers ────────────────────────────────────────────────────────────────

class LegalSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalSource
        fields = "__all__"


class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ["id", "title", "task", "language", "created_at", "updated_at"]


class AssistantDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantDocument
        fields = ["id", "title", "document_type", "file", "created_at"]


class DraftDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DraftDocument
        fields = ["id", "document_type", "title", "content", "output_format", "citations", "created_at"]


class LawyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LawyerProfile
        fields = ["id", "full_name", "specialties", "wilaya", "commune", "languages", "phone", "email", "is_available"]


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = "__all__"


class LegalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalDocument
        fields = ["id", "title", "document_type", "content", "language", "status", "created_at", "updated_at"]


# ── ViewSets ───────────────────────────────────────────────────────────────────

class LegalSourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LegalSource.objects.all()
    serializer_class = LegalSourceSerializer
    permission_classes = [IsAuthenticated]


class ChatSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


LEGAL_KEYWORDS = [
    # français
    "article", "loi", "code", "tribunal", "jugement", "ordonnance", "contrat",
    "acte", "notaire", "avocat", "juridique", "droit", "justice", "procedure",
    "requete", "plainte", "divorce", "heritage", "succession", "bail", "travail",
    "salaire", "licenciement", "garde", "pension", "certificat", "attestation",
    "declaration", "recours", "appel", "cassation", "wilaya", "daira", "commune",
    # arabe
    "المحكمة", "القانون", "العقد", "الطلاق", "الميراث", "الحكم", "الدعوى",
    "المحامي", "القاضي", "الإجراء", "الحقوق", "التشريع", "الوثيقة",
    # anglais courant
    "law", "court", "legal", "contract", "judgment", "divorce", "rights",
]


def _is_legal_document(text: str) -> bool:
    if not text or len(text.strip()) < 30:
        return False
    text_lower = text.lower()
    hits = sum(1 for kw in LEGAL_KEYWORDS if kw in text_lower)
    return hits >= 2


class AssistantDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = AssistantDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return AssistantDocument.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "Fichier requis."}, status=status.HTTP_400_BAD_REQUEST)

        extracted = ""
        try:
            extracted = extract_text_from_file(file)
        except Exception:
            pass

        if not _is_legal_document(extracted):
            return Response(
                {"error": "Ce document ne semble pas être un document juridique. Veuillez envoyer un contrat, jugement, acte, ou tout autre document légal."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, extracted_text=extracted)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LawyerProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LawyerProfile.objects.filter(is_available=True)
    serializer_class = LawyerProfileSerializer
    permission_classes = [IsAuthenticated]


class DocumentTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentTemplate.objects.filter(is_active=True)
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]


class LegalDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = LegalDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LegalDocument.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ── API Views ──────────────────────────────────────────────────────────────────

class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        if not data.get("message"):
            return Response({"error": "message requis"}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "message": data["message"],
            "session_id": data.get("session_id"),
            "language": data.get("language", "fr"),
            "task": data.get("task", "qa"),
            "legal_request_id": data.get("legal_request_id"),
        }

        try:
            result = ChatService.process_message(request.user, payload)
            return Response({
                "answer": result["answer"],
                "session_id": result["session_id"],
                "citations": result.get("citations", []),
            })
        except AIServiceError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.exception("Unexpected error in ChatAPIView: %s", exc)
            return Response({"error": "Erreur interne du serveur"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DraftAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        if not data.get("message") or not data.get("document_type"):
            return Response({"error": "message et document_type requis"}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "message": data["message"],
            "document_type": data["document_type"],
            "language": data.get("language", "fr"),
            "task": "draft",
            "output_format": data.get("output_format", "text"),
            "legal_request_id": data.get("legal_request_id"),
        }

        try:
            draft = ChatService.process_draft(request.user, payload)
            return Response(DraftDocumentSerializer(draft).data, status=status.HTTP_201_CREATED)
        except AIServiceError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.exception("Unexpected error in DraftAPIView: %s", exc)
            return Response({"error": "Erreur interne du serveur"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DraftDocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        drafts = DraftDocument.objects.filter(user=request.user)
        return Response(DraftDocumentSerializer(drafts, many=True).data)


class GenerateLegalDocumentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        if not data.get("document_type") or not data.get("situation"):
            return Response({"error": "document_type et situation requis"}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "message": data["situation"],
            "document_type": data["document_type"],
            "language": data.get("language", "fr"),
            "task": "draft",
            "output_format": data.get("output_format", "text"),
        }

        try:
            draft = ChatService.process_draft(request.user, payload)
            return Response(DraftDocumentSerializer(draft).data, status=status.HTTP_201_CREATED)
        except AIServiceError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.exception("Unexpected error in GenerateLegalDocumentAPIView: %s", exc)
            return Response({"error": "Erreur interne du serveur"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


QUIZ_TOPICS = [
    "divorce et séparation", "droit du travail et licenciement",
    "héritage et succession", "bail et location", "droit pénal",
    "droits du consommateur", "droit commercial", "procédures administratives",
    "droit de la famille", "Code civil algérien",
]

QUIZ_PROMPT = """Tu es un professeur de droit algérien. Génère exactement 5 questions QCM sur le droit algérien (sujet: {topic}).

Format JSON strict (sans markdown, sans ```json):
{{
  "topic": "{topic}",
  "questions": [
    {{
      "id": 1,
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "explanation": "Explication courte (1-2 phrases)."
    }}
  ]
}}

Règles:
- Questions basées sur le vrai droit algérien (Code de la famille, Code du travail, Code civil, etc.)
- correct = index 0-3 de la bonne réponse dans options
- Niveau: citoyen ordinaire, pas juriste
- Langue: français
"""


class QuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import json, random
        from .services.gemini_client import GeminiError, generate_with_gemini

        topic = request.data.get("topic") or random.choice(QUIZ_TOPICS)
        prompt = QUIZ_PROMPT.format(topic=topic)

        try:
            raw = generate_with_gemini(prompt)
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw)
            return Response(data)
        except (GeminiError, json.JSONDecodeError) as exc:
            logger.error("Quiz generation failed: %s", exc)
            return Response({"error": "Impossible de générer le quiz."}, status=503)
        except Exception as exc:
            logger.exception("Unexpected error in QuizAPIView: %s", exc)
            return Response({"error": "Erreur interne."}, status=500)


class GenerateLegalTextAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .services.gemini_client import GeminiError
        from .services.legal_generator import generate_legal_text

        prompt = (request.data.get("prompt") or "").strip()
        if not prompt:
            return Response({"error": "Décrivez le document souhaité."}, status=status.HTTP_400_BAD_REQUEST)

        language = request.data.get("language", "fr")

        # Contexte RAG (best-effort, non bloquant)
        context = ""
        try:
            from .services.retrieval import format_context, retrieve_context
            results = retrieve_context(prompt, request.user, include_user_docs=True, limit=6)
            context, _ = format_context(results)
        except Exception:
            context = ""

        try:
            content = generate_legal_text(prompt, language=language, context=context)
        except GeminiError:
            return Response(
                {"error": "La génération est temporairement indisponible."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.exception("Legal text generation failed: %s", exc)
            return Response({"error": "Erreur lors de la génération."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not content:
            return Response({"error": "Le document généré est vide."}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"content": content})


class DocumentAnalysisAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        from .services.document_analysis import analyze_document
        from .services.gemini_client import GeminiError

        extracted = ""
        document = None

        # Cas 1: document déjà uploadé (document_id)
        document_id = request.data.get("document_id")
        if document_id:
            document = AssistantDocument.objects.filter(id=document_id, user=request.user).first()
            if document is None:
                return Response({"error": "Document introuvable."}, status=status.HTTP_404_NOT_FOUND)
            extracted = document.extracted_text or ""
            if not extracted:
                try:
                    extracted = extract_text_from_file(document.file)
                except Exception:
                    extracted = ""

        # Cas 2: fichier envoyé directement
        elif request.FILES.get("file"):
            file = request.FILES["file"]
            try:
                extracted = extract_text_from_file(file)
            except Exception:
                extracted = ""
        else:
            return Response({"error": "document_id ou file requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            analysis = analyze_document(extracted)
        except GeminiError:
            return Response(
                {"error": "L'analyse IA est temporairement indisponible."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.exception("Document analysis failed: %s", exc)
            return Response({"error": "Erreur lors de l'analyse."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if document is not None:
            meta = document.metadata or {}
            meta["analysis"] = analysis
            document.metadata = meta
            document.save(update_fields=["metadata"])

        return Response({"analysis": analysis})


class LawyerRecommendationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get("query", "")
        wilaya = request.data.get("wilaya")
        try:
            lawyers = recommend_lawyers(query, wilaya=wilaya)
            return Response({"lawyers": LawyerProfileSerializer(lawyers, many=True).data})
        except Exception as exc:
            logger.exception("Error in LawyerRecommendationAPIView: %s", exc)
            return Response({"lawyers": []})
