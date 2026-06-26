from rest_framework import serializers
from .models import DocumentTemplate, LegalDocument, DocumentVersion


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = "__all__"
        read_only_fields = ("created_at",)


class DocumentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVersion
        fields = "__all__"
        read_only_fields = ("document", "version", "created_at")


class LegalDocumentSerializer(serializers.ModelSerializer):
    versions = DocumentVersionSerializer(many=True, read_only=True)
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = LegalDocument
        fields = "__all__"
        read_only_fields = ("user", "created_at", "updated_at")


class LegalDocumentGenerateSerializer(serializers.Serializer):
    input_text = serializers.CharField()
