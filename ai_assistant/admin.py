from django.contrib import admin

from .models import (
    AssistantDocument,
    AssistantDocumentChunk,
    ChatMessage,
    ChatSession,
    DocumentTemplate,
    DraftDocument,
    LawyerProfile,
    LegalDocument,
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
admin.site.register(DocumentTemplate)
admin.site.register(LegalDocument)
admin.site.register(LawyerProfile)
