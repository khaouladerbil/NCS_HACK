from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AssistantDocumentViewSet,
    ChatAPIView,
    ChatSessionViewSet,
    DraftAPIView,
    DraftDocumentListView,
    LawyerProfileViewSet,
    LawyerRecommendationAPIView,
    LegalSourceViewSet,
)

router = DefaultRouter()
router.register(r"sources", LegalSourceViewSet, basename="assistant-source")
router.register(r"documents", AssistantDocumentViewSet, basename="assistant-document")
router.register(r"sessions", ChatSessionViewSet, basename="assistant-session")
router.register(r"lawyers", LawyerProfileViewSet, basename="assistant-lawyer")

urlpatterns = [
    path("", include(router.urls)),
    path("chat/", ChatAPIView.as_view(), name="assistant-chat"),
    path("draft/", DraftAPIView.as_view(), name="assistant-draft"),
    path("drafts/", DraftDocumentListView.as_view(), name="assistant-drafts"),
    path("recommend-lawyer/", LawyerRecommendationAPIView.as_view(), name="recommend-lawyer"),
]
