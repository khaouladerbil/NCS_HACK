from django.db import models
from users.models import User


class LegalRequest(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("analyzed", "Analyzed"),
        ("waiting_documents", "Waiting Documents"),
        ("ready", "Ready"),
        ("resolved", "Resolved"),
    ]

    CATEGORY_CHOICES = [
        ("labor", "Labor Law"),
        ("family", "Family Law"),
        ("civil", "Civil Law"),
        ("criminal", "Criminal Law"),
        ("property", "Property Law"),
        ("commercial", "Commercial Law"),
        ("administrative", "Administrative Law"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="legal_requests"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=30, choices=CATEGORY_CHOICES, default="other"
    )
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default="draft"
    )
    ai_summary = models.TextField(blank=True)
    ai_confidence = models.FloatField(default=0)
    risk_level = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class AIAnalysis(models.Model):
    legal_request = models.OneToOneField(
        LegalRequest, on_delete=models.CASCADE, related_name="ai_analysis"
    )
    summary = models.TextField()
    risk_level = models.CharField(max_length=30, blank=True)
    confidence = models.FloatField(default=0)
    relevant_laws = models.JSONField(default=list, blank=True)
    suggested_actions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "AI analyses"

    def __str__(self):
        return f"Analysis for {self.legal_request}"


class RoadmapStep(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("skipped", "Skipped"),
    ]

    legal_request = models.ForeignKey(
        LegalRequest, on_delete=models.CASCADE, related_name="roadmap_steps"
    )
    order = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default="pending"
    )
    estimated_days = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.order}. {self.title}"


class RequiredDocument(models.Model):
    legal_request = models.ForeignKey(
        LegalRequest, on_delete=models.CASCADE, related_name="required_documents"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_uploaded = models.BooleanField(default=False)
    uploaded_file = models.FileField(upload_to="legal_docs/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Recommendation(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    legal_request = models.ForeignKey(
        LegalRequest, on_delete=models.CASCADE, related_name="recommendations"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="medium"
    )
    is_actioned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-priority", "created_at"]

    def __str__(self):
        return self.title


class TimelineEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ("created", "Case Created"),
        ("analyzed", "Case Analyzed"),
        ("document_uploaded", "Document Uploaded"),
        ("step_completed", "Step Completed"),
        ("recommendation_added", "Recommendation Added"),
        ("status_change", "Status Change"),
        ("note", "Note"),
    ]

    legal_request = models.ForeignKey(
        LegalRequest, on_delete=models.CASCADE, related_name="timeline_events"
    )
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_event_type_display()}: {self.title}"
