from django.contrib import admin
from .models import DocumentTemplate, LegalDocument, DocumentVersion


@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "is_active", "created_at")
    list_filter = ("is_active", "category")
    search_fields = ("name", "description")


@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "template", "status", "language", "created_at")
    list_filter = ("status", "language")
    search_fields = ("title", "content")
    readonly_fields = ("user",)


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "document", "version", "created_at")
