from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import (
    LegalRequest,
    AIAnalysis,
    RoadmapStep,
    RequiredDocument,
    Recommendation,
    TimelineEvent,
)
from .serializers import (
    LegalRequestSerializer,
    AIAnalysisSerializer,
    RoadmapStepSerializer,
    RequiredDocumentSerializer,
    RecommendationSerializer,
    TimelineEventSerializer,
)
from .permissions import IsOwner


class LegalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LegalRequestSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return LegalRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NestedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwner]
    parent_model = LegalRequest
    parent_field = "legal_request"

    def get_queryset(self):
        return self.queryset.filter(
            **{
                f"{self.parent_field}_id": self.kwargs["legal_request_pk"],
                f"{self.parent_field}__user": self.request.user,
            }
        )

    def perform_create(self, serializer):
        serializer.save(
            **{
                f"{self.parent_field}_id": self.kwargs["legal_request_pk"],
            }
        )


class AIAnalysisViewSet(NestedViewSet):
    serializer_class = AIAnalysisSerializer
    queryset = AIAnalysis.objects.all()


class RoadmapStepViewSet(NestedViewSet):
    serializer_class = RoadmapStepSerializer
    queryset = RoadmapStep.objects.all()


class RequiredDocumentViewSet(NestedViewSet):
    serializer_class = RequiredDocumentSerializer
    queryset = RequiredDocument.objects.all()


class RecommendationViewSet(NestedViewSet):
    serializer_class = RecommendationSerializer
    queryset = Recommendation.objects.all()


class TimelineEventViewSet(NestedViewSet):
    serializer_class = TimelineEventSerializer
    queryset = TimelineEvent.objects.all()
