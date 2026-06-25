from django.contrib import admin
from django.contrib import admin
from .models import LegalRequest


@admin.register(LegalRequest)
class LegalRequestAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "title",
        "user",
        "category",
        "status",
        "created_at",
    )

    search_fields = (
        "title",
        "description",
        "user__email",
    )

    list_filter = (
        "status",
        "category",
    )
# Register your models here.
