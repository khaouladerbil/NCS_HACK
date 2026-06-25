from rest_framework import serializers
from .models import LegalRequest


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