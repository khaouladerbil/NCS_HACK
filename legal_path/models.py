from django.db import models

# Create your models here.
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
        User,
        on_delete=models.CASCADE,
        related_name="legal_requests"
    )

    title = models.CharField(max_length=255)

    description = models.TextField()

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="other"
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="draft"
    )

    ai_summary = models.TextField(
        blank=True
    )

    ai_confidence = models.FloatField(
        default=0
    )

    risk_level = models.CharField(
        max_length=30,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title