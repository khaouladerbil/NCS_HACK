from django.contrib import admin

from .models import (
    AssistantDocument,
    AssistantDocumentChunk,
    ChatMessage,
    ChatSession,
    DraftDocument,
    LawyerProfile,
    LegalChunk,
    LegalSource,
)

admin.site.register(LegalSource)
admin.site.register(LegalChunk)
admin.site.register(AssistantDocument)
admin.site.register(AssistantDocumentChunk)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
admin.site.register(DraftDocument)
admin.site.register(LawyerProfile)
