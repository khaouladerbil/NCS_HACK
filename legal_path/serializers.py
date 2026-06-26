from rest_framework import serializers
from .models import (
    LegalRequest,
    AIAnalysis,
    RoadmapStep,
    RequiredDocument,
    Recommendation,
    TimelineEvent,
)


class LegalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalRequest
        fields = "__all__"
        read_only_fields = (
            "user",
            "created_at",
            "updated_at",
            "ai_summary",
            "ai_confidence",
            "risk_level",
        )


class AIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysis
        fields = "__all__"
        read_only_fields = ("legal_request", "created_at", "updated_at")


class RoadmapStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapStep
        fields = "__all__"
        read_only_fields = ("legal_request", "created_at")


class RequiredDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocument
        fields = "__all__"
        read_only_fields = ("legal_request", "created_at")


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = "__all__"
        read_only_fields = ("legal_request", "created_at")


class TimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvent
        fields = "__all__"
        read_only_fields = ("legal_request", "created_at")
