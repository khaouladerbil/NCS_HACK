from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LegalRequestViewSet,
    AIAnalysisViewSet,
    RoadmapStepViewSet,
    RequiredDocumentViewSet,
    RecommendationViewSet,
    TimelineEventViewSet,
    lawyer_map_view,
)

router = DefaultRouter()
router.register(r"requests", LegalRequestViewSet, basename="legal-request")

nested_router = DefaultRouter()
nested_router.register(r"analysis", AIAnalysisViewSet, basename="analysis")
nested_router.register(r"roadmap-steps", RoadmapStepViewSet, basename="roadmap-step")
nested_router.register(r"documents", RequiredDocumentViewSet, basename="required-document")
nested_router.register(r"recommendations", RecommendationViewSet, basename="recommendation")
nested_router.register(r"timeline", TimelineEventViewSet, basename="timeline-event")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "requests/<int:legal_request_pk>/",
        include(nested_router.urls),
    ),
    path("map/<int:request_id>/", lawyer_map_view, name="lawyer-map"),
]
