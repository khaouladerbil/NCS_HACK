from django.contrib import admin
from .models import CitizenProfile, CitizenDocument, CitizenCase, LegalDeadline


@admin.register(CitizenProfile)
class CitizenProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "sex", "wilaya", "created_at")
    search_fields = ("full_name", "user__email")


@admin.register(CitizenDocument)
class CitizenDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "document_type", "folder_name", "uploaded_at")
    list_filter = ("document_type",)


@admin.register(CitizenCase)
class CitizenCaseAdmin(admin.ModelAdmin):
    list_display = ("id", "case_number", "title", "status", "created_at")
    list_filter = ("status",)


@admin.register(LegalDeadline)
class LegalDeadlineAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "due_date", "is_completed")
    list_filter = ("is_completed",)
