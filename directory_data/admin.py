from django.contrib import admin

from .models import Address, LawyerProfile


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("id", "city", "state", "latitude", "longitude")


@admin.register(LawyerProfile)
class LawyerProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "first_name", "last_name", "rating", "approved")
    list_filter = ("approved",)
    search_fields = ("specialization", "first_name", "last_name")
