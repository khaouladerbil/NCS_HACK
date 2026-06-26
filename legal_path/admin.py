from django.contrib import admin
from .models import (
    LegalRequest,
    AIAnalysis,
    RoadmapStep,
    RequiredDocument,
    Recommendation,
    TimelineEvent,
)


@admin.register(LegalRequest)
class LegalRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "category", "status", "created_at")
    search_fields = ("title", "description", "user__email")
    list_filter = ("status", "category")


@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    list_display = ("id", "legal_request", "risk_level", "confidence", "created_at")


@admin.register(RoadmapStep)
class RoadmapStepAdmin(admin.ModelAdmin):
    list_display = ("id", "legal_request", "order", "title", "status")
    list_filter = ("status",)


@admin.register(RequiredDocument)
class RequiredDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "legal_request", "name", "is_uploaded")
    list_filter = ("is_uploaded",)


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ("id", "legal_request", "title", "priority", "is_actioned")
    list_filter = ("priority", "is_actioned")


@admin.register(TimelineEvent)
class TimelineEventAdmin(admin.ModelAdmin):
    list_display = ("id", "legal_request", "event_type", "title", "created_at")
    list_filter = ("event_type",)
