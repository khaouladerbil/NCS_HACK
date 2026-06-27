from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AssistantDocumentViewSet,
    ChatAPIView,
    ChatSessionViewSet,
    DocumentTemplateViewSet,
    DocumentAnalysisAPIView,
    DraftAPIView,
    DraftDocumentListView,
    GenerateLegalDocumentAPIView,
    GenerateLegalTextAPIView,
    LegalDocumentViewSet,
    LawyerProfileViewSet,
    LawyerRecommendationAPIView,
    LegalSourceViewSet,
    QuizAPIView,
)

router = DefaultRouter()
router.register(r"sources", LegalSourceViewSet, basename="assistant-source")
router.register(r"documents", AssistantDocumentViewSet, basename="assistant-document")
router.register(r"sessions", ChatSessionViewSet, basename="assistant-session")
router.register(r"lawyers", LawyerProfileViewSet, basename="assistant-lawyer")
router.register(r"templates", DocumentTemplateViewSet, basename="document-template")
router.register(r"legal-documents", LegalDocumentViewSet, basename="legal-document")

urlpatterns = [
    path("", include(router.urls)),
    path("chat/", ChatAPIView.as_view(), name="assistant-chat"),
    path("generate-document/", GenerateLegalDocumentAPIView.as_view(), name="generate-legal-document"),
    path("draft/", DraftAPIView.as_view(), name="assistant-draft"),
    path("drafts/", DraftDocumentListView.as_view(), name="assistant-drafts"),
    path("generate-legal-text/", GenerateLegalTextAPIView.as_view(), name="generate-legal-text"),
    path("analyze-document/", DocumentAnalysisAPIView.as_view(), name="analyze-document"),
    path("recommend-lawyer/", LawyerRecommendationAPIView.as_view(), name="recommend-lawyer"),
    path("quiz/", QuizAPIView.as_view(), name="assistant-quiz"),
]
