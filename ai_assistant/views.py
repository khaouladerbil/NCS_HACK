import logging

from django.conf import settings
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .models import (
    AssistantDocument,
    ChatSession,
    DraftDocument,
    LawyerProfile,
    LegalSource,
)
from .serializers import (
    AssistantDocumentSerializer,
    ChatRequestSerializer,
    ChatSessionSerializer,
    DraftDocumentSerializer,
    DraftRequestSerializer,
    LawyerProfileSerializer,
    LawyerRecommendationRequestSerializer,
    LegalSourceSerializer,
)
from .services.dataset_loader import load_legal_dataset
from .services.documents import index_assistant_document
from .services.chat_service import AIServiceError, ChatService
from .services.lawyer_recommender import recommend_lawyers

logger = logging.getLogger(__name__)


# ── Throttles personnalisés ────────────────────────────────────────────────────

class ChatThrottle(UserRateThrottle):
    """CORRECTION ① : max 20 messages/heure par utilisateur."""
    scope = "chat"


class DraftThrottle(UserRateThrottle):
    """CORRECTION ① : max 5 drafts/heure par utilisateur."""
    scope = "draft"


class UploadThrottle(UserRateThrottle):
    """CORRECTION ① : max 10 uploads/heure par utilisateur."""
    scope = "upload"


# ── Sources juridiques ─────────────────────────────────────────────────────────

class LegalSourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LegalSource.objects.all()
    serializer_class = LegalSourceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], permission_classes=[IsAdminUser])
    def import_dataset(self, request):
        try:
            imported = load_legal_dataset()
            return Response({"imported_chunks": imported})
        except Exception as exc:
            logger.error("Dataset import failed: %s", exc)
            return Response(
                {"error": "Erreur lors de l'import du dataset."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Documents utilisateur ──────────────────────────────────────────────────────

class AssistantDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = AssistantDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    throttle_classes = [UploadThrottle]

    def get_queryset(self):
        return AssistantDocument.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # CORRECTION ⑦ : validation taille fichier avant traitement
        file = self.request.FILES.get("file")
        max_bytes = getattr(settings, "MAX_UPLOAD_SIZE_MB", 10) * 1024 * 1024
        if file and file.size > max_bytes:
            raise ValidationError(
                f"Fichier trop volumineux. Maximum autorisé : "
                f"{getattr(settings, 'MAX_UPLOAD_SIZE_MB', 10)} Mo."
            )

        document = serializer.save(user=self.request.user)
        try:
            index_assistant_document(document)
        except Exception as exc:
            logger.error("Document indexing failed for document %s: %s", document.id, exc)

    @action(detail=True, methods=["post"])
    def reindex(self, request, pk=None):
        document = self.get_object()
        try:
            chunks = index_assistant_document(document)
            return Response({"indexed_chunks": chunks})
        except Exception as exc:
            logger.error("Document reindex failed for document %s: %s", document.id, exc)
            return Response(
                {"error": "La reindexation a echoue."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Sessions de chat ───────────────────────────────────────────────────────────

class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).prefetch_related("messages")

    def perform_create(self, serializer):
        # CORRECTION ② : vérifier que la LegalRequest appartient bien à l'utilisateur
        legal_request_id = self.request.data.get("legal_request")
        if legal_request_id:
            from legal_path.models import LegalRequest
            from rest_framework.exceptions import PermissionDenied
            if not LegalRequest.objects.filter(
                id=legal_request_id, user=self.request.user
            ).exists():
                raise PermissionDenied(
                    "LegalRequest introuvable ou accès non autorisé."
                )
        serializer.save(user=self.request.user)


# ── Chat ───────────────────────────────────────────────────────────────────────

class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]
    # CORRECTION ① : rate limiting spécifique au chat
    throttle_classes = [ChatThrottle]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            return Response(
                ChatService.process_message(request.user, serializer.validated_data)
            )
        except AIServiceError as exc:
            return Response(
                {"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as exc:
            logger.exception("Unexpected ChatAPIView error: %s", exc)
            return Response(
                {"error": "Une erreur inattendue s'est produite. Veuillez reessayer."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Draft ──────────────────────────────────────────────────────────────────────

class DraftAPIView(APIView):
    permission_classes = [IsAuthenticated]
    # CORRECTION ① : rate limiting plus strict pour les drafts (appels Gemini coûteux)
    throttle_classes = [DraftThrottle]

    def post(self, request):
        serializer = DraftRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            draft = ChatService.process_draft(request.user, serializer.validated_data)
            return Response(
                DraftDocumentSerializer(draft).data, status=status.HTTP_201_CREATED
            )
        except AIServiceError as exc:
            return Response(
                {"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as exc:
            logger.exception("Unexpected DraftAPIView error: %s", exc)
            return Response(
                {"error": "Une erreur inattendue s'est produite. Veuillez reessayer."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Recommandation avocat ──────────────────────────────────────────────────────

class LawyerRecommendationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LawyerRecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        specialty, lawyers = recommend_lawyers(
            data["message"],
            wilaya=data.get("wilaya", ""),
            language=data["language"],
        )
        return Response(
            {
                "specialty": specialty,
                "lawyers": LawyerProfileSerializer(lawyers, many=True).data,
            }
        )


class LawyerProfileViewSet(viewsets.ModelViewSet):
    queryset = LawyerProfile.objects.all()
    serializer_class = LawyerProfileSerializer
    permission_classes = [IsAuthenticated]


class DraftDocumentListView(generics.ListAPIView):
    serializer_class = DraftDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DraftDocument.objects.filter(user=self.request.user)