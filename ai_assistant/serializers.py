from rest_framework import serializers

from .models import (
    AssistantDocument,
    ChatMessage,
    ChatSession,
    DraftDocument,
    LawyerProfile,
    LegalChunk,
    LegalSource,
)


class LegalSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalSource
        fields = "__all__"


class LegalChunkSerializer(serializers.ModelSerializer):
    source_title = serializers.CharField(source="source.title", read_only=True)

    class Meta:
        model = LegalChunk
        fields = (
            "id",
            "source",
            "source_title",
            "chunk_index",
            "text",
            "article",
            "section",
            "metadata",
            "created_at",
        )
        read_only_fields = ("created_at",)


class AssistantDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantDocument
        fields = "__all__"
        read_only_fields = (
            "user",
            "extracted_text",
            "metadata",
            "created_at",
            "updated_at",
        )


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = "__all__"
        read_only_fields = ("session", "citations", "metadata", "created_at")


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = "__all__"
        read_only_fields = ("user", "created_at", "updated_at")


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    session_id = serializers.IntegerField(required=False)
    legal_request_id = serializers.IntegerField(required=False)
    task = serializers.ChoiceField(
        choices=["qa", "explain", "analyze", "draft", "lawyer"],
        default="qa",
        required=False,
    )
    language = serializers.ChoiceField(
        choices=["fr", "ar", "en"],
        default="fr",
        required=False,
    )


class DraftRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    document_type = serializers.CharField()
    legal_request_id = serializers.IntegerField(required=False)
    language = serializers.ChoiceField(choices=["fr", "ar", "en"], default="fr")
    output_format = serializers.ChoiceField(
        choices=["text", "pdf", "docx"], default="text"
    )


class DraftDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DraftDocument
        fields = "__all__"
        read_only_fields = ("user", "content", "file", "citations", "created_at")


class LawyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LawyerProfile
        fields = "__all__"


class LawyerRecommendationRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    legal_request_id = serializers.IntegerField(required=False)
    wilaya = serializers.CharField(required=False, allow_blank=True)
    language = serializers.ChoiceField(choices=["fr", "ar", "en"], default="fr")
