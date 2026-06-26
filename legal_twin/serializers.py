from rest_framework import serializers
from .models import (
    CitizenProfile,
    CitizenDocument,
    CitizenCase,
    LegalDeadline
)


class CitizenProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = CitizenProfile
        fields = "__all__"
        read_only_fields = ["user"]


class CitizenDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = CitizenDocument
        fields = "__all__"
        read_only_fields = ["profile"]


class CitizenCaseSerializer(serializers.ModelSerializer):

    class Meta:
        model = CitizenCase
        fields = "__all__"
        read_only_fields = ["profile"]


class LegalDeadlineSerializer(serializers.ModelSerializer):

    class Meta:
        model = LegalDeadline
        fields = "__all__"
        read_only_fields = ["profile"]